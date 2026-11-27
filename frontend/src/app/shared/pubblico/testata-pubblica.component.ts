// =============================================================================
//  frontend/src/app/shared/pubblico/testata-pubblica.component.ts
//  TESTATA DEL SITO PUBBLICO — marchio, menu delle sezioni, "Unisciti",
//  "Area riservata" e pannello del menu su telefono.
//
//  Condivisa da home e pagine interne (dettaglio news ed eventi). Sulla home
//  [home]=true: i clic sul menu vengono passati alla pagina (output `vai`),
//  che scorre fino alla sezione. Altrove si torna alla home con l'ancora.
// =============================================================================

import { Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AnimatedLogoComponent } from '../animated-logo/animated-logo.component';
import { MENU } from '../../content/home-content';

@Component({
  selector: 'fidc-testata-pubblica',
  standalone: true,
  imports: [RouterLink, AnimatedLogoComponent],
  templateUrl: './testata-pubblica.component.html',
  styleUrl: './testata-pubblica.component.scss'
})
export class TestataPubblicaComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  /** True sulla home: le voci scorrono alla sezione invece di cambiare pagina. */
  @Input() home = false;
  /** Sezione della home attualmente in lettura (evidenziata nel menu). */
  @Input() attiva: string | null = null;
  /** Richiesta di scorrere a una sezione (solo con home = true). */
  @Output() vai = new EventEmitter<string>();

  readonly menu = MENU;
  readonly menuAperto = signal(false);
  readonly scorsa = signal(false);

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true }));
    this.onScroll();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener('scroll', this.onScroll);
    this.bloccaScorrimento(false);
  }

  /** Porta alla sezione indicata della home. */
  naviga(id: string, ev?: Event): void {
    ev?.preventDefault();
    this.apriMenu(false);
    if (this.home) this.vai.emit(id);
    else this.router.navigate(['/'], id === 'inizio' ? {} : { fragment: id });
  }

  /** Apre o chiude il menu su schermo stretto; il fuoco segue il pannello. */
  apriMenu(aperto: boolean): void {
    const prima = this.menuAperto();
    this.menuAperto.set(aperto);
    this.bloccaScorrimento(aperto);
    if (typeof document === 'undefined' || prima === aperto) return;
    setTimeout(() => document.querySelector<HTMLElement>(aperto ? '.drawer-chiudi' : '.burger')?.focus(), 60);
  }

  private readonly onScroll = () => {
    const s = window.scrollY > 12;
    if (s !== this.scorsa()) this.zone.run(() => this.scorsa.set(s));
  };

  private bloccaScorrimento(blocca: boolean): void {
    if (typeof document !== 'undefined') document.body.style.overflow = blocca ? 'hidden' : '';
  }
}
