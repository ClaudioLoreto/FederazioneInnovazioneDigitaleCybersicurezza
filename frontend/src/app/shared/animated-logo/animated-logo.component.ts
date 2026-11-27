// =============================================================================
//  frontend/src/app/shared/animated-logo/animated-logo.component.ts
//  Marchio della Federazione: simbolo + nome per esteso.
//
//  SCELTE DI PROGETTO, e perché
//
//  1. IL NOME PER ESTESO È IL MARCHIO. Prima campeggiava la sigla "FIDC" e il
//     nome completo stava sotto, in caratteri minuscoli e illeggibili. Un ente
//     pubblico si presenta con il proprio nome: chi arriva sul sito per la
//     prima volta non sa cosa significhi quella sigla. Ora il nome è
//     dimensionato per restare leggibile anche nel menu laterale, dove il
//     marchio è largo circa 200 pixel.
//
//  2. IL SIMBOLO SI LEGGE IN UNA FRASE, SENZA LETTERE. Il nome dell'ente
//     potrebbe cambiare, quindi niente iniziali. È uno SCUDO SFACCETTATO, come
//     una gemma tagliata: tre facce (innovazione, digitale, sicurezza) che si
//     incontrano in un unico punto, la Federazione. Comunica protezione, valore
//     e solidità; è serio e moderno, e resta riconoscibile a 16 pixel.
//     Versioni scartate (e perché) nella storia di git e in LOGO.txt.
//
//  3. IL MARCHIO È FERMO. Un logo istituzionale non si muove: l'animazione
//     resta agli emblemi tematici sparsi nel sito (shared/emblemi).
//
//  4. IL SIMBOLO HA COLORI FISSI, il nome segue il tema. Un marchio non cambia
//     colore col velo: scudo viola con facce in luce e in ombra, spigoli e
//     punto pesca, funziona su fondo blu e su fondo crema (il contorno pesca
//     lo stacca dal blu, il viola dal crema). Il nome usa --text, quindi resta
//     leggibile su ogni velo.
// =============================================================================

import { Component, Input, computed, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ContenutiService } from '../../services/contenuti.service';

@Component({
  selector: 'fidc-animated-logo',
  standalone: true,
  imports: [NgIf],
  template: `
    <svg [attr.viewBox]="soloSimbolo ? '0 0 100 112' : '0 0 620 200'"
         preserveAspectRatio="xMidYMid meet"
         class="fidc-logo"
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         [attr.aria-label]="nome()">

      <!-- ============ SIMBOLO: scudo sfaccettato ============ -->
      <!-- Simbolo alternativo caricato dalla redazione (Contenuti del sito → Identità). -->
      @if (simbolo()) {
        <g [attr.transform]="soloSimbolo ? null : 'translate(18 12) scale(1.57)'">
          <image [attr.href]="simbolo()" x="0" y="0" width="100" height="112" preserveAspectRatio="xMidYMid meet"/>
        </g>
      } @else {
      <g class="mark" [attr.transform]="soloSimbolo ? null : 'translate(18 12) scale(1.57)'">
        <path class="scudo" d="M50 4 L92 16 V52 C92 78 74 96 50 108 C26 96 8 78 8 52 V16 Z"/>
        <!-- Faccia alta, più chiara: la luce arriva dall'alto -->
        <path class="faccia-luce" d="M50 4 L92 16 L50 47 L8 16 Z"/>
        <!-- Faccia sinistra, in ombra -->
        <path class="faccia-ombra" d="M8 16 L50 47 L50 108 C26 96 8 78 8 52 Z"/>
        <!-- Spigoli: le tre facce che convergono -->
        <path class="spigoli" d="M8 16 L50 47 L92 16 M50 47 V108"/>
        <path class="bordo" d="M50 4 L92 16 V52 C92 78 74 96 50 108 C26 96 8 78 8 52 V16 Z"/>
        <!-- Il punto d'incontro: la Federazione -->
        <circle class="punto" cx="50" cy="47" r="4.6"/>
      </g>
      }

      <!-- ============ NOME PER ESTESO ============ -->
      <!-- Tre righe invece di una: alla larghezza a cui il marchio viene usato
           davvero, una riga sola costringerebbe a caratteri illeggibili. -->
      <g class="nome" *ngIf="!soloSimbolo" transform="translate(212, 0)">
        <text class="riga-1" x="0" y="72">{{ righe()[0] }}</text>
        <text class="riga-2" x="0" y="112">{{ righe()[1] }}</text>
        <text class="riga-2" x="0" y="148">{{ righe()[2] }}</text>
        <line class="filo" x1="0" y1="164" x2="300" y2="164" stroke-width="2"/>
      </g>
    </svg>
  `,
  styles: [`
    :host { display: block; }
    .fidc-logo {
      width: 100%; height: auto; display: block; overflow: visible;
    }

    /* Simbolo a colori fissi (vedi punto 4 in testa al file). */
    .scudo { fill: var(--c-purple); }
    .faccia-luce { fill: var(--c-cream); fill-opacity: .22; }
    .faccia-ombra { fill: var(--c-deep-blue); fill-opacity: .4; }
    .spigoli { fill: none; stroke: var(--c-peach); stroke-width: 1.4; stroke-opacity: .75; stroke-linejoin: round; }
    .bordo { fill: none; stroke: var(--c-peach); stroke-width: 3; stroke-linejoin: round; }
    .punto { fill: var(--c-peach); }
    .filo { stroke: var(--signal, var(--accent)); opacity: .55; }

    /* Nome: "Federazione" nel carattere dei titoli, il resto in quello del testo. */
    .riga-1 {
      font-family: var(--font-display);
      font-weight: 600; font-size: 50px; letter-spacing: -.005em;
      fill: var(--text);
    }
    .riga-2 {
      font-family: var(--font-body);
      font-weight: 500; font-size: 31px; letter-spacing: .005em;
      fill: var(--text); opacity: .88;
    }
  `]
})
export class AnimatedLogoComponent {
  /** Mantenuto per compatibilità: il marchio non reagisce più al puntatore. */
  @Input() interactive = false;

  /**
   * Se true mostra il solo simbolo, senza il nome.
   * Serve dove lo spazio è davvero poco (icone, intestazioni compatte);
   * in tutti gli altri casi il nome per esteso deve restare visibile.
   */
  @Input() soloSimbolo = false;

  /** Nome per esteso, su tre righe, e simbolo: modificabili dal backoffice. */
  private readonly contenuti = inject(ContenutiService);
  readonly righe = computed(() => this.contenuti.attuali().identita.righeMarchio);
  readonly nome = computed(() => this.contenuti.attuali().identita.nome);
  readonly simbolo = computed(() => this.contenuti.attuali().identita.simbolo.trim());
}
