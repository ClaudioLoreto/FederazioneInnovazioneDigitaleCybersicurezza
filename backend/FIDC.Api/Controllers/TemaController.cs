// =============================================================================
//  FIDC.Api » Controllers » TemaController.cs
//  THEME BUILDER — lettura e salvataggio del "velo" (tema) del portale su DB.
//   - GET  /api/tema/attivo  → pubblico: il sito legge il velo da applicare.
//   - PUT  /api/tema         → solo SuperUser: salva/aggiorna il velo attivo.
//
//  VINCOLO PALETTE FERREA: i colori accettati sono ESCLUSIVAMENTE i 4 della
//  palette FIDC. Qualsiasi valore fuori palette viene rifiutato (400), così il
//  brand resta blindato anche lato server (non ci si fida del solo client).
// =============================================================================

using FIDC.Dal.Repositories;
using FIDC.Models.DTOs;
using FIDC.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FIDC.Api.Controllers;

/// <summary>Gestione del tema/velo del portale (Theme Builder del backoffice).</summary>
[ApiController]
[Route("api/[controller]")]
public class TemaController : ControllerBase
{
    private readonly IGenericRepository<ImpostazioneTema> _temi;

    /// <summary>I 4 colori ammessi dalla palette FERREA FIDC (nessun altro).</summary>
    private static readonly HashSet<string> PaletteAmmessa = new(StringComparer.OrdinalIgnoreCase)
    {
        "#333D6D", "#723EC3", "#FFCF95", "#FFF0D9"
    };

    private static readonly HashSet<string> RaggiAmmessi = new(StringComparer.OrdinalIgnoreCase)
    { "sharp", "soft", "rounded" };

    private static readonly HashSet<string> FontAmmessi = new(StringComparer.OrdinalIgnoreCase)
    { "cyber", "moderno", "classico" };

    private static readonly HashSet<string> TemiBaseAmmessi = new() { "1", "2", "3" };

    /// <summary>Inietta il repository delle impostazioni tema.</summary>
    public TemaController(IGenericRepository<ImpostazioneTema> temi) => _temi = temi;

    /// <summary>
    /// Restituisce il velo attualmente attivo (pubblico). Se non esiste ancora
    /// alcuna configurazione, ritorna un default coerente col Tema 1 approvato.
    /// </summary>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpGet("attivo")]
    [AllowAnonymous]
    public async Task<ActionResult<TemaConfigDto>> GetAttivo(CancellationToken ct)
    {
        var attivo = (await _temi.FindAsync(t => t.Attivo, ct)).FirstOrDefault();
        return Ok(attivo is null ? Default() : ToDto(attivo));
    }

    /// <summary>
    /// Salva (upsert) il velo attivo. Riservato al SuperUser. Valida i colori
    /// contro la palette FERREA e gli enum di raggio/font.
    /// </summary>
    /// <param name="dto">Configurazione del velo da applicare.</param>
    /// <param name="ct">Token di cancellazione.</param>
    [HttpPut]
    [Authorize(Roles = "SuperUser")]
    public async Task<ActionResult<TemaConfigDto>> Salva([FromBody] TemaConfigDto dto, CancellationToken ct)
    {
        // --- Validazione server-side (brand blindato) -------------------------
        if (!TemiBaseAmmessi.Contains(dto.TemaBase))
            return BadRequest(new { messaggio = "Tema base non valido (ammessi: 1, 2, 3)." });

        foreach (var (colore, campo) in new[]
                 {
                     (dto.ColorePrimario, "Colore primario"),
                     (dto.ColoreAccento, "Colore accento"),
                     (dto.ColoreSfondo, "Colore sfondo"),
                     (dto.ColoreTesto, "Colore testo")
                 })
        {
            if (!PaletteAmmessa.Contains(colore))
                return BadRequest(new { messaggio = $"{campo} fuori palette FIDC. Ammessi solo i 4 colori istituzionali." });
        }

        if (!RaggiAmmessi.Contains(dto.StileRaggio))
            return BadRequest(new { messaggio = "Stile raggio non valido (sharp | soft | rounded)." });
        if (!FontAmmessi.Contains(dto.AbbinamentoFont))
            return BadRequest(new { messaggio = "Abbinamento font non valido (cyber | moderno | classico)." });

        // --- Upsert della riga attiva (una sola configurazione applicata) ------
        var attivo = (await _temi.FindAsync(t => t.Attivo, ct)).FirstOrDefault();
        if (attivo is null)
        {
            attivo = new ImpostazioneTema { Nome = "Tema FIDC", Attivo = true };
            await _temi.AddAsync(attivo, ct);
        }

        attivo.TemaBase = dto.TemaBase;
        attivo.Personalizzato = dto.Personalizzato;
        attivo.ColorePrimario = dto.ColorePrimario.ToUpperInvariant();
        attivo.ColoreAccento = dto.ColoreAccento.ToUpperInvariant();
        attivo.ColoreSfondo = dto.ColoreSfondo.ToUpperInvariant();
        attivo.ColoreTesto = dto.ColoreTesto.ToUpperInvariant();
        attivo.StileRaggio = dto.StileRaggio.ToLowerInvariant();
        attivo.AbbinamentoFont = dto.AbbinamentoFont.ToLowerInvariant();

        _temi.Update(attivo);
        await _temi.SaveChangesAsync(ct);

        return Ok(ToDto(attivo));
    }

    // --- helpers ------------------------------------------------------------

    /// <summary>Mappa l'entità sul DTO scambiato col client.</summary>
    private static TemaConfigDto ToDto(ImpostazioneTema t) => new(
        t.TemaBase, t.Personalizzato,
        t.ColorePrimario, t.ColoreAccento, t.ColoreSfondo, t.ColoreTesto,
        t.StileRaggio, t.AbbinamentoFont);

    /// <summary>Default coerente col Tema 1 istituzionale approvato.</summary>
    private static TemaConfigDto Default() => new(
        "1", false, "#723EC3", "#FFCF95", "#FFF0D9", "#333D6D", "soft", "cyber");
}
