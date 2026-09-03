# Lavori aperti su interfaccia ed esperienza d'uso

Elenco dei problemi rilevati e delle migliorie richieste, in ordine di priorità.
Ogni voce spiega **cosa non va**, **perché conta** e **dove si interviene**.

> Aggiornare questo file mano a mano che le voci vengono chiuse: una riga risolta si
> sposta in fondo, nella sezione *Fatto*, con la data. Un elenco di cose da fare che non
> viene mai potato smette di essere utile dopo due settimane.

---

## Priorità 1 — Registro visivo

### 1.1 Meno metafore da cassaforte, più persone
La cassaforte e lo scudo raccontano *protezione*, ma da soli restringono il messaggio.
Serve una famiglia di **illustrazioni di persone stilizzate**, tutte con lo stesso stile
e la stessa palette, mostrate mentre lavorano in contesti riconoscibili: analisi al
computer, consulenza, formazione, riunione istituzionale. Ogni illustrazione va abbinata
alla sezione di cui parla, così chi non conosce la Federazione capisce a colpo d'occhio
di cosa si occupa. La cassaforte resta, ma con un peso minore; lo scudo ancora meno.

**Decisione presa:** illustrazioni disegnate a mano in SVG, non una raccolta esistente.
Motivi: nessuna licenza da verificare, colori presi dai token del tema (quindi cambiano
insieme al velo), peso di pochi kilobyte, stile identico su tutta la famiglia.

**Vincoli da rispettare quando si disegnano:** figure senza tratti somatici marcati,
postura di lavoro riconoscibile, nessuna animazione che distolga dal testo accanto,
`aria-hidden="true"` perché sono decorative.
📁 nuova cartella `app/shared/illustrazioni/`

---

## Priorità 2 — Movimento e transizioni

### 2.1 Lo sfondo 3D stanca
Il tunnel di nodi è sempre uguale e dopo un po' diventa rumore visivo. Vanno aggiunte
variazioni lente e piccoli dettagli che ripaghino l'attenzione, senza rubare la scena
al contenuto.
📁 `app/shared/background-canvas/`

### 2.2 Il backoffice merita una scena propria
Oggi usa la stessa animazione del sito pubblico. Aree diverse dovrebbero avere ambienti
visivi diversi: aiuta a capire dove ci si trova, oltre a essere più piacevole.

### 2.3 Passaggi tra sezioni
Il sito è un unico foglio da scorrere. Le sezioni dovrebbero entrare e uscire come
pannelli che ruotano nello spazio, sia tra le voci di menu sia tra le schermate del
backoffice, mantenendo fissi lo sfondo e la navigazione.

### 2.4 Animazioni fuori dal campo visivo
Alcuni movimenti avvengono dove l'utente non sta guardando, o addirittura oltre il bordo
dello schermo. Un'animazione che nessuno vede è tempo di calcolo sprecato: vanno legate
alla comparsa dell'elemento nella finestra.

### 2.5 Schede con dimensioni disallineate
Su schermo piccolo alcune schede della stessa sezione hanno altezze diverse e solo
alcune si animano. Elementi dello stesso tipo devono comportarsi allo stesso modo.

---

## Priorità 3 — Adattamento agli schermi

### 3.1 Sovrapposizioni durante lo scorrimento su schermo grande
Alcuni elementi posizionati in modo libero si accavallano mentre si scorre la pagina.
Il disallineamento è voluto, la collisione no.

### 3.2 Stessi contenuti su ogni schermo
Su telefono deve cambiare **solo la disposizione**, mai la sostanza. Nessuna sezione va
nascosta perché "sta stretta": si riorganizza in colonna. Da verificare sezione per
sezione con una prova sistematica, non a campione.

---

## Priorità 4 — Efficienza d'uso del backoffice

### 4.1 Meno clic per fare la stessa cosa
Le operazioni frequenti — pubblicare, modificare, eliminare — devono essere raggiungibili
subito, senza passaggi intermedi inutili.

---

## Fatto

| Data | Intervento | Dove |
|---|---|---|
| 2026-08-28 | Accesso in sviluppo senza conferma dell'email, con scorciatoia di login | `appsettings.Development.json`, `admin-login` |
| 2026-08-28 | Disposizione asimmetrica di home e pannello iniziale | `landing`, `dashboard-home` |
| 2026-08-28 | Bottoni e campi con angoli tagliati, evidenziazione al focus | `styles.scss` |
| 2026-08-28 | Barra di navigazione pubblica divisa in due moduli sospesi | `landing` |
| 2026-09-03 | Repository pubblicato su GitHub e documentazione riscritta | `docs/`, `README.md` |
| 2026-09-03 | **Theme Builder riparato**: introdotti i token semantici, il velo personalizzato ora cambia davvero l'aspetto del sito | `_palette.scss`, `_themes.scss`, `theme.service.ts` |
| 2026-09-03 | La scena 3D di sfondo segue il tema attivo (colore e intensità) | `background-canvas` |
| 2026-09-03 | Finestre di conferma e avviso interne al posto di `confirm()` e `alert()` | `shared/dialogo/` |
| 2026-09-03 | Elenchi a discesa su misura, navigabili da tastiera | `shared/campi/selezione.component.ts` |
| 2026-09-03 | Editor di testo con barra degli strumenti per news, eventi e documenti | `shared/campi/editor-testo.component.ts` |
| 2026-09-03 | Viola ridimensionato ad accento, gerarchia costruita sul contrasto | `_palette.scss`, `_themes.scss` |
| 2026-09-03 | Marchio ridisegnato: nome per esteso leggibile, via la sigla e le linee animate senza significato | `shared/animated-logo/` |
| 2026-09-03 | Etichette ufficiali "Direzione" e "Redazione" al posto di "Super User" | `shared/ruoli.ts` e schermate del backoffice |
| 2026-09-03 | Gergo tecnico rimosso dal pannello iniziale (`SYS // NODE.01`, `RBAC`, `Lock attivo`) | `dashboard-home` |
| 2026-09-03 | Menu su smartphone con fondo pieno: non lascia più trasparire l'animazione | `landing` |
| 2026-09-03 | Uscita dal backoffice con icona e descrizione accessibile | `admin-shell` |
| 2026-09-03 | Scelta del ruolo dalla pagina di accesso, con le credenziali di prova in chiaro in sviluppo | `admin-login`, `environments/` |
