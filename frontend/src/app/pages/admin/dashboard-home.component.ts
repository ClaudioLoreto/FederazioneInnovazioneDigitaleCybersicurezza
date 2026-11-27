// =============================================================================
//  frontend/src/app/pages/admin/dashboard-home.component.ts
//  Prima schermata del backoffice: quanti contenuti esistono, quanti sono
//  pubblicati e su cosa si è autorizzati a intervenire, con il collegamento
//  diretto alla sezione corrispondente.
//
//  I tre riquadri sono di dimensioni diverse di proposito: il peso visivo
//  segue l'importanza del dato. Su schermo stretto tornano tutti uguali,
//  perché in colonna lo sfalsamento produce solo spazi vuoti.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FidcApiService, Documento, Evento, News, StatoContenuto, statoDi } from '../../services/fidc-api.service';
import { Flusso } from '../../shared/flusso';
import { permessiArea } from '../../shared/permessi';
import { AuthService } from '../../services/auth.service';

/**
 * Home del backoffice: mosaic HUD, numeri che sbordano, niente griglia a 3 colonne uguali.
 */
@Component({
  selector: 'fidc-dashboard-home',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="dash">
    <header class="head">
      <h1>Panoramica</h1>
      <p>{{ auth.isSuperUser()
            ? 'Stai vedendo i dati dell’intera Federazione.'
            : 'Stai vedendo i contenuti su cui puoi intervenire.' }}</p>
    </header>

    <!-- Cose che aspettano te: prima di tutto il resto, perché bloccano altri. -->
    @if (daApprovare().length || daRivedere().length) {
      <section class="attese" aria-label="In attesa di un tuo intervento">
        @for (a of daApprovare(); track a.area) {
          <a class="attesa" [routerLink]="'/admin/' + a.area" [queryParams]="{ filtro: 'approvare' }">
            <strong>{{ a.n }}</strong>
            <span>{{ a.n === 1 ? a.uno : a.molti }} da approvare</span>
          </a>
        }
        @for (a of daRivedere(); track a.area) {
          <a class="attesa rivedere" [routerLink]="'/admin/' + a.area">
            <strong>{{ a.n }}</strong>
            <span>{{ a.n === 1 ? a.rimandatoUno : a.rimandatiMolti }} dal revisore, con una nota</span>
          </a>
        }
      </section>
    }

    <!-- Azioni frequenti a un clic: è ciò che si fa più spesso aprendo il backoffice. -->
    <nav class="rapide" aria-label="Azioni rapide">
      @if (auth.puo('eventi.scrivere')) { <a class="btn-primary" routerLink="/admin/eventi" [queryParams]="{ nuovo: 1 }">Nuovo evento</a> }
      @if (auth.puo('news.scrivere')) { <a class="btn-outline" routerLink="/admin/news" [queryParams]="{ nuovo: 1 }">Scrivi una news</a> }
      @if (auth.puo('documenti.scrivere')) { <a class="btn-outline" routerLink="/admin/documenti" [queryParams]="{ nuovo: 1 }">Carica un documento</a> }
    </nav>

    <div class="tiles">
      @if (vedeEventi) {
      <article class="tile principale">
        <h2>Eventi</h2>
        <p class="numero" [attr.aria-label]="eventi().length + ' eventi'">{{ caricamento() ? '–' : eventi().length }}</p>
        <div class="barra" aria-hidden="true"><span [style.width.%]="percento(eventiPubblicati(), eventi().length)"></span></div>
        <p class="sub">Pubblicati {{ eventiPubblicati() }} su {{ eventi().length }}</p>
        <a routerLink="/admin/eventi" class="go">Gestisci gli eventi</a>
      </article>
      }

      @if (vedeNews) {
      <article class="tile">
        <h2>News</h2>
        <p class="numero" [attr.aria-label]="news().length + ' news'">{{ caricamento() ? '–' : news().length }}</p>
        <div class="barra" aria-hidden="true"><span [style.width.%]="percento(newsPubblicate(), news().length)"></span></div>
        <p class="sub">Pubblicate {{ newsPubblicate() }} su {{ news().length }}</p>
        <a routerLink="/admin/news" class="go">Gestisci le news</a>
      </article>
      }

      <article class="tile">
        <h2>I tuoi permessi</h2>
        <p class="ruolo">{{ auth.livello() }}</p>
        <p class="sub">{{ auth.riassunto() }}.</p>
        @if (auth.isSuperUser()) { <a routerLink="/admin/permessi" class="go">Gestisci i permessi</a> }
      </article>
    </div>
  </div>
  `,
  styles: [`
    .dash { max-width: 1180px; color: var(--text); }
    .head h1 { font-size: clamp(2rem, 1.5rem + 1.6vw, 2.8rem); }
    .head p { margin-top: 8px; color: var(--text-soft); }

    .rapide { display: flex; flex-wrap: wrap; gap: 12px; margin: 28px 0 32px; }

    .tiles { display: grid; gap: 18px; grid-template-columns: 1.3fr 1fr 1fr; }
    .tile {
      display: flex; flex-direction: column; gap: 6px;
      padding: 24px;
      background: var(--surface); color: var(--text);
      border: 1px solid var(--surface-border); border-radius: var(--radius);
      backdrop-filter: blur(var(--surface-blur)); -webkit-backdrop-filter: blur(var(--surface-blur));
    }
    .tile.principale { border-top: 3px solid var(--signal); }
    .tile h2 { font-size: 1.1rem; color: var(--text-soft); font-family: var(--font-body); font-weight: 600; }
    .numero {
      font-family: var(--font-display); font-weight: 700; line-height: 1;
      font-size: clamp(2.8rem, 2rem + 2.4vw, 4rem); color: var(--signal);
      font-variant-numeric: tabular-nums;
    }
    .ruolo { font-family: var(--font-display); font-weight: 700; font-size: 1.8rem; }
    .barra { height: 6px; margin: 8px 0 4px; background: var(--surface-strong); border-radius: 3px; overflow: hidden; }
    .barra span { display: block; height: 100%; background: var(--signal); border-radius: 3px; transition: width .8s var(--ease-spatial); }
    .sub { color: var(--text-soft); line-height: 1.5; }
    .go {
      margin-top: auto; padding-top: 16px; align-self: flex-start;
      font-weight: 600; color: var(--text);
      text-decoration: underline; text-decoration-color: var(--line-strong); text-underline-offset: 4px;
      &:hover { color: var(--signal); text-decoration-color: currentColor; }
    }

    .attese { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
    .attesa {
      display: flex; align-items: baseline; gap: 12px; flex: 0 1 380px;
      padding: 16px 20px; color: var(--text);
      background: var(--surface); border: 1px solid var(--signal); border-left-width: 4px;
      border-radius: var(--radius);
      transition: background .2s;
      strong { font-family: var(--font-display); font-size: 2rem; line-height: 1; color: var(--signal); font-variant-numeric: tabular-nums; }
      span { color: var(--text-soft); line-height: 1.4; }
      &:hover { background: var(--accent-soft); }
      &:focus-visible { outline: none; box-shadow: var(--glow-focus); }
      &.rivedere { border-color: var(--text); strong { color: var(--text); } }
    }

    @media (max-width: 900px) {
      .tiles { grid-template-columns: minmax(0, 1fr); }
      .rapide a { flex: 1 1 100%; }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  readonly auth = inject(AuthService);

  readonly eventi = signal<Evento[]>([]);
  readonly news = signal<News[]>([]);
  readonly documenti = signal<Documento[]>([]);
  readonly caricamento = signal(true);

  readonly vedeEventi = this.auth.puoUno(permessiArea('eventi'));
  readonly vedeNews = this.auth.puoUno(permessiArea('news'));
  private readonly vedeDocumenti = this.auth.puoUno(permessiArea('documenti'));

  private readonly flussi = {
    news: new Flusso(this.auth, 'news'),
    eventi: new Flusso(this.auth, 'eventi'),
    documenti: new Flusso(this.auth, 'documenti')
  };

  /** Contenuti in coda che spetta a te approvare, per area. */
  readonly daApprovare = computed(() => this.conta((f, c) => f.puoRevisionare(c)));
  /** Tuoi contenuti rimandati indietro con una nota. */
  readonly daRivedere = computed(() => this.conta((f, c) => f.mio(c) && statoDi(c) === 'DaRivedere'));

  private conta(prova: (f: Flusso, c: { stato?: StatoContenuto; pubblicato?: boolean; autore: number }) => boolean) {
    const righe = [
      { area: 'news', uno: 'News', molti: 'News', rimandatoUno: 'News rimandata', rimandatiMolti: 'News rimandate', n: this.news().filter((x) => prova(this.flussi.news, { stato: x.stato, pubblicato: x.pubblicato, autore: x.autoreId })).length },
      { area: 'eventi', uno: 'Evento', molti: 'Eventi', rimandatoUno: 'Evento rimandato', rimandatiMolti: 'Eventi rimandati', n: this.eventi().filter((x) => prova(this.flussi.eventi, { stato: x.stato, pubblicato: x.pubblicato, autore: x.relatoreId })).length },
      { area: 'documenti', uno: 'Documento', molti: 'Documenti', rimandatoUno: 'Documento rimandato', rimandatiMolti: 'Documenti rimandati', n: this.documenti().filter((x) => prova(this.flussi.documenti, { stato: x.stato, autore: x.caricatoDaId })).length }
    ];
    return righe.filter((r) => r.n > 0);
  }

  readonly eventiPubblicati = computed(() => this.eventi().filter((e) => e.pubblicato).length);
  readonly newsPubblicate = computed(() => this.news().filter((n) => n.pubblicato).length);

  /** Quota pubblicata, in percentuale (0 se non ci sono elementi). */
  percento(parte: number, totale: number): number {
    return totale ? Math.round((parte / totale) * 100) : 0;
  }

  ngOnInit(): void {
    let pendenti = 1 + (this.vedeEventi ? 1 : 0) + (this.vedeNews ? 1 : 0) + (this.vedeDocumenti ? 1 : 0);
    const fine = () => { if (--pendenti === 0) this.caricamento.set(false); };
    if (this.vedeEventi) this.api.getEventiGestione().subscribe({ next: (e) => this.eventi.set(e), complete: fine, error: fine });
    if (this.vedeNews) this.api.getNewsGestione().subscribe({ next: (n) => this.news.set(n), complete: fine, error: fine });
    if (this.vedeDocumenti) this.api.getDocumentiGestione().subscribe({ next: (d) => this.documenti.set(d), complete: fine, error: fine });
    fine();
  }
}
