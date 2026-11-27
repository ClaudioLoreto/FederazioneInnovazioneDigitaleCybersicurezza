// =============================================================================
//  frontend/src/app/shared/illustrazioni/illustrazione.component.ts
//
//  A COSA SERVE
//  Illustrazioni di persone al lavoro, una per ogni ambito della Federazione:
//
//      <fidc-illustrazione scena="analisi"></fidc-illustrazione>
//
//  Un visitatore che non conosce la Federazione capisce di cosa si occupa
//  prima ancora di leggere: qualcuno espone un progetto, una relatrice parla
//  a una sala, un docente spiega, una ricercatrice studia dei dati.
//
//  COME È FATTA (versione 2, novembre 2026)
//  La prima versione accostava cerchi e rettangoli e sembrava fatta da un
//  robot. Ora c'è un manichino unico (figura.ts) con proporzioni umane, arti
//  rastremati, mani, capelli, abiti e pose; le scene (scene.ts) lo mettono in
//  posa dentro un ambiente. Aggiungere una scena = scrivere una funzione.
//
//  REGOLE DELLA FAMIGLIA
//  1. Riquadro 320 × 220 per tutte, stesso fondale viola con pavimento.
//  2. Nessun tratto del viso; un solo tono di pelle per tutti (vedi figura.ts).
//  3. Sono vignette autonome, come gli emblemi: usano i 4 colori istituzionali
//     (--c-*) e non i token del velo, così restano leggibili su ogni fondo.
//  4. Decorative: aria-hidden, il testo accanto dice già tutto.
//  5. Un solo elemento si muove per scena (classe .vivo), si ferma con
//     prefers-reduced-motion.
// =============================================================================

import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SCENE } from './scene';

/** Le scene disponibili. Il nome dice cosa stanno facendo le persone. */
export type ScenaIllustrazione =
  | 'gruppo-di-lavoro'   // mappa di progetto alla lavagna        → Attività
  | 'conferenza'         // relatrice, schermo, pubblico          → Eventi
  | 'formazione'         // docente e allievi al portatile        → Formazione
  | 'analisi'            // dati ai monitor                       → Ricerca
  | 'consulenza';        // colloquio uno a uno                   → Consulenza

/** Markup già calcolato: ogni scena si genera una volta sola per sessione. */
const cache = new Map<ScenaIllustrazione, string>();

@Component({
  selector: 'fidc-illustrazione',
  standalone: true,
  // Il markup arriva da innerHTML, quindi gli stili non possono essere
  // incapsulati: sono tutti sotto il prefisso .fidc-ill per non uscire.
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg viewBox="0 0 320 220" class="fidc-ill" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
         [innerHTML]="markup"></svg>
  `,
  styles: [`
    fidc-illustrazione { display: block; }
    .fidc-ill { width: 100%; height: auto; display: block; }

    /* --- ambiente --- */
    .fidc-ill .fondale { fill: var(--c-purple); }
    .fidc-ill .griglia line { stroke: rgba(255, 240, 217, .07); stroke-width: 1; }
    .fidc-ill .pavimento { fill: rgba(51, 61, 109, .35); }
    .fidc-ill .ombra { fill: rgba(51, 61, 109, .4); }
    .fidc-ill .pannello, .fidc-ill .arredo { fill: var(--c-deep-blue); }
    .fidc-ill .banco { fill: var(--c-deep-blue); }
    .fidc-ill .bordo-banco { fill: rgba(255, 240, 217, .14); }
    .fidc-ill .arredo-linea { fill: none; stroke: var(--c-deep-blue); stroke-width: 4; stroke-linecap: round; }
    .fidc-ill .sedia path, .fidc-ill .sedia rect { fill: var(--c-deep-blue); }
    .fidc-ill .sedia .sedia-gambe { fill: none; stroke: var(--c-deep-blue); stroke-width: 3; stroke-linecap: round; }
    .fidc-ill .nota { fill: var(--c-peach); }
    .fidc-ill .nota.chiara { fill: var(--c-cream); }
    .fidc-ill .filo { fill: none; stroke: var(--c-peach); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; opacity: .8; }
    .fidc-ill .laptop { fill: var(--c-cream); }
    .fidc-ill .laptop-luce { fill: none; stroke: var(--c-peach); stroke-width: 1.6; stroke-linecap: round; }
    .fidc-ill .laptop-display { fill: var(--c-deep-blue); }
    .fidc-ill .tazza-fascia { fill: var(--c-purple); }
    .fidc-ill .vapore { fill: none; stroke: var(--c-cream); stroke-width: 1.2; stroke-linecap: round; opacity: .55; }
    .fidc-ill .tablet-schermo { fill: var(--c-peach); }
    .fidc-ill .logo { fill: var(--c-purple); }
    .fidc-ill .foglia { fill: var(--c-deep-blue); }
    .fidc-ill .foglia.chiara { fill: var(--c-peach); }
    .fidc-ill .vaso, .fidc-ill .tazza-corpo { fill: var(--c-cream); }
    .fidc-ill .schermo-scudo { fill: var(--c-purple); stroke: var(--c-cream); stroke-width: 2; }
    .fidc-ill .schermo-spunta { fill: none; stroke: var(--c-peach); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .fidc-ill .riga-chiara { fill: var(--c-cream); }
    .fidc-ill .riga { fill: var(--c-peach); opacity: .7; }
    .fidc-ill .cursore-codice, .fidc-ill .lucchetto-corpo, .fidc-ill .logo-leggio { fill: var(--c-peach); }
    .fidc-ill .lucchetto-arco { fill: none; stroke: var(--c-peach); stroke-width: 3.4; }
    .fidc-ill .lucchetto-foro { fill: var(--c-deep-blue); }
    .fidc-ill .barra { fill: var(--c-peach); }
    .fidc-ill .b2, .fidc-ill .b4 { fill: var(--c-cream); }
    .fidc-ill .tablet-corpo { fill: var(--c-deep-blue); stroke: var(--c-cream); stroke-width: 1.6; }

    /* --- persone --- */
    .fidc-ill .pelle { fill: var(--c-peach); }
    .fidc-ill .busto.a-blu, .fidc-ill .manica.a-blu, .fidc-ill .risvolto.a-blu, .fidc-ill .gamba.p-blu,
    .fidc-ill .scarpa.s-blu, .fidc-ill .capelli.h-blu, .fidc-ill .c-blu, .fidc-ill .g-blu { fill: var(--c-deep-blue); }
    .fidc-ill .busto.a-crema, .fidc-ill .manica.a-crema, .fidc-ill .risvolto.a-crema, .fidc-ill .gamba.p-crema,
    .fidc-ill .scarpa.s-crema, .fidc-ill .capelli.h-crema, .fidc-ill .c-crema, .fidc-ill .g-crema { fill: var(--c-cream); }
    .fidc-ill .busto.a-pesca, .fidc-ill .manica.a-pesca, .fidc-ill .risvolto.a-pesca { fill: var(--c-peach); }
    .fidc-ill .busto.a-viola, .fidc-ill .manica.a-viola, .fidc-ill .c-viola, .fidc-ill .capelli.h-viola { fill: var(--c-purple); }
    .fidc-ill .risvolto { stroke: rgba(51, 61, 109, .25); stroke-width: .8; }
    /* Profilo delle maniche: solo dove la manica è chiara come il busto. */
    .fidc-ill .profilo { display: none; }
    .fidc-ill .profilo.manica.a-crema, .fidc-ill .profilo.manica.a-pesca { display: inline; stroke: rgba(51, 61, 109, .28); stroke-width: 1.6; }
    .fidc-ill .profilo.manica.a-blu { display: inline; stroke: rgba(255, 240, 217, .16); stroke-width: 1.6; }
    .fidc-ill .laccio { fill: none; stroke: var(--c-peach); stroke-width: 1.4; }
    .fidc-ill .badge { fill: var(--c-cream); }
    .fidc-ill .badge-riga { fill: var(--c-purple); }
    /* Dettagli: tratti sottili nel tono dell'abito. */
    .fidc-ill .tratto { fill: none; stroke-width: .9; stroke-linecap: round; stroke-linejoin: round; }
    .fidc-ill .tratto.segno-scuro { stroke: rgba(51, 61, 109, .32); }
    .fidc-ill .tratto.segno-chiaro { stroke: rgba(255, 240, 217, .24); }
    .fidc-ill .tratto.ciocca.segno-chiaro { stroke: rgba(255, 240, 217, .3); }
    .fidc-ill .suola { stroke-width: 1.2; }
    .fidc-ill .volume { fill: var(--c-deep-blue); opacity: .11; }
    .fidc-ill .luce { fill: var(--c-cream); opacity: .1; }
    .fidc-ill .ombra-collo { fill: var(--c-deep-blue); opacity: .22; }
    .fidc-ill .colletto { stroke-width: .7; stroke-linejoin: round; }
    .fidc-ill .colletto.segno-scuro { stroke: rgba(51, 61, 109, .35); }
    .fidc-ill .colletto.segno-chiaro { stroke: rgba(255, 240, 217, .3); }
    .fidc-ill .bottone.segno-scuro { fill: rgba(51, 61, 109, .55); }
    .fidc-ill .bottone.segno-chiaro { fill: rgba(255, 240, 217, .5); }
    .fidc-ill .f-pesca, .fidc-ill .fibbia { fill: var(--c-peach); }
    .fidc-ill .cintura.segno-scuro { fill: var(--c-deep-blue); }
    .fidc-ill .cintura.segno-chiaro { fill: rgba(255, 240, 217, .16); }
    .fidc-ill .orologio { fill: var(--c-deep-blue); }
    .fidc-ill .quadrante, .fidc-ill .orecchino { fill: var(--c-cream); }
    .fidc-ill .occhiali { fill: none; stroke: var(--c-deep-blue); stroke-width: 1.3; stroke-linejoin: round; }

    /* --- l'unico movimento di ogni scena --- */
    .fidc-ill .nota.nuova.vivo { transform-box: fill-box; transform-origin: center; animation: ill-nota 6s ease-in-out infinite; }
    .fidc-ill .traccia.vivo { stroke-dasharray: 70; animation: ill-traccia 6s ease-in-out infinite; }
    .fidc-ill .cursore-codice.vivo { animation: ill-cursore 1.1s steps(1) infinite; }
    .fidc-ill .grafico.vivo .barra { transform-box: fill-box; transform-origin: bottom; animation: ill-barra 5s ease-in-out infinite; }
    .fidc-ill .grafico.vivo .b2 { animation-delay: .5s; }
    .fidc-ill .grafico.vivo .b3 { animation-delay: 1s; }
    .fidc-ill .grafico.vivo .b4 { animation-delay: 1.5s; }
    .fidc-ill .respira.vivo { animation: ill-respira 4s ease-in-out infinite; }
    @keyframes ill-nota { 0%, 40% { opacity: 0; transform: scale(.6); } 55%, 100% { opacity: 1; transform: none; } }
    @keyframes ill-traccia { from { stroke-dashoffset: 70; } 50%, to { stroke-dashoffset: 0; } }
    @keyframes ill-cursore { 50% { opacity: 0; } }
    @keyframes ill-barra { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(.62); } }
    @keyframes ill-respira { 50% { stroke: var(--c-peach); } }
    @media (prefers-reduced-motion: reduce) {
      .fidc-ill .vivo, .fidc-ill .vivo * { animation: none !important; opacity: 1 !important; stroke-dashoffset: 0 !important; }
    }
  `]
})
export class IllustrazioneComponent {
  private readonly sanitizer = inject(DomSanitizer);
  markup: SafeHtml = '';

  /** Quale scena disegnare. */
  @Input({ required: true }) set scena(nome: ScenaIllustrazione) {
    if (!cache.has(nome)) cache.set(nome, (SCENE[nome] ?? SCENE.analisi)());
    // Markup prodotto dal nostro codice a partire da costanti: non contiene
    // nulla che arrivi dall'utente o dal server, quindi è sicuro fidarsene.
    this.markup = this.sanitizer.bypassSecurityTrustHtml(cache.get(nome)!);
  }
}
