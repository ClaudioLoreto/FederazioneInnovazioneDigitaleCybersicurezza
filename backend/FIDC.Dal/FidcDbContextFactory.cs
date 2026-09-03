// =============================================================================
//  FIDC.Dal » FidcDbContextFactory.cs
//  Factory usata SOLO a design-time da "dotnet ef" per generare le migrations.
//  A runtime il contesto viene creato dal container DI in FIDC.Api.
//
//  Sceglie il provider in base alla variabile d'ambiente FIDC_DB_PROVIDER:
//    "Postgres"  → usa Npgsql   (dev/test, default)
//    "SqlServer" → usa SqlServer (produzione)
//  così le migrations possono essere generate per entrambi i database.
// =============================================================================

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FIDC.Dal;

/// <summary>
/// Factory di design-time per i comandi EF Core (Add-Migration / database update).
/// Non viene mai usata a runtime dall'applicazione.
/// </summary>
public class FidcDbContextFactory : IDesignTimeDbContextFactory<FidcDbContext>
{
    /// <summary>
    /// Crea un'istanza del contesto scegliendo il provider in base
    /// alla variabile d'ambiente FIDC_DB_PROVIDER (default: Postgres).
    /// </summary>
    public FidcDbContext CreateDbContext(string[] args)
    {
        var provider = Environment.GetEnvironmentVariable("FIDC_DB_PROVIDER") ?? "Postgres";
        var builder = new DbContextOptionsBuilder<FidcDbContext>();

        if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            // Connection string fittizia per design-time: serve solo la sintassi del provider.
            var cs = Environment.GetEnvironmentVariable("FIDC_DB_CONNECTION")
                     ?? "Server=localhost;Database=FIDC;Trusted_Connection=True;TrustServerCertificate=True;";
            builder.UseSqlServer(cs, o => o.MigrationsAssembly("FIDC.Dal"));
        }
        else
        {
            var cs = Environment.GetEnvironmentVariable("FIDC_DB_CONNECTION")
                     ?? "Host=localhost;Port=5432;Database=fidc_dev;Username=fidc;Password=dev_only_password";
            builder.UseNpgsql(cs, o => o.MigrationsAssembly("FIDC.Dal"));
        }

        return new FidcDbContext(builder.Options);
    }
}
