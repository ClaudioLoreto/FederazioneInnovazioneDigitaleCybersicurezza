// =============================================================================
//  frontend/src/app/shared/campi/editor-testo.component.ts
//  Editor di testo con barra degli strumenti, per il corpo di news e documenti.
//
//  A COSA SERVE
//  Chi scrive un comunicato deve poter mettere in grassetto una data, fare un
//  elenco puntato, inserire un collegamento. Con una semplice area di testo non
//  può: dovrebbe scrivere codice HTML a mano, e non lo farà.
//
//  COME FUNZIONA
//  Il testo si scrive dentro un normale contenitore reso modificabile dal
//  browser (contenteditable). I bottoni della barra applicano la formattazione
//  alla porzione selezionata. Il risultato è HTML, salvato nel campo del
//  modulo esattamente come faceva prima l'area di testo: il backend non cambia.
//
//  PERCHÉ NON UNA LIBRERIA ESTERNA
//  Le librerie complete (CKEditor, TipTap, Quill) portano centinaia di
//  kilobyte, un aspetto grafico proprio da riadattare e, in un caso, vincoli di
//  licenza. Qui servono sette comandi: conviene averli su misura, con l'aspetto
//  del resto del sito e nessuna dipendenza da aggiornare.
//
//  SICUREZZA
//  Ciò che si incolla viene ripulito: si conservano solo i tag ammessi e si
//  scartano attributi, script e stili estranei. È importante perché il testo
//  incollato da Word o da una pagina web porta con sé molta sporcizia, e perché
//  quell'HTML finisce poi sul sito pubblico.
// =============================================================================

import {
  Component, ElementRef, Input, ViewChild, forwardRef, signal
} from '@angular/core';
import { NgFor } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Un bottone della barra degli strumenti. */
interface Comando {
  /** Comando di formattazione richiesto al browser. */
  id: string;
  /** Eventuale argomento (per esempio il livello di titolo). */
  argomento?: string;
  /** Simbolo mostrato sul bottone. */
  simbolo: string;
  /** Descrizione, usata come suggerimento e per i lettori di schermo. */
  descrizione: string;
  /** Scorciatoia da tastiera, se esiste, mostrata nel suggerimento. */
  scorciatoia?: string;
}

/** Tag che possono restare nel testo salvato. Tutto il resto viene rimosso. */
const TAG_AMMESSI = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'A',
  'UL', 'OL', 'LI', 'H2', 'H3', 'BLOCKQUOTE'
]);

@Component({
  selector: 'fidc-editor-testo',
  standalone: true,
  imports: [NgFor],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => EditorTestoComponent),
    multi: true
  }],
  template: `
  <div class="editor-testo" [class.attivo]="attivo()">

    <div class="barra" role="toolbar" [attr.aria-label]="'Formattazione: ' + etichetta">
      <button *ngFor="let c of comandi" type="button" class="strumento"
              [title]="c.descrizione + (c.scorciatoia ? ' (' + c.scorciatoia + ')' : '')"
              [attr.aria-label]="c.descrizione"
              (mousedown)="$event.preventDefault()"
              (click)="applica(c)">{{ c.simbolo }}</button>

      <span class="divisore" aria-hidden="true"></span>

      <button type="button" class="strumento" title="Inserisci un collegamento"
              aria-label="Inserisci un collegamento"
              (mousedown)="$event.preventDefault()" (click)="inserisciLink()">🔗</button>
      <button type="button" class="strumento" title="Togli la formattazione"
              aria-label="Togli la formattazione"
              (mousedown)="$event.preventDefault()" (click)="pulisci()">⌫</button>
    </div>

    <div class="area" #area
         contenteditable="true"
         role="textbox" aria-multiline="true"
         [attr.aria-label]="etichetta"
         [attr.data-segnaposto]="segnaposto"
         (input)="aggiorna()"
         (paste)="incolla($event)"
         (focus)="attivo.set(true)"
         (blur)="attivo.set(false); tocca()"></div>
  </div>
  `,
  styles: [`
    :host { display: block; }

    .editor-testo {
      border: 1px solid var(--surface-border);
      border-radius: var(--radius);
      background: var(--surface-strong);
      transition: border-color .24s, box-shadow .24s;
    }
    .editor-testo.attivo { border-color: var(--accent); box-shadow: var(--glow-focus); }

    .barra {
      display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
      padding: 6px; border-bottom: 1px solid var(--line);
    }
    .strumento {
      min-width: 34px; height: 32px; padding: 0 8px;
      display: grid; place-items: center;
      font: inherit; font-size: .92rem; font-weight: 700; line-height: 1;
      cursor: pointer;
      color: var(--text-soft);
      background: transparent;
      border: 1px solid transparent;
      transition: background .16s, color .16s, border-color .16s;
    }
    .strumento:hover { background: var(--accent-soft); color: var(--text); border-color: var(--line-strong); }
    .strumento:focus-visible { outline: none; box-shadow: var(--glow-focus); }
    .divisore { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }

    .area {
      min-height: 200px; padding: 14px;
      font-size: .95rem; line-height: 1.65; color: var(--text);
      outline: none; overflow-wrap: break-word;
    }
    /* Il segnaposto è un contenuto generato: compare solo quando l'area è
       davvero vuota, cioè quando il browser non ha ancora inserito nulla. */
    .area:empty::before {
      content: attr(data-segnaposto);
      color: var(--text-muted);
      pointer-events: none;
    }

    /* Aspetto del testo scritto: deve somigliare a come apparirà sul sito. */
    .area p { margin: 0 0 .8em; }
    .area h2 { font-size: 1.2rem; margin: .4em 0 .5em; font-family: var(--font-display); }
    .area h3 { font-size: 1.05rem; margin: .4em 0 .4em; font-family: var(--font-display); }
    .area ul, .area ol { margin: 0 0 .8em; padding-left: 1.4em; }
    .area li { margin: .2em 0; }
    .area a { color: var(--signal); text-decoration: underline; }
    .area blockquote {
      margin: 0 0 .8em; padding: .4em 0 .4em 1em;
      border-left: 3px solid var(--accent); color: var(--text-soft); font-style: italic;
    }

    @media (prefers-reduced-motion: reduce) {
      .editor-testo, .strumento { transition: none; }
    }
  `]
})
export class EditorTestoComponent implements ControlValueAccessor {
  /** Descrizione del campo, per i lettori di schermo. */
  @Input() etichetta = 'Contenuto';
  /** Testo mostrato quando l'editor è vuoto. */
  @Input() segnaposto = 'Scrivi qui il testo…';

  @ViewChild('area', { static: true }) private area!: ElementRef<HTMLElement>;

  readonly attivo = signal(false);

  /** Bottoni della barra, nell'ordine in cui compaiono. */
  readonly comandi: Comando[] = [
    { id: 'bold', simbolo: 'G', descrizione: 'Grassetto', scorciatoia: 'Ctrl+B' },
    { id: 'italic', simbolo: 'C', descrizione: 'Corsivo', scorciatoia: 'Ctrl+I' },
    { id: 'underline', simbolo: 'S', descrizione: 'Sottolineato', scorciatoia: 'Ctrl+U' },
    { id: 'formatBlock', argomento: 'h2', simbolo: 'T1', descrizione: 'Titolo di sezione' },
    { id: 'formatBlock', argomento: 'h3', simbolo: 'T2', descrizione: 'Sottotitolo' },
    { id: 'insertUnorderedList', simbolo: '•', descrizione: 'Elenco puntato' },
    { id: 'insertOrderedList', simbolo: '1.', descrizione: 'Elenco numerato' },
    { id: 'formatBlock', argomento: 'blockquote', simbolo: '❝', descrizione: 'Citazione' },
    { id: 'formatBlock', argomento: 'p', simbolo: '¶', descrizione: 'Testo normale' }
  ];

  private notificaCambio: (v: string) => void = () => { /* impostato da Angular */ };
  private notificaTocco: () => void = () => { /* impostato da Angular */ };

  // --- collegamento con i moduli Angular -------------------------------------

  writeValue(v: string): void {
    // Si scrive nell'area solo quando il valore arriva da fuori (caricamento di
    // una news esistente). Riscriverla a ogni battuta sposterebbe il cursore.
    const html = v ?? '';
    if (this.area.nativeElement.innerHTML !== html) {
      this.area.nativeElement.innerHTML = this.ripulisci(html);
    }
  }
  registerOnChange(fn: (v: string) => void): void { this.notificaCambio = fn; }
  registerOnTouched(fn: () => void): void { this.notificaTocco = fn; }
  setDisabledState(stato: boolean): void {
    this.area.nativeElement.setAttribute('contenteditable', String(!stato));
  }

  // --- modifica ---------------------------------------------------------------

  /** Propaga al modulo il contenuto corrente. */
  aggiorna(): void {
    this.notificaCambio(this.area.nativeElement.innerHTML);
  }

  tocca(): void { this.notificaTocco(); }

  /** Applica un comando di formattazione alla selezione. */
  applica(c: Comando): void {
    this.area.nativeElement.focus();
    document.execCommand(c.id, false, c.argomento);
    this.aggiorna();
  }

  /** Trasforma la selezione in un collegamento. */
  inserisciLink(): void {
    const selezione = window.getSelection()?.toString();
    if (!selezione) {
      // Senza testo selezionato non si saprebbe su quali parole applicarlo.
      return;
    }
    const indirizzo = window.prompt('Indirizzo del collegamento (https://…)');
    if (!indirizzo) return;

    this.area.nativeElement.focus();
    document.execCommand('createLink', false, indirizzo);
    this.aggiorna();
  }

  /** Riporta la selezione a testo semplice. */
  pulisci(): void {
    this.area.nativeElement.focus();
    document.execCommand('removeFormat');
    this.aggiorna();
  }

  /**
   * Incolla come testo formattato ma ripulito. Senza questo, un testo copiato
   * da Word porta dentro font, dimensioni e colori suoi, che poi comparirebbero
   * sul sito pubblico ignorando la grafica della Federazione.
   */
  incolla(ev: ClipboardEvent): void {
    ev.preventDefault();
    const html = ev.clipboardData?.getData('text/html');
    const testo = ev.clipboardData?.getData('text/plain') ?? '';
    const contenuto = html ? this.ripulisci(html) : this.testoInParagrafi(testo);
    document.execCommand('insertHTML', false, contenuto);
    this.aggiorna();
  }

  // --- pulizia ---------------------------------------------------------------

  /**
   * Tiene solo i tag ammessi e, dei collegamenti, il solo indirizzo.
   * Tutto il resto (script, stili, classi, attributi) viene scartato.
   */
  private ripulisci(html: string): string {
    const contenitore = document.createElement('div');
    contenitore.innerHTML = html;

    const visita = (nodo: Element) => {
      // Si copia l'elenco: rimuovendo elementi durante la visita, la raccolta
      // viva del DOM salterebbe dei nodi.
      for (const figlio of Array.from(nodo.children)) {
        visita(figlio);

        if (!TAG_AMMESSI.has(figlio.tagName)) {
          // Il tag sparisce ma il testo dentro resta: si "srotola" il nodo.
          figlio.replaceWith(...Array.from(figlio.childNodes));
          continue;
        }

        for (const attributo of Array.from(figlio.attributes)) {
          const tieni = figlio.tagName === 'A' && attributo.name === 'href';
          if (!tieni) figlio.removeAttribute(attributo.name);
        }
        if (figlio.tagName === 'A') {
          // I collegamenti verso l'esterno si aprono in una scheda nuova, con
          // le protezioni standard contro la manipolazione della finestra.
          figlio.setAttribute('target', '_blank');
          figlio.setAttribute('rel', 'noopener noreferrer');
        }
      }
    };
    visita(contenitore);

    return contenitore.innerHTML;
  }

  /** Converte testo semplice in paragrafi, rispettando le righe vuote. */
  private testoInParagrafi(testo: string): string {
    return testo
      .split(/\n{2,}/)
      .map((blocco) => `<p>${this.scappa(blocco).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  /** Neutralizza i caratteri che il browser interpreterebbe come HTML. */
  private scappa(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
