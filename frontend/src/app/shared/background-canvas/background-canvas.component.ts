// =============================================================================
//  frontend/src/app/shared/background-canvas/background-canvas.component.ts
//  SCENA DI RETE — sfondo animato di tutto il sito (canvas 2D, niente librerie).
//
//  Cosa si vede, e perché:
//   - una GRIGLIA DI PRECISIONE con mirini agli incroci principali: il
//     linguaggio visivo della strumentazione, non della decorazione;
//   - NODI che derivano lentamente e si collegano quando sono vicini: una rete
//     di soggetti (imprese, enti, ricerca) che la Federazione mette in contatto;
//   - PACCHETTI che percorrono alcuni collegamenti: dati che viaggiano;
//   - colonne di TELEMETRIA binaria, quasi invisibili, sul bordo destro.
//
//  Sostituisce la scena Three.js: stesso ruolo, circa 4 KB invece di 700 KB.
//  Colori e intensità arrivano dal velo attivo (--canvas-*, --motion).
//  Si ferma a scheda nascosta; con prefers-reduced-motion disegna un fotogramma
//  fisso e non anima nulla.
// =============================================================================

import {
  AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, effect, inject
} from '@angular/core';
import { ThemeService } from '../theme/theme.service';

/** Un nodo della rete. */
interface Nodo { x: number; y: number; vx: number; vy: number; r: number; alt: boolean; }

/** Un pacchetto in viaggio fra due nodi (indici), con avanzamento 0..1. */
interface Pacchetto { a: number; b: number; t: number; v: number; }

/** Colori e parametri letti dai token del velo. */
interface Scena { bg: string; ink: string; ink2: string; alpha: number; motion: number; }

@Component({
  selector: 'fidc-background-canvas',
  standalone: true,
  template: `<canvas #cv aria-hidden="true"></canvas>`,
  styles: [`
    :host { position: fixed; inset: 0; z-index: -1; display: block; pointer-events: none; }
    canvas { width: 100%; height: 100%; display: block; }
  `]
})
export class BackgroundCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) private ref!: ElementRef<HTMLCanvasElement>;

  private readonly zone = inject(NgZone);
  private readonly theme = inject(ThemeService);

  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private nodi: Nodo[] = [];
  private pacchetti: Pacchetto[] = [];
  private colonne: { x: number; y: number; v: number; cifre: string }[] = [];
  private scena: Scena = { bg: '#333D6D', ink: '#FFCF95', ink2: '#FFF0D9', alpha: 1, motion: 1 };
  private raf = 0;
  private ultimo = 0;
  private fermo = false;
  private mouse = { x: -9999, y: -9999 };
  private osservatore?: MutationObserver;

  constructor() {
    // Il velo cambia (anche in anteprima dal Theme Builder): rileggiamo i token.
    effect(() => {
      this.theme.config();
      queueMicrotask(() => this.leggiScena());
    });
  }

  ngAfterViewInit(): void {
    const cv = this.ref.nativeElement;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.leggiScena();
    this.ridimensiona();

    // I token possono cambiare anche per stile inline (velo personalizzato).
    this.osservatore = new MutationObserver(() => this.leggiScena());
    this.osservatore.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResize, { passive: true });
      window.addEventListener('pointermove', this.onPointer, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      if (this.fermo) this.disegna(0);
      else this.raf = requestAnimationFrame(this.ciclo);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.osservatore?.disconnect();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  // --- eventi ----------------------------------------------------------------

  private readonly onResize = () => { this.ridimensiona(); if (this.fermo) this.disegna(0); };
  private readonly onPointer = (e: PointerEvent) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
  private readonly onVisibility = () => {
    cancelAnimationFrame(this.raf);
    if (!document.hidden && !this.fermo) { this.ultimo = 0; this.raf = requestAnimationFrame(this.ciclo); }
  };

  private readonly ciclo = (t: number) => {
    const dt = this.ultimo ? Math.min(48, t - this.ultimo) : 16;
    this.ultimo = t;
    this.aggiorna(dt);
    this.disegna(t);
    this.raf = requestAnimationFrame(this.ciclo);
  };

  // --- impostazione ----------------------------------------------------------

  /** Legge colori e intensità dai token CSS del velo attivo. */
  private leggiScena(): void {
    if (typeof document === 'undefined') return;
    const cs = getComputedStyle(document.documentElement);
    const v = (k: string, d: string) => cs.getPropertyValue(k).trim() || d;
    const motionPrima = this.scena.motion;
    this.scena = {
      bg: v('--canvas-bg', '#333D6D'),
      ink: v('--canvas-ink', '#FFCF95'),
      ink2: v('--canvas-ink-2', '#FFF0D9'),
      alpha: parseFloat(v('--canvas-alpha', '1')) || 1,
      motion: parseFloat(v('--motion', '1')) || 1
    };
    // Cambia la densità della rete: ricreiamo i nodi.
    if (this.ctx && motionPrima !== this.scena.motion) this.popola();
    if (this.ctx && this.fermo) this.disegna(0);
  }

  private ridimensiona(): void {
    const cv = this.ref.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    cv.width = Math.round(this.w * this.dpr);
    cv.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.popola();
  }

  /** Crea nodi, pacchetti e colonne in proporzione all'area e al velo. */
  private popola(): void {
    const m = this.scena.motion;
    const quanti = Math.round(Math.min(110, (this.w * this.h) / 19000) * (0.6 + m * 0.4));
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    this.nodi = Array.from({ length: quanti }, () => ({
      x: rnd(0, this.w), y: rnd(0, this.h),
      vx: rnd(-.012, .012), vy: rnd(-.012, .012),
      r: rnd(1, 2.4), alt: Math.random() < .3
    }));
    this.pacchetti = Array.from({ length: Math.round(6 * m) + 2 }, () => this.nuovoPacchetto());
    const nCol = this.w > 760 ? Math.round(3 * m) + 1 : 0;
    this.colonne = Array.from({ length: nCol }, (_, i) => ({
      x: this.w - 28 - i * 22, y: rnd(-this.h, 0), v: rnd(.012, .03),
      cifre: Array.from({ length: 28 }, () => (Math.random() < .5 ? '0' : '1')).join('')
    }));
  }

  private nuovoPacchetto(): Pacchetto {
    const n = this.nodi.length || 1;
    return { a: Math.floor(Math.random() * n), b: Math.floor(Math.random() * n), t: Math.random(), v: .00018 + Math.random() * .00025 };
  }

  // --- simulazione -----------------------------------------------------------

  private aggiorna(dt: number): void {
    const m = this.scena.motion;
    for (const n of this.nodi) {
      n.x += n.vx * dt * m;
      n.y += n.vy * dt * m;
      if (n.x < -20) n.x = this.w + 20; else if (n.x > this.w + 20) n.x = -20;
      if (n.y < -20) n.y = this.h + 20; else if (n.y > this.h + 20) n.y = -20;
    }
    for (const p of this.pacchetti) {
      p.t += p.v * dt * m;
      if (p.t >= 1) Object.assign(p, this.nuovoPacchetto(), { t: 0 });
    }
    for (const c of this.colonne) {
      c.y += c.v * dt * m;
      if (c.y > this.h) c.y = -c.cifre.length * 16;
    }
  }

  // --- disegno ---------------------------------------------------------------

  private disegna(t: number): void {
    const { ctx, w, h } = this;
    const s = this.scena;
    const A = s.alpha;

    ctx.globalAlpha = 1;
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, w, h);

    // Griglia di precisione: fine ogni 32px, marcata ogni 160px.
    ctx.lineWidth = 1;
    ctx.strokeStyle = s.ink2;
    ctx.globalAlpha = 0.035 * A;
    ctx.beginPath();
    for (let x = 0.5; x < w; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0.5; y < h; y += 32) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    ctx.globalAlpha = 0.07 * A;
    ctx.beginPath();
    for (let x = 0.5; x < w; x += 160) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0.5; y < h; y += 160) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Mirini agli incroci principali.
    ctx.strokeStyle = s.ink;
    ctx.globalAlpha = 0.22 * A;
    ctx.beginPath();
    for (let x = 160.5; x < w; x += 160) {
      for (let y = 160.5; y < h; y += 160) {
        ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
      }
    }
    ctx.stroke();

    // Collegamenti fra nodi vicini.
    const D = 150, D2 = D * D;
    const nodi = this.nodi;
    ctx.strokeStyle = s.ink;
    for (let i = 0; i < nodi.length; i++) {
      const a = nodi[i];
      for (let j = i + 1; j < nodi.length; j++) {
        const b = nodi[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > D2) continue;
        ctx.globalAlpha = (1 - d2 / D2) * 0.16 * A;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    // Nodi; quelli vicino al puntatore si accendono.
    for (const n of nodi) {
      const dx = n.x - this.mouse.x, dy = n.y - this.mouse.y;
      const vicino = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 180);
      ctx.globalAlpha = (0.38 + vicino * 0.6) * A;
      ctx.fillStyle = n.alt ? s.ink2 : s.ink;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + vicino * 1.6, 0, Math.PI * 2); ctx.fill();
    }

    // Pacchetti: si vedono solo se i due nodi sono abbastanza vicini da essere collegati.
    ctx.fillStyle = s.ink;
    for (const p of this.pacchetti) {
      const a = nodi[p.a], b = nodi[p.b];
      if (!a || !b) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy > D2 * 1.6) { p.t = 1; continue; }
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.globalAlpha = 0.9 * A;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }

    // Telemetria binaria, quasi impercettibile.
    if (this.colonne.length) {
      ctx.font = '11px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillStyle = s.ink2;
      for (const c of this.colonne) {
        for (let k = 0; k < c.cifre.length; k++) {
          const y = c.y + k * 16;
          if (y < -16 || y > h) continue;
          ctx.globalAlpha = (0.03 + 0.05 * (k / c.cifre.length)) * A;
          ctx.fillText(c.cifre[(k + Math.floor(t / 900)) % c.cifre.length], c.x, y);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
