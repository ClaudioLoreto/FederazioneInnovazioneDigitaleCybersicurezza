// =============================================================================
//  FIDC.Api » Controllers » DocumentiController.cs
//  AREA DOCUMENTI con RBAC:
//   - lettura pubblica dei documenti con Visibilita = Pubblico (anonimo);
//   - elenco gestione: SuperUser tutti, Relatore solo i propri;
//   - creazione/modifica/eliminazione riservate (ownership come Eventi/News).
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.Entities;
using FIDC.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Gestione dell'Area Documenti (lettura pubblica, scrittura RBAC).</summary>
[ApiController]
[Route("api/[controller]")]
public class DocumentiController : ControllerBase
{
    private readonly IGenericRepository<Documento> _documenti;

    /// <summary>Inietta il repository dei documenti.</summary>
    public DocumentiController(IGenericRepository<Documento> documenti) => _documenti = documenti;

    /// <summary>Elenco pubblico dei documenti con visibilità "Pubblico". Anonimo.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPubblici(CancellationToken ct)
    {
        var lista = await _documenti.FindAsync(d => d.Visibilita == VisibilitaDocumento.Pubblico, ct);
        return Ok(lista.OrderByDescending(d => d.CreatedAt));
    }

    /// <summary>
    /// Elenco per l'AREA RISERVATA (biblioteca documenti dei soci): qualsiasi
    /// utente autenticato può consultare e scaricare TUTTI i documenti, sia
    /// pubblici sia riservati. Sola lettura (nessuna azione di gestione).
    /// </summary>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("riservati")]
    [Authorize]
    public async Task<IActionResult> GetRiservati(CancellationToken ct)
    {
        var lista = await _documenti.GetAllAsync(ct);
        return Ok(lista.OrderByDescending(d => d.CreatedAt));
    }

    /// <summary>
    /// Elenco per il backoffice: SuperUser vede TUTTI i documenti, il Relatore
    /// SOLO quelli da lui caricati (RBAC ownership). Richiede autenticazione.
    /// </summary>
    [HttpGet("gestione")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> GetGestione(CancellationToken ct)
    {
        var lista = User.IsSuperUser()
            ? await _documenti.GetAllAsync(ct)
            : await _documenti.FindAsync(d => d.CaricatoDaId == User.GetUserId(), ct);

        return Ok(lista.OrderByDescending(d => d.CreatedAt));
    }

    /// <summary>Crea un documento. L'owner è forzato all'utente corrente.</summary>
    /// <param name="documento">Metadati del documento.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPost]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Crea([FromBody] Documento documento, CancellationToken ct)
    {
        documento.CaricatoDaId = User.GetUserId();   // ownership forzata dal token
        documento.CaricatoDa = null;                 // evita insert accidentali sulla navigazione
        await _documenti.AddAsync(documento, ct);
        await _documenti.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetGestione), new { id = documento.Id }, documento);
    }

    /// <summary>Aggiorna un documento. SuperUser su tutti, Relatore solo sui propri.</summary>
    /// <param name="id">Id del documento.</param>
    /// <param name="aggiornato">Nuovi valori.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Aggiorna(int id, [FromBody] Documento aggiornato, CancellationToken ct)
    {
        var esistente = await _documenti.GetByIdAsync(id, ct);
        if (esistente is null) return NotFound();

        if (!User.IsSuperUser() && esistente.CaricatoDaId != User.GetUserId())
            return Forbid();

        esistente.Titolo = aggiornato.Titolo;
        esistente.Descrizione = aggiornato.Descrizione;
        esistente.Url = aggiornato.Url;
        esistente.Categoria = aggiornato.Categoria;
        esistente.Visibilita = aggiornato.Visibilita;

        _documenti.Update(esistente);
        await _documenti.SaveChangesAsync(ct);
        return Ok(esistente);
    }

    /// <summary>Elimina (soft-delete) un documento. SuperUser su tutti, Relatore sui propri.</summary>
    /// <param name="id">Id del documento.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperUser,Relatore")]
    public async Task<IActionResult> Elimina(int id, CancellationToken ct)
    {
        var doc = await _documenti.GetByIdAsync(id, ct);
        if (doc is null) return NotFound();

        if (!User.IsSuperUser() && doc.CaricatoDaId != User.GetUserId())
            return Forbid();

        _documenti.SoftDelete(doc);
        await _documenti.SaveChangesAsync(ct);
        return NoContent();
    }
}
