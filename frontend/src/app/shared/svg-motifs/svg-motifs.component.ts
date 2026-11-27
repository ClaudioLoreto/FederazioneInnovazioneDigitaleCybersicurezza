// =============================================================================
//  frontend/src/app/shared/svg-motifs/svg-motifs.component.ts
//  MOTIVI SVG "Cyber/IT/Security" per la Landing Page. 100% SVG + CSS.
//  ❌ RIMOSSI i motivi fuori contesto ("data stream" tipo corde musicali /
//     blocchi che scorrono). ✅ SOSTITUITI da pura estetica cybersecurity:
//    • <fidc-cyber-shield> → scudo con scansione e check di validazione
//  Lo sfondo cyber (griglia, nodi, telemetria) è ora la scena di rete globale
//  in shared/background-canvas: <fidc-cyber-bg> è stato rimosso.
//  La "Cassaforte" (safe-logo) resta intatta.
//  Palette FERREA: SOLO #333D6D #723EC3 #FFCF95 #FFF0D9 (+ opacità).
//  Tutti decorativi (aria-hidden) e rispettano prefers-reduced-motion.
// =============================================================================

import { Component } from '@angular/core';

/**
 * Scudo cybersecurity animato: contorno che "respira", linea di scansione peach
 * e check di validazione che si traccia. Estende l'estetica della Cassaforte.
 */
@Component({
  selector: 'fidc-cyber-shield',
  standalone: true,
  template: `
    <svg viewBox="0 0 120 140" class="shield" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#723EC3"/>
          <stop offset="100%" stop-color="#FFCF95"/>
        </linearGradient>
        <clipPath id="shieldClip">
          <path d="M60 6 L108 24 V70 C108 104 86 124 60 134 C34 124 12 104 12 70 V24 Z"/>
        </clipPath>
      </defs>

      <path class="halo" d="M60 6 L108 24 V70 C108 104 86 124 60 134 C34 124 12 104 12 70 V24 Z"
            fill="#723EC3" opacity="0.18"/>
      <path class="plate" d="M60 6 L108 24 V70 C108 104 86 124 60 134 C34 124 12 104 12 70 V24 Z"
            fill="#333D6D" stroke="url(#shieldGrad)" stroke-width="3"/>

      <g clip-path="url(#shieldClip)">
        <rect class="scan" x="12" y="10" width="96" height="8" fill="#FFCF95" opacity="0.35"/>
      </g>

      <path class="check" d="M40 70 L55 86 L84 52" fill="none" stroke="#FFCF95"
            stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
  styles: [`
    .shield { width:100%; height:auto; display:block; overflow:visible; }
    .halo { animation: pulse 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    .scan { animation: scan 4s ease-in-out infinite; }
    .check { stroke-dasharray: 90; stroke-dashoffset: 90; animation: draw 1.2s ease forwards .4s, glow 3s ease-in-out 1.6s infinite; }
    @keyframes pulse { 0%,100% { opacity:.12; transform:scale(1); } 50% { opacity:.28; transform:scale(1.04); } }
    @keyframes scan  { 0% { transform:translateY(0); opacity:0; } 15% { opacity:.5; } 50% { transform:translateY(116px); opacity:.5; } 85% { opacity:.5; } 100% { transform:translateY(0); opacity:0; } }
    @keyframes draw  { to { stroke-dashoffset: 0; } }
    @keyframes glow  { 0%,100% { filter: drop-shadow(0 0 0 #FFCF95); } 50% { filter: drop-shadow(0 0 8px #FFCF95); } }
    @media (prefers-reduced-motion: reduce) { .halo,.scan,.check { animation:none; stroke-dashoffset:0; } }
  `]
})
export class CyberShieldComponent {}
