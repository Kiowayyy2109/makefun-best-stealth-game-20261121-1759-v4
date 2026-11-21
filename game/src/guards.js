// guards.js — guard AI: patrols, vision cones, suspicion, chase, search.
// Guard types: patrol / sentry / heavy / scout / elite.
// States: unaware -> wary (?) -> alert (!) -> chase -> search -> cooldown.
import { TILE, tileCenter } from './levels.js';

export const TYPE_STATS = {
  patrol: { speed: 1.0, coneLen: 190, coneHalf: 0.42, color: '#3a4a6b', helmet: '#8fa3c8', detect: 1.0 },
  sentry: { speed: 0, coneLen: 200, coneHalf: 0.46, color: '#3a4a6b', helmet: '#8fa3c8', detect: 1.1 },
  heavy: { speed: 0.7, coneLen: 230, coneHalf: 0.55, color: '#4a2f3a', helmet: '#c8a24a', detect: 1.25 },
  scout: { speed: 1.8, coneLen: 160, coneHalf: 0.34, color: '#2f4a3a', helmet: '#9ac89a', detect: 0.85 },
  elite: { speed: 0.9, coneLen: 260, coneHalf: 0.62, color: '#1f1f2e', helmet: '#e8c84a', detect: 1.5 },
};

export function makeGuard(cfg, index) {
  const st = TYPE_STATS[cfg.type] || TYPE_STATS.patrol;
  const start = tileCenter(cfg.path[0][0], cfg.path[0][1]);
  const next = cfg.path.length > 1 ? tileCenter(cfg.path[1][0], cfg.path[1][1]) : start;
  return {
    id: index, type: cfg.type,
    path: cfg.path.map(([x, y]) => tileCenter(x, y)),
    wp: cfg.path.length > 1 ? 1 : 0,
    x: start.x, y: start.y,
    angle: Math.atan2(next.y - start.y, next.x - start.x),
    baseSpeed: (cfg.speed || 1.5) * 40 * st.speed,
    speedMul: 1,
    state: 'unaware', // unaware | wary | alert | chase | search
    suspicion: 0, // 0..100
    scanT: 0, scanDir: 1,
    pauseT: 0, searchT: 0, alertT: 0,
    target: null, lastSeen: null,
    investigate: null,
    stuckT: 0,
    stats: st,
  };
}

export function makeCamera(cfg, index) {
  const c = tileCenter(cfg.x, cfg.y);
  return {
    id: index, x: c.x, y: c.y,
    baseAngle: Math.PI / 2, sweep: cfg.sweep || 1.0, range: (cfg.range || 7) * TILE,
    angle: Math.PI / 2, phase: index * 1.7, t: 0, spotted: 0,
  };
}

export function makeLaser(cfg) {
  const c = tileCenter(cfg.x, cfg.y);
  return { x: c.x, y: c.y, dir: cfg.dir, len: cfg.len, on: true, phase: Math.random() * 6 };
}

// Line-of-sight on the tile grid: true when no wall/cover blocks the ray.
export function hasLOS(level, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    const key = tx + ',' + ty;
    if (level.walls.has(key)) return false;
    const prop = level.cover.get(key);
    if (prop === 'C' || prop === 'B' || prop === 'S' || prop === 'T' || prop === 'H' || prop === 'F' || prop === 'D') return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function inSmoke(smokes, x, y) {
  for (const s of smokes) if (Math.hypot(s.x - x, s.y - y) < s.r) return true;
  return false;
}

// Can this guard see the player right now? Returns visibility 0..1.
export function visibility(guard, px, py, level, smokes, player) {
  const dx = px - guard.x, dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.stats.coneLen) return 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.angle)) > guard.stats.coneHalf) return 0;
  if (!hasLOS(level, guard.x, guard.y, px, py)) return 0;
  if (inSmoke(smokes, px, py) || inSmoke(smokes, guard.x, guard.y)) return 0;
  let v = 1 - dist / (guard.stats.coneLen * 1.4);
  if (v < 0.25) v = 0.25;
  // Player modifiers: crouching and shadow pools hide; lamplight exposes.
  if (player.crouch) v *= 0.55;
  const key = Math.floor(px / TILE) + ',' + Math.floor(py / TILE);
  if (level.shadows.has(key)) v *= 0.45;
  let nearLamp = false;
  for (const l of level.lamps) {
    if (Math.hypot(l.x * TILE + 20 - px, l.y * TILE + 20 - py) < 90) { nearLamp = true; break; }
  }
  if (nearLamp) v *= 1.5;
  if (player.running) v *= 1.35;
  return Math.min(1.4, v);
}

export function updateGuard(g, dt, ctx) {
  const { player, level, smokes, time } = ctx;
  const st = g.stats;
  const vis = visibility(g, player.x, player.y, level, smokes, player);
  const wasAlert = g.state === 'alert' || g.state === 'chase';

  // --- suspicion / detection ---
  if (vis > 0) {
    const rate = 34 * st.detect * vis;
    g.suspicion = Math.min(100, g.suspicion + rate * dt);
    g.lastSeen = { x: player.x, y: player.y };
  } else {
    g.suspicion = Math.max(0, g.suspicion - 14 * dt);
  }
  if (g.suspicion >= 100 && g.state !== 'alert' && g.state !== 'chase') {
    g.state = 'alert';
    g.alertT = 0;
    ctx.onSpotted && ctx.onSpotted(g);
  } else if (g.suspicion >= 45 && g.state === 'unaware') {
    g.state = 'wary';
  } else if (g.suspicion < 20 && g.state === 'wary') {
    g.state = 'unaware';
  }

  // --- hearing: running feet and coins pull guards to investigate ---
  if (ctx.noise && !g.investigate && g.state !== 'alert' && g.state !== 'chase') {
    const d = Math.hypot(ctx.noise.x - g.x, ctx.noise.y - g.y);
    if (d < ctx.noise.r) {
      g.investigate = { x: ctx.noise.x, y: ctx.noise.y };
      g.state = 'wary';
      g.suspicion = Math.max(g.suspicion, 40);
    }
  }

  // --- movement by state ---
  const speed = g.baseSpeed * g.speedMul * (g.state === 'chase' ? 1.55 : g.state === 'alert' ? 1.3 : 1);
  if (g.state === 'chase' || g.state === 'alert') {
    g.alertT += dt;
    const tgt = g.lastSeen || { x: player.x, y: player.y };
    if (vis > 0) { g.state = 'chase'; g.alertT = 0; }
    moveToward(g, tgt.x, tgt.y, speed, dt, level);
    if (g.alertT > 4) { g.state = 'search'; g.searchT = 0; }
    if (Math.hypot(player.x - g.x, player.y - g.y) < 26) ctx.onCaught && ctx.onCaught(g);
  } else if (g.state === 'search') {
    g.searchT += dt;
    if (g.lastSeen) moveToward(g, g.lastSeen.x, g.lastSeen.y, speed * 0.8, dt, level);
    if (g.searchT > 5) { g.state = 'unaware'; g.suspicion = 0; g.investigate = null; }
  } else if (g.investigate) {
    const d = Math.hypot(g.investigate.x - g.x, g.investigate.y - g.y);
    if (d < 14) {
      g.pauseT += dt;
      g.angle += dt * 1.2 * g.scanDir;
      if (g.pauseT > 2.2) { g.investigate = null; g.pauseT = 0; g.state = g.suspicion >= 45 ? 'wary' : 'unaware'; }
    } else {
      moveToward(g, g.investigate.x, g.investigate.y, speed, dt, level);
    }
  } else if (g.type === 'sentry') {
    // Sentries stand and sweep; elites pause mid-patrol for a full 360 scan.
    g.scanT += dt;
    g.angle = Math.sin(time * 0.55 + g.id * 1.3) * 1.15 + Math.PI / 2;
  } else if (g.type === 'elite' && g.pauseT > 0) {
    g.pauseT -= dt;
    g.angle += dt * 2.4; // slow 360 scan
    if (g.pauseT <= 0) g.angle = Math.atan2(g.path[g.wp].y - g.y, g.path[g.wp].x - g.x);
  } else {
    const tgt = g.path[g.wp];
    const d = Math.hypot(tgt.x - g.x, tgt.y - g.y);
    if (d < 10) {
      g.wp = (g.wp + 1) % g.path.length;
      if (g.type === 'elite') g.pauseT = 1.6;
      else if (Math.random() < 0.25) g.pauseT = 0.8;
    } else if (g.pauseT > 0) {
      g.pauseT -= dt;
    } else {
      moveToward(g, tgt.x, tgt.y, speed, dt, level);
    }
  }
  if (wasAlert && g.state !== 'alert' && g.state !== 'chase') ctx.onCalmed && ctx.onCalmed(g);
}

function moveToward(g, tx, ty, speed, dt, level) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const nx = g.x + (dx / d) * speed * dt;
  const ny = g.y + (dy / d) * speed * dt;
  // Axis-separated collision so guards slide along walls.
  if (!blocked(level, nx, g.y)) g.x = nx;
  if (!blocked(level, g.x, ny)) g.y = ny;
  g.angle = Math.atan2(dy, dx);
}

export function blocked(level, x, y) {
  const r = 13;
  const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r], [x, y]];
  for (const [px, py] of pts) {
    const key = Math.floor(px / TILE) + ',' + Math.floor(py / TILE);
    if (level.walls.has(key) || level.cover.has(key)) return true;
  }
  return false;
}

export function updateCamera(cam, dt, ctx) {
  cam.t += dt;
  cam.angle = cam.baseAngle + Math.sin(cam.t * 0.7 + cam.phase) * cam.sweep;
  const { player, level, smokes } = ctx;
  const dx = player.x - cam.x, dy = player.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > cam.range) { cam.spotted = Math.max(0, cam.spotted - 20 * dt); return; }
  if (Math.abs(angleDiff(Math.atan2(dy, dx), cam.angle)) > 0.3) { cam.spotted = Math.max(0, cam.spotted - 20 * dt); return; }
  if (!hasLOS(level, cam.x, cam.y, player.x, player.y)) { cam.spotted = Math.max(0, cam.spotted - 20 * dt); return; }
  if (inSmoke(smokes, player.x, player.y)) { cam.spotted = Math.max(0, cam.spotted - 20 * dt); return; }
  cam.spotted = Math.min(100, cam.spotted + 55 * dt);
  if (cam.spotted >= 100) ctx.onCameraAlarm && ctx.onCameraAlarm(cam);
}
