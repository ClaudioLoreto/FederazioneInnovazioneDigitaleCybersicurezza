# Lavori aperti su interfaccia ed esperienza d'uso

Elenco dei problemi rilevati e delle migliorie richieste, in ordine di priorità.
Ogni voce spiega **cosa non va**, **perché conta** e **dove si interviene**.

> Aggiornare questo file mano a mano che le voci vengono chiuse: una riga risolta si
> sposta in fondo, nella sezione *Fatto*, con la data. Un elenco di cose da fare che non
> viene mai potato smette di essere utile dopo due settimane.

---

## Priorità 1 — Difetti funzionali

### 1.1 Il Theme Builder personalizzato non modifica più la grafica
La sezione "Velo personalizzato" di `/admin/impostazioni` accetta le scelte ma il sito
non cambia aspetto. È la funzione più delicata dell'intero backoffice, perché è l'unico
punto in cui il committente può intervenire sull'immagine del sito senza chiamare uno
sviluppatore: se non funziona, la promessa fatta al cliente non è mantenuta.
📁 `app/pages/admin/impostazioni-tema.component.ts`, `app/shared/theme/theme.service.ts`

### 1.2 Finestre di conferma del browser
Le eliminazioni usano `confirm()`, che apre il riquadro grigio di sistema con scritto
`localhost:4200 dice`. Rompe l'illusione di stare dentro un prodotto curato e non si può
tradurre né rendere accessibile. Serve una finestra di dialogo interna, riusabile,
coerente con il resto.
📁 nuovo componente in `app/shared/`, poi sostituire ogni `confirm()` e `alert()`
nelle schermate del backoffice.

### 1.3 Elenchi a discesa non personalizzati
I menu `<select>` (per esempio il campo "Pilastro" nella creazione di una news) mostrano
lo stile grezzo del sistema operativo: fondo bianco, evidenziazione blu. Stonano con
tutto il resto.
📁 `styles.scss` per i casi semplici; per un controllo completo serve un componente
dedicato che sostituisca l'elemento nativo mantenendone il comportamento da tastiera.

### 1.4 Editor di testo per news e documenti
Il corpo degli articoli è una semplice area di testo. Chi scrive non può mettere il
grassetto, un elenco puntato o un collegamento. È il lavoro quotidiano della redazione,
quindi è il punto in cui la piattaforma verrà giudicata.
Serve un editor con barra degli strumenti. **Decisione da prendere** sulla libreria:
va scelta una soluzione con licenza libera per uso commerciale, per evitare costi
ricorrenti o vincoli d'uso.

---

## Priorità 2 — Impostazione visiva

### 2.1 Troppo viola, contrasto insufficiente
Il viola domina ogni superficie e il risultato è piatto e faticoso da leggere.
Va usato come **accento**, non come fondo predefinito: più respiro con il blu profondo,
più richiami in pesca e crema, gerarchia costruita sul contrasto invece che sul colore.
Restano i quattro colori di sempre, cambia il loro dosaggio.
📁 `styles/_palette.scss`, `styles/_themes.scss`, stili dei componenti.

### 2.2 Registro istituzionale, non ludico
Alcune scelte sono più da prodotto di intrattenimento che da ente pubblico: i numeri
giganti sfumati nel pannello iniziale, gli effetti di disturbo sui bottoni. L'obiettivo
è autorevolezza e serietà. Va rivisto il dosaggio, non eliminato tutto: un'interfaccia
istituzionale può essere moderna, ma non deve sembrare un gioco.

### 2.3 Il marchio
Tre cose distinte da sistemare:
- Le linee animate aggiunte attorno al logo sono decorazione senza significato: vanno tolte.
- Lo scudo va ridisegnato: oggi è generico e la metafora è abusata.
- **Nel sito compare l'acronimo FIDC dove dovrebbe esserci il nome per esteso**,
  *Federazione Innovazione, Digitale e Cybersicurezza*. La sigla può restare come marchio
  grafico, ma il nome ufficiale deve essere leggibile e prevalere.
- Nel backoffice il nome sotto il marchio è troppo piccolo per essere letto.
📁 `app/shared/animated-logo/`, `LOGO.txt`

### 2.4 Meno metafore da cassaforte, più persone
La cassaforte e lo scudo raccontano *protezione*, ma da soli restringono il messaggio.
Serve una famiglia di **illustrazioni di persone stilizzate**, tutte con lo stesso stile
e la stessa palette, mostrate mentre lavorano in contesti riconoscibili: analisi al
computer, consulenza, formazione, riunione istituzionale. Ogni illustrazione va abbinata
alla sezione di cui parla, così chi non conosce la Federazione capisce a colpo d'occhio
di cosa si occupa. La cassaforte resta, ma con un peso minore; lo scudo ancora meno.
**Decisione da prendere** sulla provenienza: illustrazioni disegnate a mano in SVG
oppure una raccolta esistente con licenza libera, ricolorata nella palette.

### 2.5 Etichette dei ruoli
Nell'interfaccia compare "Super User", che è un nome tecnico nato durante lo sviluppo.
Vanno usate le denominazioni ufficiali (**Direzione**, **Redazione**). I valori tecnici
nel codice restano invariati: cambia solo ciò che l'utente legge.
📁 `admin-shell.component.ts`, `utenti-admin.component.ts`, `dashboard-home.component.ts`

---

## Priorità 3 — Movimento e transizioni

### 3.1 Lo sfondo 3D stanca
Il tunnel di nodi è sempre uguale e dopo un po' diventa rumore visivo. Vanno aggiunte
variazioni lente e piccoli dettagli che ripaghino l'attenzione, senza rubare la scena
al contenuto.

### 3.2 Il backoffice merita una scena propria
Oggi usa la stessa animazione del sito pubblico. Aree diverse dovrebbero avere ambienti
visivi diversi: aiuta a capire dove ci si trova, oltre a essere più piacevole.

### 3.3 Passaggi tra sezioni
Il sito è un unico foglio da scorrere. Le sezioni dovrebbero entrare e uscire come
pannelli che ruotano nello spazio, sia tra le voci di menu sia tra le schermate del
backoffice, mantenendo fissi lo sfondo e la navigazione.

### 3.4 Animazioni fuori dal campo visivo
Alcuni movimenti avvengono dove l'utente non sta guardando, o addirittura oltre il bordo
dello schermo. Un'animazione che nessuno vede è tempo di calcolo sprecato: vanno legate
alla comparsa dell'elemento nella finestra.

### 3.5 Schede con dimensioni disallineate
Su schermo piccolo alcune schede della stessa sezione hanno altezze diverse e solo
alcune si animano. Elementi dello stesso tipo devono comportarsi allo stesso modo.

---

## Priorità 4 — Adattamento agli schermi

### 4.1 Il menu si sovrappone all'animazione
Su smartphone il pannello di navigazione aperto copre la cassaforte animata. Il menu deve
tenere conto di ciò che c'è sotto: fondo pieno e sufficientemente opaco, oppure
contenuto che scorre sotto senza scontrarsi.

### 4.2 Sovrapposizioni durante lo scorrimento su schermo grande
Alcuni elementi posizionati in modo libero si accavallano mentre si scorre la pagina.
Il disallineamento è voluto, la collisione no.

### 4.3 Stessi contenuti su ogni schermo
Su telefono deve cambiare **solo la disposizione**, mai la sostanza. Nessuna sezione va
nascosta perché "sta stretta": si riorganizza in colonna.

---

## Priorità 5 — Efficienza d'uso del backoffice

### 5.1 Meno clic per fare la stessa cosa
Le operazioni frequenti — pubblicare, modificare, eliminare — devono essere raggiungibili
subito, senza passaggi intermedi inutili.

### 5.2 Il pulsante di uscita
"Esci →" è testo scarno in un angolo. Va sostituito con un'icona riconoscibile e una
descrizione accessibile, coerente con il resto della barra.

### 5.3 Provare la piattaforma con ruoli diversi
La scorciatoia di accesso attuale entra sempre come Direzione. Per collaudare i permessi
serve poter scegliere il ruolo, e le credenziali di prova vanno indicate nella pagina di
accesso in ambiente di sviluppo, così non serve cercarle altrove.
Le utenze sono elencate in [UTENTI-E-RUOLI.md](UTENTI-E-RUOLI.md).

---

## Fatto

| Data | Intervento |
|---|---|
| 2026-08-28 | Accesso in sviluppo senza conferma dell'email, con scorciatoia di login |
| 2026-08-28 | Disposizione asimmetrica di home e pannello iniziale |
| 2026-08-28 | Bottoni e campi con angoli tagliati, evidenziazione al focus |
| 2026-08-28 | Barra di navigazione pubblica divisa in due moduli sospesi |
| 2026-09-03 | Repository pubblicato su GitHub e documentazione riscritta |
