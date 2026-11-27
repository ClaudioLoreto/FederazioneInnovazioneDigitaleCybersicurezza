// =============================================================================
//  frontend/src/app/pages/pagina-legale/pagina-legale.component.ts
//  PAGINE LEGALI (/privacy, /cookie, /note-legali, /accessibilita).
//
//  Un solo componente per le quattro pagine: la rotta dice quale mostrare
//  (data.chiave). Testi modificabili da Backoffice → Contenuti del sito →
//  Pagine legali; le bozze di partenza sono in content/testi-legali.ts.
//  Il testo è HTML semplice scritto con l'editor del backoffice: Angular lo
//  ripulisce prima di inserirlo ([innerHTML] passa dal sanitizer).
// =============================================================================

import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { EmblemaTemaComponent, TemaEmblema } from '../../shared/emblemi/emblema-tema.component';
import { ContenutiService } from '../../services/contenuti.service';
import { ChiaveLegale, PERCORSI_LEGALI } from '../../content/testi-legali';

const EMBLEMI: Record<ChiaveLegale, TemaEmblema> = {
  privacy: 'lucchetto', cookie: 'impronta', noteLegali: 'bilancia', accessibilita: 'persona'
};

@Component({
  selector: 'fidc-pagina-legale',
  standalone: true,
  imports: [DatePipe, RouterLink, TestataPubblicaComponent, PiedePubblicoComponent, EmblemaTemaComponent],
  template: `
  <fidc-testata-pubblica></fidc-testata-pubblica>

  <main id="contenuto">
    <section class="tone-dark apertura">
      <div class="container apertura-cal">
        <div>
          <nav class="briciole" aria-label="Percorso">
            <a routerLink="/">Home</a><span aria-hidden="true">/</span>
            <span aria-current="page">{{ pagina().titolo }}</span>
          </nav>
          <h1>{{ pagina().titolo }}</h1>
          @if (pagina().aggiornata) {
            <p class="meta">Ultimo aggiornamento: <time [attr.datetime]="pagina().aggiornata">{{ pagina().aggiornata | date:'d MMMM yyyy' }}</time></p>
          }
        </div>
        <fidc-emblema-tema class="apertura-emblema" [tipo]="emblema()" [vivo]="true" aria-hidden="true"></fidc-emblema-tema>
      </div>
    </section>

    <section class="tone-light corpo">
      <div class="container corpo-griglia">
        <div class="testo" [innerHTML]="pagina().testo"></div>
        <nav class="altre" aria-label="Altre informazioni legali">
          <h2>Altre informazioni</h2>
          <ul>
            @for (a of altre(); track a.chiave) {
              <li><a [routerLink]="a.percorso">{{ a.titolo }}</a></li>
            }
          </ul>
        </nav>
      </div>
    </section>
  </main>

  <fidc-piede-pubblico></fidc-piede-pubblico>
  `,
  styleUrls: ['../dettaglio/dettaglio.scss', '../calendario-eventi/calendario-eventi.component.scss'],
  styles: [`
    .altre { padding: 22px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card-bg); color: var(--card-text); }
    .altre h2 { font-size: 1.1rem; margin-bottom: 12px; }
    .altre ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    .altre a { color: var(--card-text); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--line-strong); }
    .altre a:hover { color: var(--signal); }
  `]
})
export class PaginaLegaleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly contenuti = inject(ContenutiService);

  private readonly chiave = toSignal(this.route.data.pipe(map((d) => d['chiave'] as ChiaveLegale)), { initialValue: 'privacy' as ChiaveLegale });

  readonly pagina = computed(() => this.contenuti.attuali().legali[this.chiave()]);
  readonly emblema = computed(() => EMBLEMI[this.chiave()]);
  readonly altre = computed(() => {
    const legali = this.contenuti.attuali().legali;
    return (Object.keys(PERCORSI_LEGALI) as ChiaveLegale[])
      .filter((k) => k !== this.chiave())
      .map((k) => ({ chiave: k, percorso: PERCORSI_LEGALI[k], titolo: legali[k].titolo }));
  });
}
