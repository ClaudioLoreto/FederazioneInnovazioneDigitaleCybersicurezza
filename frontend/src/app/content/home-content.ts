// =============================================================================
//  frontend/src/app/content/home-content.ts
//  COPYWRITING REALE (italiano, tono istituzionale FIDC). Nessun Lorem Ipsum.
//  Condiviso dai 3 layout: il contenuto è identico, cambia solo la presentazione.
// =============================================================================

import type { ScenaIllustrazione } from '../shared/illustrazioni/illustrazione.component';

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

/** News reali di esempio (copy istituzionale). */
export const NEWS = [
  {
    pilastro: 'Ricerca',
    titolo: 'Osservatorio Cybersicurezza 2026: il 68% delle PMI italiane resta vulnerabile',
    sommario:
      'Il nuovo report FIDC fotografa lo stato della sicurezza informatica nelle piccole e medie imprese ' +
      'e indica le tre priorità d’azione per i prossimi dodici mesi.'
  },
  {
    pilastro: 'Formazione',
    titolo: 'Al via la FIDC Academy: 1.000 borse di studio per le competenze digitali',
    sommario:
      'Un programma nazionale di reskilling gratuito dedicato a giovani e lavoratori, con certificazioni ' +
      'riconosciute su cybersicurezza, dato e intelligenza artificiale.'
  },
  {
    pilastro: 'Eventi',
    titolo: 'Cyber Resilience Summit: a Roma i protagonisti della sicurezza europea',
    sommario:
      'Due giornate di confronto tra istituzioni, industria e ricerca per definire l’agenda della ' +
      'resilienza digitale del continente.'
  }
];

/** Modello di un progetto istituzionale in evidenza. */
export interface Progetto {
  codice: string;
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
  iniziali: string;
}

/**
 * GOVERNANCE / FONDATORI — organi di indirizzo della Federazione. Ruoli
 * istituzionali (nomi rappresentativi), coerenti con la missione FIDC.
 */
export const GOVERNANCE: MembroGovernance[] = [
  { nome: 'Consiglio Direttivo', ruolo: 'Presidenza', area: 'Indirizzo strategico', iniziali: 'CD' },
  { nome: 'Comitato Scientifico', ruolo: 'Direzione tecnico-scientifica', area: 'Ricerca & standard', iniziali: 'CS' },
  { nome: 'Osservatorio Cyber', ruolo: 'Coordinamento', area: 'Analisi delle minacce', iniziali: 'OC' },
  { nome: 'Segreteria Generale', ruolo: 'Direzione operativa', area: 'Attività & soci', iniziali: 'SG' },
  { nome: 'Tavolo Formazione', ruolo: 'Coordinamento', area: 'Academy & competenze', iniziali: 'TF' },
  { nome: 'Collegio dei Garanti', ruolo: 'Vigilanza', area: 'Etica & conformità', iniziali: 'CG' }
];
