// =============================================================================
//  frontend/src/app/app.routes.ts
//  ROUTING. Architettura "Veil": ESISTE UNA SOLA pagina di contenuto pubblico
//  (LandingComponent). I temi (veli 1/2/3) NON sono rotte: sono skin applicate
//  da ThemeService. Il velo si sceglie SOLO dal Backoffice (Aspetto del sito).
// =============================================================================

import { Routes } from '@angular/router';
import { authGuard, permessoGuard, superUserGuard } from './services/auth.guard';
import { permessiArea } from './shared/permessi';
// Import EAGER del landing pubblico: è l'entry point del portale, nel bundle main.
import { LandingComponent } from './pages/landing/landing.component';

export const routes: Routes = [
  // -------------------------------------------------------------------------
  // ROOT = LANDING PAGE PUBBLICA (unica fonte di contenuto, tema come velo).
  // NESSUN AuthGuard, NESSUN redirect al login: il portale è pubblico.
  // -------------------------------------------------------------------------
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
    title: 'FIDC — Federazione Innovazione, Digitale e Cybersicurezza'
  },

  // Pagine di dettaglio pubbliche: ogni card di news ed eventi porta qui.
  {
    path: 'eventi/:id',
    title: 'FIDC — Evento',
    loadComponent: () =>
      import('./pages/evento-dettaglio/evento-dettaglio.component').then((m) => m.EventoDettaglioComponent)
  },
  {
    path: 'news/:id',
    title: 'FIDC — Notizia',
    loadComponent: () =>
      import('./pages/news-dettaglio/news-dettaglio.component').then((m) => m.NewsDettaglioComponent)
  },

  // Registrazione utente pubblica (salva su SQLite via .NET API)
  {
    path: 'registrati',
    title: 'FIDC — Registrazione',
    loadComponent: () =>
      import('./pages/registrazione/registrazione.component').then((m) => m.RegistrazioneComponent)
  },

  // Conferma email (atterraggio dal link Resend)
  {
    path: 'conferma-email',
    title: 'FIDC — Conferma email',
    loadComponent: () =>
      import('./pages/conferma-email/conferma-email.component').then((m) => m.ConfermaEmailComponent)
  },

  // Area riservata SOCI: biblioteca documentale in sola lettura.
  // Accessibile a QUALSIASI utente autenticato (authGuard) — non è backoffice.
  {
    path: 'area-documenti',
    canActivate: [authGuard],
    title: 'FIDC — Area Documenti Riservata',
    loadComponent: () =>
      import('./pages/area-documenti/area-documenti.component').then((m) => m.AreaDocumentiComponent)
  },

  // Backoffice — gate di accesso (mai come prima pagina).
  {
    path: 'login',
    title: 'FIDC — Accesso',
    loadComponent: () =>
      import('./pages/admin-login/admin-login.component').then((m) => m.AdminLoginComponent)
  },
  {
    path: 'admin/login',
    title: 'FIDC — Accesso backoffice',
    loadComponent: () =>
      import('./pages/admin-login/admin-login.component').then((m) => m.AdminLoginComponent)
  },

  // -------------------------------------------------------------------------
  // BACKOFFICE protetto (authGuard). Shell con sidebar + moduli CMS.
  // Ogni sezione chiede i permessi della matrice (permessoGuard, shared/permessi.ts);
  // la sezione Permessi è della sola Direzione (superUserGuard).
  // -------------------------------------------------------------------------
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/admin/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'FIDC — Dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard-home.component').then((m) => m.DashboardHomeComponent)
      },
      {
        path: 'eventi',
        canActivate: [permessoGuard(...permessiArea('eventi'))],
        title: 'FIDC — Gestione Eventi',
        loadComponent: () =>
          import('./pages/admin/eventi-admin.component').then((m) => m.EventiAdminComponent)
      },
      {
        path: 'news',
        canActivate: [permessoGuard(...permessiArea('news'))],
        title: 'FIDC — Gestione News',
        loadComponent: () =>
          import('./pages/admin/news-admin.component').then((m) => m.NewsAdminComponent)
      },
      {
        path: 'documenti',
        canActivate: [permessoGuard(...permessiArea('documenti'))],
        title: 'FIDC — Area Documenti',
        loadComponent: () =>
          import('./pages/admin/documenti-admin.component').then((m) => m.DocumentiAdminComponent)
      },
      // --- Amministrazione --------------------------------------------------
      {
        path: 'utenti',
        canActivate: [permessoGuard('utenti.gestire')],
        title: 'FIDC — Gestione Utenti',
        loadComponent: () =>
          import('./pages/admin/utenti-admin.component').then((m) => m.UtentiAdminComponent)
      },
      {
        path: 'newsletter',
        canActivate: [permessoGuard('newsletter.gestire')],
        title: 'FIDC — Newsletter',
        loadComponent: () =>
          import('./pages/admin/newsletter-admin.component').then((m) => m.NewsletterAdminComponent)
      },
      // Alias richiesto dalla specifica: stesso Theme Builder.
      { path: 'impostazioni-tema', pathMatch: 'full', redirectTo: 'impostazioni' },
      {
        path: 'impostazioni',
        canActivate: [permessoGuard('sito.aspetto')],
        title: 'FIDC — Impostazioni & Tema',
        loadComponent: () =>
          import('./pages/admin/impostazioni-tema.component').then((m) => m.ImpostazioniTemaComponent)
      },
      {
        path: 'permessi',
        canActivate: [superUserGuard],
        title: 'FIDC — Permessi',
        loadComponent: () =>
          import('./pages/admin/permessi-admin.component').then((m) => m.PermessiAdminComponent)
      }
    ]
  },

  // Indirizzo sconosciuto: una pagina che lo dice e propone dove andare.
  {
    path: '**',
    title: 'FIDC — Pagina non trovata',
    loadComponent: () =>
      import('./pages/non-trovata/non-trovata.component').then((m) => m.NonTrovataComponent)
  }
];
