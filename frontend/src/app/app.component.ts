// =============================================================================
//  frontend/src/app/app.component.ts
//  Shell radice: scena WebGL fissa (z-index: -1) + outlet UI sopra.
//  Il tunnel neurale resta visibile su OGNI rotta (landing, login, backoffice).
// =============================================================================

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/theme/theme.service';
import { BackgroundCanvasComponent } from './shared/background-canvas/background-canvas.component';

/**
 * Root: il canvas 3D è un fratello dell'outlet, non un figlio della hero.
 * isolation su fidc-root (styles.scss) tiene z-index:-1 dietro la UI, non
 * dietro l'intero documento.
 */
@Component({
  selector: 'fidc-root',
  standalone: true,
  imports: [RouterOutlet, BackgroundCanvasComponent],
  template: `
    <fidc-background-canvas></fidc-background-canvas>
    <div class="app-layer">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .app-layer { position: relative; z-index: 1; min-height: 100%; }
  `]
})
export class AppComponent {
  /** Forza l'istanziazione del ThemeService → applica il velo al boot. */
  private readonly theme = inject(ThemeService);
}
