// =============================================================================
//  frontend/src/app/shared/avvisi/avvisi.component.ts
//  Contenitore degli avvisi temporanei, montato una volta in AppComponent.
//  In basso a destra su schermo largo, in basso a tutta larghezza su telefono
//  (dove il pollice arriva e dove non copre la testata).
// =============================================================================

import { Component, inject } from '@angular/core';
import { AvvisiService } from './avvisi.service';

@Component({
  selector: 'fidc-avvisi',
  standalone: true,
  template: `
  <div class="pila" role="status" aria-live="polite" aria-atomic="false">
    @for (a of servizio.avvisi(); track a.id) {
      <div class="avviso" (mouseenter)="servizio.sospendi(a.id)" (mouseleave)="servizio.riprendi(a.id)"
           (focusin)="servizio.sospendi(a.id)" (focusout)="servizio.riprendi(a.id)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        <div class="testi">
          <strong>{{ a.testo }}</strong>
          @if (a.dettaglio) { <span>{{ a.dettaglio }}</span> }
        </div>
        <button type="button" (click)="servizio.chiudi(a.id)" aria-label="Chiudi l'avviso">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>
        </button>
      </div>
    }
  </div>
  `,
  styles: [`
    .pila {
      position: fixed; right: 20px; bottom: 20px; z-index: 90;
      display: grid; gap: 10px; width: min(380px, calc(100vw - 32px));
      pointer-events: none;
    }
    .avviso {
      pointer-events: auto;
      display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start;
      padding: 14px 12px 14px 16px;
      background: var(--Y-bg); color: var(--Y-text);
      border-left: 4px solid var(--Y-accent);
      border-radius: var(--radius);
      box-shadow: 0 18px 40px -18px rgba(51, 61, 109, .7);
      animation: entra .4s var(--ease-spatial);
    }
    .avviso > svg { width: 22px; height: 22px; margin-top: 1px; fill: none; stroke: var(--Y-accent); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
    .testi { display: grid; gap: 2px; }
    strong { font-weight: 600; }
    span { font-size: .9rem; color: var(--Y-soft); }
    button {
      width: 32px; height: 32px; display: grid; place-items: center;
      background: transparent; border: 0; border-radius: var(--radius); color: var(--Y-soft); cursor: pointer;
      svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
      &:hover { background: var(--Y-accent-soft); color: var(--Y-text); }
      &:focus-visible { outline: 2px solid var(--Y-accent); }
    }
    @keyframes entra { from { opacity: 0; transform: translateY(12px) scale(.98); } }
    @media (max-width: 560px) { .pila { right: 16px; left: 16px; bottom: max(16px, env(safe-area-inset-bottom)); width: auto; } }
    @media (prefers-reduced-motion: reduce) { .avviso { animation: none; } }
  `]
})
export class AvvisiComponent {
  readonly servizio = inject(AvvisiService);
}
