// Nightshade — The Gilded Vault IV
// levels.js — the six heist floors: maps, palettes, guard/camera/laser layouts.
// Every map is 16 rows of up to 32 tiles (rows are padded with floor by the parser).
// Legend: # wall  . floor  C crate  D desk  B bookshelf  P plant  S statue
//          H hedge  T pillar  F fountain  L lamp  ~ shadow pool  R relic
//          E exit  p player start

export const TILE = 40;
export const COLS = 32;
export const ROWS = 16;

export const LEVELS = [
  {
    name: '1 · Marble Gallery',
    sub: 'Learn the dark — slip past the first patrols',
    floor: '#d8cdb4', floor2: '#c9bd9f', carpet: '#7a1f2b',
    wall: '#4a4238', wallTop: '#6b5f4c', trim: '#c9a227',
    lampGlow: 'rgba(255,196,110,0.55)',
    map: [
      '################################',
      '#p......C......T......R.......#',
      '#.......C......T.............#',
      '#..~~~~~~....................#',
      '#..~~~~~~..D.......D.........#',
      '#..........D.......D....C....#',
      '#..T.....................C...#',
      '#..T.....L.......L...........#',
      '#........R..................#',
      '#..C...........P.......P.....#',
      '#..C...................E....#',
      '#.......~~~~~~..............#',
      '#.......~~~~~~..C...........#',
      '#..R.......C................#',
      '#...........................#',
      '################################',
    ],
    guards: [
      { type: 'patrol', path: [[8, 3], [8, 12], [20, 12], [20, 3]], speed: 1.5 },
      { type: 'patrol', path: [[24, 5], [24, 11], [14, 11], [14, 5]], speed: 1.4 },
    ],
    cameras: [],
    lasers: [],
  },
  {
    name: '2 · Crimson Vault',
    sub: 'Cameras sweep the carpet — time your crossings',
    floor: '#8a2a2e', floor2: '#7a2327', carpet: '#5c1420',
    wall: '#3d1c1e', wallTop: '#5a2b2b', trim: '#d4af37',
    lampGlow: 'rgba(255,170,90,0.5)',
    map: [
      '################################',
      '#p...C........T.........R.....#',
      '#....C........T..............#',
      '#..~~~~~.....D.....D.........#',
      '#..~~~~~.....D.....D....C....#',
      '#..........B.....B...........#',
      '#..T.......B.....B.....T.....#',
      '#..T...L...........L.........#',
      '#.......R........C..........#',
      '#..C..........P......P......#',
      '#..C....~~~~~~..........E...#',
      '#.......~~~~~~....D.........#',
      '#..R...........D............#',
      '#......C...................#',
      '#......C...................#',
      '################################',
    ],
    guards: [
      { type: 'patrol', path: [[6, 3], [6, 12], [15, 12], [15, 3]], speed: 1.6 },
      { type: 'patrol', path: [[25, 4], [25, 11], [18, 11], [18, 4]], speed: 1.6 },
      { type: 'sentry', path: [[11, 8]], speed: 0 },
    ],
    cameras: [{ x: 16, y: 1, sweep: 1.1, range: 7 }],
    lasers: [],
  },
  {
    name: '3 · Emerald Grand Hall',
    sub: 'Three relics, one long carpet, no hiding in the open',
    floor: '#1e5c46', floor2: '#17493a', carpet: '#0f3d2e',
    wall: '#123527', wallTop: '#1f5240', trim: '#c9a227',
    lampGlow: 'rgba(150,255,190,0.4)',
    map: [
      '################################',
      '#p.....T......R......T.......#',
      '#......T.............T.......#',
      '#..~~~~~...D......D.........#',
      '#..~~~~~...D......D....S....#',
      '#.........S......S...........#',
      '#..T..........L.............#',
      '#..T....C...........C...T...#',
      '#......C...........C....T...#',
      '#....R......P..........P....#',
      '#..C.......~~~~~~......E....#',
      '#..C.......~~~~~~...........#',
      '#..D..........D.............#',
      '#..D....R.....D......C......#',
      '#..........................#',
      '################################',
    ],
    guards: [
      { type: 'patrol', path: [[5, 3], [5, 12], [12, 12], [12, 3]], speed: 1.7 },
      { type: 'patrol', path: [[27, 3], [27, 12], [20, 12], [20, 3]], speed: 1.7 },
      { type: 'scout', path: [[9, 7], [22, 7], [22, 9], [9, 9]], speed: 2.6 },
      { type: 'sentry', path: [[16, 5]], speed: 0 },
    ],
    cameras: [
      { x: 10, y: 1, sweep: 1.0, range: 7 },
      { x: 22, y: 1, sweep: 1.0, range: 7 },
    ],
    lasers: [{ x: 16, y: 6, dir: 'v', len: 5 }],
  },
  {
    name: '4 · Obsidian Inner Vault',
    sub: 'The heavy guard walks the dark — stay in the shadows',
    floor: '#23232e', floor2: '#1b1b24', carpet: '#101018',
    wall: '#0e0e14', wallTop: '#2c2c3a', trim: '#8f7bd8',
    lampGlow: 'rgba(170,140,255,0.45)',
    map: [
      '################################',
      '#p....T.......R.......T......#',
      '#.....T...............T......#',
      '#..~~~~~...B.......B........#',
      '#..~~~~~...B.......B....C...#',
      '#..........D......D.........#',
      '#..T.......D......D.....T...#',
      '#..T...L..........L.....T...#',
      '#.......R......S...........#',
      '#..C..........S......P.....#',
      '#..C....~~~~~~.........E....#',
      '#.......~~~~~~....C........#',
      '#..R........C..............#',
      '#......D...........D.......#',
      '#......D...........D.......#',
      '################################',
    ],
    guards: [
      { type: 'heavy', path: [[8, 4], [8, 11], [23, 11], [23, 4]], speed: 1.0 },
      { type: 'patrol', path: [[5, 3], [5, 12], [14, 12], [14, 3]], speed: 1.8 },
      { type: 'patrol', path: [[27, 3], [27, 12], [19, 12], [19, 3]], speed: 1.8 },
      { type: 'sentry', path: [[16, 8]], speed: 0 },
    ],
    cameras: [
      { x: 12, y: 1, sweep: 1.2, range: 7 },
      { x: 20, y: 14, sweep: 1.2, range: 7 },
    ],
    lasers: [
      { x: 16, y: 5, dir: 'v', len: 6 },
      { x: 10, y: 9, dir: 'h', len: 5 },
    ],
  },
  {
    name: '5 · Moonlit Rooftop Garden',
    sub: 'Hedges and moonlight — the scout is fast, the dark is kind',
    floor: '#2e5d33', floor2: '#26502c', carpet: '#1d4223',
    wall: '#1a3a20', wallTop: '#2f6b38', trim: '#bfe3c0',
    lampGlow: 'rgba(190,220,255,0.4)',
    map: [
      '################################',
      '#p..H...H.......R....H...H...#',
      '#...H...H...........H...H....#',
      '#..~~~~~...F......F.........#',
      '#..~~~~~...F......F....H....#',
      '#.........H......H...........#',
      '#..H...........L........H...#',
      '#..H....P...........P...H...#',
      '#.......P...........P.......#',
      '#....R......H..........H....#',
      '#..H.......H.....~~~~~.E....#',
      '#..H.......H.....~~~~~......#',
      '#..P..........P.............#',
      '#..P....R.....P......H......#',
      '#..........................#',
      '################################',
    ],
    guards: [
      { type: 'scout', path: [[6, 3], [6, 12], [13, 12], [13, 3]], speed: 2.8 },
      { type: 'scout', path: [[26, 3], [26, 12], [19, 12], [19, 3]], speed: 2.8 },
      { type: 'patrol', path: [[9, 6], [23, 6], [23, 10], [9, 10]], speed: 1.8 },
      { type: 'sentry', path: [[16, 4]], speed: 0 },
    ],
    cameras: [
      { x: 8, y: 1, sweep: 1.0, range: 7 },
      { x: 24, y: 1, sweep: 1.0, range: 7 },
    ],
    lasers: [{ x: 16, y: 7, dir: 'v', len: 4 }],
  },
  {
    name: '6 · The Gilded Sanctum',
    sub: 'The final vault — elites, cameras, lasers. Take everything. Leave unseen.',
    floor: '#6b5a1e', floor2: '#5d4d18', carpet: '#3f340f',
    wall: '#2e2608', wallTop: '#574a17', trim: '#ffd94a',
    lampGlow: 'rgba(255,214,90,0.55)',
    map: [
      '################################',
      '#p...T.......R.......T.......#',
      '#....T...............T.......#',
      '#..~~~~~...S.......S........#',
      '#..~~~~~...S.......S....C...#',
      '#..........D......D.........#',
      '#..T.......D......D.....T...#',
      '#..T...L..........L.....T...#',
      '#.......R......F...........#',
      '#..C..........F......P.....#',
      '#..C....~~~~~~.........E....#',
      '#.......~~~~~~....C........#',
      '#..R........C..............#',
      '#......B...........B.......#',
      '#......B...........B.......#',
      '################################',
    ],
    guards: [
      { type: 'elite', path: [[8, 4], [8, 11], [23, 11], [23, 4]], speed: 1.3 },
      { type: 'heavy', path: [[5, 3], [5, 12], [14, 12], [14, 3]], speed: 1.1 },
      { type: 'scout', path: [[27, 3], [27, 12], [19, 12], [19, 3]], speed: 2.9 },
      { type: 'patrol', path: [[10, 7], [22, 7], [22, 9], [10, 9]], speed: 1.9 },
      { type: 'sentry', path: [[16, 6]], speed: 0 },
      { type: 'sentry', path: [[16, 11]], speed: 0 },
    ],
    cameras: [
      { x: 11, y: 1, sweep: 1.2, range: 8 },
      { x: 21, y: 1, sweep: 1.2, range: 8 },
      { x: 16, y: 14, sweep: 1.0, range: 8 },
    ],
    lasers: [
      { x: 16, y: 5, dir: 'v', len: 6 },
      { x: 9, y: 9, dir: 'h', len: 6 },
      { x: 23, y: 9, dir: 'h', len: 5 },
    ],
  },
];

// Parse a level's ASCII map into grids the engine can use.
export function parseLevel(def) {
  const walls = new Set();
  const cover = new Map(); // "x,y" -> prop char
  const lamps = [];
  const shadows = new Set();
  const relics = [];
  let player = { x: 2, y: 2 };
  let exit = { x: 28, y: 10 };
  for (let y = 0; y < ROWS; y++) {
    const row = (def.map[y] || '').padEnd(COLS, '.').slice(0, COLS);
    for (let x = 0; x < COLS; x++) {
      const c = row[x];
      const key = x + ',' + y;
      if (c === '#') walls.add(key);
      else if (c === 'C' || c === 'D' || c === 'B' || c === 'P' || c === 'S' || c === 'H' || c === 'T' || c === 'F') cover.set(key, c);
      else if (c === 'L') lamps.push({ x, y });
      else if (c === '~') shadows.add(key);
      else if (c === 'R') relics.push({ x, y, taken: false });
      else if (c === 'E') exit = { x, y };
      else if (c === 'p') player = { x, y };
    }
  }
  return { def, walls, cover, lamps, shadows, relics, player, exit };
}

export function tileCenter(x, y) {
  return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
}
