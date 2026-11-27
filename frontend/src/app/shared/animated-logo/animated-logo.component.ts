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
//  2. IL SIMBOLO SI LEGGE IN UNA FRASE (novembre 2026). La "porta blindata"
//     precedente, alla misura reale del marchio, era un ottagono con un cerchio:
//     non raccontava niente. Ora:
//       - lo SCUDO è la sicurezza;
//       - dentro c'è la F di Federazione, tracciata come una pista di circuito:
//         il digitale e l'innovazione;
//       - le piste finiscono in TRE NODI, uno per parola del nome: Innovazione,
//         Digitale, Cybersicurezza. Sono anche i soggetti che la Federazione
//         mette in connessione.
//     Resta riconoscibile a 16 pixel (favicon): sagoma dello scudo + F.
//
//  3. SI MUOVE SOLO CIÒ CHE HA UN SIGNIFICATO. I tre nodi si accendono uno dopo
//     l'altro, ogni qualche secondo, come un segnale che percorre la rete. Le
//     posizioni restano ferme: nessun elemento vaga per il marchio.
//
//  4. IL SIMBOLO HA COLORI FISSI, il nome segue il tema. Un marchio non cambia
//     colore col velo: scudo viola, F crema, nodi pesca funzionano su fondo
//     blu e su fondo crema (il contorno pesca lo stacca dal blu, il viola dal
//     crema). Il nome invece usa --text, quindi resta leggibile su ogni velo.
// =============================================================================

import { Component, HostListener, Input, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { BRAND } from '../../content/home-content';

@Component({
  selector: 'fidc-animated-logo',
  standalone: true,
  imports: [NgIf],
  template: `
    <svg [attr.viewBox]="soloSimbolo ? '0 0 100 112' : '0 0 620 200'"
         preserveAspectRatio="xMidYMid meet"
         class="fidc-logo"
         [class.interactive]="interactive"
         [style.transform]="tilt()"
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         [attr.aria-label]="nome">

      <!-- ============ SIMBOLO: scudo con la F a circuito ============ -->
      <g class="mark" [attr.transform]="soloSimbolo ? null : 'translate(18 12) scale(1.57)'">
        <!-- Scudo: la sicurezza -->
        <path class="scudo" d="M50 4 L92 16 V52 C92 78 74 96 50 108 C26 96 8 78 8 52 V16 Z"/>
        <!-- F di Federazione, tracciata come una pista di circuito -->
        <path class="pista" d="M36 88 V30 H60 L68 22 M36 56 H54 L62 64"/>
        <!-- Tre nodi: Innovazione, Digitale, Cybersicurezza -->
        <g class="nodo n1"><circle cx="36" cy="90" r="7"/><circle class="via" cx="36" cy="90" r="2.6"/></g>
        <g class="nodo n2"><circle cx="63" cy="65" r="7"/><circle class="via" cx="63" cy="65" r="2.6"/></g>
        <g class="nodo n3"><circle cx="69" cy="21" r="7"/><circle class="via" cx="69" cy="21" r="2.6"/></g>
      </g>

      <!-- ============ NOME PER ESTESO ============ -->
      <!-- Tre righe invece di una: alla larghezza a cui il marchio viene usato
           davvero, una riga sola costringerebbe a caratteri illeggibili. -->
      <g class="nome" *ngIf="!soloSimbolo" transform="translate(212, 0)">
        <text class="riga-1" x="0" y="72">{{ righe[0] }}</text>
        <text class="riga-2" x="0" y="112">{{ righe[1] }}</text>
        <text class="riga-2" x="0" y="148">{{ righe[2] }}</text>
        <line class="filo" x1="0" y1="164" x2="300" y2="164" stroke-width="2"/>
      </g>
    </svg>
  `,
  styles: [`
    :host { display: block; }
    .fidc-logo {
      width: 100%; height: auto; display: block; overflow: visible;
      transition: transform .25s ease;
    }

    /* Simbolo a colori fissi (vedi punto 4 in testa al file). */
    .scudo { fill: var(--c-purple); stroke: var(--c-peach); stroke-width: 4; stroke-linejoin: round; }
    .pista { fill: none; stroke: var(--c-cream); stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }
    .nodo circle { fill: var(--c-peach); }
    .nodo .via { fill: var(--c-purple); }
    .filo { stroke: var(--signal, var(--accent)); opacity: .55; }

    .riga-1 {
      font-family: var(--font-display);
      font-weight: 700; font-size: 46px; letter-spacing: .01em;
      fill: var(--text);
    }
    .riga-2 {
      font-family: var(--font-display);
      font-weight: 600; font-size: 31px; letter-spacing: .01em;
      fill: var(--text); opacity: .92;
    }

    /* --- Un solo movimento: il segnale che percorre la rete ---
       Ogni 7 secondi i tre nodi si accendono in sequenza, dal basso verso
       l'alto, poi tutto resta fermo. Si nota se lo si guarda, non distrae. */
    .nodo { transform-box: fill-box; transform-origin: center; animation: segnale 7s ease-in-out infinite; }
    .n2 { animation-delay: .25s; }
    .n3 { animation-delay: .5s; }
    @keyframes segnale {
      0%, 14%, 100% { transform: scale(1); }
      7% { transform: scale(1.22); }
    }
    .nodo circle:first-child { animation: luce 7s ease-in-out infinite; animation-delay: inherit; }
    @keyframes luce { 0%, 14%, 100% { fill: var(--c-peach); } 7% { fill: var(--c-cream); } }

    @media (prefers-reduced-motion: reduce) {
      .fidc-logo { transition: none; }
      .nodo, .nodo circle { animation: none !important; }
    }
  `]
})
export class AnimatedLogoComponent {
  /** Se true, il marchio si inclina seguendo il puntatore. */
  @Input() interactive = true;

  /**
   * Se true mostra il solo simbolo, senza il nome.
   * Serve dove lo spazio è davvero poco (icone, intestazioni compatte);
   * in tutti gli altri casi il nome per esteso deve restare visibile.
   */
  @Input() soloSimbolo = false;

  /** Nome per esteso, su tre righe: arriva da BRAND per poterlo sostituire. */
  readonly righe = BRAND.righeMarchio;
  readonly nome = BRAND.nome;

  readonly tilt = signal('perspective(800px) rotateX(0deg) rotateY(0deg)');

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    if (!this.interactive) return;
    const t = e.currentTarget as HTMLElement;
    const r = t.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
    this.tilt.set(`perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`);
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.tilt.set('perspective(800px) rotateX(0deg) rotateY(0deg)');
  }
}
