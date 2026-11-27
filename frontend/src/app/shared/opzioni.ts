// =============================================================================
//  frontend/src/app/shared/opzioni.ts
//  Elenchi di scelta usati in più schermate del backoffice.
//
//  Stanno qui perché gli stessi valori compaiono nella gestione eventi, nella
//  gestione news e nei filtri pubblici: ripeterli in ogni componente vorrebbe
//  dire, prima o poi, scrivere "Attività" in un punto e "Attivita" in un altro.
//
//  I valori tecnici (a sinistra) devono corrispondere agli enum del backend in
//  FIDC.Models/Enums: se ne aggiungi uno lì, aggiungilo anche qui.
// =============================================================================

import type { OpzioneSelezione } from './campi/selezione.component';

/** I quattro pilastri della Federazione. */
export const PILASTRI: OpzioneSelezione[] = [
  { valore: 'Attivita', etichetta: 'Attività' },
  { valore: 'Eventi', etichetta: 'Eventi' },
  { valore: 'Formazione', etichetta: 'Formazione' },
  { valore: 'Ricerca', etichetta: 'Ricerca' }
];

/** Chi può scaricare un documento dall'area documenti. */
export const VISIBILITA_DOCUMENTO: OpzioneSelezione[] = [
  { valore: 'Pubblico', etichetta: 'Pubblico — visibile a chiunque' },
  { valore: 'Riservato', etichetta: 'Riservato — solo utenti registrati' }
];

/** Etichetta leggibile di un pilastro a partire dal valore tecnico. */
export function etichettaPilastro(valore: string): string {
  return PILASTRI.find((p) => p.valore === valore)?.etichetta ?? valore;
}
