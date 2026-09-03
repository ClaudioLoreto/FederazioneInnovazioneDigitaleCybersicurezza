// =============================================================================
//  FIDC.Models » Entities » Documento.cs
//  Entità dell'AREA DOCUMENTI: metadati di un file/risorsa scaricabile.
//  Il binario può risiedere su storage/URL esterno; qui si tracciano i metadati
//  e il riferimento (Url) per il download, con visibilità pubblica/riservata.
// =============================================================================

using FIDC.Models.Enums;

namespace FIDC.Models.Entities;

/// <summary>
/// Documento pubblicabile nell'Area Documenti (report, linee guida, atti…).
/// Di proprietà dell'utente che lo carica (RBAC ownership come Eventi/News).
/// </summary>
public class Documento : BaseEntity
{
    /// <summary>Titolo del documento mostrato in elenco.</summary>
    public string Titolo { get; set; } = string.Empty;

    /// <summary>Descrizione/abstract opzionale.</summary>
    public string? Descrizione { get; set; }

    /// <summary>URL o percorso del file scaricabile.</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>Categoria libera (es. "Report", "Linee guida", "Atti").</summary>
    public string Categoria { get; set; } = "Generale";

    /// <summary>Visibilità: pubblica (anonimi) o riservata (backoffice).</summary>
    public VisibilitaDocumento Visibilita { get; set; } = VisibilitaDocumento.Pubblico;

    /// <summary>FK all'utente che ha caricato il documento (owner RBAC).</summary>
    public int CaricatoDaId { get; set; }

    /// <summary>Navigazione all'autore del caricamento.</summary>
    public Utente? CaricatoDa { get; set; }
}
