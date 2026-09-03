// =============================================================================
//  frontend/src/app/app.component.ts
//  Radice dell'applicazione. Contiene tre cose che devono esistere una volta
//  sola e valere per ogni pagina:
//   1. la scena 3D di sfondo, in posizione fissa dietro tutto;
//   2. l'area dove il router disegna la pagina corrente;
//   3. le finestre di conferma, che devono poter comparire sopra qualunque cosa.
// =============================================================================

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/theme/theme.service';
import { BackgroundCanvasComponent } from './shared/background-canvas/background-canvas.component';
import { DialogoComponent } from './shared/dialogo/dialogo.component';

@Component({
  selector: 'fidc-root',
  standalone: true,
  imports: [RouterOutlet, BackgroundCanvasComponent, DialogoComponent],
  template: `
    <fidc-background-canvas></fidc-background-canvas>

    <div class="app-layer">
      <router-outlet></router-outlet>
    </div>

    <!-- Montato qui, e non nelle singole pagine, perché una finestra di
         conferma deve poter apparire sopra qualsiasi schermata. -->
    <fidc-dialogo></fidc-dialogo>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    /* La scena 3D sta a z-index -1: questo strato la tiene sotto l'interfaccia
       senza mandarla dietro all'intera pagina (vedi isolation in styles.scss). */
    .app-layer { position: relative; z-index: 1; min-height: 100%; }
  `]
})
export class AppComponent {
  /** Istanziato subito: applica il velo grafico prima del primo disegno. */
  private readonly theme = inject(ThemeService);
}
