# AGENTS.md — Guida operativa per assistenti AI sul progetto FIDC

> **Federazione Innovazione, Digitale e Cybersicurezza** — committente istituzionale.
> Standard richiesto: **perfezione assoluta**, zero errori amatoriali di interfaccia.

---

## 1. Prima di scrivere una riga di codice

Leggi, in quest'ordine:

| File | Perché |
|---|---|
| `CLAUDE_PROJECT_STANDARDS.md` | Regole immutabili. **Hanno la precedenza su tutto.** Non modificarlo se non richiesto esplicitamente. |
| `CLAUDE.md` | Piano di lavoro e stato delle otto funzionalità richieste dal committente. |
| `docs/ROADMAP-UI.md` | Cosa è ancora aperto e perché. Parti da qui per capire su cosa lavorare. |
| `docs/ARCHITETTURA-FRONTEND.md` | Dove va messa ogni cosa nel frontend. |
| `DATABASE_ARCHITECTURE.md` | Schema del database. **Da aggiornare a ogni modifica strutturale.** |

Se qualcosa in questi file contraddice la realtà del codice, **il file è sbagliato e va
corretto**: la documentazione disallineata è peggio dell'assenza di documentazione.

---

## 2. Regole non negoziabili

**Colori.** Solo quattro, da `frontend/src/styles/_palette.scss`:
`#333D6D` · `#723EC3` · `#FFCF95` · `#FFF0D9`. Ombre e velature si ottengono con la
trasparenza. Nessun codice esadecimale nei componenti.

**Contrasto.** Il viola è un colore scuro: non usarlo come testo su fondo scuro.
Ogni testo deve restare leggibile — è un ente pubblico, l'accessibilità non è opzionale.

**Percorso dell'utente.** La radice `/` è sempre la home pubblica, senza guardie di
rotta. Il login è secondario, su `/admin/login`.

**Temi.** Tre veli intercambiabili via `data-theme`, con un solo contenuto sottostante.
Non duplicare mai una pagina per cambiarne l'aspetto.

**Permessi.** Si applicano sul server con `[Authorize]` più il controllo di proprietà.
Le guardie nel browser sono comodità, non sicurezza.

**Movimento.** Ogni animazione va disattivata sotto `prefers-reduced-motion`.

**Lingua.** Interfaccia, commenti e documentazione in italiano. Nessun testo segnaposto.

---

## 3. Come si commenta il codice

Il committente legge il codice per capirlo, senza essere uno sviluppatore esperto.
Vale per ogni file:

- **Intestazione di file**: cosa contiene e a cosa serve nel prodotto, in due righe.
- **Backend**: XML doc `///` su ogni classe e metodo pubblico, più commenti in linea
  dove la logica non è ovvia.
- **Frontend**: commento su ogni componente e su ogni scelta di stile poco intuitiva.

Un commento deve dire **perché** quel codice esiste, non ripetere cosa fa la riga
successiva. Evita il gergo quando una parola normale funziona.

---

## 4. Struttura del backend

```
FIDC.Api    → endpoint, sicurezza, avvio        dipende da Bll e Models
FIDC.Bll    → logica applicativa                dipende da Dal e Models
FIDC.Dal    → database, migrazioni, seeding     dipende da Models
FIDC.Models → entità, DTO, enum                 non dipende da nulla
```

Nessuna logica di business nei controller: solo ricezione della richiesta, chiamata al
service, risposta.

---

## 5. Comandi

```bash
# Backend — API su http://localhost:5000, Swagger su /swagger
cd backend/FIDC.Api && dotnet run

# Frontend — sito su http://localhost:4200
cd frontend && npm start

# Verifica prima di consegnare: entrambi devono passare
cd backend && dotnet build
cd frontend && npm run build
```

**Attenzione su Windows:** se l'API è in esecuzione, `dotnet build` fallisce perché il
file compilato è bloccato. Ferma il processo prima di ricompilare.

---

## 6. Prima di dichiarare finito un lavoro

- [ ] `dotnet build` e `npm run build` completano senza errori.
- [ ] Le pagine toccate sono state aperte davvero nel browser, anche a larghezza ridotta.
- [ ] Solo i quattro colori; contrasto verificato sui testi.
- [ ] Le animazioni nuove rispettano `prefers-reduced-motion`.
- [ ] I permessi sono applicati sul server, non solo nel menu.
- [ ] `DATABASE_ARCHITECTURE.md` aggiornato se è cambiata la persistenza.
- [ ] `docs/ROADMAP-UI.md` aggiornato: voce spostata tra i lavori conclusi.
- [ ] Nessun segreto reale finito nei file di configurazione versionati.

---

## 7. Errori già commessi, da non ripetere

| Errore | Conseguenza | Come si evita |
|---|---|---|
| Tre componenti di layout con i testi copiati | Modificare una frase richiedeva tre modifiche, e una restava sempre indietro | Un contenuto solo, i temi cambiano solo i colori |
| `<button routerLink>` al posto di `<a routerLink>` | Il collegamento non si apre in una nuova scheda e i lettori di schermo lo annunciano male | Se naviga è un collegamento, se agisce è un bottone |
| Viola su viola | Testi illeggibili | Il viola è scuro: usalo come superficie o accento |
| `confirm()` e `alert()` del browser | Riquadri di sistema estranei al prodotto | Finestre di dialogo interne |
| Animazioni fuori dallo schermo | Calcolo sprecato per qualcosa che nessuno vede | Animare alla comparsa dell'elemento |
| Dichiarare fatto senza aprire il browser | Difetti evidenti scoperti dal committente | Guardare il risultato, anche su schermo stretto |
