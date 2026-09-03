# CLAUDE_PROJECT_STANDARDS.md

> **FILE BLOCCATO / LOCKED RULEBOOK**
> Questo file è la fonte di verità immutabile per l'intero progetto **FIDC – Federazione Innovazione, Digitale e Cybersicurezza**.
> Ogni prompt, ogni file generato e ogni decisione architetturale DEVE rispettare le regole qui sotto.
> Non modificare questo file salvo richiesta esplicita di aggiornamento delle regole.

---

## 1. IDENTITÀ DEL PROGETTO

| Campo | Valore |
|-------|--------|
| Nome esteso | Federazione Innovazione, Digitale e Cybersicurezza |
| Acronimo | **FIDC** |
| Tono istituzionale | Autorevole, affidabile, innovativo (benchmark: fondazioneitaliadigitale.org — ma visivamente superiore) |
| 4 Pilastri | **Attività · Eventi · Formazione · Ricerca** |
| Logo | Definito in `LOGO.txt` (SVG, marchio wordmark **FIDC**) + **Cassaforte Digitale** animata (`safe-logo.component.ts`) come centerpiece dell'hero. Entrambi **animati** (handle rotanti, glow, scansione). |

---

## 0. ARCHITETTURA DELL'ESPERIENZA (FLUSSO UTENTE)

> ⚠️ **REGOLA FONDAMENTALE:** la piattaforma NON è un portale chiuso.
> La **prima** pagina è SEMPRE la **Landing Page pubblica** (hero spettacolare con
> cassaforte digitale animata, 4 pilastri, sezione News/Magazine).
> **MAI** mostrare il login come primo impatto.
> Login utente e Area Documenti sono funzioni **secondarie**, raggiungibili da un
> pulsante nell'header ("Area riservata" → `/admin/login`).

---

## 2. PALETTE COLORI — REGOLA FERREA (SOLO 4 COLORI)

> ⛔ **VIETATO** qualsiasi colore al di fuori di questi quattro. Niente grigi extra, niente rossi, niente verdi.
> Le ombre/overlay si ottengono SOLO con opacità (alpha) di questi 4 colori.

| Token | HEX | Ruolo | Note di contrasto |
|-------|-----|-------|-------------------|
| `--c-deep-blue` | `#333D6D` | Sfondo scuro primario / testo su chiaro | Base istituzionale |
| `--c-purple` | `#723EC3` | **Accent centrale e prominente** | È un colore scuro → usare glow, bordi luminosi, gradient con `--c-peach`, e SEMPRE su sfondo `--c-cream` o `--c-deep-blue` per massimo contrasto |
| `--c-peach` | `#FFCF95` | Accent secondario / highlight | Ottimo per CTA e dettagli luminosi |
| `--c-cream` | `#FFF0D9` | Sfondo chiaro / testo su scuro | Contrasto principale |

### Regole di accessibilità contrasto
- Testo su `--c-deep-blue` → usare `--c-cream` (AAA).
- Testo su `--c-cream` → usare `--c-deep-blue` (AAA).
- `--c-purple` come testo SOLO su `--c-cream` (contrasto sufficiente). Mai purple su deep-blue come testo piccolo.
- `--c-peach` mai come testo su `--c-cream` (contrasto insufficiente) → usarlo solo per superfici/icone/bordi.
- Per far "risaltare" il purple: gradient `--c-purple → --c-peach`, glow `box-shadow` purple a bassa opacità, bordo peach 1px.

### Variabili SCSS canoniche
```scss
// _palette.scss — UNICA fonte dei colori
$c-deep-blue: #333D6D;
$c-purple:    #723EC3;
$c-peach:     #FFCF95;
$c-cream:     #FFF0D9;

:root {
  --c-deep-blue: #{$c-deep-blue};
  --c-purple:    #{$c-purple};
  --c-peach:     #{$c-peach};
  --c-cream:     #{$c-cream};
}
```

---

## 3. STACK TECNOLOGICO (REGOLE FISSE)

| Layer | Tecnologia | Vincolo |
|-------|-----------|---------|
| Frontend | **Angular** (standalone components, Angular 17+) | Animazioni con `@angular/animations` + CSS transitions. 3 layout intercambiabili, stesso backend. |
| Backend | **C# .NET 8** Web API | Architettura a domini: API / BLL / DAL / Models. XML docs `///` obbligatori. |
| ORM | **Entity Framework Core 8** | Multi-provider: SQL Server (prod) + PostgreSQL (dev/test). |
| DB Produzione | **SQL Server 2019** (Windows Server 2019, SSMS) | |
| DB Demo/Test | **PostgreSQL** (Railway / Docker locale) | |
| Email | **Resend API** | Email di conferma registrazione automatizzata. |
| Auth | JWT + **RBAC** | Ruoli: `SuperUser` (controllo totale), `Relatore` (gestisce eventi/news propri). |
| DevOps | **.bat / .cmd** scripts | start_local_dev, db_migrate_update, deploy_railway. |

---

## 4. ARCHITETTURA BACKEND (a domini — MAI tutto in una cartella)

```
backend/
├─ FIDC.Api/        → Controllers, endpoint, middleware, DI, Program.cs
├─ FIDC.Bll/        → Business Logic Layer: Services, validazioni, DTO mapping
├─ FIDC.Dal/        → Data Access Layer: DbContext, Repositories, Migrations
└─ FIDC.Models/     → Entities, DTOs, Enums (nessuna logica)
```

**Regole:**
- `FIDC.Api` dipende da `FIDC.Bll` e `FIDC.Models`.
- `FIDC.Bll` dipende da `FIDC.Dal` e `FIDC.Models`.
- `FIDC.Dal` dipende da `FIDC.Models`.
- `FIDC.Models` non dipende da nessuno.
- **Ogni** classe/metodo/endpoint pubblico ha XML doc `///` + commenti inline esplicativi in italiano.
- Nessuna logica di business nei Controller (solo orchestrazione → Service).

---

## 5. REGOLE DATABASE

- PK: sempre `Id` `int IDENTITY` (SQL Server) / `serial`/identity (Postgres) gestito da EF.
- FK: sempre esplicite, naming `<Entità>Id`.
- Nessuna anomalia: normalizzazione 3NF, niente colonne duplicate.
- Tabelle pivot per relazioni N:N (es. `EventoRelatore`).
- Timestamp `CreatedAt` / `UpdatedAt` su ogni entità persistente.
- Soft-delete con flag `IsDeleted` dove sensato.
- Migrations EF: una sola sorgente, applicate su entrambi i provider.
- 📄 **DOCUMENTAZIONE VIVENTE OBBLIGATORIA:** ad **ogni** modifica strutturale del DB
  (entità, colonna, FK, indice, nuova migration) si DEVE aggiornare `DATABASE_ARCHITECTURE.md`:
  diagramma **Mermaid ER**, sezione tabelle e tabella storico migration. Mai lasciarlo disallineato.

---

## 6. REGOLE FRONTEND & MOTION

- 3 **veli** grafici intercambiabili (`data-theme="1|2|3"`) applicati a **un unico
  contenuto**. Implementazione: `styles/_themes.scss` + `shared/theme/theme.service.ts`.
  Dettagli in `docs/ARCHITETTURA-FRONTEND.md`.
  > Nota storica: fino a giugno 2026 esistevano tre componenti-layout separati
  > (`layout-1-institutional`, `layout-2-tech`, `layout-3-hub`) con i testi duplicati.
  > Sono stati **eliminati**: duplicare il contenuto rendeva impossibile tenerlo allineato.
- Logo SVG animato (path drawing, glow del core purple, hover parallax).
- Animazioni: entrata scroll-reveal, stagger sui pilastri, hover micro-interazioni, transizioni di route.
- Solo i 4 colori. Gradient ammessi solo tra i 4 colori.
- Mobile-first, responsive, prefers-reduced-motion rispettato.

---

## 7. COPYWRITING

- **Vietato Lorem Ipsum.** Testi reali, in italiano, autorevoli e istituzionali.
- Registro: serio, ispirazionale, orientato a innovazione + sicurezza + comunità.

---

## 8. CHECKLIST DI CONFORMITÀ (per ogni nuovo file)
- [ ] Usa solo i 4 colori della palette.
- [ ] Rispetta l'architettura a domini.
- [ ] XML docs + commenti inline (backend).
- [ ] Nessun testo placeholder.
- [ ] Supporta multi-DB se tocca la persistenza.
