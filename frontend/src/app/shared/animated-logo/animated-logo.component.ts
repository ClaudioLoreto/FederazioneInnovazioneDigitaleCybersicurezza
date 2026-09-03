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
//  2. IL SIMBOLO È UNA PORTA BLINDATA, NON UNO SCUDO GENERICO. Racconta
//     custodia e accesso controllato: chiuso a chi non ha titolo, apribile da
//     chi ce l'ha. Lo scudo diceva soltanto "difesa" ed è un simbolo abusato.
//
//  3. SI MUOVE SOLO CIÒ CHE HA UN SIGNIFICATO. Le orbite e i trattini che
//     scorrevano attorno al marchio erano decorazione senza contenuto. Restano
//     due movimenti, entrambi motivati: la ghiera che ruota lentamente, come
//     una combinazione, e il nucleo che pulsa, come un sistema in funzione.
//
//  4. I COLORI VENGONO DAL TEMA. Il marchio usa i token --accent e --accent-2,
//     quindi cambia insieme al velo scelto nel backoffice invece di restare
//     l'unico elemento fuori tono.
// =============================================================================

import { Component, HostListener, Input, signal } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'fidc-animated-logo',
  standalone: true,
  imports: [NgIf],
  template: `
    <svg [attr.viewBox]="soloSimbolo ? '0 0 200 200' : '0 0 620 200'"
         preserveAspectRatio="xMidYMid meet"
         class="fidc-logo"
         [class.interactive]="interactive"
         [style.transform]="tilt()"
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         aria-label="Federazione Innovazione, Digitale e Cybersicurezza">

      <!-- ============ SIMBOLO: porta blindata ============ -->
      <g class="mark" transform="translate(14, 14)">

        <!-- Telaio esterno, con gli angoli tagliati come nel resto della grafica -->
        <path class="telaio"
              d="M28 4 H144 L168 28 V144 L144 168 H28 L4 144 V28 Z"
              fill="none" stroke-width="3"/>

        <!-- Anta interna -->
        <path class="anta"
              d="M36 20 H136 L152 36 V136 L136 152 H36 L20 136 V36 Z"
              fill-opacity=".22" stroke-width="1.4"/>

        <!-- Ghiera della combinazione: ruota lentamente, come una serratura -->
        <g class="ghiera" transform="translate(86,86)">
          <circle r="42" fill="none" stroke-width="1.6" class="ghiera-cerchio"/>
          <line x1="0" y1="-42" x2="0" y2="-32" stroke-width="3" class="tacca"/>
          <line x1="42" y1="0" x2="32" y2="0" stroke-width="2" class="tacca"/>
          <line x1="0" y1="42" x2="0" y2="32" stroke-width="2" class="tacca"/>
          <line x1="-42" y1="0" x2="-32" y2="0" stroke-width="2" class="tacca"/>
          <line x1="-29.7" y1="-29.7" x2="-22.6" y2="-22.6" stroke-width="1.4" class="tacca"/>
          <line x1="29.7" y1="29.7" x2="22.6" y2="22.6" stroke-width="1.4" class="tacca"/>
        </g>

        <!-- Chiavistelli: i quattro punti in cui l'anta si aggancia al telaio -->
        <rect class="chiavistello" x="78" y="12" width="16" height="10"/>
        <rect class="chiavistello" x="78" y="150" width="16" height="10"/>
        <rect class="chiavistello" x="12" y="78" width="10" height="16"/>
        <rect class="chiavistello" x="150" y="78" width="10" height="16"/>

        <!-- Nucleo: il sistema è attivo -->
        <circle class="nucleo" cx="86" cy="86" r="13"/>
        <circle class="nucleo-onda" cx="86" cy="86" r="20" fill="none" stroke-width="1.4"/>
      </g>

      <!-- ============ NOME PER ESTESO ============ -->
      <!-- Tre righe invece di una: alla larghezza a cui il marchio viene usato
           davvero, una riga sola costringerebbe a caratteri illeggibili. -->
      <g class="nome" *ngIf="!soloSimbolo" transform="translate(212, 0)">
        <text class="riga-1" x="0" y="72">Federazione</text>
        <text class="riga-2" x="0" y="112">Innovazione, Digitale</text>
        <text class="riga-2" x="0" y="148">e Cybersicurezza</text>
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

    /* I colori arrivano dal tema: il marchio cambia insieme al resto del sito. */
    .telaio { stroke: var(--accent); }
    .anta { fill: var(--accent-2); stroke: var(--accent-2); }
    .ghiera-cerchio { stroke: var(--accent-2); }
    .tacca { stroke: var(--accent); }
    .chiavistello { fill: var(--accent); }
    .nucleo { fill: var(--accent); }
    .nucleo-onda { stroke: var(--accent); }
    .filo { stroke: var(--accent); opacity: .55; }

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

    /* --- I due soli movimenti, entrambi con un significato --- */

    /* La combinazione gira: il contenuto è sotto chiave. Lenta di proposito,
       un giro ogni 24 secondi: si nota se la si guarda, non distrae mai. */
    .ghiera {
      transform-box: fill-box;
      transform-origin: center;
      animation: ghiera-gira 24s linear infinite;
    }

    /* Il nucleo respira: il sistema è acceso e sta sorvegliando. */
    .nucleo {
      transform-box: fill-box;
      transform-origin: center;
      animation: nucleo-respira 4s ease-in-out infinite;
    }
    .nucleo-onda {
      transform-box: fill-box;
      transform-origin: center;
      animation: nucleo-onda 4s ease-out infinite;
    }

    @keyframes ghiera-gira { to { transform: rotate(360deg); } }
    @keyframes nucleo-respira {
      0%, 100% { opacity: .85; transform: scale(1); }
      50%      { opacity: 1; transform: scale(1.08); }
    }
    @keyframes nucleo-onda {
      0%   { opacity: .5; transform: scale(.8); }
      100% { opacity: 0; transform: scale(1.6); }
    }

    @media (prefers-reduced-motion: reduce) {
      .fidc-logo { transition: none; }
      .ghiera, .nucleo, .nucleo-onda { animation: none !important; }
      .nucleo-onda { opacity: .35; }
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
