// =============================================================================
//  FIDC.Models » DTOs » AdminDtos.cs
//  DTO per backoffice/CMS: gestione utenti (RBAC) e newsletter. I DTO evitano di
//  esporre dati sensibili delle entità (es. PasswordHash) verso il client.
// =============================================================================

namespace FIDC.Models.DTOs;

/// <summary>Payload pubblico di iscrizione alla newsletter.</summary>
/// <param name="Email">Email da iscrivere (univoca).</param>
/// <param name="Nome">Nome opzionale dell'iscritto.</param>
public record NewsletterSubscribeRequest(string Email, string? Nome);

/// <summary>Vista di un iscritto newsletter per il backoffice.</summary>
public record IscrittoNewsletterDto(int Id, string Email, string? Nome, bool Attiva, DateTime CreatedAt);

/// <summary>Payload per il cambio di ruolo RBAC di un utente.</summary>
/// <param name="Ruolo">Nuovo ruolo: "SuperUser" oppure "Relatore".</param>
public record CambiaRuoloRequest(string Ruolo);

/// <summary>
/// Vista sicura di un utente per la "Gestione Utenti" (SENZA PasswordHash/token).
/// </summary>
public record UtenteAdminDto(
    int Id,
    string Nome,
    string Cognome,
    string Email,
    string Ruolo,
    bool EmailConfermata,
    DateTime CreatedAt);

/// <summary>
/// Configurazione del "velo" (tema) del portale, scambiata con il backoffice
/// "Theme Builder". I colori sono esadecimali e DEVONO appartenere ai 4 della
/// palette FIDC (validati lato API). Usato sia in lettura (GET) che scrittura (PUT).
/// </summary>
/// <param name="TemaBase">Tema base "1" | "2" | "3".</param>
/// <param name="Personalizzato">Se true applica gli override sottostanti.</param>
/// <param name="ColorePrimario">Accento primario (hex palette).</param>
/// <param name="ColoreAccento">Accento secondario (hex palette).</param>
/// <param name="ColoreSfondo">Sfondo pagina (hex palette).</param>
/// <param name="ColoreTesto">Testo principale (hex palette).</param>
/// <param name="StileRaggio">"sharp" | "soft" | "rounded".</param>
/// <param name="AbbinamentoFont">"cyber" | "moderno" | "classico".</param>
/// <param name="EmblemaHero">"cassaforte" | "scudo" | "nucleo" (facoltativo, default "cassaforte").</param>
public record TemaConfigDto(
    string TemaBase,
    bool Personalizzato,
    string ColorePrimario,
    string ColoreAccento,
    string ColoreSfondo,
    string ColoreTesto,
    string StileRaggio,
    string AbbinamentoFont,
    string EmblemaHero = "cassaforte");

/// <summary>
/// Partecipante a un evento, come lo vede il backoffice: chi è e quando si è
/// iscritto. Restituito da GET /api/iscrizioni/evento/{id}.
/// </summary>
/// <param name="IscrizioneId">Id dell'iscrizione.</param>
/// <param name="UtenteId">Id dell'utente iscritto.</param>
/// <param name="NomeCompleto">Nome e cognome dell'utente.</param>
/// <param name="Email">Email dell'utente.</param>
/// <param name="IscrittoIl">Data e ora dell'iscrizione (UTC).</param>
/// <param name="Presente">True se la presenza è stata registrata.</param>
public record PartecipanteDto(
    int IscrizioneId,
    int UtenteId,
    string NomeCompleto,
    string Email,
    DateTime IscrittoIl,
    bool Presente);
