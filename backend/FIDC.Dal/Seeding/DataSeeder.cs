// =============================================================================
//  FIDC.Dal » Seeding » DataSeeder.cs
//  Seeder idempotente: popola il database al primo avvio con dati realistici
//  e autorevoli della Federazione (utenti RBAC, eventi, news, iscrizioni).
//  È SICURO da richiamare ad ogni boot: se i dati esistono già, non duplica.
//  NB: NON altera lo schema (nessun impatto sul diagramma ER).
// =============================================================================

using FIDC.Models.Entities;
using FIDC.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace FIDC.Dal.Seeding;

/// <summary>
/// Popola il database FIDC con un set iniziale di dati realistici in italiano.
/// Pensato per ambienti dev/demo e per il primo avvio in produzione.
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Password di default per tutti gli account seed (solo dev/demo).
    /// In produzione va cambiata al primo accesso.
    /// </summary>
    private const string PasswordDefault = "Fidc#2026!";

    /// <summary>
    /// Esegue il seeding completo in modo idempotente.
    /// Ordine: Utenti → Eventi/News (dipendono dagli utenti) → Iscrizioni.
    /// </summary>
    /// <param name="db">Contesto EF Core già migrato.</param>
    public static async Task SeedAsync(FidcDbContext db)
    {
        // --- 0) TEMA/VELO DI DEFAULT (idempotente e indipendente) -------------
        // Garantisce sempre una riga di configurazione attiva coerente col
        // Tema 1 istituzionale approvato. Non usa colori fuori palette FIDC.
        if (!await db.ImpostazioniTema.AnyAsync())
        {
            await db.ImpostazioniTema.AddAsync(new ImpostazioneTema
            {
                Nome = "Tema FIDC (istituzionale)",
                Attivo = true,
                TemaBase = "1",
                Personalizzato = false,
                ColorePrimario = "#723EC3",
                ColoreAccento = "#FFCF95",
                ColoreSfondo = "#FFF0D9",
                ColoreTesto = "#333D6D",
                StileRaggio = "soft",
                AbbinamentoFont = "cyber"
            });
            await db.SaveChangesAsync();
        }

        // Se ci sono già utenti, consideriamo il DB già popolato: usciamo.
        if (await db.Utenti.AnyAsync())
            return;

        // --- 1) UTENTI (1 SuperUser + 2 Relatori) -----------------------------
        var hash = BCrypt.Net.BCrypt.HashPassword(PasswordDefault);

        var superUser = new Utente
        {
            Nome = "Lorenzo",
            Cognome = "De Santis",
            Email = "direzione@fidc.it",
            PasswordHash = hash,
            Ruolo = UserRole.SuperUser,
            EmailConfermata = true
        };

        var relatore1 = new Utente
        {
            Nome = "Giulia",
            Cognome = "Ferraro",
            Email = "g.ferraro@fidc.it",
            PasswordHash = hash,
            Ruolo = UserRole.Relatore,
            EmailConfermata = true
        };

        var relatore2 = new Utente
        {
            Nome = "Marco",
            Cognome = "Bianchi",
            Email = "m.bianchi@fidc.it",
            PasswordHash = hash,
            Ruolo = UserRole.Relatore,
            EmailConfermata = true
        };

        await db.Utenti.AddRangeAsync(superUser, relatore1, relatore2);
        await db.SaveChangesAsync(); // genera gli Id necessari per le FK

        // --- 2) EVENTI (5: mix passati e futuri) ------------------------------
        var oggi = DateTime.UtcNow;

        var eventi = new List<Evento>
        {
            new()
            {
                Titolo = "Cyber Resilience Summit 2026",
                Sottotitolo = "La resilienza digitale dell'Europa: strategie, alleanze, tecnologie",
                Descrizione =
                    "Due giornate di confronto tra istituzioni, industria e ricerca per definire l'agenda " +
                    "della resilienza digitale del continente. Tavoli tematici su NIS2, protezione delle " +
                    "infrastrutture critiche e risposta agli incidenti.",
                Pilastro = PilastroTipo.Eventi,
                DataInizio = oggi.AddMonths(2),
                DataFine = oggi.AddMonths(2).AddDays(1),
                Luogo = "Roma — Auditorium della Tecnica",
                PostiTotali = 400,
                Pubblicato = true,
                RelatoreId = relatore1.Id
            },
            new()
            {
                Titolo = "AI Governance Workshop: regole, etica e responsabilità",
                Sottotitolo = "Tradurre l'AI Act in pratiche operative per imprese e PA",
                Descrizione =
                    "Un laboratorio intensivo dedicato all'applicazione concreta del Regolamento europeo " +
                    "sull'intelligenza artificiale. Casi d'uso, valutazione del rischio e modelli di governance " +
                    "responsabile dei sistemi di AI.",
                Pilastro = PilastroTipo.Formazione,
                DataInizio = oggi.AddDays(21),
                DataFine = oggi.AddDays(21),
                Luogo = "Milano — Talent Garden Calabiana",
                PostiTotali = 120,
                Pubblicato = true,
                RelatoreId = relatore2.Id
            },
            new()
            {
                Titolo = "Hackathon Cyber Defenders: difendere le infrastrutture critiche",
                Sottotitolo = "48 ore per costruire soluzioni di difesa di nuova generazione",
                Descrizione =
                    "Una maratona di progettazione rivolta a sviluppatori, ricercatori e studenti per " +
                    "prototipare strumenti di rilevamento e risposta alle minacce sulle infrastrutture essenziali. " +
                    "In palio percorsi di accelerazione con i partner della Federazione.",
                Pilastro = PilastroTipo.Attivita,
                DataInizio = oggi.AddMonths(1).AddDays(10),
                DataFine = oggi.AddMonths(1).AddDays(12),
                Luogo = "Torino — OGR Tech",
                PostiTotali = 200,
                Pubblicato = true,
                RelatoreId = relatore1.Id
            },
            new()
            {
                Titolo = "Forum Nazionale Identità Digitale e Cittadinanza",
                Sottotitolo = "Wallet europeo, SPID e il futuro dell'identità del cittadino",
                Descrizione =
                    "Un confronto sullo stato dell'arte dell'identità digitale in Italia e in Europa, tra " +
                    "European Digital Identity Wallet, interoperabilità e tutela della privacy. Evento ormai " +
                    "concluso, con atti disponibili negli archivi della Federazione.",
                Pilastro = PilastroTipo.Ricerca,
                DataInizio = oggi.AddMonths(-3),
                DataFine = oggi.AddMonths(-3),
                Luogo = "Bologna — Palazzo Re Enzo",
                PostiTotali = 300,
                Pubblicato = true,
                RelatoreId = relatore2.Id
            },
            new()
            {
                Titolo = "Cybersecurity Awareness Day per le PMI",
                Sottotitolo = "Proteggere le piccole e medie imprese dalle minacce quotidiane",
                Descrizione =
                    "Giornata formativa gratuita pensata per imprenditori e responsabili IT delle PMI: " +
                    "phishing, ransomware, backup e cultura della sicurezza. Edizione passata che ha coinvolto " +
                    "oltre 250 aziende del territorio.",
                Pilastro = PilastroTipo.Formazione,
                DataInizio = oggi.AddMonths(-1).AddDays(-5),
                DataFine = oggi.AddMonths(-1).AddDays(-5),
                Luogo = "Napoli — Città della Scienza",
                PostiTotali = 250,
                Pubblicato = true,
                RelatoreId = relatore1.Id
            }
        };

        await db.Eventi.AddRangeAsync(eventi);

        // --- 3) NEWS (5 articoli con titoli professionali) --------------------
        var news = new List<News>
        {
            new()
            {
                Titolo = "Osservatorio Cybersicurezza 2026: il 68% delle PMI italiane resta vulnerabile",
                Sommario =
                    "Il nuovo report FIDC fotografa lo stato della sicurezza informatica nelle piccole e medie " +
                    "imprese e indica le tre priorità d'azione per i prossimi dodici mesi.",
                Contenuto =
                    "La ricerca, condotta su un campione di oltre 1.200 imprese, evidenzia un divario ancora " +
                    "marcato tra la percezione del rischio e l'adozione di misure di protezione efficaci. " +
                    "La Federazione propone un piano in tre punti: formazione continua, adozione dell'autenticazione " +
                    "a più fattori e definizione di un piano di risposta agli incidenti.",
                Slug = "osservatorio-cybersicurezza-2026",
                Pilastro = PilastroTipo.Ricerca,
                Pubblicato = true,
                DataPubblicazione = oggi.AddDays(-2),
                AutoreId = superUser.Id
            },
            new()
            {
                Titolo = "Al via la FIDC Academy: 1.000 borse di studio per le competenze digitali",
                Sommario =
                    "Un programma nazionale di reskilling gratuito dedicato a giovani e lavoratori, con " +
                    "certificazioni riconosciute su cybersicurezza, dato e intelligenza artificiale.",
                Contenuto =
                    "La FIDC Academy nasce per colmare il divario di competenze digitali del Paese. Il programma " +
                    "offre percorsi modulari, laboratori pratici e certificazioni allineate agli standard europei, " +
                    "con particolare attenzione all'inclusione e alle pari opportunità.",
                Slug = "fidc-academy-borse-di-studio",
                Pilastro = PilastroTipo.Formazione,
                Pubblicato = true,
                DataPubblicazione = oggi.AddDays(-7),
                AutoreId = relatore1.Id
            },
            new()
            {
                Titolo = "Cyber Resilience Summit: a Roma i protagonisti della sicurezza europea",
                Sommario =
                    "Due giornate di confronto tra istituzioni, industria e ricerca per definire l'agenda della " +
                    "resilienza digitale del continente.",
                Contenuto =
                    "Il Summit riunirà rappresentanti delle istituzioni europee, CISO delle principali aziende e " +
                    "ricercatori di fama internazionale. Al centro del dibattito l'attuazione della direttiva NIS2 " +
                    "e la cooperazione transfrontaliera nella risposta agli incidenti.",
                Slug = "cyber-resilience-summit-roma",
                Pilastro = PilastroTipo.Eventi,
                Pubblicato = true,
                DataPubblicazione = oggi.AddDays(-10),
                AutoreId = relatore1.Id
            },
            new()
            {
                Titolo = "Intelligenza artificiale e PA: pubblicate le linee guida FIDC per un'adozione responsabile",
                Sommario =
                    "Un documento operativo per accompagnare le amministrazioni nell'introduzione di sistemi di AI " +
                    "affidabili, trasparenti e conformi all'AI Act.",
                Contenuto =
                    "Le linee guida definiscono un percorso in cinque fasi — dalla valutazione del rischio al " +
                    "monitoraggio continuo — e includono una checklist di conformità pensata per i responsabili " +
                    "della transizione digitale del settore pubblico.",
                Slug = "linee-guida-ai-pubblica-amministrazione",
                Pilastro = PilastroTipo.Attivita,
                Pubblicato = true,
                DataPubblicazione = oggi.AddDays(-18),
                AutoreId = relatore2.Id
            },
            new()
            {
                Titolo = "Identità digitale europea: la Federazione partecipa alla sperimentazione del Wallet",
                Sommario =
                    "FIDC tra i soggetti coinvolti nei progetti pilota per il portafoglio europeo di identità " +
                    "digitale, verso un'esperienza di cittadinanza più sicura e interoperabile.",
                Contenuto =
                    "La sperimentazione mira a validare casi d'uso reali — dall'accesso ai servizi pubblici alla " +
                    "firma di documenti — garantendo al cittadino il pieno controllo dei propri dati personali, " +
                    "secondo i principi della privacy by design.",
                Slug = "identita-digitale-europea-wallet",
                Pilastro = PilastroTipo.Ricerca,
                Pubblicato = true,
                DataPubblicazione = oggi.AddDays(-25),
                AutoreId = superUser.Id
            }
        };

        await db.News.AddRangeAsync(news);
        await db.SaveChangesAsync(); // genera gli Id degli eventi per le iscrizioni

        // --- 4) ISCRIZIONI (collegano utenti a eventi) ------------------------
        // I Relatori si iscrivono ad alcuni eventi a titolo di esempio.
        var iscrizioni = new List<Iscrizione>
        {
            new()
            {
                EventoId = eventi[0].Id,           // Cyber Resilience Summit
                UtenteId = relatore2.Id,
                EmailConfermaInviata = true,
                Presente = false                    // evento futuro
            },
            new()
            {
                EventoId = eventi[1].Id,           // AI Governance Workshop
                UtenteId = relatore1.Id,
                EmailConfermaInviata = true,
                Presente = false
            },
            new()
            {
                EventoId = eventi[3].Id,           // Forum Identità Digitale (passato)
                UtenteId = superUser.Id,
                EmailConfermaInviata = true,
                Presente = true                     // ha partecipato
            },
            new()
            {
                EventoId = eventi[4].Id,           // Cybersecurity Awareness Day (passato)
                UtenteId = relatore2.Id,
                EmailConfermaInviata = true,
                Presente = true
            }
        };

        await db.Iscrizioni.AddRangeAsync(iscrizioni);

        // --- 5) AREA DOCUMENTI ------------------------------------------------
        var documenti = new List<Documento>
        {
            new()
            {
                Titolo = "Linee guida AI per la Pubblica Amministrazione",
                Descrizione = "Documento operativo in cinque fasi per un'adozione responsabile dell'AI nella PA.",
                Url = "https://www.fidc.it/docs/linee-guida-ai-pa.pdf",
                Categoria = "Linee guida",
                Visibilita = VisibilitaDocumento.Pubblico,
                CaricatoDaId = superUser.Id
            },
            new()
            {
                Titolo = "Osservatorio Cybersicurezza 2026 — Report completo",
                Descrizione = "Analisi su oltre 1.200 imprese: stato della sicurezza e priorità d'azione.",
                Url = "https://www.fidc.it/docs/osservatorio-cyber-2026.pdf",
                Categoria = "Report",
                Visibilita = VisibilitaDocumento.Pubblico,
                CaricatoDaId = relatore1.Id
            },
            new()
            {
                Titolo = "Atti interni — Forum Identità Digitale",
                Descrizione = "Materiali riservati ai soci: registrazioni e slide dell'edizione passata.",
                Url = "https://www.fidc.it/docs/atti-forum-identita.zip",
                Categoria = "Atti",
                Visibilita = VisibilitaDocumento.Riservato,
                CaricatoDaId = relatore2.Id
            }
        };
        await db.Documenti.AddRangeAsync(documenti);

        // --- 6) NEWSLETTER (iscritti di esempio) ------------------------------
        var iscrittiNewsletter = new List<IscrizioneNewsletter>
        {
            new() { Email = "anna.verdi@example.com",   Nome = "Anna Verdi",   Attiva = true },
            new() { Email = "studio.rossi@example.com", Nome = "Studio Rossi", Attiva = true },
            new() { Email = "info@pmi-sicura.it",        Nome = null,           Attiva = true }
        };
        await db.IscrizioniNewsletter.AddRangeAsync(iscrittiNewsletter);

        await db.SaveChangesAsync();
    }
}
