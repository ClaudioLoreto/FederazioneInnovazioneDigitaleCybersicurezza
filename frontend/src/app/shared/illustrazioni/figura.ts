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
//     spalla e all'anca, sottili a polso e caviglia, come un corpo vero;
//   - il dettaglio sta negli abiti, non nel viso: colletti, cravatte,
//     polsini, bottoni, tasche, cinture, pieghe dei pantaloni, suole,
//     ciocche, ombra sotto il mento e un lato del busto in ombra. Sono
//     tratti sottili nel tono dell'abito (segno-chiaro sui capi scuri,
//     segno-scuro su quelli chiari): si vedono da vicino e non sporcano
//     la sagoma da lontano.
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
  /** Cravatta (solo con la giacca): colore della cravatta. */
  cravatta?: ColoreCamicia;
  /** Orologio al polso del braccio vicino. */
  orologio?: boolean;
  /** Orecchini (vista di tre quarti). */
  orecchini?: boolean;
  /**
   * Oggetto stretto nella mano del braccio vicino. Si disegna nella posizione
   * esatta della mano e la mano gli passa sopra: niente oggetti che galleggiano.
   */
  tiene?: 'tazza' | 'tablet';
}

const f = (n: number) => n.toFixed(1);

/** Tono dei segni di dettaglio: chiari sui capi scuri, scuri su quelli chiari. */
const tono = (colore: string) => /-(blu|viola)$/.test(colore) ? 'segno-chiaro' : 'segno-scuro';

/** Punto che sta a `d` unità da `b` andando verso `a`. */
function indietro(a: Punto, b: Punto, d: number): Punto {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [b[0] - (b[0] - a[0]) / L * d, b[1] - (b[1] - a[1]) / L * d];
}

/** Ciocche: un tratto o due dentro la capigliatura, per darle direzione. */
const CIOCCHE: Partial<Record<StileCapelli, string>> = {
  corti: 'M-6.4,-9.4 C-3.2,-11.8 2.2,-12.4 7.2,-10.2 M-8.4,-4.4 C-7.2,-7 -4.8,-8.6 -2,-9',
  raccolti: 'M-8.2,-4.6 C-7,-8.6 -3.6,-11 0.8,-11.6 M2.6,-11.8 C5.6,-11.4 8,-9.8 9.2,-7.4',
  lunghi: 'M-11.2,1.6 C-11.8,6.6 -11.4,11 -9.8,14.6 M-7.8,-6.4 C-5.6,-9.6 -1.4,-11.2 3.2,-10.8',
  caschetto: 'M-10.8,-1 C-11.2,1.8 -10.8,4 -10,5.4 M-7,-7 C-4.4,-10 0.4,-11 4.8,-10',
  ricci: 'M-10.6,-6.4 a2.2,2.2 0 0 1 3.2,-2.2 M-4.8,-12.4 a2.2,2.2 0 0 1 3.6,-.4 M3.2,-12.6 a2.2,2.2 0 0 1 3.4,1.2 M9.4,-8.6 a2.2,2.2 0 0 1 2,2.8 M-13,-1.6 a2.2,2.2 0 0 1 1.2,-3.2'
};

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

/**
 * Oggetto tenuto in mano, in coordinate locali. La mano (disegnata dopo) ne
 * copre il lato vicino, così sembra stretto davvero.
 *  - tazza: dritta, appena davanti al pugno, con un filo di vapore;
 *  - tablet: inclinato verso chi lo guarda, la mano lo regge dal bordo basso.
 */
function oggetto(tipo: 'tazza' | 'tablet', m: Punto): string {
  const [x, y] = m;
  if (tipo === 'tazza') {
    return `<rect class="tazza-corpo" x="${f(x - 2)}" y="${f(y - 6.5)}" width="9.4" height="11" rx="1.8"/>` +
      `<rect class="tazza-fascia" x="${f(x - 2)}" y="${f(y - 3.2)}" width="9.4" height="2.2"/>` +
      `<path class="vapore" d="M${f(x + 1)},${f(y - 9.5)} q-1.8,-2.6 0,-5.2 q1.8,-2.6 0,-5.2 M${f(x + 4.8)},${f(y - 9.5)} q-1.8,-2.6 0,-5.2"/>`;
  }
  return `<g transform="rotate(-24 ${f(x)} ${f(y)})">` +
    `<rect class="tablet-corpo" x="${f(x - 3)}" y="${f(y - 17)}" width="22" height="16" rx="2.2"/>` +
    `<rect class="tablet-schermo" x="${f(x - 0.6)}" y="${f(y - 14.6)}" width="17.2" height="11.2" rx="1"/></g>`;
}

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
    const presa = i === 1 && o.tiene ? oggetto(o.tiene, mano) : '';
    // La manica finisce prima della mano; con la giacca spunta il polsino della camicia.
    const polso = indietro(gomito, mano, 3.4), fine = indietro(gomito, mano, 1.2);
    let s2 = arto([sp, gomito, polso], [9.4, 7.6, 6.6], 'manica ' + abito);
    s2 += o.giacca
      ? arto([polso, fine], [6.2, 5.8], o.camicia ?? 'c-crema')
      : arto([polso, fine], [6.4, 6], 'manica ' + abito);
    if (i === 1 && o.orologio) {
      const q = indietro(gomito, mano, 2.4);
      s2 += `<circle class="orologio" cx="${f(q[0])}" cy="${f(q[1])}" r="2.2"/><circle class="quadrante" cx="${f(q[0])}" cy="${f(q[1])}" r="1.1"/>`;
    }
    // Piega al gomito, sul lato interno.
    s2 += `<path class="tratto ${tono(abito)}" d="M${f(gomito[0] - 2.2)},${f(gomito[1] - 1.4)} q1.6,1.6 3.6,1.2"/>`;
    return s2 + presa + `<ellipse class="pelle" cx="${f(mano[0])}" cy="${f(mano[1])}" rx="3.9" ry="4.4"/>`;
  };

  // --- gambe ---
  const anche: Punto[] = [[-hw + 5.4, 46], [hw - 5.4, 46]];
  const scarpa = (p: Punto) => `<path class="scarpa ${scarpe}" d="M${f(p[0] - 4.4)},${f(p[1] + 2.4)} C${f(p[0] - 4.8)},${f(p[1] - 3)} ${f(p[0] + 1)},${f(p[1] - 4.2)} ${f(p[0] + 4)},${f(p[1] - 2)} C${f(p[0] + 8)},${f(p[1] - 1.4)} ${f(p[0] + 10)},${f(p[1] + 0.4)} ${f(p[0] + 9.6)},${f(p[1] + 2.4)} Z"/>` +
    `<path class="tratto suola ${tono(scarpe)}" d="M${f(p[0] - 4)},${f(p[1] + 1.4)} H${f(p[0] + 9.2)}"/>`;
  // Piega stirata del pantalone, lungo il centro della gamba.
  const piega = (pts: Punto[]) => o.gonna ? '' :
    `<path class="tratto ${tono(pant)}" d="M${pts.map((q) => f(q[0] + 0.6) + ',' + f(q[1])).join(' L')}"/>`;
  let gambe: string[] = [];
  let gambaVicina = '';
  if (posa === 'in-piedi' || posa === 'passo') {
    const p = posa === 'passo';
    const ginocchia: Punto[] = [[anche[0][0] - (p ? 4 : 0.6), 73], [anche[1][0] + (p ? 6 : 0.4), 73]];
    const piedi: Punto[] = [[anche[0][0] - (p ? 9 : 1), 99], [anche[1][0] + (p ? 11 : 0.6), 99]];
    gambe = [0, 1].map((i) => arto([anche[i], ginocchia[i], piedi[i]], [12, 9.4, 7.4], 'gamba ' + pant, true) +
      piega([[anche[i][0], anche[i][1] + 4], ginocchia[i], [piedi[i][0], piedi[i][1] - 3]]) +
      scarpa([piedi[i][0] - 1, piedi[i][1] + 1]));
  } else if (posa === 'seduto') {
    const ginocchia: Punto[] = [[anche[0][0] + 24, 49], [anche[1][0] + 22, 48]];
    const piedi: Punto[] = [[ginocchia[0][0] + 1, 75], [ginocchia[1][0] + 2, 75]];
    gambe = [0, 1].map((i) => arto([anche[i], ginocchia[i], piedi[i]], [12.4, 9.6, 7.4], 'gamba ' + pant, true) +
      piega([[ginocchia[i][0], ginocchia[i][1] + 2], [piedi[i][0], piedi[i][1] - 3]]) +
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

  // Volume: il lato lontano del busto in ombra, la spalla vicina appena in luce.
  const volume = vista === 'spalle' ? '' :
    `<path class="volume" d="M${f(-sw + 0.4)},9 C${f(-sw)},16 ${f(-ww - 1)},24 ${f(-ww)},31 C${f(-ww)},37 ${f(-hw)},42 ${f(-hw)},46.4 ` +
    `L${f(-hw + 2.6)},46.4 C${f(-hw + 2.8)},40 ${f(-ww + 2.2)},34 ${f(-ww + 2.4)},28 C${f(-ww + 2.6)},20 ${f(-sw + 3.4)},14 ${f(-sw + 2.6)},9.4 Z"/>` +
    `<path class="luce" d="M6.4,2 C10,2.6 ${f(sw - 1.4)},4 ${f(sw - 0.6)},8.6 L${f(sw - 4.6)},10.4 C${f(sw - 5.4)},7 9.6,5 6,4 Z"/>`;
  // Cintura: si vede solo senza giacca e senza gonna.
  const cintura = o.giacca || o.gonna ? '' :
    `<rect class="cintura ${tono(pant)}" x="${f(-hw + 0.4)}" y="44.6" width="${f(2 * hw - 0.8)}" height="2.8"/>` +
    `<rect class="fibbia" x="0.4" y="44.2" width="3.4" height="3.6" rx=".6"/>`;

  const out: string[] = [`<g transform="translate(${o.x},${o.y}) scale(${dir * s},${s})">`];
  out.push(gambe.join(''));
  if (vista !== 'spalle') out.push(braccio(0));
  out.push(`<rect class="pelle" x="-3.8" y="-6" width="7.6" height="9" rx="3"/>` +
    (vista === 'spalle' ? '' : `<ellipse class="ombra-collo" cx="${vista === 'tre-quarti' ? 1 : 0}" cy="-4.2" rx="4" ry="1.8"/>`));
  out.push(busto, volume, gonna, cintura);
  if (vista !== 'spalle') {
    const camicia = o.camicia ?? 'c-crema';
    const colletto = `<path class="colletto ${camicia} ${tono(camicia)}" d="M-5.8,1 L-0.4,5.6 L-3.6,7.6 L-6.6,3.4 Z M5.8,1 L0.4,5.6 L3.6,7.6 L6.6,3.4 Z"/>`;
    if (o.giacca) {
      out.push(`<path class="${camicia}" d="M-6.4,1.6 L6.4,1.6 L3.6,30 L-3.6,30 Z"/>`);
      if (o.cravatta) {
        out.push(colletto + `<path class="${o.cravatta}" d="M-1.6,4.8 H1.6 L1,7.6 H-1 Z M-1,7.6 H1 L2.4,24.4 L0,27.6 L-2.4,24.4 Z"/>` +
          `<path class="tratto ${tono(o.cravatta)}" d="M-1,7.6 H1"/>`);
      } else {
        out.push(`<path class="pelle" d="M-3.8,1.4 L0,6.6 L3.8,1.4 Z"/>` + colletto);
      }
      // Giacca: risvolti, abbottonatura, due bottoni, taschino con pochette, tasche a filetto.
      const pochette = abito === 'a-blu' || abito === 'a-viola' ? 'f-pesca' : abito === 'a-pesca' ? 'c-blu' : 'c-viola';
      out.push(`<path class="risvolto ${abito}" d="M-6.4,1.4 L-1.4,16 L-4,30 L-7.6,30 L-8.6,6 Z M6.4,1.4 L1.4,16 L4,30 L7.6,30 L8.6,6 Z"/>` +
        `<path class="tratto ${tono(abito)}" d="M0,30 L0.4,49.6 M${f(-hw + 2.4)},39.6 h6.4 M${f(hw - 8.8)},39.6 h6.4 M-11.6,17.6 h5.6"/>` +
        `<path class="${pochette}" d="M-11,17.6 l1.2,-2.6 l1.4,1.6 l1.2,-2 l1,3 Z"/>` +
        `<circle class="bottone ${tono(abito)}" cx="1.6" cy="33.4" r="1.1"/><circle class="bottone ${tono(abito)}" cx="1.6" cy="40.4" r="1.1"/>`);
    } else {
      out.push(`<path class="${camicia}" d="M-6,1.6 L0,12 L6,1.6 Z"/>`);
      out.push(`<path class="pelle" d="M-3.8,1.4 L0,6.6 L3.8,1.4 Z"/>` + colletto);
    }
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
  if (vista === 'tre-quarti') {
    out.push(`<ellipse class="pelle" cx="-8.4" cy="1.6" rx="2.3" ry="3.1"/>` +
      `<path class="tratto segno-scuro" d="M-8.8,0 q.9,1.6 0,3.2"/>`);
    if (o.orecchini) out.push(`<circle class="orecchino" cx="-8.6" cy="5.2" r="1.2"/>`);
  }
  if (vista === 'spalle') {
    out.push(`<path class="capelli ${colCap}" d="M-10.4,4 C-11.6,-9 -5.6,-13.6 0,-13.6 C5.6,-13.6 11.6,-9 10.4,4 C7,7.6 -7,7.6 -10.4,4 Z"/>`);
  } else {
    if (stileCap.davanti) out.push(`<path class="capelli ${colCap}" d="${stileCap.davanti}"/>`);
    const ciocca = CIOCCHE[o.capelli ?? 'corti'];
    if (ciocca) out.push(`<path class="tratto ciocca ${tono(colCap)}" d="${ciocca}"/>`);
    if (o.barba) out.push(`<path class="capelli ${colCap}" d="M-8.8,1.6 C-8,8.8 -3.4,11.8 0.8,11.8 C4.8,11.8 8.8,8.8 9.6,1.6 C7.4,5 4,6.2 0.8,6.2 C-3,6.2 -6.6,5 -8.8,1.6 Z"/>`);
    if (o.occhiali) out.push(`<path class="occhiali" d="M0.4,-0.2 h4.8 v3.4 h-4.8 z M6.8,-0.2 h2.4 v3.4 h-2.4 M5.2,1.2 h1.6 M0.4,0.6 L-7,-0.4"/>`);
  }
  out.push('</g>');
  out.push(braccio(1));
  if (vista === 'spalle') out.push(braccio(0));
  out.push('</g>');
  return out.join('');
}
