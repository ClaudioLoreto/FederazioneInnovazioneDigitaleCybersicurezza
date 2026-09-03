-- =============================================================================
--  FIDC — SCHEMA DI RIFERIMENTO (SQL Server 2019 / SSMS, produzione)
--  Questo script è documentazione/allineamento manuale. La fonte di verità
--  resta EF Core (migrations). Naming PK = Id IDENTITY, FK = <Entita>Id.
-- =============================================================================

CREATE TABLE Utenti (
    Id                     INT IDENTITY(1,1) NOT NULL,           -- PK
    Nome                   NVARCHAR(100)     NOT NULL,
    Cognome                NVARCHAR(100)     NOT NULL,
    Email                  NVARCHAR(256)     NOT NULL,
    PasswordHash           NVARCHAR(MAX)     NOT NULL,           -- BCrypt, mai in chiaro
    Ruolo                  NVARCHAR(30)      NOT NULL,           -- 'SuperUser' | 'Relatore'
    EmailConfermata        BIT               NOT NULL DEFAULT 0,
    TokenConfermaEmail     NVARCHAR(64)      NULL,
    ScadenzaTokenConferma  DATETIME2         NULL,
    CreatedAt              DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt              DATETIME2         NULL,
    IsDeleted              BIT               NOT NULL DEFAULT 0,
    CONSTRAINT PK_Utenti PRIMARY KEY (Id),
    CONSTRAINT UQ_Utenti_Email UNIQUE (Email)                   -- email univoca = username
);

CREATE TABLE Eventi (
    Id           INT IDENTITY(1,1) NOT NULL,                    -- PK
    Titolo       NVARCHAR(200)     NOT NULL,
    Sottotitolo  NVARCHAR(300)     NULL,
    Descrizione  NVARCHAR(MAX)     NOT NULL,
    Pilastro     NVARCHAR(30)      NOT NULL,                    -- 'Attivita'|'Eventi'|'Formazione'|'Ricerca'
    DataInizio   DATETIME2         NOT NULL,
    DataFine     DATETIME2         NULL,
    Luogo        NVARCHAR(200)     NOT NULL,
    PostiTotali  INT               NOT NULL DEFAULT 0,
    Pubblicato   BIT               NOT NULL DEFAULT 0,
    RelatoreId   INT               NOT NULL,                    -- FK -> Utenti.Id (proprietario RBAC)
    CreatedAt    DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt    DATETIME2         NULL,
    IsDeleted    BIT               NOT NULL DEFAULT 0,
    CONSTRAINT PK_Eventi PRIMARY KEY (Id),
    CONSTRAINT FK_Eventi_Relatore FOREIGN KEY (RelatoreId)
        REFERENCES Utenti(Id) ON DELETE NO ACTION                -- non si elimina un relatore con eventi
);

CREATE TABLE News (
    Id                 INT IDENTITY(1,1) NOT NULL,              -- PK
    Titolo             NVARCHAR(200)     NOT NULL,
    Sommario           NVARCHAR(MAX)     NOT NULL,
    Contenuto          NVARCHAR(MAX)     NOT NULL,
    Slug               NVARCHAR(220)     NOT NULL,
    Pilastro           NVARCHAR(30)      NOT NULL,
    ImmagineCopertina  NVARCHAR(500)     NULL,
    Pubblicato         BIT               NOT NULL DEFAULT 0,
    DataPubblicazione  DATETIME2         NULL,
    AutoreId           INT               NOT NULL,              -- FK -> Utenti.Id
    CreatedAt          DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2         NULL,
    IsDeleted          BIT               NOT NULL DEFAULT 0,
    CONSTRAINT PK_News PRIMARY KEY (Id),
    CONSTRAINT UQ_News_Slug UNIQUE (Slug),                      -- slug univoco per URL
    CONSTRAINT FK_News_Autore FOREIGN KEY (AutoreId)
        REFERENCES Utenti(Id) ON DELETE NO ACTION
);

CREATE TABLE Iscrizioni (
    Id                   INT IDENTITY(1,1) NOT NULL,            -- PK
    EventoId             INT               NOT NULL,            -- FK -> Eventi.Id
    UtenteId             INT               NOT NULL,            -- FK -> Utenti.Id
    EmailConfermaInviata BIT               NOT NULL DEFAULT 0,
    Presente             BIT               NOT NULL DEFAULT 0,
    CreatedAt            DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt            DATETIME2         NULL,
    IsDeleted            BIT               NOT NULL DEFAULT 0,
    CONSTRAINT PK_Iscrizioni PRIMARY KEY (Id),
    CONSTRAINT FK_Iscrizioni_Evento FOREIGN KEY (EventoId)
        REFERENCES Eventi(Id) ON DELETE CASCADE,                 -- via le iscrizioni con l'evento
    CONSTRAINT FK_Iscrizioni_Utente FOREIGN KEY (UtenteId)
        REFERENCES Utenti(Id) ON DELETE NO ACTION,
    CONSTRAINT UQ_Iscrizioni_Evento_Utente UNIQUE (EventoId, UtenteId)  -- niente doppie iscrizioni
);

-- Indici di supporto alle query più frequenti del sito pubblico.
CREATE INDEX IX_Eventi_Pubblicato_DataInizio ON Eventi(Pubblicato, DataInizio);
CREATE INDEX IX_News_Pubblicato_DataPubblicazione ON News(Pubblicato, DataPubblicazione);

-- Relazioni:
--   Utenti 1 ── N Eventi      (RelatoreId)
--   Utenti 1 ── N News        (AutoreId)
--   Utenti N ── N Eventi      (tramite Iscrizioni)
