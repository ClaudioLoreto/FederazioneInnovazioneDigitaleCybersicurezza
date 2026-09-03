// =============================================================================
//  frontend/src/app/pages/admin-login/admin-login.component.ts
//  BACKOFFICE — Gate di accesso istituzionale (/admin/login e /login).
//  Form "smart": card cream ad alto contrasto, floating label, glow al focus.
//  Sviluppo in HTTP (http://localhost:5000): nessun avviso certificato.
//  Stile condiviso in shared/auth/auth-form.scss. Solo palette FIDC.
// =============================================================================

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';
import { environment } from '../../../environments/environment';
import type { ProfiloDiProva } from '../../../environments/tipi';

/**
 * Pagina di login del backoffice. Form controllato (email + password), stato di
 * caricamento/errore, redirect post-login e helper di sblocco certificato HTTPS.
 */
@Component({
  selector: 'fidc-admin-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, RouterLink, AnimatedLogoComponent],
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
    <!-- aloni luminosi di sfondo -->
    <div class="orb orb-a"></div>
    <div class="orb orb-b"></div>

    <section class="panel" [class.shattering]="shatter()" @enter>
      <div class="brand"><fidc-animated-logo></fidc-animated-logo></div>

      <p class="kicker">Area riservata</p>
      <h1>Accesso al backoffice</h1>
      <p class="lead">Inserisci le tue credenziali istituzionali per gestire eventi, news e iscrizioni.</p>

      <form (ngSubmit)="accedi()" #f="ngForm" autocomplete="off" [class.shattering]="shatter()">
        <div class="fld">
          <input id="email" type="email" name="email" [(ngModel)]="email" required
                 placeholder=" " [disabled]="caricamento()" autocomplete="username" />
          <label for="email">Email istituzionale</label>
        </div>

        <div class="fld">
          <input id="password" type="password" name="password" [(ngModel)]="password" required
                 placeholder=" " [disabled]="caricamento()" autocomplete="current-password" />
          <label for="password">Password</label>
        </div>

        <p class="error" *ngIf="errore()">{{ errore() }}</p>

        <button type="submit" class="enter" [disabled]="caricamento() || f.invalid || shatter()">
          <span *ngIf="!caricamento()">Accedi in sicurezza →</span>
          <span *ngIf="caricamento()" class="loading"><i class="dot"></i> Verifica in corso…</span>
        </button>
      </form>

      <!-- Accesso rapido alle utenze di prova. Esiste solo in sviluppo:
           in produzione l'elenco è vuoto e questo blocco non viene disegnato. -->
      <section class="dev-access" *ngIf="profili.length">
        <p class="dev-titolo">Utenze di prova <span>ambiente di sviluppo</span></p>
        <p class="dev-nota">Password comune a tutte: <code>{{ profili[0].password }}</code></p>
        <button *ngFor="let p of profili" type="button" class="dev-profilo"
                [disabled]="caricamento() || shatter()" (click)="accediCome(p)">
          <span class="dev-ruolo">{{ p.ruolo }}</span>
          <span class="dev-persona">{{ p.nome }}</span>
          <span class="dev-mail">{{ p.email }}</span>
          <span class="dev-ambito">{{ p.ambito }}</span>
        </button>
      </section>

      <p class="alt">Non hai un account? <a routerLink="/registrati">Registrati</a></p>
      <p class="footnote"><i class="lock">⛨</i> Accesso protetto · Accesso tracciato</p>
    </section>
  </main>
  `
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Campi del form (two-way binding). */
  email = '';
  password = '';

  /**
   * Utenze di prova del seeder. In produzione l'elenco è vuoto, quindi il
   * riquadro di accesso rapido semplicemente non esiste.
   */
  readonly profili = environment.profiliDiProva;

  /** Stato UI. */
  readonly caricamento = signal(false);
  readonly errore = signal<string | null>(null);
  /** Scomposizione HUD del form dopo login riuscito. */
  readonly shatter = signal(false);

  /**
   * Compila il modulo con l'utenza di prova scelta ed entra.
   * Serve a collaudare i due livelli di permessi senza riscrivere ogni volta
   * le credenziali. Disponibile solo in sviluppo.
   */
  accediCome(profilo: ProfiloDiProva): void {
    if (this.caricamento() || this.shatter()) return;
    this.email = profilo.email;
    this.password = profilo.password;
    this.accedi();
  }

  /** Esegue il login; in caso di successo scompone il form e redirige. */
  accedi(): void {
    if (this.caricamento() || this.shatter()) return;
    this.errore.set(null);
    this.caricamento.set(true);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.caricamento.set(false);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/admin';
        this.dopoShatter(() => this.router.navigateByUrl(redirect));
      },
      error: (err: unknown) => {
        this.caricamento.set(false);
        this.errore.set(this.auth.descriviErroreLogin(err));
      }
    });
  }

  /** Rispetta prefers-reduced-motion: niente shatter, navigazione immediata. */
  private dopoShatter(azione: () => void): void {
    const riduci = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (riduci) { azione(); return; }
    this.shatter.set(true);
    setTimeout(azione, 640);
  }
}
