// =============================================================================
//  frontend/src/app/pages/admin/utenti-admin.component.ts
//  BACKOFFICE — GESTIONE UTENTI (solo SuperUser). Elenco account, cambio ruolo
//  RBAC e rimozione. La rotta è protetta da superUserGuard + [Authorize] server.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FidcApiService, UtenteAdmin } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import { descriviRuolo } from '../../shared/ruoli';
import { AuthService } from '../../services/auth.service';

/**
 * Tabella utenti con azioni RBAC: promozione/declassamento (SuperUser↔Relatore)
 * ed eliminazione (soft-delete). Protezioni anti-lockout applicate dal server.
 */
@Component({
  selector: 'fidc-utenti-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
  <div class="page">
    <header class="head">
      <div>
        <h1>Gestione Utenti</h1>
        <p class="scope">Account e ruoli dell'intera Federazione (RBAC)</p>
      </div>
    </header>

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && utenti().length === 0">Nessun utente.</p>
      <table *ngIf="utenti().length > 0">
        <thead>
          <tr><th>Nome</th><th>Email</th><th>Ruolo</th><th>Email confermata</th><th>Registrato</th><th class="right">Azioni</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of utenti()">
            <td class="t">{{ u.nome }} {{ u.cognome }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span class="state" [class.on]="u.ruolo === 'SuperUser'">
                {{ u.ruolo === 'SuperUser' ? 'Super User' : 'Relatore' }}
              </span>
            </td>
            <td>{{ u.emailConfermata ? 'Sì' : 'No' }}</td>
            <td>{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
            <td class="right">
              <button class="mini" *ngIf="u.ruolo !== 'SuperUser'" (click)="promuovi(u)">Promuovi a Super User</button>
              <button class="mini" *ngIf="u.ruolo === 'SuperUser' && u.id !== meId()" (click)="declassa(u)">Rendi Relatore</button>
              <button class="mini danger" *ngIf="u.id !== meId()" (click)="elimina(u)">Elimina</button>
              <span class="mini muted" *ngIf="u.id === meId()">Tu</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
  `,
  styleUrl: './admin-tables.scss'
})
export class UtentiAdminComponent implements OnInit {
  private readonly api = inject(FidcApiService);
  private readonly dialogo = inject(DialogoService);
  private readonly avvisi = inject(AvvisiService);
  private readonly auth = inject(AuthService);

  readonly utenti = signal<UtenteAdmin[]>([]);
  readonly caricamento = signal(true);

  /** Id dell'utente corrente (per nascondere le azioni su se stessi). */
  readonly meId = this.auth.userId;

  ngOnInit(): void { this.carica(); }

  private carica(): void {
    this.caricamento.set(true);
    this.api.getUtenti().subscribe({
      next: (l) => this.utenti.set(l),
      complete: () => this.caricamento.set(false),
      error: () => this.caricamento.set(false)
    });
  }

  promuovi(u: UtenteAdmin): void { this.cambia(u, 'SuperUser'); }
  declassa(u: UtenteAdmin): void { this.cambia(u, 'Relatore'); }

  /**
   * Cambia il livello di accesso di un utente.
   * Chiede conferma perché sposta permessi: promuovere significa dare accesso a
   * utenti, newsletter e aspetto del sito.
   */
  private async cambia(u: UtenteAdmin, ruolo: string): Promise<void> {
    const nuovo = descriviRuolo(ruolo);
    const ok = await this.dialogo.conferma({
      titolo: `Assegnare il profilo ${nuovo.etichetta}?`,
      messaggio: `${u.nome} ${u.cognome} passerà al profilo ${nuovo.etichetta}: ${nuovo.ambito.toLowerCase()}.`,
      azione: 'Assegna'
    });
    if (!ok) return;

    this.api.cambiaRuoloUtente(u.id, ruolo).subscribe({
      next: (agg) => { this.utenti.set(this.utenti().map((x) => (x.id === u.id ? agg : x))); this.avvisi.conferma('Utente aggiornato', agg.email); },
      error: (err) => this.dialogo.avvisa(
        'Cambio di profilo non riuscito',
        err?.error?.messaggio ?? 'Il profilo è rimasto invariato. Riprova tra qualche istante.'
      )
    });
  }

  /** Elimina un account, previa conferma esplicita. */
  async elimina(u: UtenteAdmin): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Eliminare questo account?',
      messaggio: `${u.nome} ${u.cognome} (${u.email}) non potrà più accedere alla piattaforma.`,
      azione: 'Elimina',
      distruttiva: true
    });
    if (!ok) return;

    this.api.eliminaUtente(u.id).subscribe({
      next: () => { this.utenti.set(this.utenti().filter((x) => x.id !== u.id)); this.avvisi.conferma('Utente eliminato', u.email); },
      error: (err) => this.dialogo.avvisa(
        'Eliminazione non riuscita',
        err?.error?.messaggio ?? "L'account è ancora attivo. Riprova tra qualche istante."
      )
    });
  }
}
