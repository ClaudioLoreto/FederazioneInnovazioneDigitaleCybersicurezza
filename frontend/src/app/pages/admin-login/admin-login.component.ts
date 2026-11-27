// =============================================================================
//  frontend/src/app/pages/admin-login/admin-login.component.ts
//  ACCESSO all'area riservata (/login e /admin/login).
//
//  Schermo diviso (AuthShellComponent): vetrina blu a sinistra, modulo crema a
//  destra. Etichette flottanti leggibili anche con la compilazione automatica,
//  mostra/nascondi password, errori distinti per causa (credenziali, rete,
//  server), indicatore di caricamento nel bottone.
//
//  In sviluppo l'API gira in HTTP (http://localhost:5000/api): nessun avviso sui
//  certificati. Stili in shared/auth/auth-form.scss.
// =============================================================================

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthShellComponent } from '../../shared/auth/auth-shell.component';
import { environment } from '../../../environments/environment';
import type { ProfiloDiProva } from '../../../environments/tipi';

type ErroreAccesso = ReturnType<AuthService['classificaErrore']>;

@Component({
  selector: 'fidc-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthShellComponent],
  styleUrl: '../../shared/auth/auth-form.scss',
  template: `
  <fidc-auth-shell
    titolo="Area riservata della Federazione"
    testo="Lo spazio di lavoro di soci, redazione e direzione."
    [punti]="['Pubblica eventi e news della Federazione', 'Scarica i documenti riservati ai soci', 'Segui iscrizioni e newsletter']">

    <div class="cascata">
      <header class="intestazione">
        <h1>Accedi</h1>
        <p>Usa l'email e la password con cui ti sei registrato.</p>
      </header>

      <form (ngSubmit)="accedi(f.invalid)" #f="ngForm" novalidate>
        <div class="campo" [class.errato]="emailM.invalid && (emailM.touched || inviato())">
          <input id="email" type="email" name="email" [(ngModel)]="email" #emailM="ngModel"
                 required email placeholder=" " autocomplete="username"
                 [attr.aria-invalid]="emailM.invalid && (emailM.touched || inviato())"
                 aria-describedby="email-msg" />
          <label for="email">Email</label>
          @if (emailM.invalid && (emailM.touched || inviato())) {
            <p class="msg-campo" id="email-msg">
              {{ emailM.errors?.['required'] ? 'Scrivi la tua email.' : 'Questo indirizzo non sembra valido.' }}
            </p>
          }
        </div>

        <div class="campo con-azione" [class.errato]="pwdM.invalid && (pwdM.touched || inviato())">
          <input id="password" [type]="mostraPwd() ? 'text' : 'password'" name="password"
                 [(ngModel)]="password" #pwdM="ngModel" required placeholder=" "
                 autocomplete="current-password" aria-describedby="pwd-msg" />
          <label for="password">Password</label>
          <button type="button" class="occhio" (click)="mostraPwd.set(!mostraPwd())"
                  [attr.aria-pressed]="mostraPwd()"
                  [attr.aria-label]="mostraPwd() ? 'Nascondi la password' : 'Mostra la password'">
            @if (mostraPwd()) {
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4 9.5 6-.4.8-1.2 2-2.4 3.2M6.2 7.6C4.4 8.9 3.1 10.6 2.5 12c1 2 4.5 6 9.5 6 1.6 0 3-.4 4.2-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
            }
          </button>
          @if (pwdM.invalid && (pwdM.touched || inviato())) {
            <p class="msg-campo" id="pwd-msg">Scrivi la password.</p>
          }
        </div>

        @if (errore(); as e) {
          <div class="avviso" [class.rete]="e.tipo === 'rete'" role="alert">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              @if (e.tipo === 'rete') {
                <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              } @else {
                <path d="M12 3l9 16H3z M12 10v4 M12 17v.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
              }
            </svg>
            <strong>{{ e.titolo }}</strong>
            <p>{{ e.dettaglio }}</p>
          </div>
        }

        <button type="submit" class="btn-primary invia" [disabled]="caricamento()">
          @if (caricamento()) { <span class="spinner" aria-hidden="true"></span> Verifica in corso }
          @else { Accedi }
        </button>
      </form>

      <p class="alt">Non hai ancora un account? <a routerLink="/registrati">Unisciti alla Federazione</a></p>

      <!-- Accesso rapido alle utenze di prova: esiste solo in sviluppo,
           in produzione l'elenco è vuoto e il blocco non viene disegnato. -->
      @if (profili.length) {
        <section class="prova" aria-labelledby="t-prova">
          <h2 id="t-prova">Utenze di prova</h2>
          <p>Solo in sviluppo. Password per tutte: <code>{{ profili[0].password }}</code></p>
          <ul>
            @for (p of profili; track p.email) {
              <li>
                <button type="button" class="prova-utenza" [disabled]="caricamento()" (click)="accediCome(p)">
                  <span class="ruolo">{{ p.ruolo }}</span>
                  <span class="persona">{{ p.nome }}</span>
                  <span class="dettaglio">{{ p.ambito }}</span>
                </button>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  </fidc-auth-shell>
  `
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';

  /** Utenze di prova del seeder (vuoto in produzione). */
  readonly profili = environment.profiliDiProva;

  readonly caricamento = signal(false);
  readonly inviato = signal(false);
  readonly mostraPwd = signal(false);
  readonly errore = signal<ErroreAccesso | null>(null);

  /** Compila il modulo con un'utenza di prova ed entra (solo sviluppo). */
  accediCome(profilo: ProfiloDiProva): void {
    this.email = profilo.email;
    this.password = profilo.password;
    this.accedi();
  }

  /** @param nonValido true se il modulo ha campi da correggere: si mostrano i messaggi e ci si ferma. */
  accedi(nonValido: boolean | null = false): void {
    if (this.caricamento()) return;
    this.inviato.set(true);
    this.errore.set(null);
    if (nonValido || !this.email.trim() || !this.password) return;

    this.caricamento.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.caricamento.set(false);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/admin';
        this.router.navigateByUrl(redirect);
      },
      error: (err: unknown) => {
        this.caricamento.set(false);
        this.errore.set(this.auth.classificaErrore(err));
      }
    });
  }
}
