// =============================================================================
//  frontend/src/environments/environment.ts
//  Configurazione di SVILUPPO (è quella usata da `npm start`).
//  L'API locale gira in HTTP su http://localhost:5000: niente certificati da
//  accettare e nessun avviso del browser.
// =============================================================================

import type { ProfiloDiProva } from './tipi';

export const environment = {
  production: false,

  /** Indirizzo base dell'API, suffisso /api compreso. */
  apiBaseUrl: 'http://localhost:5000/api',

  /**
   * Utenze create dal DataSeeder del backend, elencate nella pagina di accesso
   * per poter provare i due livelli di permessi senza cercarle nella
   * documentazione. Sono le stesse di docs/UTENTI-E-RUOLI.md: se cambiano lì,
   * vanno cambiate anche qui.
   *
   * In produzione questo elenco è vuoto e il riquadro non viene disegnato.
   */
  profiliDiProva: [
    {
      ruolo: 'Direzione',
      nome: 'Lorenzo De Santis',
      ambito: 'Governa tutta la piattaforma',
      email: 'direzione@fidc.it',
      password: 'Fidc#2026!'
    },
    {
      ruolo: 'Redazione',
      nome: 'Giulia Ferraro',
      ambito: 'Solo i contenuti di cui è autrice',
      email: 'g.ferraro@fidc.it',
      password: 'Fidc#2026!'
    },
    {
      ruolo: 'Redazione',
      nome: 'Marco Bianchi',
      ambito: 'Solo i contenuti di cui è autore',
      email: 'm.bianchi@fidc.it',
      password: 'Fidc#2026!'
    }
  ] as ProfiloDiProva[]
};
