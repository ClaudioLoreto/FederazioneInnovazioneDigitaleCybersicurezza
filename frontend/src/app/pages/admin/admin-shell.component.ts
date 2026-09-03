// =============================================================================
//  frontend/src/app/pages/admin/admin-shell.component.ts
//  BACKOFFICE — Layout protetto. Sidebar deep-blue (#333D6D) + area contenuti
//  cream (#FFF0D9). Header con nome/ruolo utente e logout. Solo palette FIDC.
// =============================================================================

import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';

/**
 * Guscio del backoffice: menu laterale, header utente e <router-outlet> per le
 * sezioni (dashboard, eventi, news). Visibile solo dietro l'AuthGuard.
 */
@Component({
  selector: 'fidc-admin-shell',
  standalone: true,
  imports: [NgIf, RouterOutlet, RouterLink, RouterLinkActive, AnimatedLogoComponent],
  template: `
  <div class="shell">
    <!-- SIDEBAR HUD -->
    <aside class="sidebar hud-panel">
      <div class="brand"><fidc-animated-logo></fidc-animated-logo></div>

      <nav>
        <a routerLink="/admin/dashboard" routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: true }">
          <span class="ico">▦</span> Dashboard
        </a>
        <a routerLink="/admin/eventi" routerLinkActive="active">
          <span class="ico">◆</span> Eventi
        </a>
        <a routerLink="/admin/news" routerLinkActive="active">
          <span class="ico">✎</span> News
        </a>
        <a routerLink="/admin/documenti" routerLinkActive="active">
          <span class="ico">▤</span> Documenti
        </a>

        <!-- Sezioni riservate al SuperUser (RBAC lato client + server) -->
        <ng-container *ngIf="auth.isSuperUser()">
          <span class="nav-sep">Amministrazione</span>
          <a routerLink="/admin/utenti" routerLinkActive="active">
            <span class="ico">◉</span> Utenti
          </a>
          <a routerLink="/admin/newsletter" routerLinkActive="active">
            <span class="ico">✉</span> Newsletter
          </a>
          <a routerLink="/admin/impostazioni" routerLinkActive="active">
            <span class="ico">⚙</span> Tema &amp; Impostazioni
          </a>
        </ng-container>
      </nav>

      <div class="role-card" *ngIf="auth.utente() as u">
        <span class="role-label">Accesso</span>
        <strong>{{ u.ruolo === 'SuperUser' ? 'Super User' : 'Relatore' }}</strong>
        <small>{{ u.ruolo === 'SuperUser' ? 'Controllo totale' : 'Solo contenuti propri' }}</small>
      </div>
    </aside>

    <!-- MAIN -->
    <div class="main">
      <header class="topbar hud-panel" *ngIf="auth.utente() as u">
        <div class="who">
          <span class="hello">Bentornato,</span>
          <strong>{{ u.nomeCompleto }}</strong>
          <span class="badge" [class.super]="u.ruolo === 'SuperUser'">
            {{ u.ruolo === 'SuperUser' ? 'Super User' : 'Relatore' }}
          </span>
        </div>
        <button class="logout" (click)="logout()">Esci →</button>
      </header>

      <section class="content">
        <router-outlet></router-outlet>
      </section>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .shell { display:grid; grid-template-columns: 248px 1fr; min-height:100vh; gap: 10px;
             padding: 10px; font-family: var(--font-body, 'Segoe UI', system-ui, sans-serif);
             background: transparent; color: var(--c-cream); }

    .sidebar {
      color: var(--c-cream);
      display:flex; flex-direction:column; gap:8px; padding:22px 16px;
      position:sticky; top:10px; height:calc(100vh - 20px);
      border-radius: 0;
      clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
    }
    .sidebar.hud-panel:hover { transform: none; }
    .brand { display:flex; justify-content:center; padding:8px 0 22px;
             border-bottom:1px solid rgba(255,207,149,.18); margin-bottom:14px; }

    nav { display:flex; flex-direction:column; gap:6px; }
    nav a {
      display:flex; align-items:center; gap:12px; cursor:pointer;
      padding:13px 15px; color: rgba(255,240,217,.82);
      font-weight:600; font-size:.95rem; text-decoration:none;
      border: 1px solid transparent;
      clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
      transition: background .28s var(--ease-spatial, cubic-bezier(.25,1,.5,1)),
                  color .2s, transform .28s var(--ease-spatial, cubic-bezier(.25,1,.5,1)),
                  box-shadow .28s, border-color .28s;
    }
    nav a .ico { color: var(--c-peach); font-size:1rem; width:18px; text-align:center; }
    .nav-sep { display:block; margin:14px 6px 4px; font-size:.66rem; font-weight:800;
               text-transform:uppercase; letter-spacing:.14em; color: rgba(255,207,149,.7); }
    nav a:hover {
      background: rgba(114,62,195,.22); color: var(--c-cream); transform: translateX(4px);
      border-color: var(--c-peach); box-shadow: var(--glow-purple);
    }
    nav a.active {
      background: linear-gradient(120deg, var(--c-purple), rgba(114,62,195,.65));
      color: var(--c-cream); box-shadow: var(--glow-neon); border-color: var(--c-peach);
    }
    nav a.active .ico { color: var(--c-peach); }

    .role-card {
      margin-top:auto; display:flex; flex-direction:column; gap:2px;
      background: rgba(51,61,109,.28); border:1px solid rgba(255,207,149,.35);
      clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
      padding:14px 16px; backdrop-filter: blur(12px);
    }
    .role-label { font-size:.68rem; text-transform:uppercase; letter-spacing:.14em;
                  color: var(--c-peach); }
    .role-card strong { font-size:1.05rem; }
    .role-card small { color: rgba(255,240,217,.6); font-size:.76rem; }

    .main { background: transparent; color: var(--c-cream); display:flex; flex-direction:column; }

    .topbar {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 28px; margin: 4px 8px 0; border-radius: 0;
      clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px);
      position:sticky; top:10px; z-index:5;
    }
    .topbar.hud-panel:hover { transform: none; }
    .who { display:flex; align-items:center; gap:10px; }
    .who .hello { color: rgba(255,240,217,.65); font-size:.9rem; }
    .who strong { font-size:1.05rem; color: var(--c-cream); }
    .badge { font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em;
             padding:5px 11px; color: var(--c-deep-blue);
             clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
             background: var(--c-peach); }
    .badge.super { background: var(--c-purple); color: var(--c-cream); box-shadow: var(--glow-purple); }

    .logout {
      border:1px solid var(--c-peach); background:transparent; color: var(--c-peach);
      font-weight:800; padding:10px 18px; cursor:pointer;
      clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
      transition: background .28s, color .2s, box-shadow .28s;
    }
    .logout:hover { background: var(--c-purple); color: var(--c-cream); box-shadow: var(--glow-neon); }

    .content { padding:32px; flex:1; }

    @media (max-width: 820px) {
      .shell { grid-template-columns: 1fr; padding: 8px; }
      .sidebar { position:relative; height:auto; flex-direction:row; flex-wrap:wrap; align-items:center;
                 clip-path: none; }
      .role-card { display:none; }
    }
  `]
})
export class AdminShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Esegue il logout e torna alla pagina di accesso. */
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
