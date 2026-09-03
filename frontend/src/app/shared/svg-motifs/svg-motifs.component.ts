// =============================================================================
//  frontend/src/app/shared/svg-motifs/svg-motifs.component.ts
//  MOTIVI SVG "Cyber/IT/Security" per la Landing Page. 100% SVG + CSS.
//  ❌ RIMOSSI i motivi fuori contesto ("data stream" tipo corde musicali /
//     blocchi che scorrono). ✅ SOSTITUITI da pura estetica cybersecurity:
//    • <fidc-cyber-shield> → scudo con scansione e check di validazione
//    • <fidc-cyber-bg>     → sfondo: cyber-grid + nodi luminosi + binario sottile
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

/**
 * Sfondo Cyber riutilizzabile: griglia tecnologica + rete di nodi luminosi
 * connessi + colonne di "binario" che scorrono in verticale. Pensato per
 * riempire una sezione (position:absolute; inset:0) in modo sobrio e serio.
 */
@Component({
  selector: 'fidc-cyber-bg',
  standalone: true,
  template: `
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"
         class="cyber" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <!-- cyber-grid -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="#FFF0D9" stroke-width="1" opacity="0.12"/>
        </pattern>
        <radialGradient id="vign" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stop-color="#FFF0D9" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#333D6D" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="800" height="500" fill="url(#grid)"/>
      <rect x="0" y="0" width="800" height="500" fill="url(#vign)"/>

      <!-- binario sottile che scorre (cyber data, NON corde musicali) -->
      <g font-family="monospace" font-size="12" fill="#723EC3" opacity="0.35">
        <text class="bin b1" x="90"  y="0">0<tspan x="90" dy="18">1</tspan><tspan x="90" dy="18">0</tspan><tspan x="90" dy="18">0</tspan><tspan x="90" dy="18">1</tspan><tspan x="90" dy="18">1</tspan><tspan x="90" dy="18">0</tspan><tspan x="90" dy="18">1</tspan></text>
        <text class="bin b2" x="320" y="0">1<tspan x="320" dy="18">0</tspan><tspan x="320" dy="18">1</tspan><tspan x="320" dy="18">1</tspan><tspan x="320" dy="18">0</tspan><tspan x="320" dy="18">0</tspan><tspan x="320" dy="18">1</tspan><tspan x="320" dy="18">0</tspan></text>
        <text class="bin b3" x="600" y="0">0<tspan x="600" dy="18">0</tspan><tspan x="600" dy="18">1</tspan><tspan x="600" dy="18">0</tspan><tspan x="600" dy="18">1</tspan><tspan x="600" dy="18">1</tspan><tspan x="600" dy="18">0</tspan><tspan x="600" dy="18">1</tspan></text>
        <text class="bin b4" x="720" y="0">1<tspan x="720" dy="18">1</tspan><tspan x="720" dy="18">0</tspan><tspan x="720" dy="18">1</tspan><tspan x="720" dy="18">0</tspan><tspan x="720" dy="18">1</tspan><tspan x="720" dy="18">0</tspan><tspan x="720" dy="18">0</tspan></text>
      </g>

      <!-- rete di nodi connessi (ecosistema sicuro) -->
      <g stroke="#723EC3" stroke-width="1.5" opacity="0.45">
        <line x1="120" y1="120" x2="300" y2="90"/>
        <line x1="300" y1="90"  x2="520" y2="160"/>
        <line x1="120" y1="120" x2="220" y2="320"/>
        <line x1="220" y1="320" x2="470" y2="380"/>
        <line x1="470" y1="380" x2="520" y2="160"/>
        <line x1="300" y1="90"  x2="220" y2="320"/>
        <line x1="520" y1="160" x2="680" y2="300"/>
        <line x1="470" y1="380" x2="680" y2="300"/>
      </g>
      <g>
        <circle class="n n1" cx="120" cy="120" r="6" fill="#FFCF95"/>
        <circle class="n n2" cx="300" cy="90"  r="7" fill="#FFF0D9"/>
        <circle class="n n3" cx="520" cy="160" r="6" fill="#FFCF95"/>
        <circle class="n n4" cx="220" cy="320" r="7" fill="#FFF0D9"/>
        <circle class="n n5" cx="470" cy="380" r="6" fill="#FFCF95"/>
        <circle class="n n6" cx="680" cy="300" r="5" fill="#FFF0D9"/>
      </g>
    </svg>
  `,
  styles: [`
    .cyber { width:100%; height:100%; display:block; }
    .bin { animation: rain 7s linear infinite; }
    .b2 { animation-duration: 9s;  animation-delay: -2s; }
    .b3 { animation-duration: 6s;  animation-delay: -1s; }
    .b4 { animation-duration: 8.5s; animation-delay: -3.5s; }
    @keyframes rain { from { transform: translateY(-160px); } to { transform: translateY(520px); } }

    .n { transform-box: fill-box; transform-origin: center; }
    .n1 { animation: blip 3s ease-in-out infinite; }
    .n2 { animation: blip 3s ease-in-out infinite .4s; }
    .n3 { animation: blip 3s ease-in-out infinite .8s; }
    .n4 { animation: blip 3s ease-in-out infinite 1.2s; }
    .n5 { animation: blip 3s ease-in-out infinite 1.6s; }
    .n6 { animation: blip 3s ease-in-out infinite 2s; }
    @keyframes blip {
      0%,100% { transform: scale(1);   filter: drop-shadow(0 0 0 rgba(255,207,149,0)); }
      50%     { transform: scale(1.5); filter: drop-shadow(0 0 8px rgba(255,207,149,.8)); }
    }
    @media (prefers-reduced-motion: reduce) { .bin,.n { animation:none; } }
  `]
})
export class CyberBackgroundComponent {}
