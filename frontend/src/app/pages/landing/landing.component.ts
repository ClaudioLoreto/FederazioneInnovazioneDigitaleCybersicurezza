// =============================================================================
//  frontend/src/app/pages/landing/landing.component.ts
//  LANDING PUBBLICA — UNICA FONTE DI CONTENUTO (architettura "Veil").
//  La struttura e il contenuto sono UNO solo; l'aspetto cambia tramite il tema
//  attivo (ThemeService → [data-theme] → CSS variables in _themes.scss).
//  Niente più 3 componenti-layout con testo duplicato.
//  Mobile-first: menu dedicato + stacking a blocchi su smartphone.
//  Palette: solo i 4 colori, via token semantici (--bg, --text, --accent…).
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';
import { SafeLogoComponent } from '../../shared/safe-logo/safe-logo.component';
import { CyberShieldComponent, CyberBackgroundComponent } from '../../shared/svg-motifs/svg-motifs.component';
import { IllustrazioneComponent } from '../../shared/illustrazioni/illustrazione.component';
import { HERO, PILASTRI, CHI_SIAMO, NEWSLETTER, PROGETTI, GOVERNANCE } from '../../content/home-content';
import { FidcApiService, Evento, News } from '../../services/fidc-api.service';

/**
 * Homepage istituzionale unica. Carica eventi e news reali dall'API e ospita
 * l'iscrizione alla newsletter. L'estetica è interamente pilotata dal tema.
 */
@Component({
  selector: 'fidc-landing',
  standalone: true,
  imports: [
    NgFor, NgIf, DatePipe, FormsModule, RouterLink,
    AnimatedLogoComponent, SafeLogoComponent,
    CyberShieldComponent, CyberBackgroundComponent,
    IllustrazioneComponent
  ],
  animations: [
    trigger('stagger', [
      transition(':enter', [
        query('.reveal', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(110, animate('600ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ]),
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('700ms ease', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ],
  template: `
  <main class="site">
    <!-- ===================== HUD NAV — due moduli fluttuanti ===================== -->
    <header class="hud-nav">
      <a class="hud-mod hud-left" routerLink="/" aria-label="FIDC — Home">
        <fidc-animated-logo></fidc-animated-logo>
      </a>

      <nav class="hud-mod hud-right nav-desktop">
        <a (click)="vaiA('pilastro-attivita')">Attività</a>
        <a (click)="vaiA('sezione-progetti')">Progetti</a>
        <a (click)="vaiA('sezione-eventi')">Eventi</a>
        <a (click)="vaiA('pilastro-formazione')">Formazione</a>
        <a (click)="vaiA('pilastro-ricerca')">Ricerca</a>
        <a class="btn-accent area" routerLink="/admin/login">Area riservata</a>
      </nav>

      <button class="hud-mod hud-burger burger" (click)="menu.set(!menu())"
              [attr.aria-expanded]="menu()" aria-label="Apri il menu">
        <span [class.x]="menu()"></span><span [class.x]="menu()"></span><span [class.x]="menu()"></span>
      </button>
    </header>

    <!-- Overlay menu mobile (block-stacking) -->
    <div class="mobile-menu" [class.open]="menu()" (click)="menu.set(false)">
      <nav (click)="$event.stopPropagation()">
        <a (click)="vaiA('pilastro-attivita')">Attività</a>
        <a (click)="vaiA('sezione-progetti')">Progetti</a>
        <a (click)="vaiA('sezione-eventi')">Eventi</a>
        <a (click)="vaiA('pilastro-formazione')">Formazione</a>
        <a (click)="vaiA('pilastro-ricerca')">Ricerca</a>
        <a class="btn-accent" routerLink="/admin/login" (click)="menu.set(false)">Area riservata</a>
        <a class="btn-outline" routerLink="/registrati" (click)="menu.set(false)">Registrati</a>
      </nav>
    </div>

    <!-- ===================== HERO ===================== -->
    <section class="hero" @fade>
      <div class="hero-bg" aria-hidden="true"><fidc-cyber-bg></fidc-cyber-bg></div>
      <div class="hero-inner">
        <div class="hero-copy">
          <p class="occhiello">{{ hero.occhiello }}</p>
          <h1 class="slogan">{{ hero.titolo }}</h1>
          <p class="sub">{{ hero.sottotitolo }}</p>
          <div class="cta">
            <a class="btn-primary" routerLink="/registrati">{{ hero.ctaPrimaria }}</a>
            <button type="button" class="btn-ghost-light" (click)="vaiA('pilastri')">{{ hero.ctaSecondaria }} →</button>
          </div>
        </div>
        <div class="hero-safe">
          <fidc-safe-logo></fidc-safe-logo>
          <p class="safe-caption">Innovazione custodita in sicurezza</p>
        </div>
      </div>
    </section>

    <!-- ===================== PILASTRI ===================== -->
    <section class="pillars" id="pilastri" @stagger>
      <article class="pillar reveal glass-card" *ngFor="let p of pilastri" [id]="'pilastro-' + p.chiave">
        <!-- L'illustrazione mostra le persone all'opera in questo ambito:
             si capisce di cosa parla il riquadro prima ancora di leggerlo. -->
        <div class="pillar-ill"><fidc-illustrazione [scena]="p.scena"></fidc-illustrazione></div>
        <span class="kicker">{{ p.titolo }}</span>
        <h3>{{ p.claim }}</h3>
        <p>{{ p.descrizione }}</p>
        <a class="more">Approfondisci →</a>
      </article>
    </section>

    <!-- ===================== CHI SIAMO ===================== -->
    <section class="about">
      <div class="about-grid">
        <div class="about-copy">
          <h2>{{ chiSiamo.titolo }}</h2>
          <p>{{ chiSiamo.testo }}</p>
          <div class="stats">
            <div *ngFor="let n of chiSiamo.numeri"><b>{{ n.valore }}</b><span>{{ n.label }}</span></div>
          </div>
        </div>
        <div class="about-shield" aria-hidden="true"><fidc-cyber-shield></fidc-cyber-shield></div>
      </div>

      <!-- Governance / Fondatori -->
      <div class="governance">
        <h3 class="gov-title">Governance &amp; Fondatori</h3>
        <p class="gov-lead">Gli organi che indirizzano e vigilano sulle attività della Federazione,
           garantendo indipendenza, competenza e trasparenza.</p>
        <div class="gov-grid">
          <article class="gov-card" *ngFor="let m of governance">
            <span class="gov-avatar" aria-hidden="true">{{ m.iniziali }}</span>
            <div class="gov-info">
              <h4>{{ m.nome }}</h4>
              <p class="gov-role">{{ m.ruolo }}</p>
              <p class="gov-area">{{ m.area }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ===================== PROGETTI IN EVIDENZA ===================== -->
    <section class="projects" id="sezione-progetti" @stagger>
      <div class="proj-head">
        <span class="kicker">Progetti in evidenza</span>
        <h2>Iniziative faro della Federazione</h2>
        <p>Programmi concreti con cui trasformiamo la visione in impatto misurabile per imprese,
           istituzioni e cittadini.</p>
      </div>
      <div class="proj-grid">
        <article class="proj reveal glass-card" *ngFor="let p of progetti">
          <div class="proj-top">
            <span class="proj-code">{{ p.codice }}</span>
            <span class="proj-state" [attr.data-stato]="p.stato">{{ p.stato }}</span>
          </div>
          <span class="proj-cat">{{ p.categoria }}</span>
          <h3>{{ p.titolo }}</h3>
          <p class="proj-desc">{{ p.descrizione }}</p>
          <p class="proj-impact"><b>{{ p.impatto }}</b></p>
        </article>
      </div>
    </section>

    <!-- ===================== EVENTI (API) ===================== -->
    <section class="events" id="sezione-eventi" @stagger>
      <h2>Prossimi eventi e iniziative</h2>
      <p class="empty" *ngIf="!caricamento() && eventi().length === 0">
        Al momento non ci sono eventi pubblicati. Torna presto a trovarci.
      </p>
      <div class="grid">
        <article class="card reveal glass-card" *ngFor="let e of eventi()">
          <span class="kicker">{{ e.pilastro }}</span>
          <h3>{{ e.titolo }}</h3>
          <p class="when">{{ e.dataInizio | date:'dd MMM yyyy' }} · {{ e.luogo }}</p>
          <p>{{ e.sottotitolo || e.descrizione }}</p>
          <a class="more">Dettagli evento →</a>
        </article>
      </div>
    </section>

    <!-- ===================== NEWS (API) ===================== -->
    <section class="news">
      <h2>In evidenza</h2>
      <p class="empty" *ngIf="!caricamento() && news().length === 0">Nessuna news pubblicata al momento.</p>
      <div class="grid">
        <article class="card glass-card" *ngFor="let n of news()">
          <span class="tag">{{ n.pilastro }}</span>
          <h4>{{ n.titolo }}</h4>
          <p>{{ n.sommario }}</p>
        </article>
      </div>
    </section>

    <!-- ===================== NEWSLETTER ===================== -->
    <section class="newsletter">
      <div class="nl-card glass-card">
        <div class="nl-copy">
          <h2>{{ nl.titolo }}</h2>
          <p>{{ nl.testo }}</p>
        </div>
        <form class="nl-form" (ngSubmit)="iscriviNewsletter()" #nf="ngForm">
          <input type="email" name="nlEmail" [(ngModel)]="nlEmail" required email
                 placeholder="La tua email" [disabled]="nlStato() === 'invio'" aria-label="Email newsletter" />
          <button class="btn-primary" type="submit" [disabled]="nlStato() === 'invio' || nf.invalid">
            {{ nlStato() === 'invio' ? 'Invio…' : nl.cta }}
          </button>
        </form>
        <p class="nl-msg ok"  *ngIf="nlStato() === 'ok'">Iscrizione confermata. Grazie!</p>
        <p class="nl-msg err" *ngIf="nlStato() === 'errore'">{{ nlErrore() }}</p>
      </div>
    </section>

    <!-- ===================== FOOTER ===================== -->
    <footer class="foot">
      <p>© {{ anno }} Federazione Innovazione, Digitale e Cybersicurezza — FIDC</p>
      <nav>
        <a routerLink="/registrati">Registrati</a>
        <a routerLink="/area-documenti">Area Documenti</a>
        <a routerLink="/admin/login">Area riservata</a>
      </nav>
    </footer>
  </main>
  `,
  styles: [`
    /* Tutto pilotato dai TOKEN semantici del tema attivo (_themes.scss). */
    :host { display:block; }
    .site { background: transparent; color: var(--text); font-family: var(--font-body, system-ui, 'Segoe UI', sans-serif); }
    /* Titoli in font display cyber/tech (coerenza con lo slogan). */
    .about h2, .events h2, .news h2, .nl-copy h2 { font-family: var(--font-display); letter-spacing:.004em; }

    /* ---------- HUD NAV (due moduli laterali, niente barra piena) ---------- */
    .hud-nav {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 16px 3vw 0; pointer-events: none; background: transparent;
    }
    .hud-mod {
      pointer-events: auto;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      box-shadow: var(--glow-deep);
    }
    .hud-left {
      width: min(240px, 46vw); padding: 8px 18px 8px 12px;
      clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
    }
    .hud-right {
      display: flex; gap: 18px; align-items: center;
      padding: 10px 14px 10px 22px; margin-top: 10px;
      clip-path: polygon(18px 0, 100% 0, 100% 100%, 0 100%, 0 18px);
    }
    .hud-right a { color: var(--text); font-weight: 600; cursor: pointer; position: relative; }
    .hud-right a:not(.btn-accent)::after { content:''; position:absolute; left:0; bottom:-5px; height:2px; width:0;
                          background: var(--accent); transition: width .25s; }
    .hud-right a:not(.btn-accent):hover::after { width:100%; }
    .area { padding: 10px 16px; }
    .hud-burger { display: none; flex-direction: column; gap: 5px; cursor: pointer;
                  padding: 12px 14px; margin-top: 8px;
                  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
    .hud-burger span { width: 22px; height: 2px; background: var(--accent); transition: transform .25s, opacity .2s; }
    .hud-burger span.x:nth-child(1){ transform: translateY(7px) rotate(45deg); }
    .hud-burger span.x:nth-child(2){ opacity:0; }
    .hud-burger span.x:nth-child(3){ transform: translateY(-7px) rotate(-45deg); }

    /* hamburger legacy (mobile-menu overlay resta) */
    .burger { border: none; color: inherit; }

    /* ---------- Menu su schermo stretto ----------
       Il velo e il pannello devono essere OPACHI. Con un fondo trasparente la
       cassaforte animata continuava a girare dietro le voci del menu, che
       risultavano illeggibili e sembravano sovrapposte al contenuto.
       Il colore usato è quello della scena 3D, così il passaggio non stona. */
    .mobile-menu {
      position:fixed; inset:0; z-index:25;
      background: color-mix(in srgb, var(--canvas-bg) 88%, transparent);
      backdrop-filter: blur(8px);
      opacity:0; pointer-events:none; transition: opacity .25s;
      display:grid; place-items:start center; padding-top:96px;
      overflow-y:auto;
    }
    .mobile-menu.open { opacity:1; pointer-events:auto; }
    .mobile-menu nav {
      display:flex; flex-direction:column; gap:14px; width:min(420px,86vw);
      background: var(--canvas-bg); color: var(--text); border:1px solid var(--line-strong);
      clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
      padding:22px; box-shadow: var(--glow-deep);
    }
    .mobile-menu nav a { font-weight:700; font-size:1.1rem; padding:10px 6px; border-bottom:1px solid var(--line); cursor:pointer; }
    .mobile-menu nav a:last-of-type { border-bottom:none; }
    .mobile-menu nav button, .mobile-menu nav .btn-accent { width:100%; }

    /* ---------- HERO ---------- */
    .hero { position:relative; overflow:hidden; background: transparent; color: var(--hero-text); }
    .hero-bg { display: none; }
    .hero-inner { position:relative; z-index:1; max-width:1280px; margin:0 auto;
                  padding: 8vh 4vw 10vh 8vw; display:grid; grid-template-columns: 1.25fr .75fr; gap:24px; align-items:end; }
    .hero-copy { transform: translateY(18px); }
    .occhiello { color: var(--accent-2); font-weight:800; letter-spacing:1px; text-transform:uppercase; font-size:.8rem; }
    .slogan { font-family: var(--font-display); font-size: clamp(2rem, 5vw, 4rem); line-height:1.04; margin:.3em 0 .3em -8px; font-weight:700;
              letter-spacing:.005em; text-wrap:balance; white-space: nowrap; }
    .sub { font-size:1.12rem; max-width:640px; line-height:1.6;
           color: color-mix(in srgb, var(--hero-text) 85%, transparent); }
    .cta { margin-top:30px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; }
    .btn-ghost-light { background:transparent; border:1.5px solid var(--accent-2); color: var(--accent-2);
                       padding:13px 24px; font-weight:800; cursor:pointer;
                       clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
                       transition: background .2s, color .2s; }
    .btn-ghost-light:hover { background: var(--accent-2); color: var(--hero-bg, var(--text)); }

    .hero-safe { display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:14px; min-height:280px;
                 transform: translate(32px, -40px); }
    .hero-safe fidc-safe-logo { display:block; width: min(340px, 78%); filter: drop-shadow(0 24px 50px var(--surface-strong)); }
    .safe-caption { color: var(--accent-2); font-weight:800; text-transform:uppercase; letter-spacing:.12em; font-size:.76rem; }

    /* ---------- PILASTRI / BENTO ASIMMETRICO ---------- */
    .pillars, .events, .news, .newsletter { max-width:1280px; margin:0 auto; }
    .pillars, .events, .news { scroll-margin-top: 92px; }
    .pillar { scroll-margin-top: 100px; }
    .pillars {
      display:grid;
      grid-template-columns: 1.35fr 1fr 1.05fr;
      grid-template-rows: auto auto;
      gap: 18px 20px;
      padding: 8vh 5vw 8vh 8vw;
    }
    .pillar, .card {
      position: relative;
      background: var(--glass-bg); border:1px solid var(--glass-border); padding:26px 24px 22px;
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-radius: 0;
      clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
      transition: transform .3s var(--ease-spatial, cubic-bezier(.25,1,.5,1)), border-color .3s, box-shadow .3s;
    }
    .pillar:nth-child(1) { grid-column: 1 / 3; min-height: 240px; padding-right: 80px; }
    .pillar:nth-child(2) { grid-column: 3; grid-row: 1 / 3; margin-top: 56px; min-height: 320px; }
    .pillar:nth-child(3) { grid-column: 1; margin-left: -28px; transform: translateY(-12px); }
    .pillar:nth-child(4) { grid-column: 2 / 4; transform: translate(28px, -40px); }
    .pillar:hover, .card:hover { transform: translateY(-6px); border-color: var(--line-strong); box-shadow: var(--glow-neon); }
    .pillar:nth-child(3):hover { transform: translateY(-18px); }
    .pillar:nth-child(4):hover { transform: translate(28px, -48px); }
    /* Illustrazione del pilastro: allineata a destra, sopra il testo.
       Larghezza contenuta perché deve accompagnare il titolo, non sostituirlo.
       Il riquadro alto (il secondo) la ospita più grande, avendone lo spazio. */
    .pillar-ill { width: 150px; max-width: 45%; margin: -6px 0 10px auto; opacity: .95; }
    .pillar:nth-child(2) .pillar-ill { width: 190px; max-width: 70%; }

    .kicker, .tag { color: var(--accent); font-weight:800; text-transform:uppercase; font-size:.78rem; }
    .pillar h3, .card h3 { font-size:1.2rem; margin:.5em 0; max-width: 28ch; }
    .pillar p, .card p { color: var(--text-soft); line-height:1.55; }
    .more { color: var(--accent); font-weight:700; cursor:pointer; display:inline-block; margin-top:8px; }

    /* ---------- CHI SIAMO ---------- */
    .about { background: transparent; color: var(--hero-text); margin-top:2vh; }
    .about-grid { max-width:1200px; margin:0 auto; padding: 8vh 6vw; display:grid;
                  grid-template-columns: 1.4fr .6fr; gap:40px; align-items:center; }
    .about h2 { font-size:2.1rem; }
    .about p { max-width:820px; line-height:1.7; color: color-mix(in srgb, var(--hero-text) 90%, transparent); }
    .stats { display:flex; flex-wrap:wrap; gap:28px 52px; margin-top:48px; position:relative; }
    .stats b { display:block; font-size: clamp(2.4rem, 6vw, 4.2rem); color: var(--accent-2);
               font-family: var(--font-display); line-height:.85; letter-spacing:-.04em;
               margin-left: -6px; }
    .stats span { color: color-mix(in srgb, var(--hero-text) 80%, transparent); }
    .about-shield { width:min(220px,70%); justify-self:center; filter: drop-shadow(0 16px 36px var(--accent-2-soft)); }

    /* ---------- GOVERNANCE / FONDATORI ---------- */
    .governance { max-width:1200px; margin:0 auto; padding: 0 6vw 8vh; }
    .gov-title { font-family: var(--font-display); font-size:1.7rem; margin:0 0 8px; }
    .gov-lead { max-width:760px; line-height:1.6; margin:0 0 30px;
                color: color-mix(in srgb, var(--hero-text) 82%, transparent); }
    .gov-grid { display:grid; grid-template-columns: 1.1fr .9fr 1fr; gap:14px 22px; }
    .gov-card { display:flex; align-items:center; gap:16px; padding:18px 20px;
                clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%);
                background: color-mix(in srgb, var(--hero-text) 8%, transparent);
                border:1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
                transition: transform .2s, background .2s; }
    .gov-card:nth-child(even) { transform: translateY(18px); }
    .gov-card:hover { transform: translateY(-3px); background: color-mix(in srgb, var(--hero-text) 13%, transparent); }
    .gov-card:nth-child(even):hover { transform: translateY(10px); }
    .gov-avatar { flex:0 0 auto; display:grid; place-items:center; width:52px; height:52px;
                  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                  font-weight:800; font-size:1rem; color: var(--hero-bg); background: var(--accent-2);
                  letter-spacing:.02em; }
    .gov-info h4 { margin:0 0 3px; font-size:1.02rem; }
    .gov-role { margin:0; font-size:.86rem; font-weight:700; color: var(--accent-2); }
    .gov-area { margin:2px 0 0; font-size:.82rem; color: color-mix(in srgb, var(--hero-text) 72%, transparent); }

    /* ---------- PROGETTI IN EVIDENZA ---------- */
    .projects { max-width:1200px; margin:0 auto; padding: 8vh 6vw 2vh; scroll-margin-top:92px; }
    .proj-head { max-width:640px; margin:0 0 40px 4vw; text-align:left; }
    .proj-head .kicker { color: var(--accent); font-weight:800; text-transform:uppercase;
                         letter-spacing:.1em; font-size:.78rem; }
    .proj-head h2 { font-family: var(--font-display); font-size:2rem; margin:.3em 0; }
    .proj-head p { line-height:1.6; color: var(--text-soft); }
    .proj-grid {
      display:grid;
      grid-template-columns: 1.3fr 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 18px 20px;
    }
    .proj { display:flex; flex-direction:column; gap:10px; padding:24px 22px;
            background: var(--glass-bg); border:1px solid var(--glass-border);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
            box-shadow: var(--glow-deep); transition: transform .28s var(--ease-spatial, cubic-bezier(.25,1,.5,1)), box-shadow .28s, border-color .28s; }
    .proj:nth-child(1) { grid-column: 1 / 3; min-height: 260px; }
    .proj:nth-child(2) { grid-column: 3; grid-row: 1 / 3; margin-top: 40px; }
    .proj:nth-child(3) { transform: translateX(-20px); }
    .proj:nth-child(4) { transform: translate(16px, -24px); }
    .proj:hover { transform: translateY(-4px); border-color: var(--line-strong); box-shadow: var(--glow-neon); }
    .proj:nth-child(3):hover { transform: translateX(-20px) translateY(-6px); }
    .proj:nth-child(4):hover { transform: translate(16px, -32px); }
    .proj-top { display:flex; align-items:center; justify-content:space-between; }
    .proj-code { font-family: var(--font-display); font-weight:800; font-size:.82rem; letter-spacing:.08em;
                 color: var(--accent); }
    .proj-state { font-size:.68rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
                  padding:4px 10px; color: var(--text-soft);
                  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
                  background: color-mix(in srgb, var(--text) 8%, transparent); }
    .proj-state[data-stato="In corso"] { color: var(--on-accent); background: var(--accent); }
    .proj-state[data-stato="In avvio"] { color: var(--on-accent-2); background: var(--accent-2); }
    .proj-cat { font-size:.74rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
                color: var(--accent-2, var(--accent)); }
    .proj h3 { margin:0; font-size:1.2rem; }
    .proj-desc { margin:0; flex:1; line-height:1.55; font-size:.94rem; color: var(--text-soft); }
    .proj-impact { margin:6px 0 0; font-size:.9rem; color: var(--text); }
    .proj-impact b { color: var(--accent); }

    /* ---------- EVENTI / NEWS ---------- */
    .events, .news { padding: 7vh 5vw 2vh 8vw; }
    .events h2, .news h2 { font-size:2rem; margin-bottom:26px; max-width: 16ch; }
    .grid {
      display:grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 16px 20px;
    }
    .events .card:nth-child(1) { grid-column: 1; grid-row: 1 / 3; min-height: 280px; }
    .events .card:nth-child(2) { transform: translateY(-28px); }
    .events .card:nth-child(3) { transform: translate(12px, 18px); }
    .news .card:nth-child(1) { grid-column: 1 / 3; }
    .news .card:nth-child(2) { grid-column: 3; grid-row: 1 / 3; margin-top: 32px; }
    .news .card:nth-child(4) { transform: translateX(-24px); }
    .news .card:nth-child(5) { transform: translate(20px, -16px); }
    .when { color: var(--accent); font-weight:700; font-size:.9rem; margin:.2em 0 .6em; }
    .card h4 { margin:.4em 0; font-size:1.12rem; }
    .empty { color: var(--text-soft); font-style:italic; }

    /* ---------- NEWSLETTER ---------- */
    .newsletter { padding: 8vh 6vw; }
    .nl-card { background: var(--glass-bg); border:1px solid var(--glass-border); padding:34px 40px 34px 28px;
               backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
               box-shadow: var(--glow-neon); display:grid; gap:18px;
               clip-path: polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%);
               transform: translateX(-16px); }
    .nl-copy h2 { font-size:1.7rem; margin-bottom:8px; }
    .nl-copy p { color: var(--text-soft); line-height:1.6; max-width:680px; }
    .nl-form { display:flex; gap:12px; flex-wrap:wrap; }
    .nl-form input { flex:1 1 260px; border:1px solid var(--surface-border); padding:14px 18px;
                     font-size:.95rem; color: var(--text); background: var(--surface-strong); outline:none; }
    .nl-form input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
    .nl-msg { font-weight:700; }
    .nl-msg.ok { color: var(--accent); }
    .nl-msg.err { color: var(--on-accent-2); background: var(--accent-2); padding:8px 14px; display:inline-block;
                  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }

    /* ---------- FOOTER ---------- */
    .foot { background: transparent; color: var(--hero-text); padding: 5vh 6vw; margin-top:4vh;
            display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;
            border-top: 1px solid var(--glass-border); }
    .foot p { color: color-mix(in srgb, var(--hero-text) 80%, transparent); font-size:.9rem; }
    .foot nav { display:flex; gap:18px; }
    .foot nav a { color: var(--accent-2); font-weight:700; cursor:pointer; }

    /* ===================== MOBILE-FIRST (stacking a blocchi) ===================== */
    @media (max-width: 900px) {
      .hud-right { display:none; }
      .hud-burger { display:flex; }
      .hero-inner, .about-grid { grid-template-columns: 1fr; text-align:center; }
      .hero-safe { order:-1; transform: none; align-items:center; }
      .pillars, .proj-grid, .grid, .gov-grid { grid-template-columns: 1fr; }
      .pillar:nth-child(n), .proj:nth-child(n), .events .card:nth-child(n), .news .card:nth-child(n) {
        grid-column: auto; grid-row: auto; transform: none; margin: 0; min-height: 0;
      }
      .nl-card { transform: none; }
      .cta { justify-content:center; }
      .slogan { white-space: normal; }   /* su mobile può andare a capo elegantemente */
      .sub { margin-inline:auto; }
      .stats { justify-content:center; }
      .about-shield { display:none; }
      .foot { flex-direction:column; text-align:center; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pillar, .card { transition: none; }
    }
  `]
})
export class LandingComponent implements OnInit {
  private readonly api = inject(FidcApiService);

  readonly hero = HERO;
  readonly pilastri = PILASTRI;
  readonly chiSiamo = CHI_SIAMO;
  readonly nl = NEWSLETTER;
  readonly progetti = PROGETTI;
  readonly governance = GOVERNANCE;
  readonly anno = new Date().getFullYear();

  /** Stato menu mobile. */
  readonly menu = signal(false);

  /**
   * Scorre in modo fluido fino alla sezione indicata (navbar → ancore della
   * landing). Chiude il menu mobile e rispetta prefers-reduced-motion.
   * @param id Id dell'elemento target (es. 'sezione-eventi', 'pilastro-attivita').
   */
  vaiA(id: string): void {
    this.menu.set(false);
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;
    const riduci = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: riduci ? 'auto' : 'smooth', block: 'start' });
  }

  /** Dati reali dal backend (UNICA fonte). */
  readonly eventi = signal<Evento[]>([]);
  readonly news = signal<News[]>([]);
  readonly caricamento = signal(true);

  /** Stato form newsletter. */
  nlEmail = '';
  readonly nlStato = signal<'idle' | 'invio' | 'ok' | 'errore'>('idle');
  readonly nlErrore = signal('');

  ngOnInit(): void {
    this.api.getEventi().subscribe({
      next: (e) => this.eventi.set(e),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
    this.api.getNews().subscribe({ next: (n) => this.news.set(n) });
  }

  /** Iscrive l'email alla newsletter (endpoint pubblico .NET). */
  iscriviNewsletter(): void {
    if (this.nlStato() === 'invio' || !this.nlEmail) return;
    this.nlStato.set('invio');
    this.api.iscriviNewsletter(this.nlEmail.trim().toLowerCase()).subscribe({
      next: () => { this.nlStato.set('ok'); this.nlEmail = ''; },
      error: (err) => {
        this.nlStato.set('errore');
        this.nlErrore.set(err?.status === 0
          ? 'Server non raggiungibile. Riprova più tardi.'
          : 'Iscrizione non riuscita. Verifica l’email e riprova.');
      }
    });
  }
}
