# Contenuti del sito modificabili

> Stato: **frontend pronto, backend da adeguare.** Finché il server non ha
> l'endpoint, il sito mostra i testi di partenza (solo testo istituzionale) e il
> salvataggio dal backoffice risponde con un errore. L'anteprima funziona già.

## Che cosa si modifica

Dal backoffice, **Contenuti del sito** (permesso `sito.contenuti`):

| Sezione | Contenuto |
|---|---|
| Identità | nome per esteso, nome su tre righe accanto al simbolo, descrizione, simbolo alternativo (URL) |
| Apertura e annuncio | slogan in due frasi (max 50 caratteri in tutto), presentazione, testi dei bottoni; annuncio con collegamento e scadenza |
| In evidenza | news che apre la sezione notizie, evento in testa al calendario (vuoto = automatico) |
| Pilastri | titolo, frase breve, descrizione, illustrazione, emblema dei quattro pilastri |
| Associazione | chi siamo, numeri chiave, missione, organi di governo |
| Progetti | progetti in evidenza (il primo apre la sezione) |
| Newsletter | titolo, testo e bottone del riquadro di iscrizione |
| Contatti | sede, email, PEC, telefono, WhatsApp, orari, profili social |

Il modello è `ContenutiSito` in `frontend/src/app/content/home-content.ts`;
i valori di partenza (`CONTENUTI_PREDEFINITI`) contengono **solo testo
istituzionale**: numeri, governance, progetti e recapiti partono vuoti.

## Regole automatiche sul sito pubblico

- Una sezione senza contenuti **non compare**, e sparisce anche la sua voce di menu
  (Progetti, Eventi, News, Contatti). Le fasce chiare e scure si alternano fra
  quelle presenti, così due fasce uguali non si toccano.
- **Fascia sotto l'apertura**, in ordine: annuncio attivo e non scaduto → evento
  che comincia entro 7 giorni → ultima news → niente.
- **Eventi:** entro 14 giorni mostrano "Oggi", "Domani", "Tra N giorni"; entro 7
  giorni il primo diventa una scheda in evidenza con "Iscriviti". Gli eventi passati
  spariscono dalla home.
- Nessun contenuto di riserva: se il server non risponde, le sezioni restano
  nascoste invece di mostrare eventi o news inventati.

## Anteprima

"Anteprima" mostra il sito con la bozza non salvata, solo a chi la sta guardando
(vive in memoria nel browser). Una fascia in basso ricorda che è un'anteprima e
riporta ai contenuti, dove la bozza è ancora intatta.

## Contratto API richiesto al backend

- `GET /api/contenuti` (anonimo) → l'oggetto `ContenutiSito` in JSON. 404 o corpo
  vuoto se non è mai stato salvato: il frontend usa i valori di partenza.
- `PUT /api/contenuti` (policy `sito.contenuti`, o Direzione) → corpo `ContenutiSito`;
  risponde con l'oggetto salvato.
- Conservazione: una riga in una tabella `ImpostazioniSito (Chiave TEXT PK, Valore TEXT,
  AggiornatoIl, AggiornatoDaId)` con `Chiave = 'contenuti'` e il JSON in `Valore`.
  Il server può validare lunghezze (slogan ≤ 50) e ripulire l'HTML: i campi sono
  testo semplice.
- Il frontend completa i campi mancanti con i valori di partenza (`completa()` in
  `services/contenuti.service.ts`), quindi aggiungere campi in futuro non rompe nulla.

## Dati dimostrativi del backend

`DataSeeder` crea al primo avvio solo il tema e l'account della Direzione. Eventi,
news, documenti, relatori e iscritti di esempio si creano solo con
`"Seed": { "DatiDimostrativi": true }` in `appsettings.Development.json`, su un
database nuovo.
