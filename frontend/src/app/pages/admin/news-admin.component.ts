// =============================================================================
//  frontend/src/app/pages/admin/news-admin.component.ts
//  BACKOFFICE — Gestione News (CRUD). La lista è già filtrata lato server:
//  SuperUser vede tutto, il Relatore solo le proprie. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, News, Pilastro } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { SelezioneComponent } from '../../shared/campi/selezione.component';
import { EditorTestoComponent } from '../../shared/campi/editor-testo.component';
import { PILASTRI, etichettaPilastro } from '../../shared/opzioni';
import { AuthService } from '../../services/auth.service';

/** Modello del form news. */
interface NewsForm {
  id: number | null;
  titolo: string;
  sommario: string;
  contenuto: string;
  slug: string;
  pilastro: Pilastro;
  immagineCopertina: string;
  pubblicato: boolean;
  dataPubblicazione: string;
}

/** Form vuoto di default. */
const VUOTO: NewsForm = {
  id: null, titolo: '', sommario: '', contenuto: '', slug: '', pilastro: 'Attivita',
  immagineCopertina: '', pubblicato: false, dataPubblicazione: ''
};

/**
 * Tabella news + pannello di creazione/modifica, coerente con la UI eventi.
 * Lo slug viene generato dal titolo se lasciato vuoto.
 */
@Component({
  selector: 'fidc-news-admin',
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
        <h1>News</h1>
        <p class="scope">{{ auth.isSuperUser() ? 'Tutte le news della Federazione' : 'Le tue news' }}</p>
      </div>
      <button class="primary" (click)="nuovo()" *ngIf="!form()">Nuova news</button>
    </header>

    <!-- FORM -->
    <section class="editor hud-panel" *ngIf="form() as f" @panel>
      <h2>{{ f.id ? 'Modifica news' : 'Nuova news' }}</h2>
      <form (ngSubmit)="salva()" #fr="ngForm">
        <div class="grid">
          <label class="full"><span>Titolo</span>
            <input name="titolo" [(ngModel)]="f.titolo" required maxlength="180" />
          </label>
          <label><span>Slug (opz., auto dal titolo)</span>
            <input name="slug" [(ngModel)]="f.slug" placeholder="es. cyber-summit-2026" />
          </label>
          <label><span>Pilastro</span>
            <fidc-selezione name="pilastro" [(ngModel)]="f.pilastro"
                            [opzioni]="pilastri" etichetta="Pilastro"></fidc-selezione>
          </label>
          <label class="full"><span>Sommario</span>
            <textarea name="sommario" [(ngModel)]="f.sommario" rows="2" required
                      placeholder="Due righe che riassumono la notizia: è il testo che compare in anteprima."></textarea>
          </label>
          <label class="full"><span>Contenuto</span>
            <fidc-editor-testo name="contenuto" [(ngModel)]="f.contenuto"
                               etichetta="Contenuto della news"
                               segnaposto="Scrivi qui l'articolo. Usa la barra sopra per titoli, elenchi e collegamenti."></fidc-editor-testo>
          </label>
          <label class="full"><span>Immagine copertina (URL, opz.)</span>
            <input name="immagineCopertina" [(ngModel)]="f.immagineCopertina" placeholder="https://…" />
          </label>
          <label class="check"><span>Pubblicato</span>
            <input type="checkbox" name="pubblicato" [(ngModel)]="f.pubblicato" />
          </label>
        </div>

        <p class="error" *ngIf="errore()">{{ errore() }}</p>

        <div class="actions">
          <button type="button" class="ghost" (click)="annulla()">Annulla</button>
          <button type="submit" class="primary" [disabled]="salvataggio() || fr.invalid">
            {{ salvataggio() ? 'Salvataggio…' : (f.id ? 'Aggiorna' : 'Crea news') }}
          </button>
        </div>
      </form>
    </section>

    <!-- TABELLA -->
    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && news().length === 0">Nessuna news. Creane una con “Nuova news”.</p>

      <table *ngIf="news().length > 0">
        <thead>
          <tr>
            <th>Titolo</th><th>Pilastro</th><th>Pubblicazione</th>
            <th>Stato</th><th class="right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let n of news()">
            <td class="t">{{ n.titolo }}</td>
            <td><span class="tag">{{ etichetta(n.pilastro) }}</span></td>
            <td>{{ n.dataPubblicazione ? (n.dataPubblicazione | date:'dd/MM/yyyy') : '—' }}</td>
            <td>
              <span class="state" [class.on]="n.pubblicato">{{ n.pubblicato ? 'Pubblicata' : 'Bozza' }}</span>
            </td>
            <td class="right">
              <button class="mini" (click)="modifica(n)">Modifica</button>
              <button class="mini danger" (click)="elimina(n)">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
  `,
  styleUrl: './admin-tables.scss'
})
export class NewsAdminComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly dialogo = inject(DialogoService);

  /** Voci della tendina "Pilastro" (condivise con la gestione eventi). */
  readonly pilastri = PILASTRI;
  readonly auth = inject(AuthService);

  readonly news = signal<News[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  readonly form = signal<NewsForm | null>(null);

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.carica();
    // Arrivando dalle azioni rapide del pannello (?nuovo=1) il modulo è già aperto.
    if (this.route.snapshot.queryParamMap.get('nuovo') === '1') this.nuovo();
  }

  /** (Ri)carica la lista gestibile. */
  private carica(): void {
    this.caricamento.set(true);
    this.api.getNewsGestione().subscribe({
      next: (l) => this.news.set(l),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  /** Apre il form vuoto. */
  etichetta(v: string): string { return etichettaPilastro(v); }

  nuovo(): void { this.errore.set(null); this.form.set({ ...VUOTO }); }

  /** Apre il form precompilato per la modifica. */
  modifica(n: News): void {
    this.errore.set(null);
    this.form.set({
      id: n.id,
      titolo: n.titolo,
      sommario: n.sommario,
      contenuto: n.contenuto,
      slug: n.slug,
      pilastro: n.pilastro,
      immagineCopertina: n.immagineCopertina ?? '',
      pubblicato: n.pubblicato,
      dataPubblicazione: n.dataPubblicazione ?? ''
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

    const slug = (f.slug.trim() || this.slugify(f.titolo));
    // Alla prima pubblicazione, valorizza la data se assente.
    const dataPub = f.pubblicato
      ? (f.dataPubblicazione || new Date().toISOString())
      : (f.dataPubblicazione || null);

    const body: Partial<News> = {
      titolo: f.titolo.trim(),
      sommario: f.sommario.trim(),
      contenuto: f.contenuto.trim(),
      slug,
      pilastro: f.pilastro,
      immagineCopertina: f.immagineCopertina.trim() || null,
      pubblicato: f.pubblicato,
      dataPubblicazione: dataPub
    };

    const op = f.id
      ? this.api.aggiornaNews(f.id, body)
      : this.api.creaNews(body);

    op.subscribe({
      next: () => { this.salvataggio.set(false); this.form.set(null); this.carica(); },
      error: () => { this.salvataggio.set(false); this.errore.set('Salvataggio non riuscito. Verifica i dati e riprova.'); }
    });
  }

  /** Elimina la news, previa conferma esplicita. */
  async elimina(n: News): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Eliminare questa news?',
      messaggio: `"${n.titolo}" verrà rimossa dal sito pubblico e dall'archivio. L'operazione non è reversibile.`,
      azione: 'Elimina',
      distruttiva: true
    });
    if (!ok) return;

    this.api.eliminaNews(n.id).subscribe({
      next: () => this.news.set(this.news().filter((x) => x.id !== n.id)),
      error: () => this.dialogo.avvisa(
        'Eliminazione non riuscita',
        'La news è ancora al suo posto. Riprova; se il problema persiste, verifica che il server sia raggiungibile.'
      )
    });
  }

  /** Genera uno slug URL-safe dal titolo. */
  private slugify(s: string): string {
    return s.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }
}
