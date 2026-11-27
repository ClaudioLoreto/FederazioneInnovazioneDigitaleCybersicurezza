// =============================================================================
//  frontend/src/app/shared/emblema/emblema.component.ts
//  EMBLEMA DELL'HERO — sceglie quale figura mostrare accanto allo slogan.
//
//  La Direzione lo decide nel Theme Builder (campo emblemaHero del velo):
//   - 'cassaforte' (predefinito) → <fidc-safe-logo>, la cassaforte digitale;
//   - 'scudo'                    → scudo con verifica (famiglia shared/emblemi);
//   - 'nucleo'                   → <fidc-security-core>, nucleo geometrico.
//
//  Il componente legge la scelta da ThemeService, quindi cambia in tempo
//  reale anche durante l'anteprima del builder.
// =============================================================================

import { Component, computed, inject, input } from '@angular/core';
import { SafeLogoComponent } from '../safe-logo/safe-logo.component';
import { EmblemaTemaComponent } from '../emblemi/emblema-tema.component';
import { ThemeService } from '../theme/theme.service';

/** Le figure disponibili per l'hero. */
export type EmblemaHero = 'cassaforte' | 'scudo' | 'nucleo';

/**
 * Nucleo di sicurezza geometrico: due esagoni concentrici che ruotano in versi
 * opposti attorno a un nucleo a diamante, con sei nodi di guardia ai vertici.
 * Racconta un sistema stratificato (difesa in profondità).
 */
@Component({
  selector: 'fidc-security-core',
  standalone: true,
  template: `
    <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" class="core"
         xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Nucleo di sicurezza: difesa a più livelli">
      <g transform="translate(120,120)">
        <polygon class="halo" points="0,-112 97,-56 97,56 0,112 -97,56 -97,-56"
                 fill="#723EC3" opacity=".16"/>
        <g class="ring-out">
          <polygon points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50"
                   fill="#333D6D" stroke="#FFF0D9" stroke-width="2.5"/>
          <g fill="#FFCF95">
            <circle cx="0" cy="-100" r="6"/><circle cx="86.6" cy="-50" r="6"/>
            <circle cx="86.6" cy="50" r="6"/><circle cx="0" cy="100" r="6"/>
            <circle cx="-86.6" cy="50" r="6"/><circle cx="-86.6" cy="-50" r="6"/>
          </g>
        </g>
        <g class="ring-in">
          <polygon points="0,-62 53.7,-31 53.7,31 0,62 -53.7,31 -53.7,-31"
                   fill="none" stroke="#FFCF95" stroke-width="2" stroke-dasharray="10 6"/>
          <g stroke="#FFF0D9" stroke-width="1.4" opacity=".55">
            <line x1="0" y1="-62" x2="0" y2="62"/>
            <line x1="-53.7" y1="-31" x2="53.7" y2="31"/>
            <line x1="-53.7" y1="31" x2="53.7" y2="-31"/>
          </g>
        </g>
        <g class="nucleo">
          <polygon points="0,-28 24,0 0,28 -24,0" fill="#723EC3" stroke="#FFF0D9" stroke-width="2.5"/>
          <polygon points="0,-12 10,0 0,12 -10,0" fill="#FFCF95"/>
        </g>
      </g>
    </svg>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .core { width: 100%; height: auto; display: block; overflow: visible; }
    /* Le forme sono centrate su (0,0) dentro un gruppo traslato: ruotano attorno
       al centro del proprio riquadro. (view-box le farebbe orbitare fuori asse.) */
    .ring-out, .ring-in, .nucleo, .halo { transform-box: fill-box; transform-origin: center; }
    .ring-out { animation: gira 36s linear infinite; }
    .ring-in  { animation: gira 18s linear infinite reverse; }
    .nucleo   { animation: respira 4s ease-in-out infinite; }
    .halo     { animation: alone 4s ease-in-out infinite; }
    @keyframes gira    { to { transform: rotate(360deg); } }
    @keyframes respira { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    @keyframes alone   { 0%,100% { opacity: .12; } 50% { opacity: .26; } }
    @media (prefers-reduced-motion: reduce) { .ring-out, .ring-in, .nucleo, .halo { animation: none; } }
  `]
})
export class SecurityCoreComponent {}

/** Mostra l'emblema scelto nel velo attivo (o quello forzato via input). */
@Component({
  selector: 'fidc-emblema',
  standalone: true,
  imports: [SafeLogoComponent, EmblemaTemaComponent, SecurityCoreComponent],
  template: `
    @switch (scelto()) {
      @case ('scudo')  { <div class="scudo"><fidc-emblema-tema tipo="verifica" [vivo]="true"></fidc-emblema-tema></div> }
      @case ('nucleo') { <fidc-security-core></fidc-security-core> }
      @default         { <fidc-safe-logo></fidc-safe-logo> }
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
    /* Lo scudo è più alto che largo: lo stringiamo perché occupi lo stesso spazio. */
    .scudo { width: 82%; margin-inline: auto; }
  `]
})
export class EmblemaComponent {
  private readonly theme = inject(ThemeService);

  /** Se impostato, ignora il velo e mostra questa figura (anteprime). */
  readonly forza = input<EmblemaHero | null>(null);

  readonly scelto = computed<EmblemaHero>(() => this.forza() ?? this.theme.config().emblemaHero ?? 'cassaforte');
}
