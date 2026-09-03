// =============================================================================
//  FIDC.Models » Entities » Evento.cs
//  Eventi pubblici della Federazione (conferenze, workshop, hackathon...).
// =============================================================================

using FIDC.Models.Enums;

namespace FIDC.Models.Entities;

/// <summary>
/// Evento istituzionale FIDC. Appartiene a un pilastro, ha un Relatore proprietario
/// (RBAC) e raccoglie iscrizioni dal pubblico.
/// </summary>
public class Evento : BaseEntity
{
    /// <summary>Titolo dell'evento (es. "Cyber Resilience Summit 2026").</summary>
    public string Titolo { get; set; } = string.Empty;

    /// <summary>Sottotitolo / claim breve mostrato nelle card.</summary>
    public string? Sottotitolo { get; set; }

    /// <summary>Descrizione estesa dell'evento (HTML/markdown consentito).</summary>
    public string Descrizione { get; set; } = string.Empty;

    /// <summary>Pilastro di appartenenza (di norma <see cref="PilastroTipo.Eventi"/>).</summary>
    public PilastroTipo Pilastro { get; set; } = PilastroTipo.Eventi;

    /// <summary>Data/ora di inizio (UTC).</summary>
    public DateTime DataInizio { get; set; }

    /// <summary>Data/ora di fine (UTC). Null se evento puntuale.</summary>
    public DateTime? DataFine { get; set; }

    /// <summary>Luogo fisico o "Online".</summary>
    public string Luogo { get; set; } = string.Empty;

    /// <summary>Numero massimo di posti. 0 = illimitato.</summary>
    public int PostiTotali { get; set; }

    /// <summary>Indica se l'evento è pubblicato e visibile sul sito.</summary>
    public bool Pubblicato { get; set; }

    // ---- RBAC: proprietà del Relatore ----------------------------------------

    /// <summary>FK verso l'utente Relatore proprietario dell'evento.</summary>
    public int RelatoreId { get; set; }

    /// <summary>Relatore proprietario (navigazione).</summary>
    public Utente? Relatore { get; set; }

    // ---- Relazioni -----------------------------------------------------------

    /// <summary>Iscrizioni del pubblico a questo evento.</summary>
    public ICollection<Iscrizione> Iscrizioni { get; set; } = new List<Iscrizione>();
}
