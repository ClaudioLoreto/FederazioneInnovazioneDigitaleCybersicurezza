// =============================================================================
//  frontend/src/app/pages/registrazione/registrazione.component.ts
//  REGISTRAZIONE UTENTE (/registrati).
//  Form "smart" (card cream ad alto contrasto, floating label, glow al focus)
//  che chiama l'endpoint .NET POST /api/auth/register → l'utente viene SALVATO
//  su SQLite (dev) e riceve l'email di conferma (Resend).
//  Stile condiviso in shared/auth/auth-form.scss. Palette FERREA a 4 colori.
// =============================================================================

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { FidcApiService, RegisterRequest } from '../../services/fidc-api.service';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';

/**
 * Pagina di registrazione del backoffice. Raccoglie i dati anagrafici, valida
 * lato client e delega la persistenza al backend (.NET → EF Core → SQLite).
 */
@Component({
  selector: 'fidc-registrazione',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink, AnimatedLogoComponent],
  styleUrls: ['../../shared/auth/auth-form.scss'],
  animations: [
    trigger('enter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(.97)' }),
        animate('560ms cubic-bezier(.2,.9,.3,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ],
  template: `
  <main class="gate">
    <div class="orb orb-a"></div>
    <div class="orb orb-b"></div>

    <section class="panel" [class.shattering]="shatter() && !completato()" @enter>
      <div class="brand"><fidc-animated-logo></fidc-animated-logo></div>

      <p class="kicker">Crea il tuo account</p>
      <h1>Registrazione</h1>
      <p class="lead">Unisciti alla Federazione: gestisci eventi e contenuti dopo
        aver confermato l'email che ti invieremo.</p>

      <!-- Esito positivo: messaggio del backend -->
      <div class="success" *ngIf="completato()">
        <div class="check">✓</div>
        <h2>Registrazione completata</h2>
        <p>{{ messaggio() }}</p>
        <a class="enter" routerLink="/admin/login">Vai all'accesso →</a>
      </div>

      <!-- Form di registrazione -->
      <form *ngIf="!completato()" (ngSubmit)="registra()" #f="ngForm" autocomplete="off"
            [class.shattering]="shatter()">
        <div class="row">
          <div class="fld">
            <input id="nome" name="nome" [(ngModel)]="model.nome" required
                   placeholder=" " [disabled]="caricamento()" />
            <label for="nome">Nome</label>
          </div>
          <div class="fld">
            <input id="cognome" name="cognome" [(ngModel)]="model.cognome" required
                   placeholder=" " [disabled]="caricamento()" />
            <label for="cognome">Cognome</label>
          </div>
        </div>

        <div class="fld">
          <input id="email" type="email" name="email" [(ngModel)]="model.email" required email
                 placeholder=" " [disabled]="caricamento()" autocomplete="email" />
          <label for="email">Email istituzionale</label>
        </div>

        <div class="fld">
          <input id="password" type="password" name="password" [(ngModel)]="model.password" required minlength="8"
                 placeholder=" " [disabled]="caricamento()" autocomplete="new-password" />
          <label for="password">Password (almeno 8 caratteri)</label>
        </div>

        <p class="error" *ngIf="errore()">{{ errore() }}</p>

        <button type="submit" class="enter" [disabled]="caricamento() || f.invalid || shatter()">
          <span *ngIf="!caricamento()">Crea account →</span>
          <span *ngIf="caricamento()" class="loading"><i class="dot"></i> Registrazione in corso…</span>
        </button>
      </form>

      <p class="alt" *ngIf="!completato()">
        Hai già un account? <a routerLink="/admin/login">Accedi</a>
      </p>
    </section>
  </main>
  `
})
export class RegistrazioneComponent {
  private readonly api = inject(FidcApiService);

  /** Modello del form (two-way binding). */
  model: RegisterRequest = { nome: '', cognome: '', email: '', password: '' };

  /** Stato UI. */
  readonly caricamento = signal(false);
  readonly errore = signal<string | null>(null);
  readonly completato = signal(false);
  readonly messaggio = signal('');
  readonly shatter = signal(false);

  /** Invia la registrazione al backend (.NET → SQLite). */
  registra(): void {
    if (this.caricamento() || this.shatter()) return;
    this.errore.set(null);
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
        this.dopoShatter(() => this.completato.set(true));
      },
      error: (err: unknown) => {
        this.caricamento.set(false);
        const status = err instanceof HttpErrorResponse ? err.status : (err as { status?: number })?.status;
        const messaggioServer = err instanceof HttpErrorResponse ? err.error?.messaggio : undefined;
        this.errore.set(
          messaggioServer
            ?? (status === 0
              ? 'Impossibile contattare il server. Verifica che l\'API sia avviata.'
              : 'Registrazione non riuscita. Riprova.')
        );
      }
    });
  }

  private dopoShatter(azione: () => void): void {
    const riduci = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (riduci) { azione(); return; }
    this.shatter.set(true);
    setTimeout(azione, 640);
  }
}
