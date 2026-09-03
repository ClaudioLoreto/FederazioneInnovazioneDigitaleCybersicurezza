// =============================================================================
//  FIDC.Models » Entities » News.cs
//  Articoli / comunicati della Federazione.
// =============================================================================

using FIDC.Models.Enums;

namespace FIDC.Models.Entities;

/// <summary>
/// Articolo di news o comunicato stampa pubblicato dalla Federazione.
/// Ogni news ha un autore (Relatore o SuperUser) ai fini RBAC.
/// </summary>
public class News : BaseEntity
{
    /// <summary>Titolo della news.</summary>
    public string Titolo { get; set; } = string.Empty;

    /// <summary>Abstract/sommario mostrato nelle anteprime.</summary>
    public string Sommario { get; set; } = string.Empty;

    /// <summary>Corpo completo dell'articolo (HTML/markdown).</summary>
    public string Contenuto { get; set; } = string.Empty;

    /// <summary>Slug URL-friendly univoco (es. "cyber-summit-2026").</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Pilastro tematico associato alla news.</summary>
    public PilastroTipo Pilastro { get; set; } = PilastroTipo.Attivita;

    /// <summary>URL dell'immagine di copertina.</summary>
    public string? ImmagineCopertina { get; set; }

    /// <summary>Indica se la news è pubblicata e visibile.</summary>
    public bool Pubblicato { get; set; }

    /// <summary>Data di pubblicazione effettiva (UTC).</summary>
    public DateTime? DataPubblicazione { get; set; }

    // ---- RBAC: autore --------------------------------------------------------

    /// <summary>FK verso l'utente autore della news.</summary>
    public int AutoreId { get; set; }

    /// <summary>Autore della news (navigazione).</summary>
    public Utente? Autore { get; set; }
}
