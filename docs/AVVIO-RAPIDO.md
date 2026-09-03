# Avvio rapido — far partire FIDC su un PC nuovo

Questa guida presuppone **zero conoscenze** del progetto: si parte da un computer
appena formattato e si arriva al sito funzionante in locale.

---

## 1. Cosa installare prima

| Software | Versione | Dove si scarica | A cosa serve |
|---|---|---|---|
| **.NET SDK** | 8.x | <https://dotnet.microsoft.com/download/dotnet/8.0> | Compila e avvia il backend |
| **Node.js** | 20 LTS o superiore | <https://nodejs.org> | Compila e avvia il sito Angular |
| **Git** | qualsiasi recente | <https://git-scm.com> | Scarica e aggiorna il codice |

Verifica che sia tutto a posto:

```bash
dotnet --version   # deve stampare 8.x
node --version     # deve stampare v20 o superiore
git --version
```

> **Non serve** installare SQL Server, PostgreSQL o Docker per lavorare in locale:
> in sviluppo il progetto usa SQLite, che è un semplice file creato automaticamente.

---

## 2. Scaricare il progetto

```bash
git clone git@github.com:ClaudioLoreto/FederazioneInnovazioneDigitaleCybersicurezza.git FIDC
cd FIDC
```

Se non hai una chiave SSH configurata su GitHub, usa l'indirizzo HTTPS:

```bash
git clone https://github.com/ClaudioLoreto/FederazioneInnovazioneDigitaleCybersicurezza.git FIDC
```

---

## 3. Avviare il backend (API)

```bash
cd backend/FIDC.Api
dotnet run
```

Alla fine dell'avvio deve comparire:

```
Now listening on: http://localhost:5000
Hosting environment: Development
```

**Cosa succede dietro le quinte, la prima volta:**

1. `dotnet run` scarica le dipendenze e compila i quattro progetti.
2. L'applicazione crea il file `fidc_dev.db` (il database SQLite) nella cartella corrente.
3. Il `DataSeeder` lo riempie con dati realistici: 3 utenti, 5 eventi, 5 news,
   3 documenti e alcuni iscritti alla newsletter.

Il seeder è **idempotente**: se il database esiste già e contiene utenti, non fa nulla.
Per ripartire da capo vedi il paragrafo *Ripulire il database*.

Documentazione interattiva degli endpoint: <http://localhost:5000/swagger>

---

## 4. Avviare il frontend (sito)

In un **secondo terminale**, lasciando il primo acceso:

```bash
cd frontend
npm install     # solo la prima volta, scarica le dipendenze (qualche minuto)
npm start
```

Quando compare `➜ Local: http://localhost:4200/` il sito è pronto.

Angular resta in ascolto sui file: ogni modifica al codice ricarica il browser da sola.

---

## 5. Entrare nel backoffice

1. Apri <http://localhost:4200> → home pubblica.
2. Vai su <http://localhost:4200/admin/login>.
3. Inserisci una delle utenze elencate in **[UTENTI-E-RUOLI.md](UTENTI-E-RUOLI.md)**.

In ambiente di sviluppo, in fondo al modulo, compare il riquadro **"Utenze di prova"**
con i tre account già pronti: un clic compila le credenziali ed entra. Serve a passare da
Direzione a Redazione in un secondo mentre si collaudano i permessi.

In produzione il riquadro **non viene nemmeno costruito**: l'elenco delle utenze arriva
da `environment.ts` e nel file di produzione è vuoto.

---

## Operazioni ricorrenti

### Ripulire il database e ricominciare da zero

Serve quando i dati di prova si sono sporcati o si vuole rivedere il primo avvio.

```bash
# ferma prima l'API (Ctrl+C nel suo terminale), altrimenti il file è bloccato
cd backend/FIDC.Api
del fidc_dev.db*        # su Windows
rm fidc_dev.db*         # su macOS/Linux
dotnet run              # ricrea tutto e riesegue il seeder
```

### Compilare senza avviare (verifica che non ci siano errori)

```bash
cd backend && dotnet build
cd frontend && npm run build
```

Entrambi devono terminare **senza errori**: è la verifica minima prima di ogni commit.

### Cambiare la porta dell'API

La porta è definita in `backend/FIDC.Api/Properties/launchSettings.json`.
Se la cambi, aggiorna anche `frontend/src/environments/environment.ts`
(`apiBaseUrl`), altrimenti il sito non trova più il server.

---

## Problemi frequenti

| Sintomo | Causa | Soluzione |
|---|---|---|
| `Impossibile contattare il server` nel sito | L'API non è avviata o è su un'altra porta | Controlla il terminale dell'API e `apiBaseUrl` in `environment.ts` |
| `The process cannot access the file ... FIDC.Api.dll` | Una vecchia istanza dell'API è ancora in esecuzione | Chiudi il processo `dotnet` e riprova |
| `address already in use :5000` / `:4200` | La porta è occupata da un avvio precedente | Chiudi l'altro terminale, oppure cambia porta |
| Il login risponde 401 con credenziali giuste | Il database è stato creato prima del seeding, oppure la password è stata cambiata | Ripulisci il database (vedi sopra) |
| `npm install` fallisce | Versione di Node troppo vecchia | Installa Node 20 LTS |
| Le modifiche al codice non si vedono | Il browser ha la cache | Ricarica con `Ctrl+F5` |

---

## Ambienti e configurazione

| File | Quando viene usato | Database |
|---|---|---|
| `appsettings.Development.json` | Sviluppo locale (predefinito) | SQLite, file `fidc_dev.db` |
| `appsettings.json` | Produzione | SQL Server 2019 |
| `docker-compose.yml` | Solo per demo con PostgreSQL | PostgreSQL su porta 5433 |

L'ambiente si sceglie con la variabile `ASPNETCORE_ENVIRONMENT`
(`Development` è già impostato in `launchSettings.json`).

**Le chiavi vere non stanno nel repository.** In produzione vanno passate come variabili
d'ambiente, usando il doppio underscore per separare i livelli:

```bash
setx Jwt__Key "chiave-di-almeno-32-caratteri"
setx Resend__ApiKey "re_..."
```
