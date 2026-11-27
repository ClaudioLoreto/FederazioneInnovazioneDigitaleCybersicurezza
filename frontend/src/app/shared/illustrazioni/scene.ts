// =============================================================================
//  frontend/src/app/shared/illustrazioni/scene.ts
//  LE SCENE — una per ambito della Federazione, tutte nello stesso riquadro
//  320 × 220 e con lo stesso fondale (viola con griglia, pavimento blu).
//
//  Ogni scena racconta un'azione riconoscibile senza leggere:
//   gruppo-di-lavoro → una persona espone la mappa di un progetto, un'altra prende appunti;
//   conferenza       → una relatrice al leggio, il pubblico di spalle, una mano alzata;
//   formazione       → un docente spiega codice e sicurezza, due allievi al portatile;
//   analisi          → una ricercatrice ai monitor, un collega che commenta;
//   consulenza       → un colloquio uno a uno attorno a un tavolo.
//
//  Un solo elemento si muove per scena (classi .vivo, vedi il componente).
// =============================================================================

import { persona } from './figura';
import type { ScenaIllustrazione } from './illustrazione.component';

const r = (x: number, y: number, w: number, h: number, cls: string, rx = 0) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const ombra = (x: number, w = 30) => `<ellipse class="ombra" cx="${x}" cy="201" rx="${w}" ry="4.4"/>`;
const pavimento = `<rect class="pavimento" x="0" y="200" width="320" height="20"/>`;
const fondale = `<rect class="fondale" width="320" height="220"/><g class="griglia">${Array.from({length:13},(_,i)=>`<line x1="${i*26}" y1="0" x2="${i*26}" y2="200"/>`).join('')}${Array.from({length:8},(_,i)=>`<line x1="0" y1="${i*26}" x2="320" y2="${i*26}"/>`).join('')}</g>`;
const pianta = (x: number) => `<g class="pianta"><path class="foglia" d="M${x},170 C${x-14},160 ${x-18},140 ${x-10},128 C${x-6},144 ${x-2},156 ${x},170 Z"/><path class="foglia chiara" d="M${x},170 C${x+4},150 ${x+12},138 ${x+20},134 C${x+18},150 ${x+10},162 ${x},170 Z"/><path class="foglia" d="M${x},170 C${x-2},150 ${x+2},128 ${x+6},116 C${x+10},134 ${x+6},154 ${x},170 Z"/>${r(x-10,168,20,32,'vaso',3)}</g>`;
const sedia = (x: number, y: number, dir = 1) => `<g class="sedia" transform="translate(${x},${y}) scale(${dir},1)"><path d="M-18,-6 L-14,-58 L-8,-58 L-11,-6 Z"/><rect x="-18" y="-8" width="34" height="6" rx="2"/><path d="M-1,-2 L-1,20 M-14,24 L12,24 M-1,20 L-12,24 M-1,20 L10,24" class="sedia-gambe"/></g>`;
const laptop = (x: number, y: number, dir = 1) => `<g transform="translate(${x},${y}) scale(${dir},1)"><path class="laptop" d="M-2,0 L-10,-26 L-7,-27 L2,-1 Z"/><circle class="logo" cx="-6" cy="-14" r="2"/><rect class="laptop" x="-2" y="-2" width="30" height="3" rx="1"/></g>`;
export const SCENE: Record<ScenaIllustrazione, () => string> = {
  'gruppo-di-lavoro': () => fondale + pavimento +
    // Lavagna con post-it e collegamenti (mappa di un progetto)
    `<g>${r(168,26,136,96,'pannello',4)}
      <path class="filo" d="M196,52 L236,74 L276,50 M236,74 L230,104 M276,50 L284,96"/>
      ${r(184,42,24,20,'nota',2)}${r(224,64,24,20,'nota chiara',2)}${r(264,40,24,20,'nota',2)}${r(218,96,24,18,'nota chiara',2)}${r(272,88,24,20,'nota nuova vivo',2)}
    </g>` +
    // tavolo con portatile
    `${r(18,148,96,7,'arredo',2)}<path class="arredo-linea" d="M30,155 L30,200 M102,155 L102,200"/>` +
    ombra(160, 26) + ombra(58, 34) +
    sedia(50, 176) +
    persona({x:54,y:118,s:1,posa:'seduto',capelli:'lunghi',abito:'a-pesca',camicia:'c-crema',colCapelli:'h-blu',spalle:13.6,bracci:[[[10,14],[26,20]],[[12,14],[28,18]]]}) +
    laptop(84,147,1) +
    persona({x:160,y:96,s:1.04,posa:'in-piedi',capelli:'corti',abito:'a-crema',giacca:true,camicia:'c-blu',bracci:[[[-4,18],[-2,36]],[[14,4],[30,-12]]]}) +
    pianta(14),

  'conferenza': () => fondale + pavimento +
    `<g>${r(132,18,170,104,'pannello',4)}
      <path class="schermo-scudo" d="M190,40 L210,34 L230,40 L230,62 C230,76 220,84 210,88 C200,84 190,76 190,62 Z"/>
      <path class="schermo-spunta" d="M200,61 L207,68 L220,54"/>
      <path class="filo traccia vivo" d="M246,96 L262,80 L276,86 L292,62"/>${r(246,48,40,4,'riga-chiara',2)}${r(246,58,28,4,'riga-chiara',2)}
    </g>` +
    ombra(84, 30) +
    persona({x:84,y:96,s:1.04,vista:'fronte',capelli:'raccolti',abito:'a-blu',camicia:'c-crema',gonna:'g-blu',colCapelli:'h-blu',spalle:13.6,badge:true,bracci:[[[-6,18],[-4,34]],[[14,2],[30,-8]]]}) +
    // leggio davanti alla relatrice
    `<path class="arredo" d="M60,150 L108,150 L102,200 L66,200 Z"/>${r(56,146,56,8,'arredo',2)}${r(72,164,24,4,'logo-leggio',2)}` +
    // pubblico di spalle in primo piano
    persona({x:40,y:178,s:1.1,vista:'spalle',capelli:'corti',abito:'a-crema',colCapelli:'h-blu',posa:null}) +
    persona({x:132,y:184,s:1.1,vista:'spalle',capelli:'lunghi',abito:'a-pesca',colCapelli:'h-blu',posa:null}) +
    persona({x:214,y:180,s:1.1,vista:'spalle',capelli:'ricci',abito:'a-blu',colCapelli:'h-crema',posa:null,bracci:[[[-4,18],[-3,36]],[[8,-8],[10,-28]]]}) +
    persona({x:296,y:186,s:1.1,vista:'spalle',capelli:'rasati',abito:'a-crema',colCapelli:'h-blu',posa:null}),

  'formazione': () => fondale + pavimento +
    `<g>${r(20,22,144,92,'pannello',4)}
      ${r(34,38,52,4,'riga-chiara',2)}${r(42,50,74,4,'riga',2)}${r(42,62,58,4,'riga',2)}${r(34,74,40,4,'riga-chiara',2)}${r(42,86,64,4,'riga',2)}
      <rect class="cursore-codice vivo" x="110" y="86" width="5" height="5"/>
      <g class="lucchetto"><path d="M126,46 v-6 a8,8 0 0,1 16,0 v6" class="lucchetto-arco"/>${r(120,46,28,22,'lucchetto-corpo',3)}<circle class="lucchetto-foro" cx="134" cy="56" r="3"/></g>
    </g>` +
    ombra(186, 26) +
    persona({x:186,y:96,s:1.04,dir:-1,capelli:'rasati',barba:true,abito:'a-blu',camicia:'c-crema',giacca:true,colCapelli:'h-blu',bracci:[[[-4,18],[-2,36]],[[12,6],[28,-4]]]}) +
    // banchi con allievi seduti, di spalle verso la lavagna
    ombra(262, 34) + ombra(120, 30) +
    `${r(70,160,70,6,'arredo',2)}<path class="arredo-linea" d="M80,166 L80,200 M130,166 L130,200"/>` +
    persona({x:132,y:142,s:.92,dir:-1,posa:'seduto',capelli:'caschetto',colCapelli:'h-crema',abito:'a-crema',camicia:'c-viola',bracci:[[[10,14],[26,16]],[[12,14],[28,14]]]}) +
    laptop(108,159,-1) +
    `${r(214,160,76,6,'arredo',2)}<path class="arredo-linea" d="M224,166 L224,200 M280,166 L280,200"/>` +
    persona({x:284,y:142,s:.92,dir:-1,posa:'seduto',capelli:'ricci',colCapelli:'h-blu',abito:'a-pesca',camicia:'c-blu',bracci:[[[10,14],[26,16]],[[12,14],[28,14]]]}) +
    laptop(258,159,-1),

  'analisi': () => fondale + pavimento +
    `<g>${r(150,40,96,66,'pannello',4)}
      <g class="grafico vivo">${r(164,80,12,18,'barra b1',1)}${r(182,68,12,30,'barra b2',1)}${r(200,74,12,24,'barra b3',1)}${r(218,58,12,40,'barra b4',1)}</g>
      ${r(194,106,8,12,'arredo')}${r(180,116,36,4,'arredo',2)}
      ${r(252,56,52,50,'pannello',4)}<path class="filo" d="M258,96 L268,84 L278,90 L290,70 L298,74"/>
    </g>` +
    `${r(120,120,170,7,'arredo',2)}<path class="arredo-linea" d="M134,127 L134,200 M276,127 L276,200"/>` +
    ombra(90, 30) + sedia(92, 176) +
    persona({x:96,y:118,s:1,posa:'seduto',capelli:'lunghi',colCapelli:'h-crema',abito:'a-blu',camicia:'c-crema',occhiali:true,spalle:13.6,bracci:[[[12,14],[30,10]],[[14,12],[32,8]]]}) +
    ombra(44, 22) +
    persona({x:44,y:96,s:1.02,capelli:'corti',abito:'a-crema',camicia:'c-viola',colCapelli:'h-blu',bracci:[[[-4,18],[-2,36]],[[12,10],[16,-2]]]}) +
    `<g class="tazza">${r(55,82,9,11,'tazza-corpo',2)}</g>` +
    pianta(306),

  'consulenza': () => fondale + pavimento +
    `<g>${r(118,30,84,56,'pannello',4)}<path class="schermo-scudo respira vivo" d="M152,42 L160,39 L168,42 L168,54 C168,62 164,66 160,68 C156,66 152,62 152,54 Z"/></g>` +
    `<ellipse class="arredo" cx="160" cy="150" rx="58" ry="8"/><path class="arredo-linea" d="M160,158 L160,200 M140,200 L180,200"/>` +
    ombra(72, 30) + ombra(248, 30) +
    sedia(66, 176) + sedia(254, 176, -1) +
    persona({x:70,y:118,s:1,posa:'seduto',capelli:'corti',abito:'a-crema',giacca:true,camicia:'c-blu',colCapelli:'h-blu',bracci:[[[10,14],[28,16]],[[12,12],[34,8]]]}) +
    `<g class="tablet"><rect class="tablet-corpo" x="116" y="128" width="26" height="18" rx="2" transform="rotate(-14 129 137)"/></g>` +
    persona({x:250,y:118,s:1,dir:-1,posa:'seduto',capelli:'raccolti',colCapelli:'h-blu',abito:'a-pesca',camicia:'c-crema',spalle:13.6,bracci:[[[10,14],[26,18]],[[12,10],[24,2]]]}) +
    `<rect class="tazza-corpo" x="176" y="136" width="9" height="11" rx="2"/>` + pianta(300)
};
