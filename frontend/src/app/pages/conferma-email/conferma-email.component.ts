// =============================================================================
//  frontend/src/app/pages/conferma-email/conferma-email.component.ts
//  Pagina di atterraggio del link "Conferma la registrazione" inviato da Resend.
//  Legge email + token dalla query string e chiama l'endpoint di conferma.
// =============================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FidcApiService } from '../../services/fidc-api.service';

/** Stato visivo della conferma email. */
type Stato = 'attesa' | 'ok' | 'errore';

/**
 * Mostra l'esito della conferma email. Usa esclusivamente la palette FIDC.
 */
@Component({
  selector: 'fidc-conferma-email',
  standalone: true,
  template: `
    <main class="wrap">
      <div class="card">
        @switch (stato()) {
          @case ('attesa') {
            <div class="spinner"></div>
            <h1>Stiamo confermando la tua email…</h1>
            <p>Un istante, stiamo attivando il tuo account FIDC.</p>
          }
          @case ('ok') {
            <div class="check">✓</div>
            <h1>Email confermata!</h1>
            <p>{{ messaggio() }}</p>
            <a href="/login" class="cta">Accedi all'area riservata</a>
          }
          @case ('errore') {
            <div class="cross">!</div>
            <h1>Link non valido</h1>
            <p>{{ messaggio() }}</p>
            <a href="/" class="cta">Torna alla home</a>
          }
        }
      </div>
    </main>
  `,
  styles: [`
    /* Pagina di atterraggio del link ricevuto via email. Usa lo stesso
       pannello di vetro di accesso e registrazione: chi arriva qui deve
       riconoscere subito di essere sul sito della Federazione. */
    .wrap { min-height:100vh; display:grid; place-items:center; padding:24px; }
    .card {
      background: var(--surface-strong); color: var(--text);
      border: 1px solid var(--surface-border);
      backdrop-filter: blur(var(--surface-blur));
      padding:48px; max-width:520px; text-align:center; box-shadow: var(--glow-deep);
      border-radius: var(--radius);
    }
    h1 { margin:18px 0 10px; font-size:1.6rem; font-family: var(--font-display); }
    p { color: var(--text-soft); line-height:1.6; }
    .cta {
      display:inline-block; margin-top:24px;
      background: var(--accent); color: var(--on-accent);
      padding:14px 28px; font-weight:600; border-radius: max(var(--radius), 3px);
    }
    .cta:hover { filter: brightness(1.06); }
    .check, .cross { width:72px; height:72px; margin:0 auto; border-radius:50%; display:grid;
                     place-items:center; font-size:2.4rem; font-weight:900; }
    .check { background: var(--accent); color: var(--on-accent); }
    .cross { background: var(--accent-2); color: var(--on-accent-2); }
    .spinner { width:56px; height:56px; margin:0 auto; border-radius:50%;
               border:5px solid var(--accent-soft); border-top-color: var(--signal);
               animation: spin .9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  `]
})
export class ConfermaEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FidcApiService);

  /** Stato corrente della conferma. */
  readonly stato = signal<Stato>('attesa');
  /** Messaggio restituito dal backend. */
  readonly messaggio = signal('');

  /** All'avvio legge i parametri e chiama l'API di conferma. */
  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!email || !token) {
      this.stato.set('errore');
      this.messaggio.set('Parametri mancanti nel link di conferma.');
      return;
    }

    this.api.confermaEmail(email, token).subscribe({
      next: (r) => { this.stato.set('ok'); this.messaggio.set(r.messaggio); },
      error: () => {
        this.stato.set('errore');
        this.messaggio.set('Il link potrebbe essere scaduto o già utilizzato.');
      }
    });
  }
}
