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
  /** Ruolo storico: resta finché il server non invia i permessi (docs/PERMESSI.md). */
  ruolo: string;
  /** Controllo completo. Assente sul server attuale: si ricava dal ruolo. */
  direzione?: boolean;
  /** Permessi della matrice (shared/permessi.ts). Assenti sul server attuale. */
  permessi?: string[];
}

/**
 * Stato di un contenuto nel flusso di revisione. Il server attuale conosce solo
 * "pubblicato sì/no": `statoDi()` ricava lo stato anche da quello.
 */
export type StatoContenuto = 'Bozza' | 'InRevisione' | 'DaRivedere' | 'Pubblicato';

/** Campi del flusso di revisione comuni a news, eventi e documenti. */
export interface FlussoRevisione {
  stato?: StatoContenuto;
  /** Nota lasciata da chi ha rimandato il contenuto all'autore. */
  notaRevisione?: string | null;
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
  stato?: StatoContenuto;
  notaRevisione?: string | null;
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
  stato?: StatoContenuto;
  notaRevisione?: string | null;
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
  /** Assente sul server attuale: un documento esistente è considerato pubblicato. */
  stato?: StatoContenuto;
  notaRevisione?: string | null;
}

/** Partecipante a un evento, come lo restituisce il backoffice (PartecipanteDto). */
export interface Partecipante {
  iscrizioneId: number;
  utenteId: number;
  nomeCompleto: string;
  email: string;
  iscrittoIl: string;
  presente: boolean;
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
  /** Matrice dei permessi (docs/PERMESSI.md). Assenti sul server attuale. */
  direzione?: boolean;
  permessi?: string[];
}

/** Profilo della persona collegata (area personale). */
export interface Account {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  /** Iscritta alla newsletter con questo indirizzo. */
  newsletter: boolean;
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
  /**
   * Figura mostrata nell'hero. Facoltativa: il backend attuale non ha ancora la
   * colonna, quindi oggi viene ricordata nel browser (vedi ThemeService).
   */
  emblemaHero?: 'cassaforte' | 'scudo' | 'nucleo';
}

/**
 * Wrapper HTTP verso l'API .NET. La base URL è centralizzata in environment.ts
 * (dev: http://localhost:5000/api · prod: /api).
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

  /** Singolo evento pubblicato (404 se non esiste o non è pubblicato). */
  getEvento(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.base}/eventi/${id}`);
  }

  /** Singola news pubblicata (404 se non esiste o non è pubblicata). */
  getNewsDettaglio(id: number): Observable<News> {
    return this.http.get<News>(`${this.base}/news/${id}`);
  }

  /** Iscrive l'utente collegato a un evento (409 se già iscritto). */
  iscriviEvento(eventoId: number): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(`${this.base}/iscrizioni/evento/${eventoId}`, {});
  }

  /** Iscritti a un evento (Direzione, o Redazione se l'evento è suo). */
  getPartecipanti(eventoId: number): Observable<Partecipante[]> {
    return this.http.get<Partecipante[]>(`${this.base}/iscrizioni/evento/${eventoId}`);
  }

  /** Annulla l'iscrizione dell'utente collegato a un evento. */
  annullaIscrizione(eventoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/iscrizioni/evento/${eventoId}`);
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


  /** Salva i permessi di una persona (solo Direzione). */
  salvaPermessi(id: number, assetto: { direzione: boolean; permessi: string[] }): Observable<UtenteAdmin> {
    return this.http.put<UtenteAdmin>(`${this.base}/utenti/${id}/permessi`, assetto);
  }

  // --- Area personale (docs/ACCOUNT.md) --------------------------------------

  /** Profilo della persona collegata. */
  getAccount(): Observable<Account> {
    return this.http.get<Account>(`${this.base}/account`);
  }

  /** Aggiorna nome e cognome. L'email si cambia solo tramite la segreteria. */
  aggiornaAccount(dati: { nome: string; cognome: string }): Observable<Account> {
    return this.http.put<Account>(`${this.base}/account`, dati);
  }

  /** Cambia la password, chiedendo quella attuale. */
  cambiaPassword(attuale: string, nuova: string): Observable<void> {
    return this.http.post<void>(`${this.base}/account/password`, { attuale, nuova });
  }

  /** Iscrive o disiscrive dalla newsletter la persona collegata. */
  impostaNewsletter(iscritto: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/account/newsletter`, { iscritto });
  }

  /** Elimina il proprio account (diritto alla cancellazione). */
  eliminaAccount(): Observable<void> {
    return this.http.delete<void>(`${this.base}/account`);
  }

  /** Eventi a cui la persona collegata è iscritta. */
  getMieIscrizioni(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.base}/iscrizioni/mie`);
  }

  /** Chiede l'email per reimpostare la password. Risponde sempre allo stesso modo. */
  passwordDimenticata(email: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/password-dimenticata`, { email });
  }

  /** Imposta una nuova password con il codice ricevuto per email. */
  reimpostaPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/reimposta-password`, { token, password });
  }

  // --- Flusso di revisione (news · eventi · documenti) ----------------------

  /** L'autore manda il contenuto in revisione. */
  inviaInRevisione(area: 'news' | 'eventi' | 'documenti', id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${area}/${id}/revisione`, {});
  }

  /** Il revisore approva: il contenuto viene pubblicato. */
  approva(area: 'news' | 'eventi' | 'documenti', id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${area}/${id}/approva`, {});
  }

  /** Il revisore rimanda il contenuto all'autore con una nota. */
  rimanda(area: 'news' | 'eventi' | 'documenti', id: number, nota: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${area}/${id}/rimanda`, { nota });
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

/** Stato di un contenuto, ricavato anche dal solo flag "pubblicato" del server attuale. */
export function statoDi(x: { pubblicato?: boolean; stato?: StatoContenuto }): StatoContenuto {
  if (x.stato) return x.stato;
  return x.pubblicato === false ? 'Bozza' : 'Pubblicato';
}
