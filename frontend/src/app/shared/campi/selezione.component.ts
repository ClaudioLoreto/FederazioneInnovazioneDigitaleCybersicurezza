// =============================================================================
//  frontend/src/app/shared/campi/selezione.component.ts
//  Tendina di selezione dell'interfaccia FIDC.
//
//  PERCHÉ NON USARE <select>
//  L'elenco che si apre da un <select> è disegnato dal sistema operativo, non
//  dalla pagina: fondo bianco, evidenziazione blu, angoli arrotondati. Nessun
//  foglio di stile può cambiarlo. In un'interfaccia curata stona subito.
//
//  Questo componente ricostruisce la tendina con elementi normali, quindi si
//  può disegnare, MA si comporta come quella di sistema: frecce per scorrere,
//  Home e Fine per andare agli estremi, Invio per scegliere, Esc per chiudere,
//  e la ricerca digitando le prime lettere. Chi lavora da tastiera non deve
//  accorgersi della differenza.
//
//  COME SI USA (funziona con ngModel come un campo qualsiasi):
//
//    <fidc-selezione [opzioni]="pilastri" [(ngModel)]="form.pilastro"
//                    name="pilastro" etichetta="Pilastro"></fidc-selezione>
// =============================================================================

import {
  Component, ElementRef, HostListener, Input, ViewChild, forwardRef, signal
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Una voce dell'elenco. */
export interface OpzioneSelezione {
  /** Valore salvato nel modulo. */
  valore: string;
  /** Testo mostrato all'utente. */
  etichetta: string;
}

@Component({
  selector: 'fidc-selezione',
  standalone: true,
  imports: [NgFor, NgIf],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelezioneComponent),
    multi: true
  }],
  template: `
  <div class="sel" [class.aperta]="aperta()" [class.disabilitata]="disabilitato()">
    <button type="button" class="testa"
            role="combobox" aria-haspopup="listbox"
            [attr.aria-expanded]="aperta()"
            [attr.aria-label]="etichetta || null"
            [disabled]="disabilitato()"
            (click)="commuta()" (keydown)="tastiTesta($event)" #testa>
      <span class="valore" [class.vuoto]="!selezionata()">
        {{ selezionata()?.etichetta || segnaposto }}
      </span>
      <span class="freccia" aria-hidden="true"></span>
    </button>

    <ul class="lista" role="listbox" *ngIf="aperta()"
        [attr.aria-label]="etichetta || null" (keydown)="tastiLista($event)" #lista>
      <li *ngFor="let o of opzioni; let i = index"
          role="option"
          [id]="idOpzione(i)"
          [attr.aria-selected]="o.valore === valore"
          [class.evidenziata]="i === indice()"
          [class.scelta]="o.valore === valore"
          (click)="scegli(o)"
          (mouseenter)="indice.set(i)">
        <span class="segno" aria-hidden="true">{{ o.valore === valore ? '▸' : '' }}</span>
        {{ o.etichetta }}
      </li>
    </ul>
  </div>
  `,
  styles: [`
    :host { display: block; }
    .sel { position: relative; }

    .testa {
      width: 100%;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 11px 13px;
      font: inherit; font-size: .94rem; text-align: left; cursor: pointer;
      color: var(--text);
      background: var(--surface-strong);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      transition: border-color .24s, box-shadow .24s;
    }
    .testa:hover:not(:disabled) { border-color: var(--line-strong); }
    .testa:focus-visible { outline: none; box-shadow: var(--glow-focus); border-color: var(--accent); }
    .aperta .testa { border-color: var(--accent); }
    .disabilitata .testa { opacity: .55; cursor: not-allowed; }

    .valore.vuoto { color: var(--text-muted); }

    /* Freccia disegnata con i bordi: nessuna icona da caricare e segue il tema. */
    .freccia {
      flex: none; width: 8px; height: 8px;
      border-right: 2px solid var(--signal);
      border-bottom: 2px solid var(--signal);
      transform: rotate(45deg) translate(-2px, -2px);
      transition: transform .22s var(--ease-spatial);
    }
    .aperta .freccia { transform: rotate(-135deg) translate(-3px, -3px); }

    .lista {
      position: absolute; z-index: 40; left: 0; right: 0; top: calc(100% + 6px);
      margin: 0; padding: 4px; list-style: none;
      max-height: 260px; overflow-y: auto;
      /* Fondo pieno: l'elenco si sovrappone al contenuto e con il vetro
         trasparente le voci risulterebbero illeggibili. */
      background: var(--canvas-bg);
      border: 1px solid var(--accent);
      border-radius: var(--radius);
      box-shadow: var(--glow-deep);
      animation: sel-apri .16s var(--ease-spatial) both;
    }
    @keyframes sel-apri {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: none; }
    }

    .lista li {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; cursor: pointer; font-size: .92rem;
      color: var(--text-soft);
      border: 1px solid transparent;
    }
    .lista li .segno { width: 10px; color: var(--signal); }
    .lista li.scelta { color: var(--text); font-weight: 700; }
    /* Una sola voce alla volta è evidenziata, che ci si arrivi con il mouse o
       con le frecce: così non ci sono mai due "punti attivi" contemporanei. */
    .lista li.evidenziata {
      background: var(--accent); color: var(--on-accent); border-color: var(--accent);
    }
    .lista li.evidenziata .segno { color: var(--on-accent); }

    @media (prefers-reduced-motion: reduce) {
      .lista { animation: none; }
      .freccia, .testa { transition: none; }
    }
  `]
})
export class SelezioneComponent implements ControlValueAccessor {
  /** Voci disponibili. */
  @Input({ required: true }) opzioni: OpzioneSelezione[] = [];
  /** Testo mostrato quando non è stato scelto niente. */
  @Input() segnaposto = 'Seleziona…';
  /** Descrizione del campo per i lettori di schermo. */
  @Input() etichetta = '';

  @ViewChild('testa') private testa?: ElementRef<HTMLButtonElement>;
  @ViewChild('lista') private lista?: ElementRef<HTMLUListElement>;

  /** Valore attualmente selezionato. */
  valore = '';
  readonly aperta = signal(false);
  readonly disabilitato = signal(false);
  /** Voce evidenziata mentre si naviga da tastiera. */
  readonly indice = signal(0);

  /**
   * Voce corrispondente al valore corrente. È un metodo e non un computed:
   * `valore` e `opzioni` non sono signal (li scrivono Angular e il modulo), e un
   * computed resterebbe fermo al primo valore, mostrando "Seleziona…" per sempre.
   */
  selezionata(): OpzioneSelezione | undefined {
    return this.opzioni.find((o) => o.valore === this.valore);
  }

  /** Lettere digitate di recente, per la ricerca rapida. */
  private ricerca = '';
  private timerRicerca?: ReturnType<typeof setTimeout>;

  // --- collegamento con i moduli Angular -------------------------------------
  private notificaCambio: (v: string) => void = () => { /* impostato da Angular */ };
  private notificaTocco: () => void = () => { /* impostato da Angular */ };

  writeValue(v: string): void { this.valore = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.notificaCambio = fn; }
  registerOnTouched(fn: () => void): void { this.notificaTocco = fn; }
  setDisabledState(stato: boolean): void { this.disabilitato.set(stato); }

  // --- apertura e scelta ------------------------------------------------------

  /** Identificatore stabile di una voce, per gli attributi ARIA. */
  idOpzione(i: number): string { return `opt-${i}`; }

  commuta(): void {
    if (this.disabilitato()) return;
    this.aperta() ? this.chiudi() : this.apri();
  }

  private apri(): void {
    this.aperta.set(true);
    // L'elenco si apre già posizionato sulla voce corrente: chi vuole cambiare
    // di poco non deve ripartire dall'inizio.
    const corrente = this.opzioni.findIndex((o) => o.valore === this.valore);
    this.indice.set(corrente >= 0 ? corrente : 0);
    queueMicrotask(() => this.lista?.nativeElement.focus?.());
  }

  private chiudi(tornaAllaTesta = true): void {
    if (!this.aperta()) return;
    this.aperta.set(false);
    this.notificaTocco();
    if (tornaAllaTesta) this.testa?.nativeElement.focus();
  }

  scegli(o: OpzioneSelezione): void {
    this.valore = o.valore;
    this.notificaCambio(o.valore);
    this.chiudi();
  }

  // --- tastiera ---------------------------------------------------------------

  /** Tasti attivi quando il fuoco è sul campo chiuso. */
  tastiTesta(ev: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(ev.key)) {
      ev.preventDefault();
      this.apri();
    }
  }

  /** Tasti attivi quando l'elenco è aperto. */
  tastiLista(ev: KeyboardEvent): void {
    const ultimo = this.opzioni.length - 1;

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        this.indice.set(Math.min(this.indice() + 1, ultimo));
        break;
      case 'ArrowUp':
        ev.preventDefault();
        this.indice.set(Math.max(this.indice() - 1, 0));
        break;
      case 'Home':
        ev.preventDefault();
        this.indice.set(0);
        break;
      case 'End':
        ev.preventDefault();
        this.indice.set(ultimo);
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        this.scegli(this.opzioni[this.indice()]);
        break;
      case 'Escape':
        ev.preventDefault();
        this.chiudi();
        break;
      case 'Tab':
        // Tab conferma e prosegue, come farebbe la tendina di sistema.
        this.chiudi(false);
        break;
      default:
        if (ev.key.length === 1) this.cercaPerLettere(ev.key);
    }
  }

  /** Ricerca rapida: digitando "fo" si va a "Formazione". */
  private cercaPerLettere(lettera: string): void {
    clearTimeout(this.timerRicerca);
    this.ricerca += lettera.toLowerCase();
    this.timerRicerca = setTimeout(() => { this.ricerca = ''; }, 700);

    const trovato = this.opzioni.findIndex((o) =>
      o.etichetta.toLowerCase().startsWith(this.ricerca)
    );
    if (trovato >= 0) this.indice.set(trovato);
  }

  /** Un clic fuori chiude l'elenco senza cambiare la scelta. */
  @HostListener('document:pointerdown', ['$event'])
  clicFuori(ev: PointerEvent): void {
    if (!this.aperta()) return;
    const dentro = (ev.target as Node | null);
    if (dentro && !(ev.currentTarget as Document).defaultView) return;
    const host = this.testa?.nativeElement.closest('.sel');
    if (host && !host.contains(dentro)) this.chiudi(false);
  }
}
