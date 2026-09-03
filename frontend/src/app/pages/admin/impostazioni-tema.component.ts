// =============================================================================
//  frontend/src/app/pages/admin/impostazioni-tema.component.ts
//  BACKOFFICE — IMPOSTAZIONI » TEMA (solo SuperUser). "THEME BUILDER".
//
//  Due modalità, un'unica architettura "Veil" (il contenuto NON cambia mai):
//   1) TEMI BASE  → scegli uno dei 3 veli approvati (data-theme 1/2/3).
//   2) PERSONALIZZATO → costruisci un velo su misura scegliendo, per ogni RUOLO
//      cromatico (primario/accento/sfondo/testo), UNO dei 4 colori della
//      PALETTE FERREA FIDC + stile raggi + abbinamento tipografico.
//
//  PERCHÉ SOLO 4 SWATCH E NON UN COLOR PICKER LIBERO:
//  `CLAUDE_PROJECT_STANDARDS.md` impone la palette FERREA a 4 colori con
//  PRECEDENZA ASSOLUTA. Un color picker libero violerebbe il brand. Qui il
//  SuperUser ha piena libertà compositiva, ma SEMPRE dentro i 4 colori
//  istituzionali (vincolo garantito anche lato server dal TemaController).
//
//  Anteprima in tempo reale via ThemeService.anteprima(); il salvataggio
//  persiste su DB (PUT /api/tema) e applica il velo a tutto il sito.
// =============================================================================

import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ThemeService } from '../../shared/theme/theme.service';
import { FidcApiService, TemaConfig } from '../../services/fidc-api.service';

/** Voce di uno swatch selezionabile (uno dei 4 colori palette). */
interface Swatch { hex: string; nome: string; }

/** Ruolo cromatico configurabile nel builder. */
type RuoloColore = 'colorePrimario' | 'coloreAccento' | 'coloreSfondo' | 'coloreTesto';

@Component({
  selector: 'fidc-impostazioni-tema',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
  <div class="wrap">
    <header class="head">
      <h1>Impostazioni · Theme Builder</h1>
      <p>Governa il "velo" grafico dell'intero sito pubblico. Il contenuto resta
         identico: cambia solo l'aspetto. Ogni modifica è mostrata in anteprima
         in tempo reale e diventa effettiva solo al salvataggio.</p>
    </header>

    <!-- ============ 1) TEMI BASE ============ -->
    <section class="block">
      <h2>1 · Temi base</h2>
      <p class="hint">Veli approvati, pronti all'uso.</p>
      <div class="themes">
        <button *ngFor="let t of theme.temi" type="button"
                class="theme-card" [class.active]="!bozza().personalizzato && bozza().temaBase === t.id"
                [attr.data-preview]="t.id" (click)="scegliBase(t.id)">
          <span class="preview" [attr.data-preview]="t.id" aria-hidden="true">
            <span class="p-bar"></span>
            <span class="p-hero"><i></i><i></i></span>
            <span class="p-row"><b></b><b></b><b></b></span>
          </span>
          <span class="info">
            <strong>Tema {{ t.id }} — {{ t.nome }}</strong>
            <small>{{ t.claim }}</small>
          </span>
          <span class="chosen" *ngIf="!bozza().personalizzato && bozza().temaBase === t.id">Attivo ✓</span>
        </button>
      </div>
    </section>

    <!-- ============ 2) VELO PERSONALIZZATO ============ -->
    <section class="block">
      <div class="block-head">
        <div>
          <h2>2 · Velo personalizzato</h2>
          <p class="hint">Componi un velo su misura entro la palette FERREA (4 colori).</p>
        </div>
        <label class="switch">
          <input type="checkbox" [checked]="bozza().personalizzato" (change)="togglePersonalizzato($event)" />
          <span>Attiva personalizzazione</span>
        </label>
      </div>

      <div class="builder" [class.disabled]="!bozza().personalizzato">
        <!-- Ruoli cromatici -->
        <div class="ruoli">
          <div class="ruolo" *ngFor="let r of ruoli">
            <span class="ruolo-lbl">{{ r.label }}<small>{{ r.desc }}</small></span>
            <div class="swatches">
              <button *ngFor="let s of palette" type="button" class="sw"
                      [style.background]="s.hex"
                      [class.on]="bozza()[r.key] === s.hex"
                      [title]="s.nome + ' · ' + s.hex"
                      [attr.aria-label]="s.nome"
                      [attr.aria-pressed]="bozza()[r.key] === s.hex"
                      [disabled]="!bozza().personalizzato"
                      (click)="setColore(r.key, s.hex)"></button>
            </div>
          </div>
        </div>

        <!-- Stile raggi -->
        <div class="opt">
          <span class="ruolo-lbl">Stile angoli</span>
          <div class="chips">
            <button *ngFor="let o of raggi" type="button" class="chip"
                    [class.on]="bozza().stileRaggio === o.val" [disabled]="!bozza().personalizzato"
                    (click)="setRaggio(o.val)">{{ o.label }}</button>
          </div>
        </div>

        <!-- Abbinamento font -->
        <div class="opt">
          <span class="ruolo-lbl">Tipografia</span>
          <div class="chips">
            <button *ngFor="let o of fonts" type="button" class="chip"
                    [class.on]="bozza().abbinamentoFont === o.val" [disabled]="!bozza().personalizzato"
                    (click)="setFont(o.val)">{{ o.label }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ ANTEPRIMA LIVE MOCK ============ -->
    <section class="block">
      <h2>Anteprima</h2>
      <div class="mock" [style.background]="bozza().coloreSfondo"
           [style.border-radius]="mockRadius()" [style.font-family]="mockFont()">
        <div class="mock-hero" [style.background]="bozza().colorePrimario"
             [style.color]="onPrimario()" [style.border-radius]="mockRadius()">
          <b>Federazione Innovazione, Digitale e Cybersicurezza</b>
          <span class="mock-cta" [style.background]="bozza().coloreAccento"
                [style.color]="onAccento()" [style.border-radius]="mockRadius()">Unisciti</span>
        </div>
        <p class="mock-txt" [style.color]="bozza().coloreTesto">
          Testo istituzionale d'esempio con il colore selezionato.
        </p>
      </div>
    </section>

    <!-- ============ AZIONI ============ -->
    <div class="actions">
      <button type="button" class="btn-primary" [disabled]="salvataggio()" (click)="salva()">
        {{ salvataggio() ? 'Salvataggio…' : 'Salva e applica' }}
      </button>
      <button type="button" class="btn-ghost" [disabled]="salvataggio()" (click)="annulla()">Annulla</button>
      <span class="msg ok" *ngIf="messaggio() === 'ok'">Tema salvato e applicato ✓</span>
      <span class="msg err" *ngIf="messaggio() === 'err'">Errore nel salvataggio. Riprova.</span>
    </div>
  </div>
  `,
  styles: [`
    /* NOTA: in questa schermata i quattro colori istituzionali compaiono anche
       come valori fissi. È l'unica eccezione ammessa e ha una ragione: gli
       swatch e le anteprime devono mostrare il colore in quanto tale, non il
       colore del tema attivo, altrimenti scegliendo un velo cambierebbero
       anche i campioni con cui lo si sta scegliendo. Tutto il resto della
       pagina usa i token, come ovunque. */
    .wrap { max-width: 1000px; }
    .head h1 { margin:0 0 6px; font-size:1.8rem; color: var(--text); font-family: var(--font-display); }
    .head p { margin:0 0 26px; color: var(--text-soft); max-width:720px; line-height:1.55; }

    .block { margin: 0 0 34px; }
    .block h2 { margin:0 0 4px; font-size:1.15rem; color: var(--text); }
    .hint { margin:0 0 16px; color: var(--text-muted); font-size:.92rem; }
    .block-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }

    .switch { display:inline-flex; align-items:center; gap:10px; cursor:pointer;
      font-weight:700; color: var(--text); }
    .switch input { width:18px; height:18px; accent-color: var(--accent); cursor:pointer; }

    /* ---- Veli predefiniti (miniature con i colori reali) ---- */
    .themes { display:grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap:18px; }
    .theme-card { text-align:left; cursor:pointer; background: var(--surface); border:1px solid var(--surface-border);
      border-radius: var(--radius); padding:14px; display:flex; flex-direction:column; gap:10px;
      backdrop-filter: blur(var(--surface-blur)); transition: transform .28s, border-color .2s, box-shadow .28s; }
    .theme-card:hover { transform: translateY(-3px); box-shadow: var(--glow-neon); border-color: var(--line-strong); }
    .theme-card.active { border-color: var(--accent); box-shadow: var(--glow-accent); }
    .theme-card:focus-visible { outline:none; box-shadow: var(--glow-focus); }
    .preview { display:block; overflow:hidden; border:1px solid rgba(51,61,109,.12); }
    .p-bar { display:block; height:12px; }
    .p-hero { display:flex; gap:6px; padding:12px; height:66px; align-items:center; }
    .p-hero i { display:block; height:10px; border-radius:6px; }
    .p-hero i:first-child { flex:1; }
    .p-hero i:last-child { width:32px; height:32px; border-radius:50%; }
    .p-row { display:flex; gap:6px; padding:0 12px 12px; }
    .p-row b { flex:1; height:22px; border-radius:6px; }
    [data-preview='1'].preview { background:#FFF0D9; }
    [data-preview='1'] .p-bar { background:#FFF0D9; }
    [data-preview='1'] .p-hero { background:#333D6D; }
    [data-preview='1'] .p-hero i:first-child { background:#FFCF95; }
    [data-preview='1'] .p-hero i:last-child { background:#723EC3; }
    [data-preview='1'] .p-row b { background:#FFF0D9; border:1px solid rgba(51,61,109,.15); }
    [data-preview='2'].preview { background:#333D6D; }
    [data-preview='2'] .p-bar { background:#2b3460; }
    [data-preview='2'] .p-hero { background:#333D6D; }
    [data-preview='2'] .p-hero i:first-child { background:#FFCF95; }
    [data-preview='2'] .p-hero i:last-child { background:#723EC3; }
    [data-preview='2'] .p-row b { background:rgba(255,240,217,.1); }
    [data-preview='3'].preview { background:#FFF0D9; }
    [data-preview='3'] .p-bar { background:#FFF0D9; }
    [data-preview='3'] .p-hero { background:linear-gradient(135deg,#723EC3,#FFCF95); }
    [data-preview='3'] .p-hero i:first-child { background:#FFF0D9; }
    [data-preview='3'] .p-hero i:last-child { background:#FFF0D9; }
    [data-preview='3'] .p-row b { background:#FFF0D9; }
    .info { display:flex; flex-direction:column; gap:2px; }
    .info strong { color: var(--text); }
    .info small { color: var(--text-muted); }
    .chosen { align-self:flex-start; font-size:.72rem; font-weight:800; color: var(--on-accent);
      background: var(--accent); padding:4px 12px;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px); }

    /* ---- Composizione del velo su misura ---- */
    .builder { margin-top:14px; transition: opacity .2s; }
    .builder.disabled { opacity:.42; pointer-events:none; }
    .ruoli { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:18px; margin-bottom:22px; }
    .ruolo, .opt { display:flex; flex-direction:column; gap:8px; }
    .ruolo-lbl { font-weight:800; color: var(--text); display:flex; flex-direction:column; }
    .ruolo-lbl small { font-weight:500; color: var(--text-muted); font-size:.8rem; }
    .swatches { display:flex; gap:8px; }
    /* I campioni mostrano il colore vero: bordo e anello di selezione devono
       restare visibili sia sui due colori chiari sia sui due scuri. */
    .sw { width:40px; height:40px; cursor:pointer; border:2px solid var(--surface-border);
      clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
      transition: transform .15s, box-shadow .15s; }
    .sw:hover { transform: translateY(-2px); }
    .sw.on { border-color: var(--text); box-shadow: var(--glow-accent); }
    .sw:focus-visible { outline:none; box-shadow: var(--glow-focus); }

    .opt { margin-bottom:18px; }
    .chips { display:flex; gap:10px; flex-wrap:wrap; }
    .chip { padding:9px 18px; cursor:pointer; font-weight:700; font-family: inherit;
      clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
      background: var(--surface-strong); color: var(--text); border:1px solid var(--surface-border);
      transition: background .15s, color .15s, border-color .15s; }
    .chip:hover { border-color: var(--line-strong); }
    .chip.on { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
    .chip:focus-visible { outline:none; box-shadow: var(--glow-focus); }

    /* ---- Anteprima in miniatura ---- */
    .mock { padding:16px; border:1px solid var(--surface-border); }
    .mock-hero { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:20px; }
    .mock-hero b { font-size:1.05rem; }
    .mock-cta { padding:8px 18px; font-weight:800; white-space:nowrap; }
    .mock-txt { margin:14px 4px 4px; line-height:1.5; }

    /* ---- Azioni ---- */
    .actions { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:8px; }
    .msg { font-weight:700; font-size:.9rem; }
    .msg.ok { color: var(--accent); }
    .msg.err { color: var(--accent-2); }

    @media (max-width: 720px) {
      .themes { grid-template-columns: 1fr; }
      .head h1 { font-size:1.45rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      .theme-card, .sw, .chip, .builder { transition:none; }
      .theme-card:hover, .sw:hover { transform:none; }
    }
  `]
})
export class ImpostazioniTemaComponent {
  readonly theme = inject(ThemeService);
  private readonly api = inject(FidcApiService);

  /** I 4 colori della palette FERREA (uniche opzioni ammesse). */
  readonly palette: Swatch[] = [
    { hex: '#333D6D', nome: 'Blu profondo' },
    { hex: '#723EC3', nome: 'Viola' },
    { hex: '#FFCF95', nome: 'Pesca' },
    { hex: '#FFF0D9', nome: 'Crema' }
  ];

  /** Ruoli cromatici configurabili nel builder. */
  readonly ruoli: { key: RuoloColore; label: string; desc: string }[] = [
    { key: 'colorePrimario', label: 'Primario', desc: 'CTA e hero' },
    { key: 'coloreAccento', label: 'Accento', desc: 'dettagli e badge' },
    { key: 'coloreSfondo', label: 'Sfondo', desc: 'pagina' },
    { key: 'coloreTesto', label: 'Testo', desc: 'testo principale' }
  ];

  readonly raggi: { val: TemaConfig['stileRaggio']; label: string }[] = [
    { val: 'sharp', label: 'Netto' },
    { val: 'soft', label: 'Morbido' },
    { val: 'rounded', label: 'Arrotondato' }
  ];

  readonly fonts: { val: TemaConfig['abbinamentoFont']; label: string }[] = [
    { val: 'cyber', label: 'Cyber' },
    { val: 'moderno', label: 'Moderno' },
    { val: 'classico', label: 'Classico' }
  ];

  /** Bozza in lavorazione (inizializzata dal velo attualmente attivo). */
  readonly bozza = signal<TemaConfig>({ ...this.theme.config() });

  readonly salvataggio = signal(false);
  readonly messaggio = signal<'ok' | 'err' | null>(null);

  // --- anteprime derivate (mock) -------------------------------------------
  readonly mockRadius = computed(() => {
    switch (this.bozza().stileRaggio) {
      case 'sharp': return '4px';
      case 'rounded': return '24px';
      default: return '14px';
    }
  });
  readonly mockFont = computed(() => {
    switch (this.bozza().abbinamentoFont) {
      case 'moderno': return `'Segoe UI', system-ui, sans-serif`;
      case 'classico': return `Georgia, 'Times New Roman', serif`;
      default: return `'Chakra Petch', 'Segoe UI', system-ui, sans-serif`;
    }
  });
  readonly onPrimario = computed(() => this.contrasto(this.bozza().colorePrimario));
  readonly onAccento = computed(() => this.contrasto(this.bozza().coloreAccento));

  // --- azioni sui temi base ------------------------------------------------

  /** Seleziona un velo base (disattiva la personalizzazione) e lo mostra. */
  scegliBase(id: '1' | '2' | '3'): void {
    this.aggiorna({ temaBase: id, personalizzato: false });
  }

  // --- azioni sul velo personalizzato --------------------------------------

  togglePersonalizzato(ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked;
    this.aggiorna({ personalizzato: on });
  }

  setColore(ruolo: RuoloColore, hex: string): void {
    this.aggiorna({ [ruolo]: hex } as Partial<TemaConfig>);
  }

  setRaggio(v: TemaConfig['stileRaggio']): void { this.aggiorna({ stileRaggio: v }); }
  setFont(v: TemaConfig['abbinamentoFont']): void { this.aggiorna({ abbinamentoFont: v }); }

  // --- salva / annulla ------------------------------------------------------

  /** Persiste il velo su DB (PUT) e lo applica a tutto il sito. */
  salva(): void {
    this.salvataggio.set(true);
    this.messaggio.set(null);
    const cfg = this.bozza();
    this.api.salvaTema(cfg).subscribe({
      next: (salvato) => {
        this.theme.applica(salvato);            // applica il velo confermato dal server
        this.bozza.set({ ...salvato });
        this.salvataggio.set(false);
        this.messaggio.set('ok');
      },
      error: () => {
        this.salvataggio.set(false);
        this.messaggio.set('err');
      }
    });
  }

  /** Annulla le modifiche e ripristina il velo attivo dal server. */
  annulla(): void {
    this.messaggio.set(null);
    this.theme.carica();
    this.bozza.set({ ...this.theme.config() });
    this.theme.applica(this.theme.config(), false);
  }

  // --- helpers --------------------------------------------------------------

  /** Aggiorna la bozza e mostra l'anteprima in tempo reale (senza salvare). */
  private aggiorna(patch: Partial<TemaConfig>): void {
    const next = { ...this.bozza(), ...patch };
    this.bozza.set(next);
    this.messaggio.set(null);
    this.theme.anteprima(next);
  }

  /** Testo leggibile sopra un colore palette (scuro→cream, chiaro→deep-blue). */
  private contrasto(hex: string): string {
    const h = hex.toUpperCase();
    return h === '#333D6D' || h === '#723EC3' ? '#FFF0D9' : '#333D6D';
  }
}
