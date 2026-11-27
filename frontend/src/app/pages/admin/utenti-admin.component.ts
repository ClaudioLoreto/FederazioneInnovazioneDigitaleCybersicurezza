// =============================================================================
//  frontend/src/app/pages/admin/utenti-admin.component.ts
//  BACKOFFICE — ACCOUNT (permesso utenti.gestire). Elenco degli account, livello
//  d'accesso e rimozione. I permessi non si cambiano qui ma nella sezione
//  Permessi (solo Direzione), a cui ogni riga rimanda.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FidcApiService, UtenteAdmin } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AssettoPermessi, assettoDaRuolo, livello, normalizza, riassunto } from '../../shared/permessi';

/**
 * Tabella degli account: livello d'accesso, riassunto dei permessi,
 * collegamento alla matrice ed eliminazione (soft-delete). Protezioni
 * anti-lockout applicate dal server.
 */
@Component({
  selector: 'fidc-utenti-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  template: `
  <div class="page">
    <header class="head">
      <div>
        <h1>Account</h1>
        <p class="scope">Le persone registrate alla piattaforma e il loro livello d'accesso.</p>
      </div>
    </header>

    <section class="table-wrap hud-panel">
      <p class="empty" *ngIf="!caricamento() && utenti().length === 0">Nessun utente.</p>
      <table *ngIf="utenti().length > 0">
        <thead>
          <tr><th>Nome</th><th>Email</th><th>Accesso</th><th>Email confermata</th><th>Registrato</th><th class="right">Azioni</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of utenti()">
            <td class="t">{{ u.nome }} {{ u.cognome }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span class="state" [class.on]="livelloDi(u) === 'Direzione'" [attr.title]="riassuntoDi(u)">{{ livelloDi(u) }}</span>
            </td>
            <td>{{ u.emailConfermata ? 'Sì' : 'No' }}</td>
            <td>{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
            <td class="right">
              <a class="mini" *ngIf="auth.isSuperUser()" routerLink="/admin/permessi" [queryParams]="{ persona: u.id }">Permessi</a>
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
  readonly auth = inject(AuthService);

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

  private assetto(u: UtenteAdmin): AssettoPermessi {
    if (u.direzione !== undefined || u.permessi !== undefined)
      return { direzione: !!u.direzione, permessi: normalizza(u.permessi ?? []) };
    return assettoDaRuolo(u.ruolo);
  }
  livelloDi(u: UtenteAdmin): string { return livello(this.assetto(u)); }
  riassuntoDi(u: UtenteAdmin): string { return riassunto(this.assetto(u)); }

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
