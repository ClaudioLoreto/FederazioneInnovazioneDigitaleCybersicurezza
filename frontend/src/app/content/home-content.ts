// =============================================================================
//  frontend/src/app/content/home-content.ts
//  CONTENUTI DEL SITO — modello e valori di partenza.
//
//  Tutto ciò che si legge sul sito pubblico (nome dell'ente, slogan, annuncio,
//  pilastri, chi siamo, numeri, governance, progetti, newsletter, contatti) è
//  modificabile dal backoffice (Contenuti del sito) e arriva dal server
//  (ContenutiService). Qui stanno solo:
//   - i TIPI, condivisi da sito pubblico e backoffice;
//   - i VALORI DI PARTENZA, usati finché il server non ne ha di propri.
//
//  Valori di partenza: SOLO il testo istituzionale (slogan, presentazione,
//  pilastri, missione, newsletter). Nessun dato inventato: numeri, governance,
//  progetti e recapiti partono vuoti e le sezioni corrispondenti non compaiono
//  finché qualcuno non le compila. Niente eventi o news di riserva.
//  Condiviso dai 3 veli: il contenuto è identico, cambia solo la presentazione.
// =============================================================================

import type { TemaEmblema } from '../shared/emblemi/emblema-tema.component';
import type { ScenaIllustrazione } from '../shared/illustrazioni/illustrazione.component';
import { ChiaveLegale, LEGALI_PREDEFINITI, PaginaLegale } from './testi-legali';

/** Chiavi fisse dei quattro pilastri (le ancore del menu dipendono da queste). */
export type ChiavePilastro = 'attivita' | 'eventi' | 'formazione' | 'ricerca';

/** Un pilastro istituzionale. */
export interface Pilastro {
  chiave: ChiavePilastro;
  titolo: string;
  claim: string;
  descrizione: string;
  /** Illustrazione in testa alla card. */
  scena: ScenaIllustrazione;
  /** Emblema della famiglia a scudo, appoggiato sull'illustrazione. */
  emblema: TemaEmblema;
}

/** Un numero chiave della Federazione (es. "250" · "Organizzazioni aderenti"). */
export interface Numero { valore: string; etichetta: string; }

/** Un impegno della missione. */
export interface Impegno { titolo: string; testo: string; }

/** Un organo della governance. */
export interface MembroGovernance {
  nome: string;
  ruolo: string;
  area: string;
  /** Emblema della famiglia a scudo: niente sigle, il nome degli organi può cambiare. */
  emblema: TemaEmblema;
}

/** Un progetto in evidenza. */
export interface Progetto {
  /** Identificativo stabile (non mostrato). */
  codice: string;
  emblema: TemaEmblema;
  titolo: string;
  categoria: string;
  descrizione: string;
  stato: 'In corso' | 'In avvio' | 'Completato';
  impatto: string;
}

/** Un profilo social. */
export interface Social { rete: 'LinkedIn' | 'Facebook' | 'Instagram' | 'YouTube' | 'X'; url: string; }

/** Tutti i contenuti modificabili del sito. */
export interface ContenutiSito {
  identita: {
    /** Nome per esteso dell'ente. */
    nome: string;
    /** Il nome su tre righe, come compare accanto al simbolo. */
    righeMarchio: [string, string, string];
    /** Una riga che dice che cosa è l'ente (piè di pagina, anteprime). */
    descrizione: string;
    /** Indirizzo di un simbolo alternativo (SVG o PNG). Vuoto = scudo sfaccettato. */
    simbolo: string;
  };
  apertura: {
    /** Due frasi: la prima nel colore del testo, la seconda in evidenza. Max 50 caratteri in tutto. */
    slogan: [string, string];
    testo: string;
    ctaPrimaria: string;
    ctaSecondaria: string;
  };
  /** Annuncio nella fascia sotto l'apertura. Ha la precedenza su evento imminente e ultima news. */
  annuncio: {
    attivo: boolean;
    testo: string;
    collegamento: string;
    etichettaCollegamento: string;
    /** Data (AAAA-MM-GG) dopo la quale l'annuncio sparisce da solo. Vuota = nessuna scadenza. */
    scadenza: string;
  };
  /** Contenuti messi in evidenza a mano. Senza scelta decide la data. */
  evidenza: { newsId: number | null; eventoId: number | null };
  pilastri: Pilastro[];
  associazione: {
    titolo: string;
    testo: string;
    numeri: Numero[];
    missioneTitolo: string;
    impegni: Impegno[];
    governance: MembroGovernance[];
  };
  progetti: Progetto[];
  newsletter: { titolo: string; testo: string; cta: string };
  contatti: {
    sede: string;
    email: string;
    pec: string;
    telefono: string;
    whatsapp: string;
    orari: string;
    social: Social[];
  };
  /** Pagine legali: privacy, cookie, note legali, accessibilità (bozze in testi-legali.ts). */
  legali: Record<ChiaveLegale, PaginaLegale>;
}

/** Lunghezza massima dello slogan (regola dell'hero in CLAUDE.md §4-bis). */
export const SLOGAN_MAX = 50;

/** Valori di partenza: solo testo istituzionale, nessun dato inventato. */
export const CONTENUTI_PREDEFINITI: ContenutiSito = {
  identita: {
    nome: 'Federazione Innovazione, Digitale e Cybersicurezza',
    righeMarchio: ['Federazione', 'Innovazione, Digitale', 'e Cybersicurezza'],
    descrizione: 'Organizzazione indipendente e senza scopo di lucro per un’Italia digitale più sicura, inclusiva e competente.',
    simbolo: ''
  },
  apertura: {
    slogan: ['Innovazione digitale.', 'Sicurezza senza compromessi.'],
    testo:
      'La Federazione riunisce imprese, istituzioni, università e professionisti attorno a un obiettivo comune: ' +
      'accelerare l’innovazione del Paese rendendola, allo stesso tempo, più sicura, etica e accessibile a tutti.',
    ctaPrimaria: 'Unisciti alla Federazione',
    ctaSecondaria: 'Scopri i nostri pilastri'
  },
  annuncio: { attivo: false, testo: '', collegamento: '', etichettaCollegamento: 'Leggi', scadenza: '' },
  evidenza: { newsId: null, eventoId: null },
  pilastri: [
    {
      chiave: 'attivita', scena: 'gruppo-di-lavoro', emblema: 'rete',
      titolo: 'Attività',
      claim: 'Tavoli di lavoro e progetti che generano impatto concreto.',
      descrizione:
        'Coordiniamo gruppi di lavoro permanenti su intelligenza artificiale, identità digitale, ' +
        'cloud sovrano e protezione delle infrastrutture critiche, traducendo la visione in policy, ' +
        'linee guida e progetti pilota al servizio di imprese e cittadini.'
    },
    {
      chiave: 'eventi', scena: 'conferenza', emblema: 'calendario',
      titolo: 'Eventi',
      claim: 'Dove l’ecosistema dell’innovazione si incontra e si confronta.',
      descrizione:
        'Conferenze, summit sulla cybersicurezza, hackathon e tavole rotonde: creiamo occasioni di ' +
        'confronto tra decisori pubblici, aziende e mondo della ricerca per anticipare le sfide del digitale.'
    },
    {
      chiave: 'formazione', scena: 'formazione', emblema: 'libro',
      titolo: 'Formazione',
      claim: 'Competenze digitali e di sicurezza per persone e organizzazioni.',
      descrizione:
        'Percorsi certificati, academy e programmi di reskilling progettati con esperti del settore, ' +
        'per colmare il divario di competenze e diffondere una cultura della sicurezza a ogni livello.'
    },
    {
      chiave: 'ricerca', scena: 'analisi', emblema: 'grafico',
      titolo: 'Ricerca',
      claim: 'Studi e osservatori indipendenti per decidere con consapevolezza.',
      descrizione:
        'Pubblichiamo white paper, report e osservatori sull’evoluzione del digitale e delle minacce cyber, ' +
        'mettendo dati affidabili a disposizione di istituzioni, imprese e cittadini.'
    }
  ],
  associazione: {
    titolo: 'Chi siamo',
    testo:
      'La Federazione Innovazione, Digitale e Cybersicurezza è un’organizzazione indipendente e senza scopo di lucro ' +
      'che promuove la trasformazione digitale del Paese in modo sicuro, inclusivo e sostenibile. ' +
      'Riuniamo competenze d’eccellenza per accompagnare imprese e istituzioni in un percorso di innovazione ' +
      'in cui la sicurezza non è un vincolo, ma il fondamento della fiducia digitale.',
    numeri: [],
    missioneTitolo: 'La nostra missione',
    impegni: [
      {
        titolo: 'Mettere in rete',
        testo: 'Facciamo lavorare insieme imprese, pubbliche amministrazioni, università e professionisti, ' +
          'perché nessuno affronti da solo la trasformazione digitale.'
      },
      {
        titolo: 'Proteggere',
        testo: 'Diffondiamo pratiche di sicurezza applicabili davvero, dalla micro impresa al grande ente, ' +
          'con strumenti gratuiti e affiancamento di esperti.'
      },
      {
        titolo: 'Rendere accessibile',
        testo: 'Formiamo persone e organizzazioni perché l’innovazione sia un’opportunità per tutti, ' +
          'non un privilegio di chi ha già le competenze.'
      }
    ],
    governance: []
  },
  progetti: [],
  newsletter: {
    titolo: 'Resta aggiornato sulla sicurezza digitale',
    testo:
      'Ricevi report, eventi e linee guida della Federazione. Niente spam: solo contenuti utili, ' +
      'una selezione curata dal nostro osservatorio.',
    cta: 'Iscriviti alla newsletter'
  },
  contatti: { sede: '', email: '', pec: '', telefono: '', whatsapp: '', orari: '', social: [] },
  legali: LEGALI_PREDEFINITI
};

// =============================================================================
//  NAVIGAZIONE
// =============================================================================

/** Voce del menu: un'ancora della home (id) oppure una rotta dell'app. */
export interface VoceMenu {
  label: string;
  ancora?: string;
  rotta?: string;
  /** La voce compare solo se la sezione ha contenuti (vedi VetrinaService). */
  serve?: 'eventi' | 'news' | 'progetti' | 'contatti';
}

/** Menu principale. Ogni voce porta a una sezione reale della pagina. */
export const MENU: VoceMenu[] = [
  { label: 'Associazione', ancora: 'associazione' },
  { label: 'Attività', ancora: 'pilastro-attivita' },
  { label: 'Eventi', ancora: 'eventi', serve: 'eventi' },
  { label: 'Formazione', ancora: 'pilastro-formazione' },
  { label: 'Ricerca', ancora: 'pilastro-ricerca' },
  { label: 'Progetti', ancora: 'progetti', serve: 'progetti' },
  { label: 'News', ancora: 'news', serve: 'news' },
  { label: 'Contatti', ancora: 'contatti', serve: 'contatti' }
];
