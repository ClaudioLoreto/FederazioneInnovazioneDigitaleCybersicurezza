// =============================================================================
//  frontend/src/app/content/testi-legali.ts
//  BOZZE DELLE PAGINE LEGALI — privacy, cookie, note legali, accessibilità.
//
//  ⚠️ Sono bozze di partenza, NON testi definitivi: le parti tra parentesi
//  quadre [così] vanno completate con i dati reali dell'ente e l'insieme va
//  fatto verificare a un legale o al responsabile della protezione dei dati
//  prima della pubblicazione. Si modificano da Backoffice → Contenuti del
//  sito → Pagine legali, che avvisa finché restano parti tra parentesi.
//
//  La pagina cookie descrive il sito com'è: solo strumenti tecnici (memoria
//  locale del browser per sessione, preferenze e copia dei contenuti),
//  caratteri tipografici serviti dal sito stesso, nessuna statistica o
//  contenuto di terze parti. Con soli strumenti tecnici basta l'informativa,
//  senza banner di consenso (Garante privacy, Linee guida cookie del
//  10 giugno 2021). Se si aggiungono statistiche, video o mappe di terze
//  parti, pagina e consenso vanno rivisti.
// =============================================================================

/** Una pagina legale: titolo, data di aggiornamento, testo (HTML semplice). */
export interface PaginaLegale {
  titolo: string;
  /** Data dell'ultimo aggiornamento, AAAA-MM-GG. */
  aggiornata: string;
  testo: string;
}

export type ChiaveLegale = 'privacy' | 'cookie' | 'noteLegali' | 'accessibilita';

/** Indirizzo pubblico di ogni pagina legale. */
export const PERCORSI_LEGALI: Record<ChiaveLegale, string> = {
  privacy: '/privacy',
  cookie: '/cookie',
  noteLegali: '/note-legali',
  accessibilita: '/accessibilita'
};

/** Vero se il testo contiene ancora parti da completare [tra parentesi quadre]. */
export const daCompletare = (testo: string) => /\[[^\]]{2,}\]/.test(testo);

export const LEGALI_PREDEFINITI: Record<ChiaveLegale, PaginaLegale> = {
  privacy: {
    titolo: 'Informativa sulla privacy',
    aggiornata: '',
    testo: `
<p>Questa informativa spiega quali dati personali tratta la Federazione attraverso questo sito, perché li tratta e quali diritti hai. È resa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).</p>
<h2>Titolare del trattamento</h2>
<p>[Denominazione completa dell'ente], con sede in [indirizzo della sede legale], codice fiscale [codice fiscale]. Puoi scrivere a [indirizzo email per la privacy] oppure alla PEC [indirizzo PEC].</p>
<p>Responsabile della protezione dei dati: [nome e contatti, se nominato; altrimenti eliminare questo paragrafo].</p>
<h2>Quali dati trattiamo</h2>
<ul>
<li><strong>Account:</strong> nome, cognome, indirizzo email e password (conservata solo in forma cifrata), quando ti registri.</li>
<li><strong>Iscrizioni agli eventi:</strong> a quali eventi ti iscrivi e, se registrata, la tua presenza.</li>
<li><strong>Newsletter:</strong> indirizzo email ed eventualmente il nome, se ti iscrivi.</li>
<li><strong>Dati tecnici di navigazione:</strong> indirizzo IP, data e ora delle richieste e informazioni sul browser, registrati automaticamente dal server per il funzionamento e la sicurezza del sito.</li>
</ul>
<h2>Perché li trattiamo e su quale base</h2>
<ul>
<li>Gestire il tuo account, l'area riservata e le iscrizioni agli eventi: esecuzione del servizio che ci chiedi (art. 6, par. 1, lett. b GDPR).</li>
<li>Inviarti la newsletter: il tuo consenso (art. 6, par. 1, lett. a), che puoi revocare in ogni momento con il collegamento presente in ogni email.</li>
<li>Proteggere il sito da abusi e attacchi informatici: legittimo interesse della Federazione (art. 6, par. 1, lett. f).</li>
<li>Adempiere a obblighi di legge, quando previsti (art. 6, par. 1, lett. c).</li>
</ul>
<h2>Per quanto tempo</h2>
<ul>
<li>Dati dell'account: finché l'account resta attivo; li cancelliamo entro [numero] giorni dalla tua richiesta di chiusura.</li>
<li>Iscrizioni agli eventi: [numero] mesi dopo la conclusione dell'evento.</li>
<li>Newsletter: fino alla revoca del consenso.</li>
<li>Dati tecnici di navigazione: [numero] giorni, salvo necessità di accertare reati.</li>
</ul>
<h2>Chi può riceverli</h2>
<p>I dati sono trattati dal personale autorizzato della Federazione e da fornitori che agiscono per nostro conto come responsabili del trattamento: [fornitore dell'hosting], [fornitore del servizio di invio email]. Non vendiamo né diffondiamo i tuoi dati.</p>
<p>Trasferimenti fuori dall'Unione europea: [indicare se avvengono, verso quali paesi e con quali garanzie; altrimenti scrivere che non avvengono].</p>
<h2>I tuoi diritti</h2>
<p>Puoi chiedere in ogni momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento, riceverli in un formato leggibile (portabilità) e opporti al trattamento basato sul legittimo interesse. Puoi revocare il consenso alla newsletter senza conseguenze sui trattamenti già svolti.</p>
<p>Per esercitarli scrivi a [indirizzo email per la privacy]. Se ritieni che il trattamento violi la normativa, puoi proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).</p>
<h2>Conferimento dei dati</h2>
<p>I dati dell'account sono necessari per registrarti: senza, non possiamo creare l'account. L'iscrizione alla newsletter è facoltativa.</p>`
  },
  cookie: {
    titolo: 'Cookie e memoria del browser',
    aggiornata: '',
    testo: `
<p>Questo sito non usa cookie di profilazione né strumenti di statistica o pubblicità di terze parti. Per questo non ti chiediamo alcun consenso all'ingresso: per gli strumenti tecnici la legge prevede soltanto questa informativa.</p>
<h2>Che cosa salviamo nel tuo browser</h2>
<p>Il sito usa la memoria locale del browser (localStorage), uno strumento tecnico simile ai cookie, solo per far funzionare ciò che chiedi:</p>
<ul>
<li><strong>Accesso all'area riservata:</strong> dopo l'accesso conserviamo il codice di sessione, così non devi rientrare a ogni pagina. Si cancella quando esci.</li>
<li><strong>Aspetto del sito:</strong> ricordiamo l'aspetto grafico scelto dalla Federazione, per mostrarlo subito senza sfarfallii.</li>
<li><strong>Copia dei testi:</strong> teniamo una copia dei testi del sito per caricarlo più in fretta alla visita successiva.</li>
</ul>
<p>Nessuna di queste informazioni serve a profilarti o viene condivisa con terzi.</p>
<h2>Caratteri e risorse esterne</h2>
<p>I caratteri tipografici e tutte le risorse grafiche sono serviti dal sito stesso: la tua navigazione non viene comunicata a servizi esterni come Google Fonts.</p>
<h2>Come cancellare questi dati</h2>
<p>Puoi cancellarli in qualsiasi momento dalle impostazioni del browser, alla voce che riguarda i dati dei siti. Il sito continuerà a funzionare; ti chiederà solo di accedere di nuovo all'area riservata.</p>
<p>Per domande scrivi a [indirizzo email per la privacy]. Maggiori informazioni sul trattamento dei dati nell'informativa sulla privacy.</p>`
  },
  noteLegali: {
    titolo: 'Note legali',
    aggiornata: '',
    testo: `
<h2>Chi gestisce il sito</h2>
<p>Questo sito è di proprietà di [denominazione completa dell'ente], con sede in [indirizzo], codice fiscale [codice fiscale], che ne cura i contenuti.</p>
<h2>Diritti sui contenuti</h2>
<p>Testi, illustrazioni, marchio e impostazione grafica sono della Federazione o usati con autorizzazione. Puoi citare e condividere i contenuti indicando la fonte e il collegamento alla pagina originale; per altri usi, in particolare commerciali, serve un'autorizzazione scritta.</p>
<p>I documenti pubblicati nell'area documenti possono avere condizioni d'uso proprie, indicate nel documento stesso.</p>
<h2>Marchio</h2>
<p>Il nome e il simbolo della Federazione non possono essere usati in modo da far pensare a un'adesione, un patrocinio o una collaborazione che non esiste.</p>
<h2>Responsabilità</h2>
<p>La Federazione cura l'esattezza e l'aggiornamento dei contenuti, ma non può garantire che siano sempre completi o privi di errori. Le informazioni hanno scopo divulgativo e non sostituiscono una consulenza professionale. Segnalaci eventuali errori a [indirizzo email della segreteria].</p>
<p>I collegamenti verso siti esterni sono offerti per comodità: la Federazione non risponde dei loro contenuti.</p>
<h2>Legge applicabile</h2>
<p>Il sito e queste note sono regolati dalla legge italiana.</p>`
  },
  accessibilita: {
    titolo: 'Accessibilità',
    aggiornata: '',
    testo: `
<p>Vogliamo che questo sito si possa usare da tutti, comprese le persone che navigano con la tastiera, con un lettore di schermo o con impostazioni di visualizzazione diverse.</p>
<h2>Che cosa abbiamo fatto</h2>
<ul>
<li>Il sito è progettato seguendo le Linee guida per l'accessibilità dei contenuti web (WCAG 2.1, livello AA).</li>
<li>Colori di testo e sfondo scelti per avere un contrasto sufficiente in tutti gli aspetti grafici del sito.</li>
<li>Tutte le funzioni si usano anche da tastiera, con il fuoco sempre visibile; in ogni pagina il primo comando porta direttamente al contenuto.</li>
<li>Le animazioni si fermano se nel sistema hai chiesto di ridurre il movimento.</li>
<li>Le immagini decorative sono ignorate dai lettori di schermo; quelle che informano hanno un testo alternativo.</li>
<li>Il sito si adatta a schermi da 360 pixel in su e all'ingrandimento del testo.</li>
</ul>
<h2>Limiti noti</h2>
<p>[Elencare qui eventuali parti non ancora accessibili, per esempio documenti PDF non accessibili caricati nell'area documenti, e la data prevista per la correzione. Se non ce ne sono, eliminare questo paragrafo.]</p>
<h2>Segnalazioni</h2>
<p>Se incontri un ostacolo, scrivi a [indirizzo email della segreteria] indicando la pagina e il problema: risponderemo entro [numero] giorni lavorativi e, se possibile, ti forniremo il contenuto in un formato accessibile.</p>`
  }
};
