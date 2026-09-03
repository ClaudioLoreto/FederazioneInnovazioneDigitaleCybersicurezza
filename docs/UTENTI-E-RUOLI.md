# Utenti di prova, ruoli e permessi

---

## 1. Credenziali per le prove

Questi tre account vengono creati automaticamente al primo avvio dell'API
(`backend/FIDC.Dal/Seeding/DataSeeder.cs`). Servono per provare la piattaforma con
ruoli diversi. Accesso da <http://localhost:4200/admin/login>.

| Nome e cognome | Email (nome utente) | Password | Ruolo tecnico | Cosa vede |
|---|---|---|---|---|
| Lorenzo De Santis | `direzione@fidc.it` | `Fidc#2026!` | `SuperUser` | Tutto il backoffice |
| Giulia Ferraro | `g.ferraro@fidc.it` | `Fidc#2026!` | `Relatore` | Solo i propri contenuti |
| Marco Bianchi | `m.bianchi@fidc.it` | `Fidc#2026!` | `Relatore` | Solo i propri contenuti |

> La password è la stessa per tutti ed è definita in un unico punto
> (`DataSeeder.PasswordDefault`). Vale **solo** per gli ambienti di sviluppo e demo:
> in produzione va cambiata al primo accesso.

### Non serve digitarle

In ambiente di sviluppo la pagina di accesso mostra in fondo un riquadro **"Utenze di
prova"** con i tre account: un clic compila il modulo ed entra. Serve a collaudare i
permessi passando da un ruolo all'altro in un secondo, senza tenere le credenziali su un
foglietto a parte.

Il riquadro è generato da `frontend/src/environments/environment.ts`. Il file di
produzione (`environment.prod.ts`) espone un elenco vuoto, quindi in produzione il
riquadro **non esiste**: non è nascosto con il CSS, proprio non viene costruito.

**Perché provare anche i due Relatori:** hanno contenuti diversi assegnati. Giulia Ferraro
è responsabile di tre eventi e di due news, Marco Bianchi degli altri. Entrando con l'uno
o con l'altro si verifica che ciascuno veda davvero soltanto la propria roba: è il modo
più veloce per accorgersi se un controllo di permessi si è rotto.

### Se le credenziali non funzionano

Il database potrebbe essere stato creato prima dell'ultima versione del seeder.
Cancellalo e riavvia l'API: viene ricostruito da zero
(vedi *Ripulire il database* in [AVVIO-RAPIDO.md](AVVIO-RAPIDO.md)).

---

## 2. I due ruoli

Il sistema ha due soli livelli di accesso. Sono definiti in
`backend/FIDC.Models/Enums/UserRole.cs`.

| Ruolo tecnico (nel codice e nel token) | Etichetta mostrata all'utente | Significato |
|---|---|---|
| `SuperUser` | **Direzione** | Governa l'intera piattaforma: contenuti di chiunque, utenti, newsletter, aspetto grafico. |
| `Relatore` | **Redazione** | Pubblica e aggiorna esclusivamente i contenuti di cui è autore. |

> ⚠️ **Nota per chi lavora sul codice:** i nomi `SuperUser` e `Relatore` sono nomi
> *interni*, nati durante lo sviluppo. Non vanno mai mostrati nell'interfaccia:
> un sito istituzionale scrive "Direzione", non "Super User".
>
> La traduzione avviene in un unico punto, `frontend/src/app/shared/ruoli.ts`. Nei
> template si passa sempre da lì, mai scrivendo l'etichetta a mano: se il committente
> un domani preferisce altre denominazioni, si cambia un file solo.
>
> I valori tecnici **non si rinominano**, perché sono scritti dentro i token JWT già
> emessi e dentro gli attributi `[Authorize]` del backend.

---

## 3. Chi può fare cosa

| Sezione del backoffice | Direzione (`SuperUser`) | Redazione (`Relatore`) |
|---|:---:|:---:|
| Pannello iniziale | ✅ | ✅ |
| Eventi | ✅ tutti | ✅ solo i propri |
| News | ✅ tutte | ✅ solo le proprie |
| Area documenti | ✅ tutti | ✅ solo i propri |
| Gestione utenti | ✅ | ❌ |
| Newsletter | ✅ | ❌ |
| Aspetto grafico (Theme Builder) | ✅ | ❌ |

---

## 4. Come sono garantiti i permessi

Il controllo avviene **due volte**, e le due verifiche hanno scopi diversi.

**Sul server — è quella che conta davvero.**
Ogni endpoint riservato è protetto da `[Authorize(Roles = "...")]`, e per i contenuti
c'è in più il controllo di proprietà: un Relatore che chiede di modificare un evento
altrui riceve un rifiuto anche se ha un token valido.

**Nel browser — è solo comodità.**
`authGuard` e `superUserGuard` (`frontend/src/app/services/auth.guard.ts`) impediscono di
aprire pagine non pertinenti, e il menu laterale nasconde le voci non disponibili.
Serve a non mostrare porte chiuse, non a proteggere: chiunque può manipolare il codice
che gira nel proprio browser.

> **Regola:** un permesso che esiste solo nel frontend non è un permesso.
> Ogni volta che si aggiunge una sezione riservata va protetto **prima** l'endpoint.

---

## 5. Registrazione di nuovi utenti

Chi si registra da `/registrati` viene salvato con ruolo `Relatore` e, in produzione,
deve confermare l'email prima di poter accedere.

In sviluppo la conferma è disattivata dall'impostazione
`Auth:BypassEmailConfirmation: true` in `appsettings.Development.json`: l'account nasce
già attivo e nessuna email viene inviata. Serve perché in locale non c'è una casella di
posta vera da controllare. In `appsettings.json` (produzione) l'impostazione è `false`.

La promozione di un utente a Direzione si fa dal backoffice, da `/admin/utenti`, ed è
riservata a chi è già Direzione.
