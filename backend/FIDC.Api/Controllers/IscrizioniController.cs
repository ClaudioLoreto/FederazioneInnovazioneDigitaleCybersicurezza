// =============================================================================
//  FIDC.Api » Controllers » IscrizioniController.cs
//  Gestione delle iscrizioni agli eventi con RBAC:
//   - un utente autenticato può iscriversi/disiscriversi (per sé stesso);
//   - l'elenco partecipanti di un evento è visibile a SuperUser e al Relatore
//     proprietario dell'evento.
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Gestione delle iscrizioni del pubblico agli eventi della Federazione.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // tutte le azioni richiedono almeno l'autenticazione
public class IscrizioniController : ControllerBase
{
    private readonly IGenericRepository<Iscrizione> _iscrizioni;
    private readonly IGenericRepository<Evento> _eventi;

    /// <summary>Inietta i repository di iscrizioni ed eventi.</summary>
    public IscrizioniController(
        IGenericRepository<Iscrizione> iscrizioni,
        IGenericRepository<Evento> eventi)
    {
        _iscrizioni = iscrizioni;
        _eventi = eventi;
    }

    /// <summary>
    /// Iscrive l'utente corrente a un evento. L'utente può iscrivere solo sé stesso;
    /// l'indice univoco (EventoId, UtenteId) impedisce le doppie iscrizioni.
    /// </summary>
    /// <param name="eventoId">Id dell'evento a cui iscriversi.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPost("evento/{eventoId:int}")]
    public async Task<IActionResult> Iscriviti(int eventoId, CancellationToken ct)
    {
        var evento = await _eventi.GetByIdAsync(eventoId, ct);
        if (evento is null || !evento.Pubblicato) return NotFound();

        var userId = User.GetUserId();

        // Evita la doppia iscrizione (oltre al vincolo DB).
        var giaIscritto = await _iscrizioni.FindAsync(
            i => i.EventoId == eventoId && i.UtenteId == userId, ct);
        if (giaIscritto.Count > 0)
            return Conflict(new { messaggio = "Sei già iscritto a questo evento." });

        var iscrizione = new Iscrizione
        {
            EventoId = eventoId,
            UtenteId = userId,
            EmailConfermaInviata = false,
            Presente = false
        };

        await _iscrizioni.AddAsync(iscrizione, ct);
        await _iscrizioni.SaveChangesAsync(ct);
        return Ok(new { messaggio = "Iscrizione registrata con successo." });
    }

    /// <summary>
    /// Elenca i partecipanti di un evento. Accesso consentito a SuperUser e al
    /// Relatore proprietario dell'evento (RBAC ownership).
    /// </summary>
    /// <param name="eventoId">Id dell'evento.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("evento/{eventoId:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Partecipanti(int eventoId, CancellationToken ct)
    {
        var evento = await _eventi.GetByIdAsync(eventoId, ct);
        if (evento is null) return NotFound();

        // Un Relatore vede solo i partecipanti dei propri eventi.
        if (!User.IsSuperUser() && evento.RelatoreId != User.GetUserId())
            return Forbid();

        var lista = await _iscrizioni.FindAsync(i => i.EventoId == eventoId, ct);
        return Ok(lista);
    }

    /// <summary>
    /// Annulla l'iscrizione dell'utente corrente a un evento (soft-delete).
    /// </summary>
    /// <param name="eventoId">Id dell'evento da cui disiscriversi.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpDelete("evento/{eventoId:int}")]
    public async Task<IActionResult> Disiscriviti(int eventoId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var match = await _iscrizioni.FindAsync(
            i => i.EventoId == eventoId && i.UtenteId == userId, ct);
        var iscrizione = match.FirstOrDefault();
        if (iscrizione is null) return NotFound();

        _iscrizioni.SoftDelete(iscrizione);
        await _iscrizioni.SaveChangesAsync(ct);
        return NoContent();
    }
}
