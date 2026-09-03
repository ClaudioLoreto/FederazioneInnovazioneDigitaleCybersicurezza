// =============================================================================
//  FIDC.Models » Entities » BaseEntity.cs
//  Classe base astratta ereditata da TUTTE le entità persistite.
//  Centralizza Id (PK Identity) e i timestamp di audit.
// =============================================================================

namespace FIDC.Models.Entities;

/// <summary>
/// Entità base condivisa da tutte le tabelle del dominio FIDC.
/// Garantisce chiave primaria coerente (Id Identity) e tracciamento temporale.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Chiave primaria auto-incrementale (IDENTITY su SQL Server, identity su Postgres).
    /// Gestita interamente da EF Core / dal database, mai impostata a mano.
    /// </summary>
    public int Id { get; set; }

    /// <summary>Data/ora UTC di creazione del record. Impostata una sola volta.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Data/ora UTC dell'ultimo aggiornamento. Aggiornata ad ogni Save.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Flag di soft-delete: se true il record è logicamente cancellato
    /// ma resta in tabella (filtrato via Global Query Filter in EF).
    /// </summary>
    public bool IsDeleted { get; set; }
}
