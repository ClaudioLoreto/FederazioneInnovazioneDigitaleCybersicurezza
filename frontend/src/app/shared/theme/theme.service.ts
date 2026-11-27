// =============================================================================
//  frontend/src/app/shared/theme/theme.service.ts
//  Regia unica del "velo" grafico applicato a tutto il sito.
//
//  Il velo non tocca MAI il contenuto: agisce su due sole cose.
//   1. L'attributo data-theme sul tag <html>, che attiva uno dei tre veli
//      predefiniti scritti in styles/_themes.scss.
//   2. Per il velo personalizzato, l'iniezione delle rampe di tono (--D-*,
//      --L-*, --B-*) e dei token di forma come stili inline su <html>, che
//      hanno la precedenza sui veli predefiniti.
//
//  Fonte di verità: il backend (GET /api/tema/attivo). All'avvio applichiamo
//  l'ultima configurazione nota, salvata nel browser, per evitare il lampo di
//  colori sbagliati (anti-FOUC); poi ci allineiamo al server.
//
//  VINCOLO PALETTE: i colori sono solo i 4 istituzionali; le coppie illeggibili
//  vengono rifiutate da `verificaContrasto` prima ancora di arrivare qui.
// =============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { FidcApiService, TemaConfig } from '../../services/fidc-api.service';

/** Identificativi dei veli predefiniti. */
export type ThemeId = '1' | '2' | '3';

/** Descrittore mostrato nel Theme Builder. */
export interface ThemeMeta {
  id: ThemeId;
  nome: string;
  descrizione: string;
}

/** Esito del controllo di contrasto di un velo personalizzato. */
export interface EsitoContrasto {
  ok: boolean;
  problemi: string[];
}

/** Chiave con cui l'ultima configurazione viene ricordata nel browser. */
const THEME_KEY = 'fidc.theme.config';

/** I 4 colori istituzionali: le uniche combinazioni ammesse. */
export const PALETTE = {
  deepBlue: '#333D6D',
  purple: '#723EC3',
  peach: '#FFCF95',
  cream: '#FFF0D9'
} as const;

/** Rapporti di contrasto WCAG fra i 4 colori (calcolati una volta). */
const CONTRASTO: Record<string, number> = {
  [`${PALETTE.cream}|${PALETTE.deepBlue}`]: 9.3,
  [`${PALETTE.peach}|${PALETTE.deepBlue}`]: 7.2,
  [`${PALETTE.cream}|${PALETTE.purple}`]: 5.9,
  [`${PALETTE.peach}|${PALETTE.purple}`]: 4.6,
  [`${PALETTE.deepBlue}|${PALETTE.purple}`]: 2.1,
  [`${PALETTE.cream}|${PALETTE.peach}`]: 1.3
};

/** Configurazione iniziale: il velo istituzionale approvato. */
const CONFIG_DEFAULT: TemaConfig = {
  temaBase: '1',
  personalizzato: false,
  colorePrimario: PALETTE.peach,
  coloreAccento: PALETTE.purple,
  coloreSfondo: PALETTE.deepBlue,
  coloreTesto: PALETTE.cream,
  stileRaggio: 'sharp',
  abbinamentoFont: 'cyber',
  emblemaHero: 'cassaforte'
};

/** Chiavi delle rampe di tono (vedi _themes.scss). */
const CHIAVI_RAMPA = [
  'bg', 'text', 'on-text', 'soft', 'muted', 'surface', 'surface-strong', 'border',
  'line', 'line-strong', 'accent', 'on-accent', 'accent-2', 'on-accent-2',
  'accent-soft', 'signal', 'card-bg', 'card-text', 'card-soft', 'card-border',
  'grid', 'btn-edge'
];

/**
 * Tutti i token che il velo personalizzato può sovrascrivere. Servono per
 * ripulire gli stili inline quando si torna a un velo predefinito: un token
 * dimenticato resterebbe "incastrato" dal velo precedente.
 */
const TOKEN_VELO = [
  ...['D', 'L', 'B'].flatMap((t) => CHIAVI_RAMPA.map((k) => `--${t}-${k}`)),
  '--canvas-bg', '--canvas-ink', '--canvas-ink-2', '--canvas-alpha',
  '--radius', '--cut', '--bracket', '--density', '--motion',
  '--font-display', '--font-body'
];

/** Singleton: una sola regia del velo per tutta l'applicazione. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly api = inject(FidcApiService);

  /** Catalogo dei veli predefiniti mostrato nel Theme Builder. */
  readonly temi: ThemeMeta[] = [
    { id: '1', nome: 'Istituzionale', descrizione: 'Fasce alterne blu, crema e viola. Angoli tagliati, massimo contrasto.' },
    { id: '2', nome: 'Centro di comando', descrizione: 'Tutto scuro, griglia visibile, pannelli densi a riga, movimento più vivo.' },
    { id: '3', nome: 'Comunità', descrizione: 'Chiaro e arioso, angoli arrotondati, movimento appena percettibile.' }
  ];

  /** Configurazione attualmente applicata. */
  readonly config = signal<TemaConfig>(this.leggiCache());

  constructor() {
    // Prima la configurazione ricordata, così non si vede il cambio di colori...
    this.applica(this.config(), false);
    // ...poi quella autorevole del server.
    this.carica();
  }

  /** Scarica dal backend il velo attivo e lo applica. */
  carica(): void {
    this.api.getTemaAttivo().subscribe({
      next: (cfg) => this.applica({ ...CONFIG_DEFAULT, ...cfg }, true),
      // Server irraggiungibile: resta l'ultimo velo valido già applicato.
      error: () => {}
    });
  }

  /**
   * Applica un velo: aggiorna lo stato, imposta data-theme e, se il velo è
   * personalizzato, inietta i token calcolati.
   */
  applica(cfg: TemaConfig, persist = true): void {
    this.config.set(cfg);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, JSON.stringify(cfg)); } catch { /* storage non disponibile */ }
    }
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', cfg.temaBase);
    this.rimuoviOverride(root);
    this.applicaForma(cfg, root);
    if (cfg.personalizzato) this.iniettaOverride(cfg, root);
  }

  /** Anteprima immediata nel Theme Builder: applica senza ricordare. */
  anteprima(cfg: TemaConfig): void {
    this.applica(cfg, false);
  }

  /**
   * Verifica che le scelte del velo personalizzato producano testo leggibile.
   * Soglia: 4.5:1 per il testo (WCAG AA). Restituisce i problemi in chiaro.
   */
  verificaContrasto(c: TemaConfig): EsitoContrasto {
    const problemi: string[] = [];
    const r = (a: string, b: string) => this.rapporto(a, b);
    if (r(c.coloreTesto, c.coloreSfondo) < 4.5) {
      problemi.push('Il testo non si legge sullo sfondo scelto.');
    }
    if (c.colorePrimario.toUpperCase() === c.coloreSfondo.toUpperCase()) {
      problemi.push('Il colore d\'azione è uguale allo sfondo: i bottoni sparirebbero.');
    } else if (r(c.colorePrimario, c.coloreSfondo) < 2) {
      problemi.push('Il colore d\'azione si confonde con lo sfondo: i bottoni non si vedrebbero.');
    }
    if (c.coloreAccento.toUpperCase() === c.coloreSfondo.toUpperCase()) {
      problemi.push('Il colore di supporto è uguale allo sfondo.');
    }
    return { ok: problemi.length === 0, problemi };
  }

  /** Rapporto di contrasto fra due colori della palette (1 se uguali). */
  rapporto(a: string, b: string): number {
    const x = a.toUpperCase(), y = b.toUpperCase();
    if (x === y) return 1;
    return CONTRASTO[`${x}|${y}`] ?? CONTRASTO[`${y}|${x}`] ?? 1;
  }

  /** Restituisce il colore leggibile sopra il colore indicato. */
  contrasto(hex: string): string {
    return this.isScuro(hex) ? PALETTE.cream : PALETTE.deepBlue;
  }

  // --- applicazione -----------------------------------------------------------

  /**
   * Forma e tipografia: valgono anche sui veli predefiniti, perché angoli e
   * caratteri si possono scegliere indipendentemente dai colori.
   */
  private applicaForma(c: TemaConfig, root: HTMLElement): void {
    if (!c.personalizzato) return; // i veli predefiniti hanno la loro forma
    const set = (k: string, v: string) => root.style.setProperty(k, v);
    switch (c.stileRaggio) {
      case 'rounded': set('--radius', '18px'); set('--cut', '0px'); break;
      case 'soft':    set('--radius', '8px');  set('--cut', '0px'); break;
      default:        set('--radius', '2px');  set('--cut', '12px');
    }
    const [display, body] = this.font(c.abbinamentoFont);
    set('--font-display', display);
    set('--font-body', body);
  }

  /**
   * Traduce le quattro scelte cromatiche nelle rampe di tono.
   * Il velo personalizzato è "monotono": scuro e chiaro coincidono, così il
   * colore di sfondo scelto è davvero quello che si vede ovunque. La fascia di
   * marca resta viola (o blu, se lo sfondo scelto è già viola).
   */
  private iniettaOverride(c: TemaConfig, root: HTMLElement): void {
    const set = (k: string, v: string) => root.style.setProperty(k, v);
    const scuro = this.isScuro(c.coloreSfondo);
    const testo = c.coloreTesto;
    const rgba = (h: string, a: number) => this.rgba(h, a);

    const rampa: Record<string, string> = {
      'bg': scuro ? 'transparent' : c.coloreSfondo,
      'text': testo,
      'on-text': c.coloreSfondo,
      'soft': rgba(testo, .80),
      'muted': rgba(testo, .62),
      'surface': rgba(scuro ? c.coloreSfondo : testo, scuro ? .55 : .05),
      'surface-strong': rgba(scuro ? c.coloreSfondo : testo, scuro ? .82 : .08),
      'border': rgba(testo, .16),
      'line': rgba(testo, .14),
      'line-strong': rgba(c.colorePrimario, .6),
      'accent': c.colorePrimario,
      'on-accent': this.contrasto(c.colorePrimario),
      'accent-2': c.coloreAccento,
      'on-accent-2': this.contrasto(c.coloreAccento),
      'accent-soft': rgba(c.colorePrimario, .16),
      'signal': this.rapporto(c.colorePrimario, c.coloreSfondo) >= 3 ? c.colorePrimario : testo,
      'card-bg': scuro ? rgba(c.coloreSfondo, .7) : rgba(PALETTE.peach, .3),
      'card-text': testo,
      'card-soft': rgba(testo, .8),
      'card-border': rgba(testo, .12),
      'grid': rgba(testo, .06),
      // Un bottone viola su fondo blu (o viceversa) ha bisogno di un bordo.
      'btn-edge': this.rapporto(c.colorePrimario, c.coloreSfondo) < 3 ? testo : 'transparent'
    };
    for (const [k, v] of Object.entries(rampa)) { set(`--D-${k}`, v); set(`--L-${k}`, v); }

    // Fascia di marca: viola, salvo che lo sfondo sia già viola.
    const marca = c.coloreSfondo.toUpperCase() === PALETTE.purple ? PALETTE.deepBlue : PALETTE.purple;
    set('--B-bg', marca);

    set('--canvas-bg', c.coloreSfondo);
    set('--canvas-ink', c.colorePrimario);
    set('--canvas-ink-2', testo);
    set('--canvas-alpha', scuro ? '1' : '.45');
  }

  /** Rimuove gli stili inline: tornano a valere i veli di _themes.scss. */
  private rimuoviOverride(root: HTMLElement): void {
    for (const token of TOKEN_VELO) root.style.removeProperty(token);
  }

  // --- supporto ----------------------------------------------------------------

  private isScuro(hex: string): boolean {
    const h = hex.toUpperCase();
    return h === PALETTE.deepBlue || h === PALETTE.purple;
  }

  /** Coppia [titoli, testo] per l'abbinamento tipografico scelto. */
  private font(abbinamento: TemaConfig['abbinamentoFont']): [string, string] {
    const plex = `'IBM Plex Sans', system-ui, 'Segoe UI', sans-serif`;
    switch (abbinamento) {
      case 'moderno':  return [`'Sora Variable', 'Segoe UI', system-ui, sans-serif`, plex];
      case 'classico': return [`'Source Serif 4 Variable', Georgia, serif`, plex];
      default:         return [`'Chakra Petch', 'Segoe UI', system-ui, sans-serif`, plex];
    }
  }

  private rgba(hex: string, alpha: number): string {
    const n = hex.replace('#', '');
    const r = parseInt(n.substring(0, 2), 16);
    const g = parseInt(n.substring(2, 4), 16);
    const b = parseInt(n.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /** Ultima configurazione ricordata, con ritorno al default. */
  private leggiCache(): TemaConfig {
    if (typeof localStorage === 'undefined') return { ...CONFIG_DEFAULT };
    try {
      const raw = localStorage.getItem(THEME_KEY);
      return raw ? { ...CONFIG_DEFAULT, ...(JSON.parse(raw) as Partial<TemaConfig>) } : { ...CONFIG_DEFAULT };
    } catch {
      return { ...CONFIG_DEFAULT };
    }
  }
}
