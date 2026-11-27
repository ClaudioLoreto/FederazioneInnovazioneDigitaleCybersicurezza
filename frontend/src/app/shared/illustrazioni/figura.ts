// =============================================================================
//  frontend/src/app/shared/illustrazioni/figura.ts
//  IL MANICHINO — una sola anatomia per tutte le persone delle illustrazioni.
//
//  Perché un generatore e non disegni fatti a mano scena per scena: le persone
//  devono avere TUTTE le stesse proporzioni (testa ≈ 1/5,7 dell'altezza, spalle
//  spioventi, vita, arti rastremati). Disegnandole una per una ognuna verrebbe
//  diversa, e la famiglia di illustrazioni smetterebbe di sembrare tale.
//
//  Coordinate locali: (0,0) è la base del collo, y cresce verso il basso, la
//  persona guarda verso +x. `dir: -1` la specchia, `s` la scala.
//
//  Scelte di rappresentazione (da mantenere):
//   - nessun tratto del viso: figure istituzionali, non personaggi;
//   - un solo tono per la pelle, uguale per tutti (il pesca della palette):
//     la varietà la danno età, capelli, corporatura e abiti;
//   - braccia e gambe sono trapezi raccordati da cerchi: più larghi alla
//     spalla e all'anca, sottili a polso e caviglia, come un corpo vero.
// =============================================================================

/** Punto [x, y] nel sistema locale della figura. */
export type Punto = [number, number];

export type StileCapelli = 'corti' | 'rasati' | 'raccolti' | 'lunghi' | 'caschetto' | 'ricci';
export type ColoreAbito = 'a-blu' | 'a-crema' | 'a-pesca' | 'a-viola';
export type ColoreCamicia = 'c-blu' | 'c-crema' | 'c-viola';
export type ColoreCapelli = 'h-blu' | 'h-crema' | 'h-viola';

export interface OpzioniPersona {
  x: number;
  y: number;
  s?: number;
  dir?: 1 | -1;
  vista?: 'fronte' | 'tre-quarti' | 'spalle';
  /** null = solo busto (persone in primo piano, tagliate dal bordo). */
  posa?: 'in-piedi' | 'seduto' | 'passo' | null;
  capelli?: StileCapelli;
  colCapelli?: ColoreCapelli;
  abito?: ColoreAbito;
  camicia?: ColoreCamicia;
  pantaloni?: 'p-blu' | 'p-crema';
  scarpe?: 's-blu' | 's-crema';
  gonna?: 'g-blu' | 'g-crema';
  giacca?: boolean;
  badge?: boolean;
  barba?: boolean;
  occhiali?: boolean;
  /** Mezza larghezza delle spalle (corporatura). Predefinito 15. */
  spalle?: number;
  /** [gomito, mano] relativi alla spalla, per il braccio lontano (0) e vicino (1). */
  bracci?: [[Punto, Punto], [Punto, Punto]];
  testaInclinata?: number;
}

const f = (n: number) => n.toFixed(1);

/** Trapezi e giunti di un arto rastremato. */
function artoForme(pts: Punto[], w: number[], chiudi: boolean): string {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / L, ny = (x1 - x0) / L, a = w[i] / 2, b = w[i + 1] / 2;
    s += `<path d="M${f(x0 + nx * a)},${f(y0 + ny * a)} L${f(x1 + nx * b)},${f(y1 + ny * b)} ` +
      `L${f(x1 - nx * b)},${f(y1 - ny * b)} L${f(x0 - nx * a)},${f(y0 - ny * a)} Z"/>`;
  }
  pts.forEach((p, i) => {
    if (i < pts.length - 1 || chiudi) s += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(w[i] / 2)}"/>`;
  });
  return s;
}

/**
 * Arto in due passate con le stesse forme: la prima, dietro, ha un contorno
 * leggero e ne mostra solo il profilo esterno; la seconda copre le giunture.
 * Serve a staccare una manica chiara da un busto dello stesso colore.
 */
function arto(pts: Punto[], w: number[], cls: string, chiudi = false): string {
  const forme = artoForme(pts, w, chiudi);
  return `<g class="profilo ${cls}">${forme}</g><g class="${cls}">${forme}</g>`;
}

/** Capigliature: parte dietro (prima della testa) e davanti (sopra la testa). */
const CAPELLI: Record<StileCapelli, { dietro?: string; davanti?: string }> = {
  corti: { davanti: 'M-10.6,1.5 C-11.8,-8 -7,-14 0.5,-13.6 C7.5,-13.3 11.4,-9 10.8,-2.5 C8.6,-7.6 3.6,-9.4 -1.8,-8.6 C-5.4,-8 -7.6,-5.4 -8.1,-1.4 C-8.6,0.6 -9.6,1.8 -10.6,1.5 Z' },
  rasati: { davanti: 'M-10.3,-1 C-10.4,-9.6 -5.2,-12.9 0,-12.9 C5.2,-12.9 10.4,-9.6 10.3,-1 C8.6,-6.4 4.8,-8.4 0,-8.4 C-4.8,-8.4 -8.6,-6.4 -10.3,-1 Z' },
  raccolti: {
    dietro: 'M-8.6,-9.4 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 Z',
    davanti: 'M-10.5,0.5 C-11.2,-9 -6,-13.8 0.6,-13.5 C7.2,-13.2 11,-8.6 10.6,-2 C7.4,-8 2.4,-9.6 -2.8,-8.6 C-6.2,-8 -8.8,-5 -10.5,0.5 Z'
  },
  lunghi: {
    dietro: 'M-11.2,-2 C-12.4,-12.4 -5,-15 1,-14 C8.4,-12.8 12.4,-7 11.4,2 C11.4,8 12.4,13 14,17.5 C9.6,20 4,19 1.6,16 L-8,16 C-12.4,17 -14.4,13 -13,7 C-12,3.5 -11,0.5 -11.2,-2 Z',
    davanti: 'M-10.2,-0.5 C-10.4,-9 -4.6,-13.4 1.6,-12.8 C7.8,-12.2 11,-7.6 10.7,-1.2 C7.6,-7.4 2.4,-9.2 -2.6,-7.8 C-5.8,-6.9 -8.4,-4.2 -10.2,-0.5 Z'
  },
  caschetto: {
    dietro: 'M-11.6,-1 C-12.4,-12 -5,-14.8 1,-14 C8.2,-13 12.2,-7.6 11.6,0 L12,7 C8,8.6 5,7.6 4,5.4 L-9.6,6 C-12.6,6.8 -12.8,3 -11.6,-1 Z',
    davanti: 'M-10.4,1 C-10.6,-8.8 -4.6,-13.4 1.6,-12.9 C8,-12.4 11.2,-7.6 10.8,-0.6 C9.6,-5 6,-7.4 1.4,-7.6 C-3.4,-7.8 -7.6,-5 -10.4,1 Z'
  },
  ricci: {
    dietro: 'M-11.4,3 C-15,1 -15,-5 -11.6,-7 C-12.4,-12 -7.4,-16 -3,-14.4 C-0.6,-18 6.4,-17.6 8,-13.6 C12.6,-13.6 15,-8.4 12.6,-5 C15,-2.4 14.2,2 11.4,3 C11,-4 6.4,-8.4 0,-8.4 C-6.4,-8.4 -11,-4 -11.4,3 Z'
  }
};

/** Disegna una persona e restituisce il markup SVG. */
export function persona(o: OpzioniPersona): string {
  const dir = o.dir ?? 1, s = o.s ?? 1, vista = o.vista ?? 'tre-quarti';
  const posa = o.posa === undefined ? 'in-piedi' : o.posa;
  const sw = o.spalle ?? 15, ww = sw - 3.6, hw = sw - 2.4;
  const abito = o.abito ?? 'a-blu', pant = o.pantaloni ?? 'p-blu', scarpe = o.scarpe ?? 's-blu';
  const colCap = o.colCapelli ?? 'h-blu';
  const stileCap = CAPELLI[o.capelli ?? 'corti'];

  // --- bracci ---
  const attacchi: Punto[] = [[-(sw - 4.2), 8], [sw - 4.2, 8]];
  const bracci = o.bracci ?? [[[-4.4, 18.6], [-3.6, 36.4]], [[4.4, 18.6], [3.6, 36.4]]];
  const braccio = (i: 0 | 1) => {
    const sp = attacchi[i], [g, m] = bracci[i];
    const gomito: Punto = [sp[0] + g[0], sp[1] + g[1]], mano: Punto = [sp[0] + m[0], sp[1] + m[1]];
    return arto([sp, gomito, mano], [9.4, 7.6, 6.4], 'manica ' + abito) +
      `<ellipse class="pelle" cx="${f(mano[0])}" cy="${f(mano[1])}" rx="3.9" ry="4.4"/>`;
  };

  // --- gambe ---
  const anche: Punto[] = [[-hw + 5.4, 46], [hw - 5.4, 46]];
  const scarpa = (p: Punto) => `<path class="scarpa ${scarpe}" d="M${f(p[0] - 4.4)},${f(p[1] + 2.4)} C${f(p[0] - 4.8)},${f(p[1] - 3)} ${f(p[0] + 1)},${f(p[1] - 4.2)} ${f(p[0] + 4)},${f(p[1] - 2)} C${f(p[0] + 8)},${f(p[1] - 1.4)} ${f(p[0] + 10)},${f(p[1] + 0.4)} ${f(p[0] + 9.6)},${f(p[1] + 2.4)} Z"/>`;
  let gambe: string[] = [];
  let gambaVicina = '';
  if (posa === 'in-piedi' || posa === 'passo') {
    const p = posa === 'passo';
    const ginocchia: Punto[] = [[anche[0][0] - (p ? 4 : 0.6), 73], [anche[1][0] + (p ? 6 : 0.4), 73]];
    const piedi: Punto[] = [[anche[0][0] - (p ? 9 : 1), 99], [anche[1][0] + (p ? 11 : 0.6), 99]];
    gambe = [0, 1].map((i) => arto([anche[i], ginocchia[i], piedi[i]], [12, 9.4, 7.4], 'gamba ' + pant, true) +
      scarpa([piedi[i][0] - 1, piedi[i][1] + 1]));
  } else if (posa === 'seduto') {
    const ginocchia: Punto[] = [[anche[0][0] + 24, 49], [anche[1][0] + 22, 48]];
    const piedi: Punto[] = [[ginocchia[0][0] + 1, 75], [ginocchia[1][0] + 2, 75]];
    gambe = [0, 1].map((i) => arto([anche[i], ginocchia[i], piedi[i]], [12.4, 9.6, 7.4], 'gamba ' + pant, true) +
      scarpa([piedi[i][0] - 1, piedi[i][1] + 1]));
    gambaVicina = gambe[1];
    gambe = [gambe[0]];
  }
  let gonna = '';
  if (o.gonna) {
    gonna = posa === 'seduto'
      ? `<path class="${o.gonna}" d="M${-hw},38 L${hw},38 C${hw + 8},42 ${hw + 18},44 ${hw + 22},48 L${hw + 20},55 C${hw + 4},56 ${-hw + 6},56 ${-hw - 1},52 Z"/>`
      : `<path class="${o.gonna}" d="M${-hw + 0.6},38 L${hw - 0.6},38 L${hw + 4},70 C${hw},72 ${-hw},72 ${-hw - 4},70 Z"/>`;
  }

  // Busto: spalle spioventi, vita, fianchi.
  const busto = `<path class="busto ${abito}" d="M-6,1.4 C-10,1.8 ${f(-(sw - 1))},3 ${f(-sw)},8.6 ` +
    `C${f(-(sw + 0.6))},15 ${f(-(ww + 1.4))},24 ${f(-ww)},31 C${f(-(ww - 0.2))},37 ${f(-hw)},42 ${f(-hw)},46.4 ` +
    `C${f(-hw)},48.6 ${f(-(hw - 2))},49.8 ${f(-(hw - 4))},49.8 L${f(hw - 4)},49.8 C${f(hw - 2)},49.8 ${f(hw)},48.6 ${f(hw)},46.4 ` +
    `C${f(hw)},42 ${f(ww - 0.2)},37 ${f(ww)},31 C${f(ww + 1.4)},24 ${f(sw + 0.6)},15 ${f(sw)},8.6 C${f(sw - 1)},3 10,1.8 6,1.4 Z"/>`;

  const out: string[] = [`<g transform="translate(${o.x},${o.y}) scale(${dir * s},${s})">`];
  out.push(gambe.join(''));
  if (vista !== 'spalle') out.push(braccio(0));
  out.push(`<rect class="pelle" x="-3.8" y="-6" width="7.6" height="9" rx="3"/>`);
  out.push(busto, gonna);
  if (vista !== 'spalle') {
    const camicia = o.camicia ?? 'c-crema';
    if (o.giacca) {
      out.push(`<path class="${camicia}" d="M-6.4,1.6 L6.4,1.6 L3.6,30 L-3.6,30 Z"/>` +
        `<path class="risvolto ${abito}" d="M-6.4,1.4 L-1.4,16 L-4,30 L-7.6,30 L-8.6,6 Z M6.4,1.4 L1.4,16 L4,30 L7.6,30 L8.6,6 Z"/>`);
    } else {
      out.push(`<path class="${camicia}" d="M-6,1.6 L0,12 L6,1.6 Z"/>`);
    }
    out.push(`<path class="pelle" d="M-3.8,1.4 L0,6.6 L3.8,1.4 Z"/>`);
    if (o.badge) {
      out.push(`<path class="laccio" d="M-4.6,2 L-1.6,21 M4.6,2 L1.6,21"/>` +
        `<rect class="badge" x="-4" y="20" width="8" height="10.4" rx="1.6"/><rect class="badge-riga" x="-2.4" y="25.6" width="4.8" height="1.4"/>`);
    }
  }
  out.push(gambaVicina);

  // Testa, leggermente avanti nella vista di tre quarti.
  const hx = vista === 'tre-quarti' ? 1.6 : 0;
  out.push(`<g transform="translate(${hx},-16.5) rotate(${o.testaInclinata ?? 0})">`);
  if (stileCap.dietro && vista !== 'spalle') out.push(`<path class="capelli ${colCap}" d="${stileCap.dietro}"/>`);
  out.push(`<ellipse class="pelle" cx="0" cy="0" rx="9.8" ry="11.4"/>`);
  if (vista === 'tre-quarti') out.push(`<ellipse class="pelle" cx="-8.4" cy="1.6" rx="2.3" ry="3.1"/>`);
  if (vista === 'spalle') {
    out.push(`<path class="capelli ${colCap}" d="M-10.4,4 C-11.6,-9 -5.6,-13.6 0,-13.6 C5.6,-13.6 11.6,-9 10.4,4 C7,7.6 -7,7.6 -10.4,4 Z"/>`);
  } else {
    if (stileCap.davanti) out.push(`<path class="capelli ${colCap}" d="${stileCap.davanti}"/>`);
    if (o.barba) out.push(`<path class="capelli ${colCap}" d="M-8.8,1.6 C-8,8.8 -3.4,11.8 0.8,11.8 C4.8,11.8 8.8,8.8 9.6,1.6 C7.4,5 4,6.2 0.8,6.2 C-3,6.2 -6.6,5 -8.8,1.6 Z"/>`);
    if (o.occhiali) out.push(`<path class="occhiali" d="M0.4,-0.2 h4.8 v3.4 h-4.8 z M6.8,-0.2 h2.4 v3.4 h-2.4 M5.2,1.2 h1.6 M0.4,0.6 L-7,-0.4"/>`);
  }
  out.push('</g>');
  out.push(braccio(1));
  if (vista === 'spalle') out.push(braccio(0));
  out.push('</g>');
  return out.join('');
}
