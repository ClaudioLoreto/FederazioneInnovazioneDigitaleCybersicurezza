// =============================================================================
//  FIDC.Api » Program.cs
//  Composition root dell'applicazione. Qui si decide a RUNTIME quale provider
//  database usare (SQL Server in produzione, PostgreSQL in dev/test) leggendo
//  "Database:Provider" da appsettings, e si registrano tutti i servizi (DI).
// =============================================================================

using System.Text;
using FIDC.Api.Services;
using FIDC.Bll.Auth;
using FIDC.Bll.Email;
using FIDC.Dal;
using FIDC.Dal.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------------
// 1) DATABASE MULTI-PROVIDER
//    Lo stesso DbContext/migration funziona su tutti i provider. La scelta dipende
//    dal valore "Database:Provider" ("Sqlite" | "SqlServer" | "Postgres") e dalla
//    relativa connection string.
//      - DEV locale  → SQLite (file .db, NESSUN Docker richiesto): a prova di errore.
//      - PRODUZIONE  → SQL Server 2019.
//      - DEMO/Railway → PostgreSQL (opzionale).
// -----------------------------------------------------------------------------
var provider = builder.Configuration["Database:Provider"] ?? "Sqlite";
var connString = builder.Configuration.GetConnectionString(provider)
                 ?? throw new InvalidOperationException(
                     $"Connection string per il provider '{provider}' non trovata.");

builder.Services.AddDbContext<FidcDbContext>(opt =>
{
    if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        // PRODUZIONE: Windows Server 2019 + SQL Server 2019 (SSMS)
        opt.UseSqlServer(connString, o => o.MigrationsAssembly("FIDC.Dal"));
    else if (provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
        // DEMO/Railway: PostgreSQL (Docker o cloud)
        opt.UseNpgsql(connString, o => o.MigrationsAssembly("FIDC.Dal"));
    else
        // DEV LOCALE (default): SQLite su file, nessuna dipendenza esterna.
        opt.UseSqlite(connString, o => o.MigrationsAssembly("FIDC.Dal"));
});

// -----------------------------------------------------------------------------
// 2) REGISTRAZIONE SERVIZI (Dependency Injection) — architettura a domini
// -----------------------------------------------------------------------------
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();

// Opzioni Resend bindate dalla sezione "Resend"
builder.Services.Configure<ResendOptions>(builder.Configuration.GetSection(ResendOptions.SectionName));
// HttpClient tipizzato per Resend (base address + retry impostabili qui)
builder.Services.AddHttpClient<IEmailService, ResendEmailService>();

// -----------------------------------------------------------------------------
// 3) AUTENTICAZIONE JWT + AUTORIZZAZIONE RBAC (SuperUser / Relatore)
// -----------------------------------------------------------------------------
var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!))
        };
    });
builder.Services.AddAuthorization();

// -----------------------------------------------------------------------------
// 4) CORS per il frontend Angular (dev su http://localhost:4200)
//    Policy pienamente aperta verso l'origine del frontend di sviluppo.
// -----------------------------------------------------------------------------
const string CorsPolicy = "FrontendAngular";
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p => p
    .WithOrigins("http://localhost:4200", "https://localhost:4200")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// Serializza gli enum come STRINGHE (es. "SuperUser", "Attivita", "Pubblico"):
// indispensabile perché il client confronta i ruoli/pilastri per nome.
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

// -----------------------------------------------------------------------------
// 4-bis) SWAGGER / OpenAPI — documentazione completa + autenticazione JWT
//        Permette di provare gli endpoint protetti direttamente da Swagger UI:
//        si incolla il token nel pulsante "Authorize" (schema Bearer).
// -----------------------------------------------------------------------------
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FIDC API",
        Version = "v1",
        Description =
            "API della Federazione Innovazione, Digitale e Cybersicurezza (FIDC).\n\n" +
            "Autenticazione: JWT Bearer. Effettua il login su `POST /api/auth/login`, " +
            "copia il `token` e incollalo nel pulsante **Authorize** (senza prefisso 'Bearer').\n\n" +
            "RBAC: `SuperUser` (controllo totale) · `Relatore` (solo contenuti propri).",
        Contact = new OpenApiContact { Name = "FIDC – Direzione", Email = "direzione@fidc.it" }
    });

    // Schema di sicurezza Bearer per il pulsante "Authorize".
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Inserisci il token JWT ottenuto dal login. Esempio: «eyJhbGciOi…»",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { [jwtScheme] = Array.Empty<string>() });

    // Includi i commenti XML (/// ) di tutti gli assembly che li generano.
    foreach (var xml in Directory.GetFiles(AppContext.BaseDirectory, "*.xml"))
        c.IncludeXmlComments(xml, includeControllerXmlComments: true);
});

var app = builder.Build();

// -----------------------------------------------------------------------------
// 5) MIGRAZIONE AUTOMATICA + SEED in dev (comodo con Docker/Railway al primo avvio)
// -----------------------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<FidcDbContext>();

    // SQLite (dev locale): lo schema viene creato direttamente dal modello con
    // EnsureCreated(), così NON servono migration provider-specifiche e il demo
    // parte sempre, anche senza Docker. Per SQL Server/Postgres si usano le migration.
    if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    {
        db.Database.EnsureCreated();

        // EnsureCreated non aggiorna un database già esistente. Le colonne
        // aggiunte dopo la creazione del file fidc_dev.db vanno quindi aggiunte
        // a mano: se esistono già, SQLite risponde con un errore che ignoriamo.
        try
        {
            db.Database.ExecuteSqlRaw(
                "ALTER TABLE ImpostazioniTema ADD COLUMN EmblemaHero TEXT NOT NULL DEFAULT 'cassaforte'");
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate column", StringComparison.OrdinalIgnoreCase))
        {
            // Colonna già presente: nessuna azione.
        }
    }
    else
        db.Database.Migrate();

    // Al primo avvio: tema e account della Direzione. I dati dimostrativi
    // (eventi, news, documenti di esempio) solo se Seed:DatiDimostrativi = true.
    var datiDimostrativi = app.Configuration.GetValue<bool>("Seed:DatiDimostrativi");
    await FIDC.Dal.Seeding.DataSeeder.SeedAsync(db, datiDimostrativi);
}

// -----------------------------------------------------------------------------
// 6) SWAGGER UI — sempre attivo (root: /swagger). Documenta tutta l'API e
//    consente l'autenticazione JWT per provare gli endpoint protetti.
// -----------------------------------------------------------------------------
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FIDC API v1");
    c.DocumentTitle = "FIDC API — Documentazione";
    c.DefaultModelsExpandDepth(-1); // nasconde i modelli in coda per pulizia
});

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
