# FIDC — Federazione Innovazione, Digitale e Cybersicurezza

Piattaforma istituzionale full-stack della Federazione: **sito pubblico** (news, eventi,
iscrizioni, newsletter, area documenti) + **backoffice riservato** per gestire tutti i
contenuti senza toccare il codice.

| | |
|---|---|
| **Frontend** | Angular 17 (standalone components, signals) — cartella `frontend/` |
| **Backend** | .NET 8 Web API a domini — cartella `backend/` |
| **Database** | SQLite in sviluppo · SQL Server 2019 in produzione · PostgreSQL per le demo |
| **Autenticazione** | JWT + ruoli (Direzione / Redazione) |

---

## Da dove iniziare

Se è la prima volta che apri questo progetto, leggi in quest'ordine:

| Documento | A cosa serve |
|---|---|
| **[docs/AVVIO-RAPIDO.md](docs/AVVIO-RAPIDO.md)** | Far partire tutto su un PC nuovo, passo per passo. Parti da qui. |
| **[docs/UTENTI-E-RUOLI.md](docs/UTENTI-E-RUOLI.md)** | Credenziali di prova e cosa può fare ciascun ruolo. |
| **[docs/ARCHITETTURA-FRONTEND.md](docs/ARCHITETTURA-FRONTEND.md)** | Com'è organizzata l'interfaccia: pagine, temi, design system. |
| **[DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)** | Tabelle, relazioni, storico delle migrazioni. |
| **[docs/ROADMAP-UI.md](docs/ROADMAP-UI.md)** | Lavori aperti e decisioni di design ancora da prendere. |
| **[AGENTS.md](AGENTS.md)** | Istruzioni operative per assistenti AI che lavorano su questo repo. |
| **[CLAUDE_PROJECT_STANDARDS.md](CLAUDE_PROJECT_STANDARDS.md)** | Regole immutabili (palette, stack, tono). Hanno la precedenza su tutto. |

---

## Avvio in due comandi

Servono **.NET 8 SDK** e **Node.js 20+**. Due terminali separati:

```bash
# Terminale 1 — API (http://localhost:5000, Swagger su /swagger)
cd backend/FIDC.Api
dotnet run

# Terminale 2 — sito (http://localhost:4200)
cd frontend
npm install     # solo la prima volta
npm start
```

Al primo avvio l'API crea da sola il database SQLite e lo riempie con dati di esempio
realistici (utenti, eventi, news, documenti). Non serve installare nessun database.

Apri **http://localhost:4200** → il sito pubblico. Per entrare nel backoffice vai su
**/admin/login** e usa una delle utenze in [docs/UTENTI-E-RUOLI.md](docs/UTENTI-E-RUOLI.md).

---

## Cosa fa la piattaforma

| Funzione | Dove si usa | Chi la gestisce |
|---|---|---|
| Sito pubblico istituzionale | `/` | — |
| News | `/admin/news` | Direzione (tutte) · Redazione (le proprie) |
| Eventi e iscrizioni | `/admin/eventi` | Direzione (tutti) · Redazione (i propri) |
| Area documenti | `/area-documenti`, `/admin/documenti` | Direzione · Redazione |
| Registrazione utenti con conferma via email | `/registrati` | — |
| Newsletter | box in home, `/admin/newsletter` | Solo Direzione |
| Gestione utenti e permessi | `/admin/utenti` | Solo Direzione |
| Aspetto grafico del sito (Theme Builder) | `/admin/impostazioni` | Solo Direzione |

---

## Struttura del repository

```
FIDC/
├─ README.md                      ← sei qui
├─ AGENTS.md                      istruzioni per assistenti AI
├─ CLAUDE.md                      piano di lavoro e stato delle funzionalità
├─ CLAUDE_PROJECT_STANDARDS.md    regole bloccate (palette, stack, tono)
├─ DATABASE_ARCHITECTURE.md       schema del database, sempre aggiornato
├─ LOGO.txt                       tracciato SVG originale del marchio
├─ docs/                          guide operative (vedi tabella sopra)
├─ database/schema_sqlserver.sql  schema di riferimento per SQL Server
├─ scripts/                       script .bat di avvio e deploy
├─ docker-compose.yml             PostgreSQL locale, solo per le demo
│
├─ backend/                       .NET 8, quattro progetti a responsabilità separata
│  ├─ FIDC.Api/                   endpoint HTTP, sicurezza, avvio applicazione
│  ├─ FIDC.Bll/                   logica applicativa (login, invio email)
│  ├─ FIDC.Dal/                   accesso ai dati, migrazioni, dati di esempio
│  └─ FIDC.Models/                entità del database, DTO, enum
│
└─ frontend/src/
   ├─ styles/_palette.scss        unica fonte dei colori
   ├─ styles/_themes.scss         i tre "veli" grafici
   ├─ app/content/home-content.ts testi istituzionali della home
   ├─ app/pages/                  una cartella per pagina
   ├─ app/services/               chiamate all'API, autenticazione, guardie di rotta
   └─ app/shared/                 componenti riusabili (logo, sfondo 3D, tema)
```

**Perché il backend è diviso in quattro progetti:** ogni livello può dipendere solo da
quello sotto di lui (`Api → Bll → Dal → Models`). Così la logica non finisce dentro gli
endpoint e il database si può cambiare senza riscrivere il resto.

---

## Regole non negoziabili

1. **Solo quattro colori**, definiti in `frontend/src/styles/_palette.scss`:
   `#333D6D` blu profondo · `#723EC3` viola · `#FFCF95` pesca · `#FFF0D9` crema.
   Ogni altra tonalità si ottiene con la trasparenza, mai con un colore nuovo.
2. **Un solo contenuto, tre vestiti.** I testi e i dati esistono in un posto solo; i temi
   cambiano soltanto l'aspetto. Vedi [docs/ARCHITETTURA-FRONTEND.md](docs/ARCHITETTURA-FRONTEND.md).
3. **La home pubblica è sempre la prima pagina.** Il login non è mai la porta d'ingresso.
4. **I permessi si controllano sul server**, non solo nel browser.
5. **Se cambi il database, aggiorna `DATABASE_ARCHITECTURE.md`** nello stesso commit.
6. **Niente testi finti.** Il contenuto è in italiano, istituzionale, definitivo.

---

## Segreti e configurazione

I file `appsettings.json` versionati contengono **solo segnaposto**. Le chiavi vere
(firma dei token JWT, chiave Resend per le email) si passano da variabili d'ambiente
o da `appsettings.Local.json`, che è escluso dal versionamento.

```bash
# esempio: sovrascrivere la chiave email senza toccare i file del repo
setx Resend__ApiKey "re_la_tua_chiave"
```

In sviluppo la conferma dell'email è disattivata (`Auth:BypassEmailConfirmation: true`)
così si può entrare subito; in produzione resta obbligatoria.
