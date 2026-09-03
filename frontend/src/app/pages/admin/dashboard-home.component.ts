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
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FidcApiService, Evento, News } from '../../services/fidc-api.service';
import { AuthService } from '../../services/auth.service';

/**
 * Home del backoffice: mosaic HUD, numeri che sbordano, niente griglia a 3 colonne uguali.
 */
@Component({
  selector: 'fidc-dashboard-home',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
  <div class="dash">
    <header class="head">
      <span class="sys">Federazione Innovazione, Digitale e Cybersicurezza</span>
      <h1>Panoramica</h1>
      <p>{{ auth.isSuperUser()
            ? 'Stai visualizzando i dati dell\\'intera Federazione.'
            : 'Stai visualizzando i contenuti di cui sei responsabile.' }}</p>
    </header>

    <div class="bento">
      <article class="tile events hud-cut">
        <span class="kpi" aria-hidden="true">{{ eventi().length }}</span>
        <span class="kicker">Eventi</span>
        <h2 class="lbl">{{ eventi().length }} eventi in archivio</h2>
        <span class="sub">{{ eventiPubblicati() }} pubblicati · {{ eventi().length - eventiPubblicati() }} in bozza</span>
        <a routerLink="/admin/eventi" class="go">Gestisci gli eventi →</a>
      </article>

      <article class="tile news hud-cut-alt">
        <span class="kpi" aria-hidden="true">{{ news().length }}</span>
        <span class="kicker">Comunicazione</span>
        <h2 class="lbl">{{ news().length }} news in archivio</h2>
        <span class="sub">{{ newsPubblicate() }} pubblicate · {{ news().length - newsPubblicate() }} in bozza</span>
        <a routerLink="/admin/news" class="go">Gestisci le news →</a>
      </article>

      <article class="tile scope hud-cut">
        <span class="kicker">Permessi</span>
        <h2 class="lbl">{{ auth.isSuperUser() ? 'Direzione' : 'Redazione' }}</h2>
        <span class="sub">{{ auth.isSuperUser()
              ? 'Puoi intervenire sui contenuti di tutti gli autori.'
              : 'Puoi intervenire solo sui contenuti di cui sei autore.' }}</span>
        <a *ngIf="auth.isSuperUser()" routerLink="/admin/utenti" class="go">Gestisci gli utenti →</a>
      </article>
    </div>

    <p class="loading" *ngIf="caricamento()">Caricamento dei dati in corso…</p>
  </div>
  `,
  styles: [`
    .dash { max-width: 1180px; color: var(--text); position: relative; overflow: visible; }
    .head { margin: 0 0 8px 8px; max-width: 520px; }
    /* Il nome esteso dell'ente sopra il titolo: chi apre il backoffice deve
       vedere per esteso di quale organizzazione sta gestendo i contenuti. */
    .sys { display:block; font-family: var(--font-display); font-size:.7rem; letter-spacing:.14em;
           text-transform:uppercase; color: var(--accent); margin-bottom: 8px; }
    /* Titolo contenuto: su un sito istituzionale la dimensione serve a dare
       gerarchia, non a fare effetto. */
    .head h1 { margin:0 0 8px; font-size: clamp(2rem, 3.4vw, 3rem); font-family: var(--font-display);
               line-height:1.05; letter-spacing:-.02em; }
    .head p { margin:0 0 36px; color: var(--text-soft); max-width: 380px; }

    .bento {
      display: grid;
      grid-template-columns: 1.45fr .95fr;
      grid-template-rows: minmax(200px, auto) minmax(160px, auto);
      gap: 22px 28px;
      align-items: stretch;
      padding: 28px 4vw 12px 0;
    }

    .tile {
      position: relative;
      overflow: visible;
      isolation: isolate;
      padding: 28px 26px 22px;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      backdrop-filter: blur(var(--surface-blur));
      -webkit-backdrop-filter: blur(var(--surface-blur));
      min-height: 160px;
    }
    .hud-cut {
      clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
    }
    .hud-cut-alt {
      clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%, 0 18px);
    }

    .events { grid-column: 1; grid-row: 1 / 3; min-height: 340px; margin-left: -12px; }
    .news { grid-column: 2; grid-row: 1; transform: translate(18px, -36px); }
    .scope { grid-column: 2; grid-row: 2; width: 82%; justify-self: end; margin-top: 12px; }

    .kicker { position: relative; z-index: 1; font-size:.72rem; font-weight:800; letter-spacing:.16em;
              text-transform:uppercase; color: var(--accent); }
    .lbl { position: relative; z-index: 1; margin: 10px 0 6px; font-size: 1.15rem; font-weight: 800; }
    .sub { position: relative; z-index: 1; display:block; color: var(--text-soft); font-size:.88rem; }

    /* Il numero grande resta come segno grafico del riquadro, ma dentro i suoi
       bordi e con poco contrasto: deve accompagnare il dato, non sovrastarlo.
       Prima sbordava e sembrava il punteggio di un gioco. */
    .kpi {
      position: absolute; right: 18px; bottom: 12px; z-index: 0;
      font-family: var(--font-display); font-size: clamp(3.2rem, 5vw, 4.6rem);
      font-weight: 700; line-height: .85; letter-spacing: -.04em;
      color: var(--accent); opacity: .16;
      pointer-events: none; user-select: none;
    }
    .events .kpi { font-size: clamp(4rem, 6vw, 5.6rem); }
    .scope .kpi { font-size: 3.2rem; }

    .go { position: relative; z-index: 1; margin-top: 22px; display:inline-block; font-weight:800;
          color: var(--accent); text-decoration:none;
          padding: 6px 0; border-bottom: 2px solid transparent; }
    .go:hover { border-bottom-color: var(--accent); }
    .go:focus-visible { outline: none; box-shadow: var(--glow-focus); }
    .go.static { color: var(--text-muted); }
    .loading { margin-top:18px; color: var(--text-muted); font-style:italic; }

    /* Su schermo stretto i riquadri si impilano e tornano tutti della stessa
       forma: lo sfalsamento funziona in orizzontale, in colonna produrrebbe
       solo altezze disuguali e spazi vuoti. */
    @media (max-width: 820px) {
      .bento { grid-template-columns: 1fr; grid-template-rows: auto; padding: 0; gap: 16px; }
      .events, .news, .scope {
        grid-column: 1; grid-row: auto; transform: none; width: 100%;
        margin: 0; min-height: 150px; justify-self: stretch;
      }
      .events .kpi, .news .kpi, .scope .kpi { font-size: 3.4rem; }
      .head h1 { font-size: 1.9rem; }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  readonly auth = inject(AuthService);

  readonly eventi = signal<Evento[]>([]);
  readonly news = signal<News[]>([]);
  readonly caricamento = signal(true);

  readonly eventiPubblicati = computed(() => this.eventi().filter((e) => e.pubblicato).length);
  readonly newsPubblicate = computed(() => this.news().filter((n) => n.pubblicato).length);

  ngOnInit(): void {
    let pendenti = 2;
    const fine = () => { if (--pendenti === 0) this.caricamento.set(false); };
    this.api.getEventiGestione().subscribe({ next: (e) => this.eventi.set(e), complete: fine, error: fine });
    this.api.getNewsGestione().subscribe({ next: (n) => this.news.set(n), complete: fine, error: fine });
  }
}
