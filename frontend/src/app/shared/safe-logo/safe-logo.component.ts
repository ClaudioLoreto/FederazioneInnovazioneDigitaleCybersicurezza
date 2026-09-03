// =============================================================================
//  frontend/src/app/shared/safe-logo/safe-logo.component.ts
//  CASSAFORTE DIGITALE — Logo/landmark animato 100% SVG + CSS (nessuna libreria).
//  Motion design "high-end":
//   - la MANIGLIA a raggi ruota in continuo (apertura/chiusura);
//   - il DISCO combinazione gira in senso opposto con tacche e glow purple;
//   - i CHIAVISTELLI (bolts) entrano/escono in loop;
//   - "scansione digitale" peach che attraversa lo sportello;
//   - micro-tilt 3D al passaggio del mouse.
//  Palette FERREA: #333D6D, #723EC3, #FFCF95, #FFF0D9 (solo questi 4).
//  Rispetta prefers-reduced-motion.
// =============================================================================

import { Component, Input, HostListener, signal } from '@angular/core';

/**
 * Cassaforte digitale animata. Rappresenta la missione FIDC: innovazione
 * custodita in sicurezza. Usabile come centerpiece dell'hero (size grande)
 * o come marchio (size piccolo).
 */
@Component({
  selector: 'fidc-safe-logo',
  standalone: true,
  template: `
    <svg viewBox="0 0 240 240"
         class="safe"
         [class.interactive]="interactive"
         [style.transform]="tilt()"
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         aria-label="FIDC — Cassaforte digitale: innovazione custodita in sicurezza">

      <defs>
        <!-- Gradiente accent: purple → peach (ammesso, solo colori palette) -->
        <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stop-color="#723EC3"/>
          <stop offset="100%" stop-color="#FFCF95"/>
        </linearGradient>
        <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stop-color="#723EC3" stop-opacity="0.9"/>
          <stop offset="70%" stop-color="#723EC3" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#723EC3" stop-opacity="0"/>
        </radialGradient>
        <!-- Maschera che ritaglia la "scansione" entro lo sportello -->
        <clipPath id="doorClip">
          <rect x="48" y="48" width="144" height="144" rx="16"/>
        </clipPath>
      </defs>

      <!-- ===== CORPO CASSAFORTE (deep blue) ===== -->
      <rect class="body" x="20" y="20" width="200" height="200" rx="26"
            fill="#333D6D" stroke="#FFF0D9" stroke-width="3"/>
      <!-- doppio bordo interno peach -->
      <rect x="32" y="32" width="176" height="176" rx="20"
            fill="none" stroke="#FFCF95" stroke-width="1.5" opacity="0.5"/>

      <!-- chiavistelli (bolts) ai 4 lati: entrano ed escono -->
      <g fill="#FFCF95">
        <rect class="bolt b-top"    x="113" y="30" width="14" height="16" rx="3"/>
        <rect class="bolt b-bottom" x="113" y="194" width="14" height="16" rx="3"/>
        <rect class="bolt b-left"   x="30" y="113" width="16" height="14" rx="3"/>
        <rect class="bolt b-right"  x="194" y="113" width="16" height="14" rx="3"/>
      </g>

      <!-- ===== SPORTELLO ===== -->
      <rect x="48" y="48" width="144" height="144" rx="16"
            fill="#333D6D" stroke="#FFF0D9" stroke-width="2"/>
      <!-- pannello sportello leggermente più chiaro (alpha cream) -->
      <rect x="48" y="48" width="144" height="144" rx="16"
            fill="#FFF0D9" opacity="0.06"/>

      <!-- scansione digitale peach che scorre dentro lo sportello -->
      <g clip-path="url(#doorClip)">
        <rect class="scan" x="48" y="48" width="144" height="10" fill="#FFCF95" opacity="0.35"/>
      </g>

      <!-- viti decorative agli angoli dello sportello -->
      <g fill="#FFF0D9" opacity="0.7">
        <circle cx="60" cy="60" r="3"/>
        <circle cx="180" cy="60" r="3"/>
        <circle cx="60" cy="180" r="3"/>
        <circle cx="180" cy="180" r="3"/>
      </g>

      <!-- ===== MECCANISMO CENTRALE ===== -->
      <g transform="translate(120,120)">
        <!-- alone glow del disco -->
        <circle class="glow" r="62" fill="url(#dialGlow)"/>

        <!-- DISCO COMBINAZIONE: ruota in senso ANTIORARIO -->
        <g class="dial">
          <circle r="48" fill="#333D6D" stroke="#FFCF95" stroke-width="2"/>
          <circle r="48" fill="none" stroke="#723EC3" stroke-width="3" opacity="0.55"/>
          <!-- tacche graduate tutto intorno -->
          <g stroke="#FFF0D9" stroke-width="2">
            <line x1="0" y1="-48" x2="0" y2="-40"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(30)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(60)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(90)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(120)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(150)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(180)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(210)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(240)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(270)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(300)"/>
            <line x1="0" y1="-48" x2="0" y2="-40" transform="rotate(330)"/>
          </g>
          <!-- indice di riferimento peach -->
          <circle cx="0" cy="-48" r="4" fill="#FFCF95"/>
        </g>

        <!-- MANIGLIA A RAGGI: ruota in senso ORARIO (più veloce) -->
        <g class="handle">
          <!-- mozzo centrale -->
          <circle r="14" fill="url(#accentGrad)" stroke="#FFF0D9" stroke-width="2"/>
          <!-- 4 raggi -->
          <g stroke="#FFF0D9" stroke-width="6" stroke-linecap="round">
            <line x1="0" y1="-34" x2="0" y2="34"/>
            <line x1="-34" y1="0" x2="34" y2="0"/>
          </g>
          <!-- pomelli alle estremità dei raggi (cream, niente pallino viola) -->
          <g fill="#FFF0D9">
            <circle cx="0" cy="-34" r="6"/>
            <circle cx="0" cy="34" r="6"/>
            <circle cx="-34" cy="0" r="6"/>
            <circle cx="34" cy="0" r="6"/>
          </g>
        </g>
      </g>

      <!-- piedini della cassaforte -->
      <rect x="44" y="220" width="20" height="10" rx="3" fill="#333D6D"/>
      <rect x="176" y="220" width="20" height="10" rx="3" fill="#333D6D"/>
    </svg>
  `,
  styles: [`
    /* Host block: garantisce che la larghezza impostata dal contenitore valga
       sempre (evita il collasso del custom element inline → SVG invisibile). */
    :host { display: block; width: 100%; }

    .safe { width: 100%; height: auto; display: block; overflow: visible;
            transition: transform .3s ease; }

    /* DISCO COMBINAZIONE — rotazione lenta antioraria */
    .dial   { transform-origin: 0 0; animation: spinCCW 14s linear infinite; }
    /* MANIGLIA — rotazione oraria, ritmo "a scatti morbidi" come un'apertura */
    .handle { transform-origin: 0 0; animation: spinCW 6s cubic-bezier(.45,.05,.55,.95) infinite; }

    .glow   { animation: breathe 3.6s ease-in-out infinite; }

    /* scansione digitale che scende e risale */
    .scan   { animation: scan 4.5s ease-in-out infinite; }

    /* chiavistelli: si ritraggono e riescono in loop (sicurezza "attiva") */
    .bolt        { transform-box: fill-box; transform-origin: center; }
    .b-top       { animation: boltY 6s ease-in-out infinite; }
    .b-bottom    { animation: boltY 6s ease-in-out infinite reverse; }
    .b-left      { animation: boltX 6s ease-in-out infinite; }
    .b-right     { animation: boltX 6s ease-in-out infinite reverse; }

    @keyframes spinCW  { to { transform: rotate(360deg); } }
    @keyframes spinCCW { to { transform: rotate(-360deg); } }
    @keyframes breathe {
      0%,100% { opacity: .45; transform: scale(1); }
      50%     { opacity: .9;  transform: scale(1.08); }
    }
    @keyframes scan {
      0%      { transform: translateY(0); opacity: 0; }
      15%     { opacity: .5; }
      50%     { transform: translateY(134px); opacity: .5; }
      85%     { opacity: .5; }
      100%    { transform: translateY(0); opacity: 0; }
    }
    @keyframes boltY {
      0%,100% { transform: translateY(0); }
      45%,55% { transform: translateY(7px); }
    }
    @keyframes boltX {
      0%,100% { transform: translateX(0); }
      45%,55% { transform: translateX(7px); }
    }

    /* Accessibilità: nessun movimento se richiesto dal sistema */
    @media (prefers-reduced-motion: reduce) {
      .dial, .handle, .glow, .scan, .bolt { animation: none; }
      .glow { opacity: .6; }
    }
  `]
})
export class SafeLogoComponent {
  /** Se true, abilita il micro-tilt 3D al movimento del mouse. */
  @Input() interactive = true;

  /** Trasformazione di tilt calcolata dal cursore. */
  readonly tilt = signal('perspective(900px) rotateX(0deg) rotateY(0deg)');

  /** Aggiorna il tilt seguendo il puntatore. */
  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent) {
    if (!this.interactive) return;
    const t = e.currentTarget as HTMLElement;
    const r = t.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
    this.tilt.set(`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`);
  }

  /** Ripristina la posizione neutra all'uscita del mouse. */
  @HostListener('mouseleave')
  onLeave() {
    this.tilt.set('perspective(900px) rotateX(0deg) rotateY(0deg)');
  }
}
