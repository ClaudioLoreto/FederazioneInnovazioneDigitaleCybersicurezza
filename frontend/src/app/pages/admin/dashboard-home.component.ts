// =============================================================================
//  frontend/src/app/pages/admin/dashboard-home.component.ts
//  BACKOFFICE — Panoramica HUD decostruita (bento asimmetrico, clip-path cyber).
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
      <span class="sys">SYS // NODE.01</span>
      <h1>Panoramica</h1>
      <p>{{ auth.isSuperUser()
            ? 'Stai visualizzando i dati dell\\'intera Federazione.'
            : 'Stai visualizzando i contenuti di cui sei responsabile.' }}</p>
    </header>

    <div class="bento">
      <article class="tile events hud-cut">
        <span class="kpi" aria-hidden="true">{{ eventi().length }}</span>
        <span class="kicker">Eventi</span>
        <h2 class="lbl">Eventi totali</h2>
        <span class="sub">{{ eventiPubblicati() }} pubblicati · {{ eventi().length - eventiPubblicati() }} bozze</span>
        <a routerLink="/admin/eventi" class="go">Gestisci →</a>
      </article>

      <article class="tile news hud-cut-alt">
        <span class="kpi" aria-hidden="true">{{ news().length }}</span>
        <span class="kicker">Feed</span>
        <h2 class="lbl">News totali</h2>
        <span class="sub">{{ newsPubblicate() }} pubblicate · {{ news().length - newsPubblicate() }} bozze</span>
        <a routerLink="/admin/news" class="go">Gestisci →</a>
      </article>

      <article class="tile scope hud-cut">
        <span class="kpi" aria-hidden="true">{{ auth.isSuperUser() ? '∞' : '1' }}</span>
        <span class="kicker">RBAC</span>
        <h2 class="lbl">Ambito</h2>
        <span class="sub">{{ auth.isSuperUser() ? 'Tutti gli autori' : 'Solo i tuoi contenuti' }}</span>
        <span class="go static">Lock attivo</span>
      </article>
    </div>

    <p class="loading" *ngIf="caricamento()">Sincronizzazione nodi…</p>
  </div>
  `,
  styles: [`
    .dash { max-width: 1180px; color: var(--c-cream); position: relative; overflow: visible; }
    .head { margin: 0 0 8px 8px; max-width: 520px; }
    .sys { display:block; font-family: var(--font-display); font-size:.72rem; letter-spacing:.22em;
           color: var(--c-peach); margin-bottom: 6px; }
    .head h1 { margin:0 0 8px; font-size: clamp(2.4rem, 5vw, 4.2rem); font-family: var(--font-display);
               line-height:.9; letter-spacing:-.03em; }
    .head p { margin:0 0 36px; color: rgba(255,240,217,.7); max-width: 380px; }

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
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
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
              text-transform:uppercase; color: var(--c-peach); }
    .lbl { position: relative; z-index: 1; margin: 10px 0 6px; font-size: 1.15rem; font-weight: 800; }
    .sub { position: relative; z-index: 1; display:block; color: rgba(255,240,217,.65); font-size:.88rem; }
    .kpi {
      position: absolute; right: -12px; top: -28px; z-index: 0;
      font-family: var(--font-display); font-size: clamp(5.2rem, 10vw, 8.5rem);
      font-weight: 700; line-height: .78; letter-spacing: -.06em;
      color: var(--c-peach); opacity: .28;
      pointer-events: none; user-select: none;
    }
    .events .kpi { color: var(--c-purple); opacity: .42; left: auto; right: -8px; top: 18%; font-size: 11rem; }
    .news .kpi { color: var(--c-peach); }
    .scope .kpi { right: 8px; top: -18px; font-size: 5.4rem; opacity: .5; }

    .go { position: relative; z-index: 1; margin-top: 22px; display:inline-block; font-weight:800;
          color: var(--c-peach); text-decoration:none; clip-path: polygon(0 0, 100% 0, 92% 100%, 0 100%);
          padding: 6px 16px 6px 0; }
    .go:hover { text-shadow: 0 0 14px rgba(255,207,149,.75); }
    .go.static { color: rgba(255,240,217,.45); }
    .loading { margin-top:18px; color: rgba(255,240,217,.6); font-style:italic; }

    @media (max-width: 820px) {
      .bento { grid-template-columns: 1fr; grid-template-rows: auto; padding: 0; }
      .events, .news, .scope { grid-column: 1; grid-row: auto; transform: none; width: 100%;
                               margin: 0; min-height: 180px; }
      .events .kpi { font-size: 6rem; top: -10px; }
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
