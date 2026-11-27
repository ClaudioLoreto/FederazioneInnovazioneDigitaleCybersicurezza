// =============================================================================
//  frontend/src/app/pages/news-dettaglio/news-dettaglio.component.ts
//  DETTAGLIO NEWS (/news/:id) — impaginato come un articolo di magazine.
//
//  Testata con ambito, data, tempo di lettura, titolo e sommario; copertina
//  illustrata; corpo con righe di 60–70 caratteri; condivisione; "Leggi anche".
//  Se l'API non risponde si usano le news di riserva (stesse del seeder).
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { FidcApiService, News } from '../../services/fidc-api.service';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { IllustrazioneComponent, ScenaIllustrazione } from '../../shared/illustrazioni/illustrazione.component';
import { etichettaPilastro } from '../../shared/opzioni';
import { VetrinaService } from '../../services/vetrina.service';

@Component({
  selector: 'fidc-news-dettaglio',
  standalone: true,
  imports: [DatePipe, RouterLink, TestataPubblicaComponent, PiedePubblicoComponent, IllustrazioneComponent],
  styleUrls: ['../dettaglio/dettaglio.scss', './news-dettaglio.component.scss'],
  template: `
  <fidc-testata-pubblica></fidc-testata-pubblica>

  <main id="contenuto">
    @if (caricamento()) {
      <section class="tone-dark apertura"><div class="container">
        <div class="scheletro-riga" style="width: 30%"></div>
        <div class="scheletro-riga titolo"></div>
        <div class="scheletro-riga" style="width: 60%; margin-top: 18px"></div>
      </div></section>
    } @else { @if (news(); as n) {
      <article>
        <header class="tone-dark apertura">
          <div class="container stretto">
            <nav class="briciole" aria-label="Percorso">
              <a routerLink="/">Home</a><span aria-hidden="true">/</span>
              <a routerLink="/news">Notizie</a><span aria-hidden="true">/</span>
              <span aria-current="page">{{ etichetta(n.pilastro) }}</span>
            </nav>
            <p class="meta">
              <span class="badge">{{ etichetta(n.pilastro) }}</span>
              @if (n.dataPubblicazione) { <time [attr.datetime]="n.dataPubblicazione">{{ n.dataPubblicazione | date:'d MMMM y' }}</time> }
              <span>{{ minutiLettura() }} min di lettura</span>
            </p>
            <h1>{{ n.titolo }}</h1>
            <p class="sottotitolo">{{ n.sommario }}</p>
          </div>
        </header>

        <div class="tone-light corpo">
          <div class="container stretto">
            <figure class="copertina-articolo" aria-hidden="true">
              <fidc-illustrazione [scena]="scena(n.pilastro)"></fidc-illustrazione>
            </figure>
            <div class="testo" [innerHTML]="corpo()"></div>

            <div class="condividi">
              <span>Condividi</span>
              <a class="btn-outline btn-sm" [href]="linkedin(n)" target="_blank" rel="noopener">LinkedIn</a>
              <a class="btn-outline btn-sm" [href]="email(n)">Email</a>
              <button type="button" class="btn-outline btn-sm" (click)="copia(n)">Copia il link</button>
              @if (copiato()) { <span class="esito-copia" role="status">Link copiato</span> }
            </div>
          </div>
        </div>
      </article>

      @if (altre().length) {
        <section class="tone-dark correlati" aria-labelledby="t-altre">
          <div class="container">
            <h2 id="t-altre">Leggi anche</h2>
            <div class="correlati-griglia">
              @for (a of altre(); track a.id) {
                <article class="correlato">
                  <p class="correlato-meta"><span class="badge">{{ etichetta(a.pilastro) }}</span>{{ a.dataPubblicazione | date:'d MMMM y' }}</p>
                  <h3><a [routerLink]="['/news', a.id]">{{ a.titolo }}</a></h3>
                  <p>{{ a.sommario }}</p>
                </article>
              }
            </div>
          </div>
        </section>
      }
    } @else {
      <section class="tone-dark"><div class="container stato-pagina">
        @if (irraggiungibile()) {
          <h1>Non riusciamo a caricare la notizia</h1>
          <p>Il servizio non risponde in questo momento. Riprova tra qualche minuto.</p>
          <a class="btn-primary" routerLink="/">Torna alla home</a>
        } @else {
          <h1>Questa notizia non è disponibile</h1>
          <p>Potrebbe essere stata rimossa o non essere ancora pubblicata.</p>
          <a class="btn-primary" routerLink="/news">Tutte le notizie</a>
        }
      </div></section>
    }
    }
  </main>

  <fidc-piede-pubblico></fidc-piede-pubblico>
  `
})
export class NewsDettaglioComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly titolo = inject(Title);
  private readonly meta = inject(Meta);

  readonly news = signal<News | null>(null);
  private readonly vetrina = inject(VetrinaService);
  /** Tutte le news pubblicate (per "altre news"). */
  readonly tutte = computed(() => this.vetrina.news() ?? []);
  /** Il server non ha risposto (diverso da "news inesistente"). */
  readonly irraggiungibile = signal(false);
  readonly caricamento = signal(true);
  readonly copiato = signal(false);

  /** Il corpo dell'articolo; se manca, il sommario fa da testo. */
  readonly corpo = computed(() => {
    const n = this.news();
    if (!n) return '';
    return n.contenuto?.trim() ? (n.contenuto.includes('<') ? n.contenuto : `<p>${n.contenuto}</p>`) : `<p>${n.sommario}</p>`;
  });

  /** Tempo di lettura stimato a 200 parole al minuto, almeno uno. */
  readonly minutiLettura = computed(() => {
    const parole = this.corpo().replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(parole / 200));
  });

  readonly altre = computed(() => {
    const id = this.news()?.id;
    return this.tutte()
      .filter((n) => n.id !== id)
      .sort((a, b) => +new Date(b.dataPubblicazione ?? 0) - +new Date(a.dataPubblicazione ?? 0))
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((p: ParamMap) => this.carica(Number(p.get('id'))));
    this.vetrina.carica();
  }

  private carica(id: number): void {
    this.caricamento.set(true);
    const imposta = (n: News | null) => {
      this.news.set(n);
      this.caricamento.set(false);
      if (n) {
        this.titolo.setTitle(`${n.titolo} — FIDC`);
        this.meta.updateTag({ name: 'description', content: n.sommario });
        this.meta.updateTag({ property: 'og:title', content: n.titolo });
        this.meta.updateTag({ property: 'og:description', content: n.sommario });
      }
    };
    this.api.getNewsDettaglio(id).subscribe({
      next: imposta,
      error: (err: HttpErrorResponse) => { imposta(null); this.irraggiungibile.set(err.status !== 404); }
    });
  }

  etichetta(v: string): string { return etichettaPilastro(v); }

  scena(pilastro: string): ScenaIllustrazione {
    const s: Record<string, ScenaIllustrazione> = { Attivita: 'gruppo-di-lavoro', Eventi: 'conferenza', Formazione: 'formazione', Ricerca: 'analisi' };
    return s[pilastro] ?? 'analisi';
  }

  private url(n: News): string { return `${location.origin}/news/${n.id}`; }
  linkedin(n: News): string { return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.url(n))}`; }
  email(n: News): string { return `mailto:?subject=${encodeURIComponent(n.titolo)}&body=${encodeURIComponent(n.sommario + '\n\n' + this.url(n))}`; }

  async copia(n: News): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url(n));
      this.copiato.set(true);
      setTimeout(() => this.copiato.set(false), 2500);
    } catch { /* appunti non disponibili */ }
  }
}
