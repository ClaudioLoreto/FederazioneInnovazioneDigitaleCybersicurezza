// =============================================================================
//  frontend/src/app/shared/background-canvas/background-canvas.component.ts
//  SCENA WEBGL GLOBALE (Three.js) — cuore visivo di TUTTO il sito.
//  Montata in app.component: position:fixed; z-index:-1; fullscreen.
//  Tunnel neurale wireframe: sfondo Deep Blue, nodi/linee Purple + Peach.
//  Reagisce al mouse (tilt camera). Si ferma con prefers-reduced-motion.
// =============================================================================

import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import type { WebGLRenderer, Scene, PerspectiveCamera, Points, LineSegments, Material } from 'three';

/** Palette FIDC congelata in hex numerico (unica fonte: gli stessi 4 colori). */
const C_DEEP = 0x333d6d;
const C_PURPLE = 0x723ec3;
const C_PEACH = 0xffcf95;

/**
 * Ambiente cyber-spaziale persistente: resti visibile sotto landing, login,
 * dashboard, CMS e Area Documenti. pointer-events:none → la UI resta cliccabile.
 */
@Component({
  selector: 'fidc-background-canvas',
  standalone: true,
  template: `<canvas #gl class="gl" aria-hidden="true"></canvas>`,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: -1;
      display: block;
      pointer-events: none;
    }
    .gl { width: 100%; height: 100%; display: block; }
  `]
})
export class BackgroundCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gl', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera?: PerspectiveCamera;
  private points?: Points;
  private lines?: LineSegments;
  private core?: LineSegments;
  private raf = 0;
  private disposed = false;
  private reduceMotion = false;
  private pointer = { x: 0, y: 0 };
  private camTarget = { x: 0, y: 0 };
  private tunnelZ = 0;

  private readonly onResize = () => this.resize();
  private readonly onPointer = (e: PointerEvent) => this.trackPointer(e);
  private readonly onHudMove = (e: MouseEvent) => this.lightHud(e);

  constructor(private readonly zone: NgZone) {}

  /** Avvia WebGL dopo il primo paint (dynamic import → chunk Three.js separato). */
  async ngAfterViewInit(): Promise<void> {
    this.reduceMotion =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    const THREE = await import('three');
    if (this.disposed) return;
    this.boot(THREE);
  }

  ngOnDestroy(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('mousemove', this.onHudMove);
    this.points?.geometry.dispose();
    (this.points?.material as Material | undefined)?.dispose();
    this.lines?.geometry.dispose();
    (this.lines?.material as Material | undefined)?.dispose();
    this.core?.geometry.dispose();
    (this.core?.material as Material | undefined)?.dispose();
    this.renderer?.dispose();
  }

  // ---- scena ----------------------------------------------------------------

  private boot(THREE: typeof import('three')): void {
    const canvas = this.canvasRef.nativeElement;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(C_DEEP, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C_DEEP);
    scene.fog = new THREE.FogExp2(C_DEEP, 0.042);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 220);
    camera.position.set(0, 0, 0);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.buildTunnel(THREE, scene);
    this.buildCore(THREE, scene);
    this.resize();

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('mousemove', this.onHudMove, { passive: true });

    // Il loop sta FUORI da Zone.js: niente change detection a 60fps.
    this.zone.runOutsideAngular(() => {
      if (this.reduceMotion) {
        renderer.render(scene, camera);
        return;
      }
      const tick = () => {
        if (this.disposed) return;
        this.raf = requestAnimationFrame(tick);
        this.step();
        renderer.render(scene, camera);
      };
      tick();
    });
  }

  /**
   * Tunnel di dati: anelli di nodi + wireframe (collegamenti anello/asse)
   * e shortcut neurali. Colori rigorosamente purple/peach.
   */
  private buildTunnel(THREE: typeof import('three'), scene: Scene): void {
    const rings = 56;
    const perRing = 22;
    const spacing = 4.6;
    const radius = 9.2;
    const count = rings * perRing;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const purple = new THREE.Color(C_PURPLE);
    const peach = new THREE.Color(C_PEACH);

    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < perRing; j++) {
        const idx = i * perRing + j;
        const a = (j / perRing) * Math.PI * 2;
        const r = radius + Math.sin(i * 0.35 + j) * 0.55;
        positions[idx * 3] = Math.cos(a) * r;
        positions[idx * 3 + 1] = Math.sin(a) * r;
        positions[idx * 3 + 2] = i * spacing;
        const c = (i + j) % 3 === 0 ? peach : purple;
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.points = new THREE.Points(pGeo, pMat);
    scene.add(this.points);

    // Collegamenti: anello, asse del tunnel, alcuni archi neurali.
    const segs: number[] = [];
    const push = (a: number, b: number) => {
      segs.push(
        positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2],
        positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]
      );
    };
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < perRing; j++) {
        const a = i * perRing + j;
        push(a, i * perRing + ((j + 1) % perRing));
        if (i < rings - 1) push(a, (i + 1) * perRing + j);
        if (i < rings - 2 && j % 5 === 0) push(a, (i + 2) * perRing + ((j + 4) % perRing));
      }
    }

    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    const lMat = new THREE.LineBasicMaterial({
      color: C_PURPLE,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lines = new THREE.LineSegments(lGeo, lMat);
    scene.add(this.lines);
  }

  /** Nucleo wireframe (icosaedro) in fondo al tunnel: “cervello” della rete. */
  private buildCore(THREE: typeof import('three'), scene: Scene): void {
    const geo = new THREE.IcosahedronGeometry(2.4, 1);
    const wire = new THREE.WireframeGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: C_PEACH,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.LineSegments(wire, mat);
    mesh.position.z = 18;
    this.core = mesh;
    scene.add(mesh);
    geo.dispose();
  }

  private step(): void {
    this.tunnelZ += 0.085;
    const depth = 56 * 4.6;
    if (this.tunnelZ > depth - 28) this.tunnelZ = 0;

    this.camTarget.x += (this.pointer.y * 0.18 - this.camTarget.x) * 0.045;
    this.camTarget.y += (this.pointer.x * 0.22 - this.camTarget.y) * 0.045;

    if (this.camera) {
      this.camera.position.z = this.tunnelZ;
      this.camera.rotation.x = this.camTarget.x;
      this.camera.rotation.y = this.camTarget.y;
    }
    if (this.core) {
      this.core.rotation.x += 0.004;
      this.core.rotation.y += 0.007;
      this.core.position.z = this.tunnelZ + 22;
    }
  }

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  /** Parallax camera: pointer normalizzato -1…1. */
  private trackPointer(e: PointerEvent): void {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }

  /**
   * Accende il bordo neon delle superfici HUD: scrive --spot-x/--spot-y
   * sull'elemento .glass-card / .hud-panel sotto il cursore.
   */
  private lightHud(e: MouseEvent): void {
    const t = e.target as HTMLElement | null;
    const panel = t?.closest('.glass-card, .hud-panel, .editor, .table-wrap, .panel') as HTMLElement | null;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    panel.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    panel.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  }
}
