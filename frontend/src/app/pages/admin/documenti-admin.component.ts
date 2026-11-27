// =============================================================================
//  frontend/src/app/pages/admin/documenti-admin.component.ts
//  BACKOFFICE — AREA DOCUMENTI (CRUD). Lista già filtrata lato server per RBAC:
//  SuperUser vede tutti i documenti, il Relatore solo i propri. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, Documento, StatoContenuto, VisibilitaDocumento, statoDi } from '../../services/fidc-api.service';
import { Flusso, etichettaStato } from '../../shared/flusso';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import { SelezioneComponent } from '../../shared/campi/selezione.component';
import { VISIBILITA_DOCUMENTO } from '../../shared/opzioni';
import { AuthService } from '../../services/auth.service';

/** Modello del form documento. */
interface DocumentoForm {
  id: number | null;
  titolo: string;
  descrizione: string;
  url: string;
  categoria: string;
  visibilita: VisibilitaDocumento;
  /** Stato e autore del documento aperto (null per uno nuovo). */
  stato: StatoContenuto | null;
  autore: number | null;
  notaRevisione: string | null;
}

const VUOTO: DocumentoForm = {
  id: null, titolo: '', descrizione: '', url: '', categoria: 'Report', visibilita: 'Pubblico',
  stato: null, autore: null, notaRevisione: null
};

/**
 * Tabella documenti + editor di creazione/modifica. Ogni elemento mostrato è,
 * per costruzione, gestibile dall'utente corrente (RBAC garantito dal server).
 */
@Component({
  selector: 'fidc-documenti-admin',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, SelezioneComponent],
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
        <h1>Area Documenti</h1>
        <p class="scope">{{ auth.isSuperUser() ? 'Tutti i documenti della Federazione'
          : flusso.revisiona ? 'I tuoi documenti e quelli che attendono la tua revisione' : 'I tuoi documenti' }}</p>
      </div>
      <button class="primary" (click)="nuovo()" *ngIf="!form() && flusso.puoCreare">Nuovo documento</button>
    </header>

    <section class="editor hud-panel" *ngIf="form() as f" @panel>
      <h2>{{ f.id ? (revisioneInCorso(f) ? 'Revisione del documento' : 'Modifica documento') : 'Nuovo documento' }}</h2>
      <div class="nota-revisione" *ngIf="f.stato === 'DaRivedere' && f.notaRevisione" role="note">
        <strong>Nota del revisore</strong>
        <p>{{ f.notaRevisione }}</p>
      </div>
      <p class="flusso-info" *ngIf="!f.id && !flusso.pubblicaDaSe">
        Quando lo invii, il documento passa a chi lo revisiona: sarà disponibile dopo l'approvazione.
      </p>
      <form (ngSubmit)="salva(statoPrincipale(f))" #fr="ngForm">
        <div class="grid">
          <label class="full"><span>Titolo</span>
            <input name="titolo" [(ngModel)]="f.titolo" required maxlength="200" />
          </label>
          <label class="full"><span>Descrizione</span>
            <textarea name="descrizione" [(ngModel)]="f.descrizione" rows="2"></textarea>
          </label>
          <label class="full"><span>URL del file</span>
            <input name="url" [(ngModel)]="f.url" required placeholder="https://… oppure /docs/file.pdf" />
          </label>
          <label><span>Categoria</span>
            <input name="categoria" [(ngModel)]="f.categoria" placeholder="Report, Linee guida, Atti…" />
          </label>
          <label><span>Visibilità</span>
            <fidc-selezione name="visibilita" [(ngModel)]="f.visibilita"
                            [opzioni]="visibilita" etichetta="Visibilità"></fidc-selezione>
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

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && documenti().length === 0">
        {{ flusso.puoCreare ? 'Nessun documento. Caricane uno con “Nuovo documento”.' : 'Nessun documento da rivedere per ora.' }}
      </p>
      <table *ngIf="documenti().length > 0">
        <thead>
          <tr><th>Titolo</th><th>Categoria</th><th>Visibilità</th><th>Stato</th><th>File</th><th class="right">Azioni</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of documenti()">
            <td class="t">{{ d.titolo }}</td>
            <td><span class="tag">{{ d.categoria }}</span></td>
            <td>{{ d.visibilita === 'Pubblico' ? 'Pubblico' : 'Solo soci' }}</td>
            <td><span class="state" [ngClass]="classeStato(d)" [attr.title]="d.notaRevisione || null">{{ etichetta2(d) }}</span></td>
            <td><a class="mini" [href]="d.url" target="_blank" rel="noopener">Apri il file</a></td>
            <td class="right">
              <ng-container *ngIf="flusso.puoRevisionare(c(d))">
                <button class="mini evidenza" (click)="approva(d)">Approva</button>
                <button class="mini" (click)="rimanda(d)">Rimanda</button>
              </ng-container>
              <button class="mini" *ngIf="flusso.puoModificare(c(d))" (click)="modifica(d)">{{ flusso.puoRevisionare(c(d)) ? 'Apri' : 'Modifica' }}</button>
              <button class="mini danger" *ngIf="flusso.puoEliminare(c(d))" (click)="elimina(d)">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
  `,
  styleUrl: './admin-tables.scss'
})
export class DocumentiAdminComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly dialogo = inject(DialogoService);
  private readonly avvisi = inject(AvvisiService);

  /** Voci della tendina "Visibilità". */
  readonly visibilita = VISIBILITA_DOCUMENTO;
  readonly auth = inject(AuthService);
  /** Regole del flusso di revisione per i documenti, secondo i permessi. */
  readonly flusso = new Flusso(this.auth, 'documenti');

  readonly documenti = signal<Documento[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  readonly form = signal<DocumentoForm | null>(null);

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.carica();
    // Arrivando dalle azioni rapide del pannello (?nuovo=1) il modulo è già aperto.
    if (this.route.snapshot.queryParamMap.get('nuovo') === '1' && this.flusso.puoCreare) this.nuovo();
  }

  private carica(): void {
    this.caricamento.set(true);
    this.api.getDocumentiGestione().subscribe({
      next: (l) => this.documenti.set(l),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  nuovo(): void { this.errore.set(null); this.form.set({ ...VUOTO }); }

  modifica(d: Documento): void {
    this.errore.set(null);
    this.form.set({
      id: d.id, titolo: d.titolo, descrizione: d.descrizione ?? '',
      url: d.url, categoria: d.categoria, visibilita: d.visibilita,
      stato: statoDi(d), autore: d.caricatoDaId, notaRevisione: d.notaRevisione ?? null
    });
  }

  /** Il documento visto dal flusso di revisione. */
  c(d: Documento) { return { stato: d.stato, autore: d.caricatoDaId }; }
  etichetta2(d: Documento): string { return etichettaStato(statoDi(d)); }
  classeStato(d: Documento): Record<string, boolean> {
    const st = statoDi(d);
    return { on: st === 'Pubblicato', attesa: st === 'InRevisione', rivedere: st === 'DaRivedere' };
  }

  /** Il modulo aperto è una revisione: documento altrui in attesa di approvazione. */
  revisioneInCorso(f: DocumentoForm): boolean {
    return !!f.id && f.autore !== null && this.flusso.puoRevisionare({ stato: f.stato ?? undefined, autore: f.autore });
  }

  /** Stato che assume il documento premendo il bottone principale. */
  statoPrincipale(f: DocumentoForm): StatoContenuto {
    return this.flusso.statoAlSalvataggio(f.id && f.autore !== null ? { stato: f.stato ?? undefined, autore: f.autore } : null);
  }

  /** Testo del bottone principale: dice esattamente che cosa succede. */
  etichettaPrincipale(f: DocumentoForm): string {
    if (this.statoPrincipale(f) === 'InRevisione') return 'Invia in revisione';
    return f.stato === 'Pubblicato' ? 'Aggiorna' : 'Pubblica';
  }

  annulla(): void { this.form.set(null); this.errore.set(null); }

  /** Crea o aggiorna il documento con lo stato scelto dal bottone premuto. */
  salva(stato: StatoContenuto): void {
    const f = this.form();
    if (!f || this.salvataggio()) return;
    this.salvataggio.set(true);
    this.errore.set(null);

    const body: Partial<Documento> = {
      titolo: f.titolo.trim(),
      descrizione: f.descrizione.trim() || null,
      url: f.url.trim(),
      categoria: f.categoria.trim() || 'Generale',
      visibilita: f.visibilita,
      stato
    };
    const esito: Record<StatoContenuto, [string, string]> = {
      Pubblicato: [this.revisioneInCorso(f) ? 'Documento approvato' : f.stato === 'Pubblicato' ? 'Documento aggiornato' : 'Documento pubblicato', "Lo trovi nell'area documenti."],
      InRevisione: ['Documento inviato in revisione', "Sarà disponibile dopo l'approvazione."],
      DaRivedere: ["Documento rimandato all'autore", ''],
      Bozza: ['Bozza salvata', 'Non è scaricabile finché non lo pubblichi o lo invii in revisione.']
    };

    const op = f.id ? this.api.aggiornaDocumento(f.id, body) : this.api.creaDocumento(body);
    op.subscribe({
      next: () => { this.salvataggio.set(false); this.form.set(null); this.carica(); this.avvisi.conferma(esito[stato][0], esito[stato][1]); },
      error: () => { this.salvataggio.set(false); this.errore.set('Salvataggio non riuscito. Verifica i dati e riprova.'); }
    });
  }

  /** Approva un documento in revisione: diventa disponibile. */
  approva(d: Documento): void {
    this.api.approva('documenti', d.id).subscribe({
      next: () => {
        this.documenti.set(this.documenti().map((x) => x.id === d.id ? { ...x, stato: 'Pubblicato', notaRevisione: null } : x));
        this.avvisi.conferma('Documento approvato', d.titolo);
      },
      error: () => this.dialogo.avvisa('Approvazione non riuscita', 'Il documento è ancora in revisione. Riprova tra qualche istante.')
    });
  }

  /** Rimanda un documento all'autore con una nota obbligatoria. */
  async rimanda(d: Documento): Promise<void> {
    const nota = await this.dialogo.chiedi({
      titolo: "Rimandare il documento all'autore?",
      messaggio: `"${d.titolo}" torna all'autore con la tua nota e non sarà disponibile finché non lo rimanda in revisione.`,
      azione: 'Rimanda',
      campo: { etichetta: "Nota per l'autore", segnaposto: 'Che cosa va corretto o completato?', obbligatorio: true }
    });
    if (nota === null) return;
    this.api.rimanda('documenti', d.id, nota).subscribe({
      next: () => {
        this.documenti.set(this.documenti().map((x) => x.id === d.id ? { ...x, stato: 'DaRivedere', notaRevisione: nota } : x));
        if (this.form()?.id === d.id) this.form.set(null);
        this.avvisi.conferma("Documento rimandato all'autore", d.titolo);
      },
      error: () => this.dialogo.avvisa('Invio della nota non riuscito', 'Il documento è ancora in revisione. Riprova tra qualche istante.')
    });
  }

  /** "Rimanda all'autore" dal modulo di revisione. */
  rimandaDalModulo(f: DocumentoForm): void {
    const d = this.documenti().find((x) => x.id === f.id);
    if (d) this.rimanda(d);
  }

  /** Elimina il documento, previa conferma esplicita. */
  async elimina(d: Documento): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Eliminare questo documento?',
      messaggio: `"${d.titolo}" non sarà più scaricabile dall'area documenti. L'operazione non è reversibile.`,
      azione: 'Elimina',
      distruttiva: true
    });
    if (!ok) return;

    this.api.eliminaDocumento(d.id).subscribe({
      next: () => { this.documenti.set(this.documenti().filter((x) => x.id !== d.id)); this.avvisi.conferma('Documento eliminato', d.titolo); },
      error: () => this.dialogo.avvisa(
        'Eliminazione non riuscita',
        'Il documento è ancora al suo posto. Riprova tra qualche istante.'
      )
    });
  }
}
