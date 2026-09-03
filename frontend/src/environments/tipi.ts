// =============================================================================
//  frontend/src/environments/tipi.ts
//  Tipi condivisi dai file di configurazione dei due ambienti.
//
//  Stanno in un file a parte perché durante la compilazione di produzione
//  Angular SOSTITUISCE environment.ts con environment.prod.ts: se il secondo
//  importasse un tipo dal primo, l'import punterebbe a sé stesso.
// =============================================================================

/** Utenza di prova mostrata nella pagina di accesso in sviluppo. */
export interface ProfiloDiProva {
  /** Denominazione ufficiale del ruolo, quella che legge l'utente. */
  ruolo: string;
  /** Persona a cui l'utenza è intestata nei dati di esempio. */
  nome: string;
  /** Che cosa può fare, in una riga. */
  ambito: string;
  email: string;
  password: string;
}
