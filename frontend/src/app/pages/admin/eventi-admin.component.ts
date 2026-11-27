// =============================================================================
//  frontend/src/app/pages/admin/eventi-admin.component.ts
//  BACKOFFICE — Gestione Eventi (CRUD) con il flusso di revisione
//  (shared/flusso.ts) e il pannello iscritti. La lista la filtra il server in
//  base ai permessi; qui bottoni e filtri seguono la matrice. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, Evento, Pilastro, Partecipante, StatoContenuto, statoDi } from '../../services/fidc-api.service';
import { Flusso, etichettaStato } from '../../shared/flusso';
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
  /** Stato e responsabile dell'evento aperto (null per un evento nuovo). */
  stato: StatoContenuto | null;
  autore: number | null;
  notaRevisione: string | null;
}

/** Form vuoto di default. */
const VUOTO: EventoForm = {
  id: null, titolo: '', sottotitolo: '', descrizione: '', pilastro: 'Eventi',
  dataInizio: '', dataFine: '', luogo: '', postiTotali: 50, pubblicato: false,
  stato: null, autore: null, notaRevisione: null
};

/**
 * Tabella eventi + pannello di creazione/modifica. Rispetta l'RBAC perché ogni
 * elemento mostrato è, per costruzione, modificabile dall'utente corrente.
 */
@Component({
  selector: 'fidc-eventi-admin',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, FormsModule, SelezioneComponent, EditorTestoComponent],
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
        <p class="scope">{{ auth.isSuperUser() ? 'Tutti gli eventi della Federazione'
          : flusso.revisiona ? 'I tuoi eventi e quelli che attendono la tua revisione' : 'I tuoi eventi' }}</p>
      </div>
      <button class="primary" (click)="nuovo()" *ngIf="!form() && flusso.puoCreare">Nuovo evento</button>
    </header>

    <!-- FORM -->
    <section class="editor hud-panel" *ngIf="form() as f" @panel>
      <h2>{{ f.id ? 'Modifica evento' : 'Nuovo evento' }}</h2>
      <div class="nota-revisione" *ngIf="f.stato === 'DaRivedere' && f.notaRevisione" role="note">
        <strong>Nota del revisore</strong>
        <p>{{ f.notaRevisione }}</p>
      </div>
      <p class="flusso-info" *ngIf="!f.id && !flusso.pubblicaDaSe">
        Quando lo invii, l'evento passa a chi lo revisiona: sarà pubblicato dopo l'approvazione.
      </p>
      <form (ngSubmit)="salva(statoPrincipale(f))" #fr="ngForm">
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
        </div>

        <p class="error" *ngIf="errore()">{{ errore() }}</p>

        <div class="actions">
          <button type="button" class="ghost" (click)="annulla()">Annulla</button>
          <ng-container *ngIf="revisioneInCorso(f); else azioniAutore">
            <button type="button" class="ghost" [disabled]="salvataggio()" (click)="rimandaDalModulo(f)">Rimanda all'autore</button>
            <button type="submit" class="primary" [disabled]="salvataggio() || fr.invalid">
              {{ salvataggio() ? 'Salvataggio…' : 'Approva e pubblica' }}
            </button>
          </ng-container>
          <ng-template #azioniAutore>
            <button type="button" class="ghost" *ngIf="f.stato !== 'Pubblicato'"
                    [disabled]="salvataggio() || fr.invalid" (click)="salva('Bozza')">Salva bozza</button>
            <button type="submit" class="primary" [disabled]="salvataggio() || fr.invalid">
              {{ salvataggio() ? 'Salvataggio…' : etichettaPrincipale(f) }}
            </button>
          </ng-template>
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
        <button type="button" *ngIf="flusso.revisiona" [class.on]="stato() === 'approvare'" [attr.aria-pressed]="stato() === 'approvare'" (click)="stato.set('approvare')">Da approvare <span>{{ conteggio('approvare') }}</span></button>
        <button type="button" [class.on]="stato() === 'lavorazione'" [attr.aria-pressed]="stato() === 'lavorazione'" (click)="stato.set('lavorazione')">Non pubblicati <span>{{ conteggio('lavorazione') }}</span></button>
        <button type="button" [class.on]="stato() === 'pubblicati'" [attr.aria-pressed]="stato() === 'pubblicati'" (click)="stato.set('pubblicati')">Pubblicati <span>{{ conteggio('pubblicati') }}</span></button>
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
              <span class="state" [ngClass]="classeStato(e)" [attr.title]="e.notaRevisione || null">{{ etichetta2(e) }}</span>
            </td>
            <td class="right">
              <ng-container *ngIf="flusso.puoRevisionare(c(e))">
                <button class="mini evidenza" (click)="approva(e)">Approva</button>
                <button class="mini" (click)="rimanda(e)">Rimanda</button>
              </ng-container>
              <button class="mini" *ngIf="auth.puo('eventi.iscritti') && e.pubblicato" (click)="apriIscritti(e)">Iscritti</button>
              <button class="mini" *ngIf="flusso.puoModificare(c(e))" (click)="modifica(e)">{{ flusso.puoRevisionare(c(e)) ? 'Apri' : 'Modifica' }}</button>
              <button class="mini danger" *ngIf="flusso.puoEliminare(c(e))" (click)="elimina(e)">Elimina</button>
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
  /** Regole del flusso di revisione per gli eventi, secondo i permessi. */
  readonly flusso = new Flusso(this.auth, 'eventi');

  readonly eventi = signal<Evento[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  /** Form attivo (null = nessun editor aperto). */
  readonly form = signal<EventoForm | null>(null);

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.carica();
    // Arrivando dalle azioni rapide del pannello (?nuovo=1) il modulo è già aperto;
    // con ?filtro=approvare si apre direttamente la coda di revisione.
    if (this.route.snapshot.queryParamMap.get('nuovo') === '1' && this.flusso.puoCreare) this.nuovo();
    if (this.route.snapshot.queryParamMap.get('filtro') === 'approvare' && this.flusso.revisiona) this.stato.set('approvare');
  }

  // --- ricerca e filtro della tabella ------------------------------------------

  readonly cerca = signal('');
  readonly stato = signal<'tutti' | 'approvare' | 'lavorazione' | 'pubblicati'>('tutti');

  /** L'evento visto dal flusso di revisione. */
  c(e: Evento) { return { pubblicato: e.pubblicato, stato: e.stato, autore: e.relatoreId }; }

  private passa(e: Evento, filtro: string): boolean {
    const st = statoDi(e);
    switch (filtro) {
      case 'approvare': return this.flusso.puoRevisionare(this.c(e));
      case 'lavorazione': return st !== 'Pubblicato';
      case 'pubblicati': return st === 'Pubblicato';
      default: return true;
    }
  }

  conteggio(filtro: string): number { return this.eventi().filter((x) => this.passa(x, filtro)).length; }

  etichetta2(e: Evento): string { return etichettaStato(statoDi(e)); }
  classeStato(e: Evento): Record<string, boolean> {
    const st = statoDi(e);
    return { on: st === 'Pubblicato', attesa: st === 'InRevisione', rivedere: st === 'DaRivedere' };
  }

  /** Righe mostrate: filtro per stato + ricerca su titolo, luogo e pilastro, senza maiuscole. */
  readonly visibili = computed(() => {
    const q = this.cerca().trim().toLowerCase();
    const st = this.stato();
    return this.eventi().filter((x) => this.passa(x, st) &&
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
      pubblicato: e.pubblicato,
      stato: statoDi(e),
      autore: e.relatoreId,
      notaRevisione: e.notaRevisione ?? null
    });
  }

  /** Il modulo aperto è una revisione: evento altrui in attesa di approvazione. */
  revisioneInCorso(f: EventoForm): boolean {
    return !!f.id && f.autore !== null && this.flusso.puoRevisionare({ stato: f.stato ?? undefined, autore: f.autore });
  }

  /** Stato che assume l'evento premendo il bottone principale. */
  statoPrincipale(f: EventoForm): StatoContenuto {
    return this.flusso.statoAlSalvataggio(f.id && f.autore !== null ? { stato: f.stato ?? undefined, autore: f.autore } : null);
  }

  /** Testo del bottone principale: dice esattamente che cosa succede. */
  etichettaPrincipale(f: EventoForm): string {
    if (this.statoPrincipale(f) === 'InRevisione') return 'Invia in revisione';
    return f.stato === 'Pubblicato' ? 'Aggiorna' : 'Pubblica';
  }

  /** Chiude il form senza salvare. */
  annulla(): void { this.form.set(null); this.errore.set(null); }

  /** Crea o aggiorna l'evento con lo stato scelto dal bottone premuto. */
  salva(stato: StatoContenuto): void {
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
      pubblicato: stato === 'Pubblicato',
      stato
    };
    const esito: Record<StatoContenuto, [string, string]> = {
      Pubblicato: [this.revisioneInCorso(f) ? 'Evento approvato' : f.stato === 'Pubblicato' ? 'Evento aggiornato' : 'Evento pubblicato', 'È visibile sul sito e aperto alle iscrizioni.'],
      InRevisione: ['Evento inviato in revisione', 'Sarà pubblicato dopo l\'approvazione.'],
      DaRivedere: ['Evento rimandato all\'autore', ''],
      Bozza: ['Bozza salvata', 'Non è visibile sul sito finché non lo pubblichi o lo invii in revisione.']
    };

    const op = f.id
      ? this.api.aggiornaEvento(f.id, body)
      : this.api.creaEvento(body);

    op.subscribe({
      next: () => {
        this.salvataggio.set(false); this.form.set(null); this.carica();
        this.avvisi.conferma(esito[stato][0], esito[stato][1]);
      },
      error: () => { this.salvataggio.set(false); this.errore.set('Salvataggio non riuscito. Verifica i dati e riprova.'); }
    });
  }

  /** Approva un evento in revisione: viene pubblicato. */
  approva(e: Evento): void {
    this.api.approva('eventi', e.id).subscribe({
      next: () => {
        this.eventi.set(this.eventi().map((x) => x.id === e.id ? { ...x, stato: 'Pubblicato', pubblicato: true, notaRevisione: null } : x));
        this.avvisi.conferma('Evento approvato', e.titolo);
      },
      error: () => this.dialogo.avvisa('Approvazione non riuscita', "L'evento è ancora in revisione. Riprova tra qualche istante.")
    });
  }

  /** Rimanda un evento all'autore con una nota obbligatoria. */
  async rimanda(e: Evento): Promise<void> {
    const nota = await this.dialogo.chiedi({
      titolo: "Rimandare l'evento all'autore?",
      messaggio: `"${e.titolo}" torna all'autore con la tua nota e non sarà pubblicato finché non lo rimanda in revisione.`,
      azione: 'Rimanda',
      campo: { etichetta: "Nota per l'autore", segnaposto: 'Che cosa va corretto o completato?', obbligatorio: true }
    });
    if (nota === null) return;
    this.api.rimanda('eventi', e.id, nota).subscribe({
      next: () => {
        this.eventi.set(this.eventi().map((x) => x.id === e.id ? { ...x, stato: 'DaRivedere', pubblicato: false, notaRevisione: nota } : x));
        if (this.form()?.id === e.id) this.form.set(null);
        this.avvisi.conferma("Evento rimandato all'autore", e.titolo);
      },
      error: () => this.dialogo.avvisa('Invio della nota non riuscito', "L'evento è ancora in revisione. Riprova tra qualche istante.")
    });
  }

  /** "Rimanda all'autore" dal modulo di revisione. */
  rimandaDalModulo(f: EventoForm): void {
    const e = this.eventi().find((x) => x.id === f.id);
    if (e) this.rimanda(e);
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
