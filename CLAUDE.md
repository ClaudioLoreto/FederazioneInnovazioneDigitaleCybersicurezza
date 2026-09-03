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
| 2 | **News** (pubblicazione + gestione) | ✅ | `news-admin` · `NewsController` |
| 3 | **Eventi** (pubblicazione + iscrizioni) | ✅ | `eventi-admin` · `EventiController` · `IscrizioniController` |
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
- **`styles/_themes.scss`**: per ogni `[data-theme="n"]` ridefinisce SOLO le CSS variables
  (sfondi/accenti) **dentro i 4 colori della palette**. La struttura HTML non cambia.
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
