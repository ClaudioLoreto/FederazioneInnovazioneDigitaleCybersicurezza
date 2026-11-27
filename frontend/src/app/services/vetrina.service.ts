// =============================================================================
//  frontend/src/app/services/vetrina.service.ts
//  VETRINA PUBBLICA — eventi e news pubblicati, caricati una volta e condivisi
//  da home, testata (che nasconde le voci di menu senza contenuti) e pagine
//  di dettaglio.
//
//  Niente contenuti di riserva: se il server non risponde o non ha nulla, le
//  sezioni corrispondenti non compaiono. Meglio una pagina più corta che una
//  pagina con eventi inventati.
//
//  IMMINENZA: un evento vicino nel tempo diventa più evidente da solo.
//    ≤ 14 giorni → etichetta "Oggi", "Domani", "Tra N giorni";
//    ≤ 7 giorni  → "imminente": scheda in evidenza e fascia sotto l'apertura.
// =============================================================================

import { Injectable, computed, inject, signal } from '@angular/core';
import { Evento, FidcApiService, News } from './fidc-api.service';
import { ContenutiService } from './contenuti.service';

const GIORNO = 86_400_000;

/** Giorni di calendario fra oggi e la data (0 = oggi, negativo = passato). */
export function giorniA(iso: string, ora = new Date()): number {
  const d = new Date(iso);
  const a = new Date(ora.getFullYear(), ora.getMonth(), ora.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((b - a) / GIORNO);
}

/** "Oggi", "Domani", "Tra 5 giorni", oppure null se mancano più di 14 giorni. */
export function etichettaImminenza(iso: string): string | null {
  const g = giorniA(iso);
  if (g < 0 || g > 14) return null;
  if (g === 0) return 'Oggi';
  if (g === 1) return 'Domani';
  return `Tra ${g} giorni`;
}

/** Vero se l'evento comincia entro una settimana. */
export const imminente = (e: Evento) => { const g = giorniA(e.dataInizio); return g >= 0 && g <= 7; };

@Injectable({ providedIn: 'root' })
export class VetrinaService {
  private readonly api = inject(FidcApiService);
  private readonly contenuti = inject(ContenutiService);

  /** null = ancora in caricamento. */
  readonly eventi = signal<Evento[] | null>(null);
  readonly news = signal<News[] | null>(null);
  private avviato = false;

  /** Eventi futuri pubblicati, dal più vicino; quello scelto "in evidenza" per primo. */
  readonly prossimi = computed(() => {
    const ora = Date.now();
    const lista = (this.eventi() ?? [])
      .filter((e) => e.pubblicato !== false && new Date(e.dataFine ?? e.dataInizio).getTime() >= ora)
      .sort((a, b) => +new Date(a.dataInizio) - +new Date(b.dataInizio));
    const scelto = this.contenuti.attuali().evidenza.eventoId;
    const i = lista.findIndex((e) => e.id === scelto);
    if (i > 0) lista.unshift(...lista.splice(i, 1));
    return lista;
  });

  /** News pubblicate, dalla più recente; quella scelta "in evidenza" per prima. */
  readonly ultime = computed(() => {
    const lista = [...(this.news() ?? [])]
      .filter((n) => n.pubblicato !== false)
      .sort((a, b) => +new Date(b.dataPubblicazione ?? 0) - +new Date(a.dataPubblicazione ?? 0));
    const scelta = this.contenuti.attuali().evidenza.newsId;
    const i = lista.findIndex((n) => n.id === scelta);
    if (i > 0) lista.unshift(...lista.splice(i, 1));
    return lista;
  });

  /** Quali sezioni della home hanno qualcosa da mostrare. */
  readonly sezioni = computed(() => {
    const c = this.contenuti.attuali();
    const k = c.contatti;
    return {
      eventi: this.prossimi().length > 0,
      news: this.ultime().length > 0,
      progetti: c.progetti.length > 0,
      contatti: !!(k.sede || k.email || k.pec || k.telefono || k.whatsapp)
    };
  });

  /** Carica eventi e news una volta sola per visita. */
  carica(): void {
    if (this.avviato) return;
    this.avviato = true;
    this.api.getEventi().subscribe({ next: (l) => this.eventi.set(l), error: () => this.eventi.set([]) });
    this.api.getNews().subscribe({ next: (l) => this.news.set(l), error: () => this.news.set([]) });
  }
}
