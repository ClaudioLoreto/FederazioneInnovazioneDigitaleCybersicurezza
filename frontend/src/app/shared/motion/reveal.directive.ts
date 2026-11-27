// =============================================================================
//  frontend/src/app/shared/motion/reveal.directive.ts
//  Movimento legato alla comparsa nella finestra.
//
//  fidcReveal   → l'elemento entra (dissolvenza + leggero sollevamento) solo
//                 quando diventa visibile. Accetta un ritardo in ms, utile per
//                 sfalsare gli elementi di una stessa griglia.
//  fidcConteggio → un numero che conta da 0 al valore finale quando appare.
//                 Il testo finale è nel DOM fin dall'inizio: chi usa un lettore
//                 di schermo e chi ha ridotto i movimenti legge subito il valore.
//
//  Entrambi si spengono con prefers-reduced-motion e senza IntersectionObserver.
// =============================================================================

import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';

/** Vero se l'utente ha chiesto al sistema di ridurre i movimenti. */
function movimentoRidotto(): boolean {
  return typeof window === 'undefined'
    || !('IntersectionObserver' in window)
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

@Directive({ selector: '[fidcReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private obs?: IntersectionObserver;

  /** Ritardo di ingresso in millisecondi. */
  @Input() fidcReveal: number | string = 0;

  ngOnInit(): void {
    if (movimentoRidotto()) return;
    const node = this.el.nativeElement as HTMLElement;
    node.style.setProperty('--reveal-delay', `${Number(this.fidcReveal) || 0}ms`);
    node.classList.add('reveal-armed');
    this.obs = new IntersectionObserver((voci) => {
      for (const v of voci) {
        if (!v.isIntersecting) continue;
        node.classList.add('is-visible');
        this.obs?.disconnect();
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    this.obs.observe(node);
  }

  ngOnDestroy(): void { this.obs?.disconnect(); }
}

@Directive({ selector: '[fidcConteggio]', standalone: true })
export class ConteggioDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private obs?: IntersectionObserver;
  private raf = 0;

  /** Valore da mostrare, anche con prefisso/suffisso (es. "+250", "40+"). */
  @Input({ required: true }) fidcConteggio = '';

  ngOnInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    node.textContent = this.fidcConteggio;
    const m = /^(\D*)(\d[\d.]*)(\D*)$/.exec(this.fidcConteggio);
    if (!m || movimentoRidotto()) return;
    const [, pre, num, post] = m;
    const fine = parseInt(num.replace(/\./g, ''), 10);
    node.setAttribute('aria-label', this.fidcConteggio);

    this.obs = new IntersectionObserver((voci) => {
      if (!voci.some((v) => v.isIntersecting)) return;
      this.obs?.disconnect();
      this.zone.runOutsideAngular(() => {
        const t0 = performance.now(), durata = 1400;
        const passo = (t: number) => {
          const p = Math.min(1, (t - t0) / durata);
          const e = 1 - Math.pow(1 - p, 3); // rallenta verso la fine
          node.textContent = `${pre}${Math.round(fine * e).toLocaleString('it-IT')}${post}`;
          if (p < 1) this.raf = requestAnimationFrame(passo);
        };
        this.raf = requestAnimationFrame(passo);
      });
    }, { threshold: 0.4 });
    this.obs.observe(node);
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
    cancelAnimationFrame(this.raf);
  }
}
