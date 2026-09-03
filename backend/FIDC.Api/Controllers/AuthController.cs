// =============================================================================
//  FIDC.Api » Controllers » AuthController.cs
//  Endpoint pubblici di registrazione, login e conferma email.
//  Il controller NON contiene logica: delega tutto a IAuthService (BLL).
// =============================================================================

using FIDC.Bll.Auth;
using FIDC.Models.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>
/// Gestisce il ciclo di vita dell'account: registrazione (con email Resend),
/// login (rilascio JWT) e conferma dell'indirizzo email.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    /// <summary>Inietta il servizio di autenticazione.</summary>
    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>
    /// Registra un nuovo utente e innesca l'invio dell'email di conferma via Resend.
    /// </summary>
    /// <param name="req">Dati di registrazione.</param>
    /// <param name="ct">Token di cancellazione della richiesta.</param>
    /// <response code="200">Registrazione riuscita.</response>
    /// <response code="400">Dati non validi o email già esistente.</response>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var (ok, messaggio) = await _auth.RegistraAsync(req, ct);
        return ok ? Ok(new { messaggio }) : BadRequest(new { messaggio });
    }

    /// <summary>
    /// Autentica l'utente e restituisce un JWT.
    /// In Development (<c>Auth:BypassEmailConfirmation</c>) non si richiede
    /// <c>EmailConfermata</c>: il flusso Resend non deve bloccare il demo locale.
    /// </summary>
    /// <param name="req">Credenziali di accesso.</param>
    /// <param name="ct">Token di cancellazione della richiesta.</param>
    /// <response code="200">Credenziali valide: token rilasciato.</response>
    /// <response code="401">Credenziali non valide.</response>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var resp = await _auth.LoginAsync(req, ct);
        return resp is null
            ? Unauthorized(new { messaggio = "Credenziali non valide." })
            : Ok(resp);
    }

    /// <summary>Conferma l'email tramite il token monouso ricevuto via Resend.</summary>
    /// <param name="req">Email e token di conferma.</param>
    /// <param name="ct">Token di cancellazione della richiesta.</param>
    /// <response code="200">Email confermata.</response>
    /// <response code="400">Token assente, errato o scaduto.</response>
    [HttpPost("conferma-email")]
    public async Task<IActionResult> ConfermaEmail([FromBody] ConfermaEmailRequest req, CancellationToken ct)
    {
        var ok = await _auth.ConfermaEmailAsync(req, ct);
        return ok
            ? Ok(new { messaggio = "Email confermata con successo. Ora puoi accedere." })
            : BadRequest(new { messaggio = "Token non valido o scaduto." });
    }
}
