// =============================================================================
//  frontend/src/app/services/fidc-api.service.ts
//  Servizio centrale per le chiamate REST al backend FIDC.
//  Tipizza le risposte e centralizza la base URL dell'API.
// =============================================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Payload di registrazione (specchio del DTO backend RegisterRequest). */
export interface RegisterRequest {
  nome: string;
  cognome: string;
  email: string;
  password: string;
}

/** Risposta di autenticazione (specchio di AuthResponse). */
export interface AuthResponse {
  token: string;
  nomeCompleto: string;
  ruolo: string;
}

/** Pilastro tematico (specchio dell'enum backend PilastroTipo, serializzato come stringa). */
export type Pilastro = 'Attivita' | 'Eventi' | 'Formazione' | 'Ricerca';

/** Evento pubblico (specchio dell'entità Evento). */
export interface Evento {
  id: number;
  titolo: string;
  sottotitolo?: string | null;
  descrizione: string;
  pilastro: Pilastro;
  dataInizio: string;        // ISO 8601
  dataFine?: string | null;
  luogo: string;
  postiTotali: number;
  pubblicato: boolean;
  relatoreId: number;
}

/** News pubblica (specchio dell'entità News). */
export interface News {
  id: number;
  titolo: string;
  sommario: string;
  contenuto: string;
  slug: string;
  pilastro: Pilastro;
  immagineCopertina?: string | null;
  pubblicato: boolean;
  dataPubblicazione?: string | null;
  autoreId: number;
}

/** Visibilità di un documento (specchio di VisibilitaDocumento). */
export type VisibilitaDocumento = 'Pubblico' | 'Riservato';

/** Documento dell'Area Documenti (specchio dell'entità Documento). */
export interface Documento {
  id: number;
  titolo: string;
  descrizione?: string | null;
  url: string;
  categoria: string;
  visibilita: VisibilitaDocumento;
  caricatoDaId: number;
}

/** Utente del backoffice (specchio sintetico dell'entità Utente). */
export interface UtenteAdmin {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: string;
  emailConfermata: boolean;
  createdAt: string;
}

/** Iscritto newsletter (specchio di IscrizioneNewsletter). */
export interface IscrittoNewsletter {
  id: number;
  email: string;
  nome?: string | null;
  attiva: boolean;
  createdAt: string;
}

/**
 * Configurazione del "velo" (tema) del portale — specchio di TemaConfigDto.
 * I colori sono esadecimali e appartengono SEMPRE ai 4 della palette FIDC.
 */
export interface TemaConfig {
  temaBase: '1' | '2' | '3';
  personalizzato: boolean;
  colorePrimario: string;
  coloreAccento: string;
  coloreSfondo: string;
  coloreTesto: string;
  stileRaggio: 'sharp' | 'soft' | 'rounded';
  abbinamentoFont: 'cyber' | 'moderno' | 'classico';
}

/**
 * Wrapper HTTP verso l'API .NET. La base URL è centralizzata in environment.ts
 * (dev: https://localhost:5001/api · prod: /api).
 */
@Injectable({ providedIn: 'root' })
export class FidcApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Registra un nuovo utente (innesca l'email Resend lato backend). */
  register(body: RegisterRequest): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(`${this.base}/auth/register`, body);
  }

  /** Effettua il login e ottiene un JWT. */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password });
  }

  /** Conferma l'email tramite email + token monouso. */
  confermaEmail(email: string, token: string): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(`${this.base}/auth/conferma-email`, { email, token });
  }

  /** Elenco pubblico degli eventi pubblicati (tipizzato). */
  getEventi(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.base}/eventi`);
  }

  /** Elenco pubblico delle news pubblicate (tipizzato, dalla più recente). */
  getNews(): Observable<News[]> {
    return this.http.get<News[]>(`${this.base}/news`);
  }

  // --- Backoffice (richiedono JWT, allegato dall'interceptor) ----------------

  /** Eventi gestibili: tutti per SuperUser, solo i propri per il Relatore. */
  getEventiGestione(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.base}/eventi/gestione`);
  }

  /** Crea un evento (l'owner è forzato lato server dal token). */
  creaEvento(body: Partial<Evento>): Observable<Evento> {
    return this.http.post<Evento>(`${this.base}/eventi`, body);
  }

  /** Aggiorna un evento esistente. */
  aggiornaEvento(id: number, body: Partial<Evento>): Observable<Evento> {
    return this.http.put<Evento>(`${this.base}/eventi/${id}`, body);
  }

  /** Elimina (soft-delete) un evento. */
  eliminaEvento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/eventi/${id}`);
  }

  /** News gestibili: tutte per SuperUser, solo le proprie per il Relatore. */
  getNewsGestione(): Observable<News[]> {
    return this.http.get<News[]>(`${this.base}/news/gestione`);
  }

  /** Crea una news (l'autore è forzato lato server dal token). */
  creaNews(body: Partial<News>): Observable<News> {
    return this.http.post<News>(`${this.base}/news`, body);
  }

  /** Aggiorna una news esistente. */
  aggiornaNews(id: number, body: Partial<News>): Observable<News> {
    return this.http.put<News>(`${this.base}/news/${id}`, body);
  }

  /** Elimina (soft-delete) una news. */
  eliminaNews(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/news/${id}`);
  }

  // --- Newsletter ------------------------------------------------------------

  /** Iscrizione pubblica alla newsletter (anonimo). */
  iscriviNewsletter(email: string, nome?: string): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(`${this.base}/newsletter`, { email, nome });
  }

  /** Elenco iscritti newsletter (solo SuperUser). */
  getIscrittiNewsletter(): Observable<IscrittoNewsletter[]> {
    return this.http.get<IscrittoNewsletter[]>(`${this.base}/newsletter`);
  }

  /** Rimuove (soft-delete) un iscritto newsletter (solo SuperUser). */
  eliminaIscrittoNewsletter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/newsletter/${id}`);
  }

  // --- Area Documenti --------------------------------------------------------

  /** Documenti pubblici (anonimo). */
  getDocumentiPubblici(): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.base}/documenti`);
  }

  /**
   * Documenti dell'AREA RISERVATA (biblioteca soci): tutti i documenti,
   * pubblici e riservati, in sola lettura. Richiede autenticazione.
   */
  getDocumentiRiservati(): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.base}/documenti/riservati`);
  }

  /** Documenti gestibili: tutti (SuperUser) o propri (Relatore). */
  getDocumentiGestione(): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.base}/documenti/gestione`);
  }

  /** Crea un documento (owner forzato dal token). */
  creaDocumento(body: Partial<Documento>): Observable<Documento> {
    return this.http.post<Documento>(`${this.base}/documenti`, body);
  }

  /** Aggiorna un documento. */
  aggiornaDocumento(id: number, body: Partial<Documento>): Observable<Documento> {
    return this.http.put<Documento>(`${this.base}/documenti/${id}`, body);
  }

  /** Elimina (soft-delete) un documento. */
  eliminaDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/documenti/${id}`);
  }

  // --- Gestione Utenti (solo SuperUser) --------------------------------------

  /** Elenco completo utenti. */
  getUtenti(): Observable<UtenteAdmin[]> {
    return this.http.get<UtenteAdmin[]>(`${this.base}/utenti`);
  }

  /** Cambia il ruolo RBAC di un utente. */
  cambiaRuoloUtente(id: number, ruolo: string): Observable<UtenteAdmin> {
    return this.http.put<UtenteAdmin>(`${this.base}/utenti/${id}/ruolo`, { ruolo });
  }

  /** Elimina (soft-delete) un utente. */
  eliminaUtente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/utenti/${id}`);
  }

  // --- Tema / Theme Builder --------------------------------------------------

  /** Legge il velo attualmente attivo (pubblico, usato dal ThemeService). */
  getTemaAttivo(): Observable<TemaConfig> {
    return this.http.get<TemaConfig>(`${this.base}/tema/attivo`);
  }

  /** Salva/aggiorna il velo attivo (solo SuperUser). */
  salvaTema(body: TemaConfig): Observable<TemaConfig> {
    return this.http.put<TemaConfig>(`${this.base}/tema`, body);
  }
}
