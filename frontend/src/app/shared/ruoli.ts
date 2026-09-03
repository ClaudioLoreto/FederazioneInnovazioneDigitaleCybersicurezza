// =============================================================================
//  frontend/src/app/shared/ruoli.ts
//  Traduzione dei ruoli tecnici nelle denominazioni ufficiali della Federazione.
//
//  PERCHÉ ESISTE QUESTO FILE
//  Nel codice e nei token di autenticazione i ruoli si chiamano "SuperUser" e
//  "Relatore": sono nomi nati durante lo sviluppo e non si possono cambiare,
//  perché sono scritti nei token già emessi e nelle regole di autorizzazione
//  del server. All'utente, però, un ente pubblico non scrive "Super User".
//
//  Qui sta l'unica corrispondenza fra i due mondi. Se domani la Federazione
//  decide di chiamarli diversamente, si cambia questo file e cambia ovunque.
//
//  ⚠️ Non scrivere le etichette a mano dentro i componenti: userebbero parole
//  diverse in punti diversi, ed è così che un'interfaccia perde credibilità.
// =============================================================================

/** Ruoli tecnici, come arrivano dal backend. */
export type RuoloTecnico = 'SuperUser' | 'Relatore';

/** Come un ruolo viene presentato all'utente. */
export interface DescrizioneRuolo {
  /** Denominazione ufficiale, quella mostrata a schermo. */
  etichetta: string;
  /** Che cosa comporta, in poche parole. */
  ambito: string;
}

const RUOLI: Record<RuoloTecnico, DescrizioneRuolo> = {
  SuperUser: {
    etichetta: 'Direzione',
    ambito: 'Governa la piattaforma'
  },
  Relatore: {
    etichetta: 'Redazione',
    ambito: 'Cura i propri contenuti'
  }
};

/** Ripiego per un ruolo sconosciuto: meglio un'etichetta neutra di una vuota. */
const RUOLO_IGNOTO: DescrizioneRuolo = { etichetta: 'Utente', ambito: 'Accesso limitato' };

/** Restituisce etichetta e ambito di un ruolo. */
export function descriviRuolo(ruolo: string | null | undefined): DescrizioneRuolo {
  if (!ruolo) return RUOLO_IGNOTO;
  return RUOLI[ruolo as RuoloTecnico] ?? RUOLO_IGNOTO;
}

/** Scorciatoia per la sola denominazione ufficiale. */
export function etichettaRuolo(ruolo: string | null | undefined): string {
  return descriviRuolo(ruolo).etichetta;
}
