# Area personale e recupero della password

> Stato: **frontend pronto, backend da adeguare.** Finché mancano gli endpoint,
> "La mia area" mostra il nome della sessione e dice, riquadro per riquadro, che
> cosa non si può caricare o salvare; il resto del sito non ne risente.

## Pagine

| Indirizzo | Per chi | Che cosa fa |
|---|---|---|
| `/area-personale` | chiunque abbia un account | i miei eventi (annulla), profilo, newsletter, cambio password, elimina account; "Vai al backoffice" se ha permessi |
| `/password-dimenticata` | tutti | chiede l'email e manda il collegamento |
| `/reimposta-password?token=…` | chi ha il collegamento | sceglie la nuova password |

Dopo l'accesso: chi ha almeno un permesso va al backoffice, un **Socio** (nessun
permesso) va in `/area-personale`. `/admin` respinge i Soci verso la loro area
(`backofficeGuard`). Da collegati, la testata mostra "La mia area" al posto di
"Area riservata" e "Unisciti".

## Contratto API richiesto al backend

Tutti gli endpoint `/api/account*` richiedono l'utente collegato e agiscono **solo
sul suo account** (l'id viene dal token, mai dal corpo della richiesta).

| Metodo e percorso | Corpo | Risposta |
|---|---|---|
| `GET /api/account` | — | `{ id, nome, cognome, email, newsletter: bool, createdAt }` |
| `PUT /api/account` | `{ nome, cognome }` | l'account aggiornato. L'email non si cambia qui. |
| `POST /api/account/password` | `{ attuale, nuova }` | 204; 400 se `attuale` è sbagliata o `nuova` < 8 caratteri |
| `PUT /api/account/newsletter` | `{ iscritto: bool }` | 204; iscrive o disiscrive l'email dell'account |
| `DELETE /api/account` | — | 204; cancella (o anonimizza) account e iscrizioni. Rifiutare se è l'ultima Direzione. |
| `GET /api/iscrizioni/mie` | — | gli eventi a cui l'utente è iscritto (passati e futuri) |
| `POST /api/auth/password-dimenticata` | `{ email }` | **sempre 204**, che l'email esista o no; se esiste, invia un collegamento `…/reimposta-password?token=…` |
| `POST /api/auth/reimposta-password` | `{ token, password }` | 204; 400 (o 410) se il token è scaduto o già usato |

Token di reimpostazione: casuale (almeno 32 byte), salvato solo come hash, monouso,
scadenza breve (es. 30 minuti), invalidato al cambio password. Limitare i tentativi
per indirizzo IP e per email. L'email si invia con lo stesso servizio della conferma
di registrazione (`Resend`, vedi `appsettings`).

## Consensi collegati

- Registrazione: `privacy` obbligatoria; `newsletter` facoltativa (il frontend, se
  spuntata, chiama `POST /api/newsletter` dopo la registrazione).
- Dall'area personale la newsletter si attiva e disattiva con `PUT /api/account/newsletter`.
