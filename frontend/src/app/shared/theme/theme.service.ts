// =============================================================================
//  frontend/src/app/shared/theme/theme.service.ts
//  Regia unica del "velo" grafico applicato a tutto il sito.
//
//  Il velo non tocca MAI il contenuto: agisce su due sole cose.
//   1. L'attributo data-theme sul tag <html>, che attiva uno dei tre veli
//      predefiniti scritti in _themes.scss.
//   2. Per il velo personalizzato, l'iniezione diretta dei token semantici
//      (--accent, --surface, --text...) come stili inline su <html>, che hanno
//      la precedenza sui veli predefiniti.
//
//  Fonte di verità: il backend (GET /api/tema/attivo). All'avvio applichiamo
//  subito l'ultima configurazione nota, salvata nel browser, per evitare che la
//  pagina appaia per un istante con i colori sbagliati; poi ci allineiamo al
//  server, che è l'unico ad avere l'ultima parola.
//
//  VINCOLO PALETTE: i colori arrivano già ristretti ai 4 istituzionali, validati
//  sia dal Theme Builder sia dal server. Qui li combiniamo soltanto.
// =============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { FidcApiService, TemaConfig } from '../../services/fidc-api.service';

/** Identificativi dei veli predefiniti. */
export type ThemeId = '1' | '2' | '3';

/** Descrittore mostrato nei selettori del backoffice. */
export interface ThemeMeta {
  id: ThemeId;
  nome: string;
  claim: string;
}

/** Chiave con cui l'ultima configurazione viene ricordata nel browser. */
const THEME_KEY = 'fidc.theme.config';

/** I 4 colori istituzionali: le uniche combinazioni ammesse. */
const PALETTE = {
  deepBlue: '#333D6D',
  purple: '#723EC3',
  peach: '#FFCF95',
  cream: '#FFF0D9'
} as const;

/** Configurazione iniziale, coerente con il velo istituzionale approvato. */
const CONFIG_DEFAULT: TemaConfig = {
  temaBase: '1',
  personalizzato: false,
  colorePrimario: PALETTE.peach,
  coloreAccento: PALETTE.purple,
  coloreSfondo: PALETTE.deepBlue,
  coloreTesto: PALETTE.cream,
  stileRaggio: 'sharp',
  abbinamentoFont: 'cyber'
};

/**
 * Tutti i token che il velo personalizzato può sovrascrivere.
 *
 * Questa lista deve restare allineata a ciò che `iniettaOverride` imposta:
 * serve per rimuovere gli stili inline quando si torna a un velo predefinito.
 * Se ne dimentichiamo uno, quel colore resta "incastrato" dal velo precedente:
 * è esattamente il tipo di difetto che rende un Theme Builder inaffidabile.
 */
const TOKEN_VELO = [
  '--page-bg', '--canvas-bg', '--canvas-alpha',
  '--surface', '--surface-strong', '--surface-border', '--surface-spot',
  '--text', '--text-soft', '--text-muted',
  '--accent', '--on-accent', '--accent-2', '--on-accent-2',
  '--accent-soft', '--accent-2-soft',
  '--line', '--line-strong',
  '--glow-accent', '--glow-accent-2', '--glow-neon', '--glow-focus',
  '--hero-bg', '--hero-text', '--bg-elev',
  '--radius', '--font-display', '--font-body'
];

/**
 * Servizio di theming applicativo. Singleton: esiste una sola regia del velo
 * per tutta l'applicazione.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly api = inject(FidcApiService);

  /** Catalogo dei veli predefiniti mostrato nel Theme Builder. */
  readonly temi: ThemeMeta[] = [
    { id: '1', nome: 'Istituzionale', claim: 'Massimo contrasto · autorevole (approvato)' },
    { id: '2', nome: 'Centro di comando', claim: 'Tecnico · superfici dense, lettura di dati' },
    { id: '3', nome: 'Comunità', claim: 'Caldo · vetro leggero, soci ed eventi' }
  ];

  /** Configurazione attualmente applicata. */
  readonly config = signal<TemaConfig>(this.leggiCache());

  constructor() {
    // Prima la configurazione ricordata, così non si vede il cambio di colori...
    this.applica(this.config(), /* persist */ false);
    // ...poi quella autorevole del server.
    this.carica();
  }

  /** Scarica dal backend il velo attivo e lo applica. */
  carica(): void {
    this.api.getTemaAttivo().subscribe({
      next: (cfg) => this.applica(cfg, /* persist */ true),
      // Se il server non risponde teniamo l'ultimo velo valido già applicato.
      error: () => { /* nessuna azione: meglio un velo vecchio che nessun velo */ }
    });
  }

  /**
   * Applica un velo: aggiorna lo stato, imposta data-theme e, se il velo è
   * personalizzato, inietta i token calcolati.
   * @param cfg Configurazione da applicare.
   * @param persist Se true la ricorda nel browser per il prossimo avvio.
   */
  applica(cfg: TemaConfig, persist = true): void {
    this.config.set(cfg);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, JSON.stringify(cfg)); } catch { /* storage non disponibile */ }
    }
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', cfg.temaBase);

    // Prima si ripulisce sempre: altrimenti i token del velo personalizzato
    // precedente sopravviverebbero al passaggio a un velo predefinito.
    this.rimuoviOverride(root);
    if (cfg.personalizzato) this.iniettaOverride(cfg, root);
  }

  /**
   * Anteprima immediata nel Theme Builder: applica senza salvare né ricordare.
   */
  anteprima(cfg: TemaConfig): void {
    this.applica(cfg, /* persist */ false);
  }

  // --- costruzione del velo personalizzato ----------------------------------

  /**
   * Traduce le quattro scelte del Theme Builder nell'intero insieme di token.
   *
   * Il punto delicato è lo sfondo: su fondo scuro la scena 3D resta protagonista
   * e le superfici sono vetro scuro; su fondo chiaro la scena viene attenuata,
   * altrimenti coprirebbe il colore scelto e la selezione sembrerebbe ignorata.
   */
  private iniettaOverride(c: TemaConfig, root: HTMLElement): void {
    const set = (chiave: string, valore: string) => root.style.setProperty(chiave, valore);

    const sfondoScuro = this.isScuro(c.coloreSfondo);
    const testo = c.coloreTesto;

    // --- sfondo e scena 3D ---
    if (sfondoScuro) {
      set('--page-bg', 'transparent');
      set('--canvas-bg', c.coloreSfondo);
      set('--canvas-alpha', '1');
    } else {
      set('--page-bg', c.coloreSfondo);
      set('--canvas-bg', c.coloreSfondo);
      set('--canvas-alpha', '0.14');
    }

    // --- superfici ---
    // Su fondo scuro il vetro è una velatura dello sfondo stesso; su fondo
    // chiaro è una velatura del testo, che è l'unico colore scuro disponibile.
    const baseVetro = sfondoScuro ? c.coloreSfondo : testo;
    set('--surface', this.rgba(baseVetro, sfondoScuro ? 0.34 : 0.06));
    set('--surface-strong', this.rgba(baseVetro, sfondoScuro ? 0.52 : 0.11));
    set('--surface-border', this.rgba(sfondoScuro ? testo : testo, sfondoScuro ? 0.20 : 0.16));
    set('--surface-spot', this.rgba(c.coloreAccento, 0.18));

    // --- testo ---
    set('--text', testo);
    set('--text-soft', this.rgba(testo, 0.78));
    set('--text-muted', this.rgba(testo, 0.54));

    // --- accenti ---
    set('--accent', c.colorePrimario);
    set('--on-accent', this.contrasto(c.colorePrimario));
    set('--accent-2', c.coloreAccento);
    set('--on-accent-2', this.contrasto(c.coloreAccento));
    set('--accent-soft', this.rgba(c.colorePrimario, 0.18));
    set('--accent-2-soft', this.rgba(c.coloreAccento, 0.22));

    // --- linee ---
    set('--line', this.rgba(testo, sfondoScuro ? 0.15 : 0.14));
    set('--line-strong', this.rgba(c.colorePrimario, 0.5));

    // --- bagliori ---
    set('--glow-accent', `0 10px 32px ${this.rgba(c.colorePrimario, 0.34)}`);
    set('--glow-accent-2', `0 12px 38px ${this.rgba(c.coloreAccento, 0.38)}`);
    set('--glow-neon',
      `0 0 12px ${this.rgba(c.colorePrimario, 0.45)},` +
      `0 0 26px ${this.rgba(c.coloreAccento, 0.34)},` +
      `0 16px 44px ${this.rgba(c.coloreSfondo, 0.45)}`);
    set('--glow-focus',
      `0 0 0 2px ${this.rgba(c.colorePrimario, 0.85)},` +
      `0 0 18px ${this.rgba(c.colorePrimario, 0.40)}`);

    // --- sezioni in evidenza ---
    set('--hero-bg', 'transparent');
    set('--hero-text', testo);
    set('--bg-elev', this.rgba(baseVetro, sfondoScuro ? 0.6 : 0.08));

    // --- forma e tipografia ---
    set('--radius', this.raggio(c.stileRaggio));
    const [display, body] = this.font(c.abbinamentoFont);
    set('--font-display', display);
    set('--font-body', body);
  }

  /** Rimuove gli stili inline: tornano a valere i veli di _themes.scss. */
  private rimuoviOverride(root: HTMLElement): void {
    for (const token of TOKEN_VELO) root.style.removeProperty(token);
  }

  // --- funzioni di supporto --------------------------------------------------

  /** Restituisce il colore leggibile sopra il colore indicato. */
  private contrasto(hex: string): string {
    return this.isScuro(hex) ? PALETTE.cream : PALETTE.deepBlue;
  }

  /** Vero se il colore è uno dei due scuri della palette. */
  private isScuro(hex: string): boolean {
    const h = hex.toUpperCase();
    return h === PALETTE.deepBlue || h === PALETTE.purple;
  }

  /** Traduce la scelta sugli angoli nel valore di border-radius. */
  private raggio(stile: TemaConfig['stileRaggio']): string {
    switch (stile) {
      case 'rounded': return '18px';
      case 'soft': return '8px';
      default: return '0px'; // sharp: angoli vivi, tagliati in diagonale
    }
  }

  /** Restituisce la coppia [titoli, testo] per l'abbinamento scelto. */
  private font(abbinamento: TemaConfig['abbinamentoFont']): [string, string] {
    switch (abbinamento) {
      case 'moderno':
        return [`'Segoe UI', system-ui, Roboto, sans-serif`, `system-ui, 'Segoe UI', Roboto, sans-serif`];
      case 'classico':
        return [`Georgia, 'Times New Roman', serif`, `Georgia, 'Times New Roman', serif`];
      default:
        return [`'Chakra Petch', 'Segoe UI', system-ui, sans-serif`, `system-ui, 'Segoe UI', Roboto, sans-serif`];
    }
  }

  /** Converte un colore della palette in rgba() con la trasparenza indicata. */
  private rgba(hex: string, alpha: number): string {
    const n = hex.replace('#', '');
    const r = parseInt(n.substring(0, 2), 16);
    const g = parseInt(n.substring(2, 4), 16);
    const b = parseInt(n.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /** Legge l'ultima configurazione ricordata, con ritorno al default. */
  private leggiCache(): TemaConfig {
    if (typeof localStorage === 'undefined') return { ...CONFIG_DEFAULT };
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (!raw) return { ...CONFIG_DEFAULT };
      return { ...CONFIG_DEFAULT, ...(JSON.parse(raw) as Partial<TemaConfig>) };
    } catch {
      return { ...CONFIG_DEFAULT };
    }
  }
}
