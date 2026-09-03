// =============================================================================
//  FIDC.Api » Controllers » CurrentUserExtensions.cs
//  Helper per leggere l'identità dell'utente autenticato dai claim del JWT.
//  Centralizza la logica RBAC riusata dai controller del backoffice.
// =============================================================================

using System.Security.Claims;

namespace FIDC.Api.Controllers;

/// <summary>
/// Estensioni su <see cref="ClaimsPrincipal"/> per recuperare in modo sicuro
/// l'Id e il ruolo dell'utente corrente a partire dai claim del token JWT.
/// </summary>
public static class CurrentUserExtensions
{
    /// <summary>
    /// Restituisce l'Id dell'utente autenticato (claim "sub" → NameIdentifier).
    /// </summary>
    /// <returns>L'Id numerico, oppure 0 se non determinabile.</returns>
    public static int GetUserId(this ClaimsPrincipal user)
    {
        // ASP.NET mappa di default il claim JWT "sub" su ClaimTypes.NameIdentifier.
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }

    /// <summary>Indica se l'utente corrente ha il ruolo SuperUser.</summary>
    public static bool IsSuperUser(this ClaimsPrincipal user)
        => user.IsInRole("SuperUser");
}
