// =============================================================================
//  frontend/src/app/shared/theme/theme.service.ts
//  THEME SERVICE — regia unica del "VEIL" (velo/skin) applicato sopra il
//  contenuto. NON tocca il contenuto: agisce solo su [data-theme] e, per i temi
//  PERSONALIZZATI, inietta le CSS variable semantiche su :root.
//
//  Fonte di verità: il backend (GET /api/tema/attivo, tabella ImpostazioniTema).
//  Per evitare il "flash" (FOUC) all'avvio applichiamo subito una cache locale,
//  poi allineiamo con la configurazione autorevole del server.
//
//  VINCOLO PALETTE FERREA: i colori arrivano già ristretti ai 4 istituzionali
//  (validati dal Theme Builder e ri-validati lato server). Qui li usiamo così
//  come sono, derivando solo contrasti/opacità (sempre entro la palette).
// =============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { FidcApiService, TemaConfig } from '../../services/fidc-api.service';

/** Identificativi dei temi base (= veli). */
export type ThemeId = '1' | '2' | '3';

/** Descrittore mostrato nei selettori del backoffice. */
export interface ThemeMeta {
  id: ThemeId;
  nome: string;
  claim: string;
}

/** Chiave di persistenza della configurazione tema (cache anti-FOUC). */
const THEME_KEY = 'fidc.theme.config';

/** I 4 colori della palette FERREA (unica fonte ammessa). */
const PALETTE = {
  deepBlue: '#333D6D',
  purple: '#723EC3',
  peach: '#FFCF95',
  cream: '#FFF0D9'
} as const;

/** Configurazione di default coerente col Tema 1 istituzionale approvato. */
const CONFIG_DEFAULT: TemaConfig = {
  temaBase: '1',
  personalizzato: false,
  colorePrimario: PALETTE.purple,
  coloreAccento: PALETTE.peach,
  coloreSfondo: PALETTE.cream,
  coloreTesto: PALETTE.deepBlue,
  stileRaggio: 'soft',
  abbinamentoFont: 'cyber'
};

/** CSS variable pilotate dal velo (le stesse dichiarate in _themes.scss). */
const VAR_SEMANTICHE = [
  '--bg', '--bg-elev', '--text', '--text-soft',
  '--accent', '--accent-2', '--on-accent',
  '--hero-bg', '--hero-text', '--line',
  '--radius', '--font-display', '--font-body'
];

/**
 * Servizio di theming applicativo (singleton root). Governa il velo attivo per
 * tutta l'app: il contenuto resta identico, cambia solo la skin.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly api = inject(FidcApiService);

  /** Catalogo dei temi base (Theme 1 = estetica istituzionale approvata). */
  readonly temi: ThemeMeta[] = [
    { id: '1', nome: 'Institutional Cyber', claim: 'Autorevole · fiducia & sicurezza (approvato)' },
    { id: '2', nome: 'Tech Command Center', claim: 'Scuro · alta energia, motion-centric' },
    { id: '3', nome: 'Community Hub', claim: 'Caldo · accogliente, membership-first' }
  ];

  /** Configurazione del velo attualmente applicata (signal reattivo). */
  readonly config = signal<TemaConfig>(this.leggiCache());

  constructor() {
    // 1) Applica subito la cache locale per evitare il flash all'avvio.
    this.applica(this.config(), /* persist */ false);
    // 2) Allinea con la configurazione autorevole del server.
    this.carica();
  }

  /** Scarica dal backend il velo attivo e lo applica (fonte di verità). */
  carica(): void {
    this.api.getTemaAttivo().subscribe({
      next: (cfg) => this.applica(cfg, /* persist */ true),
      // In caso di API irraggiungibile teniamo la cache/last-known-good.
      error: () => { /* silenzioso: resta il velo già applicato */ }
    });
  }

  /**
   * Applica un velo: aggiorna il signal, imposta [data-theme] e — se il velo è
   * personalizzato — inietta le CSS variable su :root. Opzionalmente lo mette
   * in cache locale (per l'anti-FOUC al prossimo avvio).
   */
  applica(cfg: TemaConfig, persist = true): void {
    this.config.set(cfg);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, JSON.stringify(cfg)); } catch { /* storage off */ }
    }
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', cfg.temaBase);

    if (cfg.personalizzato) {
      this.iniettaOverride(cfg, root);
    } else {
      this.puliciOverride(root); // torna al velo base puro
    }
  }

  /**
   * Anteprima in tempo reale (Theme Builder): applica senza persistere né
   * salvare sul server. Serve al preview live mentre il SuperUser sceglie.
   */
  anteprima(cfg: TemaConfig): void {
    this.applica(cfg, /* persist */ false);
  }

  // --- iniezione / pulizia CSS variables -----------------------------------

  /** Inietta le CSS variable derivate dal velo personalizzato su :root. */
  private iniettaOverride(c: TemaConfig, root: HTMLElement): void {
    const set = (k: string, v: string) => root.style.setProperty(k, v);

    const scuro = this.isScuro(c.coloreSfondo);
    set('--bg', c.coloreSfondo);
    set('--bg-elev', scuro ? this.rgba(PALETTE.cream, 0.06) : '#ffffff');
    set('--text', c.coloreTesto);
    set('--text-soft', this.rgba(c.coloreTesto, 0.74));
    set('--line', this.rgba(c.coloreTesto, scuro ? 0.16 : 0.12));

    set('--accent', c.colorePrimario);
    set('--accent-2', c.coloreAccento);
    set('--on-accent', this.contrasto(c.colorePrimario));

    set('--hero-bg', c.colorePrimario);
    set('--hero-text', this.contrasto(c.colorePrimario));

    set('--radius', this.raggio(c.stileRaggio));

    const [display, body] = this.font(c.abbinamentoFont);
    set('--font-display', display);
    set('--font-body', body);
  }

  /** Rimuove gli override inline: il velo base (_themes.scss) torna sovrano. */
  private puliciOverride(root: HTMLElement): void {
    for (const v of VAR_SEMANTICHE) root.style.removeProperty(v);
  }

  // --- helpers di derivazione (sempre entro la palette) --------------------

  /** Testo leggibile sopra un colore palette (chiaro→scuro, scuro→cream). */
  private contrasto(hex: string): string {
    return this.isScuro(hex) ? PALETTE.cream : PALETTE.deepBlue;
  }

  /** true se il colore è uno dei 2 scuri della palette (deep-blue/purple). */
  private isScuro(hex: string): boolean {
    const h = hex.toUpperCase();
    return h === PALETTE.deepBlue || h === PALETTE.purple;
  }

  /** Converte "sharp|soft|rounded" nel valore di border-radius. */
  private raggio(stile: TemaConfig['stileRaggio']): string {
    switch (stile) {
      case 'sharp': return '4px';
      case 'rounded': return '24px';
      default: return '14px'; // soft
    }
  }

  /** Restituisce [font-display, font-body] per l'abbinamento scelto. */
  private font(abbinamento: TemaConfig['abbinamentoFont']): [string, string] {
    switch (abbinamento) {
      case 'moderno':
        return [`'Segoe UI', system-ui, Roboto, sans-serif`, `system-ui, 'Segoe UI', Roboto, sans-serif`];
      case 'classico':
        return [`Georgia, 'Times New Roman', serif`, `Georgia, 'Times New Roman', serif`];
      default: // cyber
        return [`'Chakra Petch', 'Segoe UI', system-ui, sans-serif`, `system-ui, 'Segoe UI', Roboto, sans-serif`];
    }
  }

  /** Converte un hex palette in rgba(...) con l'alpha indicata. */
  private rgba(hex: string, alpha: number): string {
    const n = hex.replace('#', '');
    const r = parseInt(n.substring(0, 2), 16);
    const g = parseInt(n.substring(2, 4), 16);
    const b = parseInt(n.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /** Legge la cache locale del velo (fallback al default approvato). */
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
