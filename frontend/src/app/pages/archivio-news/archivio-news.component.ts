// =============================================================================
//  frontend/src/app/pages/archivio-news/archivio-news.component.ts
//  ARCHIVIO DELLE NOTIZIE (/news) — tutte le news pubblicate, dalla più recente.
//
//  Ricerca, filtro per ambito e raggruppamento per mese: chi cerca "quella
//  notizia di primavera" la trova scorrendo i mesi. Dodici alla volta, poi
//  "Mostra altre" (niente paginazione numerata: si perde il segno).
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { EmblemaTemaComponent } from '../../shared/emblemi/emblema-tema.component';
import { News } from '../../services/fidc-api.service';
import { VetrinaService } from '../../services/vetrina.service';
import { PILASTRI, etichettaPilastro } from '../../shared/opzioni';

const PASSO = 12;

@Component({
  selector: 'fidc-archivio-news',
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
            <span aria-current="page">Notizie</span>
          </nav>
          <h1>Notizie dalla Federazione</h1>
          <p class="sottotitolo">Ricerche, programmi e posizioni pubbliche, dalla più recente.</p>
        </div>
        <fidc-emblema-tema class="apertura-emblema" tipo="documento" [vivo]="true" aria-hidden="true"></fidc-emblema-tema>
      </div>
    </section>

    <section class="tone-light corpo">
      <div class="container">
        <div class="filtri" role="search">
          <label class="cerca">
            <span class="sr-only">Cerca una notizia</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
            <input type="search" [value]="cerca()" (input)="cerca.set($any($event.target).value); quante.set(passo)" placeholder="Cerca per titolo o sommario" />
          </label>
          <div class="scelte" role="group" aria-label="Ambito">
            @for (a of ambiti; track a.valore) {
              <button type="button" [class.on]="ambito() === a.valore" [attr.aria-pressed]="ambito() === a.valore"
                      (click)="ambito.set(a.valore); quante.set(passo)">{{ a.etichetta }}</button>
            }
          </div>
        </div>

        <div aria-live="polite">
          @if (caricamento()) {
            <div class="griglia-news">@for (s of [1, 2, 3]; track s) { <div class="scheda scheletro"></div> }</div>
          } @else {
            @for (g of gruppi(); track g.mese) {
              <section class="gruppo" [attr.aria-label]="g.mese">
                <h2 class="gruppo-mese">{{ g.mese }}</h2>
                <div class="griglia-news">
                  @for (n of g.news; track n.id) {
                    <article class="scheda">
                      <p class="scheda-meta">
                        <span class="badge">{{ etichetta(n.pilastro) }}</span>
                        @if (n.dataPubblicazione) { <time [attr.datetime]="n.dataPubblicazione">{{ n.dataPubblicazione | date:'d MMMM yyyy' }}</time> }
                      </p>
                      <h3><a class="esteso" [routerLink]="['/news', n.id]">{{ n.titolo }}</a></h3>
                      <p class="scheda-sommario">{{ n.sommario }}</p>
                    </article>
                  }
                </div>
              </section>
            } @empty {
              <div class="vuoto">
                @if (cerca().trim() || ambito() !== 'tutti') {
                  <p>Nessuna notizia con questi filtri.</p>
                  <button type="button" class="btn-outline btn-sm" (click)="cerca.set(''); ambito.set('tutti')">Mostra tutte le notizie</button>
                } @else {
                  <p>Non ci sono ancora notizie pubblicate. Iscriviti alla newsletter per ricevere le prossime.</p>
                  <a class="btn-primary btn-sm" routerLink="/" fragment="newsletter">Iscriviti alla newsletter</a>
                }
              </div>
            }
            @if (filtrate().length > quante()) {
              <div class="altre">
                <p>Ne stai vedendo {{ quante() }} su {{ filtrate().length }}.</p>
                <button type="button" class="btn-outline" (click)="quante.set(quante() + passo)">Mostra altre notizie</button>
              </div>
            }
          }
        </div>
      </div>
    </section>
  </main>

  <fidc-piede-pubblico></fidc-piede-pubblico>
  `,
  styleUrls: ['../dettaglio/dettaglio.scss', '../calendario-eventi/calendario-eventi.component.scss', './archivio-news.component.scss']
})
export class ArchivioNewsComponent implements OnInit {
  private readonly vetrina = inject(VetrinaService);

  readonly ambiti = [{ valore: 'tutti', etichetta: 'Tutte' }, ...PILASTRI];
  readonly passo = PASSO;
  readonly cerca = signal('');
  readonly ambito = signal('tutti');
  readonly quante = signal(PASSO);

  readonly caricamento = computed(() => this.vetrina.news() === null);

  readonly filtrate = computed(() => {
    const q = this.cerca().trim().toLowerCase();
    const a = this.ambito();
    return this.vetrina.ultime()
      .filter((n) => a === 'tutti' || n.pilastro === a)
      .filter((n) => !q || [n.titolo, n.sommario].join(' ').toLowerCase().includes(q))
      // in archivio conta solo la data: la news "in evidenza" non salta in testa
      .sort((x, y) => +new Date(y.dataPubblicazione ?? 0) - +new Date(x.dataPubblicazione ?? 0));
  });

  /** Le news visibili, raggruppate per mese di pubblicazione. */
  readonly gruppi = computed(() => {
    const out: { mese: string; news: News[] }[] = [];
    for (const n of this.filtrate().slice(0, this.quante())) {
      const mese = n.dataPubblicazione
        ? new Date(n.dataPubblicazione).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())
        : 'Senza data';
      const ultimo = out[out.length - 1];
      if (ultimo?.mese === mese) ultimo.news.push(n); else out.push({ mese, news: [n] });
    }
    return out;
  });

  ngOnInit(): void { this.vetrina.carica(); }

  etichetta(v: string): string { return etichettaPilastro(v); }
}
