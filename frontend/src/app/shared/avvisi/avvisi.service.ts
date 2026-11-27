// =============================================================================
//  frontend/src/app/shared/avvisi/avvisi.service.ts
//  AVVISI TEMPORANEI ("toast") — confermano che un'azione è andata a buon fine.
//
//  Regola di scrittura: l'avviso usa lo stesso verbo del bottone premuto.
//  "Pubblica" → "Evento pubblicato", "Elimina" → "Evento eliminato".
//  Gli errori NON passano da qui: restano accanto al punto in cui servono
//  (nel modulo o in un dialogo), perché chiedono un'azione.
//
//  Gli avvisi spariscono da soli dopo qualche secondo, si fermano al passaggio
//  del mouse e vengono letti dai lettori di schermo (aria-live).
// =============================================================================

import { Injectable, signal } from '@angular/core';

export interface Avviso {
  id: number;
  testo: string;
  dettaglio?: string;
}

@Injectable({ providedIn: 'root' })
export class AvvisiService {
  readonly avvisi = signal<Avviso[]>([]);
  private prossimo = 1;
  private timer = new Map<number, ReturnType<typeof setTimeout>>();

  /** Mostra una conferma. Restituisce l'id, utile per chiuderla prima. */
  conferma(testo: string, dettaglio?: string): number {
    const id = this.prossimo++;
    // Al massimo tre in coda: oltre sarebbero rumore.
    this.avvisi.update((l) => [...l, { id, testo, dettaglio }].slice(-3));
    this.programma(id, 4500);
    return id;
  }

  chiudi(id: number): void {
    clearTimeout(this.timer.get(id));
    this.timer.delete(id);
    this.avvisi.update((l) => l.filter((a) => a.id !== id));
  }

  /** Sospende la chiusura automatica (mouse sopra o fuoco da tastiera). */
  sospendi(id: number): void { clearTimeout(this.timer.get(id)); }
  riprendi(id: number): void { this.programma(id, 2500); }

  private programma(id: number, ms: number): void {
    clearTimeout(this.timer.get(id));
    this.timer.set(id, setTimeout(() => this.chiudi(id), ms));
  }
}
