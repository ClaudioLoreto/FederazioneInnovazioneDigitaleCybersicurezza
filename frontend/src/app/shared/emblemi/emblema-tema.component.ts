// =============================================================================
//  frontend/src/app/shared/emblemi/emblema-tema.component.ts
//  FAMIGLIA DI EMBLEMI — "come lo scudo, ma uno per ogni tema".
//
//  Tutti condividono la stessa piastra a scudo (bordo sfumato viola → pesca,
//  alone, linea di scansione) e lo stesso tratto per il simbolo interno: così
//  sembrano un sistema, non icone raccolte qua e là. Cambia solo il simbolo,
//  e ognuno ha un significato preciso, comprensibile senza spiegazioni:
//
//    verifica    scudo con spunta     sicurezza, chi siamo
//    lucchetto   lucchetto chiuso     area riservata, accesso
//    chiave      chiave               credenziali, recupero password
//    impronta    impronta digitale    identità, registrazione
//    rete        nodi collegati       la Federazione, mettere in rete
//    documento   documento sigillato  area documenti, atti
//    bilancia    bilancia             pagine legali, regole
//    libro       libro aperto         formazione
//    grafico     barre crescenti      ricerca, osservatori
//    chip        processore           innovazione
//    calendario  calendario           eventi
//    persona     busto                area personale
//    busta       busta                newsletter
//    bussola     bussola              indirizzo, direzione strategica
//    radar       radar                osservatorio, monitoraggio
//
//  Movimento: il simbolo si traccia una volta, quando l'emblema entra nella
//  finestra. Solo gli emblemi protagonisti (`vivo`, es. "Chi siamo" o la
//  pagina di accesso) hanno anche il respiro dell'alone e la scansione lenta:
//  tanti emblemi che pulsano insieme sarebbero rumore. Con
//  prefers-reduced-motion è tutto fermo e già disegnato.
//  Colori fissi della palette (vignetta autonoma, come gli altri emblemi).
// =============================================================================

import { AfterViewInit, Component, ElementRef, OnDestroy, inject, input } from '@angular/core';

export type TemaEmblema =
  | 'verifica' | 'lucchetto' | 'chiave' | 'impronta' | 'rete' | 'documento' | 'bilancia'
  | 'libro' | 'grafico' | 'chip' | 'calendario' | 'persona' | 'busta' | 'bussola' | 'radar';

let contatore = 0;

@Component({
  selector: 'fidc-emblema-tema',
  standalone: true,
  host: { '[class.visto]': 'visto', '[class.vivo]': 'vivo()' },
  template: `
    <svg viewBox="0 0 120 140" class="em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient [attr.id]="id + 'b'" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#723EC3"/><stop offset="100%" stop-color="#FFCF95"/>
        </linearGradient>
        <clipPath [attr.id]="id + 'c'"><path [attr.d]="piastra"/></clipPath>
      </defs>
      <path class="alone" [attr.d]="piastra"/>
      <path class="piastra" [attr.d]="piastra" [attr.stroke]="'url(#' + id + 'b)'"/>
      <g [attr.clip-path]="'url(#' + id + 'c)'"><rect class="scan" x="12" y="10" width="96" height="7"/></g>

      <g class="segno">
        @switch (tipo()) {
          @case ('verifica') { <path pathLength="100" d="M40 70 L55 86 L84 52"/> }
          @case ('lucchetto') {
            <path pathLength="100" d="M46 64 V55 a14 14 0 0 1 28 0 V64"/>
            <rect pathLength="100" x="38" y="64" width="44" height="32" rx="6"/>
            <circle class="pieno" cx="60" cy="78" r="4"/><path pathLength="100" class="fine" d="M60 81 V88"/>
          }
          @case ('chiave') {
            <circle pathLength="100" cx="47" cy="58" r="12"/>
            <path pathLength="100" d="M56 67 L84 95 M74 85 L81 78 M80 91 L86 85"/>
          }
          @case ('impronta') {
            <path pathLength="100" class="fine" d="M41 82 C37 61 47 46 60 46 C73 46 83 57 81 75"/>
            <path pathLength="100" class="fine" d="M48 92 C43 79 45 58 60 58 C72 58 74 71 71 84"/>
            <path pathLength="100" class="fine" d="M58 98 C54 87 53 70 60 70 C66 70 65 82 65 92"/>
            <path pathLength="100" class="fine" d="M80 85 C79 90 77 95 73 99"/>
          }
          @case ('rete') {
            <path pathLength="100" class="fine" d="M60 46 L80.8 58 L80.8 82 L60 94 L39.2 82 L39.2 58 Z M60 46 V94 M39.2 58 L80.8 82 M80.8 58 L39.2 82"/>
            @for (n of nodi; track $index) { <circle class="pieno" [attr.cx]="n[0]" [attr.cy]="n[1]" r="4.6"/> }
            <circle class="pieno" cx="60" cy="70" r="6.5"/>
          }
          @case ('documento') {
            <path pathLength="100" d="M42 44 H67 L78 55 V96 H42 Z M67 44 V55 H78"/>
            <path pathLength="100" class="fine" d="M49 64 H71 M49 72 H71 M49 80 H62"/>
            <circle class="pieno" cx="75" cy="92" r="9"/><path class="incavo" d="M71 92 L74 95 L79.5 89"/>
          }
          @case ('bilancia') {
            <path pathLength="100" d="M60 48 V94 M46 94 H74 M38 58 H82"/>
            <path pathLength="100" class="fine" d="M38 58 L31 76 M38 58 L45 76 M31 76 C33 82 43 82 45 76 Z M82 58 L75 76 M82 58 L89 76 M75 76 C77 82 87 82 89 76 Z"/>
            <circle class="pieno" cx="60" cy="48" r="4"/>
          }
          @case ('libro') {
            <path pathLength="100" d="M60 57 C52 51 43 50 36 52 V90 C43 88 52 89 60 95 C68 89 77 88 84 90 V52 C77 50 68 51 60 57 Z M60 57 V95"/>
          }
          @case ('grafico') {
            <path pathLength="100" class="fine" d="M40 50 V94 H84"/>
            <path pathLength="100" d="M52 88 V76 M63 88 V66 M74 88 V56"/>
          }
          @case ('chip') {
            <rect pathLength="100" x="43" y="53" width="34" height="34" rx="4"/>
            <rect class="pieno" x="52" y="62" width="16" height="16" rx="2"/>
            <path pathLength="100" class="fine" d="M51 53 V45 M60 53 V45 M69 53 V45 M51 87 V95 M60 87 V95 M69 87 V95 M43 61 H35 M43 70 H35 M43 79 H35 M77 61 H85 M77 70 H85 M77 79 H85"/>
          }
          @case ('calendario') {
            <rect pathLength="100" x="38" y="52" width="44" height="42" rx="5"/>
            <path pathLength="100" class="fine" d="M38 63 H82 M50 46 V57 M70 46 V57"/>
            <path pathLength="100" d="M49 78 L56 85 L71 71"/>
          }
          @case ('persona') {
            <circle pathLength="100" cx="60" cy="60" r="11"/>
            <path pathLength="100" d="M40 94 C40 80 49 74 60 74 C71 74 80 80 80 94"/>
          }
          @case ('bussola') {
            <circle pathLength="100" cx="60" cy="70" r="23"/>
            <path class="pieno" d="M60 51 L66 70 L60 74 L54 70 Z"/>
            <path class="tratto-pieno" d="M60 89 L54 70 L60 66 L66 70 Z"/>
            <path pathLength="100" class="fine" d="M60 42 V46 M60 94 V98 M32 70 H36 M84 70 H88"/>
          }
          @case ('radar') {
            <circle pathLength="100" cx="60" cy="70" r="24"/>
            <circle pathLength="100" class="fine" cx="60" cy="70" r="13"/>
            <path pathLength="100" d="M60 70 L77 53"/>
            <circle class="pieno" cx="70" cy="80" r="3.6"/><circle class="pieno" cx="48" cy="62" r="2.8"/>
          }
          @case ('busta') {
            <rect pathLength="100" x="38" y="54" width="44" height="32" rx="4"/>
            <path pathLength="100" d="M39 57 L60 73 L81 57"/>
          }
        }
      </g>
    </svg>
  `,
  styles: [`
    :host { display: block; }
    .em { width: 100%; height: auto; display: block; overflow: visible; }
    .alone { fill: #723EC3; opacity: .16; transform-box: fill-box; transform-origin: center; }
    .piastra { fill: #333D6D; stroke-width: 3; }
    .scan { fill: #FFCF95; opacity: 0; }
    :host(.vivo) .alone { animation: alone 3.6s ease-in-out infinite; }
    :host(.vivo) .scan { animation: scan 5s ease-in-out infinite; }
    .segno path, .segno rect, .segno circle:not(.pieno) {
      fill: none; stroke: #FFCF95; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 100; stroke-dashoffset: 100;
    }
    :host(.visto) .segno path, :host(.visto) .segno rect, :host(.visto) .segno circle:not(.pieno) { animation: traccia 1.1s ease forwards .2s; }
    .segno .fine { stroke-width: 4; }
    .segno .tratto-pieno { fill: none; stroke: #FFCF95; stroke-width: 2.6; stroke-linejoin: round; stroke-dasharray: none; stroke-dashoffset: 0; opacity: 0; }
    .segno .pieno { fill: #FFCF95; stroke: none; opacity: 0; }
    .segno .incavo { fill: none; stroke: #333D6D; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: none; stroke-dashoffset: 0; opacity: 0; }
    :host(.visto) .segno .pieno { animation: compare .5s ease forwards 1s; }
    :host(.visto) .segno .incavo, :host(.visto) .segno .tratto-pieno { animation: compare .4s ease forwards 1.2s; }
    @keyframes alone { 0%, 100% { opacity: .12; transform: scale(1); } 50% { opacity: .26; transform: scale(1.04); } }
    @keyframes scan { 0% { transform: translateY(0); opacity: 0; } 15%, 85% { opacity: .32; } 50% { transform: translateY(116px); } 100% { transform: translateY(0); opacity: 0; } }
    @keyframes traccia { to { stroke-dashoffset: 0; } }
    @keyframes compare { to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .alone, .scan { animation: none !important; }
      .segno path, .segno rect, .segno circle { animation: none !important; stroke-dashoffset: 0 !important; opacity: 1 !important; }
    }
  `]
})
export class EmblemaTemaComponent implements AfterViewInit, OnDestroy {
  /** Quale emblema mostrare. */
  readonly tipo = input<TemaEmblema>('verifica');
  /** Emblema protagonista: alone che respira e scansione lenta. */
  readonly vivo = input(false);

  /** Diventa true la prima volta che l'emblema entra nella finestra. */
  visto = false;
  private readonly host = inject(ElementRef<HTMLElement>);
  private osservatore?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') { this.visto = true; return; }
    this.osservatore = new IntersectionObserver((voci) => {
      if (voci.some((v) => v.isIntersecting)) {
        this.visto = true;
        this.host.nativeElement.classList.add('visto');
        this.osservatore?.disconnect();
      }
    }, { threshold: 0.4 });
    this.osservatore.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void { this.osservatore?.disconnect(); }

  /** Id univoci per sfumatura e ritaglio: più emblemi nella stessa pagina. */
  readonly id = `em${++contatore}-`;

  readonly piastra = 'M60 6 L108 24 V70 C108 104 86 124 60 134 C34 124 12 104 12 70 V24 Z';
  readonly nodi = [[60, 46], [80.8, 58], [80.8, 82], [60, 94], [39.2, 82], [39.2, 58]];
}
