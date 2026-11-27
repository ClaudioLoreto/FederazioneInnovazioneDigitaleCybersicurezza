// =============================================================================
//  frontend/src/app/shared/illustrazioni/illustrazione.component.ts
//
//  A COSA SERVE
//  Una famiglia di illustrazioni di persone al lavoro, una per ogni ambito di
//  cui si occupa la Federazione. Si usa così:
//
//      <fidc-illustrazione scena="analisi"></fidc-illustrazione>
//
//  PERCHÉ ESISTE
//  Il sito raccontava se stesso solo con cassaforti e scudi. Sono metafore di
//  protezione, e da sole dicono "qui dentro c'è qualcosa al sicuro" ma non
//  dicono *chi* fa *che cosa*. Una persona chinata su un grafico si capisce
//  senza leggere: qualcuno studia dei dati. Un tavolo con tre persone attorno:
//  qualcuno si coordina. È così che un visitatore che non ha mai sentito
//  nominare la Federazione capisce di cosa si occupa prima ancora di leggere.
//
//  LE REGOLE DELLA FAMIGLIA (da rispettare se se ne aggiunge una)
//  1. Stesso riquadro per tutte, 240 × 170: sono intercambiabili nello stesso
//     spazio senza ricalcolare i margini.
//  2. Nessun tratto del viso. Niente occhi, niente bocca, niente capelli, nessun
//     tono di pelle. Sono figure istituzionali, non personaggi: chiunque deve
//     potercisi riconoscere, e non si rischia di rappresentare una sola persona.
//  3. Colori solo dai token del tema, mai codici esadecimali. Così le
//     illustrazioni cambiano insieme al velo scelto dalla Direzione.
//  4. Geometria semplice: cerchi e rettangoli arrotondati. Un disegno complesso
//     a 240 pixel diventa una macchia.
//  5. Sono decorative: `aria-hidden`, perché il testo accanto dice già tutto e
//     un lettore di schermo non deve leggere due volte la stessa cosa.
//  6. Al massimo un movimento lento per scena, e si ferma con
//     `prefers-reduced-motion`.
// =============================================================================

import { Component, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

/** Le scene disponibili. Il nome dice cosa stanno facendo le persone. */
export type ScenaIllustrazione =
  | 'gruppo-di-lavoro'   // tavoli tecnici, coordinamento          → Attività
  | 'conferenza'         // relatore e pubblico                    → Eventi
  | 'formazione'         // aula, lavagna, chi impara              → Formazione
  | 'analisi'            // dati al computer, osservatorio         → Ricerca
  | 'consulenza';        // affiancamento uno a uno                → Consulenza

@Component({
  selector: 'fidc-illustrazione',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase],
  template: `
    <svg viewBox="0 0 240 170" class="ill" [ngSwitch]="scena"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">

      <!-- ============ ATTIVITÀ: tre persone attorno a un tavolo ============ -->
      <g *ngSwitchCase="'gruppo-di-lavoro'">
        <!-- Persona in fondo, di spalle al fondale -->
        <circle class="testa" cx="120" cy="44" r="13"/>
        <path class="corpo" d="M100 92 q0-22 20-22 t20 22 z"/>

        <!-- Persona a sinistra -->
        <circle class="testa" cx="58" cy="62" r="13"/>
        <path class="corpo" d="M38 110 q0-22 20-22 t20 22 z"/>

        <!-- Persona a destra -->
        <circle class="testa" cx="182" cy="62" r="13"/>
        <path class="corpo" d="M162 110 q0-22 20-22 t20 22 z"/>

        <!-- Tavolo -->
        <ellipse class="piano" cx="120" cy="124" rx="82" ry="20"/>
        <ellipse class="contorno" cx="120" cy="124" rx="82" ry="20" fill="none"/>

        <!-- Documenti sul tavolo -->
        <rect class="dato" x="86" y="116" width="26" height="15" rx="2"/>
        <rect class="dato tenue" x="130" y="119" width="22" height="13" rx="2"/>
        <line class="riga" x1="90" y1="121" x2="108" y2="121"/>
        <line class="riga" x1="90" y1="126" x2="103" y2="126"/>

        <!-- Gambe del tavolo -->
        <line class="contorno" x1="120" y1="144" x2="120" y2="160"/>
        <line class="contorno" x1="104" y1="160" x2="136" y2="160"/>
      </g>

      <!-- ============ EVENTI: relatore, schermo e pubblico ============ -->
      <g *ngSwitchCase="'conferenza'">
        <!-- Schermo di sala -->
        <rect class="schermo" x="112" y="20" width="106" height="66" rx="4"/>
        <rect class="contorno" x="112" y="20" width="106" height="66" rx="4" fill="none"/>
        <line class="riga" x1="124" y1="38" x2="188" y2="38"/>
        <line class="riga" x1="124" y1="50" x2="206" y2="50"/>
        <line class="riga" x1="124" y1="62" x2="170" y2="62"/>

        <!-- Relatore al leggio -->
        <circle class="testa" cx="52" cy="46" r="13"/>
        <path class="corpo" d="M32 96 q0-24 20-24 t20 24 z"/>
        <!-- Braccio alzato: sta illustrando qualcosa -->
        <path class="arto" d="M70 82 q14-6 20-20" fill="none"/>
        <rect class="piano" x="26" y="96" width="52" height="34" rx="3"/>
        <rect class="contorno" x="26" y="96" width="52" height="34" rx="3" fill="none"/>

        <!-- Pubblico in primo piano, di spalle -->
        <g class="pubblico">
          <circle class="testa scura" cx="46" cy="148" r="11"/>
          <path class="corpo scuro" d="M28 170 q0-16 18-16 t18 16 z"/>
          <circle class="testa scura" cx="106" cy="152" r="11"/>
          <path class="corpo scuro" d="M88 170 q0-16 18-16 t18 16 z"/>
          <circle class="testa scura" cx="166" cy="148" r="11"/>
          <path class="corpo scuro" d="M148 170 q0-16 18-16 t18 16 z"/>
          <circle class="testa scura" cx="220" cy="153" r="11"/>
          <path class="corpo scuro" d="M202 170 q0-16 18-16 t18 16 z"/>
        </g>
      </g>

      <!-- ============ FORMAZIONE: lavagna, docente, allievi ============ -->
      <g *ngSwitchCase="'formazione'">
        <!-- Lavagna -->
        <rect class="schermo" x="20" y="16" width="118" height="76" rx="4"/>
        <rect class="contorno" x="20" y="16" width="118" height="76" rx="4" fill="none"/>
        <line class="riga" x1="34" y1="36" x2="104" y2="36"/>
        <line class="riga" x1="34" y1="50" x2="122" y2="50"/>
        <line class="riga" x1="34" y1="64" x2="86" y2="64"/>
        <!-- Il segno che il docente sta tracciando ora -->
        <line class="riga viva" x1="34" y1="78" x2="94" y2="78"/>

        <!-- Docente accanto alla lavagna, braccio verso il pannello -->
        <circle class="testa" cx="172" cy="42" r="13"/>
        <path class="corpo" d="M152 104 q0-30 20-30 t20 30 z"/>
        <path class="arto" d="M154 82 q-14-4-22-12" fill="none"/>

        <!-- Banchi degli allievi -->
        <g>
          <circle class="testa scura" cx="60" cy="126" r="11"/>
          <path class="corpo scuro" d="M42 150 q0-18 18-18 t18 18 z"/>
          <rect class="piano" x="34" y="150" width="52" height="6" rx="2"/>
        </g>
        <g>
          <circle class="testa scura" cx="152" cy="130" r="11"/>
          <path class="corpo scuro" d="M134 152 q0-16 18-16 t18 16 z"/>
          <rect class="piano" x="126" y="152" width="52" height="6" rx="2"/>
        </g>
      </g>

      <!-- ============ RICERCA: analisi di dati al computer ============ -->
      <g *ngSwitchCase="'analisi'">
        <!-- Monitor -->
        <rect class="schermo" x="118" y="30" width="98" height="68" rx="4"/>
        <rect class="contorno" x="118" y="30" width="98" height="68" rx="4" fill="none"/>
        <!-- Istogramma: l'unico movimento della scena -->
        <g class="grafico">
          <rect class="dato barra b1" x="132" y="66" width="14" height="24" rx="1"/>
          <rect class="dato barra b2" x="154" y="54" width="14" height="36" rx="1"/>
          <rect class="dato barra b3" x="176" y="60" width="14" height="30" rx="1"/>
          <rect class="dato barra b4" x="198" y="46" width="12" height="44" rx="1"/>
        </g>
        <line class="riga" x1="128" y1="90" x2="214" y2="90"/>
        <!-- Piedistallo del monitor -->
        <line class="contorno" x1="167" y1="98" x2="167" y2="110"/>
        <line class="contorno" x1="150" y1="110" x2="184" y2="110"/>

        <!-- Persona seduta, di tre quarti, braccio sulla scrivania -->
        <circle class="testa" cx="64" cy="52" r="14"/>
        <path class="corpo" d="M40 112 q0-30 24-30 t24 30 z"/>
        <path class="arto" d="M84 100 q16 2 26 10" fill="none"/>
        <!-- Schienale della sedia -->
        <path class="contorno" d="M30 112 q-8-24 4-38" fill="none"/>

        <!-- Scrivania -->
        <rect class="piano" x="20" y="112" width="204" height="7" rx="2"/>
        <line class="contorno" x1="34" y1="119" x2="34" y2="152"/>
        <line class="contorno" x1="210" y1="119" x2="210" y2="152"/>
      </g>

      <!-- ============ CONSULENZA: affiancamento uno a uno ============ -->
      <g *ngSwitchCase="'consulenza'">
        <!-- Consulente a sinistra -->
        <circle class="testa" cx="62" cy="46" r="14"/>
        <path class="corpo" d="M38 106 q0-30 24-30 t24 30 z"/>
        <path class="arto" d="M84 94 q14 2 22 10" fill="none"/>

        <!-- Persona assistita a destra -->
        <circle class="testa scura" cx="180" cy="52" r="13"/>
        <path class="corpo scuro" d="M158 108 q0-28 22-28 t22 28 z"/>
        <path class="arto" d="M158 96 q-14 2-22 8" fill="none"/>

        <!-- Scrivania condivisa -->
        <rect class="piano" x="24" y="112" width="192" height="7" rx="2"/>
        <line class="contorno" x1="40" y1="119" x2="40" y2="154"/>
        <line class="contorno" x1="200" y1="119" x2="200" y2="154"/>

        <!-- Portatile aperto tra i due -->
        <path class="schermo" d="M104 108 L112 76 H140 L148 108 Z"/>
        <path class="contorno" d="M104 108 L112 76 H140 L148 108 Z" fill="none"/>
        <rect class="piano" x="98" y="108" width="56" height="5" rx="2"/>

        <!-- Lucchetto sopra lo schermo: il tema del colloquio è la sicurezza -->
        <g class="lucchetto">
          <rect class="dato" x="114" y="44" width="24" height="18" rx="3"/>
          <path class="arto" d="M119 44 v-6 a7 7 0 0 1 14 0 v6" fill="none"/>
        </g>
      </g>
    </svg>
  `,
  styles: [`
    :host { display: block; }
    .ill { width: 100%; height: auto; display: block; }

    /* --- Colori: tutti dai token, così seguono il velo attivo --- */
    .corpo   { fill: var(--accent); }
    .testa   { fill: var(--accent-2); }
    .scuro, .scura { opacity: .55; }

    /* Arredi e schermi nel colore del testo della card: si staccano sempre dal
       fondo. (Prima usavano --surface-2 e --bordo, mai definiti: diventavano neri.) */
    .piano   { fill: var(--card-text, var(--text)); opacity: .9; }
    .schermo { fill: var(--card-text, var(--text)); }
    .contorno{ stroke: var(--card-soft, var(--text-soft)); stroke-width: 1.6; stroke-linecap: round; }
    .arto    { stroke: var(--accent); stroke-width: 4; stroke-linecap: round; }
    .riga    { stroke: var(--card-bg, var(--surface)); stroke-width: 2; stroke-linecap: round; opacity: .5; }
    .riga.viva { stroke: var(--accent-2); opacity: 1; }
    .dato    { fill: var(--accent-2); }
    .dato.tenue { opacity: .5; }

    /* --- L'unico movimento: le barre del grafico si aggiornano ---
       Un istogramma fermo è un disegno; uno che si aggiorna dice che
       l'osservatorio sta effettivamente misurando qualcosa. */
    .barra {
      transform-box: fill-box;
      transform-origin: bottom;
      animation: barra-cresce 5s ease-in-out infinite;
    }
    .b2 { animation-delay: .5s; }
    .b3 { animation-delay: 1s; }
    .b4 { animation-delay: 1.5s; }

    @keyframes barra-cresce {
      0%, 100% { transform: scaleY(1); }
      50%      { transform: scaleY(.62); }
    }

    @media (prefers-reduced-motion: reduce) {
      .barra { animation: none !important; }
    }
  `]
})
export class IllustrazioneComponent {
  /** Quale scena disegnare. */
  @Input({ required: true }) scena!: ScenaIllustrazione;
}
