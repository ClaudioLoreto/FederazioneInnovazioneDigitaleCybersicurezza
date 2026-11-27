# CLAUDE.md — MASTER PLAN & ARCHITETTURA (FIDC)

> **FONTE DI VERITÀ OPERATIVA.** Da consultare a OGNI sessione, prima di scrivere codice.
> Per le regole immutabili (palette, stack, flusso) vedi `CLAUDE_PROJECT_STANDARDS.md`.
> Per lo schema DB vedi `DATABASE_ARCHITECTURE.md`. Per gli agenti vedi `AGENTS.md`.
>
> **Guide operative** (avvio, credenziali, struttura, lavori aperti): cartella `docs/`,
> indice in `README.md`. Chi arriva dopo (persona o agente) parte da `docs/PER-AGENTI.md`.
> I lavori ancora da fare stanno in `docs/ROADMAP-UI.md`.
> In interfaccia i ruoli si chiamano **Direzione** e **Redazione**, non Super User.

---

## 0. DIRETTIVA ASSOLUTA — FEATURE DAL DOCUMENTO DI PROGETTO

Il progetto implementa **esattamente** le feature descritte in
`Progetto_Web_Associazione_Digital.docx`. **NESSUNA feature può essere dimenticata.**

| # | Feature richiesta | Stato | Dove |
|---|-------------------|-------|------|
| 1 | **CMS** (gestione contenuti dal backoffice) | ✅ | `pages/admin/*` + `*Controller.cs` |
| 2 | **News** (pubblicazione + gestione) | ✅ | `news-admin` · `news-dettaglio` · `NewsController` |
| 3 | **Eventi** (pubblicazione + iscrizioni) | ✅ | `eventi-admin` (pannello Iscritti + CSV) · `evento-dettaglio` (iscrizione pubblica) · `EventiController` · `IscrizioniController` |
| 4 | **Registrazione utenti** (con conferma email) | ✅ | `registrazione` · `AuthController` |
| 5 | **Newsletter** (iscrizione pubblica + gestione) | ✅ | `NewsletterController` · `newsletter` box landing |
| 6 | **Area Documenti** (download + gestione, RBAC) | ✅ | `documenti-admin` · `DocumentiController` |
| 7 | **Gestione Utenti & RBAC** (SuperUser/Relatore) | ✅ | `utenti-admin` · `UtentiController` |
| 8 | **Theme/Layout selector** (veil dal backoffice) | ✅ | `impostazioni-tema` · `ThemeService` |

> ⚠️ Se aggiungi/cambi una feature, **aggiorna questa tabella**.

---

## 1. ARCHITETTURA "VEIL" (THEMING VERO) — REGOLA ARCHITETTURALE

> ❌ **VIETATO** duplicare il contenuto in componenti-layout separati con testo hardcoded.
> ✅ **UNA SOLA fonte di contenuto**; i temi sono un "velo" (skin) applicato sopra.

```
                ┌──────────────────────────────────────────┐
   BACKEND/DB ──►  CONTENUTO (eventi, news, documenti…)     │  ← UNICA sorgente
                │  + copy istituzionale in home-content.ts  │
                └───────────────────┬──────────────────────┘
                                    │  render UNA volta
                          ┌─────────▼─────────┐
                          │  LandingComponent │  (struttura unica)
                          └─────────┬─────────┘
                                    │  attributo [data-theme] sul <html>
        ┌───────────────┬──────────┴───────────┬───────────────┐
   data-theme="1"   data-theme="2"        data-theme="3"
   (Institutional   (Tech / Command         (Community Hub
    Cyber — PRIMARY)  Center)                — caldo)
```

- **`ThemeService`** (`shared/theme/theme.service.ts`): unica regia del tema attivo
  (signal, persistito in `localStorage`, scrive `data-theme` su `document.documentElement`).
- **`styles/_themes.scss`**: per ogni `[data-theme="n"]` ridefinisce i token (colori,
  raggi, densità, intensità del movimento) **dentro i 4 colori della palette**. L'HTML
  non cambia; la geometria delle sezioni cambia via `:host-context([data-theme])` (§4-bis).
- **Theme 1 = estetica istituzionale Cyber APPROVATA** (default).
- La **Direzione** (ruolo tecnico `SuperUser`) cambia il velo attivo da `Backoffice → Impostazioni → Tema`
  (dal "Theme Builder": scelta di un velo base **oppure** composizione di un velo
  personalizzato entro i 4 colori palette, persistito su DB). Cambio **in tempo
  reale**, senza reload. Lo switcher pubblico flottante è stato RIMOSSO.

---

## 2. STACK (sintesi — dettagli in CLAUDE_PROJECT_STANDARDS.md)
- **Frontend**: Angular 17+ standalone, signals, `@angular/animations`. Mobile-first.
- **Backend**: .NET 8 a domini `FIDC.Api / Bll / Dal / Models`. XML docs `///` obbligatori.
- **DB**: SQLite (dev, `EnsureCreated`) · SQL Server 2019 (prod) · PostgreSQL (demo).
- **Auth**: JWT + RBAC (`SuperUser` controllo totale · `Relatore` solo contenuti propri).

## 3. PALETTE FERREA (solo 4 colori, + opacità)
`--c-deep-blue #333D6D` · `--c-purple #723EC3` · `--c-peach #FFCF95` · `--c-cream #FFF0D9`.
Fonte unica: `frontend/src/styles/_palette.scss`. I temi rimescolano SOLO questi 4.

## 4. UI/UX — REGOLE HERO & CYBER
- **Hero slogan**: UNA riga, max 50–60 caratteri, ad alto impatto. Niente wrapping brutto.
- **Sfondo**: motivi **IT/Cyber/Security** (grid, nodi luminosi, binario sottile).
  ❌ VIETATI motivi fuori contesto (es. "corde musicali"/blocchi che scorrono).
- **Cassaforte Digitale** (`safe-logo`): mantenere, deve scalare perfettamente.
- **Bottoni**: sempre ben contrastati (accent peach/purple, mai uguali allo sfondo).
- **Mobile**: menu dedicato impeccabile + stacking a blocchi su smartphone.
- **A11y**: rispettare `prefers-reduced-motion`, focus-visible.

## 4-bis. UI v2 — REGOLE BLOCCATE (redesign novembre 2026, branch `redesign/ui-v2`)

> Queste regole valgono per OGNI sessione futura. Una modifica che ne viola una è
> una regressione, anche se "sembra più bella".

**Palette e contrasto**
- Solo `#333D6D` `#723EC3` `#FFCF95` `#FFF0D9` (+ alpha). Nei componenti si usano i
  token; gli hex compaiono in `styles/_palette.scss`, `theme.service.ts` (PALETTE),
  negli SVG degli emblemi, nella favicon e come valori di riserva del canvas.
  Emblemi e illustrazioni sono vignette autonome: usano `--c-*` direttamente.
  Verifica: `grep -rnoE '#[0-9A-Fa-f]{3,8}\b' frontend/src | grep -viE '333D6D|723EC3|FFCF95|FFF0D9'`
  deve trovare solo le password di prova (`Fidc#2026!`).
- Ogni `var(--x)` usato deve essere definito: un token inesistente diventa nero
  (è successo con `--surface-2` e `--bordo` nelle illustrazioni).
- Coppie testo/fondo ammesse: crema/blu (9.3:1), blu/crema, blu/pesca (7.2:1),
  pesca/blu, crema/viola (5.9:1), viola/crema. VIETATE: viola/blu, pesca/crema,
  blu/viola. Il Theme Builder blocca le coppie vietate.
- Mai una card/form viola su fondo viola. Sulla fascia viola le card sono crema.
- Bottoni sempre pieni e leggibili a riposo (`.btn-primary`, `.btn-accent`,
  `.btn-outline`, `.btn-ghost`): niente bottoni che compaiono solo all'hover,
  niente `<button>` nudi. Testo dei bottoni in sentence case, senza frecce.
- `:-webkit-autofill` sovrascritto in `styles.scss`: testo e label sempre leggibili.

**Ingresso e veli**
- `/` = landing pubblica, sempre. Login solo da "Area riservata", registrazione da
  "Unisciti alla Federazione". Nessuno switcher di tema pubblico.
- Contenuto UNA volta (`home-content.ts` + API). I 3 veli cambiano geometria,
  densità, superfici, cornice dell'hero e intensità del movimento, non solo colori:
  1 *Istituzionale* (default: fasce alterne blu/crema/viola) · 2 *Centro di comando*
  (tutto scuro, griglia visibile, angoli vivi, pannelli a riga) · 3 *Comunità*
  (chiaro, arrotondato, arioso). Le differenze strutturali stanno nei componenti
  sotto `:host-context([data-theme='n'])`, i colori nei token di `_themes.scss`.
- Theme Builder in `/admin/impostazioni` (alias `/admin/impostazioni-tema`):
  velo base, velo personalizzato entro i 4 colori con controllo di contrasto,
  angoli, tipografia, **emblema dell'hero** (cassaforte · scudo · nucleo).

**Hero**
- Cassaforte digitale (`fidc-safe-logo`) a destra dell'hero su desktop, sopra il
  testo su mobile. Il suo SVG e le sue animazioni non si toccano.
- Slogan: max 50 caratteri, Chakra Petch 700, una riga dal contenitore ≥ 880px
  (dimensione in `cqi`, misurata: lo slogan è 24,6em), a capo bilanciato sotto.
  Zero overflow orizzontale da 360px a 1920px+.
- Rivelazione "decrittazione" dello slogan: è l'UNICO momento animato al caricamento.

**Movimento**
- Sfondo: rete 2D su canvas (griglia di precisione, nodi, pacchetti sugli archi,
  colonne binarie tenui). Niente Three.js. Si ferma fuori schermo, a scheda nascosta
  e con `prefers-reduced-motion`.
- VIETATE: le 4 linee orizzontali con blocchi che scorrono ("corde di chitarra"),
  il pallino viola orbitante nel logo, entrate fade-up su ogni sezione.
- Ammesse: rivelazioni all'ingresso nel viewport (`fidcReveal`), contatori KPI,
  risposte alle azioni dell'utente (espandi, invia, conferma).

**Illustrazioni** (`shared/illustrazioni/`): persone generate da un manichino unico
(`figura.ts`) con proporzioni umane, arti rastremati, mani, capelli e abiti; le scene
(`scene.ts`) le mettono in posa su fondale viola. Mai più figure fatte di cerchi e
rettangoli accostati. Nessun tratto del viso, un solo tono di pelle per tutti.
Verosimiglianza prima di tutto: gli oggetti in mano si disegnano con `tiene`
(mai in un punto fisso), i portatili hanno la cerniera lontano da chi scrive,
i piani di lavoro sono all'altezza dei gomiti, chi siede ha una sedia.

**Riscontro delle azioni**: ogni salvataggio o eliminazione nel backoffice mostra un
avviso (`AvvisiService`) con lo stesso verbo del bottone. Gli errori restano nel
modulo o in un dialogo, non negli avvisi.

**Pagine pubbliche**: ogni card di news ed eventi porta al dettaglio (`/news/:id`,
`/eventi/:id`); testata e piè di pagina sono componenti condivisi (`shared/pubblico/`);
gli indirizzi sconosciuti mostrano la pagina 404, non un redirect muto.

**Font**: self-hosted da `@fontsource` (niente Google Fonts: GDPR e build offline).
Chakra Petch (titoli) + IBM Plex Sans (testo). Alternative del builder: Sora, Source Serif 4.

---

## 5. RBAC — MATRICE PERMESSI
| Sezione backoffice | SuperUser | Relatore |
|--------------------|:--------:|:--------:|
| Dashboard | ✅ | ✅ |
| Eventi / News | ✅ tutti | ✅ solo propri |
| Area Documenti | ✅ tutti | ✅ solo propri |
| Gestione Utenti | ✅ | ❌ |
| Newsletter | ✅ | ❌ |
| Impostazioni (Tema) | ✅ | ❌ |

Enforcement: lato **server** (`[Authorize(Roles=...)]` + ownership) **e** lato **client**
(`authGuard`, `superUserGuard`, visibilità menu). Mai fidarsi solo del client.

## 6. CHECKLIST PRIMA DI CONSEGNARE
- [ ] Contenuto da unica sorgente; tema solo come skin (nessun testo duplicato nei layout).
- [ ] Tutte le 8 feature del §0 presenti e collegate all'API.
- [ ] Solo 4 colori; bottoni contrastati; hero su una riga.
- [ ] RBAC su server + client. Migrazione DB documentata se cambia lo schema.
- [ ] `prefers-reduced-motion` gestito; mobile impeccabile.
- [ ] `npm run build` e `dotnet build` verdi.
