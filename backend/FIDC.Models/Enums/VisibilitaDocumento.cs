// =============================================================================
//  FIDC.Models » Enums » VisibilitaDocumento.cs
//  Livello di visibilità di un documento dell'Area Documenti.
// =============================================================================

namespace FIDC.Models.Enums;

/// <summary>
/// Determina chi può vedere/scaricare un documento dell'Area Documenti.
/// </summary>
public enum VisibilitaDocumento
{
    /// <summary>Visibile e scaricabile da chiunque, anche utenti anonimi.</summary>
    Pubblico = 1,

    /// <summary>Visibile solo nel backoffice agli utenti autenticati (RBAC).</summary>
    Riservato = 2
}
