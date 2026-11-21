// game.js — Nightshade · The Gilded Vault IV: main loop, player, gadgets,
// level flow, screens, scoring. Canvas 1280x720.
import { LEVELS, parseLevel, TILE, tileCenter } from './levels.js';
import { makeGuard, makeCamera, makeLaser, updateGuard, updateCamera, blocked } from './guards.js';
import { drawWorld, drawHUD, drawScreen } from './render.js';
import { initInput, moveVector, sneaking } from './input.js';
import { sfx, ensureAudio, toggleMute, isMuted, startHum } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  screen: 'title', // title | briefing | play | paused | clear | caught | win
  levelIndex: 0,
  def: LEVELS[0], level: null,
  guards: [], cameras: [], lasers: [],
  player: { x: 60, y: 60, angle: 0, crouch: false, running: false },
  coins: [], smokes: [],
  gadgets: { coin: 3, smoke: 2, whistle: 1 },
  relicsGot: 0, score: 0, alerts: 0, elapsed: 0, levelTime: 0,
  alarm: false, maxCam: 0, noise: null,
  time: 0, stepT: 0, levelScore: 0,
  screenHint: '', rating: '', totalScore: 0,
  shotMode: null,
};

function loadLevel(i) {
  const def = LEVELS[i];
  game.levelIndex = i;
  game.def = def;
  game.level = parseLevel(def);
  game.guards = def.guards.map((c, n) => makeGuard(c, n));
  game.cameras = def.cameras.map((c, n) => makeCamera(c, n));
  game.lasers = def.lasers.map(makeLaser);
  const p = tileCenter(game.level.player.x, game.level.player.y);
  game.player = { x: p.x, y: p.y, angle: 0, crouch: false, running: false };
  game.coins = [];
  game.smokes = [];
  game.gadgets = { coin: 3, smoke: 2, whistle: 1 };
  game.relicsGot = 0;
  game.levelTime = 0;
  game.alarm = false;
  game.maxCam = 0;
  game.noise = null;
}

function startGame() {
  game.score = 0;
  game.totalScore = 0;
  game.alerts = 0;
  game.elapsed = 0;
  loadLevel(0);
  game.screen = 'briefing';
  game.screenHint = 'Press ENTER to begin the heist';
}

function levelRating() {
  if (game.alerts === 0 && game.levelTime < 90) return 'GHOST';
  if (game.alerts <= 1) return 'SILENT';
  return 'SHADOW';
}

function levelClear() {
  game.rating = levelRating();
  const bonus = game.rating === 'GHOST' ? 1500 : game.rating === 'SILENT' ? 900 : 400;
  const timeBonus = Math.max(0, 600 - Math.floor(game.levelTime) * 5);
  game.levelScore = 1000 + bonus + timeBonus;
  game.totalScore += game.levelScore;
  game.score = game.totalScore;
  sfx.win();
  if (game.levelIndex >= LEVELS.length - 1) {
    game.screen = 'win';
    game.screenHint = 'Press ENTER to play again · R to restart';
  } else {
    game.screen = 'clear';
    game.screenHint = 'Press ENTER for the next floor';
  }
}

function caught() {
  game.screen = 'caught';
  sfx.lose();
  game.screenHint = 'Press R to retry this floor';
}

function update(dt) {
  game.time += dt;
  // Screenshot staging: hold the posed state still for the capture.
  if (game.shotMode) return;
  if (game.screen !== 'play') return;
  game.elapsed += dt;
  game.levelTime += dt;
  const p = game.player;

  // --- movement ---
  const mv = moveVector();
  p.crouch = sneaking();
  p.running = !p.crouch && (mv.x || mv.y) && !sneaking();
  const speed = p.crouch ? 62 : 138;
  if (mv.x || mv.y) {
    p.angle = Math.atan2(mv.y, mv.x);
    const nx = p.x + mv.x * speed * dt;
    const ny = p.y + mv.y * speed * dt;
    if (!blocked(game.level, nx, p.y)) p.x = nx;
    if (!blocked(game.level, p.x, ny)) p.y = ny;
    game.stepT -= dt;
    if (game.stepT <= 0) {
      game.stepT = p.crouch ? 0.55 : p.running ? 0.28 : 0.4;
      sfx.step(p.crouch);
      if (p.running) {
        game.noise = { x: p.x, y: p.y, r: 130, age: 0 };
        setTimeout(() => { if (game.noise) game.noise.age = 1; }, 350);
      }
    }
  }

  // --- relic pickup (walk over, or E near) ---
  for (const r of game.level.relics) {
    if (r.taken) continue;
    const c = tileCenter(r.x, r.y);
    if (Math.hypot(c.x - p.x, c.y - p.y) < 26) {
      r.taken = true;
      game.relicsGot++;
      game.score += 250;
      game.totalScore = game.score;
      sfx.pickup();
      if (game.relicsGot >= 3) sfx.unlock();
    }
  }

  // --- lasers: touching an active beam triggers an alarm ---
  for (const l of game.lasers) {
    const blink = Math.sin(game.time * 3 + l.phase) > -0.6;
    l.on = blink;
    if (!blink) continue;
    let hit = false;
    if (l.dir === 'v') hit = Math.abs(p.x - l.x) < 12 && p.y > l.y && p.y < l.y + l.len * TILE;
    else hit = Math.abs(p.y - l.y) < 12 && p.x > l.x && p.x < l.x + l.len * TILE;
    if (hit) {
      sfx.laser();
      for (const g of game.guards) {
        if (g.state !== 'alert' && g.state !== 'chase') { g.state = 'alert'; g.alertT = 0; }
        g.lastSeen = { x: p.x, y: p.y };
        g.suspicion = 100;
      }
      game.alerts++;
      game.alarm = true;
      setTimeout(() => { game.alarm = false; }, 3000);
      // push the player back out of the beam
      p.x -= Math.cos(p.angle) * 30;
      p.y -= Math.sin(p.angle) * 30;
    }
  }

  // --- guards & cameras ---
  const gctx = {
    player: p, level: game.level, smokes: game.smokes, time: game.time, noise: game.noise,
    onSpotted(g) {
      game.alerts++;
      game.alarm = true;
      sfx.alert();
      setTimeout(() => { game.alarm = false; }, 3500);
      for (const o of game.guards) {
        if (o !== g && o.state !== 'chase') { o.investigate = { x: p.x, y: p.y }; o.state = 'wary'; }
      }
    },
    onCaught() { if (game.screen === 'play') caught(); },
    onCalmed() {},
  };
  for (const g of game.guards) updateGuard(g, dt, gctx);
  game.maxCam = 0;
  for (const cam of game.cameras) {
    updateCamera(cam, dt, {
      player: p, level: game.level, smokes: game.smokes,
      onCameraAlarm() {
        if (game.screen !== 'play') return;
        game.alerts++;
        game.alarm = true;
        sfx.alert();
        setTimeout(() => { game.alarm = false; }, 3500);
        for (const g of game.guards) { g.investigate = { x: p.x, y: p.y }; g.state = 'wary'; g.suspicion = Math.max(g.suspicion, 60); }
        cam.spotted = 0;
      },
    });
    game.maxCam = Math.max(game.maxCam, cam.spotted);
  }
  if (game.noise) { game.noise.age += dt * 2; if (game.noise.age >= 1) game.noise = null; }

  // --- smoke fades ---
  for (const s of game.smokes) s.t -= dt;
  game.smokes = game.smokes.filter((s) => s.t > 0);

  // --- exit ---
  if (game.relicsGot >= 3) {
    const e = tileCenter(game.level.exit.x, game.level.exit.y);
    if (Math.hypot(e.x - p.x, e.y - p.y) < 28) levelClear();
  }
}

function throwCoin() {
  if (game.gadgets.coin <= 0 || game.screen !== 'play') return;
  game.gadgets.coin--;
  const p = game.player;
  const cx = p.x + Math.cos(p.angle) * 150;
  const cy = p.y + Math.sin(p.angle) * 150;
  game.coins.push({ x: cx, y: cy, ring: 10, t: 0 });
  sfx.coin();
  setTimeout(() => {
    sfx.coinLand();
    for (const g of game.guards) {
      const d = Math.hypot(cx - g.x, cy - g.y);
      if (d < 260 && g.state !== 'alert' && g.state !== 'chase') {
        g.investigate = { x: cx, y: cy };
        g.state = 'wary';
        g.suspicion = Math.max(g.suspicion, 40);
      }
    }
    game.coins = game.coins.filter((c) => c.x !== cx);
  }, 500);
}

function throwSmoke() {
  if (game.gadgets.smoke <= 0 || game.screen !== 'play') return;
  game.gadgets.smoke--;
  const p = game.player;
  game.smokes.push({ x: p.x + Math.cos(p.angle) * 90, y: p.y + Math.sin(p.angle) * 90, r: 85, t: 5 });
  sfx.smoke();
}

function blowWhistle() {
  if (game.gadgets.whistle <= 0 || game.screen !== 'play') return;
  game.gadgets.whistle--;
  const p = game.player;
  const tx = p.x + Math.cos(p.angle) * 180;
  const ty = p.y + Math.sin(p.angle) * 180;
  sfx.whistle();
  for (const g of game.guards) {
    const d = Math.hypot(tx - g.x, ty - g.y);
    if (d < 420 && g.state !== 'alert' && g.state !== 'chase') {
      g.investigate = { x: tx, y: ty };
      g.state = 'wary';
      g.suspicion = Math.max(g.suspicion, 55);
    }
  }
}

function onAction(k) {
  ensureAudio();
  startHum();
  if (k === 'm') { toggleMute(); return; }
  if (game.screen === 'title') {
    if (k === 'enter' || k === ' ') startGame();
    return;
  }
  if (game.screen === 'briefing') {
    if (k === 'enter' || k === ' ') { game.screen = 'play'; sfx.click(); }
    return;
  }
  if (game.screen === 'clear') {
    if (k === 'enter' || k === ' ') { loadLevel(game.levelIndex + 1); game.screen = 'briefing'; }
    return;
  }
  if (game.screen === 'win') {
    if (k === 'enter' || k === ' ') startGame();
    if (k === 'r') startGame();
    return;
  }
  if (game.screen === 'caught') {
    if (k === 'r' || k === 'enter' || k === ' ') { loadLevel(game.levelIndex); game.screen = 'play'; }
    return;
  }
  if (game.screen === 'paused') {
    if (k === 'p' || k === 'escape' || k === 'enter') game.screen = 'play';
    if (k === 'r') { loadLevel(game.levelIndex); game.screen = 'play'; }
    return;
  }
  // play
  if (k === 'p' || k === 'escape') { game.screen = 'paused'; game.screenHint = 'Press P to resume · R to restart floor'; return; }
  if (k === 'r') { loadLevel(game.levelIndex); return; }
  if (k === 'q') throwCoin();
  if (k === 'f') throwSmoke();
  if (k === 'g') blowWhistle();
}

initInput(onAction);
loadLevel(0);

// Screenshot staging: ?shot=1..4 — see shots.js.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  game.shotMode = shot;
  applyShot(game, shot, { loadLevel, tileCenter });
  window.__shotReady = true;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  ctx.clearRect(0, 0, 1280, 720);
  if (game.screen === 'title') {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
    drawScreen(ctx, game, 'title', [
      'Six floors. Eighteen relics. One vault that must never see you.',
      'Sneak through vision cones, toss coins, vanish in smoke,',
      'and slip out the exit with every relic — unseen.',
      '',
      'WASD / arrows move · SHIFT sneak · Q coin · F smoke · G whistle',
      'E pickup · R restart · M mute · P pause',
    ]);
    game.screenHint = 'Press ENTER to begin the heist';
  } else if (game.screen === 'briefing') {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
    drawScreen(ctx, game, game.def.name, [
      game.def.sub,
      '',
      `Guards: ${game.guards.length}  ·  Cameras: ${game.cameras.length}  ·  Lasers: ${game.lasers.length}`,
      'Collect all 3 relics ◆ to unlock the exit, then reach it unseen.',
      'Shadows slow detection. Lamplight speeds it. Running is loud.',
    ]);
    game.screenHint = 'Press ENTER to begin the heist';
  } else if (game.screen === 'paused') {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
    drawScreen(ctx, game, 'PAUSED', ['Take a breath. The guards wait for no one — except now.']);
    game.screenHint = 'Press P to resume · R to restart floor';
  } else if (game.screen === 'clear') {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
    drawScreen(ctx, game, 'FLOOR CLEARED', [
      game.def.name + '  ·  Rating: ' + game.rating,
      'Floor score: ' + game.levelScore + '   ·   Total: ' + game.totalScore,
      '',
      'The vault never knew you were there.',
    ]);
    game.screenHint = 'Press ENTER for the next floor';
  } else if (game.screen === 'caught') {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
    drawScreen(ctx, game, 'CAUGHT!', [
      'A guard got a good look at you. The vault keeps its gold — this time.',
      '',
      'Floor: ' + game.def.name,
    ]);
    game.screenHint = 'Press R to retry this floor';
  } else if (game.screen === 'win') {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
    drawScreen(ctx, game, 'THE GILDED VAULT IS YOURS', [
      'All six floors cleared. Eighteen relics. Final rating: ' + game.rating,
      'Total score: ' + game.totalScore + '   ·   Alarms raised: ' + game.alerts,
      '',
      'Nightshade vanishes into the night — unseen, as always.',
    ]);
    game.screenHint = 'Press ENTER to play again · R to restart';
  } else {
    drawWorld(ctx, game);
    drawHUD(ctx, game);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose a small handle for the screenshot harness / debugging.
window.__game = game;
