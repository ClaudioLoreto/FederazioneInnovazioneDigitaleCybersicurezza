// =============================================================================
//  frontend/src/app/content/home-content.ts
//  COPYWRITING REALE (italiano, tono istituzionale FIDC). Nessun Lorem Ipsum.
//  Condiviso dai 3 veli: il contenuto è identico, cambia solo la presentazione.
//  Brand e contatti stanno qui (BRAND, CONTATTI): per un nuovo committente si
//  cambia questo file, non i componenti.
// =============================================================================

import type { TemaEmblema } from '../shared/emblemi/emblema-tema.component';

import type { ScenaIllustrazione } from '../shared/illustrazioni/illustrazione.component';
import type { Evento, News } from '../services/fidc-api.service';

/** Modello di un pilastro istituzionale. */
export interface Pilastro {
  chiave: 'attivita' | 'eventi' | 'formazione' | 'ricerca';
  titolo: string;
  claim: string;
  descrizione: string;
  /**
   * L'illustrazione che accompagna il pilastro. Sta qui e non nel componente
   * perché "cosa si vede accanto a questo testo" è una scelta editoriale:
   * chi rivede i contenuti la trova insieme al testo che deve descrivere.
   */
  scena: ScenaIllustrazione;
}

/** Hero della homepage. */
export const HERO = {
  occhiello: 'Federazione Innovazione, Digitale e Cybersicurezza',
  // SLOGAN: una sola riga, ad alto impatto (51 caratteri). Niente wrapping brutto.
  titolo: 'Innovazione digitale. Sicurezza senza compromessi.',
  sottotitolo:
    'FIDC riunisce imprese, istituzioni, università e professionisti attorno a un obiettivo comune: ' +
    'accelerare l’innovazione del Paese rendendola, allo stesso tempo, più sicura, etica e accessibile a tutti.',
  ctaPrimaria: 'Unisciti alla Federazione',
  ctaSecondaria: 'Scopri i nostri pilastri'
};

/** Box Newsletter (iscrizione pubblica). */
export const NEWSLETTER = {
  titolo: 'Resta aggiornato sulla sicurezza digitale',
  testo:
    'Ricevi report, eventi e linee guida della Federazione. Niente spam: solo contenuti utili, ' +
    'una selezione curata dal nostro osservatorio.',
  cta: 'Iscriviti alla newsletter'
};

/** I 4 pilastri con copy autorevole e specifico. */
export const PILASTRI: Pilastro[] = [
  {
    chiave: 'attivita',
    scena: 'gruppo-di-lavoro',
    titolo: 'Attività',
    claim: 'Tavoli di lavoro e progetti che generano impatto concreto.',
    descrizione:
      'Coordiniamo gruppi di lavoro permanenti su intelligenza artificiale, identità digitale, ' +
      'cloud sovrano e protezione delle infrastrutture critiche, traducendo la visione in policy, ' +
      'linee guida e progetti pilota al servizio di imprese e cittadini.'
  },
  {
    chiave: 'eventi',
    scena: 'conferenza',
    titolo: 'Eventi',
    claim: 'Dove l’ecosistema dell’innovazione si incontra e si confronta.',
    descrizione:
      'Conferenze, summit sulla cybersicurezza, hackathon e tavole rotonde: creiamo occasioni di ' +
      'confronto tra decisori pubblici, aziende e mondo della ricerca per anticipare le sfide del digitale.'
  },
  {
    chiave: 'formazione',
    scena: 'formazione',
    titolo: 'Formazione',
    claim: 'Competenze digitali e di sicurezza per persone e organizzazioni.',
    descrizione:
      'Percorsi certificati, academy e programmi di reskilling progettati con esperti del settore, ' +
      'per colmare il divario di competenze e diffondere una cultura della sicurezza a ogni livello.'
  },
  {
    chiave: 'ricerca',
    scena: 'analisi',
    titolo: 'Ricerca',
    claim: 'Studi e osservatori indipendenti per decidere con consapevolezza.',
    descrizione:
      'Pubblichiamo white paper, report e osservatori sull’evoluzione del digitale e delle minacce cyber, ' +
      'mettendo dati affidabili a disposizione di istituzioni, imprese e cittadini.'
  }
];

/** Sezione "Chi Siamo". */
export const CHI_SIAMO = {
  titolo: 'Chi siamo',
  testo:
    'La Federazione Innovazione, Digitale e Cybersicurezza è un’organizzazione indipendente e senza scopo di lucro ' +
    'che promuove la trasformazione digitale del Paese in modo sicuro, inclusivo e sostenibile. ' +
    'Riuniamo competenze d’eccellenza per accompagnare imprese e istituzioni in un percorso di innovazione ' +
    'in cui la sicurezza non è un vincolo, ma il fondamento della fiducia digitale.',
  numeri: [
    { valore: '+250', label: 'Organizzazioni aderenti' },
    { valore: '120', label: 'Esperti e relatori' },
    { valore: '40+', label: 'Eventi all’anno' },
    { valore: '15', label: 'Osservatori e ricerche' }
  ]
};

/** Modello di un progetto istituzionale in evidenza. */
export interface Progetto {
  /** Identificativo interno (non mostrato). */
  codice: string;
  /** Emblema del tema del progetto, mostrato in grande sul progetto di apertura. */
  emblema: TemaEmblema;
  titolo: string;
  categoria: string;
  descrizione: string;
  stato: 'In corso' | 'In avvio' | 'Completato';
  impatto: string;
}

/**
 * PROGETTI IN EVIDENZA — iniziative faro della Federazione. Copy istituzionale
 * reale (nessun Lorem Ipsum), coerente con i quattro pilastri.
 */
export const PROGETTI: Progetto[] = [
  {
    codice: 'CS-01',
    emblema: 'verifica',
    titolo: 'Scudo PMI',
    categoria: 'Cybersicurezza',
    descrizione:
      'Un framework di autovalutazione e messa in sicurezza pensato per le piccole e medie imprese: ' +
      'diagnosi gratuita del rischio cyber, playbook operativi e affiancamento di esperti certificati.',
    stato: 'In corso',
    impatto: '2.400 imprese coinvolte'
  },
  {
    codice: 'ID-02',
    emblema: 'impronta',
    titolo: 'Identità Digitale Sicura',
    categoria: 'Identità & Fiducia',
    descrizione:
      'Un tavolo tecnico permanente per definire standard aperti di identità digitale e wallet europei, ' +
      'garantendo interoperabilità, privacy e piena conformità al regolamento eIDAS 2.',
    stato: 'In corso',
    impatto: '18 enti allineati'
  },
  {
    codice: 'AI-03',
    emblema: 'chip',
    titolo: 'IA Responsabile',
    categoria: 'Intelligenza Artificiale',
    descrizione:
      'Linee guida e strumenti di valutazione per adottare l’intelligenza artificiale in modo etico e ' +
      'trasparente, con particolare attenzione alla sicurezza dei dati e alla mitigazione dei bias.',
    stato: 'In avvio',
    impatto: 'Rilascio linee guida 2026'
  },
  {
    codice: 'ED-04',
    emblema: 'libro',
    titolo: 'Academy Nazionale',
    categoria: 'Competenze',
    descrizione:
      'Un percorso formativo diffuso su tutto il territorio per colmare il divario di competenze digitali ' +
      'e di sicurezza, con borse di studio, certificazioni riconosciute e laboratori sul campo.',
    stato: 'In corso',
    impatto: '1.000 borse di studio'
  }
];

/** Modello di un membro della governance / fondatore. */
export interface MembroGovernance {
  nome: string;
  ruolo: string;
  area: string;
  /** Emblema della famiglia a scudo: niente sigle, il nome degli organi può cambiare. */
  emblema: TemaEmblema;
}

/**
 * GOVERNANCE / FONDATORI — organi di indirizzo della Federazione. Ruoli
 * istituzionali (nomi rappresentativi), coerenti con la missione FIDC.
 */
export const GOVERNANCE: MembroGovernance[] = [
  { nome: 'Consiglio Direttivo', ruolo: 'Presidenza', area: 'Indirizzo strategico', emblema: 'bussola' },
  { nome: 'Comitato Scientifico', ruolo: 'Direzione tecnico-scientifica', area: 'Ricerca & standard', emblema: 'grafico' },
  { nome: 'Osservatorio Cyber', ruolo: 'Coordinamento', area: 'Analisi delle minacce', emblema: 'radar' },
  { nome: 'Segreteria Generale', ruolo: 'Direzione operativa', area: 'Attività & soci', emblema: 'documento' },
  { nome: 'Tavolo Formazione', ruolo: 'Coordinamento', area: 'Academy & competenze', emblema: 'libro' },
  { nome: 'Collegio dei Garanti', ruolo: 'Vigilanza', area: 'Etica & conformità', emblema: 'bilancia' }
];

// =============================================================================
//  IDENTITÀ, NAVIGAZIONE E CONTATTI
// =============================================================================

/**
 * Nome dell'ente. Il marchio (simbolo + nome) legge da qui: per adattare il
 * portale a un altro committente basta cambiare queste righe.
 */
export const BRAND = {
  nome: 'Federazione Innovazione, Digitale e Cybersicurezza',
  sigla: 'FIDC',
  righeMarchio: ['Federazione', 'Innovazione, Digitale', 'e Cybersicurezza']
};

/** Voce del menu: un'ancora della home (id) oppure una rotta dell'app. */
export interface VoceMenu { label: string; ancora?: string; rotta?: string; }

/** Menu principale. Ogni voce porta a una sezione reale della pagina. */
export const MENU: VoceMenu[] = [
  { label: 'Associazione', ancora: 'associazione' },
  { label: 'Attività', ancora: 'pilastro-attivita' },
  { label: 'Eventi', ancora: 'eventi' },
  { label: 'Formazione', ancora: 'pilastro-formazione' },
  { label: 'Ricerca', ancora: 'pilastro-ricerca' },
  { label: 'Progetti', ancora: 'progetti' },
  { label: 'News', ancora: 'news' },
  { label: 'Contatti', ancora: 'contatti' }
];

/** Missione: tre impegni, non una sequenza (quindi niente numerazione). */
export const MISSIONE = {
  titolo: 'La nostra missione',
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
      testo: 'Formiamo persone e organizzazioni perché l\u2019innovazione sia un\u2019opportunità per tutti, ' +
        'non un privilegio di chi ha già le competenze.'
    }
  ]
};

/**
 * Recapiti istituzionali. Sono SEGNAPOSTO da sostituire con quelli reali
 * dell'ente prima della messa in produzione.
 */
export const CONTATTI = {
  sede: 'Via della Conciliazione 1, 00193 Roma',
  email: 'segreteria@fidc.it',
  pec: 'fidc@pec.it',
  telefono: '+39 06 0000 0000',
  whatsapp: '+39 300 000 0000',
  orari: 'Segreteria: dal lunedì al venerdì, 9:30–17:30',
  social: [
    { rete: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { rete: 'Facebook', url: 'https://www.facebook.com/' },
    { rete: 'Instagram', url: 'https://www.instagram.com/' }
  ]
};

// =============================================================================
//  CONTENUTI DI RISERVA
//  Gli stessi eventi e le stesse news che il DataSeeder del backend scrive nel
//  database. Si mostrano SOLO se l'API non risponde o non ha nulla da mostrare,
//  così la home non appare mai vuota durante una demo o un disservizio.
// =============================================================================

/** Data ISO spostata di n giorni rispetto a oggi. */
function traGiorni(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 30, 0, 0);
  return d.toISOString();
}

/** Eventi di riserva, specchio del DataSeeder (date relative a oggi). */
export function eventiDiRiserva(): Evento[] {
  const base = { pubblicato: true, relatoreId: 0, dataFine: null };
  return [
    {
      ...base, id: -1, pilastro: 'Formazione', postiTotali: 120, dataInizio: traGiorni(21),
      titolo: 'AI Governance Workshop: regole, etica e responsabilità',
      sottotitolo: 'Tradurre l\u2019AI Act in pratiche operative per imprese e PA',
      descrizione: 'Un laboratorio intensivo dedicato all\u2019applicazione concreta del Regolamento europeo sull\u2019intelligenza artificiale.',
      luogo: 'Milano — Talent Garden Calabiana'
    },
    {
      ...base, id: -2, pilastro: 'Attivita', postiTotali: 200, dataInizio: traGiorni(40),
      titolo: 'Hackathon Cyber Defenders: difendere le infrastrutture critiche',
      sottotitolo: '48 ore per costruire soluzioni di difesa di nuova generazione',
      descrizione: 'Una maratona di progettazione per prototipare strumenti di rilevamento e risposta alle minacce.',
      luogo: 'Torino — OGR Tech'
    },
    {
      ...base, id: -3, pilastro: 'Eventi', postiTotali: 400, dataInizio: traGiorni(61),
      titolo: 'Cyber Resilience Summit 2026',
      sottotitolo: 'La resilienza digitale dell\u2019Europa: strategie, alleanze, tecnologie',
      descrizione: 'Due giornate di confronto tra istituzioni, industria e ricerca su NIS2 e infrastrutture critiche.',
      luogo: 'Roma — Auditorium della Tecnica'
    }
  ];
}

/** News di riserva, specchio del DataSeeder. */
export function newsDiRiserva(): News[] {
  const base = { pubblicato: true, autoreId: 0, immagineCopertina: null, contenuto: '' };
  return [
    {
      ...base, id: -1, pilastro: 'Ricerca', dataPubblicazione: traGiorni(-2), slug: 'osservatorio-cybersicurezza-2026',
      titolo: 'Osservatorio Cybersicurezza 2026: il 68% delle PMI italiane resta vulnerabile',
      sommario: 'Il nuovo report FIDC fotografa lo stato della sicurezza informatica nelle piccole e medie imprese e indica le tre priorità d\u2019azione per i prossimi dodici mesi.'
    },
    {
      ...base, id: -2, pilastro: 'Formazione', dataPubblicazione: traGiorni(-7), slug: 'fidc-academy-borse-di-studio',
      titolo: 'Al via la FIDC Academy: 1.000 borse di studio per le competenze digitali',
      sommario: 'Un programma nazionale di reskilling gratuito con certificazioni riconosciute su cybersicurezza, dato e intelligenza artificiale.'
    },
    {
      ...base, id: -3, pilastro: 'Eventi', dataPubblicazione: traGiorni(-10), slug: 'cyber-resilience-summit-roma',
      titolo: 'Cyber Resilience Summit: a Roma i protagonisti della sicurezza europea',
      sommario: 'Due giornate di confronto tra istituzioni, industria e ricerca per definire l\u2019agenda della resilienza digitale del continente.'
    },
    {
      ...base, id: -4, pilastro: 'Attivita', dataPubblicazione: traGiorni(-18), slug: 'linee-guida-ai-pubblica-amministrazione',
      titolo: 'Intelligenza artificiale e PA: pubblicate le linee guida FIDC per un\u2019adozione responsabile',
      sommario: 'Un documento operativo per accompagnare le amministrazioni nell\u2019introduzione di sistemi di AI affidabili e conformi all\u2019AI Act.'
    }
  ];
}
