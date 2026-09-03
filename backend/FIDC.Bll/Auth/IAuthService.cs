// =============================================================================
//  FIDC.Bll » Auth » IAuthService.cs
//  Contratto del servizio di autenticazione/registrazione.
// =============================================================================

using FIDC.Models.DTOs;

namespace FIDC.Bll.Auth;

/// <summary>Servizio applicativo per registrazione, login e conferma email.</summary>
public interface IAuthService
{
    /// <summary>
    /// Registra un nuovo utente: valida l'email, hasha la password, genera il token
    /// di conferma e innesca l'invio dell'email Resend di benvenuto.
    /// </summary>
    /// <returns>Esito testuale (per il controller).</returns>
    Task<(bool ok, string messaggio)> RegistraAsync(RegisterRequest req, CancellationToken ct = default);

    /// <summary>Autentica un utente e restituisce un JWT in caso di credenziali valide.</summary>
    Task<AuthResponse?> LoginAsync(LoginRequest req, CancellationToken ct = default);

    /// <summary>Conferma l'email validando email + token monouso.</summary>
    Task<bool> ConfermaEmailAsync(ConfermaEmailRequest req, CancellationToken ct = default);
}
