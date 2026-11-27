// =============================================================================
//  frontend/src/app/app.component.ts
//  Radice dell'applicazione. Contiene ciò che deve esistere una volta sola e
//  valere per ogni pagina:
//   1. la scena di rete di sfondo, in posizione fissa dietro tutto;
//   2. l'area dove il router disegna la pagina corrente;
//   3. finestre di conferma e avvisi, che compaiono sopra qualunque cosa;
//   4. lo spostamento del fuoco sul titolo a ogni cambio pagina.
// =============================================================================

import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './shared/theme/theme.service';
import { BackgroundCanvasComponent } from './shared/background-canvas/background-canvas.component';
import { DialogoComponent } from './shared/dialogo/dialogo.component';
import { AvvisiComponent } from './shared/avvisi/avvisi.component';

@Component({
  selector: 'fidc-root',
  standalone: true,
  imports: [RouterOutlet, BackgroundCanvasComponent, DialogoComponent, AvvisiComponent],
  template: `
    <fidc-background-canvas></fidc-background-canvas>

    <div class="app-layer">
      <router-outlet></router-outlet>
    </div>

    <!-- Montato qui, e non nelle singole pagine, perché una finestra di
         conferma deve poter apparire sopra qualsiasi schermata. -->
    <fidc-dialogo></fidc-dialogo>
    <fidc-avvisi></fidc-avvisi>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    /* La scena di rete sta a z-index -1: questo strato la tiene sotto l'interfaccia
       senza mandarla dietro all'intera pagina (vedi isolation in styles.scss). */
    .app-layer { position: relative; z-index: 1; min-height: 100%; }
  `]
})
export class AppComponent {
  /** Istanziato subito: applica il velo grafico prima del primo disegno. */
  private readonly theme = inject(ThemeService);

  constructor() {
    // In una single-page app il browser non annuncia il cambio di pagina: chi
    // usa un lettore di schermo resterebbe "fermo" sul link appena premuto.
    // Dopo ogni navigazione (tranne la prima e i salti ad ancora) portiamo il
    // fuoco sul titolo della nuova pagina, che così viene letto.
    let prima = true;
    inject(Router).events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe((e) => {
      if (prima) { prima = false; return; }
      if (e.urlAfterRedirects.includes('#')) return;
      setTimeout(() => {
        const titolo = document.querySelector<HTMLElement>('main h1, h1');
        if (!titolo) return;
        titolo.setAttribute('tabindex', '-1');
        titolo.focus({ preventScroll: true });
      }, 120);
    });
  }
}
