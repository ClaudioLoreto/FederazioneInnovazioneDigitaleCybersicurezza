// =============================================================================
//  frontend/src/app/pages/admin/eventi-admin.component.ts
//  BACKOFFICE — Gestione Eventi (CRUD). La lista è già filtrata lato server:
//  SuperUser vede tutto, il Relatore solo i propri. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, Evento, Pilastro } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { SelezioneComponent } from '../../shared/campi/selezione.component';
import { EditorTestoComponent } from '../../shared/campi/editor-testo.component';
import { PILASTRI } from '../../shared/opzioni';
import { AuthService } from '../../services/auth.service';

/** Modello del form (date come stringhe per gli <input datetime-local>). */
interface EventoForm {
  id: number | null;
  titolo: string;
  sottotitolo: string;
  descrizione: string;
  pilastro: Pilastro;
  dataInizio: string;
  dataFine: string;
  luogo: string;
  postiTotali: number;
  pubblicato: boolean;
}

/** Form vuoto di default. */
const VUOTO: EventoForm = {
  id: null, titolo: '', sottotitolo: '', descrizione: '', pilastro: 'Eventi',
  dataInizio: '', dataFine: '', luogo: '', postiTotali: 50, pubblicato: false
};

/**
 * Tabella eventi + pannello di creazione/modifica. Rispetta l'RBAC perché ogni
 * elemento mostrato è, per costruzione, modificabile dall'utente corrente.
 */
@Component({
  selector: 'fidc-eventi-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule, SelezioneComponent, EditorTestoComponent],
  animations: [
    trigger('panel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px)' }),
        animate('260ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ],
  template: `
  <div class="page">
    <header class="head">
      <div>
        <h1>Eventi</h1>
        <p class="scope">{{ auth.isSuperUser() ? 'Tutti gli eventi della Federazione' : 'I tuoi eventi' }}</p>
      </div>
      <button class="primary" (click)="nuovo()" *ngIf="!form()">+ Nuovo evento</button>
    </header>

    <!-- FORM -->
    <section class="editor hud-panel" *ngIf="form() as f" @panel>
      <h2>{{ f.id ? 'Modifica evento' : 'Nuovo evento' }}</h2>
      <form (ngSubmit)="salva()" #fr="ngForm">
        <div class="grid">
          <label class="full"><span>Titolo</span>
            <input name="titolo" [(ngModel)]="f.titolo" required maxlength="160" />
          </label>
          <label class="full"><span>Sottotitolo</span>
            <input name="sottotitolo" [(ngModel)]="f.sottotitolo" maxlength="200" />
          </label>
          <label class="full"><span>Descrizione</span>
            <fidc-editor-testo name="descrizione" [(ngModel)]="f.descrizione"
                               etichetta="Descrizione dell'evento"
                               segnaposto="Programma, destinatari, modalità di partecipazione."></fidc-editor-testo>
          </label>
          <label><span>Pilastro</span>
            <fidc-selezione name="pilastro" [(ngModel)]="f.pilastro"
                            [opzioni]="pilastri" etichetta="Pilastro"></fidc-selezione>
          </label>
          <label><span>Luogo</span>
            <input name="luogo" [(ngModel)]="f.luogo" required />
          </label>
          <label><span>Data inizio</span>
            <input type="datetime-local" name="dataInizio" [(ngModel)]="f.dataInizio" required />
          </label>
          <label><span>Data fine (opz.)</span>
            <input type="datetime-local" name="dataFine" [(ngModel)]="f.dataFine" />
          </label>
          <label><span>Posti totali</span>
            <input type="number" name="postiTotali" [(ngModel)]="f.postiTotali" min="0" />
          </label>
          <label class="check"><span>Pubblicato</span>
            <input type="checkbox" name="pubblicato" [(ngModel)]="f.pubblicato" />
          </label>
        </div>

        <p class="error" *ngIf="errore()">{{ errore() }}</p>

        <div class="actions">
          <button type="button" class="ghost" (click)="annulla()">Annulla</button>
          <button type="submit" class="primary" [disabled]="salvataggio() || fr.invalid">
            {{ salvataggio() ? 'Salvataggio…' : (f.id ? 'Aggiorna' : 'Crea evento') }}
          </button>
        </div>
      </form>
    </section>

    <!-- TABELLA -->
    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && eventi().length === 0">Nessun evento. Creane uno con “+ Nuovo evento”.</p>

      <table *ngIf="eventi().length > 0">
        <thead>
          <tr>
            <th>Titolo</th><th>Pilastro</th><th>Data</th><th>Luogo</th>
            <th>Posti</th><th>Stato</th><th class="right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of eventi()">
            <td class="t">{{ e.titolo }}</td>
            <td><span class="tag">{{ e.pilastro }}</span></td>
            <td>{{ e.dataInizio | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ e.luogo }}</td>
            <td>{{ e.postiTotali }}</td>
            <td>
              <span class="state" [class.on]="e.pubblicato">{{ e.pubblicato ? 'Pubblicato' : 'Bozza' }}</span>
            </td>
            <td class="right">
              <button class="mini" (click)="modifica(e)">Modifica</button>
              <button class="mini danger" (click)="elimina(e)">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
  `,
  styleUrl: './admin-tables.scss'
})
export class EventiAdminComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly dialogo = inject(DialogoService);

  /** Voci della tendina "Pilastro" (condivise con la gestione news). */
  readonly pilastri = PILASTRI;
  readonly auth = inject(AuthService);

  readonly eventi = signal<Evento[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  /** Form attivo (null = nessun editor aperto). */
  readonly form = signal<EventoForm | null>(null);

  ngOnInit(): void { this.carica(); }

  /** (Ri)carica la lista gestibile. */
  private carica(): void {
    this.caricamento.set(true);
    this.api.getEventiGestione().subscribe({
      next: (l) => this.eventi.set(l),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  /** Apre il form vuoto. */
  nuovo(): void { this.errore.set(null); this.form.set({ ...VUOTO }); }

  /** Apre il form precompilato per la modifica. */
  modifica(e: Evento): void {
    this.errore.set(null);
    this.form.set({
      id: e.id,
      titolo: e.titolo,
      sottotitolo: e.sottotitolo ?? '',
      descrizione: e.descrizione,
      pilastro: e.pilastro,
      dataInizio: this.toLocal(e.dataInizio),
      dataFine: this.toLocal(e.dataFine),
      luogo: e.luogo,
      postiTotali: e.postiTotali,
      pubblicato: e.pubblicato
    });
  }

  /** Chiude il form senza salvare. */
  annulla(): void { this.form.set(null); this.errore.set(null); }

  /** Crea o aggiorna in base alla presenza dell'id. */
  salva(): void {
    const f = this.form();
    if (!f || this.salvataggio()) return;
    this.salvataggio.set(true);
    this.errore.set(null);

    const body: Partial<Evento> = {
      titolo: f.titolo.trim(),
      sottotitolo: f.sottotitolo.trim() || null,
      descrizione: f.descrizione.trim(),
      pilastro: f.pilastro,
      dataInizio: new Date(f.dataInizio).toISOString(),
      dataFine: f.dataFine ? new Date(f.dataFine).toISOString() : null,
      luogo: f.luogo.trim(),
      postiTotali: Number(f.postiTotali) || 0,
      pubblicato: f.pubblicato
    };

    const op = f.id
      ? this.api.aggiornaEvento(f.id, body)
      : this.api.creaEvento(body);

    op.subscribe({
      next: () => { this.salvataggio.set(false); this.form.set(null); this.carica(); },
      error: () => { this.salvataggio.set(false); this.errore.set('Salvataggio non riuscito. Verifica i dati e riprova.'); }
    });
  }

  /** Elimina l'evento, previa conferma esplicita. */
  async elimina(e: Evento): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Eliminare questo evento?',
      messaggio: `"${e.titolo}" sarà rimosso dal sito insieme alle iscrizioni raccolte. L'operazione non è reversibile.`,
      azione: 'Elimina',
      distruttiva: true
    });
    if (!ok) return;

    this.api.eliminaEvento(e.id).subscribe({
      next: () => this.eventi.set(this.eventi().filter((x) => x.id !== e.id)),
      error: () => this.dialogo.avvisa(
        'Eliminazione non riuscita',
        "L'evento è ancora al suo posto. Riprova tra qualche istante."
      )
    });
  }

  /** Converte una data ISO nel formato accettato da <input datetime-local>. */
  private toLocal(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
