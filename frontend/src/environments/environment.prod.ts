// =============================================================================
//  frontend/src/environments/environment.prod.ts
//  Configurazione di PRODUZIONE. In prod il frontend e l'API condividono lo
//  stesso dominio, quindi si usa un percorso relativo '/api'.
// =============================================================================

export const environment = {
  production: true,
  /** Base URL dell'API FIDC in produzione (stesso dominio del sito). */
  apiBaseUrl: '/api',
  /** Assente in produzione: il bottone auto-login non viene renderizzato. */
  devAutoLogin: null as { email: string; password: string } | null
};
