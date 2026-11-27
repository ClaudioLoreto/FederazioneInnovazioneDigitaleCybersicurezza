// =============================================================================
//  FIDC.Dal » FidcDbContext.cs
//  DbContext centrale. Mappa tutte le entità e configura le relazioni.
//  È PROVIDER-AGNOSTICO: il provider (SQL Server o Postgres) viene scelto
//  in Program.cs tramite DI, quindi lo STESSO modello funziona su entrambi i DB.
// =============================================================================

using FIDC.Models.Entities;
using FIDC.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace FIDC.Dal;

/// <summary>
/// Contesto Entity Framework Core della piattaforma FIDC.
/// Definisce i DbSet e la configurazione Fluent API (PK, FK, indici, filtri).
/// </summary>
public class FidcDbContext : DbContext
{
    /// <summary>
    /// Costruttore standard: le opzioni (incluso il provider DB) sono iniettate
    /// dal container DI in base all'ambiente (vedi Program.cs).
    /// </summary>
    public FidcDbContext(DbContextOptions<FidcDbContext> options) : base(options) { }

    /// <summary>Tabella utenti / account.</summary>
    public DbSet<Utente> Utenti => Set<Utente>();

    /// <summary>Tabella eventi.</summary>
    public DbSet<Evento> Eventi => Set<Evento>();

    /// <summary>Tabella news.</summary>
    public DbSet<News> News => Set<News>();

    /// <summary>Tabella iscrizioni (pivot N:N Utente↔Evento).</summary>
    public DbSet<Iscrizione> Iscrizioni => Set<Iscrizione>();

    /// <summary>Tabella documenti dell'Area Documenti.</summary>
    public DbSet<Documento> Documenti => Set<Documento>();

    /// <summary>Tabella iscritti alla newsletter.</summary>
    public DbSet<IscrizioneNewsletter> IscrizioniNewsletter => Set<IscrizioneNewsletter>();

    /// <summary>Configurazioni del tema/velo del portale (Theme Builder).</summary>
    public DbSet<ImpostazioneTema> ImpostazioniTema => Set<ImpostazioneTema>();

    /// <summary>
    /// Configurazione del modello via Fluent API: chiavi, indici univoci,
    /// vincoli FK con comportamento di delete, filtri globali di soft-delete.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ---- UTENTE ----------------------------------------------------------
        b.Entity<Utente>(e =>
        {
            e.HasKey(u => u.Id);                          // PK Identity
            e.HasIndex(u => u.Email).IsUnique();          // email univoca (username)
            e.Property(u => u.Nome).HasMaxLength(100).IsRequired();
            e.Property(u => u.Cognome).HasMaxLength(100).IsRequired();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            // Enum salvato come stringa → leggibile sia in SSMS che in Postgres
            e.Property(u => u.Ruolo).HasConversion<string>().HasMaxLength(30);
            e.HasQueryFilter(u => !u.IsDeleted);          // soft-delete globale
        });

        // ---- EVENTO ----------------------------------------------------------
        b.Entity<Evento>(e =>
        {
            e.HasKey(ev => ev.Id);
            e.Property(ev => ev.Titolo).HasMaxLength(200).IsRequired();
            e.Property(ev => ev.Pilastro).HasConversion<string>().HasMaxLength(30);
            // FK Relatore → restrict: non si cancella un Relatore con eventi attivi
            e.HasOne(ev => ev.Relatore)
             .WithMany(u => u.EventiGestiti)
             .HasForeignKey(ev => ev.RelatoreId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(ev => !ev.IsDeleted);
        });

        // ---- NEWS ------------------------------------------------------------
        b.Entity<News>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasIndex(n => n.Slug).IsUnique();           // slug univoco per URL
            e.Property(n => n.Titolo).HasMaxLength(200).IsRequired();
            e.Property(n => n.Slug).HasMaxLength(220).IsRequired();
            e.Property(n => n.Pilastro).HasConversion<string>().HasMaxLength(30);
            e.HasOne(n => n.Autore)
             .WithMany(u => u.NewsRedatte)
             .HasForeignKey(n => n.AutoreId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(n => !n.IsDeleted);
        });

        // ---- ISCRIZIONE (pivot) ---------------------------------------------
        b.Entity<Iscrizione>(e =>
        {
            e.HasKey(i => i.Id);
            // Un utente non può iscriversi due volte allo stesso evento
            e.HasIndex(i => new { i.EventoId, i.UtenteId }).IsUnique();
            e.HasOne(i => i.Evento)
             .WithMany(ev => ev.Iscrizioni)
             .HasForeignKey(i => i.EventoId)
             .OnDelete(DeleteBehavior.Cascade);           // cancellando l'evento, via le iscrizioni
            e.HasOne(i => i.Utente)
             .WithMany(u => u.Iscrizioni)
             .HasForeignKey(i => i.UtenteId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(i => !i.IsDeleted);
        });

        // ---- DOCUMENTO (Area Documenti) -------------------------------------
        b.Entity<Documento>(e =>
        {
            e.HasKey(d => d.Id);
            e.Property(d => d.Titolo).HasMaxLength(200).IsRequired();
            e.Property(d => d.Url).HasMaxLength(1000).IsRequired();
            e.Property(d => d.Categoria).HasMaxLength(80);
            e.Property(d => d.Visibilita).HasConversion<string>().HasMaxLength(20);
            // FK owner → restrict: non si cancella un utente con documenti caricati
            e.HasOne(d => d.CaricatoDa)
             .WithMany()
             .HasForeignKey(d => d.CaricatoDaId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(d => !d.IsDeleted);
        });

        // ---- ISCRIZIONE NEWSLETTER ------------------------------------------
        b.Entity<IscrizioneNewsletter>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasIndex(n => n.Email).IsUnique();      // un'email iscritta una sola volta
            e.Property(n => n.Email).HasMaxLength(256).IsRequired();
            e.Property(n => n.Nome).HasMaxLength(120);
            e.HasQueryFilter(n => !n.IsDeleted);
        });

        // ---- IMPOSTAZIONE TEMA (Theme Builder) ------------------------------
        b.Entity<ImpostazioneTema>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Nome).HasMaxLength(120).IsRequired();
            e.Property(t => t.TemaBase).HasMaxLength(4).IsRequired();
            // Colori esadecimali (7 char: #RRGGBB) — SOLO palette FIDC.
            e.Property(t => t.ColorePrimario).HasMaxLength(9).IsRequired();
            e.Property(t => t.ColoreAccento).HasMaxLength(9).IsRequired();
            e.Property(t => t.ColoreSfondo).HasMaxLength(9).IsRequired();
            e.Property(t => t.ColoreTesto).HasMaxLength(9).IsRequired();
            e.Property(t => t.StileRaggio).HasMaxLength(20).IsRequired();
            e.Property(t => t.AbbinamentoFont).HasMaxLength(20).IsRequired();
            e.Property(t => t.EmblemaHero).HasMaxLength(20).IsRequired();
            e.HasQueryFilter(t => !t.IsDeleted);
        });
    }

    /// <summary>
    /// Override di SaveChanges per popolare automaticamente i timestamp di audit
    /// (CreatedAt/UpdatedAt) su tutte le entità che derivano da BaseEntity.
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = DateTime.UtcNow;
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(ct);
    }
}
