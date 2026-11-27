// =============================================================================
//  frontend/src/app/pages/registrazione/registrazione.component.ts
//  REGISTRAZIONE (/registrati) — "Unisciti alla Federazione".
//
//  Stesso telaio dell'accesso (AuthShellComponent). Chiama POST
//  /api/auth/register: l'utente viene salvato e riceve l'email di conferma.
//  Validazione in linea campo per campo, indicatore di robustezza della
//  password, esito positivo animato. Stili in shared/auth/auth-form.scss.
// =============================================================================

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FidcApiService, RegisterRequest } from '../../services/fidc-api.service';
import { AuthShellComponent } from '../../shared/auth/auth-shell.component';

@Component({
  selector: 'fidc-registrazione',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent],
  styleUrl: '../../shared/auth/auth-form.scss',
  template: `
  <fidc-auth-shell
    tema="impronta"
    titolo="Unisciti alla Federazione"
    testo="Una rete di imprese, enti e professionisti che rende l'innovazione più sicura."
    [punti]="['Accesso a eventi, tavoli di lavoro e academy', 'Documenti e ricerche riservati ai soci', 'Aggiornamenti dall\\'osservatorio cyber']">

    @if (completato()) {
      <div class="esito" role="status">
        <svg viewBox="0 0 52 52" width="64" height="64" aria-hidden="true">
          <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3" class="esito-cerchio"/>
          <path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="esito-spunta"/>
        </svg>
        <h1>Controlla la tua email</h1>
        <p>{{ messaggio() }}</p>
        <p>Dopo aver confermato l'indirizzo potrai accedere all'area riservata.</p>
        <a class="btn-primary" routerLink="/login">Vai all'accesso</a>
      </div>
    } @else {
      <div class="cascata">
        <header class="intestazione">
          <h1>Crea il tuo account</h1>
          <p>Ti chiediamo solo i dati necessari. Riceverai un'email per confermare l'indirizzo.</p>
        </header>

        <form (ngSubmit)="registra(f.invalid)" #f="ngForm" novalidate>
          <div class="riga-doppia">
            <div class="campo" [class.errato]="nomeM.invalid && (nomeM.touched || inviato())">
              <input id="nome" name="nome" [(ngModel)]="model.nome" #nomeM="ngModel" required
                     placeholder=" " autocomplete="given-name" />
              <label for="nome">Nome</label>
              @if (nomeM.invalid && (nomeM.touched || inviato())) { <p class="msg-campo">Scrivi il tuo nome.</p> }
            </div>
            <div class="campo" [class.errato]="cognomeM.invalid && (cognomeM.touched || inviato())">
              <input id="cognome" name="cognome" [(ngModel)]="model.cognome" #cognomeM="ngModel" required
                     placeholder=" " autocomplete="family-name" />
              <label for="cognome">Cognome</label>
              @if (cognomeM.invalid && (cognomeM.touched || inviato())) { <p class="msg-campo">Scrivi il tuo cognome.</p> }
            </div>
          </div>

          <div class="campo" [class.errato]="emailM.invalid && (emailM.touched || inviato())">
            <input id="email" type="email" name="email" [(ngModel)]="model.email" #emailM="ngModel"
                   required email placeholder=" " autocomplete="email" />
            <label for="email">Email</label>
            @if (emailM.invalid && (emailM.touched || inviato())) {
              <p class="msg-campo">{{ emailM.errors?.['required'] ? 'Scrivi la tua email.' : 'Questo indirizzo non sembra valido.' }}</p>
            }
          </div>

          <div class="campo con-azione" [class.errato]="pwdM.invalid && (pwdM.touched || inviato())">
            <input id="password" [type]="mostraPwd() ? 'text' : 'password'" name="password"
                   [(ngModel)]="model.password" #pwdM="ngModel" required minlength="8"
                   placeholder=" " autocomplete="new-password" aria-describedby="pwd-aiuto"
                   (ngModelChange)="pwd.set($event)" />
            <label for="password">Password</label>
            <button type="button" class="occhio" (click)="mostraPwd.set(!mostraPwd())"
                    [attr.aria-pressed]="mostraPwd()"
                    [attr.aria-label]="mostraPwd() ? 'Nascondi la password' : 'Mostra la password'">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z" fill="none" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>
                @if (mostraPwd()) { <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/> }
              </svg>
            </button>
            <div class="forza" [attr.data-livello]="forza()" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
            @if (pwdM.invalid && (pwdM.touched || inviato())) {
              <p class="msg-campo">{{ pwdM.errors?.['required'] ? 'Scegli una password.' : 'Servono almeno 8 caratteri.' }}</p>
            } @else {
              <p class="aiuto" id="pwd-aiuto">{{ descrizioneForza() }}</p>
            }
          </div>

          @if (errore()) {
            <div class="avviso" [class.rete]="erroreRete()" role="alert">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3l9 16H3z M12 10v4 M12 17v.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>
              <strong>{{ erroreRete() ? 'Server non raggiungibile' : 'Registrazione non riuscita' }}</strong>
              <p>{{ errore() }}</p>
            </div>
          }

          <button type="submit" class="btn-primary invia" [disabled]="caricamento()">
            @if (caricamento()) { <span class="spinner" aria-hidden="true"></span> Creazione dell'account }
            @else { Crea account }
          </button>
        </form>

        <p class="alt">Hai già un account? <a routerLink="/login">Accedi</a></p>
      </div>
    }
  </fidc-auth-shell>
  `
})
export class RegistrazioneComponent {
  private readonly api = inject(FidcApiService);

  model: RegisterRequest = { nome: '', cognome: '', email: '', password: '' };

  readonly caricamento = signal(false);
  readonly inviato = signal(false);
  readonly mostraPwd = signal(false);
  readonly errore = signal<string | null>(null);
  readonly erroreRete = signal(false);
  readonly completato = signal(false);
  readonly messaggio = signal('');

  /** Password corrente, per l'indicatore di robustezza. */
  readonly pwd = signal('');

  /** Robustezza da 0 a 4: lunghezza, maiuscole, cifre, simboli. */
  readonly forza = computed(() => {
    const p = this.pwd();
    if (!p) return 0;
    let n = 0;
    if (p.length >= 8) n++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
    if (/\d/.test(p)) n++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) n++;
    return n;
  });

  readonly descrizioneForza = computed(() => [
    'Almeno 8 caratteri. Meglio se con maiuscole, numeri e simboli.',
    'Password debole: aggiungi maiuscole, numeri o simboli.',
    'Password discreta.',
    'Password buona.',
    'Password robusta.'
  ][this.forza()]);

  registra(nonValido: boolean | null): void {
    if (this.caricamento()) return;
    this.inviato.set(true);
    this.errore.set(null);
    if (nonValido) return;

    this.caricamento.set(true);
    const body: RegisterRequest = {
      nome: this.model.nome.trim(),
      cognome: this.model.cognome.trim(),
      email: this.model.email.trim().toLowerCase(),
      password: this.model.password
    };

    this.api.register(body).subscribe({
      next: (r) => {
        this.caricamento.set(false);
        this.messaggio.set(r.messaggio);
        this.completato.set(true);
      },
      error: (err: unknown) => {
        this.caricamento.set(false);
        const http = err instanceof HttpErrorResponse ? err : null;
        this.erroreRete.set(http?.status === 0);
        this.errore.set(
          http?.status === 0
            ? 'Il servizio di registrazione non risponde. Controlla la connessione o riprova tra qualche minuto.'
            : (http?.error?.messaggio ?? 'Qualcosa non è andato a buon fine. Controlla i dati e riprova.')
        );
      }
    });
  }
}
