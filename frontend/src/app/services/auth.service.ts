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
import {
  AssettoPermessi, Permesso, assettoDaRuolo, consente, consenteUno, livello, normalizza, riassunto
} from '../shared/permessi';

/** Chiavi usate per persistere la sessione nel browser. */
const TOKEN_KEY = 'fidc.jwt';
const USER_KEY = 'fidc.user';

/** Dati minimi dell'utente autenticato conservati lato client. */
export interface SessioneUtente {
  nomeCompleto: string;
  ruolo: string;
  direzione?: boolean;
  permessi?: string[];
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
  /**
   * Permessi della persona collegata. Se il server li invia si usano quelli;
   * altrimenti si ricavano dal ruolo storico (shared/permessi.ts).
   */
  readonly assetto = computed<AssettoPermessi | null>(() => {
    const u = this._utente();
    if (!u) return null;
    if (u.direzione !== undefined || u.permessi !== undefined)
      return { direzione: !!u.direzione, permessi: normalizza(u.permessi ?? []) };
    return assettoDaRuolo(u.ruolo);
  });
  /** True se la persona ha il controllo completo (Direzione). */
  readonly isSuperUser = computed(() => !!this.assetto()?.direzione);
  /** "Direzione", "Redazione" o "Socio". */
  readonly livello = computed(() => livello(this.assetto()));
  /** Che cosa può fare, in una riga. */
  readonly riassunto = computed(() => riassunto(this.assetto()));

  /** Vero se la persona ha il permesso (la Direzione li ha tutti). */
  puo(p: Permesso): boolean { return consente(this.assetto(), p); }
  /** Vero se la persona ha almeno uno dei permessi. */
  puoUno(ps: Permesso[]): boolean { return consenteUno(this.assetto(), ps); }
  /** Email della persona collegata, se il token la contiene (claim "email"). */
  readonly email = computed(() => this.leggiClaim(this._token(), ['email', 'unique_name']) ?? '');
  /** Vero se la persona ha almeno un permesso da backoffice (non è un semplice Socio). */
  readonly haBackoffice = computed(() => { const a = this.assetto(); return !!a && (a.direzione || a.permessi.length > 0); });

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
    return this.classificaErrore(err).dettaglio;
  }

  /**
   * Classifica un errore di accesso in tre casi distinti, perché chiedono
   * azioni diverse: credenziali sbagliate (riprova), server irraggiungibile
   * (non è colpa tua, riprova più tardi), errore del server (avvisa).
   */
  classificaErrore(err: unknown): { tipo: 'credenziali' | 'rete' | 'server'; titolo: string; dettaglio: string } {
    const status = err instanceof HttpErrorResponse ? err.status : (err as { status?: number })?.status;
    if (status === 0) {
      return {
        tipo: 'rete',
        titolo: 'Server non raggiungibile',
        dettaglio: 'Il servizio di accesso non risponde. Controlla la connessione o riprova tra qualche minuto.'
      };
    }
    if (status === 400 || status === 401 || status === 403) {
      return {
        tipo: 'credenziali',
        titolo: 'Email o password non corrette',
        dettaglio: 'Controlla di aver scritto bene l\'indirizzo e la password, poi riprova.'
      };
    }
    return {
      tipo: 'server',
      titolo: 'Accesso non riuscito',
      dettaglio: 'Il server ha avuto un problema imprevisto. Riprova; se succede ancora, scrivi alla segreteria.'
    };
  }

  // --- helpers privati ------------------------------------------------------

  private salvaSessione(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    const utente: SessioneUtente = {
      nomeCompleto: res.nomeCompleto, ruolo: res.ruolo,
      ...(res.direzione !== undefined ? { direzione: res.direzione } : {}),
      ...(res.permessi !== undefined ? { permessi: res.permessi } : {})
    };
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

  /** Primo claim presente fra quelli indicati, come testo. */
  private leggiClaim(token: string | null, nomi: string[]): string | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      for (const n of nomi) {
        const v = payload?.[n] ?? payload?.[`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/${n === 'email' ? 'emailaddress' : n}`];
        if (typeof v === 'string' && v) return v;
      }
      return null;
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
