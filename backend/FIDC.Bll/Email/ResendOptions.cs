// =============================================================================
//  FIDC.Bll » Email » ResendOptions.cs
//  Opzioni di configurazione per l'integrazione con l'API Resend.
//  Popolate da appsettings.json / variabili d'ambiente (sezione "Resend").
// =============================================================================

namespace FIDC.Bll.Email;

/// <summary>
/// Opzioni di binding per la sezione "Resend" di appsettings.json.
/// </summary>
public class ResendOptions
{
    /// <summary>Nome della sezione di configurazione.</summary>
    public const string SectionName = "Resend";

    /// <summary>API key segreta di Resend (formato "re_..."). MAI committare valori reali.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Mittente verificato (es. "FIDC &lt;noreply@fidc.it&gt;").</summary>
    public string FromAddress { get; set; } = "FIDC <noreply@fidc.it>";

    /// <summary>Base URL del frontend, usata per costruire il link di conferma email.</summary>
    public string FrontendBaseUrl { get; set; } = "https://www.fidc.it";

    /// <summary>Endpoint REST di invio email di Resend.</summary>
    public string ApiBaseUrl { get; set; } = "https://api.resend.com";
}
