// =============================================================================
//  frontend/src/app/shared/permessi.ts
//  MATRICE DEI PERMESSI — l'unico posto dove si decide chi può fare cosa.
//
//  PERCHÉ NON CI SONO PIÙ RUOLI FISSI
//  Prima esistevano due profili rigidi (Direzione e Redazione). La Federazione
//  ha bisogno di più sfumature: chi scrive e pubblica da solo, chi scrive e
//  passa da una revisione, chi rivede soltanto. Ogni persona ha quindi un
//  insieme di permessi (flag) che la Direzione modifica dalla sezione
//  "Permessi" del backoffice. Il menu e i bottoni si adattano ai flag.
//
//  TRE LIVELLI DI ACCESSO
//   - Socio: nessun permesso. Si iscrive da solo, riceve la newsletter e ha
//     soltanto la propria area personale (account, iscrizioni, newsletter).
//   - Redazione: uno o più permessi sui contenuti, assegnati dalla Direzione.
//   - Direzione: controllo completo. Solo la Direzione modifica i permessi.
//
//  ⚠️ Nascondere voci e bottoni è una comodità: la protezione vera sta sul
//  server, che riceve i permessi nel token e li verifica a ogni richiesta
//  (contratto in docs/PERMESSI.md).
// =============================================================================

/** Aree di contenuto soggette al flusso di revisione. */
export type AreaContenuti = 'news' | 'eventi' | 'documenti';

/** Azioni possibili su un'area di contenuto. */
export type AzioneContenuti = 'scrivere' | 'modificare' | 'revisionare' | 'pubblicare';

/** Permesso elementare, come viaggia nel token e nel database. */
export type Permesso =
  | `${AreaContenuti}.${AzioneContenuti}`
  | 'eventi.iscritti'
  | 'newsletter.gestire'
  | 'utenti.gestire'
  | 'sito.contenuti'
  | 'sito.aspetto';

/** Una colonna della matrice. */
export interface VocePermesso {
  chiave: Permesso;
  /** Intestazione breve della colonna. */
  breve: string;
  /** Che cosa consente, detto per intero (tooltip e lettori di schermo). */
  descrizione: string;
  /** Permesso che deve essere attivo perché questo abbia senso. */
  richiede?: Permesso;
}

/** Un gruppo di colonne della matrice. */
export interface AreaPermessi {
  chiave: AreaContenuti | 'amministrazione';
  nome: string;
  voci: VocePermesso[];
}

/**
 * Colonne di un'area di contenuto.
 * @param cosa  il contenuto al plurale, senza articolo ("articoli")
 * @param art   l'articolo determinativo plurale ("gli", "i")
 */
const contenuti = (area: AreaContenuti, nome: string, cosa: string, art: string, scrive = 'Scrive'): AreaPermessi => ({
  chiave: area,
  nome,
  voci: [
    { chiave: `${area}.scrivere`, breve: scrive, descrizione: `${scrive} ${cosa} e modifica i propri` },
    { chiave: `${area}.pubblicare`, breve: 'Pubblica da sé', descrizione: `Pubblica i propri ${cosa} senza passare dalla revisione`, richiede: `${area}.scrivere` },
    { chiave: `${area}.modificare`, breve: 'Modifica altrui', descrizione: `Modifica ${cosa} di altri autori` },
    { chiave: `${area}.revisionare`, breve: 'Revisiona', descrizione: `Rivede ${art} ${cosa} in attesa: li approva e pubblica, o li rimanda all'autore` }
  ]
});

/** Le colonne della matrice, raggruppate per area. */
export const AREE_PERMESSI: AreaPermessi[] = [
  contenuti('news', 'News', 'articoli', 'gli'),
  (() => {
    const a = contenuti('eventi', 'Eventi', 'eventi', 'gli');
    a.voci.push({ chiave: 'eventi.iscritti', breve: 'Iscritti', descrizione: "Vede l'elenco degli iscritti e lo esporta" });
    return a;
  })(),
  contenuti('documenti', 'Documenti', 'documenti', 'i', 'Carica'),
  {
    chiave: 'amministrazione',
    nome: 'Amministrazione',
    voci: [
      { chiave: 'newsletter.gestire', breve: 'Newsletter', descrizione: 'Gestisce gli iscritti alla newsletter' },
      { chiave: 'utenti.gestire', breve: 'Account', descrizione: 'Gestisce gli account: conferme ed eliminazioni' },
      { chiave: 'sito.contenuti', breve: 'Testi del sito', descrizione: 'Modifica i testi istituzionali, gli annunci e i contenuti in evidenza' },
      { chiave: 'sito.aspetto', breve: 'Aspetto', descrizione: "Cambia l'aspetto del sito: velo, colori, caratteri, emblema" }
    ]
  }
];

/** Tutti i permessi, in ordine di matrice. */
export const TUTTI_I_PERMESSI: Permesso[] = AREE_PERMESSI.flatMap((a) => a.voci.map((v) => v.chiave));

/** Assetto completo dei permessi di una persona. */
export interface AssettoPermessi {
  /** Controllo completo: implica ogni permesso e la gestione della matrice. */
  direzione: boolean;
  permessi: Permesso[];
}

/** Modello rapido: un punto di partenza da ritoccare, non un ruolo fisso. */
export interface ModelloPermessi {
  chiave: string;
  nome: string;
  descrizione: string;
  assetto: AssettoPermessi;
}

const SU_TUTTI = (azioni: AzioneContenuti[]): Permesso[] =>
  (['news', 'eventi', 'documenti'] as AreaContenuti[]).flatMap((a) => azioni.map((z) => `${a}.${z}` as Permesso));

export const MODELLI: ModelloPermessi[] = [
  { chiave: 'socio', nome: 'Socio', descrizione: 'Solo area personale e newsletter',
    assetto: { direzione: false, permessi: [] } },
  { chiave: 'autore', nome: 'Autore', descrizione: 'Scrive; pubblica dopo la revisione',
    assetto: { direzione: false, permessi: SU_TUTTI(['scrivere']) } },
  { chiave: 'autore-autonomo', nome: 'Autore autonomo', descrizione: 'Scrive e pubblica da sé',
    assetto: { direzione: false, permessi: SU_TUTTI(['scrivere', 'pubblicare']) } },
  { chiave: 'revisore', nome: 'Revisore', descrizione: 'Rivede, corregge e approva i contenuti degli altri',
    assetto: { direzione: false, permessi: [...SU_TUTTI(['modificare', 'revisionare']), 'eventi.iscritti'] } },
  { chiave: 'direzione', nome: 'Direzione', descrizione: 'Controllo completo, compresi i permessi',
    assetto: { direzione: true, permessi: [] } }
];

/** Vero se l'assetto consente il permesso (la Direzione può tutto). */
export function consente(a: AssettoPermessi | null | undefined, p: Permesso): boolean {
  return !!a && (a.direzione || a.permessi.includes(p));
}

/** Vero se l'assetto consente almeno uno dei permessi. */
export function consenteUno(a: AssettoPermessi | null | undefined, ps: Permesso[]): boolean {
  return ps.some((p) => consente(a, p));
}

/** Permessi di un'area di contenuto. */
export const permessiArea = (area: AreaContenuti): Permesso[] =>
  TUTTI_I_PERMESSI.filter((p) => p.startsWith(area + '.'));

/**
 * Rende coerente un insieme di permessi: toglie i duplicati, quelli sconosciuti
 * e quelli che dipendono da un permesso assente (pubblicare senza scrivere).
 */
export function normalizza(permessi: string[]): Permesso[] {
  const set = new Set(permessi.filter((p): p is Permesso => (TUTTI_I_PERMESSI as string[]).includes(p)));
  for (const area of AREE_PERMESSI) {
    for (const v of area.voci) if (v.richiede && !set.has(v.richiede)) set.delete(v.chiave);
  }
  return TUTTI_I_PERMESSI.filter((p) => set.has(p));
}

/**
 * Assetto per una sessione emessa dal server attuale, che conosce solo i ruoli.
 * Riproduce esattamente i poteri di prima, così nulla cambia finché il server
 * non invia i permessi veri.
 */
export function assettoDaRuolo(ruolo: string | null | undefined): AssettoPermessi {
  if (ruolo === 'SuperUser') return { direzione: true, permessi: [] };
  if (ruolo === 'Relatore') return { direzione: false, permessi: [...SU_TUTTI(['scrivere', 'pubblicare']), 'eventi.iscritti'] };
  return { direzione: false, permessi: [] };
}

/** Livello d'accesso mostrato all'utente: tre parole, non sigle tecniche. */
export type Livello = 'Direzione' | 'Redazione' | 'Socio';

export function livello(a: AssettoPermessi | null | undefined): Livello {
  if (!a) return 'Socio';
  if (a.direzione) return 'Direzione';
  return a.permessi.length ? 'Redazione' : 'Socio';
}

/**
 * Riassunto in italiano di ciò che una persona può fare, per la scheda nel
 * menu e per l'elenco account. Esempio: "Scrive news ed eventi · Revisiona le news".
 */
export function riassunto(a: AssettoPermessi | null | undefined): string {
  if (!a) return 'Area personale e newsletter';
  if (a.direzione) return 'Controllo completo della piattaforma';
  if (!a.permessi.length) return 'Area personale e newsletter';

  const nomi: Record<AreaContenuti, string> = { news: 'news', eventi: 'eventi', documenti: 'documenti' };
  const elenca = (aree: AreaContenuti[]) =>
    aree.length === 1 ? nomi[aree[0]] : aree.slice(0, -1).map((x) => nomi[x]).join(', ') + ' e ' + nomi[aree[aree.length - 1]];
  const dove = (z: AzioneContenuti) => (['news', 'eventi', 'documenti'] as AreaContenuti[]).filter((x) => a.permessi.includes(`${x}.${z}`));

  const parti: string[] = [];
  const scrive = dove('scrivere'), pubblica = dove('pubblicare'), rivede = dove('revisionare'), modifica = dove('modificare');
  if (scrive.length) parti.push(`Scrive ${elenca(scrive)}` + (pubblica.length === scrive.length ? ' e pubblica da sé' : pubblica.length ? '' : ' con revisione'));
  if (rivede.length) parti.push(`Revisiona ${elenca(rivede)}`);
  else if (modifica.length) parti.push(`Modifica ${elenca(modifica)} altrui`);
  const admin = AREE_PERMESSI[3].voci.filter((v) => a.permessi.includes(v.chiave)).map((v) => v.breve.toLowerCase());
  if (admin.length) parti.push(admin.join(', ').replace(/^./, (c) => c.toUpperCase()));
  return parti.join(' · ');
}

/** Modello che corrisponde esattamente all'assetto, se c'è. */
export function modelloDi(a: AssettoPermessi): ModelloPermessi | null {
  const chiave = (x: AssettoPermessi) => x.direzione ? 'D' : [...x.permessi].sort().join(',');
  return MODELLI.find((m) => chiave(m.assetto) === chiave(a)) ?? null;
}
