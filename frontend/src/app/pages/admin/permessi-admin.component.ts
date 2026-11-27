// =============================================================================
//  frontend/src/app/pages/admin/permessi-admin.component.ts
//  BACKOFFICE — PERMESSI (solo Direzione).
//
//  La matrice persone × permessi che sostituisce i ruoli fissi. Stessa
//  grammatica delle altre sezioni del CMS (admin-tables.scss): intestazione,
//  pannello di modifica in alto, ricerca e filtri, tabella. Chi sa usare la
//  gestione news sa usare questa pagina.
//
//  Due modi di lavorare, per due bisogni diversi:
//   - nella MATRICE si accendono e spengono i permessi di più persone, un'area
//     alla volta (le colonne di tutte le aree insieme non starebbero in pagina);
//     le modifiche restano in sospeso finché non si salva;
//   - nel PANNELLO di una persona si vede tutto il suo assetto, con le
//     descrizioni per esteso e i modelli da cui partire.
//
//  Regole di coerenza (shared/permessi.ts): "Pubblica da sé" richiede
//  "Scrive"; la Direzione implica tutto; nessuno può togliere la Direzione a
//  se stesso, così la piattaforma non resta mai senza chi la governa.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FidcApiService, UtenteAdmin } from '../../services/fidc-api.service';
import { AuthService } from '../../services/auth.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import {
  AREE_PERMESSI, AreaPermessi, AssettoPermessi, MODELLI, ModelloPermessi, Permesso, VocePermesso,
  assettoDaRuolo, livello, modelloDi, normalizza, riassunto
} from '../../shared/permessi';

/** Riga della matrice: la persona e il suo assetto (salvato e in modifica). */
interface Riga {
  utente: UtenteAdmin;
  salvato: AssettoPermessi;
  attuale: AssettoPermessi;
}

const stessoAssetto = (a: AssettoPermessi, b: AssettoPermessi) =>
  a.direzione === b.direzione && [...a.permessi].sort().join() === [...b.permessi].sort().join();

@Component({
  selector: 'fidc-permessi-admin',
  standalone: true,
  animations: [
    trigger('panel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px)' }),
        animate('260ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('barra', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(12px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'none' }))]),
      transition(':leave', [animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(12px)' }))])
    ])
  ],
  template: `
  <div class="page">
    <header class="head">
      <div>
        <h1>Permessi</h1>
        <p class="scope">Chi può scrivere, pubblicare e rivedere i contenuti, e chi amministra il sito.
           Solo la Direzione modifica questa pagina.</p>
      </div>
    </header>

    <!-- I tre livelli, spiegati una volta: il resto della pagina li dà per noti. -->
    <ul class="livelli" aria-label="Livelli di accesso">
      <li><span class="state">Socio</span> Nessun permesso: area personale e newsletter. È il livello di chi si iscrive da solo.</li>
      <li><span class="state redazione">Redazione</span> Uno o più permessi sui contenuti o sull'amministrazione, assegnati qui.</li>
      <li><span class="state on">Direzione</span> Controllo completo, compresa questa pagina.</li>
    </ul>

    <!-- PANNELLO DI UNA PERSONA -->
    @if (inModifica(); as r) {
      <section class="editor hud-panel" @panel aria-labelledby="t-persona">
        <div class="ed-testa">
          <div>
            <h2 id="t-persona">Permessi di {{ r.utente.nome }} {{ r.utente.cognome }}</h2>
            <p class="ed-riassunto">{{ riassuntoDi(r.attuale) }}</p>
          </div>
          <span class="state" [class.on]="livelloDi(r.attuale) === 'Direzione'"
                [class.redazione]="livelloDi(r.attuale) === 'Redazione'">{{ livelloDi(r.attuale) }}</span>
        </div>

        <fieldset class="modelli">
          <legend>Parti da un modello</legend>
          <div class="modelli-griglia">
            @for (m of modelli; track m.chiave) {
              <button type="button" class="modello" [class.on]="modelloAttivo(r)?.chiave === m.chiave"
                      [attr.aria-pressed]="modelloAttivo(r)?.chiave === m.chiave"
                      [disabled]="eMe(r) && !m.assetto.direzione"
                      (click)="applicaModello(r, m)">
                <strong>{{ m.nome }}</strong>
                <span>{{ m.descrizione }}</span>
              </button>
            }
          </div>
          <p class="nota">Un modello è solo un punto di partenza: dopo puoi accendere o spegnere i singoli permessi.</p>
        </fieldset>

        <label class="check direzione">
          <span class="spunta"><input type="checkbox" [checked]="r.attuale.direzione" [disabled]="eMe(r)"
                 (change)="impostaDirezione(r, $any($event.target).checked)" /><span class="casella" aria-hidden="true"></span></span>
          <span><strong>Direzione</strong> — controllo completo della piattaforma, compresi i permessi
            @if (eMe(r)) { <em>(non puoi toglierla a te stesso)</em> }</span>
        </label>

        <div class="aree" [class.spente]="r.attuale.direzione">
          @for (a of aree; track a.chiave) {
            <fieldset class="area">
              <legend>{{ a.nome }}</legend>
              @for (v of a.voci; track v.chiave) {
                <label class="check" [class.bloccata]="bloccata(r, v)">
                  <span class="spunta"><input type="checkbox" [checked]="attivo(r, v.chiave)" [disabled]="bloccata(r, v)"
                         (change)="imposta(r, v.chiave, $any($event.target).checked)" /><span class="casella" aria-hidden="true"></span></span>
                  <span><strong>{{ v.breve }}</strong>{{ v.descrizione }}
                    @if (v.richiede && !attivo(r, v.richiede) && !r.attuale.direzione) { <em>Richiede “{{ nomeDi(v.richiede) }}”.</em> }
                  </span>
                </label>
              }
            </fieldset>
          }
        </div>

        <div class="actions">
          <button type="button" class="ghost" (click)="chiudiPannello()">Chiudi</button>
          <button type="button" class="primary" [disabled]="!modificata(r) || salvataggio()" (click)="salva([r])">
            {{ salvataggio() ? 'Salvataggio…' : 'Salva permessi' }}
          </button>
        </div>
      </section>
    }

    <!-- RICERCA E FILTRI -->
    @if (righe().length > 0) {
      <div class="filtri-tabella" role="search">
        <label class="cerca">
          <span class="sr-only">Cerca persone</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input type="search" [value]="cerca()" (input)="cerca.set($any($event.target).value)" placeholder="Cerca per nome o email" />
        </label>
        <div class="segmenti" role="group" aria-label="Area dei permessi">
          @for (a of aree; track a.chiave) {
            <button type="button" [class.on]="area().chiave === a.chiave" [attr.aria-pressed]="area().chiave === a.chiave"
                    (click)="areaScelta.set(a.chiave)">{{ a.nome }}</button>
          }
        </div>
        <div class="segmenti" role="group" aria-label="Persone mostrate">
          <button type="button" [class.on]="chi() === 'incarichi'" [attr.aria-pressed]="chi() === 'incarichi'" (click)="chi.set('incarichi')">Con incarichi <span>{{ conIncarichi() }}</span></button>
          <button type="button" [class.on]="chi() === 'tutti'" [attr.aria-pressed]="chi() === 'tutti'" (click)="chi.set('tutti')">Tutti gli account <span>{{ righe().length }}</span></button>
        </div>
      </div>
    }

    <!-- MATRICE -->
    <section class="table-wrap hud-panel matrice">
      @if (caricamento()) { <p class="empty">Caricamento delle persone…</p> }
      @else if (righe().length === 0) { <p class="empty">Nessun account. Le persone compaiono qui dopo la registrazione.</p> }
      @else if (visibili().length === 0) { <p class="empty">Nessuna persona con questi filtri.</p> }
      @else {
        <table>
          <caption class="sr-only">Permessi dell'area {{ area().nome }} per persona</caption>
          <thead>
            <tr>
              <th scope="col" class="col-persona">Persona</th>
              <th scope="col" class="c">Direzione</th>
              @for (v of area().voci; track v.chiave) {
                <th scope="col" class="c" [attr.title]="v.descrizione">{{ v.breve }}</th>
              }
              <th scope="col" class="right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            @for (r of visibili(); track r.utente.id) {
              <tr [class.modificata]="modificata(r)" [class.aperta]="inModifica()?.utente?.id === r.utente.id">
                <th scope="row" class="col-persona">
                  <strong>{{ r.utente.nome }} {{ r.utente.cognome }}</strong>
                  <small>{{ r.utente.email }}</small>
                  <small class="riga-riassunto">{{ riassuntoDi(r.attuale) }}</small>
                </th>
                <td class="c">
                  <label class="spunta">
                    <input type="checkbox" [checked]="r.attuale.direzione" [disabled]="eMe(r)"
                           (change)="impostaDirezione(r, $any($event.target).checked)" />
                    <span class="casella" aria-hidden="true"></span>
                    <span class="sr-only">Direzione a {{ r.utente.nome }} {{ r.utente.cognome }}</span>
                  </label>
                </td>
                @for (v of area().voci; track v.chiave) {
                  <td class="c">
                    <label class="spunta" [attr.title]="titoloCella(r, v)">
                      <input type="checkbox" [checked]="attivo(r, v.chiave)" [disabled]="bloccata(r, v)"
                             (change)="imposta(r, v.chiave, $any($event.target).checked)" />
                      <span class="casella" aria-hidden="true"></span>
                      <span class="sr-only">{{ v.descrizione }}: {{ r.utente.nome }} {{ r.utente.cognome }}</span>
                    </label>
                  </td>
                }
                <td class="right">
                  <button type="button" class="mini" (click)="apri(r)">Dettaglio</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>

    <!-- MODIFICHE IN SOSPESO -->
    @if (inSospeso().length > 0) {
      <div class="sospese" role="status" @barra>
        <p><strong>{{ inSospeso().length === 1 ? '1 persona modificata' : inSospeso().length + ' persone modificate' }}</strong>
           I permessi cambiano solo dopo il salvataggio.</p>
        <div class="sospese-azioni">
          <button type="button" class="ghost" (click)="annullaTutto()">Annulla modifiche</button>
          <button type="button" class="primary" [disabled]="salvataggio()" (click)="salva(inSospeso())">
            {{ salvataggio() ? 'Salvataggio…' : 'Salva modifiche' }}
          </button>
        </div>
      </div>
    }
  </div>
  `,
  styleUrls: ['./admin-tables.scss', './permessi-admin.component.scss']
})
export class PermessiAdminComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly auth = inject(AuthService);
  private readonly dialogo = inject(DialogoService);
  private readonly avvisi = inject(AvvisiService);
  private readonly route = inject(ActivatedRoute);

  readonly aree = AREE_PERMESSI;
  readonly modelli = MODELLI;

  readonly righe = signal<Riga[]>([]);
  readonly caricamento = signal(true);
  readonly salvataggio = signal(false);

  readonly cerca = signal('');
  readonly areaScelta = signal<AreaPermessi['chiave']>('news');
  readonly area = computed(() => this.aree.find((a) => a.chiave === this.areaScelta()) ?? this.aree[0]);
  readonly chi = signal<'incarichi' | 'tutti'>('incarichi');

  /** Id della persona aperta nel pannello. */
  private readonly idAperto = signal<number | null>(null);
  readonly inModifica = computed(() => this.righe().find((r) => r.utente.id === this.idAperto()) ?? null);

  readonly conIncarichi = computed(() => this.righe().filter((r) => this.haIncarichi(r)).length);
  readonly inSospeso = computed(() => this.righe().filter((r) => this.modificata(r)));

  readonly visibili = computed(() => {
    const q = this.cerca().trim().toLowerCase();
    const tutti = this.chi() === 'tutti';
    return this.righe().filter((r) =>
      (tutti || this.haIncarichi(r)) &&
      (!q || `${r.utente.nome} ${r.utente.cognome} ${r.utente.email}`.toLowerCase().includes(q)));
  });

  ngOnInit(): void {
    this.api.getUtenti().subscribe({
      next: (lista) => {
        this.righe.set(lista.map((u) => {
          const a = this.assettoDi(u);
          return { utente: u, salvato: a, attuale: { ...a, permessi: [...a.permessi] } };
        }));
        // Arrivando da "Account" con ?persona=ID si apre direttamente il suo pannello.
        const id = Number(this.route.snapshot.queryParamMap.get('persona'));
        if (id && this.righe().some((r) => r.utente.id === id)) this.idAperto.set(id);
      },
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  // --- lettura ---------------------------------------------------------------

  /** Assetto di un account: dal server se c'è, altrimenti dal ruolo storico. */
  private assettoDi(u: UtenteAdmin): AssettoPermessi {
    if (u.direzione !== undefined || u.permessi !== undefined)
      return { direzione: !!u.direzione, permessi: normalizza(u.permessi ?? []) };
    return assettoDaRuolo(u.ruolo);
  }

  private haIncarichi(r: Riga): boolean {
    return r.attuale.direzione || r.attuale.permessi.length > 0 || this.modificata(r);
  }

  eMe(r: Riga): boolean { return r.utente.id === this.auth.userId(); }
  attivo(r: Riga, p: Permesso): boolean { return r.attuale.direzione || r.attuale.permessi.includes(p); }
  modificata(r: Riga): boolean { return !stessoAssetto(r.salvato, r.attuale); }
  livelloDi(a: AssettoPermessi) { return livello(a); }
  riassuntoDi(a: AssettoPermessi) { return riassunto(a); }
  modelloAttivo(r: Riga): ModelloPermessi | null { return modelloDi(r.attuale); }

  /** Casella non modificabile: la Direzione implica tutto, o manca il prerequisito. */
  bloccata(r: Riga, v: VocePermesso): boolean {
    return r.attuale.direzione || (!!v.richiede && !r.attuale.permessi.includes(v.richiede));
  }

  titoloCella(r: Riga, v: VocePermesso): string {
    if (r.attuale.direzione) return 'Incluso nella Direzione';
    if (v.richiede && !r.attuale.permessi.includes(v.richiede)) return `Richiede “${this.nomeDi(v.richiede)}”`;
    return v.descrizione;
  }

  nomeDi(p: Permesso): string {
    for (const a of this.aree) for (const v of a.voci) if (v.chiave === p) return v.breve;
    return p;
  }

  // --- modifica --------------------------------------------------------------

  private aggiorna(r: Riga, nuovo: AssettoPermessi): void {
    const attuale = { direzione: nuovo.direzione, permessi: normalizza(nuovo.permessi) };
    this.righe.set(this.righe().map((x) => (x.utente.id === r.utente.id ? { ...x, attuale } : x)));
  }

  imposta(r: Riga, p: Permesso, acceso: boolean): void {
    const set = new Set(r.attuale.permessi);
    if (acceso) set.add(p); else set.delete(p);
    this.aggiorna(r, { direzione: r.attuale.direzione, permessi: [...set] });
  }

  impostaDirezione(r: Riga, acceso: boolean): void {
    if (this.eMe(r) && !acceso) return;
    this.aggiorna(r, { direzione: acceso, permessi: r.attuale.permessi });
  }

  applicaModello(r: Riga, m: ModelloPermessi): void {
    if (this.eMe(r) && !m.assetto.direzione) return;
    this.aggiorna(r, { direzione: m.assetto.direzione, permessi: [...m.assetto.permessi] });
  }

  apri(r: Riga): void {
    this.idAperto.set(r.utente.id);
    queueMicrotask(() => document.getElementById('t-persona')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  chiudiPannello(): void { this.idAperto.set(null); }

  annullaTutto(): void {
    this.righe.set(this.righe().map((r) => ({ ...r, attuale: { ...r.salvato, permessi: [...r.salvato.permessi] } })));
  }

  // --- salvataggio -----------------------------------------------------------

  /**
   * Salva le righe indicate una per una. Chi riesce viene aggiornato; chi non
   * riesce resta "in sospeso", così si vede subito cosa riprovare.
   */
  salva(righe: Riga[]): void {
    if (!righe.length || this.salvataggio()) return;
    this.salvataggio.set(true);
    let rimaste = righe.length, riuscite = 0;
    const fallite: string[] = [];
    const fine = () => {
      if (--rimaste > 0) return;
      this.salvataggio.set(false);
      if (riuscite) this.avvisi.conferma('Permessi salvati',
        riuscite === 1 ? '1 persona aggiornata.' : `${riuscite} persone aggiornate.`);
      if (fallite.length) this.dialogo.avvisa('Alcuni permessi non sono stati salvati',
        `Restano da salvare: ${fallite.join(', ')}. Riprova tra qualche istante.`);
    };
    for (const r of righe) {
      const assetto = r.attuale;
      this.api.salvaPermessi(r.utente.id, assetto).subscribe({
        next: () => {
          riuscite++;
          this.righe.set(this.righe().map((x) => x.utente.id === r.utente.id
            ? { ...x, salvato: { ...assetto, permessi: [...assetto.permessi] } } : x));
          fine();
        },
        error: () => { fallite.push(`${r.utente.nome} ${r.utente.cognome}`); fine(); }
      });
    }
  }
}
