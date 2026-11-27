// =============================================================================
//  frontend/src/app/pages/admin/news-admin.component.ts
//  BACKOFFICE — Gestione News (CRUD) con il flusso di revisione
//  (shared/flusso.ts): bozza → in revisione → pubblicata, oppure pubblicazione
//  diretta per chi ne ha il permesso. La lista la filtra il server in base ai
//  permessi; qui bottoni e filtri seguono la matrice. Solo palette FIDC.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, News, Pilastro, StatoContenuto, statoDi } from '../../services/fidc-api.service';
import { Flusso, etichettaStato } from '../../shared/flusso';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
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
  /** Stato e autore del contenuto aperto (null per una news nuova). */
  stato: StatoContenuto | null;
  autore: number | null;
  notaRevisione: string | null;
}

/** Form vuoto di default. */
const VUOTO: NewsForm = {
  id: null, titolo: '', sommario: '', contenuto: '', slug: '', pilastro: 'Attivita',
  immagineCopertina: '', pubblicato: false, dataPubblicazione: '',
  stato: null, autore: null, notaRevisione: null
};

/**
 * Tabella news + pannello di creazione/modifica, coerente con la UI eventi.
 * Lo slug viene generato dal titolo se lasciato vuoto.
 */
@Component({
  selector: 'fidc-news-admin',
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
        <h1>News</h1>
        <p class="scope">{{ auth.isSuperUser() ? 'Tutte le news della Federazione'
          : flusso.revisiona ? 'Le tue news e quelle che attendono la tua revisione' : 'Le tue news' }}</p>
      </div>
      <button class="primary" (click)="nuovo()" *ngIf="!form() && flusso.puoCreare">Nuova news</button>
    </header>

    <!-- FORM -->
    <section class="editor hud-panel" *ngIf="form() as f" @panel>
      <h2>{{ f.id ? (revisioneInCorso(f) ? 'Revisione della news' : 'Modifica news') : 'Nuova news' }}</h2>
      <div class="nota-revisione" *ngIf="f.stato === 'DaRivedere' && f.notaRevisione" role="note">
        <strong>Nota del revisore</strong>
        <p>{{ f.notaRevisione }}</p>
      </div>
      <p class="flusso-info" *ngIf="!f.id && !flusso.pubblicaDaSe">
        Quando la invii, la news passa a chi la revisiona: sarà pubblicata dopo l'approvazione.
      </p>
      <form (ngSubmit)="salva(statoPrincipale(f))" #fr="ngForm">
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

    <!-- TABELLA -->
    <!-- Ricerca e filtro per stato: con molti contenuti si trova subito quello giusto. -->
    <div class="filtri-tabella" *ngIf="news().length > 0" role="search">
      <label class="cerca">
        <span class="sr-only">Cerca news</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="search" [value]="cerca()" (input)="cerca.set($any($event.target).value)" placeholder="Cerca per titolo o sommario" />
      </label>
      <div class="segmenti" role="group" aria-label="Stato">
        <button type="button" [class.on]="stato() === 'tutti'" [attr.aria-pressed]="stato() === 'tutti'" (click)="stato.set('tutti')">Tutte <span>{{ news().length }}</span></button>
        <button type="button" *ngIf="flusso.revisiona" [class.on]="stato() === 'approvare'" [attr.aria-pressed]="stato() === 'approvare'" (click)="stato.set('approvare')">Da approvare <span>{{ conteggio('approvare') }}</span></button>
        <button type="button" [class.on]="stato() === 'lavorazione'" [attr.aria-pressed]="stato() === 'lavorazione'" (click)="stato.set('lavorazione')">Non pubblicate <span>{{ conteggio('lavorazione') }}</span></button>
        <button type="button" [class.on]="stato() === 'pubblicati'" [attr.aria-pressed]="stato() === 'pubblicati'" (click)="stato.set('pubblicati')">Pubblicate <span>{{ conteggio('pubblicati') }}</span></button>
      </div>
    </div>

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="news().length > 0 && visibili().length === 0">Nessun risultato con questi filtri.</p>
      <p class="empty" *ngIf="!caricamento() && news().length === 0">{{ flusso.puoCreare ? 'Nessuna news. Creane una con “Nuova news”.' : 'Nessuna news da rivedere per ora.' }}</p>

      <table *ngIf="news().length > 0">
        <thead>
          <tr>
            <th>Titolo</th><th>Pilastro</th><th>Pubblicazione</th>
            <th>Stato</th><th class="right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let n of visibili()">
            <td class="t">{{ n.titolo }}</td>
            <td><span class="tag">{{ etichetta(n.pilastro) }}</span></td>
            <td>{{ n.dataPubblicazione ? (n.dataPubblicazione | date:'dd/MM/yyyy') : '—' }}</td>
            <td>
              <span class="state" [ngClass]="classeStato(n)" [attr.title]="n.notaRevisione || null">{{ etichetta2(n) }}</span>
            </td>
            <td class="right">
              <ng-container *ngIf="flusso.puoRevisionare(c(n))">
                <button class="mini evidenza" (click)="approva(n)">Approva</button>
                <button class="mini" (click)="rimanda(n)">Rimanda</button>
              </ng-container>
              <button class="mini" *ngIf="flusso.puoModificare(c(n))" (click)="modifica(n)">{{ flusso.puoRevisionare(c(n)) ? 'Apri' : 'Modifica' }}</button>
              <button class="mini danger" *ngIf="flusso.puoEliminare(c(n))" (click)="elimina(n)">Elimina</button>
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
  private readonly avvisi = inject(AvvisiService);

  /** Voci della tendina "Pilastro" (condivise con la gestione eventi). */
  readonly pilastri = PILASTRI;
  readonly auth = inject(AuthService);
  /** Regole del flusso di revisione per le news, secondo i permessi. */
  readonly flusso = new Flusso(this.auth, 'news');

  readonly news = signal<News[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);
  readonly errore = signal<string | null>(null);
  readonly form = signal<NewsForm | null>(null);

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

  /** Il contenuto visto dal flusso di revisione. */
  c(n: News) { return { pubblicato: n.pubblicato, stato: n.stato, autore: n.autoreId }; }

  private passa(n: News, filtro: string): boolean {
    const st = statoDi(n);
    switch (filtro) {
      case 'approvare': return this.flusso.puoRevisionare(this.c(n));
      case 'lavorazione': return st !== 'Pubblicato';
      case 'pubblicati': return st === 'Pubblicato';
      default: return true;
    }
  }

  conteggio(filtro: string): number { return this.news().filter((x) => this.passa(x, filtro)).length; }

  etichetta2(n: News): string { return etichettaStato(statoDi(n), true); }
  classeStato(n: News): Record<string, boolean> {
    const st = statoDi(n);
    return { on: st === 'Pubblicato', attesa: st === 'InRevisione', rivedere: st === 'DaRivedere' };
  }

  /** Righe mostrate: filtro per stato + ricerca su titolo, sommario e pilastro, senza maiuscole. */
  readonly visibili = computed(() => {
    const q = this.cerca().trim().toLowerCase();
    const st = this.stato();
    return this.news().filter((x) => this.passa(x, st) &&
      (!q || [x.titolo, x.sommario, x.pilastro].join(' ').toLowerCase().includes(q)));
  });

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
      dataPubblicazione: n.dataPubblicazione ?? '',
      stato: statoDi(n),
      autore: n.autoreId,
      notaRevisione: n.notaRevisione ?? null
    });
  }

  /** Il modulo aperto è una revisione: contenuto altrui in attesa di approvazione. */
  revisioneInCorso(f: NewsForm): boolean {
    return !!f.id && f.autore !== null && this.flusso.puoRevisionare({ stato: f.stato ?? undefined, autore: f.autore });
  }

  /** Stato che assume la news premendo il bottone principale. */
  statoPrincipale(f: NewsForm): StatoContenuto {
    return this.flusso.statoAlSalvataggio(f.id && f.autore !== null ? { stato: f.stato ?? undefined, autore: f.autore } : null);
  }

  /** Testo del bottone principale: dice esattamente che cosa succede. */
  etichettaPrincipale(f: NewsForm): string {
    if (this.statoPrincipale(f) === 'InRevisione') return 'Invia in revisione';
    return f.stato === 'Pubblicato' ? 'Aggiorna' : 'Pubblica';
  }

  /** Chiude il form senza salvare. */
  annulla(): void { this.form.set(null); this.errore.set(null); }

  /** Crea o aggiorna la news con lo stato scelto dal bottone premuto. */
  salva(stato: StatoContenuto): void {
    const f = this.form();
    if (!f || this.salvataggio()) return;
    this.salvataggio.set(true);
    this.errore.set(null);

    const slug = (f.slug.trim() || this.slugify(f.titolo));
    const pubblica = stato === 'Pubblicato';
    // Alla prima pubblicazione, valorizza la data se assente.
    const dataPub = pubblica
      ? (f.dataPubblicazione || new Date().toISOString())
      : (f.dataPubblicazione || null);

    const body: Partial<News> = {
      titolo: f.titolo.trim(),
      sommario: f.sommario.trim(),
      contenuto: f.contenuto.trim(),
      slug,
      pilastro: f.pilastro,
      immagineCopertina: f.immagineCopertina.trim() || null,
      pubblicato: pubblica,
      dataPubblicazione: dataPub,
      stato
    };

    const op = f.id
      ? this.api.aggiornaNews(f.id, body)
      : this.api.creaNews(body);

    const esito: Record<StatoContenuto, [string, string]> = {
      Pubblicato: [this.revisioneInCorso(f) ? 'News approvata' : f.stato === 'Pubblicato' ? 'News aggiornata' : 'News pubblicata', 'È visibile sul sito.'],
      InRevisione: ['News inviata in revisione', 'Sarà pubblicata dopo l\'approvazione.'],
      DaRivedere: ['News rimandata all\'autore', ''],
      Bozza: ['Bozza salvata', 'Non è visibile sul sito finché non la pubblichi o la invii in revisione.']
    };

    op.subscribe({
      next: () => {
        this.salvataggio.set(false); this.form.set(null); this.carica();
        this.avvisi.conferma(esito[stato][0], esito[stato][1]);
      },
      error: () => { this.salvataggio.set(false); this.errore.set('Salvataggio non riuscito. Verifica i dati e riprova.'); }
    });
  }

  /** Approva una news in revisione: viene pubblicata. */
  approva(n: News): void {
    this.api.approva('news', n.id).subscribe({
      next: () => {
        this.news.set(this.news().map((x) => x.id === n.id ? { ...x, stato: 'Pubblicato', pubblicato: true, notaRevisione: null } : x));
        this.avvisi.conferma('News approvata', n.titolo);
      },
      error: () => this.dialogo.avvisa('Approvazione non riuscita', 'La news è ancora in revisione. Riprova tra qualche istante.')
    });
  }

  /** Rimanda una news all'autore con una nota obbligatoria. */
  async rimanda(n: News): Promise<void> {
    const nota = await this.dialogo.chiedi({
      titolo: 'Rimandare la news all\'autore?',
      messaggio: `"${n.titolo}" torna all'autore con la tua nota e non sarà pubblicata finché non la rimanda in revisione.`,
      azione: 'Rimanda',
      campo: { etichetta: 'Nota per l\'autore', segnaposto: 'Che cosa va corretto o completato?', obbligatorio: true }
    });
    if (nota === null) return;
    this.api.rimanda('news', n.id, nota).subscribe({
      next: () => {
        this.news.set(this.news().map((x) => x.id === n.id ? { ...x, stato: 'DaRivedere', pubblicato: false, notaRevisione: nota } : x));
        if (this.form()?.id === n.id) this.form.set(null);
        this.avvisi.conferma('News rimandata all\'autore', n.titolo);
      },
      error: () => this.dialogo.avvisa('Invio della nota non riuscito', 'La news è ancora in revisione. Riprova tra qualche istante.')
    });
  }

  /** "Rimanda all'autore" dal modulo di revisione. */
  rimandaDalModulo(f: NewsForm): void {
    const n = this.news().find((x) => x.id === f.id);
    if (n) this.rimanda(n);
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
      next: () => { this.news.set(this.news().filter((x) => x.id !== n.id)); this.avvisi.conferma('News eliminata', n.titolo); },
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
