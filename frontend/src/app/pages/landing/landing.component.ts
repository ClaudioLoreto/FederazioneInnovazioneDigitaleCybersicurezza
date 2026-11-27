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
  AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AnimatedLogoComponent } from '../../shared/animated-logo/animated-logo.component';
import { CyberShieldComponent } from '../../shared/svg-motifs/svg-motifs.component';
import { IllustrazioneComponent, ScenaIllustrazione } from '../../shared/illustrazioni/illustrazione.component';
import { EmblemaComponent } from '../../shared/emblema/emblema.component';
import { RevealDirective, ConteggioDirective } from '../../shared/motion/reveal.directive';
import { etichettaPilastro } from '../../shared/opzioni';
import {
  BRAND, CHI_SIAMO, CONTATTI, GOVERNANCE, HERO, MENU, MISSIONE, NEWSLETTER, PILASTRI, PROGETTI,
  Pilastro as PilastroHome, eventiDiRiserva, newsDiRiserva
} from '../../content/home-content';
import { Evento, FidcApiService, News } from '../../services/fidc-api.service';

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
    AnimatedLogoComponent, CyberShieldComponent, IllustrazioneComponent, EmblemaComponent,
    RevealDirective, ConteggioDirective
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(FidcApiService);
  private readonly zone = inject(NgZone);

  @ViewChild('slogan', { static: true }) private sloganRef!: ElementRef<HTMLElement>;
  @ViewChild('testata', { static: true }) private testataRef!: ElementRef<HTMLElement>;
  @ViewChild('orologio', { static: true }) private orologioRef!: ElementRef<HTMLElement>;

  // --- contenuto ---------------------------------------------------------------
  readonly brand = BRAND;
  readonly hero = HERO;
  readonly menu = MENU;
  readonly pilastri = PILASTRI;
  readonly chiSiamo = CHI_SIAMO;
  readonly missione = MISSIONE;
  readonly governance = GOVERNANCE;
  readonly progetti = PROGETTI;
  readonly nl = NEWSLETTER;
  readonly contatti = CONTATTI;
  readonly anno = new Date().getFullYear();

  /** Dove porta il collegamento in fondo a ogni pilastro aperto. */
  readonly collegamenti: Record<PilastroHome['chiave'], { ancora: string; label: string }> = {
    attivita: { ancora: 'progetti', label: 'Guarda i progetti in corso' },
    eventi: { ancora: 'eventi', label: 'Vedi il calendario degli eventi' },
    formazione: { ancora: 'eventi', label: 'Scopri i prossimi corsi' },
    ricerca: { ancora: 'news', label: 'Leggi le ultime ricerche' }
  };

  /**
   * Lo slogan diviso nelle sue frasi: su schermo largo stanno su una riga,
   * su schermo medio una frase per riga, su telefono vanno a capo liberamente.
   */
  readonly righeSlogan = HERO.titolo.split(/(?<=\.)\s+/);

  /** Tacche della ghiera strumentale attorno all'emblema (ogni 10°). */
  readonly tacche = Array.from({ length: 36 }, (_, i) => i * 10);

  // --- stato -------------------------------------------------------------------
  readonly menuAperto = signal(false);
  readonly sezioneAttiva = signal<string | null>(null);
  readonly pilastroAperto = signal<string | null>(null);

  readonly eventi = signal<Evento[]>([]);
  readonly news = signal<News[]>([]);
  readonly caricamento = signal(true);

  nlEmail = '';
  readonly nlStato = signal<'idle' | 'invio' | 'ok' | 'errore'>('idle');
  readonly nlErrore = signal('');
  readonly nlEmailInviata = signal('');

  private spia?: IntersectionObserver;
  private timerOra?: ReturnType<typeof setInterval>;
  private rafSlogan = 0;
  private attese = 2;

  ngOnInit(): void {
    // Eventi: solo i prossimi, dal più vicino. Se l'API non risponde o non ha
    // nulla in programma, si mostrano quelli di riserva (stessi del seeder).
    this.api.getEventi().subscribe({
      next: (lista) => {
        const ora = Date.now();
        const prossimi = lista
          .filter((e) => e.pubblicato !== false && new Date(e.dataInizio).getTime() >= ora)
          .sort((a, b) => +new Date(a.dataInizio) - +new Date(b.dataInizio))
          .slice(0, 4);
        this.eventi.set(prossimi.length ? prossimi : eventiDiRiserva());
        this.fineCaricamento();
      },
      error: () => { this.eventi.set(eventiDiRiserva()); this.fineCaricamento(); }
    });

    this.api.getNews().subscribe({
      next: (lista) => {
        const ordinate = [...lista]
          .sort((a, b) => +new Date(b.dataPubblicazione ?? 0) - +new Date(a.dataPubblicazione ?? 0))
          .slice(0, 4);
        this.news.set(ordinate.length ? ordinate : newsDiRiserva());
        this.fineCaricamento();
      },
      error: () => { this.news.set(newsDiRiserva()); this.fineCaricamento(); }
    });
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    const riduci = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.zone.runOutsideAngular(() => {
      // La testata diventa più densa appena si scorre.
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.onScroll();
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
    for (const id of SEZIONI) {
      const el = document.getElementById(id);
      if (el) this.spia.observe(el);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener('scroll', this.onScroll);
    this.spia?.disconnect();
    clearInterval(this.timerOra);
    cancelAnimationFrame(this.rafSlogan);
    this.bloccaScorrimento(false);
  }

  // --- navigazione ---------------------------------------------------------------

  /**
   * Scorre fino alla sezione indicata. Se è un pilastro lo apre, così chi clicca
   * "Formazione" nel menu trova subito il testo che cercava.
   */
  vaiA(id: string, ev?: Event): void {
    ev?.preventDefault();
    this.apriMenu(false);
    if (id.startsWith('pilastro-')) this.pilastroAperto.set(id.replace('pilastro-', ''));
    const el = document.getElementById(id);
    if (!el) return;
    const riduci = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: riduci ? 'auto' : 'smooth', block: id.startsWith('pilastro-') ? 'center' : 'start' });
    history.replaceState(null, '', id === 'inizio' ? location.pathname : `#${id}`);
  }

  /** Apre o chiude il menu su schermo stretto. */
  apriMenu(aperto: boolean): void {
    const prima = this.menuAperto();
    this.menuAperto.set(aperto);
    this.bloccaScorrimento(aperto);
    if (typeof document === 'undefined' || prima === aperto) return;
    // Il fuoco segue il menu: dentro quando si apre, sul pulsante quando si chiude.
    setTimeout(() => document.querySelector<HTMLElement>(aperto ? '.drawer-chiudi' : '.burger')?.focus(), 60);
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

  soloCifre(numero: string): string { return numero.replace(/[^\d+]/g, '').replace(/^\+/, ''); }

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

  private fineCaricamento(): void {
    if (--this.attese <= 0) this.caricamento.set(false);
  }

  private readonly onScroll = () => {
    this.testataRef.nativeElement.classList.toggle('scorsa', window.scrollY > 12);
  };

  private bloccaScorrimento(blocca: boolean): void {
    if (typeof document !== 'undefined') document.body.style.overflow = blocca ? 'hidden' : '';
  }

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
