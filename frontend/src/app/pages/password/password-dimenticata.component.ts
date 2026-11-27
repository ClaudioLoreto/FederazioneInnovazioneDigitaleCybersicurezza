// =============================================================================
//  frontend/src/app/pages/password/password-dimenticata.component.ts
//  PASSWORD DIMENTICATA (/password-dimenticata) e NUOVA PASSWORD
//  (/reimposta-password?token=…). Stessa vetrina dell'accesso, emblema "chiave".
//
//  Sicurezza: la richiesta risponde sempre allo stesso modo, che l'indirizzo
//  esista o no, così il modulo non rivela chi è iscritto. Il codice nel
//  collegamento è monouso e scade (lo decide il server: docs/ACCOUNT.md).
// =============================================================================

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthShellComponent } from '../../shared/auth/auth-shell.component';
import { FidcApiService } from '../../services/fidc-api.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';

const PUNTI = ['Il collegamento vale una volta sola', 'Scade dopo poco tempo', 'Non chiediamo mai la password per email'];

@Component({
  selector: 'fidc-password-dimenticata',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent],
  styleUrl: '../../shared/auth/auth-form.scss',
  template: `
  <fidc-auth-shell titolo="Recupero della password" tema="chiave"
    testo="Ti mandiamo un collegamento per sceglierne una nuova." [punti]="punti">
    <div class="cascata">
      @if (inviata()) {
        <div class="esito" role="status">
          <h1>Controlla la tua email</h1>
          <p>Se {{ email }} corrisponde a un account, tra poco riceverai un messaggio con il collegamento
             per scegliere una nuova password. Controlla anche la posta indesiderata.</p>
          <a class="btn-primary" routerLink="/login">Torna all'accesso</a>
        </div>
      } @else {
        <header class="intestazione">
          <h1>Hai dimenticato la password?</h1>
          <p>Scrivi l'email con cui ti sei registrato.</p>
        </header>
        <form (ngSubmit)="invia(f.invalid)" #f="ngForm" novalidate>
          <div class="campo" [class.errato]="emailM.invalid && (emailM.touched || provato())">
            <input id="email" type="email" name="email" [(ngModel)]="email" #emailM="ngModel"
                   required email placeholder=" " autocomplete="email" />
            <label for="email">Email</label>
            @if (emailM.invalid && (emailM.touched || provato())) {
              <p class="msg-campo">{{ emailM.errors?.['required'] ? 'Scrivi la tua email.' : 'Questo indirizzo non sembra valido.' }}</p>
            }
          </div>
          @if (errore()) {
            <div class="avviso rete" role="alert"><strong>Richiesta non inviata</strong><p>{{ errore() }}</p></div>
          }
          <button type="submit" class="btn-primary invia" [disabled]="caricamento()">
            @if (caricamento()) { <span class="spinner" aria-hidden="true"></span> Invio in corso }
            @else { Invia il collegamento }
          </button>
        </form>
        <p class="alt">Ti è tornata in mente? <a routerLink="/login">Accedi</a></p>
      }
    </div>
  </fidc-auth-shell>
  `
})
export class PasswordDimenticataComponent {
  private readonly api = inject(FidcApiService);
  readonly punti = PUNTI;
  email = '';
  readonly provato = signal(false);
  readonly caricamento = signal(false);
  readonly inviata = signal(false);
  readonly errore = signal<string | null>(null);

  invia(nonValido: boolean | null): void {
    this.provato.set(true);
    this.errore.set(null);
    if (nonValido || this.caricamento()) return;
    this.caricamento.set(true);
    this.api.passwordDimenticata(this.email.trim().toLowerCase()).subscribe({
      next: () => { this.caricamento.set(false); this.inviata.set(true); },
      error: (err: unknown) => {
        this.caricamento.set(false);
        // Qualunque risposta del server diversa da "irraggiungibile" vale come inviata:
        // non diciamo se l'indirizzo esiste.
        const s = err instanceof HttpErrorResponse ? err.status : 0;
        if (s === 0 || s >= 500 || s === 404) this.errore.set('Il servizio non risponde. Riprova tra qualche minuto.');
        else this.inviata.set(true);
      }
    });
  }
}

@Component({
  selector: 'fidc-reimposta-password',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent],
  styleUrl: '../../shared/auth/auth-form.scss',
  template: `
  <fidc-auth-shell titolo="Nuova password" tema="chiave"
    testo="Scegline una che non usi altrove." [punti]="punti">
    <div class="cascata">
      @if (!token()) {
        <div class="esito" role="alert">
          <h1>Collegamento non valido</h1>
          <p>Il collegamento è incompleto. Aprilo di nuovo dall'email oppure chiedine uno nuovo.</p>
          <a class="btn-primary" routerLink="/password-dimenticata">Chiedi un nuovo collegamento</a>
        </div>
      } @else {
        <header class="intestazione">
          <h1>Scegli la nuova password</h1>
          <p>Almeno 8 caratteri. Meglio se con maiuscole, numeri e simboli.</p>
        </header>
        <form (ngSubmit)="salva(f.invalid)" #f="ngForm" novalidate>
          <div class="campo" [class.errato]="nuovaM.invalid && (nuovaM.touched || provato())">
            <input id="nuova" type="password" name="nuova" [(ngModel)]="nuova" #nuovaM="ngModel"
                   required minlength="8" placeholder=" " autocomplete="new-password" />
            <label for="nuova">Nuova password</label>
            @if (nuovaM.invalid && (nuovaM.touched || provato())) { <p class="msg-campo">Servono almeno 8 caratteri.</p> }
          </div>
          <div class="campo" [class.errato]="provato() && conferma !== nuova">
            <input id="conferma" type="password" name="conferma" [(ngModel)]="conferma"
                   required placeholder=" " autocomplete="new-password" />
            <label for="conferma">Ripeti la password</label>
            @if (provato() && conferma !== nuova) { <p class="msg-campo">Le due password non coincidono.</p> }
          </div>
          @if (errore()) {
            <div class="avviso" role="alert"><strong>Password non cambiata</strong><p>{{ errore() }}</p></div>
          }
          <button type="submit" class="btn-primary invia" [disabled]="caricamento()">
            @if (caricamento()) { <span class="spinner" aria-hidden="true"></span> Salvataggio }
            @else { Salva la nuova password }
          </button>
        </form>
      }
    </div>
  </fidc-auth-shell>
  `
})
export class ReimpostaPasswordComponent {
  private readonly api = inject(FidcApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly avvisi = inject(AvvisiService);
  readonly punti = PUNTI;
  readonly token = computed(() => this.route.snapshot.queryParamMap.get('token') ?? '');
  nuova = '';
  conferma = '';
  readonly provato = signal(false);
  readonly caricamento = signal(false);
  readonly errore = signal<string | null>(null);

  salva(nonValido: boolean | null): void {
    this.provato.set(true);
    this.errore.set(null);
    if (nonValido || this.conferma !== this.nuova || this.caricamento()) return;
    this.caricamento.set(true);
    this.api.reimpostaPassword(this.token(), this.nuova).subscribe({
      next: () => {
        this.caricamento.set(false);
        this.avvisi.conferma('Password cambiata', 'Ora puoi accedere con la nuova password.');
        this.router.navigateByUrl('/login');
      },
      error: (err: unknown) => {
        this.caricamento.set(false);
        const s = err instanceof HttpErrorResponse ? err.status : 0;
        this.errore.set(s === 400 || s === 410
          ? 'Il collegamento è scaduto o è già stato usato. Chiedine uno nuovo dalla pagina di accesso.'
          : 'Il servizio non risponde. Riprova tra qualche minuto.');
      }
    });
  }
}
