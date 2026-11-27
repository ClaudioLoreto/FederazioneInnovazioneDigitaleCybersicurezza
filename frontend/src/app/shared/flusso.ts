// =============================================================================
//  frontend/src/app/shared/flusso.ts
//  FLUSSO DI REVISIONE — che cosa può fare la persona collegata su un
//  contenuto (news, evento, documento), dati i suoi permessi e lo stato.
//
//    Bozza ──Invia in revisione──► In revisione ──Approva──► Pubblicato
//      ▲                               │
//      └──────── Da rivedere ◄──Rimanda all'autore (con nota)
//
//  Chi ha "Pubblica da sé" salta la revisione per i propri contenuti.
//  Chi ha "Revisiona" approva o rimanda i contenuti degli altri.
//  La Direzione può tutto. Il server verifica di nuovo ogni passaggio.
// =============================================================================

import { AuthService } from '../services/auth.service';
import { StatoContenuto, statoDi } from '../services/fidc-api.service';
import { AreaContenuti } from './permessi';

/** Etichetta dello stato, concordata con il nome del contenuto. */
export function etichettaStato(stato: StatoContenuto, femminile = false): string {
  switch (stato) {
    case 'Bozza': return 'Bozza';
    case 'InRevisione': return 'In revisione';
    case 'DaRivedere': return 'Da rivedere';
    default: return femminile ? 'Pubblicata' : 'Pubblicato';
  }
}

/** Contenuto con un autore e uno stato. */
export interface ContenutoFlusso {
  pubblicato?: boolean;
  stato?: StatoContenuto;
  /** Id dell'autore (autoreId, relatoreId o caricatoDaId secondo l'area). */
  autore: number;
}

/** Regole del flusso per un'area, valutate sui permessi della persona collegata. */
export class Flusso {
  constructor(private readonly auth: AuthService, readonly area: AreaContenuti) {}

  private puo(azione: 'scrivere' | 'modificare' | 'revisionare' | 'pubblicare'): boolean {
    return this.auth.puo(`${this.area}.${azione}`);
  }

  mio(c: ContenutoFlusso): boolean { return c.autore === this.auth.userId(); }
  stato(c: ContenutoFlusso): StatoContenuto { return statoDi(c); }

  /** Può creare nuovi contenuti. */
  get puoCreare(): boolean { return this.puo('scrivere'); }
  /** Pubblica i propri contenuti senza revisione. */
  get pubblicaDaSe(): boolean { return this.puo('pubblicare'); }
  /** Vede la coda dei contenuti da approvare. */
  get revisiona(): boolean { return this.puo('revisionare'); }

  /** Può aprire il contenuto nel modulo di modifica. */
  puoModificare(c: ContenutoFlusso): boolean {
    return this.mio(c) ? this.puo('scrivere') : this.puo('modificare') || this.puo('revisionare');
  }

  /** Può eliminarlo: l'autore i propri, chi modifica quelli altrui. */
  puoEliminare(c: ContenutoFlusso): boolean {
    return this.mio(c) ? this.puo('scrivere') : this.puo('modificare');
  }

  /** Può approvarlo o rimandarlo: è in revisione e non è suo (la Direzione anche i propri). */
  puoRevisionare(c: ContenutoFlusso): boolean {
    return this.stato(c) === 'InRevisione' && this.puo('revisionare') && (!this.mio(c) || this.auth.isSuperUser());
  }

  /**
   * Stato con cui salvare quando si preme il bottone principale del modulo:
   * pubblica chi può farlo da sé (o chi sta rivedendo un contenuto altrui),
   * tutti gli altri lo mandano in revisione.
   */
  statoAlSalvataggio(c: ContenutoFlusso | null): StatoContenuto {
    if (c && !this.mio(c) && (this.puo('revisionare') || this.puo('modificare')) && this.stato(c) === 'Pubblicato') return 'Pubblicato';
    if (c && this.puoRevisionare(c)) return 'Pubblicato';
    return this.pubblicaDaSe ? 'Pubblicato' : 'InRevisione';
  }
}
