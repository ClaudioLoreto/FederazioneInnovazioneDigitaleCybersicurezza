// =============================================================================
//  FIDC.Api » Services » JwtTokenService.cs
//  Implementazione concreta di ITokenService. Vive nell'API perché dipende
//  dai parametri JWT dell'host (chiave segreta, issuer, audience, scadenza).
// =============================================================================

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FIDC.Bll.Auth;
using FIDC.Models.Entities;
using Microsoft.IdentityModel.Tokens;

namespace FIDC.Api.Services;

/// <summary>
/// Genera JWT firmati con HMAC-SHA256 leggendo i parametri dalla sezione "Jwt".
/// </summary>
public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _cfg;

    /// <summary>Inietta la configurazione per leggere la sezione "Jwt".</summary>
    public JwtTokenService(IConfiguration cfg) => _cfg = cfg;

    /// <inheritdoc />
    public string GeneraToken(Utente utente)
    {
        var jwt = _cfg.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claim minimi: identificativo, email, ruolo RBAC (usato da [Authorize(Roles=...)]).
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, utente.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, utente.Email),
            new Claim(ClaimTypes.Role, utente.Ruolo.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(jwt["ExpiresHours"] ?? "8")),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
