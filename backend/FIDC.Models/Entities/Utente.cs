// =============================================================================
//  FIDC.Models » Entities » Utente.cs
//  Anagrafica utenti/account del backoffice e degli iscritti pubblici.
// =============================================================================

using FIDC.Models.Enums;

namespace FIDC.Models.Entities;

/// <summary>
/// Rappresenta un account della piattaforma: può essere un membro dello staff
/// del backoffice (SuperUser / Relatore) oppure un utente registrato dal sito pubblico.
/// </summary>
public class Utente : BaseEntity
{
    /// <summary>Nome di battesimo dell'utente.</summary>
    public string Nome { get; set; } = string.Empty;

    /// <summary>Cognome dell'utente.</summary>
    public string Cognome { get; set; } = string.Empty;

    /// <summary>Email univoca: usata come username di login e per le notifiche Resend.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Hash della password (mai in chiaro). Generato con algoritmo robusto (es. BCrypt/PBKDF2).
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Ruolo RBAC dell'utente. Default: Relatore per lo staff.</summary>
    public UserRole Ruolo { get; set; } = UserRole.Relatore;

    /// <summary>
    /// Indica se l'email è stata confermata tramite il link inviato con Resend.
    /// Finché false, l'account non è pienamente operativo.
    /// </summary>
    public bool EmailConfermata { get; set; }

    /// <summary>
    /// Token monouso inviato via email per confermare la registrazione.
    /// Null dopo la conferma.
    /// </summary>
    public string? TokenConfermaEmail { get; set; }

    /// <summary>Scadenza del token di conferma email (UTC).</summary>
    public DateTime? ScadenzaTokenConferma { get; set; }

    // ---- Relazioni di navigazione --------------------------------------------

    /// <summary>Eventi di cui questo utente (Relatore) è proprietario/gestore.</summary>
    public ICollection<Evento> EventiGestiti { get; set; } = new List<Evento>();

    /// <summary>News redatte da questo utente.</summary>
    public ICollection<News> NewsRedatte { get; set; } = new List<News>();

    /// <summary>Iscrizioni dell'utente agli eventi pubblici.</summary>
    public ICollection<Iscrizione> Iscrizioni { get; set; } = new List<Iscrizione>();
}
