// =============================================================================
//  frontend/src/app/pages/admin/impostazioni-tema.component.ts
//  BACKOFFICE — ASPETTO DEL SITO ("Theme & Layout Builder"). Solo Direzione.
//
//  Il contenuto del sito non cambia mai: qui si sceglie il "velo".
//   1) Velo di base: uno dei tre predefiniti, diversi per struttura.
//   2) Emblema dell'hero: cassaforte, scudo o nucleo.
//   3) Velo personalizzato: per ogni ruolo cromatico uno dei 4 colori
//      istituzionali, angoli, tipografia. Le combinazioni illeggibili vengono
//      segnalate e il salvataggio è bloccato finché non si correggono.
//
//  Ogni scelta si vede subito su tutta l'interfaccia (ThemeService.anteprima);
//  diventa definitiva per tutti i visitatori solo con "Salva e applica"
//  (PUT /api/tema). Uscendo senza salvare si torna al velo salvato.
//
//  ECCEZIONE ALLA REGOLA DEI TOKEN: gli swatch e le miniature dei veli usano i
//  colori della palette (--c-*) in quanto tali. Devono mostrare il colore vero,
//  non quello del velo in anteprima, altrimenti cambierebbero mentre li si sceglie.
// =============================================================================

import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ThemeService, PALETTE } from '../../shared/theme/theme.service';
import { FidcApiService, TemaConfig } from '../../services/fidc-api.service';
import { EmblemaComponent, EmblemaHero } from '../../shared/emblema/emblema.component';

interface Swatch { hex: string; nome: string; }
type RuoloColore = 'coloreSfondo' | 'coloreTesto' | 'colorePrimario' | 'coloreAccento';

@Component({
  selector: 'fidc-impostazioni-tema',
  standalone: true,
  imports: [EmblemaComponent],
  styleUrl: './impostazioni-tema.component.scss',
  template: `
  <div class="wrap">
    <header class="head">
      <div>
        <h1>Aspetto del sito</h1>
        <p>Scegli il velo grafico del portale pubblico. I testi e i dati restano gli stessi:
           cambiano struttura, colori e movimento. Vedi ogni modifica subito, qui e in tutta
           l'interfaccia; i visitatori la vedranno quando salvi.</p>
      </div>
      <div class="barra-salva" [class.sporca]="modificato()">
        @if (modificato()) { <span class="nota">Modifiche non salvate</span> }
        <button type="button" class="btn-ghost btn-sm" [disabled]="salvataggio() || !modificato()" (click)="annulla()">Annulla</button>
        <button type="button" class="btn-primary btn-sm" [disabled]="salvataggio() || !contrasto().ok || !modificato()" (click)="salva()">
          @if (salvataggio()) { <span class="spinner" aria-hidden="true"></span> Salvataggio }
          @else { Salva e applica }
        </button>
      </div>
    </header>

    @if (esito(); as e) {
      <p class="esito" [class.ok]="e === 'ok'" role="status">
        {{ e === 'ok' ? 'Velo salvato: ora lo vedono tutti i visitatori.' : 'Salvataggio non riuscito. Il velo resta in anteprima solo per te: riprova.' }}
      </p>
    }

    <!-- ===================== 1. VELO DI BASE ===================== -->
    <section class="blocco" aria-labelledby="t-veli">
      <h2 id="t-veli">Velo di base</h2>
      <div class="veli" role="radiogroup" aria-labelledby="t-veli">
        @for (t of theme.temi; track t.id) {
          <button type="button" class="velo" role="radio"
                  [attr.aria-checked]="!bozza().personalizzato && bozza().temaBase === t.id"
                  [class.scelto]="!bozza().personalizzato && bozza().temaBase === t.id"
                  (click)="scegliBase(t.id)">
            <span class="mini" [attr.data-velo]="t.id" aria-hidden="true">
              <i class="m-testata"></i><i class="m-hero"><b></b><u></u></i>
              <i class="m-a"></i><i class="m-b"></i><i class="m-c"></i>
            </span>
            <strong>{{ t.nome }}</strong>
            <small>{{ t.descrizione }}</small>
          </button>
        }
      </div>
    </section>

    <!-- ===================== 2. EMBLEMA ===================== -->
    <section class="blocco" aria-labelledby="t-emblema">
      <h2 id="t-emblema">Emblema dell'hero</h2>
      <p class="hint">La figura animata accanto allo slogan, in apertura della home.</p>
      <div class="emblemi" role="radiogroup" aria-labelledby="t-emblema">
        @for (e of emblemi; track e.val) {
          <button type="button" class="emblema" role="radio" [attr.aria-checked]="emblema() === e.val"
                  [class.scelto]="emblema() === e.val" (click)="setEmblema(e.val)">
            <span class="emblema-vista"><fidc-emblema [forza]="e.val"></fidc-emblema></span>
            <strong>{{ e.label }}</strong>
            <small>{{ e.desc }}</small>
          </button>
        }
      </div>
    </section>

    <!-- ===================== 3. VELO PERSONALIZZATO ===================== -->
    <section class="blocco" aria-labelledby="t-pers">
      <div class="blocco-testa">
        <div>
          <h2 id="t-pers">Velo personalizzato</h2>
          <p class="hint">Componi un velo tuo, sempre dentro i quattro colori istituzionali.</p>
        </div>
        <label class="interruttore">
          <input type="checkbox" role="switch" [checked]="bozza().personalizzato" (change)="togglePersonalizzato($event)" />
          <span class="pista" aria-hidden="true"></span>
          <span>Usa un velo personalizzato</span>
        </label>
      </div>

      <div class="builder" [class.spento]="!bozza().personalizzato">
        <div class="controlli">
          @for (r of ruoli; track r.key) {
            <fieldset class="ruolo" [disabled]="!bozza().personalizzato">
              <legend>{{ r.label }} <small>{{ r.desc }}</small></legend>
              <div class="swatches">
                @for (s of palette; track s.hex) {
                  <button type="button" class="sw" [style.background]="s.hex"
                          [class.on]="bozza()[r.key] === s.hex"
                          [attr.aria-pressed]="bozza()[r.key] === s.hex"
                          [attr.aria-label]="r.label + ': ' + s.nome"
                          [title]="s.nome"
                          (click)="setColore(r.key, s.hex)"></button>
                }
              </div>
            </fieldset>
          }

          <fieldset class="ruolo" [disabled]="!bozza().personalizzato">
            <legend>Angoli</legend>
            <div class="chips">
              @for (o of raggi; track o.val) {
                <button type="button" class="chip" [class.on]="bozza().stileRaggio === o.val"
                        [attr.aria-pressed]="bozza().stileRaggio === o.val" (click)="aggiorna({ stileRaggio: o.val })">
                  <i class="forma" [attr.data-forma]="o.val" aria-hidden="true"></i>{{ o.label }}
                </button>
              }
            </div>
          </fieldset>

          <fieldset class="ruolo" [disabled]="!bozza().personalizzato">
            <legend>Tipografia</legend>
            <div class="chips">
              @for (o of fonts; track o.val) {
                <button type="button" class="chip font" [class.on]="bozza().abbinamentoFont === o.val"
                        [attr.aria-pressed]="bozza().abbinamentoFont === o.val" (click)="aggiorna({ abbinamentoFont: o.val })">
                  <span [style.font-family]="o.famiglia">Aa</span>{{ o.label }}
                </button>
              }
            </div>
          </fieldset>

          @if (bozza().personalizzato && !contrasto().ok) {
            <div class="contrasto" role="alert">
              <strong>Questa combinazione non si legge bene</strong>
              <ul>@for (p of contrasto().problemi; track p) { <li>{{ p }}</li> }</ul>
              <p>Il salvataggio è bloccato finché non scegli colori con più contrasto.</p>
            </div>
          }
        </div>

        <!-- Anteprima con i colori della bozza -->
        <div class="anteprima" aria-label="Anteprima del velo personalizzato"
             [style.background]="bozza().coloreSfondo" [style.color]="bozza().coloreTesto"
             [style.border-radius]="raggioPx()">
          <div class="ant-hero">
            <div>
              <b [style.font-family]="famigliaTitoli()">Innovazione digitale.</b>
              <b [style.font-family]="famigliaTitoli()" [style.color]="bozza().colorePrimario">Sicurezza senza compromessi.</b>
              <span class="ant-cta" [style.background]="bozza().colorePrimario" [style.color]="su(bozza().colorePrimario)"
                    [style.border-radius]="raggioPx()"
                    [style.box-shadow]="theme.rapporto(bozza().colorePrimario, bozza().coloreSfondo) < 3 ? '0 0 0 1.5px ' + bozza().coloreTesto : 'none'">
                Unisciti alla Federazione
              </span>
            </div>
            <span class="ant-emblema"><fidc-emblema [forza]="emblema()"></fidc-emblema></span>
          </div>
          <div class="ant-card" [style.border-radius]="raggioPx()" [style.border-color]="bozza().coloreAccento">
            <span class="ant-badge" [style.color]="bozza().coloreAccento === bozza().coloreSfondo ? bozza().coloreTesto : bozza().coloreAccento">Ricerca</span>
            <p>Osservatorio Cybersicurezza 2026: il testo di esempio usa il colore scelto per il testo.</p>
          </div>
          <span class="ant-rapporto">Contrasto testo/sfondo {{ theme.rapporto(bozza().coloreTesto, bozza().coloreSfondo).toFixed(1) }}:1</span>
        </div>
      </div>
    </section>
  </div>
  `
})
export class ImpostazioniTemaComponent implements OnDestroy {
  readonly theme = inject(ThemeService);
  private readonly api = inject(FidcApiService);

  readonly palette: Swatch[] = [
    { hex: PALETTE.deepBlue, nome: 'Blu profondo' },
    { hex: PALETTE.purple, nome: 'Viola' },
    { hex: PALETTE.peach, nome: 'Pesca' },
    { hex: PALETTE.cream, nome: 'Crema' }
  ];

  readonly ruoli: { key: RuoloColore; label: string; desc: string }[] = [
    { key: 'coloreSfondo', label: 'Sfondo', desc: 'il fondo delle pagine' },
    { key: 'coloreTesto', label: 'Testo', desc: 'titoli e paragrafi' },
    { key: 'colorePrimario', label: 'Azione', desc: 'bottoni e collegamenti' },
    { key: 'coloreAccento', label: 'Supporto', desc: 'etichette e dettagli' }
  ];

  readonly raggi: { val: TemaConfig['stileRaggio']; label: string }[] = [
    { val: 'sharp', label: 'Tagliati' },
    { val: 'soft', label: 'Morbidi' },
    { val: 'rounded', label: 'Arrotondati' }
  ];

  readonly fonts: { val: TemaConfig['abbinamentoFont']; label: string; famiglia: string }[] = [
    { val: 'cyber', label: 'Tecnico', famiglia: `'Chakra Petch', sans-serif` },
    { val: 'moderno', label: 'Contemporaneo', famiglia: `'Sora Variable', sans-serif` },
    { val: 'classico', label: 'Editoriale', famiglia: `'Source Serif 4 Variable', serif` }
  ];

  readonly emblemi: { val: EmblemaHero; label: string; desc: string }[] = [
    { val: 'cassaforte', label: 'Cassaforte digitale', desc: 'Custodia e accesso controllato.' },
    { val: 'scudo', label: 'Scudo', desc: 'Protezione e verifica.' },
    { val: 'nucleo', label: 'Nucleo di sicurezza', desc: 'Difesa a più livelli.' }
  ];

  /** Configurazione salvata: riferimento per "Annulla" e per l'uscita dalla pagina. */
  private readonly salvata = signal<TemaConfig>({ ...this.theme.config() });

  /** Bozza in modifica, già applicata in anteprima. */
  readonly bozza = signal<TemaConfig>({ ...this.theme.config() });

  readonly salvataggio = signal(false);
  readonly esito = signal<'ok' | 'err' | null>(null);

  readonly emblema = computed<EmblemaHero>(() => this.bozza().emblemaHero ?? 'cassaforte');
  readonly modificato = computed(() => JSON.stringify(this.bozza()) !== JSON.stringify(this.salvata()));
  readonly contrasto = computed(() =>
    this.bozza().personalizzato ? this.theme.verificaContrasto(this.bozza()) : { ok: true, problemi: [] as string[] });

  readonly raggioPx = computed(() => ({ sharp: '2px', soft: '8px', rounded: '18px' }[this.bozza().stileRaggio]));
  readonly famigliaTitoli = computed(() => this.fonts.find((f) => f.val === this.bozza().abbinamentoFont)?.famiglia ?? '');

  ngOnDestroy(): void {
    // Uscendo senza salvare, l'anteprima non deve restare applicata.
    if (this.modificato()) this.theme.applica(this.salvata(), false);
  }

  su(hex: string): string { return this.theme.contrasto(hex); }

  scegliBase(id: '1' | '2' | '3'): void { this.aggiorna({ temaBase: id, personalizzato: false }); }

  setEmblema(e: EmblemaHero): void { this.aggiorna({ emblemaHero: e }); }

  togglePersonalizzato(ev: Event): void {
    this.aggiorna({ personalizzato: (ev.target as HTMLInputElement).checked });
  }

  setColore(ruolo: RuoloColore, hex: string): void {
    this.aggiorna({ [ruolo]: hex } as Partial<TemaConfig>);
  }

  /** Aggiorna la bozza e la mostra subito su tutta l'interfaccia. */
  aggiorna(patch: Partial<TemaConfig>): void {
    const next = { ...this.bozza(), ...patch };
    this.bozza.set(next);
    this.esito.set(null);
    this.theme.anteprima(next);
  }

  salva(): void {
    if (!this.contrasto().ok) return;
    const cfg = this.bozza();
    this.salvataggio.set(true);
    this.api.salvaTema(cfg).subscribe({
      next: (res) => {
        // Il server restituisce la configurazione salvata; se il backend in uso
        // non conoscesse ancora l'emblema, teniamo quello della bozza.
        const salvata: TemaConfig = { ...cfg, ...res, emblemaHero: res.emblemaHero ?? cfg.emblemaHero };
        this.theme.applica(salvata, true);
        this.salvata.set(salvata);
        this.bozza.set(salvata);
        this.salvataggio.set(false);
        this.esito.set('ok');
      },
      error: () => {
        this.salvataggio.set(false);
        this.esito.set('err');
      }
    });
  }

  annulla(): void {
    const s = this.salvata();
    this.bozza.set({ ...s });
    this.theme.applica(s, false);
    this.esito.set(null);
  }
}
