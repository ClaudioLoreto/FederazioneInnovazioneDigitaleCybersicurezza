// =============================================================================
//  FIDC.Models » Entities » IscrizioneNewsletter.cs
//  Entità NEWSLETTER: indirizzo iscritto agli aggiornamenti della Federazione.
//  Indipendente dall'anagrafica Utenti (ci si iscrive anche senza account).
// =============================================================================

namespace FIDC.Models.Entities;

/// <summary>
/// Iscrizione pubblica alla newsletter FIDC. L'email è univoca; la disiscrizione
/// è gestita via soft-delete / flag <see cref="Attiva"/>.
/// </summary>
public class IscrizioneNewsletter : BaseEntity
{
    /// <summary>Email iscritta (univoca, lowercase).</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Nome opzionale dell'iscritto (per personalizzare gli invii).</summary>
    public string? Nome { get; set; }

    /// <summary>True se l'iscrizione è attiva (false = disiscritto).</summary>
    public bool Attiva { get; set; } = true;
}
