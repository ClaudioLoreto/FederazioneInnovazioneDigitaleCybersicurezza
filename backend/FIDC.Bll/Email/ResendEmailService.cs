// =============================================================================
//  FIDC.Bll » Email » ResendEmailService.cs
//  Implementazione di IEmailService basata sull'API REST di Resend.
//  Costruisce un'email HTML istituzionale (palette FIDC) e la invia via HttpClient.
// =============================================================================

using System.Net.Http.Headers;
using System.Net.Http.Json;
using FIDC.Models.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FIDC.Bll.Email;

/// <summary>
/// Servizio di invio email tramite Resend (https://resend.com).
/// Usa <see cref="IHttpClientFactory"/> per chiamare l'endpoint /emails.
/// </summary>
public class ResendEmailService : IEmailService
{
    private readonly HttpClient _http;
    private readonly ResendOptions _opt;
    private readonly ILogger<ResendEmailService> _log;

    /// <summary>
    /// Inietta l'HttpClient (configurato con base address e Bearer token in Program.cs),
    /// le opzioni Resend e il logger.
    /// </summary>
    public ResendEmailService(
        HttpClient http,
        IOptions<ResendOptions> opt,
        ILogger<ResendEmailService> log)
    {
        _http = http;
        _opt = opt.Value;
        _log = log;

        // Autenticazione Bearer con l'API key Resend.
        _http.BaseAddress ??= new Uri(_opt.ApiBaseUrl);
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _opt.ApiKey);
    }

    /// <inheritdoc />
    public async Task<bool> InviaConfermaRegistrazioneAsync(Utente utente, CancellationToken ct = default)
    {
        // Costruisce il link di conferma verso il frontend Angular.
        var link = $"{_opt.FrontendBaseUrl}/conferma-email" +
                   $"?email={Uri.EscapeDataString(utente.Email)}" +
                   $"&token={Uri.EscapeDataString(utente.TokenConfermaEmail ?? string.Empty)}";

        // Payload conforme allo schema dell'API Resend (POST /emails).
        var payload = new
        {
            from = _opt.FromAddress,
            to = new[] { utente.Email },
            subject = "Benvenuto in FIDC — conferma la tua registrazione",
            html = CostruisciTemplateHtml(utente.Nome, link)
        };

        try
        {
            var resp = await _http.PostAsJsonAsync("/emails", payload, ct);
            if (resp.IsSuccessStatusCode)
            {
                _log.LogInformation("Email di conferma inviata a {Email} via Resend.", utente.Email);
                return true;
            }

            var body = await resp.Content.ReadAsStringAsync(ct);
            _log.LogError("Resend ha rifiutato l'invio a {Email}: {Status} {Body}",
                utente.Email, resp.StatusCode, body);
            return false;
        }
        catch (Exception ex)
        {
            // Non far fallire la registrazione per un problema di email: logghiamo e proseguiamo.
            _log.LogError(ex, "Errore nella chiamata a Resend per {Email}.", utente.Email);
            return false;
        }
    }

    /// <summary>
    /// Genera il corpo HTML dell'email usando ESCLUSIVAMENTE la palette FIDC
    /// (#333D6D, #723EC3, #FFCF95, #FFF0D9). Copy reale, tono istituzionale.
    /// </summary>
    private static string CostruisciTemplateHtml(string nome, string linkConferma) => $@"
<!DOCTYPE html>
<html lang=""it"">
<body style=""margin:0;padding:0;background:#FFF0D9;font-family:system-ui,Segoe UI,sans-serif;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#FFF0D9;padding:32px 0;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0""
             style=""background:#333D6D;border-radius:16px;overflow:hidden;"">
        <tr><td style=""padding:40px 48px 24px;text-align:center;"">
          <span style=""display:inline-block;font-size:28px;font-weight:900;color:#FFF0D9;letter-spacing:2px;"">FIDC</span>
          <div style=""height:4px;width:64px;margin:16px auto 0;border-radius:2px;
                      background:linear-gradient(90deg,#723EC3,#FFCF95);""></div>
        </td></tr>
        <tr><td style=""padding:8px 48px 8px;"">
          <h1 style=""color:#FFCF95;font-size:24px;margin:0 0 16px;"">Benvenuto in FIDC, {nome}!</h1>
          <p style=""color:#FFF0D9;font-size:16px;line-height:1.6;margin:0 0 16px;"">
            Grazie per esserti unito alla <strong>Federazione Innovazione, Digitale e Cybersicurezza</strong>.
            Insieme costruiamo un ecosistema digitale più sicuro, competente e innovativo per l'Italia.
          </p>
          <p style=""color:#FFF0D9;font-size:16px;line-height:1.6;margin:0 0 28px;"">
            Per attivare il tuo account e accedere ad attività, eventi, percorsi di formazione e ricerca,
            conferma il tuo indirizzo email:
          </p>
        </td></tr>
        <tr><td style=""padding:0 48px 8px;text-align:center;"">
          <a href=""{linkConferma}""
             style=""display:inline-block;padding:16px 40px;border-radius:999px;
                    background:#FFCF95;color:#333D6D;font-weight:800;font-size:16px;
                    text-decoration:none;box-shadow:0 8px 24px rgba(114,62,195,0.45);"">
            Conferma la registrazione
          </a>
        </td></tr>
        <tr><td style=""padding:28px 48px 40px;"">
          <p style=""color:#FFCF95;font-size:13px;line-height:1.6;margin:0;opacity:.85;"">
            Se il pulsante non funziona, copia e incolla questo link nel browser:<br/>
            <span style=""color:#FFF0D9;word-break:break-all;"">{linkConferma}</span>
          </p>
        </td></tr>
      </table>
      <p style=""color:#333D6D;font-size:12px;margin:24px 0 0;"">
        © {DateTime.UtcNow.Year} FIDC — Federazione Innovazione, Digitale e Cybersicurezza
      </p>
    </td></tr>
  </table>
</body>
</html>";
}
