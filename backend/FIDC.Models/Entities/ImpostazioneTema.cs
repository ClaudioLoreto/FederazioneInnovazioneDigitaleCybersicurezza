// =============================================================================
//  FIDC.Models » Entities » ImpostazioneTema.cs
//  CONFIGURAZIONE DEL "VELO" (tema) del portale, persistita su database.
//  Consente al SuperUser di definire un veil PERSONALIZZATO dal backoffice
//  ("Theme Builder") oltre a scegliere uno dei 3 temi base.
//
//  VINCOLO PALETTE FERREA: i colori memorizzati devono essere ESCLUSIVAMENTE
//  uno dei 4 della palette FIDC (#333D6D #723EC3 #FFCF95 #FFF0D9). Il builder
//  lato client propone solo questi 4 swatch, quindi il vincolo è garantito.
//  Qui i colori sono stringhe esadecimali (validate a monte dall'API).
// =============================================================================

namespace FIDC.Models.Entities;

/// <summary>
/// Impostazione del tema attivo del portale. Esiste una sola riga con
/// <see cref="Attivo"/> = true, applicata a tutto il sito pubblico.
/// </summary>
public class ImpostazioneTema : BaseEntity
{
    /// <summary>Etichetta descrittiva (es. "Tema personalizzato FIDC").</summary>
    public string Nome { get; set; } = "Tema FIDC";

    /// <summary>
    /// Indica se questa è la configurazione attualmente applicata al sito.
    /// Una sola riga per volta dovrebbe avere questo flag a true.
    /// </summary>
    public bool Attivo { get; set; } = true;

    /// <summary>
    /// Tema base di partenza ("1" Institutional · "2" Tech · "3" Community).
    /// Usato come fallback quando <see cref="Personalizzato"/> è false.
    /// </summary>
    public string TemaBase { get; set; } = "1";

    /// <summary>
    /// Se true, applica gli override personalizzati (colori/raggio/font) sopra
    /// il tema base. Se false, si usa semplicemente il velo <see cref="TemaBase"/>.
    /// </summary>
    public bool Personalizzato { get; set; }

    /// <summary>Colore accento primario (uno dei 4 palette). Es. "#723EC3".</summary>
    public string ColorePrimario { get; set; } = "#723EC3";

    /// <summary>Colore accento secondario (uno dei 4 palette). Es. "#FFCF95".</summary>
    public string ColoreAccento { get; set; } = "#FFCF95";

    /// <summary>Colore di sfondo pagina (uno dei 4 palette). Es. "#FFF0D9".</summary>
    public string ColoreSfondo { get; set; } = "#FFF0D9";

    /// <summary>Colore del testo principale (uno dei 4 palette). Es. "#333D6D".</summary>
    public string ColoreTesto { get; set; } = "#333D6D";

    /// <summary>Stile degli angoli/superfici: "sharp" · "soft" · "rounded".</summary>
    public string StileRaggio { get; set; } = "soft";

    /// <summary>Abbinamento tipografico: "cyber" · "moderno" · "classico".</summary>
    public string AbbinamentoFont { get; set; } = "classico";

    /// <summary>
    /// Figura mostrata nell'hero della home: "cassaforte" (predefinita),
    /// "scudo" o "nucleo". Scelta dalla Direzione nel Theme Builder.
    /// </summary>
    public string EmblemaHero { get; set; } = "cassaforte";
}
