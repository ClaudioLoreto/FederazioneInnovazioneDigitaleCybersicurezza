// =============================================================================
//  frontend/src/app/services/auth.service.ts
//  Gestione della sessione di backoffice: login, persistenza del JWT in
//  localStorage e stato reattivo dell'utente autenticato.
// =============================================================================

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { FidcApiService, AuthResponse } from './fidc-api.service';

/** Chiavi usate per persistere la sessione nel browser. */
const TOKEN_KEY = 'fidc.jwt';
const USER_KEY = 'fidc.user';

/** Dati minimi dell'utente autenticato conservati lato client. */
export interface SessioneUtente {
  nomeCompleto: string;
  ruolo: string;
}

/** Ruoli applicativi (specchio dell'enum backend RuoloTipo). */
export type Ruolo = 'SuperUser' | 'Relatore';

/**
 * Stato di autenticazione del backoffice. Il JWT viene salvato in localStorage
 * e ripristinato all'avvio dell'app; i segnali espongono lo stato corrente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(FidcApiService);

  /** Token JWT corrente (null se non autenticato). */
  private readonly _token = signal<string | null>(this.leggiToken());
  /** Utente corrente (null se non autenticato). */
  private readonly _utente = signal<SessioneUtente | null>(this.leggiUtente());

  /** True se esiste una sessione valida in memoria. */
  readonly autenticato = computed(() => this._token() !== null);
  /** Utente autenticato corrente (sola lettura). */
  readonly utente = computed(() => this._utente());
  /** Ruolo corrente (null se non autenticato). */
  readonly ruolo = computed<Ruolo | null>(() => (this._utente()?.ruolo as Ruolo) ?? null);
  /** True se l'utente corrente è SuperUser. */
  readonly isSuperUser = computed(() => this.ruolo() === 'SuperUser');
  /** Id numerico dell'utente corrente (dal claim "sub" del JWT), 0 se ignoto. */
  readonly userId = computed(() => this.estraiUserId(this._token()));

  /** Esegue il login e persiste token + utente in localStorage. */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.login(email, password).pipe(
      tap((res) => this.salvaSessione(res))
    );
  }

  /** Termina la sessione e ripulisce lo storage. */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._utente.set(null);
  }

  /** Restituisce il token corrente (per gli header Authorization). */
  get token(): string | null {
    return this._token();
  }

  /**
   * Traduce un errore HTTP del login in un messaggio chiaro per l'utente,
   * differenziando per status code (UX: niente più messaggi generici).
   *  - 0           → rete/CORS/certificato HTTPS non accettato
   *  - 400 / 401   → credenziali non valide
   *  - 500+        → errore interno del server
   * @param err Errore catturato dalla sottoscrizione (tipicamente HttpErrorResponse).
   */
  descriviErroreLogin(err: unknown): string {
    const status = err instanceof HttpErrorResponse ? err.status : (err as { status?: number })?.status;

    switch (status) {
      case 0:
        // Nessuna risposta HTTP: server spento, CORS bloccato o certificato non accettato.
        return 'Impossibile connettersi al server. Verifica che le API siano in esecuzione e accetta il certificato HTTPS.';
      case 400:
      case 401:
        return 'Credenziali non valide. Riprova.';
      case 500:
        return 'Errore interno del server.';
      default:
        // 5xx generici → comunque problema lato server; altri casi → fallback prudente.
        if (typeof status === 'number' && status >= 500) return 'Errore interno del server.';
        return 'Accesso non riuscito. Riprova tra qualche istante.';
    }
  }

  // --- helpers privati ------------------------------------------------------

  private salvaSessione(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    const utente: SessioneUtente = { nomeCompleto: res.nomeCompleto, ruolo: res.ruolo };
    localStorage.setItem(USER_KEY, JSON.stringify(utente));
    this._token.set(res.token);
    this._utente.set(utente);
  }

  private leggiToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private leggiUtente(): SessioneUtente | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessioneUtente;
    } catch {
      return null;
    }
  }

  /** Decodifica il payload del JWT per estrarre l'Id utente (claim "sub"). */
  private estraiUserId(token: string | null): number {
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const sub = payload?.sub ?? payload?.nameid;
      const id = Number(sub);
      return Number.isFinite(id) ? id : 0;
    } catch {
      return 0;
    }
  }
}
