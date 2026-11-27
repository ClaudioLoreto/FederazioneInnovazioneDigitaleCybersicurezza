// =============================================================================
//  frontend/src/app/pages/non-trovata/non-trovata.component.ts
//  PAGINA NON TROVATA (404). Prima ogni indirizzo sbagliato riportava in home
//  senza spiegazioni: chi aveva seguito un link vecchio non capiva cosa fosse
//  successo. Ora lo diciamo e offriamo le strade più probabili.
// =============================================================================

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { SafeLogoComponent } from '../../shared/safe-logo/safe-logo.component';

@Component({
  selector: 'fidc-non-trovata',
  standalone: true,
  imports: [RouterLink, TestataPubblicaComponent, PiedePubblicoComponent, SafeLogoComponent],
  template: `
  <fidc-testata-pubblica></fidc-testata-pubblica>
  <main id="contenuto" class="tone-dark">
    <div class="container nt">
      <div class="nt-testo">
        <p class="codice">Errore 404</p>
        <h1>Questa pagina non esiste</h1>
        <p>L'indirizzo potrebbe essere scritto male, oppure la pagina è stata spostata.
           Da qui puoi ripartire da ciò che si cerca più spesso.</p>
        <div class="nt-azioni">
          <a class="btn-primary" routerLink="/">Vai alla home</a>
          <a class="btn-outline" routerLink="/" fragment="eventi">Prossimi eventi</a>
          <a class="btn-outline" routerLink="/" fragment="news">Ultime notizie</a>
        </div>
      </div>
      <div class="nt-cassaforte" aria-hidden="true"><fidc-safe-logo [interactive]="false"></fidc-safe-logo></div>
    </div>
  </main>
  <fidc-piede-pubblico></fidc-piede-pubblico>
  `,
  styles: [`
    main { min-height: 70vh; background: transparent; }
    .nt { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, .6fr); gap: 40px; align-items: center; padding-block: clamp(56px, 10vw, 120px); }
    .codice { font-family: var(--font-display); font-weight: 600; color: var(--signal); font-size: 1.1rem; }
    h1 { margin-top: 10px; font-size: clamp(2.2rem, 1.4rem + 3vw, 3.8rem); }
    p { margin-top: 16px; max-width: 52ch; color: var(--text-soft); font-size: 1.1rem; line-height: 1.6; }
    .nt-azioni { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
    .nt-cassaforte { width: min(280px, 100%); justify-self: center; }
    @media (max-width: 760px) { .nt { grid-template-columns: 1fr; } .nt-cassaforte { width: 160px; order: -1; justify-self: start; } }
  `]
})
export class NonTrovataComponent {}
