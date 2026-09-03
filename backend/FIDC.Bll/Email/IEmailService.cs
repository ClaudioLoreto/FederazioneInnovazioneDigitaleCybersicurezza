// =============================================================================
//  FIDC.Bll » Email » IEmailService.cs
//  Contratto del servizio di invio email. Astrae il provider (Resend) così
//  da poterlo sostituire senza toccare la logica di business.
// =============================================================================

using FIDC.Models.Entities;

namespace FIDC.Bll.Email;

/// <summary>
/// Servizio applicativo per l'invio di email transazionali della Federazione.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Invia l'email di conferma registrazione contenente il link con il token monouso.
    /// </summary>
    /// <param name="utente">Utente appena registrato (deve avere TokenConfermaEmail valorizzato).</param>
    /// <param name="ct">Token di cancellazione.</param>
    /// <returns>True se Resend ha accettato l'invio.</returns>
    Task<bool> InviaConfermaRegistrazioneAsync(Utente utente, CancellationToken ct = default);
}
