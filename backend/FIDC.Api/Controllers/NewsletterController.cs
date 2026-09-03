// =============================================================================
//  FIDC.Api » Controllers » NewsletterController.cs
//  NEWSLETTER:
//   - iscrizione pubblica (anonimo, idempotente sull'email);
//   - elenco e rimozione iscritti riservati al SuperUser.
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.DTOs;
using FIDC.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Gestione delle iscrizioni alla newsletter della Federazione.</summary>
[ApiController]
[Route("api/[controller]")]
public class NewsletterController : ControllerBase
{
    private readonly IGenericRepository<IscrizioneNewsletter> _iscritti;

    /// <summary>Inietta il repository degli iscritti newsletter.</summary>
    public NewsletterController(IGenericRepository<IscrizioneNewsletter> iscritti) => _iscritti = iscritti;

    /// <summary>
    /// Iscrizione pubblica alla newsletter. Idempotente: se l'email esiste già
    /// la riattiva senza creare duplicati. Accesso anonimo.
    /// </summary>
    /// <param name="req">Email (obbligatoria) e nome opzionale.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Iscrivi([FromBody] NewsletterSubscribeRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@'))
            return BadRequest(new { messaggio = "Email non valida." });

        var email = req.Email.Trim().ToLowerInvariant();
        var esistenti = await _iscritti.FindAsync(i => i.Email == email, ct);
        var esistente = esistenti.FirstOrDefault();

        if (esistente is not null)
        {
            // Già presente: riattiva se era disiscritto (no duplicati).
            if (!esistente.Attiva)
            {
                esistente.Attiva = true;
                _iscritti.Update(esistente);
                await _iscritti.SaveChangesAsync(ct);
            }
            return Ok(new { messaggio = "Sei già iscritto: iscrizione confermata." });
        }

        await _iscritti.AddAsync(new IscrizioneNewsletter
        {
            Email = email,
            Nome = string.IsNullOrWhiteSpace(req.Nome) ? null : req.Nome.Trim(),
            Attiva = true
        }, ct);
        await _iscritti.SaveChangesAsync(ct);

        return Ok(new { messaggio = "Iscrizione completata. Grazie!" });
    }

    /// <summary>Elenco degli iscritti (solo SuperUser).</summary>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet]
    [Authorize(Roles = "SuperUser")]
    public async Task<IActionResult> Elenco(CancellationToken ct)
    {
        var lista = await _iscritti.GetAllAsync(ct);
        var dto = lista
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new IscrittoNewsletterDto(i.Id, i.Email, i.Nome, i.Attiva, i.CreatedAt));
        return Ok(dto);
    }

    /// <summary>Rimuove (soft-delete) un iscritto (solo SuperUser).</summary>
    /// <param name="id">Id dell'iscrizione.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperUser")]
    public async Task<IActionResult> Elimina(int id, CancellationToken ct)
    {
        var iscr = await _iscritti.GetByIdAsync(id, ct);
        if (iscr is null) return NotFound();

        _iscritti.SoftDelete(iscr);
        await _iscritti.SaveChangesAsync(ct);
        return NoContent();
    }
}
