// =============================================================================
//  FIDC.Api » Controllers » NewsController.cs
//  Backoffice delle news con RBAC:
//   - lettura pubblica delle news pubblicate (anonimo);
//   - creazione riservata a SuperUser e Relatore (l'autore = utente corrente);
//   - modifica/eliminazione: SuperUser su tutto, Relatore SOLO sulle proprie.
//  Il controller resta sottile: usa il repository generico e l'helper RBAC.
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Gestione delle news (lettura pubblica, scrittura con RBAC e ownership).</summary>
[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly IGenericRepository<News> _news;

    /// <summary>Inietta il repository delle news.</summary>
    public NewsController(IGenericRepository<News> news) => _news = news;

    /// <summary>Elenco pubblico delle news pubblicate, dalla più recente. Accesso anonimo.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPubblicate(CancellationToken ct)
    {
        var lista = await _news.FindAsync(n => n.Pubblicato, ct);
        return Ok(lista.OrderByDescending(n => n.DataPubblicazione));
    }

    /// <summary>Dettaglio di una news per Id. Accesso anonimo se pubblicata.</summary>
    /// <param name="id">Id della news.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var news = await _news.GetByIdAsync(id, ct);
        if (news is null || !news.Pubblicato) return NotFound();
        return Ok(news);
    }

    /// <summary>
    /// Elenco per il backoffice: SuperUser vede TUTTE le news (anche le bozze),
    /// il Relatore SOLO le proprie (RBAC applicato lato server). Richiede autenticazione.
    /// </summary>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("gestione")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> GetGestione(CancellationToken ct)
    {
        var lista = User.IsSuperUser()
            ? await _news.GetAllAsync(ct)
            : await _news.FindAsync(n => n.AutoreId == User.GetUserId(), ct);

        return Ok(lista.OrderByDescending(n => n.DataPubblicazione ?? DateTime.MinValue));
    }

    /// <summary>
    /// Crea una news. Riservato a SuperUser e Relatore: l'autore viene impostato
    /// automaticamente all'utente corrente (un Relatore non può "intestare" news ad altri).
    /// </summary>
    /// <param name="news">Dati della news da creare.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPost]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Crea([FromBody] News news, CancellationToken ct)
    {
        news.AutoreId = User.GetUserId();      // ownership forzata dal token
        await _news.AddAsync(news, ct);
        await _news.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = news.Id }, news);
    }

    /// <summary>
    /// Aggiorna una news. SuperUser può modificare qualsiasi news; il Relatore
    /// solo quelle di cui è autore (controllo di ownership).
    /// </summary>
    /// <param name="id">Id della news da aggiornare.</param>
    /// <param name="aggiornata">Nuovi valori della news.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Aggiorna(int id, [FromBody] News aggiornata, CancellationToken ct)
    {
        var esistente = await _news.GetByIdAsync(id, ct);
        if (esistente is null) return NotFound();

        // RBAC ownership: un Relatore può toccare solo le proprie news.
        if (!User.IsSuperUser() && esistente.AutoreId != User.GetUserId())
            return Forbid();

        // Aggiorna i campi editabili (l'autore NON è modificabile).
        esistente.Titolo = aggiornata.Titolo;
        esistente.Sommario = aggiornata.Sommario;
        esistente.Contenuto = aggiornata.Contenuto;
        esistente.Slug = aggiornata.Slug;
        esistente.Pilastro = aggiornata.Pilastro;
        esistente.ImmagineCopertina = aggiornata.ImmagineCopertina;
        esistente.Pubblicato = aggiornata.Pubblicato;
        esistente.DataPubblicazione = aggiornata.DataPubblicazione;

        _news.Update(esistente);
        await _news.SaveChangesAsync(ct);
        return Ok(esistente);
    }

    /// <summary>
    /// Elimina (soft-delete) una news. SuperUser su tutto, Relatore solo sulle proprie.
    /// </summary>
    /// <param name="id">Id della news da eliminare.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Elimina(int id, CancellationToken ct)
    {
        var news = await _news.GetByIdAsync(id, ct);
        if (news is null) return NotFound();

        if (!User.IsSuperUser() && news.AutoreId != User.GetUserId())
            return Forbid();

        _news.SoftDelete(news);
        await _news.SaveChangesAsync(ct);
        return NoContent();
    }
}
