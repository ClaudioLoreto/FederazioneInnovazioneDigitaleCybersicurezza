// =============================================================================
//  frontend/src/app/pages/calendario-eventi/calendario-eventi.component.ts
//  CALENDARIO DEGLI EVENTI (/eventi) — tutti gli eventi pubblicati.
//
//  A sinistra il mese: i giorni con eventi sono segnati e si possono scegliere.
//  A destra l'elenco del mese (o del giorno scelto). La ricerca e il filtro
//  per ambito valgono per entrambi; con una ricerca l'elenco mostra tutti i
//  risultati, di qualunque mese. Si apre sul mese del prossimo evento.
//  Gli eventi imminenti hanno le stesse etichette della home ("Tra 3 giorni").
// =============================================================================

import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { EmblemaTemaComponent } from '../../shared/emblemi/emblema-tema.component';
import { Evento } from '../../services/fidc-api.service';
import { VetrinaService, etichettaImminenza, imminente } from '../../services/vetrina.service';
import { PILASTRI, etichettaPilastro } from '../../shared/opzioni';

/** Chiave di un giorno di calendario, in ora locale: AAAA-MM-GG. */
const chiave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const primoDelMese = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

interface Giorno { data: Date; chiave: string; delMese: boolean; oggi: boolean; eventi: Evento[]; }

@Component({
  selector: 'fidc-calendario-eventi',
  standalone: true,
  imports: [DatePipe, RouterLink, TestataPubblicaComponent, PiedePubblicoComponent, EmblemaTemaComponent],
  templateUrl: './calendario-eventi.component.html',
  styleUrls: ['../dettaglio/dettaglio.scss', './calendario-eventi.component.scss']
})
export class CalendarioEventiComponent implements OnInit {
  private readonly vetrina = inject(VetrinaService);

  readonly ambiti = [{ valore: 'tutti', etichetta: 'Tutti' }, ...PILASTRI];
  readonly giorniSettimana = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];

  readonly mese = signal(primoDelMese(new Date()));
  readonly giornoScelto = signal<string | null>(null);
  readonly ambito = signal('tutti');
  readonly cerca = signal('');
  private meseScelto = false;

  readonly caricamento = computed(() => this.vetrina.eventi() === null);

  /** Eventi pubblicati che rispettano ambito e ricerca, in ordine di data. */
  readonly filtrati = computed(() => {
    const q = this.cerca().trim().toLowerCase();
    const a = this.ambito();
    return (this.vetrina.eventi() ?? [])
      .filter((e) => e.pubblicato !== false)
      .filter((e) => a === 'tutti' || e.pilastro === a)
      .filter((e) => !q || [e.titolo, e.sottotitolo ?? '', e.luogo].join(' ').toLowerCase().includes(q))
      .sort((x, y) => +new Date(x.dataInizio) - +new Date(y.dataInizio));
  });

  /** Giorni occupati da ciascun evento (fino a due settimane per i più lunghi). */
  private readonly perGiorno = computed(() => {
    const mappa = new Map<string, Evento[]>();
    for (const e of this.filtrati()) {
      const inizio = new Date(e.dataInizio);
      const fine = e.dataFine ? new Date(e.dataFine) : inizio;
      const d = new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate());
      for (let i = 0; i < 14 && d <= fine; i++, d.setDate(d.getDate() + 1)) {
        const k = chiave(d);
        mappa.set(k, [...(mappa.get(k) ?? []), e]);
      }
      if (!mappa.has(chiave(inizio))) mappa.set(chiave(inizio), [e]);
    }
    return mappa;
  });

  /** Celle del mese visibile, da lunedì a domenica. */
  readonly giorni = computed<Giorno[]>(() => {
    const m = this.mese();
    const oggi = chiave(new Date());
    const inizio = new Date(m);
    inizio.setDate(1 - ((m.getDay() + 6) % 7));
    const ultimo = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    const celle: Giorno[] = [];
    for (const d = new Date(inizio); d <= ultimo || celle.length % 7 !== 0; d.setDate(d.getDate() + 1)) {
      const k = chiave(d);
      celle.push({ data: new Date(d), chiave: k, delMese: d.getMonth() === m.getMonth(), oggi: k === oggi, eventi: this.perGiorno().get(k) ?? [] });
    }
    return celle;
  });

  /** Elenco a destra: risultati della ricerca, eventi del giorno scelto o del mese. */
  readonly elenco = computed(() => {
    if (this.cerca().trim()) return this.filtrati();
    const g = this.giornoScelto();
    if (g) return this.perGiorno().get(g) ?? [];
    const m = this.mese();
    return this.filtrati().filter((e) => {
      const d = new Date(e.dataInizio);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    });
  });

  readonly titoloElenco = computed(() => {
    const n = this.elenco().length;
    const quanti = n === 1 ? '1 evento' : `${n} eventi`;
    if (this.cerca().trim()) return `Risultati per “${this.cerca().trim()}” · ${quanti}`;
    const g = this.giornoScelto();
    if (g) {
      const [y, mm, d] = g.split('-').map(Number);
      return new Date(y, mm - 1, d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());
    }
    return this.nomeMese() + ' · ' + quanti;
  });

  readonly nomeMese = computed(() =>
    this.mese().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase()));

  /** Primo mese successivo (o precedente) a quello visibile che ha eventi, per il caso vuoto. */
  readonly meseConEventi = computed(() => {
    const m = this.mese();
    const futuri = this.filtrati().map((e) => primoDelMese(new Date(e.dataInizio)));
    const dopo = futuri.find((d) => d > m);
    const prima = [...futuri].reverse().find((d) => d < m);
    return dopo ?? prima ?? null;
  });

  constructor() {
    // Si apre sul mese del prossimo evento, finché chi guarda non cambia mese da sé.
    effect(() => {
      const lista = this.vetrina.eventi();
      if (!lista || this.meseScelto) return;
      const prossimo = lista.filter((e) => e.pubblicato !== false && new Date(e.dataFine ?? e.dataInizio).getTime() >= Date.now())
        .sort((a, b) => +new Date(a.dataInizio) - +new Date(b.dataInizio))[0];
      if (prossimo) this.mese.set(primoDelMese(new Date(prossimo.dataInizio)));
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void { this.vetrina.carica(); }

  // --- comandi ---------------------------------------------------------------------

  cambiaMese(passo: number): void {
    const m = this.mese();
    this.meseScelto = true;
    this.giornoScelto.set(null);
    this.mese.set(new Date(m.getFullYear(), m.getMonth() + passo, 1));
  }

  vaiAlMese(d: Date): void {
    this.meseScelto = true;
    this.giornoScelto.set(null);
    this.mese.set(primoDelMese(d));
  }

  scegliGiorno(g: Giorno): void {
    if (!g.eventi.length) return;
    this.giornoScelto.set(this.giornoScelto() === g.chiave ? null : g.chiave);
  }

  // --- supporto al template ---------------------------------------------------------

  etichetta(v: string): string { return etichettaPilastro(v); }
  imminenza(e: Evento): string | null { return etichettaImminenza(e.dataInizio); }
  evidente(e: Evento): boolean { return imminente(e); }
  concluso(e: Evento): boolean { return new Date(e.dataFine ?? e.dataInizio).getTime() < Date.now(); }

  nomeDi(d: Date): string { return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); }

  descriviGiorno(g: Giorno): string {
    const data = g.data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    const n = g.eventi.length;
    return n ? `${data}, ${n === 1 ? '1 evento' : n + ' eventi'}` : data;
  }
}
