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
 tema 1   tema 2   tema 3     →  cambiano SOLO i colori
```

Il tema non aggiunge e non toglie contenuti: ridefinisce un pugno di variabili CSS.
Cambiarlo è istantaneo e non ricarica la pagina.

**In pratica:**

| File | Ruolo |
|---|---|
| `app/pages/landing/landing.component.ts` | L'unica home. Struttura e testi stanno qui. |
| `app/content/home-content.ts` | I testi istituzionali fissi, separati dal codice. |
| `styles/_themes.scss` | Per ogni `[data-theme="n"]`, solo i valori dei colori. |
| `app/shared/theme/theme.service.ts` | Decide quale velo è attivo e lo applica. |

Il velo attivo è scelto dalla Direzione in `/admin/impostazioni` ed è salvato nel
database, quindi vale per tutti i visitatori. Non esiste alcun selettore di tema
pubblico: l'aspetto del sito è una decisione editoriale, non una preferenza del lettore.

---

## 2. I colori

`styles/_palette.scss` è l'**unico** posto dove compare un codice colore esadecimale.

```scss
$c-deep-blue: #333D6D;   // sfondi scuri, testo su fondo chiaro
$c-purple:    #723EC3;   // accento principale
$c-peach:     #FFCF95;   // accento chiaro, richiami e bordi
$c-cream:     #FFF0D9;   // testo su fondo scuro, superfici chiare
```

Da lì nascono i token derivati (bagliori, vetri, sfumature), tutti ottenuti con la
trasparenza di quei quattro colori. **Se stai per scrivere un colore esadecimale in un
componente, ti stai sbagliando**: usa una variabile o aggiungi il token in `_palette.scss`.

Attenzione al contrasto, che è il punto più delicato di questa palette:

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
│     ├─ utenti-admin            gestione utenti (solo Direzione)
│     ├─ newsletter-admin        iscritti (solo Direzione)
│     ├─ impostazioni-tema       Theme Builder (solo Direzione)
│     └─ admin-tables.scss       stili condivisi da tutte le tabelle
│
├─ services/
│  ├─ fidc-api.service.ts        tutte le chiamate HTTP, in un posto solo
│  ├─ auth.service.ts            login, logout, utente corrente
│  ├─ auth.interceptor.ts        aggiunge il token a ogni richiesta
│  └─ auth.guard.ts              blocca le rotte riservate
│
└─ shared/                       componenti riusabili
   ├─ animated-logo/             marchio animato
   ├─ safe-logo/                 cassaforte digitale
   ├─ svg-motifs/                scudo e sfondi decorativi
   ├─ background-canvas/         scena 3D di sfondo (Three.js)
   ├─ theme/                     gestione del velo attivo
   └─ auth/auth-form.scss        stili condivisi tra login e registrazione
```

**Dove metto una cosa nuova?**

- Una schermata nuova → `pages/`, una cartella per schermata, rotta in `app.routes.ts`.
- Qualcosa usato da due o più schermate → `shared/`.
- Una nuova chiamata al server → `fidc-api.service.ts`, mai `HttpClient` sparso.
- Stili validi ovunque (bottoni, campi) → `styles.scss`.
- Stili di una sola schermata → dentro il suo componente.

---

## 4. Lo sfondo 3D

`shared/background-canvas` disegna con Three.js un tunnel di nodi collegati, che
rappresenta una rete di dati. È montato **una volta sola** in `app.component.ts`, in
posizione fissa e dietro tutto (`z-index: -1`), quindi accompagna ogni pagina, sito
pubblico e backoffice compresi.

Tre scelte importanti, da non rompere:

1. **Three.js si carica in modo differito** (`import('three')`), così i 700 KB della
   libreria non pesano sul primo caricamento della pagina.
2. **L'interfaccia sopra è di vetro** (`.glass-card`, `.hud-panel`): sfondi semi-
   trasparenti con sfocatura, per lasciar intravedere la scena.
3. **`prefers-reduced-motion` congela l'animazione.** Chi ha impostato la riduzione dei
   movimenti nel sistema operativo, spesso per disturbi vestibolari, deve poter usare il
   sito. Ogni nuova animazione va aggiunta anche alla regola che la disattiva.

---

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

## 6. Accessibilità: il minimo indispensabile

Il committente è un ente istituzionale, quindi questi punti non sono facoltativi.

- Contrasto sufficiente tra testo e sfondo (vedi la tabella al punto 2).
- `prefers-reduced-motion` rispettato da ogni animazione.
- Contorno visibile quando si naviga con il tasto Tab.
- Etichette vere sui campi dei moduli, non solo testo segnaposto.
- Immagini decorative marcate con `aria-hidden="true"`, così i lettori di schermo
  non le annunciano.
