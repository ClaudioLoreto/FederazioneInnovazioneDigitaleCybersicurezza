// =============================================================================
//  frontend/src/app/shared/dialogo/dialogo.service.ts
//  Finestre di conferma e di avviso interne all'applicazione.
//
//  PERCHÉ NON USARE confirm() E alert() DEL BROWSER
//  Sono riquadri di sistema: mostrano l'indirizzo del sito ("localhost:4200
//  dice"), non si possono tradurre né adattare all'aspetto del prodotto, e
//  bloccano completamente la pagina. Su un sito istituzionale danno l'idea di
//  qualcosa lasciato a metà.
//
//  COME SI USA, da qualunque componente:
//
//      private readonly dialogo = inject(DialogoService);
//
//      async elimina(x: Cosa) {
//        const ok = await this.dialogo.conferma({
//          titolo: 'Eliminare la news?',
//          messaggio: `"${x.titolo}" sarà rimossa dal sito pubblico.`,
//          azione: 'Elimina',
//          distruttiva: true
//        });
//        if (!ok) return;
//        ...
//      }
//
//  Il servizio tiene lo stato; il disegno lo fa DialogoComponent, montato una
//  volta sola in app.component. Così non serve aggiungere niente alle pagine.
// =============================================================================

import { Injectable, signal } from '@angular/core';

/** Contenuto di una richiesta di conferma. */
export interface RichiestaConferma {
  /** Domanda breve, in cima. Deve poter essere letta da sola. */
  titolo: string;
  /** Conseguenza dell'azione, in una o due righe. */
  messaggio?: string;
  /** Testo del bottone che procede. Predefinito: "Conferma". */
  azione?: string;
  /** Testo del bottone che annulla. Predefinito: "Annulla". */
  annulla?: string;
  /**
   * Vero per le azioni irreversibili (eliminazioni). Cambia l'aspetto del
   * bottone e fa partire il fuoco su "Annulla" invece che su "Conferma":
   * chi preme Invio per abitudine non deve cancellare niente per sbaglio.
   */
  distruttiva?: boolean;
  /** Campo di testo da compilare (es. la nota per l'autore). */
  campo?: { etichetta: string; segnaposto?: string; obbligatorio?: boolean };
}

/** Stato interno della finestra attualmente aperta. */
interface StatoDialogo extends RichiestaConferma {
  /** Un avviso ha un solo bottone di chiusura. */
  soloAvviso: boolean;
  /** Funzione da richiamare con la risposta dell'utente. */
  rispondi: (esito: boolean) => void;
  /** Testo scritto nel campo, se c'è. */
  testo?: string;
}

@Injectable({ providedIn: 'root' })
export class DialogoService {
  /** Finestra attualmente aperta, oppure null. Letto da DialogoComponent. */
  readonly stato = signal<StatoDialogo | null>(null);

  /**
   * Chiede una conferma e attende la risposta.
   * @returns true se l'utente ha confermato, false se ha annullato o chiuso.
   */
  conferma(richiesta: RichiestaConferma): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.stato.set({
        ...richiesta,
        azione: richiesta.azione ?? 'Conferma',
        annulla: richiesta.annulla ?? 'Annulla',
        soloAvviso: false,
        rispondi: (esito) => { this.stato.set(null); resolve(esito); }
      });
    });
  }

  /**
   * Chiede un testo (es. una nota) e attende la risposta.
   * @returns il testo scritto, oppure null se l'utente ha annullato.
   */
  chiedi(richiesta: RichiestaConferma & { campo: NonNullable<RichiestaConferma['campo']> }): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const stato: StatoDialogo = {
        ...richiesta,
        azione: richiesta.azione ?? 'Conferma',
        annulla: richiesta.annulla ?? 'Annulla',
        soloAvviso: false,
        testo: '',
        rispondi: (esito) => { const t = this.stato()?.testo ?? ''; this.stato.set(null); resolve(esito ? t.trim() : null); }
      };
      this.stato.set(stato);
    });
  }

  /** Aggiorna il testo del campo mentre l'utente scrive. */
  scrivi(testo: string): void {
    const s = this.stato();
    if (s) this.stato.set({ ...s, testo });
  }

  /**
   * Comunica un esito che non richiede scelte (tipicamente un errore).
   * Sostituisce alert().
   */
  avvisa(titolo: string, messaggio?: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.stato.set({
        titolo,
        messaggio,
        azione: 'Ho capito',
        soloAvviso: true,
        rispondi: () => { this.stato.set(null); resolve(); }
      });
    });
  }

  /** Chiude la finestra come se l'utente avesse annullato (tasto Esc, clic fuori). */
  chiudi(): void {
    this.stato()?.rispondi(false);
  }
}
