// =============================================================================
//  FIDC.Api » Controllers » EventiController.cs
//  Endpoint per la gestione degli eventi. Mostra l'applicazione del RBAC:
//   - lettura pubblica degli eventi pubblicati;
//   - creazione/modifica riservata a SuperUser e Relatore.
//  La logica reale andrebbe in un EventoService (BLL): qui usiamo il repository
//  generico per brevità, mantenendo i Controller "sottili".
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Gestione degli eventi della Federazione (lettura pubblica, scrittura RBAC).</summary>
[ApiController]
[Route("api/[controller]")]
public class EventiController : ControllerBase
{
    private readonly IGenericRepository<Evento> _eventi;

    /// <summary>Inietta il repository degli eventi.</summary>
    public EventiController(IGenericRepository<Evento> eventi) => _eventi = eventi;

    /// <summary>Restituisce l'elenco pubblico degli eventi pubblicati. Accesso anonimo.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPubblicati(CancellationToken ct)
    {
        var lista = await _eventi.FindAsync(e => e.Pubblicato, ct);
        return Ok(lista);
    }

    /// <summary>Dettaglio di un evento per Id. Anonimo se pubblicato.</summary>
    /// <param name="id">Id dell'evento.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var evento = await _eventi.GetByIdAsync(id, ct);
        if (evento is null || !evento.Pubblicato) return NotFound();
        return Ok(evento);
    }

    /// <summary>
    /// Elenco per il backoffice: SuperUser vede TUTTI gli eventi (anche le bozze),
    /// il Relatore SOLO i propri (RBAC applicato lato server). Richiede autenticazione.
    /// </summary>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("gestione")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> GetGestione(CancellationToken ct)
    {
        var lista = User.IsSuperUser()
            ? await _eventi.GetAllAsync(ct)
            : await _eventi.FindAsync(e => e.RelatoreId == User.GetUserId(), ct);

        return Ok(lista.OrderByDescending(e => e.DataInizio));
    }

    /// <summary>
    /// Crea un nuovo evento. Riservato a SuperUser e Relatore (RBAC).
    /// Il Relatore diventa automaticamente proprietario dell'evento creato.
    /// </summary>
    /// <param name="evento">Dati dell'evento da creare.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPost]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Crea([FromBody] Evento evento, CancellationToken ct)
    {
        evento.RelatoreId = User.GetUserId();     // ownership forzata dal token
        await _eventi.AddAsync(evento, ct);
        await _eventi.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = evento.Id }, evento);
    }
    /// <summary>
    /// Aggiorna un evento. SuperUser su qualsiasi evento; il Relatore solo sui
    /// propri (controllo di ownership). Il proprietario non è modificabile.
    /// </summary>
    /// <param name="id">Id dell'evento da aggiornare.</param>
    /// <param name="aggiornato">Nuovi valori dell'evento.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Aggiorna(int id, [FromBody] Evento aggiornato, CancellationToken ct)
    {
        var esistente = await _eventi.GetByIdAsync(id, ct);
        if (esistente is null) return NotFound();

        // RBAC ownership: un Relatore può modificare solo i propri eventi.
        if (!User.IsSuperUser() && esistente.RelatoreId != User.GetUserId())
            return Forbid();

        esistente.Titolo = aggiornato.Titolo;
        esistente.Sottotitolo = aggiornato.Sottotitolo;
        esistente.Descrizione = aggiornato.Descrizione;
        esistente.Pilastro = aggiornato.Pilastro;
        esistente.DataInizio = aggiornato.DataInizio;
        esistente.DataFine = aggiornato.DataFine;
        esistente.Luogo = aggiornato.Luogo;
        esistente.PostiTotali = aggiornato.PostiTotali;
        esistente.Pubblicato = aggiornato.Pubblicato;

        _eventi.Update(esistente);
        await _eventi.SaveChangesAsync(ct);
        return Ok(esistente);
    }

    /// <summary>
    /// Elimina (soft-delete) un evento. SuperUser su qualsiasi evento, il
    /// Relatore solo sui propri.
    /// </summary>
    /// <param name="id">Id dell'evento da eliminare.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Elimina(int id, CancellationToken ct)
    {
        var evento = await _eventi.GetByIdAsync(id, ct);
        if (evento is null) return NotFound();

        if (!User.IsSuperUser() && evento.RelatoreId != User.GetUserId())
            return Forbid();

        _eventi.SoftDelete(evento);
        await _eventi.SaveChangesAsync(ct);
        return NoContent();
    }
}
