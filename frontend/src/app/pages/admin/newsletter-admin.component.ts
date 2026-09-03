// =============================================================================
//  frontend/src/app/pages/admin/newsletter-admin.component.ts
//  BACKOFFICE — GESTIONE NEWSLETTER (solo SuperUser). Elenco degli iscritti
//  pubblici con possibilità di rimozione (soft-delete) ed esportazione rapida.
//  Rotta protetta da superUserGuard + [Authorize(Roles="SuperUser")] server.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FidcApiService, IscrittoNewsletter } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';

/**
 * Tabella iscritti alla newsletter. Mostra email, nome e data d'iscrizione,
 * con conteggio totale/attivi e un'azione di copia rapida degli indirizzi.
 */
@Component({
  selector: 'fidc-newsletter-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
  <div class="page">
    <header class="head">
      <div>
        <h1>Newsletter</h1>
        <p class="scope">Iscritti pubblici alla newsletter della Federazione</p>
      </div>
      <button class="primary" *ngIf="iscritti().length > 0" (click)="copiaEmail()">
        {{ copiato() ? 'Email copiate ✓' : 'Copia tutte le email' }}
      </button>
    </header>

    <!-- Riepilogo -->
    <section class="stats-row" *ngIf="iscritti().length > 0">
      <div class="stat"><b>{{ iscritti().length }}</b><span>Iscritti totali</span></div>
      <div class="stat"><b>{{ attivi() }}</b><span>Attivi</span></div>
    </section>

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && iscritti().length === 0">
        Nessun iscritto alla newsletter, per ora.
      </p>
      <table *ngIf="iscritti().length > 0">
        <thead>
          <tr><th>Email</th><th>Nome</th><th>Stato</th><th>Iscritto il</th><th class="right">Azioni</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let i of iscritti()">
            <td class="t">{{ i.email }}</td>
            <td>{{ i.nome || '—' }}</td>
            <td><span class="state" [class.on]="i.attiva">{{ i.attiva ? 'Attivo' : 'Disiscritto' }}</span></td>
            <td>{{ i.createdAt | date:'dd/MM/yyyy' }}</td>
            <td class="right">
              <button class="mini danger" (click)="elimina(i)">Rimuovi</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
  `,
  styleUrls: ['./admin-tables.scss'],
  styles: [`
    .stats-row { display:flex; gap:16px; margin-bottom:22px; flex-wrap:wrap; }
    /* Riquadri con i numeri sintetici della newsletter. */
    .stat {
      background: var(--surface); border:1px solid var(--surface-border);
      border-radius: var(--radius);
      clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
      padding:16px 26px; min-width:150px;
      backdrop-filter: blur(var(--surface-blur));
    }
    .stat b { display:block; font-size:2rem; color: var(--accent); line-height:1; }
    .stat span { font-size:.82rem; font-weight:600; color: var(--text-soft); }
  `]
})
export class NewsletterAdminComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly dialogo = inject(DialogoService);

  readonly iscritti = signal<IscrittoNewsletter[]>([]);
  readonly caricamento = signal(true);
  readonly copiato = signal(false);

  /** Conteggio degli iscritti attualmente attivi. */
  readonly attivi = computed(() => this.iscritti().filter((i) => i.attiva).length);

  ngOnInit(): void { this.carica(); }

  private carica(): void {
    this.caricamento.set(true);
    this.api.getIscrittiNewsletter().subscribe({
      next: (l) => this.iscritti.set(l),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  /** Rimuove un iscritto dalla newsletter, previa conferma esplicita. */
  async elimina(i: IscrittoNewsletter): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Rimuovere questo iscritto?',
      messaggio: `${i.email} non riceverà più le comunicazioni della Federazione.`,
      azione: 'Rimuovi',
      distruttiva: true
    });
    if (!ok) return;

    this.api.eliminaIscrittoNewsletter(i.id).subscribe({
      next: () => this.iscritti.set(this.iscritti().filter((x) => x.id !== i.id)),
      error: () => this.dialogo.avvisa(
        'Rimozione non riuscita',
        "L'iscritto è ancora in elenco. Riprova tra qualche istante."
      )
    });
  }

  /** Copia negli appunti l'elenco delle email attive (separate da virgola). */
  copiaEmail(): void {
    const lista = this.iscritti().filter((i) => i.attiva).map((i) => i.email).join(', ');
    if (!lista || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(lista).then(() => {
      this.copiato.set(true);
      setTimeout(() => this.copiato.set(false), 2000);
    });
  }
}
