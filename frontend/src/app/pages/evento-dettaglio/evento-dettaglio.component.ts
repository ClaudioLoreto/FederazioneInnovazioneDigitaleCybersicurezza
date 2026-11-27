// =============================================================================
//  frontend/src/app/pages/evento-dettaglio/evento-dettaglio.component.ts
//  DETTAGLIO EVENTO (/eventi/:id).
//
//  Testata con titolo e dati essenziali, "biglietto" laterale con data, luogo,
//  posti e azioni: iscrizione (per chi ha un account), aggiunta al calendario
//  (.ics generato nel browser) e condivisione. Sotto, la descrizione completa e
//  gli altri eventi in programma.
//
//  Se l'API non risponde si usano gli eventi di riserva di home-content.ts,
//  gli stessi del seeder: la pagina non resta mai vuota durante una demo.
// =============================================================================

import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { Evento, FidcApiService } from '../../services/fidc-api.service';
import { AuthService } from '../../services/auth.service';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { IllustrazioneComponent, ScenaIllustrazione } from '../../shared/illustrazioni/illustrazione.component';
import { etichettaPilastro } from '../../shared/opzioni';
import { eventiDiRiserva } from '../../content/home-content';

type StatoIscrizione = 'libero' | 'invio' | 'iscritto' | 'annullamento' | 'errore';

@Component({
  selector: 'fidc-evento-dettaglio',
  standalone: true,
  imports: [DatePipe, RouterLink, TestataPubblicaComponent, PiedePubblicoComponent, IllustrazioneComponent],
  styleUrls: ['../dettaglio/dettaglio.scss', './evento-dettaglio.component.scss'],
  template: `
  <fidc-testata-pubblica></fidc-testata-pubblica>

  <main id="contenuto">
    @if (caricamento()) {
      <section class="tone-dark apertura"><div class="container">
        <div class="scheletro-riga" style="width: 30%"></div>
        <div class="scheletro-riga titolo"></div>
        <div class="scheletro-riga" style="width: 50%; margin-top: 18px"></div>
      </div></section>
    } @else if (!evento()) {
      <section class="tone-dark"><div class="container stato-pagina">
        <h1>Questo evento non è disponibile</h1>
        <p>Potrebbe essere stato rimosso o non essere ancora pubblicato. Guarda gli altri eventi in programma.</p>
        <a class="btn-primary" routerLink="/" fragment="eventi">Vedi il calendario</a>
      </div></section>
    } @else { @if (evento(); as e) {
      <section class="tone-dark apertura">
        <div class="container">
          <nav class="briciole" aria-label="Percorso">
            <a routerLink="/">Home</a><span aria-hidden="true">/</span>
            <a routerLink="/" fragment="eventi">Eventi</a><span aria-hidden="true">/</span>
            <span aria-current="page">{{ e.titolo }}</span>
          </nav>

          <div class="apertura-griglia">
            <div>
              <span class="badge">{{ etichetta(e.pilastro) }}</span>
              <h1>{{ e.titolo }}</h1>
              @if (e.sottotitolo) { <p class="sottotitolo">{{ e.sottotitolo }}</p> }
              <p class="meta">
                <span class="meta-voce">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M9 3v5M15 3v5"/></svg>
                  <time [attr.datetime]="e.dataInizio">{{ e.dataInizio | date:'EEEE d MMMM y, HH:mm' }}</time>
                </span>
                <span class="meta-voce">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
                  {{ e.luogo }}
                </span>
              </p>
            </div>

            <!-- Il biglietto: tutto ciò che serve per partecipare, in un posto solo. -->
            <aside class="biglietto" aria-label="Partecipa all'evento" #biglietto>
              <div class="biglietto-data">
                <span class="giorno">{{ e.dataInizio | date:'dd' }}</span>
                <span class="mese">{{ e.dataInizio | date:'MMMM y' }}</span>
                <span class="ora">ore {{ e.dataInizio | date:'HH:mm' }}</span>
              </div>
              <div class="biglietto-taglio" aria-hidden="true"></div>
              <div class="biglietto-corpo">
                <p class="posti">{{ e.postiTotali }} posti disponibili</p>

                @if (concluso()) {
                  <p class="nota">Questo evento si è già svolto.</p>
                } @else if (!auth.autenticato()) {
                  <a class="btn-primary pieno" routerLink="/login" [queryParams]="{ redirect: '/eventi/' + e.id }">Accedi per iscriverti</a>
                  <p class="nota">Non hai un account? <a routerLink="/registrati">Unisciti alla Federazione</a></p>
                } @else if (stato() === 'iscritto' || stato() === 'annullamento') {
                  <p class="iscritto" role="status">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
                    Sei iscritto a questo evento
                  </p>
                  <button type="button" class="btn-ghost pieno" (click)="annulla(e)" [disabled]="stato() === 'annullamento'">
                    @if (stato() === 'annullamento') { <span class="spinner" aria-hidden="true"></span> Annullamento }
                    @else { Annulla l'iscrizione }
                  </button>
                } @else {
                  <button type="button" class="btn-primary pieno" (click)="iscriviti(e)" [disabled]="stato() === 'invio'">
                    @if (stato() === 'invio') { <span class="spinner" aria-hidden="true"></span> Iscrizione in corso }
                    @else { Iscriviti all'evento }
                  </button>
                }
                @if (messaggio()) { <p class="nota" role="status">{{ messaggio() }}</p> }

                <div class="biglietto-azioni">
                  <button type="button" class="btn-outline btn-sm" (click)="calendario(e)">Aggiungi al calendario</button>
                  <button type="button" class="btn-outline btn-sm" (click)="condividi(e)">{{ copiato() ? 'Link copiato' : 'Condividi' }}</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section class="tone-light corpo">
        <div class="container corpo-griglia">
          <div>
            <div class="illustrazione-corpo"><fidc-illustrazione [scena]="scena(e.pilastro)"></fidc-illustrazione></div>
            <h2 class="sr-only">Descrizione</h2>
            <div class="testo" [innerHTML]="e.descrizione || e.sottotitolo"></div>
          </div>
          <div class="riepilogo">
            <h2>In breve</h2>
            <dl>
              <div><dt>Quando</dt><dd>{{ e.dataInizio | date:'EEEE d MMMM y' }}@if (e.dataFine && giorni(e) > 0) { – {{ e.dataFine | date:'d MMMM' }} }</dd></div>
              <div><dt>Orario</dt><dd>dalle {{ e.dataInizio | date:'HH:mm' }}</dd></div>
              <div><dt>Dove</dt><dd>{{ e.luogo }}</dd></div>
              <div><dt>Ambito</dt><dd>{{ etichetta(e.pilastro) }}</dd></div>
              <div><dt>Posti</dt><dd>{{ e.postiTotali }}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <!-- Telefono: l'azione resta a portata di pollice quando il biglietto è
           fuori schermo. Su schermo largo il biglietto è già fisso a lato. -->
      @if (!concluso()) {
        <div class="barra-mobile" [class.visibile]="barraVisibile()" [attr.aria-hidden]="!barraVisibile()">
          <div class="bm-testo">
            <strong>{{ e.dataInizio | date:'d MMM, HH:mm' }}</strong>
            <span>{{ e.luogo }}</span>
          </div>
          @if (!auth.autenticato()) {
            <a class="btn-primary btn-sm" routerLink="/login" [queryParams]="{ redirect: '/eventi/' + e.id }" [tabindex]="barraVisibile() ? 0 : -1">Accedi e iscriviti</a>
          } @else if (stato() === 'iscritto' || stato() === 'annullamento') {
            <span class="bm-iscritto">Sei iscritto</span>
          } @else {
            <button type="button" class="btn-primary btn-sm" (click)="iscriviti(e)" [disabled]="stato() === 'invio'" [tabindex]="barraVisibile() ? 0 : -1">
              {{ stato() === 'invio' ? 'Iscrizione…' : 'Iscriviti' }}
            </button>
          }
        </div>
      }

      @if (altri().length) {
        <section class="tone-dark correlati">
          <div class="container">
            <h2>Altri eventi in programma</h2>
            <div class="correlati-griglia">
              @for (a of altri(); track a.id) {
                <article class="correlato">
                  <p class="correlato-meta"><span class="badge">{{ etichetta(a.pilastro) }}</span>{{ a.dataInizio | date:'d MMMM y' }}</p>
                  <h3><a [routerLink]="['/eventi', a.id]">{{ a.titolo }}</a></h3>
                  <p>{{ a.luogo }}</p>
                </article>
              }
            </div>
          </div>
        </section>
      }
    }
    }
  </main>

  <fidc-piede-pubblico></fidc-piede-pubblico>
  `
})
export class EventoDettaglioComponent implements OnInit, OnDestroy {
  private readonly api = inject(FidcApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titolo = inject(Title);
  private readonly meta = inject(Meta);
  readonly auth = inject(AuthService);

  readonly evento = signal<Evento | null>(null);
  readonly tutti = signal<Evento[]>([]);
  readonly caricamento = signal(true);
  readonly stato = signal<StatoIscrizione>('libero');
  readonly messaggio = signal('');
  readonly copiato = signal(false);

  /** La barra mobile compare quando il biglietto non è più visibile. */
  readonly barraVisibile = signal(false);
  private osservatore?: IntersectionObserver;

  /** Il biglietto esiste solo a evento caricato: lo osserviamo quando compare. */
  @ViewChild('biglietto') set biglietto(ref: ElementRef<HTMLElement> | undefined) {
    this.osservatore?.disconnect();
    if (!ref || typeof IntersectionObserver === 'undefined') return;
    this.osservatore = new IntersectionObserver(([v]) => {
      // Solo quando il biglietto è sopra la finestra (già superato scorrendo).
      this.barraVisibile.set(!v.isIntersecting && v.boundingClientRect.top < 0);
    });
    this.osservatore.observe(ref.nativeElement);
  }

  readonly concluso = computed(() => {
    const e = this.evento();
    return !!e && new Date(e.dataFine ?? e.dataInizio).getTime() < Date.now();
  });

  /** Fino a tre altri eventi futuri, dal più vicino. */
  readonly altri = computed(() => {
    const id = this.evento()?.id;
    return this.tutti()
      .filter((e) => e.id !== id && new Date(e.dataInizio).getTime() >= Date.now())
      .sort((a, b) => +new Date(a.dataInizio) - +new Date(b.dataInizio))
      .slice(0, 3);
  });

  ngOnInit(): void {
    // La pagina resta montata passando da un evento all'altro: si ricarica a
    // ogni cambio di parametro.
    this.route.paramMap.subscribe((p: ParamMap) => this.carica(Number(p.get('id'))));
    this.api.getEventi().subscribe({
      next: (l) => this.tutti.set(l.length ? l : eventiDiRiserva()),
      error: () => this.tutti.set(eventiDiRiserva())
    });
  }

  ngOnDestroy(): void { this.osservatore?.disconnect(); }

  private carica(id: number): void {
    this.caricamento.set(true);
    this.stato.set('libero');
    this.messaggio.set('');
    const riserva = () => eventiDiRiserva().find((e) => e.id === id) ?? null;
    const imposta = (e: Evento | null) => {
      this.evento.set(e);
      this.caricamento.set(false);
      if (e) {
        this.titolo.setTitle(`${e.titolo} — FIDC`);
        this.meta.updateTag({ name: 'description', content: e.sottotitolo || e.titolo });
        this.meta.updateTag({ property: 'og:title', content: e.titolo });
      }
    };
    if (id < 0) { imposta(riserva()); return; }
    this.api.getEvento(id).subscribe({
      next: imposta,
      error: (err: HttpErrorResponse) => imposta(err.status === 404 ? null : riserva())
    });
  }

  etichetta(v: string): string { return etichettaPilastro(v); }

  scena(pilastro: string): ScenaIllustrazione {
    const s: Record<string, ScenaIllustrazione> = { Attivita: 'gruppo-di-lavoro', Eventi: 'conferenza', Formazione: 'formazione', Ricerca: 'analisi' };
    return s[pilastro] ?? 'conferenza';
  }

  giorni(e: Evento): number {
    if (!e.dataFine) return 0;
    return Math.round((+new Date(e.dataFine) - +new Date(e.dataInizio)) / 86400000);
  }

  iscriviti(e: Evento): void {
    this.stato.set('invio');
    this.messaggio.set('');
    this.api.iscriviEvento(e.id).subscribe({
      next: () => { this.stato.set('iscritto'); this.messaggio.set('Ti aspettiamo. Trovi l\'evento anche nel tuo calendario, se lo aggiungi qui sotto.'); },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) { this.stato.set('iscritto'); this.messaggio.set('Risultavi già iscritto: il posto è confermato.'); return; }
        if (err.status === 401) { this.router.navigate(['/login'], { queryParams: { redirect: `/eventi/${e.id}` } }); return; }
        this.stato.set('errore');
        this.messaggio.set(err.status === 0
          ? 'Il servizio di iscrizione non risponde. Riprova tra qualche minuto.'
          : 'Iscrizione non riuscita. Riprova; se succede ancora, scrivi alla segreteria.');
      }
    });
  }

  annulla(e: Evento): void {
    this.stato.set('annullamento');
    this.api.annullaIscrizione(e.id).subscribe({
      next: () => { this.stato.set('libero'); this.messaggio.set('Iscrizione annullata. Il posto torna disponibile per altri.'); },
      error: () => { this.stato.set('iscritto'); this.messaggio.set('Annullamento non riuscito. Riprova tra qualche minuto.'); }
    });
  }

  /** Scarica un file .ics con l'evento, compatibile con tutti i calendari. */
  calendario(e: Evento): void {
    const inizio = new Date(e.dataInizio);
    const fine = e.dataFine && +new Date(e.dataFine) > +inizio ? new Date(e.dataFine) : new Date(+inizio + 2 * 3600000);
    const z = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const testo = (s: string) => s.replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FIDC//Eventi//IT', 'BEGIN:VEVENT',
      `UID:evento-${e.id}@fidc.it`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(inizio)}`, `DTEND:${z(fine)}`,
      `SUMMARY:${testo(e.titolo)}`, `LOCATION:${testo(e.luogo)}`,
      `DESCRIPTION:${testo(e.sottotitolo || '')}`, `URL:${location.origin}/eventi/${e.id}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${e.titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Condivisione nativa sul telefono; altrove copia il link. */
  async condividi(e: Evento): Promise<void> {
    const url = `${location.origin}/eventi/${e.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: e.titolo, url }); return; }
      await navigator.clipboard.writeText(url);
      this.copiato.set(true);
      setTimeout(() => this.copiato.set(false), 2500);
    } catch { /* condivisione annullata dall'utente */ }
  }
}
