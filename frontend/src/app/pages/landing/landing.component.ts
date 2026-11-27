// =============================================================================
//  frontend/src/app/pages/landing/landing.component.ts
//  HOME PUBBLICA — unica fonte di struttura e contenuto (architettura "Veil").
//
//  Il contenuto arriva da home-content.ts (testi istituzionali) e dall'API
//  (eventi, news). L'aspetto cambia col velo attivo: colori nei token, geometria
//  nelle regole :host-context([data-theme]) di landing.component.scss.
//
//  Movimento, in ordine di importanza:
//   1. lo slogan si "decritta" al caricamento — l'unico momento orchestrato;
//   2. la cassaforte (o l'emblema scelto) gira nell'hero;
//   3. le sezioni entrano quando arrivano nella finestra (fidcReveal);
//   4. tutto il resto risponde a un'azione: aprire un pilastro, il menu,
//      iscriversi alla newsletter.
// =============================================================================

import {
  AfterViewInit, Component, ElementRef, Injector, NgZone, OnDestroy, OnInit, ViewChild,
  afterNextRender, computed, effect, inject, signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EmblemaTemaComponent } from '../../shared/emblemi/emblema-tema.component';
import { IllustrazioneComponent, ScenaIllustrazione } from '../../shared/illustrazioni/illustrazione.component';
import { EmblemaComponent } from '../../shared/emblema/emblema.component';
import { TestataPubblicaComponent } from '../../shared/pubblico/testata-pubblica.component';
import { PiedePubblicoComponent } from '../../shared/pubblico/piede-pubblico.component';
import { RevealDirective, ConteggioDirective } from '../../shared/motion/reveal.directive';
import { etichettaPilastro } from '../../shared/opzioni';
import { ChiavePilastro } from '../../content/home-content';
import { Evento, FidcApiService } from '../../services/fidc-api.service';
import { ContenutiService } from '../../services/contenuti.service';
import { VetrinaService, etichettaImminenza, imminente } from '../../services/vetrina.service';

/**
 * Caratteri usati durante la "decrittazione" dello slogan. Minuscole e cifre
 * strette: hanno circa la larghezza delle lettere vere, così la riga non si
 * allarga mentre si rivela.
 */
const GLIFI = 'acegnorsuvxz0123456789';

/** Sezioni osservate per evidenziare la voce di menu corrente. */
const SEZIONI = ['associazione', 'progetti', 'eventi', 'news', 'contatti'];

@Component({
  selector: 'fidc-landing',
  standalone: true,
  imports: [
    DatePipe, FormsModule, RouterLink,
    EmblemaTemaComponent, IllustrazioneComponent, EmblemaComponent,
    TestataPubblicaComponent, PiedePubblicoComponent,
    RevealDirective, ConteggioDirective
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(FidcApiService);
  private readonly zone = inject(NgZone);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);

  @ViewChild('slogan', { static: true }) private sloganRef!: ElementRef<HTMLElement>;
  @ViewChild('orologio', { static: true }) private orologioRef!: ElementRef<HTMLElement>;

  // --- contenuto ---------------------------------------------------------------
  private readonly servizioContenuti = inject(ContenutiService);
  private readonly vetrina = inject(VetrinaService);

  /** Contenuti da mostrare: quelli pubblicati, o la bozza in anteprima. */
  readonly c = this.servizioContenuti.attuali;
  readonly hero = computed(() => this.c().apertura);
  readonly inAnteprima = computed(() => this.servizioContenuti.anteprima() !== null);

  /** Quali sezioni hanno contenuti. */
  readonly sezioni = this.vetrina.sezioni;

  /** Dove porta il collegamento in fondo a ogni pilastro aperto (solo verso sezioni presenti). */
  readonly collegamenti: Record<ChiavePilastro, { ancora: string; label: string }> = {
    attivita: { ancora: 'progetti', label: 'Guarda i progetti in corso' },
    eventi: { ancora: 'eventi', label: 'Vedi il calendario degli eventi' },
    formazione: { ancora: 'eventi', label: 'Scopri i prossimi corsi' },
    ricerca: { ancora: 'news', label: 'Leggi le ultime ricerche' }
  };

  /**
   * Lo slogan diviso nelle sue frasi: su schermo largo stanno su una riga,
   * su schermo medio una frase per riga, su telefono vanno a capo liberamente.
   */
  readonly righeSlogan = computed(() => this.hero().slogan.map((r) => r.trim()).filter(Boolean));
  readonly sloganIntero = computed(() => this.righeSlogan().join(' '));

  /** Tacche della ghiera strumentale attorno all'emblema (ogni 10°). */
  readonly tacche = Array.from({ length: 36 }, (_, i) => i * 10);

  // --- stato -------------------------------------------------------------------
  readonly sezioneAttiva = signal<string | null>(null);
  readonly pilastroAperto = signal<string | null>(null);

  /** Fino a quattro prossimi eventi e quattro news (quella in evidenza per prima). */
  readonly eventi = computed(() => this.vetrina.prossimi().slice(0, 4));
  readonly news = computed(() => this.vetrina.ultime().slice(0, 4));
  readonly caricamento = computed(() => this.vetrina.eventi() === null || this.vetrina.news() === null);

  /**
   * Fascia sotto l'apertura: annuncio attivo e non scaduto, altrimenti un
   * evento entro una settimana, altrimenti l'ultima news. Nulla se non c'è niente.
   */
  readonly fascia = computed(() => {
    const a = this.c().annuncio;
    const oggi = new Date().toISOString().slice(0, 10);
    if (a.attivo && a.testo.trim() && (!a.scadenza || a.scadenza >= oggi)) {
      const link = a.collegamento.trim();
      const esterno = /^https?:\/\//.test(link);
      return { tipo: 'annuncio', etichetta: 'Annuncio', titolo: a.testo.trim(), quando: '',
               link, interno: !esterno, azione: link ? (a.etichettaCollegamento || 'Leggi') : '' };
    }
    const e = this.eventi()[0];
    if (e && imminente(e)) {
      return { tipo: 'evento', etichetta: 'Prossimo evento', titolo: e.titolo, quando: etichettaImminenza(e.dataInizio) ?? '',
               link: '/eventi/' + e.id, interno: true, azione: 'Iscriviti' };
    }
    const n = this.news()[0];
    if (n) {
      const quando = n.dataPubblicazione ? new Date(n.dataPubblicazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '';
      return { tipo: 'news', etichetta: 'Ultima notizia', titolo: n.titolo, quando, link: '/news/' + n.id, interno: true, azione: 'Leggi' };
    }
    return null;
  });

  /**
   * Tono delle sezioni facoltative: alternato fra quelle presenti, a partire
   * dallo scuro, così due fasce dello stesso colore non si toccano mai.
   */
  tono(id: 'progetti' | 'eventi' | 'news'): string {
    const s = this.sezioni();
    const caricando = this.caricamento();
    const presenti = (['progetti', 'eventi', 'news'] as const)
      .filter((x) => x === 'progetti' ? s.progetti : caricando || s[x]);
    return presenti.indexOf(id) % 2 === 0 ? 'tone-dark' : 'tone-light precision-grid';
  }

  /** Etichetta "Oggi / Domani / Tra N giorni" per gli eventi entro due settimane. */
  imminenza(e: Evento): string | null { return etichettaImminenza(e.dataInizio); }
  /** Il primo evento diventa una scheda in evidenza se comincia entro una settimana o è stato scelto. */
  evidenzia(e: Evento): boolean { return imminente(e) || this.c().evidenza.eventoId === e.id; }

  nlEmail = '';
  readonly nlStato = signal<'idle' | 'invio' | 'ok' | 'errore'>('idle');
  readonly nlErrore = signal('');
  readonly nlEmailInviata = signal('');

  private spia?: IntersectionObserver;
  private timerOra?: ReturnType<typeof setInterval>;
  private rafSlogan = 0;

  ngOnInit(): void {
    this.vetrina.carica();
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    const riduci = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.zone.runOutsideAngular(() => {
      if (!riduci) this.decrittaSlogan();
      // Orologio della barra di stato (visibile solo nel velo 2). Scrive nel DOM
      // direttamente: aggiornare lo stato di Angular ogni secondo ridisegnerebbe
      // tutta la pagina per cambiare sei cifre.
      const tic = () => { this.orologioRef.nativeElement.textContent = this.oraRoma(); };
      tic();
      this.timerOra = setInterval(tic, 1000);
    });

    // Evidenzia nel menu la sezione che si sta leggendo.
    this.spia = new IntersectionObserver((voci) => {
      const visibile = voci.filter((v) => v.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visibile) this.sezioneAttiva.set(visibile.target.id);
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, .25, .5] });
    // Le sezioni facoltative compaiono quando arrivano i dati: a ogni cambio si
    // ricomincia a osservare quelle presenti, dopo che sono state disegnate.
    effect(() => {
      this.sezioni(); this.caricamento();
      afterNextRender(() => {
        this.spia?.disconnect();
        for (const id of SEZIONI) {
          const el = document.getElementById(id);
          if (el) this.spia?.observe(el);
        }
      }, { injector: this.injector });
    }, { injector: this.injector });

    // Arrivando da una pagina interna con un'ancora (/#eventi), si scorre lì.
    // Il ritardo lascia ai contenuti dell'API il tempo di occupare il loro spazio.
    const frammento = this.route.snapshot.fragment;
    if (frammento) setTimeout(() => this.vaiA(frammento), 350);
  }

  ngOnDestroy(): void {
    this.spia?.disconnect();
    clearInterval(this.timerOra);
    cancelAnimationFrame(this.rafSlogan);
  }

  // --- navigazione ---------------------------------------------------------------

  /**
   * Scorre fino alla sezione indicata. Se è un pilastro lo apre, così chi clicca
   * "Formazione" nel menu trova subito il testo che cercava.
   */
  vaiA(id: string, ev?: Event): void {
    ev?.preventDefault();
    if (id.startsWith('pilastro-')) this.pilastroAperto.set(id.replace('pilastro-', ''));
    const el = document.getElementById(id);
    if (!el) return;
    const riduci = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: riduci ? 'auto' : 'smooth', block: id.startsWith('pilastro-') ? 'center' : 'start' });
    history.replaceState(null, '', id === 'inizio' ? location.pathname : `#${id}`);
  }

  togglePilastro(chiave: string): void {
    this.pilastroAperto.set(this.pilastroAperto() === chiave ? null : chiave);
  }

  // --- supporto per il template -------------------------------------------------

  etichetta(valore: string): string { return etichettaPilastro(valore); }

  /** Illustrazione coerente con il pilastro di una news. */
  scenaPer(pilastro: string): ScenaIllustrazione {
    const scene: Record<string, ScenaIllustrazione> = {
      Attivita: 'gruppo-di-lavoro', Eventi: 'conferenza', Formazione: 'formazione', Ricerca: 'analisi'
    };
    return scene[pilastro] ?? 'analisi';
  }

  // --- newsletter ---------------------------------------------------------------

  /**
   * Il bottone resta attivo anche a modulo vuoto: un bottone spento non dice
   * cosa manca. Al clic, se l'indirizzo non va, lo diciamo in chiaro.
   */
  iscriviNewsletter(nonValido: boolean | null = false): void {
    const email = this.nlEmail.trim();
    if (this.nlStato() === 'invio') return;
    if (!email || nonValido) {
      this.nlErrore.set(email ? 'L\'indirizzo non sembra valido: controlla la chiocciola e il dominio.' : 'Scrivi il tuo indirizzo email per iscriverti.');
      this.nlStato.set('errore');
      return;
    }
    this.nlStato.set('invio');
    this.api.iscriviNewsletter(email).subscribe({
      next: () => {
        this.nlEmailInviata.set(email);
        this.nlStato.set('ok');
        this.nlEmail = '';
      },
      error: (err: unknown) => {
        const http = err instanceof HttpErrorResponse ? err : null;
        this.nlErrore.set(
          http?.status === 0
            ? 'Il servizio di iscrizione non risponde. Riprova tra qualche minuto.'
            : http?.status === 409
              ? 'Questo indirizzo è già iscritto alla newsletter.'
              : (http?.error?.messaggio ?? 'Iscrizione non riuscita. Controlla l\'indirizzo e riprova.')
        );
        this.nlStato.set('errore');
      }
    });
  }

  // --- privati ------------------------------------------------------------------

  /**
   * Lo slogan parte cifrato e si rivela da sinistra a destra in circa 1,2 s.
   * Il testo vero è sempre nell'aria-label dell'h1: i lettori di schermo non
   * sentono mai i caratteri casuali.
   */
  private decrittaSlogan(): void {
    const el = this.sloganRef.nativeElement;
    const righe = Array.from(el.querySelectorAll<HTMLElement>('.riga'));
    const finali = righe.map((r) => r.textContent ?? '');
    const totale = finali.reduce((n, f) => n + f.length, 0);
    const t0 = performance.now();
    const durata = 1250;
    el.classList.add('in-decrittazione');

    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / durata);
      let rivelati = Math.floor(totale * p);
      righe.forEach((riga, k) => {
        const f = finali[k];
        const qui = Math.max(0, Math.min(f.length, rivelati));
        rivelati -= f.length;
        let out = f.slice(0, qui);
        for (let i = qui; i < f.length; i++) {
          const c = f[i];
          out += c === ' ' || c === '.' || c === ',' ? c : GLIFI[(Math.random() * GLIFI.length) | 0];
        }
        riga.textContent = out;
      });
      if (p < 1) this.rafSlogan = requestAnimationFrame(passo);
      else {
        righe.forEach((r, k) => (r.textContent = finali[k]));
        el.classList.remove('in-decrittazione');
      }
    };
    this.rafSlogan = requestAnimationFrame(passo);
  }

  private oraRoma(): string {
    return new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
