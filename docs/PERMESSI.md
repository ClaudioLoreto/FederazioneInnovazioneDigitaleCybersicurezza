# Matrice dei permessi e flusso di revisione

> Stato: **frontend pronto, backend da adeguare.** Finché il server invia solo il
> ruolo storico (`SuperUser` / `Relatore`), il frontend ricava i permessi dal ruolo
> (`assettoDaRuolo` in `frontend/src/app/shared/permessi.ts`) e tutto funziona come
> prima. Quando il server invierà i permessi veri, il frontend li userà senza
> modifiche.

## Perché

Non esistono più ruoli fissi. Ogni persona ha un insieme di permessi (flag) che la
Direzione modifica dalla sezione **Backoffice → Permessi**. Menu, bottoni e filtri
del backoffice si adattano ai flag. Il server li verifica a ogni richiesta.

## Tre livelli (derivati, non salvati)

| Livello | Quando | Che cosa vede |
|---|---|---|
| **Socio** | nessun permesso | solo l'area personale: account, iscrizioni agli eventi, newsletter |
| **Redazione** | almeno un permesso | le sezioni del backoffice per cui ha permessi |
| **Direzione** | `direzione = true` | tutto, compresa la sezione Permessi |

Chi si registra dal sito è **Socio**. La Direzione lo promuove assegnandogli permessi.

## Catalogo dei permessi

Per ciascuna area di contenuto (`news`, `eventi`, `documenti`):

| Permesso | Colonna | Consente |
|---|---|---|
| `<area>.scrivere` | Scrive / Carica | creare contenuti e modificare i propri |
| `<area>.pubblicare` | Pubblica da sé | pubblicare i propri senza revisione (richiede `scrivere`) |
| `<area>.modificare` | Modifica altrui | modificare ed eliminare contenuti di altri autori |
| `<area>.revisionare` | Revisiona | approvare (pubblicare) o rimandare all'autore i contenuti in revisione |

Inoltre:

| Permesso | Consente |
|---|---|
| `eventi.iscritti` | vedere ed esportare gli iscritti agli eventi |
| `newsletter.gestire` | gestire gli iscritti alla newsletter |
| `utenti.gestire` | gestire gli account (conferme, eliminazioni) |
| `sito.contenuti` | modificare testi istituzionali, annunci, contenuti in evidenza |
| `sito.aspetto` | Theme Builder (velo, colori, caratteri, emblema) |

**Delegare la revisione** = dare `<area>.revisionare` a una persona di Redazione.

## Flusso di revisione

```
Bozza ──invia──► InRevisione ──approva──► Pubblicato
  ▲                  │
  └── DaRivedere ◄───┘ rimanda (con nota obbligatoria)
```

- Chi ha `pubblicare` salva direttamente in `Pubblicato`.
- Chi non ce l'ha può solo `Bozza` o `InRevisione`: se invia `Pubblicato` il server
  risponde **403** (o abbassa a `InRevisione`, a scelta, ma in modo documentato).
- Nessuno approva i propri contenuti, tranne la Direzione.

## Contratto API richiesto al backend

### Autenticazione
`POST /api/auth/login` → aggiungere alla risposta:
```json
{ "token": "…", "nomeCompleto": "…", "ruolo": "Relatore",
  "direzione": false, "permessi": ["news.scrivere", "eventi.scrivere"] }
```
Nel JWT: claim `fidc:direzione` (`true`/`false`) e un claim `fidc:perm` per ciascun
permesso. Policy ASP.NET: `[Authorize(Policy = "news.revisionare")]` ecc., con un
handler che fa passare sempre chi ha `fidc:direzione = true`.

### Account e permessi
- `GET /api/utenti` → ogni utente con `direzione: bool` e `permessi: string[]`.
- `PUT /api/utenti/{id}/permessi` body `{ "direzione": bool, "permessi": string[] }`
  → solo Direzione. Rifiutare (400) chi toglie la Direzione a se stesso e
  l'ultima persona con Direzione. Ignorare i permessi sconosciuti; togliere
  `pubblicare` se manca `scrivere`.

### Contenuti (news, eventi, documenti)
- Campi nuovi: `Stato` (`Bozza` | `InRevisione` | `DaRivedere` | `Pubblicato`),
  `NotaRevisione` (string, nullable). `Pubblicato` (bool) resta, derivato da `Stato`.
- `POST /api/{area}` e `PUT /api/{area}/{id}` accettano `stato` e lo validano
  contro i permessi (vedi sopra).
- `POST /api/{area}/{id}/revisione` → l'autore invia in revisione.
- `POST /api/{area}/{id}/approva` → `revisionare`; stato `Pubblicato`, nota azzerata.
- `POST /api/{area}/{id}/rimanda` body `{ "nota": "…" }` → `revisionare`; stato
  `DaRivedere`. Nota obbligatoria.
- `GET /api/{area}/gestione` restituisce: i propri contenuti; quelli altrui se si ha
  `modificare`; quelli in `InRevisione` se si ha `revisionare`; tutti per la Direzione.

### Migrazione dati
- `Utenti`: colonne `Direzione` (bool) e `Permessi` (testo, elenco separato da
  virgole, oppure tabella `UtentiPermessi(UtenteId, Permesso)`).
- Valori iniziali: `SuperUser` → `Direzione = 1`; `Relatore` → permessi
  `news|eventi|documenti.scrivere`, `news|eventi|documenti.pubblicare`, `eventi.iscritti`
  (gli stessi poteri di oggi, così nulla cambia per chi c'è già).
- Contenuti: `Stato = Pubblicato` dove `Pubblicato = 1`, altrimenti `Bozza`;
  documenti esistenti `Pubblicato`.

## Dove sta nel frontend

| File | Ruolo |
|---|---|
| `shared/permessi.ts` | catalogo, modelli rapidi, normalizzazione, livello, riassunto |
| `services/auth.service.ts` | `assetto()`, `puo()`, `puoUno()`, `livello()`, `riassunto()` |
| `services/auth.guard.ts` | `permessoGuard(...)` per le rotte |
| `shared/flusso.ts` | regole del flusso per area (chi crea, modifica, approva…) |
| `pages/admin/permessi-admin.component.*` | la matrice e il pannello di una persona |
| `pages/admin/{news,eventi,documenti}-admin` | bottoni e filtri secondo il flusso |
| `pages/admin/dashboard-home` | "da approvare" e "rimandati" in testa al pannello |
