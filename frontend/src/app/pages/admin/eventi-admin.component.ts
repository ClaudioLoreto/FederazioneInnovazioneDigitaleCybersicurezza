// =============================================================================
//  frontend/src/app/pages/admin/eventi-admin.component.ts
//  BACKOFFICE — Gestione Eventi (CRUD). La lista è già filtrata lato server:
//  SuperUser vede tutto, il Relatore solo i propri. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, Evento, Pilastro, Partecipante } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import { SelezioneComponent } from '../../shared/campi/selezione.component';
import { EditorTestoComponent } from '../../shared/campi/editor-testo.component';
import { PILASTRI, etichettaPilastro } from '../../shared/opzioni';
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
      <button class="primary" (click)="nuovo()" *ngIf="!form()">Nuovo evento</button>
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

    <!-- ISCRITTI di un evento: chi viene, quanti posti restano, esportazione. -->
    <section class="editor hud-panel iscritti" *ngIf="iscrittiDi() as ev" @panel aria-labelledby="t-iscritti">
      <div class="iscritti-testa">
        <div>
          <h2 id="t-iscritti">Iscritti a “{{ ev.titolo }}”</h2>
          <p class="scope">{{ ev.dataInizio | date:'d MMMM y, HH:mm' }} · {{ ev.luogo }}</p>
        </div>
        <button type="button" class="ghost" (click)="iscrittiDi.set(null)">Chiudi</button>
      </div>

      <div class="riempimento" *ngIf="!caricoIscritti()">
        <div class="riempimento-barra" aria-hidden="true">
          <span [style.width.%]="percentuale(partecipanti().length, ev.postiTotali)"></span>
        </div>
        <p><strong>{{ partecipanti().length }}</strong> iscritti su {{ ev.postiTotali }} posti
          <span *ngIf="ev.postiTotali > partecipanti().length"> · ne restano {{ ev.postiTotali - partecipanti().length }}</span>
          <span *ngIf="ev.postiTotali > 0 && partecipanti().length >= ev.postiTotali"> · evento al completo</span></p>
      </div>

      <p class="empty" *ngIf="!caricoIscritti() && !erroreIscritti() && partecipanti().length === 0">Ancora nessun iscritto.</p>
      <p class="error" *ngIf="erroreIscritti()">{{ erroreIscritti() }}</p>

      <table *ngIf="partecipanti().length > 0">
        <thead><tr><th>Nome</th><th>Email</th><th>Iscritto il</th></tr></thead>
        <tbody>
          <tr *ngFor="let p of partecipanti()">
            <td class="t">{{ p.nomeCompleto }}</td>
            <td><a [href]="'mailto:' + p.email">{{ p.email }}</a></td>
            <td>{{ p.iscrittoIl | date:'d MMM y, HH:mm' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="actions" *ngIf="partecipanti().length > 0">
        <button type="button" class="primary" (click)="esportaCsv(ev)">Esporta in CSV</button>
      </div>
    </section>

    <!-- TABELLA -->
    <!-- Ricerca e filtro per stato: con molti contenuti si trova subito quello giusto. -->
    <div class="filtri-tabella" *ngIf="eventi().length > 0" role="search">
      <label class="cerca">
        <span class="sr-only">Cerca eventi</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="search" [value]="cerca()" (input)="cerca.set($any($event.target).value)" placeholder="Cerca per titolo o luogo" />
      </label>
      <div class="segmenti" role="group" aria-label="Stato">
        <button type="button" [class.on]="stato() === 'tutti'" [attr.aria-pressed]="stato() === 'tutti'" (click)="stato.set('tutti')">Tutti <span>{{ eventi().length }}</span></button>
        <button type="button" [class.on]="stato() === 'pubblicati'" [attr.aria-pressed]="stato() === 'pubblicati'" (click)="stato.set('pubblicati')">Pubblicati <span>{{ conteggio(true) }}</span></button>
        <button type="button" [class.on]="stato() === 'bozze'" [attr.aria-pressed]="stato() === 'bozze'" (click)="stato.set('bozze')">Bozze <span>{{ conteggio(false) }}</span></button>
      </div>
    </div>

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="eventi().length > 0 && visibili().length === 0">Nessun risultato con questi filtri.</p>
      <p class="empty" *ngIf="!caricamento() && eventi().length === 0">Nessun evento. Creane uno con “Nuovo evento”.</p>

      <table *ngIf="eventi().length > 0">
        <thead>
          <tr>
            <th>Titolo</th><th>Pilastro</th><th>Data</th><th>Luogo</th>
            <th>Posti</th><th>Stato</th><th class="right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let e of visibili()">
            <td class="t">{{ e.titolo }}</td>
            <td><span class="tag">{{ etichetta(e.pilastro) }}</span></td>
            <td>{{ e.dataInizio | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ e.luogo }}</td>
            <td>{{ e.postiTotali }}</td>
            <td>
              <span class="state" [class.on]="e.pubblicato">{{ e.pubblicato ? 'Pubblicato' : 'Bozza' }}</span>
            </td>
            <td class="right">
              <button class="mini" (click)="apriIscritti(e)">Iscritti</button>
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
  private readonly avvisi = inject(AvvisiService);

  /** Voci della tendina "Pilastro" (condivise con la gestione news). */
  readonly pilastri = PILASTRI;
  readonly auth = inject(AuthService);

  readonly eventi = signal<Evento[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  /** Form attivo (null = nessun editor aperto). */
  readonly form = signal<EventoForm | null>(null);

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.carica();
    // Arrivando dalle azioni rapide del pannello (?nuovo=1) il modulo è già aperto.
    if (this.route.snapshot.queryParamMap.get('nuovo') === '1') this.nuovo();
  }

  // --- ricerca e filtro della tabella ------------------------------------------

  readonly cerca = signal('');
  readonly stato = signal<'tutti' | 'pubblicati' | 'bozze'>('tutti');

  conteggio(pubblicato: boolean): number {
    return this.eventi().filter((x) => x.pubblicato === pubblicato).length;
  }

  /** Righe mostrate: filtro per stato + ricerca su x.titolo, x.luogo, x.pilastro, senza maiuscole. */
  readonly visibili = computed(() => {
    const q = this.cerca().trim().toLowerCase();
    const st = this.stato();
    return this.eventi().filter((x) =>
      (st === 'tutti' || x.pubblicato === (st === 'pubblicati')) &&
      (!q || [x.titolo, x.luogo, x.pilastro].join(' ').toLowerCase().includes(q)));
  });

  /** (Ri)carica la lista gestibile. */
  private carica(): void {
    this.caricamento.set(true);
    this.api.getEventiGestione().subscribe({
      next: (l) => this.eventi.set(l),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  etichetta(v: string): string { return etichettaPilastro(v); }

  // --- iscritti --------------------------------------------------------------

  readonly iscrittiDi = signal<Evento | null>(null);
  readonly partecipanti = signal<Partecipante[]>([]);
  readonly caricoIscritti = signal(false);
  readonly erroreIscritti = signal<string | null>(null);

  apriIscritti(e: Evento): void {
    this.form.set(null);
    this.iscrittiDi.set(e);
    this.partecipanti.set([]);
    this.erroreIscritti.set(null);
    this.caricoIscritti.set(true);
    this.api.getPartecipanti(e.id).subscribe({
      next: (l) => { this.partecipanti.set(l); this.caricoIscritti.set(false); },
      error: (err) => {
        this.caricoIscritti.set(false);
        this.erroreIscritti.set(err?.status === 403
          ? 'Puoi vedere gli iscritti solo degli eventi di cui sei responsabile.'
          : 'Elenco non disponibile in questo momento. Riprova tra poco.');
      }
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  percentuale(n: number, tot: number): number { return tot > 0 ? Math.min(100, Math.round((n / tot) * 100)) : 0; }

  /** Scarica l'elenco iscritti in CSV (separatore ";" per Excel in italiano). */
  esportaCsv(e: Evento): void {
    const cella = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const righe = [['Nome', 'Email', 'Iscritto il'].map(cella).join(';'),
      ...this.partecipanti().map((p) => [p.nomeCompleto, p.email, new Date(p.iscrittoIl).toLocaleString('it-IT')].map(cella).join(';'))];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + righe.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `iscritti-${e.titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Apre il form vuoto. */

  nuovo(): void { this.errore.set(null); this.iscrittiDi.set(null); this.form.set({ ...VUOTO }); }

  /** Apre il form precompilato per la modifica. */
  modifica(e: Evento): void {
    this.errore.set(null);
    this.iscrittiDi.set(null);
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
      next: () => {
        this.salvataggio.set(false); this.form.set(null); this.carica();
        this.avvisi.conferma(body.pubblicato ? 'Evento pubblicato' : 'Bozza salvata',
          body.pubblicato ? 'È visibile sul sito e aperto alle iscrizioni.' : 'Non è visibile sul sito finché non lo pubblichi.');
      },
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
      next: () => { this.eventi.set(this.eventi().filter((x) => x.id !== e.id)); this.avvisi.conferma('Evento eliminato', e.titolo); },
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
