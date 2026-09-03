// =============================================================================
//  frontend/src/environments/environment.prod.ts
//  Configurazione di PRODUZIONE. Sito e API stanno sullo stesso dominio,
//  quindi basta un percorso relativo.
// =============================================================================

import type { ProfiloDiProva } from './tipi';

export const environment = {
  production: true,

  /** Indirizzo base dell'API in produzione. */
  apiBaseUrl: '/api',

  /**
   * Vuoto di proposito: in produzione non esistono utenze di prova e il
   * riquadro di accesso rapido non viene nemmeno disegnato.
   */
  profiliDiProva: [] as ProfiloDiProva[]
};
