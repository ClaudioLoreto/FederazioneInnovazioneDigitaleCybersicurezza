// =============================================================================
//  frontend/src/app/pages/admin/admin-shell.component.ts
//  Telaio del backoffice: menu laterale, barra utente e area dei contenuti.
//  Tutte le schermate riservate vengono disegnate dentro <router-outlet>, così
//  la navigazione resta ferma mentre cambia solo il contenuto.
//  Accessibile solo dietro l'AuthGuard.
// =============================================================================

import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';
import { Permesso, permessiArea } from '../../shared/permessi';

@Component({
  selector: 'fidc-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AnimatedLogoComponent],
  template: `
  <div class="shell" [class.menu-aperto]="menuAperto()" [class.compatto]="compatto()">

    <!-- Comando del menu su schermo stretto. -->
    <button type="button" class="menu-toggle" (click)="menuAperto.set(!menuAperto())"
            [attr.aria-expanded]="menuAperto()" aria-controls="menu-backoffice"
            [attr.aria-label]="menuAperto() ? 'Chiudi il menu' : 'Apri il menu'">
      <span class="hamburger" aria-hidden="true"></span>
    </button>

    <!-- MENU LATERALE -->
    <aside class="sidebar" id="menu-backoffice">
      <div class="brand">
        <a routerLink="/" aria-label="Vai al sito pubblico">
          <fidc-animated-logo [soloSimbolo]="compatto()" [interactive]="false"></fidc-animated-logo>
        </a>
      </div>

      <nav (click)="menuAperto.set(false)" aria-label="Sezioni del backoffice">
        @for (v of vociVisibili(); track v.rotta) {
          @if (v.gruppo) { <span class="nav-sep">{{ v.gruppo }}</span> }
          <a [routerLink]="v.rotta" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: v.esatta ?? false }"
             [attr.title]="compatto() ? v.label : null">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="v.icona"/></svg>
            <span class="lbl">{{ v.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar-piede">
        @if (auth.utente()) {
          <div class="role-card">
            <strong>{{ ruolo().etichetta }}</strong>
            <small>{{ ruolo().ambito }}</small>
          </div>
        }
        <button type="button" class="comprimi" (click)="compatto.set(!compatto())"
                [attr.aria-label]="compatto() ? 'Espandi il menu' : 'Comprimi il menu'"
                [attr.aria-pressed]="compatto()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          <span class="lbl">Comprimi</span>
        </button>
      </div>
    </aside>

    <!-- AREA CONTENUTI -->
    <div class="main">
      @if (auth.utente(); as u) {
        <header class="topbar">
          <div class="who">
            <span class="avatar" aria-hidden="true">{{ iniziali(u.nomeCompleto) }}</span>
            <div>
              <strong>{{ u.nomeCompleto }}</strong>
              <span class="ruolo-badge">{{ ruolo().etichetta }}</span>
            </div>
          </div>
          <div class="topbar-azioni">
            <a routerLink="/" class="sito">Vedi il sito</a>
            <button type="button" class="logout" (click)="logout()">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h9"/>
              </svg>
              Esci
            </button>
          </div>
        </header>
      }

      <section class="content">
        <router-outlet></router-outlet>
      </section>
    </div>

    <div class="scrim" (click)="menuAperto.set(false)" aria-hidden="true"></div>
  </div>
  `,
  styles: [`
    :host { display: block; }

    .shell {
      --side: 264px;
      display: grid; grid-template-columns: var(--side) minmax(0, 1fr);
      min-height: 100vh;
      font-family: var(--font-body); color: var(--text);
      transition: grid-template-columns .35s var(--ease-spatial);
    }
    .shell.compatto { --side: 84px; }

    /* ---- Menu laterale ---- */
    .sidebar {
      position: sticky; top: 0; height: 100vh;
      display: flex; flex-direction: column; gap: 8px;
      padding: 20px 14px;
      background: color-mix(in srgb, var(--canvas-bg) 88%, transparent);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-right: 1px solid var(--line);
      overflow-y: auto; overflow-x: hidden;
    }
    .brand { padding: 4px 6px 20px; margin-bottom: 8px; border-bottom: 1px solid var(--line); }
    .brand a { display: block; width: 100%; max-width: 200px; }
    .compatto .brand a { width: 44px; margin-inline: auto; }

    nav { display: flex; flex-direction: column; gap: 4px; }
    .nav-sep { display: block; margin: 18px 12px 6px; font-size: .82rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
    .compatto .nav-sep { visibility: hidden; height: 1px; margin: 12px 0; border-top: 1px solid var(--line); }
    nav a {
      position: relative;
      display: flex; align-items: center; gap: 12px;
      min-height: 46px; padding: 10px 12px;
      border-radius: var(--radius);
      color: var(--text-soft); font-weight: 500;
      transition: background .2s, color .2s;
      white-space: nowrap;
    }
    .ico { width: 22px; height: 22px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    nav a:hover { background: var(--accent-soft); color: var(--text); }
    /* Voce attiva: barra di segnale a sinistra, testo pieno, fondo tenue. */
    nav a.active { background: var(--accent-soft); color: var(--text); font-weight: 600; }
    nav a.active::before {
      content: ''; position: absolute; left: -14px; top: 8px; bottom: 8px; width: 4px;
      background: var(--signal); border-radius: 0 3px 3px 0;
    }
    nav a.active .ico { color: var(--signal); }
    .compatto nav a { justify-content: center; }
    .compatto .lbl { display: none; }

    .sidebar-piede { margin-top: auto; display: grid; gap: 10px; padding-top: 16px; }
    .role-card {
      display: grid; gap: 2px; padding: 12px 14px;
      border: 1px solid var(--line); border-radius: var(--radius);
      strong { color: var(--text); }
      small { color: var(--text-muted); font-size: .82rem; line-height: 1.4; }
    }
    .compatto .role-card { display: none; }
    .comprimi {
      display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 8px 12px;
      background: transparent; color: var(--text-soft); border: 1px solid var(--line); border-radius: var(--radius);
      cursor: pointer; font: inherit; font-size: .9rem;
      svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; transition: transform .3s var(--ease-spatial); }
      &:hover { color: var(--text); border-color: var(--line-strong); }
    }
    .compatto .comprimi { justify-content: center; svg { transform: rotate(180deg); } }

    /* ---- Barra superiore ---- */
    .main { display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      position: sticky; top: 0; z-index: 5;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      min-height: 68px; padding: 10px clamp(16px, 3vw, 36px);
      background: color-mix(in srgb, var(--canvas-bg) 82%, transparent);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--line);
    }
    .who { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .who strong { display: block; color: var(--text); line-height: 1.2; }
    .avatar {
      width: 40px; height: 40px; flex: 0 0 auto; display: grid; place-items: center;
      font-family: var(--font-display); font-weight: 700;
      background: var(--B-bg); color: var(--B-text); border-radius: var(--radius);
    }
    .ruolo-badge { font-size: .85rem; color: var(--signal); font-weight: 600; }
    .topbar-azioni { display: flex; align-items: center; gap: 10px; }
    .sito { font-size: .92rem; color: var(--text-soft); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--line-strong); }
    .sito:hover { color: var(--text); }
    .logout {
      display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 8px 14px;
      background: transparent; color: var(--text); border: 1.5px solid var(--text); border-radius: max(var(--radius), 3px);
      font: inherit; font-weight: 600; font-size: .92rem; cursor: pointer;
      svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      &:hover { background: var(--text); color: var(--on-text); }
    }

    .content { padding: clamp(20px, 3vw, 40px) clamp(16px, 3vw, 40px) 64px; flex: 1; min-width: 0; }

    .menu-toggle, .scrim { display: none; }

    /* ---- Schermi stretti: il menu diventa un pannello da sinistra ---- */
    @media (max-width: 900px) {
      .shell, .shell.compatto { grid-template-columns: minmax(0, 1fr); --side: 0px; }
      .compatto .lbl, .compatto .role-card { display: revert; }
      .comprimi { display: none !important; }

      .menu-toggle {
        display: grid; place-items: center;
        position: fixed; top: 12px; left: 12px; z-index: 30;
        width: 46px; height: 46px; padding: 0; cursor: pointer;
        background: var(--surface-strong); color: var(--text);
        border: 1px solid var(--line-strong); border-radius: var(--radius);
      }
      .hamburger, .hamburger::before, .hamburger::after {
        display: block; width: 20px; height: 2px; background: currentColor;
        transition: transform .25s var(--ease-spatial), opacity .18s;
      }
      .hamburger { position: relative; }
      .hamburger::before, .hamburger::after { content: ''; position: absolute; left: 0; }
      .hamburger::before { transform: translateY(-6px); }
      .hamburger::after  { transform: translateY(6px); }
      .menu-aperto .hamburger { background: transparent; }
      .menu-aperto .hamburger::before { transform: rotate(45deg); }
      .menu-aperto .hamburger::after  { transform: rotate(-45deg); }

      .sidebar {
        position: fixed; inset: 0 auto 0 0; z-index: 25;
        width: min(290px, 86vw); height: 100vh;
        padding-top: 72px;
        background: var(--canvas-bg);    /* pieno: le voci restano leggibili */
        border-right: 1px solid var(--line-strong);
        transform: translateX(-102%);
        transition: transform .35s var(--ease-spatial);
      }
      .menu-aperto .sidebar { transform: none; }
      .compatto nav a { justify-content: flex-start; }
      .compatto .brand a { width: 100%; }

      .scrim {
        display: block; position: fixed; inset: 0; z-index: 20;
        background: var(--canvas-bg); opacity: 0; pointer-events: none; transition: opacity .3s;
      }
      .menu-aperto .scrim { opacity: .72; pointer-events: auto; }

      .topbar { padding-left: 70px; }
      .sito { display: none; }
    }
  `]
})
export class AdminShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Stato del menu su schermo stretto. Su schermo largo è irrilevante. */
  readonly menuAperto = signal(false);

  /** Menu ridotto alle sole icone (schermo largo), ricordato fra le visite. */
  readonly compatto = signal(this.leggiCompatto());

  /**
   * Voci del menu. Ognuna compare solo a chi ha almeno uno dei permessi
   * indicati (matrice in shared/permessi.ts); "Permessi" solo alla Direzione.
   * Nasconderle è una comodità, la protezione vera è sugli endpoint del server.
   * Le icone sono tracciati SVG 24×24 a linea.
   */
  private readonly voci: { label: string; rotta: string; icona: string; esatta?: boolean; serve?: Permesso[]; soloDirezione?: boolean; gruppo?: string }[] = [
    { label: 'Pannello', rotta: '/admin/dashboard', esatta: true, icona: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
    { label: 'Eventi', rotta: '/admin/eventi', serve: permessiArea('eventi'), icona: 'M4 6h16v14H4zM4 10h16M9 3v5M15 3v5' },
    { label: 'News', rotta: '/admin/news', serve: permessiArea('news'), icona: 'M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5' },
    { label: 'Documenti', rotta: '/admin/documenti', serve: permessiArea('documenti'), icona: 'M4 7h6l2 2h8v10H4zM12 12v5M9.5 14.5L12 17l2.5-2.5' },
    { label: 'Account', rotta: '/admin/utenti', serve: ['utenti.gestire'], gruppo: 'Amministrazione', icona: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3 3 3 6' },
    { label: 'Newsletter', rotta: '/admin/newsletter', serve: ['newsletter.gestire'], icona: 'M3 6h18v12H3zM3 7l9 6 9-6' },
    { label: 'Aspetto del sito', rotta: '/admin/impostazioni', serve: ['sito.aspetto'], icona: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.6 0-1.2-1-1.6-1-2.6 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-4.6-4-8.3-9-8.3zM7.5 12.5h.01M9.5 8h.01M14.5 8h.01' },
    { label: 'Permessi', rotta: '/admin/permessi', soloDirezione: true, icona: 'M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6zM9 12l2 2 4-4' }
  ];

  readonly vociVisibili = computed(() => {
    const direzione = this.auth.isSuperUser();
    this.auth.assetto();   // ricalcola quando cambiano i permessi
    const visibili = this.voci.filter((v) =>
      v.soloDirezione ? direzione : !v.serve || this.auth.puoUno(v.serve));
    // L'intestazione del gruppo va sulla prima voce visibile del gruppo.
    const ammin = visibili.findIndex((v) => ['/admin/utenti', '/admin/newsletter', '/admin/impostazioni', '/admin/permessi'].includes(v.rotta));
    return visibili.map((v, i) => ({ ...v, gruppo: i === ammin ? 'Amministrazione' : undefined }));
  });

  iniziali(nome: string): string {
    return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  }

  /** Livello d'accesso e riassunto dei permessi dell'utente collegato. */
  readonly ruolo = computed(() => ({ etichetta: this.auth.livello(), ambito: this.auth.riassunto() }));

  private leggiCompatto(): boolean {
    try { return localStorage.getItem('fidc.admin.compatto') === '1'; } catch { return false; }
  }

  constructor() {
    effect(() => {
      const c = this.compatto();
      try { localStorage.setItem('fidc.admin.compatto', c ? '1' : '0'); } catch { /* nessuno storage */ }
    });
  }

  /** Chiude la sessione e riporta alla pagina di accesso. */
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
