// =============================================================================
//  FIDC.Bll » Auth » AuthService.cs
//  Implementazione della logica di registrazione/login/conferma.
//  Orchestrazione: Repository (DAL) + hashing (BCrypt) + email (Resend) + JWT.
//  NESSUN accesso diretto a EF Core: passa sempre dal repository.
// =============================================================================

using FIDC.Bll.Email;
using FIDC.Dal.Repositories;
using FIDC.Models.DTOs;
using FIDC.Models.Entities;
using FIDC.Models.Enums;
using Microsoft.Extensions.Configuration;

namespace FIDC.Bll.Auth;

/// <summary>
/// Servizio di autenticazione FIDC. Coordina i passi di registrazione
/// (hash password → token conferma → email Resend), login e conferma email.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IGenericRepository<Utente> _utenti;
    private readonly IEmailService _email;
    private readonly ITokenService _token;
    /// <summary>
    /// In Development (appsettings) salta la conferma email: niente Resend, niente
    /// blocco su <c>EmailConfermata</c>. In produzione resta obbligatorio.
    /// </summary>
    private readonly bool _bypassConfermaEmail;

    /// <summary>Inietta repository utenti, servizio email, token e configurazione auth.</summary>
    public AuthService(
        IGenericRepository<Utente> utenti,
        IEmailService email,
        ITokenService token,
        IConfiguration cfg)
    {
        _utenti = utenti;
        _email = email;
        _token = token;
        _bypassConfermaEmail = string.Equals(
            cfg["Auth:BypassEmailConfirmation"], "true", StringComparison.OrdinalIgnoreCase);
    }

    /// <inheritdoc />
    public async Task<(bool ok, string messaggio)> RegistraAsync(RegisterRequest req, CancellationToken ct = default)
    {
        // 1) Validazione minima a livello di dominio.
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return (false, "Email e password sono obbligatorie.");

        // 2) Unicità email.
        var esistenti = await _utenti.FindAsync(u => u.Email == req.Email.ToLower(), ct);
        if (esistenti.Count > 0)
            return (false, "Esiste già un account con questa email.");

        // 3) Creazione entità con password hashata (mai in chiaro) e token monouso.
        var utente = new Utente
        {
            Nome = req.Nome.Trim(),
            Cognome = req.Cognome.Trim(),
            Email = req.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Ruolo = UserRole.Relatore,                 // ruolo base; il SuperUser potrà elevarlo
            // Dev locale: account subito operativo (niente attesa Resend).
            EmailConfermata = _bypassConfermaEmail,
            TokenConfermaEmail = _bypassConfermaEmail ? null : Guid.NewGuid().ToString("N"),
            ScadenzaTokenConferma = _bypassConfermaEmail ? null : DateTime.UtcNow.AddHours(48)
        };

        await _utenti.AddAsync(utente, ct);
        await _utenti.SaveChangesAsync(ct);

        if (_bypassConfermaEmail)
            return (true, "Registrazione completata. In Development l'account è già attivo: puoi accedere.");

        await _email.InviaConfermaRegistrazioneAsync(utente, ct);
        return (true, "Registrazione completata. Controlla la tua email per confermare l'account.");
    }

    /// <inheritdoc />
    public async Task<AuthResponse?> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var match = await _utenti.FindAsync(u => u.Email == req.Email.Trim().ToLower(), ct);
        var utente = match.FirstOrDefault();

        // Verifica esistenza + password. Messaggio generico per non rivelare quale dato sia errato.
        if (utente is null || !BCrypt.Net.BCrypt.Verify(req.Password, utente.PasswordHash))
            return null;

        // Produzione: niente JWT finché l'email non è confermata.
        // Development: BypassEmailConfirmation=true → il controllo è DISATTIVATO.
        if (!_bypassConfermaEmail && !utente.EmailConfermata)
            return null;

        var jwt = _token.GeneraToken(utente);
        return new AuthResponse(jwt, $"{utente.Nome} {utente.Cognome}", utente.Ruolo);
    }

    /// <inheritdoc />
    public async Task<bool> ConfermaEmailAsync(ConfermaEmailRequest req, CancellationToken ct = default)
    {
        var match = await _utenti.FindAsync(u => u.Email == req.Email.Trim().ToLower(), ct);
        var utente = match.FirstOrDefault();

        // Token assente/errato/scaduto → conferma rifiutata.
        if (utente is null
            || utente.TokenConfermaEmail != req.Token
            || utente.ScadenzaTokenConferma < DateTime.UtcNow)
            return false;

        utente.EmailConfermata = true;
        utente.TokenConfermaEmail = null;        // token monouso: invalidato
        utente.ScadenzaTokenConferma = null;
        _utenti.Update(utente);
        await _utenti.SaveChangesAsync(ct);
        return true;
    }
}
