// =============================================================================
//  frontend/src/environments/environment.ts
//  Configurazione di DEFAULT (sviluppo). Punta all'API .NET locale in HTTP.
//  Porta Kestrel: http://localhost:5000 (SOLO HTTP in dev — vedi launchSettings.json).
//  Niente HTTPS in locale: nessun certificato, nessun blocco del browser.
// =============================================================================

export const environment = {
  production: false,
  /** Base URL dell'API FIDC (include il suffisso /api). */
  apiBaseUrl: 'http://localhost:5000/api',
  /** Credenziali SuperUser del DataSeeder — SOLO development, bottone auto-login. */
  devAutoLogin: {
    email: 'direzione@fidc.it',
    password: 'Fidc#2026!'
  }
};
