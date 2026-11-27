// =============================================================================
//  frontend/src/app/pages/area-documenti/area-documenti.component.ts
//  AREA RISERVATA — BIBLIOTECA DOCUMENTI DEI SOCI.
//  Pagina protetta (authGuard): qualsiasi utente autenticato può CONSULTARE e
//  SCARICARE i documenti (pubblici e riservati). Sola lettura: nessuna azione
//  di gestione (quella resta nel backoffice). Rispetta il Velo e la palette.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FidcApiService, Documento } from '../../services/fidc-api.service';
import { AuthService } from '../../services/auth.service';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';
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
  imports: [RouterLink, SafeLogoComponent, AnimatedLogoComponent],
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
  /** Filtro per categoria (null = tutte) e per visibilità. */
  readonly categoria = signal<string | null>(null);
  readonly visibilita = signal<'tutti' | 'Pubblico' | 'Riservato'>('tutti');

  /** Categorie presenti, per i filtri rapidi. */
  readonly categorie = computed(() =>
    [...new Set(this.documenti().map((d) => d.categoria || 'Altro'))].sort((a, b) => a.localeCompare(b)));

  readonly conteggi = computed(() => ({
    tutti: this.documenti().length,
    Pubblico: this.documenti().filter((d) => d.visibilita === 'Pubblico').length,
    Riservato: this.documenti().filter((d) => d.visibilita === 'Riservato').length
  }));

  /** Documenti filtrati per titolo/descrizione/categoria (case-insensitive). */
  readonly filtrati = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    if (!q) return this.documenti();
    const cat = this.categoria();
    const vis = this.visibilita();
    return this.documenti().filter((d) =>
      (!cat || (d.categoria || 'Altro') === cat) &&
      (vis === 'tutti' || d.visibilita === vis) &&
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

  /** Riporta tutti i filtri allo stato iniziale. */
  azzera(): void { this.filtro.set(''); this.categoria.set(null); this.visibilita.set('tutti'); }
}

