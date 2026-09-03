// =============================================================================
//  frontend/src/app/pages/admin/documenti-admin.component.ts
//  BACKOFFICE — AREA DOCUMENTI (CRUD). Lista già filtrata lato server per RBAC:
//  SuperUser vede tutti i documenti, il Relatore solo i propri. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, Documento, VisibilitaDocumento } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
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
}

const VUOTO: DocumentoForm = {
  id: null, titolo: '', descrizione: '', url: '', categoria: 'Report', visibilita: 'Pubblico'
};

/**
 * Tabella documenti + editor di creazione/modifica. Ogni elemento mostrato è,
 * per costruzione, gestibile dall'utente corrente (RBAC garantito dal server).
 */
@Component({
  selector: 'fidc-documenti-admin',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, SelezioneComponent],
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
        <p class="scope">{{ auth.isSuperUser() ? 'Tutti i documenti della Federazione' : 'I tuoi documenti' }}</p>
      </div>
      <button class="primary" (click)="nuovo()" *ngIf="!form()">+ Nuovo documento</button>
    </header>

    <section class="editor hud-panel" *ngIf="form() as f" @panel>
      <h2>{{ f.id ? 'Modifica documento' : 'Nuovo documento' }}</h2>
      <form (ngSubmit)="salva()" #fr="ngForm">
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
          <button type="submit" class="primary" [disabled]="salvataggio() || fr.invalid">
            {{ salvataggio() ? 'Salvataggio…' : (f.id ? 'Aggiorna' : 'Crea documento') }}
          </button>
        </div>
      </form>
    </section>

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && documenti().length === 0">
        Nessun documento. Caricane uno con “+ Nuovo documento”.
      </p>
      <table *ngIf="documenti().length > 0">
        <thead>
          <tr><th>Titolo</th><th>Categoria</th><th>Visibilità</th><th>File</th><th class="right">Azioni</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of documenti()">
            <td class="t">{{ d.titolo }}</td>
            <td><span class="tag">{{ d.categoria }}</span></td>
            <td><span class="state" [class.on]="d.visibilita === 'Pubblico'">{{ d.visibilita }}</span></td>
            <td><a class="mini" [href]="d.url" target="_blank" rel="noopener">Apri ↗</a></td>
            <td class="right">
              <button class="mini" (click)="modifica(d)">Modifica</button>
              <button class="mini danger" (click)="elimina(d)">Elimina</button>
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

  /** Voci della tendina "Visibilità". */
  readonly visibilita = VISIBILITA_DOCUMENTO;
  readonly auth = inject(AuthService);

  readonly documenti = signal<Documento[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  readonly form = signal<DocumentoForm | null>(null);

  ngOnInit(): void { this.carica(); }

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
      url: d.url, categoria: d.categoria, visibilita: d.visibilita
    });
  }

  annulla(): void { this.form.set(null); this.errore.set(null); }

  salva(): void {
    const f = this.form();
    if (!f || this.salvataggio()) return;
    this.salvataggio.set(true);
    this.errore.set(null);

    const body: Partial<Documento> = {
      titolo: f.titolo.trim(),
      descrizione: f.descrizione.trim() || null,
      url: f.url.trim(),
      categoria: f.categoria.trim() || 'Generale',
      visibilita: f.visibilita
    };

    const op = f.id ? this.api.aggiornaDocumento(f.id, body) : this.api.creaDocumento(body);
    op.subscribe({
      next: () => { this.salvataggio.set(false); this.form.set(null); this.carica(); },
      error: () => { this.salvataggio.set(false); this.errore.set('Salvataggio non riuscito. Verifica i dati e riprova.'); }
    });
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
      next: () => this.documenti.set(this.documenti().filter((x) => x.id !== d.id)),
      error: () => this.dialogo.avvisa(
        'Eliminazione non riuscita',
        'Il documento è ancora al suo posto. Riprova tra qualche istante.'
      )
    });
  }
}
