// =============================================================================
//  frontend/src/app/shared/auth/auth-shell.component.ts
//  TELAIO DELLE PAGINE DI ACCESSO (/login, /admin/login, /registrati).
//
//  Schermo diviso: a sinistra una vetrina blu con l'emblema e il motivo per cui
//  si entra; a destra il modulo su fondo crema, per il massimo contrasto. I due
//  toni sono FISSI (tone-fixed-*), indipendenti dal velo: il modulo deve essere
//  leggibile sempre. Su telefono la vetrina si riduce a una fascia in alto.
// =============================================================================

import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimatedLogoComponent } from '../animated-logo/animated-logo.component';
import { EmblemaComponent, EmblemaHero } from '../emblema/emblema.component';

@Component({
  selector: 'fidc-auth-shell',
  standalone: true,
  imports: [RouterLink, AnimatedLogoComponent, EmblemaComponent],
  template: `
  <div class="auth">
    <aside class="vetrina tone-fixed-dark">
      <a routerLink="/" class="torna" aria-label="Torna alla home della Federazione">
        <fidc-animated-logo [interactive]="false"></fidc-animated-logo>
      </a>

      <div class="vetrina-emblema" aria-hidden="true">
        <fidc-emblema [forza]="emblema"></fidc-emblema>
      </div>

      <div class="vetrina-testo">
        <h2>{{ titolo }}</h2>
        <p>{{ testo }}</p>
        <ul>
          @for (p of punti; track p) { <li>{{ p }}</li> }
        </ul>
      </div>

      <a routerLink="/" class="home-link">Torna al sito della Federazione</a>
    </aside>

    <main class="modulo tone-fixed-light">
      <div class="modulo-inner">
        <ng-content></ng-content>
      </div>
    </main>
  </div>
  `,
  styleUrl: './auth-shell.component.scss'
})
export class AuthShellComponent {
  @Input() titolo = '';
  @Input() testo = '';
  @Input() punti: string[] = [];
  @Input() emblema: EmblemaHero = 'cassaforte';
}
