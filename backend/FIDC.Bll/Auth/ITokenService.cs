// =============================================================================
//  FIDC.Bll » Auth » ITokenService.cs
//  Contratto per la generazione del JWT. L'implementazione concreta vive in
//  FIDC.Api perché dipende dai parametri JWT dell'host (chiave, issuer, scadenza).
// =============================================================================

using FIDC.Models.Entities;

namespace FIDC.Bll.Auth;

/// <summary>Servizio per la generazione di token JWT firmati.</summary>
public interface ITokenService
{
    /// <summary>Genera un JWT con i claim (id, email, ruolo) dell'utente indicato.</summary>
    string GeneraToken(Utente utente);
}
