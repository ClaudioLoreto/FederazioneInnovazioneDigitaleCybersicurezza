# Istruzioni per chi lavora sul codice dopo di te

Questo file è per **due tipi di lettore**: una persona che apre il progetto su un
computer nuovo, e un assistente AI che entra in una chat pulita senza memoria della
sessione precedente. Dice cosa fare, in che ordine, e dove sta ogni cosa.

Se sei un agente: **leggi questo file per intero prima di toccare il codice.**
Poi leggi `CLAUDE_PROJECT_STANDARDS.md` (regole bloccate) e `docs/ROADMAP-UI.md`
(lavori ancora aperti). Non inventare una struttura parallela.

---

## 1. Cosa è questo progetto, in tre frasi

È il sito istituzionale della **Federazione Innovazione, Digitale e Cybersicurezza**.
C’è una home pubblica e un backoffice per chi pubblica news, eventi e documenti.
Il committente è un ente: deve sembrare serio, chiaro, accessibile. Non un prodotto
da vendere, non un videogioco, non un template cyber da Awwwards.

Il nome ufficiale per esteso è quello che si mostra. La sigla **FIDC** resta nel
codice, negli indirizzi e nei file; nell’interfaccia si usa il nome lungo, o al
massimo “la Federazione”.

---

## 2. Far partire tutto su un computer nuovo

Serve **.NET 8 SDK**, **Node.js 20+** e **Git**. Istruzioni lunghe in
[AVVIO-RAPIDO.md](AVVIO-RAPIDO.md). In sintesi:

```bash
git clone git@github.com:ClaudioLoreto/FederazioneInnovazioneDigitaleCybersicurezza.git FIDC
cd FIDC

# terminale 1
cd backend/FIDC.Api
dotnet run
# attendi: Now listening on: http://localhost:5000

# terminale 2
cd frontend
npm install
npm start
# attendi: Local: http://localhost:4200
```

Non serve installare SQL Server. In sviluppo il database è un file SQLite creato
da solo (`backend/FIDC.Api/fidc_dev.db`). Quel file **non** è nel repository:
ogni macchina lo ricostruisce al primo avvio, con gli stessi utenti di prova.

**Windows:** se `dotnet build` fallisce perché `FIDC.Api.dll` è in uso, ferma
l’API e riprova. Non ci sono due modi: il file compilato è bloccato dal processo.

**Cosa NON sta nel repository (ed è voluto):**

| Cosa | Perché manca | Come si ricrea |
|---|---|---|
| `frontend/node_modules/` | pesa troppo | `npm install` |
| `bin/`, `obj/`, `frontend/dist/` | è compilato | `dotnet build` / `npm run build` |
| `*.db` | dati locali | `dotnet run` (seeder) |
| `appsettings.Local.json`, `.env` | segreti | si crea in locale, mai committare |

Se scarichi il repo su un PC diverso e segui i due comandi sopra, **ci lavori**.
Non manca un file “segreto” del progetto: mancano solo le cose rigenerabili.

---

## 3. Credenziali di prova (tutti i ruoli)

Il seeder crea sempre e solo la **Direzione**. I due Relatori (e eventi, news,
documenti di esempio) solo con `Seed:DatiDimostrativi = true` su un database nuovo.
Password unica di sviluppo: `Fidc#2026!`. Niente dati inventati in produzione:
i contenuti si inseriscono dal backoffice (Contenuti del sito, Eventi, News, Documenti).

| Chi è | Email | Ruolo interno | Etichetta in interfaccia | A cosa serve provarlo |
|---|---|---|---|---|
| Direzione Federazione | `direzione@fidc.it` | `SuperUser` | **Direzione** | Vede tutto: utenti, newsletter, tema |
| Giulia Ferraro | `g.ferraro@fidc.it` | `Relatore` | **Redazione** | Vede solo i propri eventi e le proprie news |
| Marco Bianchi | `m.bianchi@fidc.it` | `Relatore` | **Redazione** | Stesso ruolo, **altri** contenuti: serve a verificare i permessi |

Dettaglio e matrice dei permessi: [UTENTI-E-RUOLI.md](UTENTI-E-RUOLI.md).

In sviluppo, in fondo al login, c’è il riquadro **Utenze di prova**: un clic
compila ed entra. In produzione quel riquadro non esiste (`environment.prod.ts`
ha l’elenco vuoto).

**Mai scrivere “Super User” in interfaccia.** È un nome interno del codice.
Si passa da `frontend/src/app/shared/ruoli.ts`.

---

## 4. Mappa mentale: dove sta ogni cosa

```
FIDC/
├─ CLAUDE_PROJECT_STANDARDS.md   regole che non si toccano (palette, stack, tono)
├─ CLAUDE.md                     le 8 funzionalità richieste e il loro stato
├─ AGENTS.md                     checklist operativa per gli agenti
├─ DATABASE_ARCHITECTURE.md      tabelle: si aggiorna SE il database cambia
├─ docs/                         guide umane (sei già qui)
│
├─ backend/
│  ├─ FIDC.Api        endpoint, JWT, avvio. Niente logica di business.
│  ├─ FIDC.Bll        login, email, regole. Chiama il Dal.
│  ├─ FIDC.Dal        EF Core, seeder, migrazioni
│  └─ FIDC.Models     entità e DTO. Non dipende da nessuno.
│
└─ frontend/src/app/
   ├─ pages/landing              UNICA home pubblica
   ├─ pages/admin-*              backoffice
   ├─ content/home-content.ts    testi fissi della home (non duplicarli)
   ├─ services/                  API + autenticazione
   └─ shared/
      ├─ theme/                  velo attivo (data-theme)
      ├─ background-canvas/      scena di rete 2D (una sola, dietro tutto)
      ├─ illustrazioni/          persone stilizzate per i pilastri
      ├─ animated-logo/          marchio (nome per esteso)
      ├─ safe-logo/              cassaforte (hero, peso minore)
      ├─ dialogo/                al posto di confirm()/alert()
      └─ campi/                  select e editor, al posto dei nativi
```

**Regola di collocazione:**

- Schermata nuova → `pages/Nome/` + rotta in `app.routes.ts`
- Usato da due schermate → `shared/`
- Chiamata HTTP nuova → `fidc-api.service.ts`
- Colore → token semantico (`--text`, `--accent`), mai `#723EC3` in un componente
- Testo della home → `home-content.ts`, non dentro il template

---

## 5. Come si deve lavorare (tono e interfaccia)

Il committente ha detto, in sostanza: *è istituzionale, è serio, l’utente deve
capire senza sforzo e fare pochi clic.*

| Fare | Non fare |
|---|---|
| Contrasto alto: crema su blu, pesca per i richiami | Viola su viola, viola come testo piccolo su blu |
| Persone e fatti (illustrazioni, numeri veri) | Scudi e cassaforti come unico racconto |
| Finestre interne (`DialogoService`) | `confirm()`, `alert()`, `<select>` nativo, textarea nuda per gli articoli |
| `<a routerLink>` se naviga | `<button routerLink>` |
| Stessa sostanza su telefono, solo disposta in colonna | Nascondere sezioni “perché sta stretto” |
| Animare quando l’elemento è visibile | Animare fuori schermo |
| Commentare *perché* un pezzo esiste | Commentare “incrementa i di 1” |
| Italiano in interfaccia, commenti e docs | Testi `Lorem`, `TODO visibile`, inglese in UI |

I quattro colori sono **immutabili**: `#333D6D` `#723EC3` `#FFCF95` `#FFF0D9`.
Il viola è un accento, non il protagonista. Si gioca con pesca e crema per il
contrasto. Dettaglio in `docs/ARCHITETTURA-FRONTEND.md`.

---

## 6. Cosa è già chiuso e cosa è ancora aperto

Lo stato vivo sta in `docs/ROADMAP-UI.md`. Non copiare quella lista qui: andrebbe
in disaccordo in una settimana. Aprilo.

Le **otto funzionalità** del documento di progetto sono implementate
(CMS, news, eventi, registrazione, newsletter, documenti, utenti, tema).
Vedi la tabella in `CLAUDE.md`.

---

## 7. Checklist prima di dire “è fatto”

Copia da `AGENTS.md`, non saltarla:

1. `dotnet build` e `npm run build` verdi.
2. Hai aperto nel browser le pagine toccate, anche strette.
3. Quattro colori, testi leggibili.
4. Nuove animazioni ferme con `prefers-reduced-motion`.
5. Permessi sul server, non solo nel menu.
6. Se è cambiato il database, aggiornato `DATABASE_ARCHITECTURE.md`.
7. `docs/ROADMAP-UI.md` aggiornato (voce spostata in *Fatto*).
8. Nessun segreto vero committato.

---

## 8. Errori che questo progetto ha già pagato

| Cosa è successo | Cosa fare al posto |
|---|---|
| Tre home con gli stessi testi copiati | Una home, tre veli di colore |
| Login come prima pagina | Home pubblica in `/`, login in `/admin/login` |
| Theme Builder che non cambiava nulla | Usare i token semantici, non `--c-purple` fisso |
| `confirm()` del browser in evidenza | `DialogoService` |
| Menu mobile sopra la cassaforte | Menu a tendina con fondo pieno |
| “SUPER USER” in un badge | `etichettaRuolo()` da `ruoli.ts` |
| Sigla FIDC come marchio principale | Nome ufficiale per esteso |

---

## 9. Commit e GitHub

Remote ufficiale:

`git@github.com:ClaudioLoreto/FederazioneInnovazioneDigitaleCybersicurezza.git`

Si lavora sul ramo `main` finché il committente non chiede altrimenti.
Si fa commit **solo se lo chiede**. Si fa push **solo se lo chiede**.
Questo file esiste perché, quando lo chiede, il computer nuovo deve avere
tutto il sorgente e tutta la spiegazione, non le cartelle `node_modules` o
il database locale.
