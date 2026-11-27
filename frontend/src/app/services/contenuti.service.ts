// =============================================================================
//  frontend/src/app/services/contenuti.service.ts
//  CONTENUTI DEL SITO — unica regia dei testi modificabili dal backoffice.
//
//  - All'avvio usa l'ultima copia ricevuta dal server (localStorage), così chi
//    torna sul sito non vede per un attimo i testi di partenza; poi chiede la
//    versione aggiornata a GET /api/contenuti.
//  - Se il server non risponde (o non ha ancora contenuti) restano i valori di
//    partenza di content/home-content.ts: solo testo istituzionale.
//  - ANTEPRIMA: il backoffice può mostrare il sito con una bozza non salvata.
//    `attuali` restituisce la bozza finché l'anteprima è attiva; nessuno
//    tranne chi la sta guardando la vede, perché vive solo in memoria.
//  Contratto per il backend: docs/CONTENUTI.md.
// =============================================================================

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CONTENUTI_PREDEFINITI, ContenutiSito } from '../content/home-content';

const CHIAVE_CACHE = 'fidc.contenuti';

/** Copia profonda (i contenuti sono JSON puro). */
export const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/**
 * Unisce i contenuti ricevuti ai valori di partenza: un campo mancante (per
 * esempio aggiunto in una versione successiva del sito) prende il valore di
 * partenza invece di restare vuoto o di rompere la pagina.
 */
export function completa(ricevuti: Partial<ContenutiSito> | null | undefined): ContenutiSito {
  const base = copia(CONTENUTI_PREDEFINITI);
  if (!ricevuti || typeof ricevuti !== 'object') return base;
  const unisci = (a: any, b: any): any => {
    if (Array.isArray(a)) return Array.isArray(b) ? b : a;
    if (a && typeof a === 'object') {
      const out: any = { ...a };
      for (const k of Object.keys(a)) if (b && k in b && b[k] !== undefined && b[k] !== null) out[k] = unisci(a[k], b[k]);
      // null è un valore legittimo per le scelte "in evidenza"
      if (b) for (const k of Object.keys(b)) if (b[k] === null && k in a) out[k] = null;
      return out;
    }
    return b ?? a;
  };
  const c = unisci(base, ricevuti) as ContenutiSito;
  // I pilastri sono sempre quattro, nell'ordine delle chiavi fisse.
  c.pilastri = base.pilastri.map((p) => ({ ...p, ...(c.pilastri.find((x) => x.chiave === p.chiave) ?? {}) }));
  return c;
}

@Injectable({ providedIn: 'root' })
export class ContenutiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/contenuti`;

  /** Contenuti pubblicati. */
  readonly contenuti = signal<ContenutiSito>(this.leggiCache());
  /** Bozza mostrata in anteprima (null = nessuna anteprima). */
  readonly anteprima = signal<ContenutiSito | null>(null);
  /** Quello che il sito deve mostrare adesso. */
  readonly attuali = computed(() => this.anteprima() ?? this.contenuti());

  /**
   * Bozza in lavorazione nel backoffice. Sta qui e non nel componente perché
   * deve sopravvivere al passaggio fra backoffice e anteprima del sito.
   */
  readonly bozza = signal<ContenutiSito | null>(null);

  constructor() { this.carica(); }

  /** Chiede al server la versione aggiornata. */
  carica(): void {
    this.http.get<Partial<ContenutiSito>>(this.url).subscribe({
      next: (c) => this.imposta(completa(c)),
      error: () => { /* restano cache o valori di partenza */ }
    });
  }

  /** Salva i contenuti (permesso sito.contenuti) e li pubblica sul sito. */
  salva(c: ContenutiSito): Observable<ContenutiSito> {
    return this.http.put<ContenutiSito>(this.url, c).pipe(
      tap((salvati) => this.imposta(completa(salvati ?? c)))
    );
  }

  private imposta(c: ContenutiSito): void {
    // Se la bozza non era stata toccata, segue la nuova versione: altrimenti
    // l'arrivo dei contenuti dal server sembrerebbe una modifica non salvata.
    const b = this.bozza();
    if (b && JSON.stringify(b) === JSON.stringify(this.contenuti())) this.bozza.set(copia(c));
    this.contenuti.set(c);
    try { localStorage.setItem(CHIAVE_CACHE, JSON.stringify(c)); } catch { /* nessuno storage */ }
  }

  private leggiCache(): ContenutiSito {
    try {
      const raw = localStorage.getItem(CHIAVE_CACHE);
      return raw ? completa(JSON.parse(raw)) : copia(CONTENUTI_PREDEFINITI);
    } catch {
      return copia(CONTENUTI_PREDEFINITI);
    }
  }
}
