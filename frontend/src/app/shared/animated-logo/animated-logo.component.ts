// =============================================================================
//  frontend/src/app/shared/animated-logo/animated-logo.component.ts
//  Marchio FIDC — scudo/cassaforte cyber vettoriale (loop infinito).
//  Anelli concentrici in prospettiva 3D, circuiti con stroke-dash, nucleo peach.
//  Palette FERREA: --c-purple + --c-peach intensi. Rispetta prefers-reduced-motion.
// =============================================================================

import { Component, Input, HostListener, signal } from '@angular/core';

/**
 * Logo animato della Federazione: scudo-cassaforte HUD con giroscopio 3D.
 */
@Component({
  selector: 'fidc-animated-logo',
  standalone: true,
  template: `
    <svg viewBox="0 0 850 260"
         preserveAspectRatio="xMidYMid meet"
         class="fidc-logo"
         [class.interactive]="interactive"
         [style.transform]="tilt()"
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         aria-label="FIDC — Federazione Innovazione, Digitale e Cybersicurezza">

      <defs>
        <linearGradient id="fidcLogoStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#723EC3"/>
          <stop offset="55%" stop-color="#FFCF95"/>
          <stop offset="100%" stop-color="#723EC3"/>
        </linearGradient>
        <linearGradient id="fidcLogoFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#723EC3"/>
          <stop offset="100%" stop-color="#333D6D"/>
        </linearGradient>
        <radialGradient id="fidcLogoCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFCF95"/>
          <stop offset="70%" stop-color="#723EC3"/>
          <stop offset="100%" stop-color="#333D6D"/>
        </radialGradient>
        <filter id="fidcLogoGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g class="mark" transform="translate(22, 16)" filter="url(#fidcLogoGlow)">
        <!-- Giroscopio 3D: tre anelli ellittici che ruotano in prospettiva -->
        <g class="gyro">
          <ellipse class="orbit o1" cx="112" cy="114" rx="102" ry="38" fill="none"
                   stroke="#723EC3" stroke-width="1.6"/>
          <ellipse class="orbit o2" cx="112" cy="114" rx="78" ry="28" fill="none"
                   stroke="#FFCF95" stroke-width="1.4"/>
          <ellipse class="orbit o3" cx="112" cy="114" rx="54" ry="18" fill="none"
                   stroke="#FFF0D9" stroke-width="1.1"/>
        </g>

        <!-- Scudo esterno (cassaforte / hull) -->
        <path class="hull circuit"
              d="M112 6 L204 40 L204 128 C204 182 156 214 112 230 C68 214 20 182 20 128 L20 40 Z"
              fill="url(#fidcLogoFill)" stroke="url(#fidcLogoStroke)" stroke-width="2.4"/>

        <!-- Scudo interno tagliato -->
        <path class="inner-cut circuit-slow"
              d="M112 28 L178 52 L178 122 C178 162 142 188 112 200 C82 188 46 162 46 122 L46 52 Z"
              fill="#333D6D" fill-opacity=".55" stroke="#FFCF95" stroke-width="1.2"/>

        <!-- Tracciati circuito HUD -->
        <path class="trace t-a" fill="none" stroke="#FFCF95" stroke-width="1.3"
              d="M52 86 L78 86 L88 98 L112 98 M172 86 L146 86 L136 98 L112 98"/>
        <path class="trace t-b" fill="none" stroke="#723EC3" stroke-width="1.2"
              d="M58 150 L82 150 L94 138 L112 138 M166 150 L142 150 L130 138 L112 138"/>
        <path class="trace t-c" fill="none" stroke="#FFCF95" stroke-width="1"
              d="M112 34 L112 62 M40 118 L62 118 M184 118 L162 118 M112 188 L112 210"/>

        <!-- Sportello cassaforte -->
        <circle cx="112" cy="118" r="36" fill="#333D6D" stroke="#723EC3" stroke-width="2"/>
        <circle class="dial-ring" cx="112" cy="118" r="28" fill="none"
                stroke="#FFCF95" stroke-width="1.6"/>
        <circle class="dial-ring rev" cx="112" cy="118" r="20" fill="none"
                stroke="#723EC3" stroke-width="1.2"/>

        <!-- Tacche combinazione -->
        <g class="ticks" transform="translate(112,118)">
          <line x1="0" y1="-24" x2="0" y2="-18" stroke="#FFCF95" stroke-width="1.4"/>
          <line x1="0" y1="18" x2="0" y2="24" stroke="#FFCF95" stroke-width="1.4"/>
          <line x1="-24" y1="0" x2="-18" y2="0" stroke="#FFF0D9" stroke-width="1.2"/>
          <line x1="18" y1="0" x2="24" y2="0" stroke="#FFF0D9" stroke-width="1.2"/>
        </g>

        <!-- Chiavistelli -->
        <rect class="bolt" x="104" y="44" width="16" height="8" fill="#FFCF95"/>
        <rect class="bolt delay" x="104" y="184" width="16" height="8" fill="#FFCF95"/>
        <rect class="bolt" x="38" y="114" width="8" height="16" fill="#723EC3"/>
        <rect class="bolt delay" x="178" y="114" width="8" height="16" fill="#723EC3"/>

        <!-- Nucleo -->
        <circle class="core" cx="112" cy="118" r="9" fill="url(#fidcLogoCore)" stroke="#FFCF95" stroke-width="1.5"/>
        <circle class="core-pulse" cx="112" cy="118" r="14" fill="none" stroke="#FFCF95" stroke-width="1"/>
      </g>

      <g class="wordmark" transform="translate(268, 128)">
        <text class="title" font-family="Chakra Petch, Segoe UI, sans-serif" font-weight="700"
              font-size="92" fill="#723EC3" letter-spacing="6">FIDC</text>
        <text class="subtitle" x="4" y="42" font-family="system-ui, sans-serif"
              font-weight="700" font-size="13" fill="#FFCF95" letter-spacing="1.6">
          FEDERAZIONE INNOVAZIONE, DIGITALE E CYBERSICUREZZA
        </text>
      </g>
    </svg>
  `,
  styles: [`
    .fidc-logo { width: 100%; height: auto; display: block; overflow: visible;
                 transition: transform .25s ease; }

    .gyro {
      transform-box: fill-box;
      transform-origin: center;
      animation: gyro-spin 11s linear infinite;
    }
    .orbit { stroke-dasharray: 10 14 4 18; animation: dash-flow 5.5s linear infinite; }
    .o2 { animation-duration: 3.8s; animation-direction: reverse; stroke-dasharray: 6 10; }
    .o3 { animation-duration: 7s; stroke-dasharray: 3 8 12 6; }

    .circuit { stroke-dasharray: 18 10 4 14; animation: dash-flow 7s linear infinite; }
    .circuit-slow { stroke-dasharray: 24 16; animation: dash-flow 11s linear infinite reverse; }

    .trace { stroke-dasharray: 8 12; animation: dash-flow 4.2s linear infinite; }
    .t-b { animation-duration: 5.4s; animation-direction: reverse; }
    .t-c { animation-duration: 3.2s; }

    .dial-ring {
      transform-box: fill-box;
      transform-origin: center;
      stroke-dasharray: 12 8 4 10;
      animation: spin 6s linear infinite, dash-flow 4s linear infinite;
    }
    .dial-ring.rev { animation-direction: reverse, reverse; animation-duration: 9s, 5.5s; }

    .ticks {
      transform-box: fill-box;
      transform-origin: center;
      animation: spin 8s linear infinite;
    }

    .bolt { animation: bolt-pulse 2.4s ease-in-out infinite; }
    .bolt.delay { animation-delay: -1.2s; }

    .core {
      transform-box: fill-box;
      transform-origin: center;
      animation: core-breathe 2.8s ease-in-out infinite;
    }
    .core-pulse {
      transform-box: fill-box;
      transform-origin: center;
      animation: pulse-ring 2.8s ease-out infinite;
    }

    .title { opacity: .96; }
    .subtitle { opacity: .9; }

    @keyframes gyro-spin {
      from { transform: perspective(520px) rotateX(64deg) rotateZ(0deg); }
      to   { transform: perspective(520px) rotateX(64deg) rotateZ(360deg); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes dash-flow {
      to { stroke-dashoffset: -240; }
    }
    @keyframes bolt-pulse {
      0%, 100% { opacity: .55; }
      50%      { opacity: 1; }
    }
    @keyframes core-breathe {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.12); }
    }
    @keyframes pulse-ring {
      0%   { opacity: .7; transform: scale(.85); }
      100% { opacity: 0; transform: scale(1.55); }
    }

    @media (prefers-reduced-motion: reduce) {
      .gyro, .orbit, .circuit, .circuit-slow, .trace,
      .dial-ring, .ticks, .bolt, .core, .core-pulse { animation: none !important; }
      .gyro { transform: perspective(520px) rotateX(64deg); }
      .orbit, .circuit, .circuit-slow, .trace, .dial-ring { stroke-dashoffset: 0; }
    }
  `]
})
export class AnimatedLogoComponent {
  /** Se true, abilita il tilt parallax al movimento del mouse. */
  @Input() interactive = true;

  readonly tilt = signal('perspective(800px) rotateX(0deg) rotateY(0deg)');

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent) {
    if (!this.interactive) return;
    const t = e.currentTarget as HTMLElement;
    const r = t.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
    this.tilt.set(`perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`);
  }

  @HostListener('mouseleave')
  onLeave() {
    this.tilt.set('perspective(800px) rotateX(0deg) rotateY(0deg)');
  }
}
