// =============================================================================
//  FIDC.Models » Enums » UserRole.cs
//  Definizione dei ruoli RBAC della piattaforma.
// =============================================================================

namespace FIDC.Models.Enums;

/// <summary>
/// Ruoli applicativi per il Role-Based Access Control (RBAC) del backoffice FIDC.
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Super User: controllo totale su tutta la piattaforma
    /// (utenti, ruoli, tutti i contenuti, configurazioni di sistema).
    /// </summary>
    SuperUser = 1,

    /// <summary>
    /// Relatore: può creare e gestire SOLO i propri eventi e le proprie news.
    /// Nessun accesso alla gestione utenti o alle configurazioni globali.
    /// </summary>
    Relatore = 2
}
