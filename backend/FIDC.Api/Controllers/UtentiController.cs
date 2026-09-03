// =============================================================================
//  FIDC.Api » Controllers » UtentiController.cs
//  GESTIONE UTENTI — riservata al SuperUser (RBAC). Espone una vista SICURA
//  (UtenteAdminDto, senza PasswordHash/token), il cambio ruolo e il soft-delete.
//  Un SuperUser non può declassare/eliminare se stesso (protezione anti-lockout).
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.DTOs;
using FIDC.Models.Entities;
using FIDC.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Amministrazione degli account e dei ruoli RBAC (solo SuperUser).</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperUser")]
public class UtentiController : ControllerBase
{
    private readonly IGenericRepository<Utente> _utenti;

    /// <summary>Inietta il repository utenti.</summary>
    public UtentiController(IGenericRepository<Utente> utenti) => _utenti = utenti;

    /// <summary>Elenco di tutti gli utenti (vista sicura, senza segreti).</summary>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet]
    public async Task<IActionResult> Elenco(CancellationToken ct)
    {
        var lista = await _utenti.GetAllAsync(ct);
        var dto = lista
            .OrderBy(u => u.Cognome).ThenBy(u => u.Nome)
            .Select(u => new UtenteAdminDto(
                u.Id, u.Nome, u.Cognome, u.Email, u.Ruolo.ToString(), u.EmailConfermata, u.CreatedAt));
        return Ok(dto);
    }

    /// <summary>Cambia il ruolo RBAC di un utente (SuperUser/Relatore).</summary>
    /// <param name="id">Id dell'utente.</param>
    /// <param name="req">Nuovo ruolo.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPut("{id:int}/ruolo")]
    public async Task<IActionResult> CambiaRuolo(int id, [FromBody] CambiaRuoloRequest req, CancellationToken ct)
    {
        if (!Enum.TryParse<UserRole>(req.Ruolo, out var ruolo))
            return BadRequest(new { messaggio = "Ruolo non valido." });

        // Anti-lockout: il SuperUser corrente non può declassare se stesso.
        if (id == User.GetUserId() && ruolo != UserRole.SuperUser)
            return BadRequest(new { messaggio = "Non puoi rimuovere il tuo stesso ruolo di SuperUser." });

        var utente = await _utenti.GetByIdAsync(id, ct);
        if (utente is null) return NotFound();

        utente.Ruolo = ruolo;
        _utenti.Update(utente);
        await _utenti.SaveChangesAsync(ct);

        return Ok(new UtenteAdminDto(
            utente.Id, utente.Nome, utente.Cognome, utente.Email,
            utente.Ruolo.ToString(), utente.EmailConfermata, utente.CreatedAt));
    }

    /// <summary>Elimina (soft-delete) un utente. Non si può eliminare se stessi.</summary>
    /// <param name="id">Id dell'utente.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Elimina(int id, CancellationToken ct)
    {
        if (id == User.GetUserId())
            return BadRequest(new { messaggio = "Non puoi eliminare il tuo stesso account." });

        var utente = await _utenti.GetByIdAsync(id, ct);
        if (utente is null) return NotFound();

        _utenti.SoftDelete(utente);
        await _utenti.SaveChangesAsync(ct);
        return NoContent();
    }
}
