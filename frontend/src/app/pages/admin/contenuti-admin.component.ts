// =============================================================================
//  frontend/src/app/pages/admin/contenuti-admin.component.ts
//  BACKOFFICE — CONTENUTI DEL SITO (permesso sito.contenuti).
//
//  Tutti i testi e i dati del sito pubblico: nome e simbolo, slogan, annuncio,
//  contenuti in evidenza, pilastri, chi siamo, numeri, missione, governance,
//  progetti, newsletter, recapiti. Niente è scritto nel codice.
//
//  Stessa grammatica delle altre sezioni del CMS (admin-tables.scss):
//  intestazione, filtri a segmenti, pannello di modifica, barra delle
//  modifiche in sospeso (come in Permessi).
//
//  La bozza vive in ContenutiService, non qui: così si può passare
//  all'anteprima del sito e tornare senza perdere nulla. Si salva tutto
//  insieme con un solo bottone.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ContenutiService, copia } from '../../services/contenuti.service';
import { VetrinaService } from '../../services/vetrina.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { SelezioneComponent, OpzioneSelezione } from '../../shared/campi/selezione.component';
import { EmblemaTemaComponent } from '../../shared/emblemi/emblema-tema.component';
import { ContenutiSito, SLOGAN_MAX } from '../../content/home-content';
import { ChiaveLegale, PERCORSI_LEGALI, daCompletare } from '../../content/testi-legali';
import { EditorTestoComponent } from '../../shared/campi/editor-testo.component';

type Sezione = 'identita' | 'apertura' | 'evidenza' | 'pilastri' | 'associazione' | 'progetti' | 'newsletter' | 'contatti' | 'legali';

/** Emblemi selezionabili, con il nome che vede la redazione. */
const EMBLEMI: OpzioneSelezione[] = [
  { valore: 'verifica', etichetta: 'Scudo con spunta (sicurezza)' },
  { valore: 'lucchetto', etichetta: 'Lucchetto (accesso, protezione)' },
  { valore: 'chiave', etichetta: 'Chiave (credenziali)' },
  { valore: 'impronta', etichetta: 'Impronta (identità)' },
  { valore: 'rete', etichetta: 'Rete (collaborazione)' },
  { valore: 'documento', etichetta: 'Documento (atti, segreteria)' },
  { valore: 'bilancia', etichetta: 'Bilancia (regole, garanzia)' },
  { valore: 'libro', etichetta: 'Libro (formazione)' },
  { valore: 'grafico', etichetta: 'Grafico (ricerca, dati)' },
  { valore: 'chip', etichetta: 'Processore (tecnologia, IA)' },
  { valore: 'calendario', etichetta: 'Calendario (eventi)' },
  { valore: 'persona', etichetta: 'Persona (soci, persone)' },
  { valore: 'busta', etichetta: 'Busta (comunicazione)' },
  { valore: 'bussola', etichetta: 'Bussola (indirizzo strategico)' },
  { valore: 'monitor', etichetta: 'Monitor (osservatorio)' }
];

const SCENE: OpzioneSelezione[] = [
  { valore: 'gruppo-di-lavoro', etichetta: 'Gruppo di lavoro alla lavagna' },
  { valore: 'conferenza', etichetta: 'Conferenza con pubblico' },
  { valore: 'formazione', etichetta: 'Aula di formazione' },
  { valore: 'analisi', etichetta: 'Analisi dei dati' },
  { valore: 'consulenza', etichetta: 'Colloquio di consulenza' }
];

const STATI_PROGETTO: OpzioneSelezione[] = [
  { valore: 'In avvio', etichetta: 'In avvio' },
  { valore: 'In corso', etichetta: 'In corso' },
  { valore: 'Completato', etichetta: 'Completato' }
];

const RETI: OpzioneSelezione[] = ['LinkedIn', 'Facebook', 'Instagram', 'YouTube', 'X'].map((r) => ({ valore: r, etichetta: r }));

@Component({
  selector: 'fidc-contenuti-admin',
  standalone: true,
  imports: [FormsModule, SelezioneComponent, EmblemaTemaComponent, EditorTestoComponent],
  animations: [
    trigger('panel', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(-8px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'none' }))])
    ]),
    trigger('barra', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(12px)' }), animate('220ms ease-out', style({ opacity: 1, transform: 'none' }))]),
      transition(':leave', [animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(12px)' }))])
    ])
  ],
  templateUrl: './contenuti-admin.component.html',
  styleUrls: ['./admin-tables.scss', './contenuti-admin.component.scss']
})
export class ContenutiAdminComponent implements OnInit {
  private readonly servizio = inject(ContenutiService);
  private readonly vetrina = inject(VetrinaService);
  private readonly avvisi = inject(AvvisiService);
  private readonly dialogo = inject(DialogoService);
  private readonly router = inject(Router);

  readonly sezioni: { chiave: Sezione; nome: string; descrizione: string }[] = [
    { chiave: 'identita', nome: 'Identità', descrizione: 'Il nome dell’ente come compare accanto al simbolo, nelle intestazioni e nel piè di pagina.' },
    { chiave: 'apertura', nome: 'Apertura e annuncio', descrizione: 'La prima cosa che si vede: slogan, presentazione, bottoni e l’annuncio nella fascia sotto.' },
    { chiave: 'evidenza', nome: 'In evidenza', descrizione: 'Quale news apre la sezione notizie e quale evento va in testa. Senza scelta decide la data.' },
    { chiave: 'pilastri', nome: 'Pilastri', descrizione: 'I quattro ambiti della Federazione: testi, illustrazione ed emblema di ciascuno.' },
    { chiave: 'associazione', nome: 'Associazione', descrizione: 'Chi siamo, numeri chiave, missione e organi di governo. Le parti vuote non compaiono sul sito.' },
    { chiave: 'progetti', nome: 'Progetti', descrizione: 'I progetti in evidenza. Il primo apre la sezione in grande. Senza progetti la sezione non compare.' },
    { chiave: 'newsletter', nome: 'Newsletter', descrizione: 'Il riquadro di iscrizione in fondo alla home.' },
    { chiave: 'contatti', nome: 'Contatti', descrizione: 'Recapiti e profili social nel piè di pagina. Si mostrano solo quelli compilati.' },
    { chiave: 'legali', nome: 'Pagine legali', descrizione: 'Privacy, cookie, note legali e accessibilità. Sono bozze: completa le parti tra parentesi quadre e falle verificare a un legale prima della pubblicazione.' }
  ];

  /** Le pagine legali, nell'ordine in cui compaiono nel piè di pagina. */
  readonly pagineLegali: { chiave: ChiaveLegale; percorso: string }[] =
    (Object.keys(PERCORSI_LEGALI) as ChiaveLegale[]).map((k) => ({ chiave: k, percorso: PERCORSI_LEGALI[k] }));
  daCompletare(testo: string): boolean { return daCompletare(testo); }
  readonly sezione = signal<Sezione>('identita');
  readonly corrente = computed(() => this.sezioni.find((s) => s.chiave === this.sezione())!);

  readonly emblemi = EMBLEMI;
  readonly scene = SCENE;
  readonly statiProgetto = STATI_PROGETTO;
  readonly reti = RETI;
  readonly sloganMax = SLOGAN_MAX;

  /** Bozza in lavorazione (condivisa con l'anteprima). */
  get b(): ContenutiSito { return this.servizio.bozza()!; }

  readonly salvataggio = signal(false);

  /** La bozza è pronta (si crea all'apertura della pagina). */
  servizioPronto(): boolean { return this.servizio.bozza() !== null; }

  /** Scelte per "in evidenza": i contenuti pubblicati, più l'opzione automatica. */
  readonly opzioniNews = computed<OpzioneSelezione[]>(() => [
    { valore: '', etichetta: 'Automatico: la più recente' },
    ...this.vetrina.ultime().map((n) => ({ valore: String(n.id), etichetta: n.titolo }))
  ]);
  readonly opzioniEventi = computed<OpzioneSelezione[]>(() => [
    { valore: '', etichetta: 'Automatico: il più vicino' },
    ...this.vetrina.prossimi().map((e) => ({ valore: String(e.id), etichetta: e.titolo }))
  ]);

  ngOnInit(): void {
    // Tornando dall'anteprima la bozza è ancora qui; altrimenti si parte da quanto pubblicato.
    this.servizio.anteprima.set(null);
    if (!this.servizio.bozza()) this.servizio.bozza.set(copia(this.servizio.contenuti()));
    this.vetrina.carica();
  }

  // --- stato ---------------------------------------------------------------------

  /** Vero se la bozza differisce da quanto pubblicato. */
  modificato(): boolean {
    const b = this.servizio.bozza();
    return !!b && JSON.stringify(b) !== JSON.stringify(this.servizio.contenuti());
  }

  lunghezzaSlogan(): number { return this.b.apertura.slogan.map((x) => x.trim()).filter(Boolean).join(' ').length; }
  sloganTroppoLungo(): boolean { return this.lunghezzaSlogan() > this.sloganMax; }

  // --- liste -------------------------------------------------------------------------

  aggiungi<T>(lista: T[], voce: T): void { lista.push(voce); }
  rimuovi<T>(lista: T[], i: number): void { lista.splice(i, 1); }
  sposta<T>(lista: T[], i: number, verso: -1 | 1): void {
    const j = i + verso;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }

  nuovoNumero() { return { valore: '', etichetta: '' }; }
  nuovoImpegno() { return { titolo: '', testo: '' }; }
  nuovoOrgano() { return { nome: '', ruolo: '', area: '', emblema: 'bussola' as const }; }
  nuovoProgetto() {
    return { codice: 'p' + Date.now().toString(36), emblema: 'verifica' as const, titolo: '', categoria: '', descrizione: '', stato: 'In corso' as const, impatto: '' };
  }
  nuovoSocial() { return { rete: 'LinkedIn' as const, url: '' }; }

  // --- in evidenza (i select lavorano con stringhe) -----------------------------------------

  get newsInEvidenza(): string { return this.b.evidenza.newsId === null ? '' : String(this.b.evidenza.newsId); }
  set newsInEvidenza(v: string) { this.b.evidenza.newsId = v ? Number(v) : null; }
  get eventoInEvidenza(): string { return this.b.evidenza.eventoId === null ? '' : String(this.b.evidenza.eventoId); }
  set eventoInEvidenza(v: string) { this.b.evidenza.eventoId = v ? Number(v) : null; }

  // --- azioni --------------------------------------------------------------------------

  /** Mostra il sito con la bozza, senza salvarla. */
  anteprima(): void {
    this.servizio.anteprima.set(copia(this.b));
    this.router.navigateByUrl('/');
  }

  async annulla(): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Annullare le modifiche?',
      messaggio: 'Tutte le modifiche non salvate, in ogni sezione, andranno perse. Il sito resta com’è.',
      azione: 'Annulla modifiche', annulla: 'Continua a modificare', distruttiva: true
    });
    if (ok) this.servizio.bozza.set(copia(this.servizio.contenuti()));
  }

  salva(): void {
    if (this.salvataggio() || !this.modificato()) return;
    if (this.sloganTroppoLungo()) {
      this.sezione.set('apertura');
      this.dialogo.avvisa('Lo slogan è troppo lungo', `Deve stare in ${this.sloganMax} caratteri per restare su una riga. Ora ne ha ${this.lunghezzaSlogan()}.`);
      return;
    }
    this.salvataggio.set(true);
    const pulita = this.pulisci(copia(this.b));
    this.servizio.salva(pulita).subscribe({
      next: () => {
        this.salvataggio.set(false);
        this.servizio.bozza.set(copia(this.servizio.contenuti()));
        this.avvisi.conferma('Contenuti salvati', 'Sono già visibili sul sito.');
      },
      error: () => {
        this.salvataggio.set(false);
        this.dialogo.avvisa('Salvataggio non riuscito',
          'Le modifiche sono ancora qui, non le hai perse. Riprova tra qualche istante; nel frattempo puoi guardarle con "Anteprima".');
      }
    });
  }

  /** Toglie spazi superflui e voci lasciate vuote, prima di salvare. */
  private pulisci(c: ContenutiSito): ContenutiSito {
    const t = (s: string) => (s ?? '').trim();
    c.associazione.numeri = c.associazione.numeri.filter((n) => t(n.valore) && t(n.etichetta));
    c.associazione.impegni = c.associazione.impegni.filter((m) => t(m.titolo) || t(m.testo));
    c.associazione.governance = c.associazione.governance.filter((g) => t(g.nome));
    c.progetti = c.progetti.filter((p) => t(p.titolo));
    c.contatti.social = c.contatti.social.filter((s) => t(s.url));
    return JSON.parse(JSON.stringify(c, (_k, v) => (typeof v === 'string' ? v.trim() : v)));
  }
}
