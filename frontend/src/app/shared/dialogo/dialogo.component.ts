// =============================================================================
//  frontend/src/app/shared/dialogo/dialogo.component.ts
//  Disegna la finestra di conferma o di avviso richiesta da DialogoService.
//
//  È montato UNA volta sola in app.component: le pagine non devono aggiungere
//  nulla, chiamano il servizio e la finestra compare sopra tutto il resto.
//
//  Attenzioni di accessibilità, che qui non sono un di più:
//   - role="alertdialog" e aria-modal: i lettori di schermo annunciano la
//     finestra e capiscono che il resto della pagina è temporaneamente inerte;
//   - il fuoco entra nella finestra all'apertura e torna dov'era alla chiusura;
//   - Tab resta prigioniero dei bottoni, Esc annulla;
//   - sulle azioni irreversibili il fuoco parte da "Annulla".
// =============================================================================

import {
  Component, ElementRef, ViewChild, effect, inject
} from '@angular/core';
import { NgIf } from '@angular/common';
import { DialogoService } from './dialogo.service';

@Component({
  selector: 'fidc-dialogo',
  standalone: true,
  imports: [NgIf],
  template: `
  <div class="scrim" *ngIf="dialogo.stato() as s" (click)="fuori($event)">
    <div class="box" role="alertdialog" aria-modal="true"
         aria-labelledby="dlg-titolo" [attr.aria-describedby]="s.messaggio ? 'dlg-testo' : null"
         (keydown)="tasti($event)" #box>

      <span class="filo" aria-hidden="true"></span>

      <h2 id="dlg-titolo">{{ s.titolo }}</h2>
      <p id="dlg-testo" *ngIf="s.messaggio">{{ s.messaggio }}</p>

      <div class="azioni">
        <button type="button" class="annulla" *ngIf="!s.soloAvviso"
                #primoAnnulla (click)="s.rispondi(false)">
          {{ s.annulla }}
        </button>
        <button type="button" class="conferma" [class.distruttiva]="s.distruttiva"
                #primaConferma (click)="s.rispondi(true)">
          {{ s.azione }}
        </button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .scrim {
      position: fixed; inset: 0; z-index: 100;
      display: grid; place-items: center; padding: 20px;
      /* Il velo usa lo stesso fondo della scena 3D: la pagina sotto si allontana
         invece di sparire, e resta chiaro che si tornerà lì. */
      background: color-mix(in srgb, var(--canvas-bg) 78%, transparent);
      backdrop-filter: blur(4px);
      animation: dlg-scrim .18s ease both;
    }

    .box {
      position: relative;
      width: min(460px, 100%);
      padding: 30px 28px 24px;
      color: var(--text);
      background: var(--canvas-bg);
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
      box-shadow: var(--glow-deep);
      animation: dlg-in .26s var(--ease-spatial) both;
    }

    /* Filo luminoso in alto: lo stesso segnale usato dai pannelli di accesso,
       così la finestra si riconosce come parte dello stesso sistema. */
    .filo {
      position: absolute; left: 18px; right: 30px; top: 0; height: 3px;
      background: linear-gradient(90deg, var(--accent-2), var(--accent), var(--accent-2));
    }

    h2 {
      margin: 0 0 10px; font-size: 1.18rem; font-family: var(--font-display);
      color: var(--text); line-height: 1.3;
    }
    p { margin: 0; color: var(--text-soft); font-size: .93rem; line-height: 1.55; }

    .azioni { display: flex; justify-content: flex-end; gap: 12px; margin-top: 26px; flex-wrap: wrap; }

    .azioni button {
      font: inherit; font-weight: 600; font-size: .98rem;
      min-height: 46px; padding: 11px 20px; cursor: pointer;
      border-radius: max(var(--radius), 3px);
      transition: background .2s, color .18s, border-color .2s;
    }
    .azioni button:focus-visible { outline: none; box-shadow: var(--glow-focus); }

    .annulla {
      background: transparent; color: var(--text-soft);
      border: 1px solid var(--surface-border);
    }
    .annulla:hover { color: var(--text); border-color: var(--line-strong); }

    .conferma {
      background: var(--accent); color: var(--on-accent);
      border: 1px solid var(--accent);
    }
    .conferma:hover { filter: brightness(1.06); }
    /* L'azione irreversibile cambia colore, non forma: si nota senza allarmare. */
    .conferma.distruttiva {
      background: var(--accent-2); color: var(--on-accent-2); border-color: var(--accent-2);
    }

    @keyframes dlg-scrim { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dlg-in {
      from { opacity: 0; transform: translateY(14px) scale(.97); }
      to   { opacity: 1; transform: none; }
    }

    @media (max-width: 420px) {
      .azioni { flex-direction: column-reverse; }
      .azioni button { width: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .scrim, .box { animation: none; }
      .azioni button { transition: none; }
    }
  `]
})
export class DialogoComponent {
  readonly dialogo = inject(DialogoService);

  @ViewChild('box') private box?: ElementRef<HTMLElement>;
  @ViewChild('primoAnnulla') private bottoneAnnulla?: ElementRef<HTMLButtonElement>;
  @ViewChild('primaConferma') private bottoneConferma?: ElementRef<HTMLButtonElement>;

  /** Elemento che aveva il fuoco prima dell'apertura, per restituirglielo. */
  private fuocoPrecedente: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const aperta = this.dialogo.stato();
      if (aperta) {
        this.fuocoPrecedente = document.activeElement as HTMLElement | null;
        // Il bottone esiste solo dopo che Angular ha disegnato la finestra.
        queueMicrotask(() => {
          const bersaglio = aperta.distruttiva
            ? this.bottoneAnnulla?.nativeElement
            : this.bottoneConferma?.nativeElement;
          (bersaglio ?? this.bottoneConferma?.nativeElement)?.focus();
        });
      } else {
        this.fuocoPrecedente?.focus?.();
        this.fuocoPrecedente = null;
      }
    });
  }

  /** Chiude annullando se il clic è caduto sul velo e non sulla finestra. */
  fuori(ev: MouseEvent): void {
    if (!this.box?.nativeElement.contains(ev.target as Node)) this.dialogo.chiudi();
  }

  /** Esc annulla; Tab non deve poter uscire dalla finestra. */
  tasti(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') { ev.preventDefault(); this.dialogo.chiudi(); return; }
    if (ev.key !== 'Tab') return;

    const bottoni = Array.from(
      this.box?.nativeElement.querySelectorAll<HTMLButtonElement>('button') ?? []
    );
    if (!bottoni.length) return;

    const primo = bottoni[0];
    const ultimo = bottoni[bottoni.length - 1];
    if (ev.shiftKey && document.activeElement === primo) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primo.focus(); }
  }
}
