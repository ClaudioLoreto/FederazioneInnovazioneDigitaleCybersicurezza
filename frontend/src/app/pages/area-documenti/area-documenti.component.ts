// =============================================================================
//  frontend/src/app/pages/area-documenti/area-documenti.component.ts
//  AREA RISERVATA — BIBLIOTECA DOCUMENTI DEI SOCI.
//  Pagina protetta (authGuard): qualsiasi utente autenticato può CONSULTARE e
//  SCARICARE i documenti (pubblici e riservati). Sola lettura: nessuna azione
//  di gestione (quella resta nel backoffice). Rispetta il Velo e la palette.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FidcApiService, Documento } from '../../services/fidc-api.service';
import { AuthService } from '../../services/auth.service';
import { SafeLogoComponent } from '../../shared/safe-logo/safe-logo.component';

/** Raggruppamento di documenti per categoria (per la resa a sezioni). */
interface GruppoDocumenti {
  categoria: string;
  documenti: Documento[];
}

/**
 * Biblioteca documentale riservata ai soci. Carica l'elenco completo dei
 * documenti dall'endpoint protetto e li presenta come schede scaricabili,
 * raggruppate per categoria con un filtro di ricerca istantaneo.
 */
@Component({
  selector: 'fidc-area-documenti',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, SafeLogoComponent],
  templateUrl: './area-documenti.component.html',
  styleUrl: './area-documenti.component.scss'
})
export class AreaDocumentiComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  readonly auth = inject(AuthService);

  readonly documenti = signal<Documento[]>([]);
  readonly caricamento = signal(true);
  readonly errore = signal<string | null>(null);
  readonly filtro = signal('');

  /** Documenti filtrati per titolo/descrizione/categoria (case-insensitive). */
  readonly filtrati = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    if (!q) return this.documenti();
    return this.documenti().filter((d) =>
      `${d.titolo} ${d.descrizione ?? ''} ${d.categoria}`.toLowerCase().includes(q)
    );
  });

  /** Documenti raggruppati per categoria, in ordine alfabetico. */
  readonly gruppi = computed<GruppoDocumenti[]>(() => {
    const mappa = new Map<string, Documento[]>();
    for (const d of this.filtrati()) {
      const cat = d.categoria?.trim() || 'Altro';
      (mappa.get(cat) ?? mappa.set(cat, []).get(cat)!).push(d);
    }
    return [...mappa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([categoria, documenti]) => ({ categoria, documenti }));
  });

  ngOnInit(): void { this.carica(); }

  private carica(): void {
    this.caricamento.set(true);
    this.errore.set(null);
    this.api.getDocumentiRiservati().subscribe({
      next: (l) => this.documenti.set(l),
      error: () => {
        this.errore.set('Impossibile caricare i documenti. Riprova più tardi.');
        this.caricamento.set(false);
      },
      complete: () => this.caricamento.set(false)
    });
  }

  /** Aggiorna il filtro di ricerca dall'input. */
  onFiltro(v: string): void { this.filtro.set(v); }
}
