// =============================================================================
//  frontend/src/app/pages/admin/admin-shell.component.ts
//  Telaio del backoffice: menu laterale, barra utente e area dei contenuti.
//  Tutte le schermate riservate vengono disegnate dentro <router-outlet>, così
//  la navigazione resta ferma mentre cambia solo il contenuto.
//  Accessibile solo dietro l'AuthGuard.
// =============================================================================

import { Component, computed, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';
import { descriviRuolo } from '../../shared/ruoli';

@Component({
  selector: 'fidc-admin-shell',
  standalone: true,
  imports: [NgIf, RouterOutlet, RouterLink, RouterLinkActive, AnimatedLogoComponent],
  template: `
  <div class="shell" [class.menu-aperto]="menuAperto()">

    <!-- Comando del menu su schermo stretto. Su schermo largo il menu è sempre
         visibile e questo bottone non serve, quindi viene nascosto. -->
    <button type="button" class="menu-toggle" (click)="menuAperto.set(!menuAperto())"
            [attr.aria-expanded]="menuAperto()" aria-controls="menu-backoffice"
            [attr.aria-label]="menuAperto() ? 'Chiudi il menu' : 'Apri il menu'">
      <span class="hamburger" aria-hidden="true"></span>
    </button>

    <!-- MENU LATERALE -->
    <aside class="sidebar hud-panel" id="menu-backoffice">
      <div class="brand"><fidc-animated-logo></fidc-animated-logo></div>

      <nav (click)="menuAperto.set(false)">
        <a routerLink="/admin/dashboard" routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: true }">
          <span class="ico" aria-hidden="true">▦</span> Pannello
        </a>
        <a routerLink="/admin/eventi" routerLinkActive="active">
          <span class="ico" aria-hidden="true">◆</span> Eventi
        </a>
        <a routerLink="/admin/news" routerLinkActive="active">
          <span class="ico" aria-hidden="true">✎</span> News
        </a>
        <a routerLink="/admin/documenti" routerLinkActive="active">
          <span class="ico" aria-hidden="true">▤</span> Documenti
        </a>

        <!-- Sezioni riservate alla Direzione. Nasconderle è una comodità:
             la protezione vera è sugli endpoint del server. -->
        <ng-container *ngIf="auth.isSuperUser()">
          <span class="nav-sep">Amministrazione</span>
          <a routerLink="/admin/utenti" routerLinkActive="active">
            <span class="ico" aria-hidden="true">◉</span> Utenti
          </a>
          <a routerLink="/admin/newsletter" routerLinkActive="active">
            <span class="ico" aria-hidden="true">✉</span> Newsletter
          </a>
          <a routerLink="/admin/impostazioni" routerLinkActive="active">
            <span class="ico" aria-hidden="true">⚙</span> Aspetto del sito
          </a>
        </ng-container>
      </nav>

      <div class="role-card" *ngIf="auth.utente()">
        <span class="role-label">Profilo attivo</span>
        <strong>{{ ruolo().etichetta }}</strong>
        <small>{{ ruolo().ambito }}</small>
      </div>
    </aside>

    <!-- AREA CONTENUTI -->
    <div class="main">
      <header class="topbar hud-panel" *ngIf="auth.utente() as u">
        <div class="who">
          <span class="hello">Bentornato,</span>
          <strong>{{ u.nomeCompleto }}</strong>
          <span class="badge">{{ ruolo().etichetta }}</span>
        </div>

        <!-- Uscita: icona con etichetta accessibile. Il simbolo è comprensibile
             a colpo d'occhio e non occupa spazio nella barra. -->
        <button type="button" class="logout" (click)="logout()"
                aria-label="Esci dall'area riservata" title="Esci dall'area riservata">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 8l-4 4 4 4M6 12h9"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </header>

      <section class="content">
        <router-outlet></router-outlet>
      </section>
    </div>

    <!-- Velo che chiude il menu toccando fuori, su schermo stretto. -->
    <div class="scrim" (click)="menuAperto.set(false)" aria-hidden="true"></div>
  </div>
  `,
  styles: [`
    :host { display:block; }

    .shell {
      display:grid; grid-template-columns: 248px 1fr; min-height:100vh;
      gap:10px; padding:10px;
      font-family: var(--font-body);
      background: transparent; color: var(--text);
    }

    /* ---- Menu laterale ---- */
    .sidebar {
      color: var(--text);
      display:flex; flex-direction:column; gap:8px; padding:22px 16px;
      position:sticky; top:10px; height:calc(100vh - 20px);
      border-radius: var(--radius);
      clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
    }
    .sidebar.hud-panel:hover { transform:none; }
    .brand {
      display:flex; justify-content:center; padding:8px 0 22px;
      border-bottom:1px solid var(--line); margin-bottom:14px;
    }

    nav { display:flex; flex-direction:column; gap:6px; }
    nav a {
      display:flex; align-items:center; gap:12px; cursor:pointer;
      padding:13px 15px; color: var(--text-soft);
      font-weight:600; font-size:.95rem; text-decoration:none;
      border:1px solid transparent;
      clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
      transition: background .28s var(--ease-spatial), color .2s,
                  transform .28s var(--ease-spatial), border-color .28s;
    }
    nav a .ico { color: var(--accent); font-size:1rem; width:18px; text-align:center; }
    .nav-sep {
      display:block; margin:14px 6px 4px; font-size:.66rem; font-weight:800;
      text-transform:uppercase; letter-spacing:.14em; color: var(--text-muted);
    }
    nav a:hover {
      background: var(--accent-2-soft); color: var(--text);
      transform: translateX(4px); border-color: var(--line-strong);
    }
    /* La voce attiva è piena e ad alto contrasto: si deve capire dove si è
       senza dover leggere, anche con la coda dell'occhio. */
    nav a.active {
      background: var(--accent); color: var(--on-accent);
      border-color: var(--accent); font-weight:800;
    }
    nav a.active .ico { color: var(--on-accent); }
    nav a:focus-visible { outline:none; box-shadow: var(--glow-focus); }

    .role-card {
      margin-top:auto; display:flex; flex-direction:column; gap:2px;
      background: var(--surface); border:1px solid var(--surface-border);
      clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
      padding:14px 16px; backdrop-filter: blur(12px);
    }
    .role-label {
      font-size:.68rem; text-transform:uppercase; letter-spacing:.14em;
      color: var(--accent);
    }
    .role-card strong { font-size:1.05rem; color: var(--text); }
    .role-card small { color: var(--text-muted); font-size:.76rem; }

    /* ---- Barra superiore ---- */
    .main { background:transparent; color: var(--text); display:flex; flex-direction:column; min-width:0; }

    .topbar {
      display:flex; align-items:center; justify-content:space-between; gap:16px;
      padding:14px 24px; margin:4px 8px 0; border-radius: var(--radius);
      clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px);
      position:sticky; top:10px; z-index:5;
    }
    .topbar.hud-panel:hover { transform:none; }
    .who { display:flex; align-items:center; gap:10px; min-width:0; flex-wrap:wrap; }
    .who .hello { color: var(--text-muted); font-size:.9rem; }
    .who strong { font-size:1.05rem; color: var(--text); }
    .badge {
      font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em;
      padding:5px 11px; color: var(--on-accent); background: var(--accent);
      clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
    }

    .logout {
      display:grid; place-items:center; flex:none;
      width:42px; height:42px; padding:0;
      border:1px solid var(--line-strong); background:transparent; color: var(--accent);
      cursor:pointer;
      clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
      transition: background .24s, color .2s, border-color .24s;
    }
    .logout:hover { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
    .logout:focus-visible { outline:none; box-shadow: var(--glow-focus); }

    .content { padding:32px; flex:1; min-width:0; }

    /* ---- Comando menu e velo: servono solo su schermo stretto ---- */
    .menu-toggle { display:none; }
    .scrim { display:none; }

    /* =========================================================================
       SCHERMI STRETTI
       Il menu diventa un pannello che scorre da sinistra. Non si nasconde
       nessuna voce: cambia solo il modo di raggiungerla.
       ========================================================================= */
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; padding:8px; }

      .menu-toggle {
        display:grid; place-items:center;
        position:fixed; top:14px; left:14px; z-index:30;
        width:46px; height:46px; padding:0; cursor:pointer;
        background: var(--surface-strong); color: var(--accent);
        border:1px solid var(--surface-border);
        backdrop-filter: blur(var(--surface-blur));
        clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
      }
      .hamburger, .hamburger::before, .hamburger::after {
        display:block; width:20px; height:2px; background: currentColor;
        transition: transform .25s var(--ease-spatial), opacity .18s;
      }
      .hamburger::before, .hamburger::after { content:''; position:absolute; }
      .hamburger::before { transform: translateY(-6px); }
      .hamburger::after  { transform: translateY(6px); }
      .menu-aperto .hamburger { background:transparent; }
      .menu-aperto .hamburger::before { transform: rotate(45deg); }
      .menu-aperto .hamburger::after  { transform: rotate(-45deg); }

      .sidebar {
        position:fixed; inset:0 auto 0 0; z-index:25;
        width:min(280px, 84vw); height:100vh;
        transform: translateX(-102%);
        transition: transform .32s var(--ease-spatial);
        clip-path:none;
        /* Fondo pieno: sotto c'è la scena 3D e un pannello semitrasparente
           renderebbe le voci illeggibili. */
        background: var(--canvas-bg);
        border-right:1px solid var(--line-strong);
        overflow-y:auto;
      }
      .menu-aperto .sidebar { transform:none; }

      .scrim {
        display:block; position:fixed; inset:0; z-index:20;
        background: var(--canvas-bg); opacity:0; pointer-events:none;
        transition: opacity .3s ease;
      }
      .menu-aperto .scrim { opacity:.72; pointer-events:auto; }

      .topbar { margin:0 0 0 62px; padding:12px 16px; }
      .who .hello { display:none; }
      .content { padding:20px 14px; }
    }

    @media (prefers-reduced-motion: reduce) {
      nav a, .sidebar, .scrim, .hamburger,
      .hamburger::before, .hamburger::after { transition:none; }
      nav a:hover { transform:none; }
    }
  `]
})
export class AdminShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Stato del menu su schermo stretto. Su schermo largo è irrilevante. */
  readonly menuAperto = signal(false);

  /** Denominazione ufficiale e ambito del ruolo dell'utente collegato. */
  readonly ruolo = computed(() => descriviRuolo(this.auth.utente()?.ruolo));

  /** Chiude la sessione e riporta alla pagina di accesso. */
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
