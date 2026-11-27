# Architettura del frontend

Come è organizzata l'interfaccia, dove si mettono le cose nuove e perché.

---

## 1. L'idea di fondo: un contenuto, tre vestiti

Il requisito iniziale chiedeva **tre layout intercambiabili**. La tentazione ovvia
sarebbe stata creare tre pagine home diverse, ciascuna con i suoi testi. È esattamente
ciò che **non** va fatto: tre copie dello stesso testo significa che, il giorno in cui
il presidente cambia una frase, due versioni restano vecchie senza che nessuno se ne
accorga.

La soluzione adottata si chiama **velo** (*veil*):

```
   testi e dati        →  esistono UNA volta sola
   (API + home-content.ts)
            │
            ▼
   LandingComponent     →  UNA sola struttura di pagina
            │
            ▼
   attributo data-theme sul tag <html>
            │
   ┌────────┼────────┐
 tema 1   tema 2   tema 3     →  cambiano struttura, densità, colori, movimento
```

Il tema non aggiunge e non toglie contenuti. Fa due cose:
- ridefinisce le **rampe di tono** (`--D-*` scuro, `--L-*` chiaro, `--B-*` fascia viola,
  `--S-*` fascia di richiamo) e i token di forma (`--radius`, `--cut`, `--density`,
  `--motion`) in `styles/_themes.scss`;
- attiva le varianti strutturali scritte nei componenti sotto
  `:host-context([data-theme='n'])` (griglie, cornice dell'hero, card a riga…).

Ogni sezione della home dichiara il suo tono (`.tone-dark`, `.tone-light`,
`.tone-brand`, `.tone-signal`): è il velo a decidere cosa significa. Le pagine di
accesso usano toni fissi (`.tone-fixed-dark`, `.tone-fixed-light`) perché il modulo
deve restare blu su crema con qualunque velo.
Cambiarlo è istantaneo e non ricarica la pagina.

**In pratica:**

| File | Ruolo |
|---|---|
| `app/pages/landing/landing.component.ts` | L'unica home. Struttura e testi stanno qui. |
| `app/content/home-content.ts` | Modello dei contenuti modificabili e testi di partenza (solo istituzionali). Quelli veri arrivano da `ContenutiService`. |
| `app/services/vetrina.service.ts` | Eventi e news pubblicati, sezioni presenti, regole di imminenza. |
| `styles/_themes.scss` | Per ogni `[data-theme="n"]`, solo i valori dei colori. |
| `app/shared/theme/theme.service.ts` | Decide quale velo è attivo e lo applica. |

Il velo attivo è scelto dalla Direzione in `/admin/impostazioni` ed è salvato nel
database, quindi vale per tutti i visitatori. Non esiste alcun selettore di tema
pubblico: l'aspetto del sito è una decisione editoriale, non una preferenza del lettore.

---

## 2. I colori: due piani, e vanno tenuti distinti

Questo è il punto in cui è più facile fare danni, quindi va letto prima di toccare
qualsiasi foglio di stile.

### Piano 1 — la tavolozza (`styles/_palette.scss`)

I quattro colori dell'ente. Sono gli unici codici esadecimali dell'intero frontend e
**non cambiano mai**, qualunque velo sia attivo.

```scss
$c-deep-blue: #333D6D;
$c-purple:    #723EC3;
$c-peach:     #FFCF95;
$c-cream:     #FFF0D9;
```

### Piano 2 — i token semantici

Nomi che dicono **a cosa serve** un colore, non **quale colore è**:

| Token | A cosa serve |
|---|---|
| `--surface`, `--surface-2` | fondo dei pannelli e delle schede |
| `--bordo` | contorni e separatori |
| `--text`, `--text-soft` | testo principale e testo secondario |
| `--accent`, `--accent-2` | richiami: bottoni, badge, collegamenti |
| `--on-accent` | testo scritto **sopra** un accento |
| `--canvas-bg`, `--canvas-alpha` | fondo e intensità della scena 3D |

### La regola, in una riga

> **Nei componenti si usano solo i token semantici. Mai i colori della tavolozza.**

Il motivo è concreto. Un velo cambia il significato dei token: nel tema istituzionale
`--accent` è il pesca, nel Centro di comando è il viola. Un componente che scrive
`color: var(--c-purple)` resta viola in tutti e tre i temi ed è l'unica cosa fuori posto
nella pagina. Peggio ancora con il velo personalizzato: la Direzione sceglie i colori dal
backoffice, non vede cambiare nulla e conclude che la funzione è rotta.

Unica eccezione legittima: i quadratini di anteprima del Theme Builder, che devono
mostrare i colori veri perché servono proprio a sceglierli.

### Contrasto

| Combinazione | Verdetto |
|---|---|
| Crema su blu profondo | ✅ ottima, è la coppia principale |
| Blu profondo su crema | ✅ ottima |
| Viola come testo su crema | ✅ accettabile |
| Viola come testo su blu profondo | ❌ illeggibile, sono due colori scuri |
| Pesca come testo su crema | ❌ troppo tenue |

Il viola è un colore **scuro**: funziona come superficie o come bagliore, non come testo
su fondo scuro. Quando serve farlo risaltare, si usa con un bordo pesca o una sfumatura
verso il pesca.

---

## 3. Mappa delle cartelle

```
frontend/src/app/
├─ pages/                        una cartella per schermata
│  ├─ landing/                   home pubblica
│  ├─ calendario-eventi/         /eventi — calendario mensile ed elenco
│  ├─ archivio-news/             /news — archivio per mese
│  ├─ pagina-legale/             /privacy, /cookie, /note-legali, /accessibilita
│  ├─ area-personale/            /area-personale — la mia area (anche per i soci)
│  ├─ password/                  /password-dimenticata e /reimposta-password
│  ├─ evento-dettaglio/          /eventi/:id — biglietto, iscrizione, calendario
│  ├─ news-dettaglio/            /news/:id — impaginato da articolo
│  ├─ dettaglio/                 stili condivisi dalle due pagine sopra
│  ├─ non-trovata/               pagina 404
│  ├─ admin-login/               accesso al backoffice
│  ├─ registrazione/             creazione account
│  ├─ conferma-email/            atterraggio del link ricevuto via email
│  ├─ area-documenti/            elenco documenti pubblici e riservati
│  └─ admin/                     backoffice
│     ├─ admin-shell.component   telaio: menu laterale, barra utente
│     ├─ dashboard-home          pannello iniziale con i numeri
│     ├─ eventi-admin            gestione eventi
│     ├─ news-admin              gestione news
│     ├─ documenti-admin         gestione documenti
│     ├─ utenti-admin            account (permesso utenti.gestire)
│     ├─ permessi-admin          matrice dei permessi (solo Direzione)
│     ├─ contenuti-admin         contenuti del sito, con anteprima
│     ├─ newsletter-admin        iscritti (permesso newsletter.gestire)
│     ├─ impostazioni-tema       Theme Builder (solo Direzione)
│     └─ admin-tables.scss       stili condivisi da tutte le tabelle
│
├─ services/
│  ├─ fidc-api.service.ts        tutte le chiamate HTTP, in un posto solo
│  ├─ contenuti.service.ts       testi del sito, bozza e anteprima
│  ├─ vetrina.service.ts         eventi e news pubblicati, imminenza
│  ├─ auth.service.ts            login, logout, utente corrente
│  ├─ auth.interceptor.ts        aggiunge il token a ogni richiesta
│  └─ auth.guard.ts              blocca le rotte riservate
│
└─ shared/                       componenti riusabili
   ├─ animated-logo/             marchio: simbolo + nome per esteso
   ├─ illustrazioni/             persone illustrate: figura.ts (manichino), scene.ts
   ├─ pubblico/                  testata e piè di pagina del sito pubblico
   ├─ emblema/                   cassaforte · scudo · nucleo per l'hero
   ├─ motion/                    fidcReveal e fidcConteggio
   ├─ safe-logo/                 cassaforte digitale animata
   ├─ emblemi/                   famiglia di emblemi a scudo (lucchetto, rete, bilancia…)
   ├─ background-canvas/         scena di rete 2D di sfondo
   ├─ theme/                     gestione del velo attivo
   ├─ dialogo/                   finestre di conferma e avviso interne
   ├─ campi/                     controlli di modulo su misura
   │  ├─ selezione.component     sostituto di <select>
   │  └─ editor-testo.component  editor con barra degli strumenti
   ├─ permessi.ts                catalogo dei permessi, modelli, livelli
   ├─ flusso.ts                  flusso di revisione dei contenuti
   ├─ opzioni.ts                 voci condivise degli elenchi a discesa
   └─ auth/auth-form.scss        stili condivisi tra login e registrazione
```

**Dove metto una cosa nuova?**

- Una schermata nuova → `pages/`, una cartella per schermata, rotta in `app.routes.ts`.
- Qualcosa usato da due o più schermate → `shared/`.
- Una nuova chiamata al server → `fidc-api.service.ts`, mai `HttpClient` sparso.
- Stili validi ovunque (bottoni, campi) → `styles.scss`.
- Stili di una sola schermata → dentro il suo componente.

---

## 4. La scena di rete (sfondo)

`shared/background-canvas` disegna su un canvas 2D una rete: griglia di precisione
con mirini, nodi che si collegano quando sono vicini, pacchetti che viaggiano sui
collegamenti, colonne di telemetria binaria quasi invisibili. È montata **una volta
sola** in `app.component.ts`, fissa e dietro tutto (`z-index: -1`).

Ha sostituito la scena Three.js (novembre 2026): stesso ruolo, circa 4 KB invece di
700 KB, e un linguaggio visivo più vicino alla strumentazione che alla fantascienza.

Regole da non rompere:

1. **Colori e intensità vengono dal velo** (`--canvas-bg`, `--canvas-ink`,
   `--canvas-ink-2`, `--canvas-alpha`, `--motion`). Il velo 2 la rende più fitta e
   veloce, il velo 3 quasi ferma.
2. **Si ferma** a scheda nascosta e con `prefers-reduced-motion` (un fotogramma fisso).
3. Le sezioni scure sono trasparenti e la lasciano vedere; quelle chiare la coprono e
   usano la classe `.precision-grid` per non sembrare piatte.

## 5. Design system

Gli stili globali stanno in `frontend/src/styles.scss`. Contengono:

- **Superfici**: `.glass-card` e `.hud-panel`, i due contenitori di vetro.
- **Bottoni**: `.btn-primary`, `.btn-accent`, `.btn-outline`, `.btn-ghost`, con angoli
  tagliati in diagonale e bordo animato.
- **Campi di inserimento**: stile unico per `input`, `select` e `textarea`, con
  evidenziazione al focus.

Usare queste classi invece di inventare stili locali è ciò che tiene insieme l'aspetto
del sito. Se una classe non basta, conviene estenderla qui piuttosto che duplicarla.

**Nota sui bottoni:** un elemento che *naviga* deve essere un `<a routerLink>`, non un
`<button>`. Sembra un dettaglio, ma un `<button>` con `routerLink` non funziona come
collegamento: non si apre in una nuova scheda, non si copia l'indirizzo, e i lettori di
schermo lo annunciano nel modo sbagliato.

---

## 5-bis. Elementi che il browser fornisce, ma che non possiamo usare

Alcuni elementi nativi non sono personalizzabili nell'aspetto: qualunque stile si scriva,
restano quelli del sistema operativo. Su un sito istituzionale stonano e non si possono
tradurre. Per ciascuno esiste un sostituto in `shared/`, e va usato quello.

| Da non usare | Usare invece | Perché |
|---|---|---|
| `confirm()`, `alert()` | `DialogoService` + `<fidc-dialogo>` | Il riquadro grigio con scritto `localhost:4200 dice` è del browser, non nostro. |
| `<select>` | `<fidc-selezione>` | L'elenco a discesa nativo si apre con fondo bianco ed evidenziazione blu di sistema. |
| `<textarea>` per gli articoli | `<fidc-editor-testo>` | Chi scrive deve poter mettere grassetto, elenchi e collegamenti. |

**Finestre di dialogo.** Si inietta `DialogoService` e si aspetta la risposta:

```ts
const ok = await this.dialogo.conferma({
  titolo: 'Eliminare l\'evento?',
  messaggio: 'L\'operazione non è reversibile.',
  confermaLabel: 'Elimina',
  pericolo: true,
});
if (!ok) return;
```

Il componente `<fidc-dialogo>` è montato una volta sola in `app.component.ts`: le
schermate non devono inserirlo di nuovo.

**Editor di testo.** È scritto in casa, senza librerie esterne. La scelta è stata di non
introdurre una dipendenza per evitare licenze da verificare e aggiornamenti da inseguire
su un sito che deve restare in piedi per anni. Produce HTML semplice; se in futuro
servisse molto di più (tabelle, immagini in linea, revisioni), è il momento in cui
conviene passare a una libreria dedicata.

**Etichette dei ruoli.** Non si scrive mai a mano "Direzione" o "Redazione" dentro un
template: si passa da `shared/ruoli.ts`, così il giorno in cui il committente cambia la
denominazione si modifica un file solo.

---

## 6. Accessibilità: il minimo indispensabile

Il committente è un ente istituzionale, quindi questi punti non sono facoltativi.

- Contrasto sufficiente tra testo e sfondo (vedi la tabella al punto 2).
- `prefers-reduced-motion` rispettato da ogni animazione.
- Contorno visibile quando si naviga con il tasto Tab.
- Etichette vere sui campi dei moduli, non solo testo segnaposto.
- Immagini decorative marcate con `aria-hidden="true"`, così i lettori di schermo
  non le annunciano.

## Nota sulla build: CSS critico non incorporato

In `angular.json` (configurazione `production`) `inlineCritical` è spento. L'app è
disegnata nel browser: all'avvio il body contiene solo `<fidc-root>`, quindi
l'estrazione del CSS critico incorporava solo le regole di `html` e `body`, senza
benefici misurabili, e produceva avvisi sui selettori delle View Transitions
(`::view-transition-*`) che non sa leggere. Se un giorno si aggiunge il rendering
lato server, riaccenderlo.

