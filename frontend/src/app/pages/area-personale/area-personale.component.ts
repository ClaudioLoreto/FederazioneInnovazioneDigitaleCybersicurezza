// =============================================================================
//  frontend/src/app/pages/area-personale/area-personale.component.ts
//  LA MIA AREA (/area-personale) — per chiunque abbia un account.
//
//  È tutto ciò che serve a un Socio (nessun permesso): i propri eventi,
//  profilo, newsletter, password, cancellazione dell'account. Chi ha anche
//  permessi da backoffice trova qui il collegamento per entrarci.
//  Sta sul sito pubblico (testata e piè di pagina del sito), non nel
//  backoffice: per un socio la Federazione è il sito, non un gestionale.
//  Contratto API: docs/ACCOUNT.md. Se un servizio non risponde, il riquadro
//  lo dice e il resto della pagina continua a funzionare.
// =============================================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { EmblemaTemaComponent } from '../../shared/emblemi/emblema-tema.component';
import { AuthService } from '../../services/auth.service';
import { Account, Evento, FidcApiService } from '../../services/fidc-api.service';
import { DialogoService } from '../../shared/dialogo/dialogo.service';
import { AvvisiService } from '../../shared/avvisi/avvisi.service';
import { etichettaImminenza, imminente } from '../../services/vetrina.service';
import { etichettaPilastro } from '../../shared/opzioni';

@Component({
  selector: 'fidc-area-personale',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, TestataPubblicaComponent, PiedePubblicoComponent, EmblemaTemaComponent],
  templateUrl: './area-personale.component.html',
  styleUrls: ['../dettaglio/dettaglio.scss', './area-personale.component.scss']
})
export class AreaPersonaleComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(FidcApiService);
  private readonly dialogo = inject(DialogoService);
  private readonly avvisi = inject(AvvisiService);
  private readonly router = inject(Router);

  // --- profilo ---------------------------------------------------------------------
  readonly account = signal<Account | null>(null);
  readonly profiloDisponibile = signal(true);
  nome = '';
  cognome = '';
  readonly salvaProfilo = signal(false);

  readonly nomeMostrato = computed(() => this.account()?.nome || this.auth.utente()?.nomeCompleto.split(' ')[0] || '');
  readonly email = computed(() => this.account()?.email || this.auth.email());

  // --- eventi ----------------------------------------------------------------------
  readonly eventi = signal<Evento[] | null>(null);
  readonly eventiDisponibili = signal(true);
  readonly prossimi = computed(() => (this.eventi() ?? [])
    .filter((e) => new Date(e.dataFine ?? e.dataInizio).getTime() >= Date.now())
    .sort((a, b) => +new Date(a.dataInizio) - +new Date(b.dataInizio)));
  readonly passati = computed(() => (this.eventi() ?? [])
    .filter((e) => new Date(e.dataFine ?? e.dataInizio).getTime() < Date.now())
    .sort((a, b) => +new Date(b.dataInizio) - +new Date(a.dataInizio)));

  // --- newsletter --------------------------------------------------------------------
  readonly cambioNewsletter = signal(false);

  // --- password ------------------------------------------------------------------------
  pwdAttuale = '';
  pwdNuova = '';
  pwdConferma = '';
  readonly pwdInviata = signal(false);
  readonly pwdInCorso = signal(false);
  readonly pwdErrore = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getAccount().subscribe({
      next: (a) => { this.account.set(a); this.nome = a.nome; this.cognome = a.cognome; },
      error: () => {
        this.profiloDisponibile.set(false);
        // Senza il servizio, si parte almeno dal nome della sessione.
        const [n, ...c] = (this.auth.utente()?.nomeCompleto ?? '').split(' ');
        this.nome = n ?? ''; this.cognome = c.join(' ');
      }
    });
    this.api.getMieIscrizioni().subscribe({
      next: (l) => this.eventi.set(l),
      error: () => { this.eventi.set([]); this.eventiDisponibili.set(false); }
    });
  }

  etichetta(v: string): string { return etichettaPilastro(v); }
  imminenza(e: Evento): string | null { return etichettaImminenza(e.dataInizio); }
  vicino(e: Evento): boolean { return imminente(e); }

  // --- azioni ----------------------------------------------------------------------------

  salvaDatiProfilo(nonValido: boolean | null): void {
    if (nonValido || this.salvaProfilo()) return;
    this.salvaProfilo.set(true);
    this.api.aggiornaAccount({ nome: this.nome.trim(), cognome: this.cognome.trim() }).subscribe({
      next: (a) => { this.salvaProfilo.set(false); this.account.set(a); this.avvisi.conferma('Profilo salvato', `${a.nome} ${a.cognome}`); },
      error: () => { this.salvaProfilo.set(false); this.dialogo.avvisa('Profilo non salvato', 'Il servizio non risponde. I dati non sono cambiati: riprova tra qualche minuto.'); }
    });
  }

  async annullaIscrizione(e: Evento): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Annullare l’iscrizione?',
      messaggio: `Il tuo posto a "${e.titolo}" tornerà disponibile per altri. Potrai iscriverti di nuovo finché ci sono posti.`,
      azione: 'Annulla l’iscrizione', annulla: 'Mantieni', distruttiva: true
    });
    if (!ok) return;
    this.api.annullaIscrizione(e.id).subscribe({
      next: () => { this.eventi.set((this.eventi() ?? []).filter((x) => x.id !== e.id)); this.avvisi.conferma('Iscrizione annullata', e.titolo); },
      error: () => this.dialogo.avvisa('Annullamento non riuscito', 'Sei ancora iscritto. Riprova tra qualche istante.')
    });
  }

  newsletter(iscritto: boolean): void {
    if (this.cambioNewsletter()) return;
    this.cambioNewsletter.set(true);
    this.api.impostaNewsletter(iscritto).subscribe({
      next: () => {
        this.cambioNewsletter.set(false);
        const a = this.account();
        if (a) this.account.set({ ...a, newsletter: iscritto });
        this.avvisi.conferma(iscritto ? 'Iscrizione alla newsletter attivata' : 'Iscrizione alla newsletter annullata',
          iscritto ? 'Riceverai il prossimo numero.' : 'Non riceverai più la newsletter.');
      },
      error: () => { this.cambioNewsletter.set(false); this.dialogo.avvisa('Modifica non riuscita', 'La tua iscrizione è rimasta com’era. Riprova tra qualche minuto.'); }
    });
  }

  cambiaPassword(nonValido: boolean | null): void {
    this.pwdInviata.set(true);
    this.pwdErrore.set(null);
    if (nonValido || this.pwdInCorso()) return;
    if (this.pwdNuova !== this.pwdConferma) { this.pwdErrore.set('Le due nuove password non coincidono.'); return; }
    if (this.pwdNuova === this.pwdAttuale) { this.pwdErrore.set('La nuova password deve essere diversa da quella attuale.'); return; }
    this.pwdInCorso.set(true);
    this.api.cambiaPassword(this.pwdAttuale, this.pwdNuova).subscribe({
      next: () => {
        this.pwdInCorso.set(false); this.pwdInviata.set(false);
        this.pwdAttuale = this.pwdNuova = this.pwdConferma = '';
        this.avvisi.conferma('Password cambiata', 'Usala dal prossimo accesso.');
      },
      error: (err: unknown) => {
        this.pwdInCorso.set(false);
        const s = err instanceof HttpErrorResponse ? err.status : 0;
        this.pwdErrore.set(s === 400 || s === 401 || s === 403
          ? 'La password attuale non è corretta.'
          : 'Il servizio non risponde. La password non è cambiata: riprova tra qualche minuto.');
      }
    });
  }

  async eliminaAccount(): Promise<void> {
    const ok = await this.dialogo.conferma({
      titolo: 'Eliminare il tuo account?',
      messaggio: 'Perderai l’accesso all’area riservata e le iscrizioni agli eventi. L’operazione non è reversibile.',
      azione: 'Elimina l’account', distruttiva: true
    });
    if (!ok) return;
    this.api.eliminaAccount().subscribe({
      next: () => { this.auth.logout(); this.router.navigateByUrl('/'); this.avvisi.conferma('Account eliminato', 'I tuoi dati sono stati cancellati.'); },
      error: () => this.dialogo.avvisa('Eliminazione non riuscita', 'Il tuo account è ancora attivo. Riprova o scrivi alla segreteria.')
    });
  }

  esci(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
