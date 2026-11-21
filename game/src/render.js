// render.js — all drawing: textured floors, props, dynamic lighting, vision
// cones, minimap and HUD. Canvas 2D only, no images.
import { TILE, COLS, ROWS } from './levels.js';

const W = 1280, H = 720;
const OX = 0, OY = 72; // playfield offset (HUD bar occupies the top 72px)

export function drawWorld(ctx, game) {
  const { level, def } = game;
  drawFloor(ctx, def, level);
  drawExit(ctx, game);
  drawRelics(ctx, game);
  drawProps(ctx, def, level);
  drawLamps(ctx, game);
  drawLasers(ctx, game);
  drawCoins(ctx, game);
  drawSmokes(ctx, game);
  drawGuards(ctx, game);
  drawCameras(ctx, game);
  drawPlayer(ctx, game);
  drawDarkness(ctx, game);
  drawCones(ctx, game);
  drawNoiseRings(ctx, game);
}

function drawFloor(ctx, def, level) {
  ctx.fillStyle = def.floor;
  ctx.fillRect(0, OY, W, H - OY);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE, py = OY + y * TILE;
      const key = x + ',' + y;
      if (level.walls.has(key)) continue;
      // checker marble / tile texture
      ctx.fillStyle = (x + y) % 2 === 0 ? def.floor : def.floor2;
      ctx.fillRect(px, py, TILE, TILE);
      // carpet runner down the middle
      if (x >= 14 && x <= 17) {
        ctx.fillStyle = def.carpet;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = def.trim;
        if (x === 14) ctx.fillRect(px, py, 3, TILE);
        if (x === 17) ctx.fillRect(px + TILE - 3, py, 3, TILE);
      }
      // subtle grout lines
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      // shadow-pool tiles: cool dark blue
      if (level.shadows.has(key)) {
        ctx.fillStyle = 'rgba(20,30,70,0.45)';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = 'rgba(120,160,255,0.25)';
        ctx.font = '11px sans-serif';
        ctx.fillText('·', px + 8, py + 14);
      }
    }
  }
  // walls
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!level.walls.has(x + ',' + y)) continue;
      const px = x * TILE, py = OY + y * TILE;
      ctx.fillStyle = def.wall;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = def.wallTop;
      ctx.fillRect(px, py, TILE, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(px, py + 8, TILE, 3);
    }
  }
}

function propDraw(ctx, kind, px, py) {
  const cx = px + 20, cy = OY + py + 20;
  ctx.save();
  if (kind === 'C') { // crate
    ctx.fillStyle = '#7a5a28'; ctx.fillRect(px + 4, OY + py + 4, 32, 32);
    ctx.strokeStyle = '#4a3512'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, OY + py + 4, 32, 32);
    ctx.beginPath(); ctx.moveTo(px + 4, OY + py + 4); ctx.lineTo(px + 36, OY + py + 36);
    ctx.moveTo(px + 36, OY + py + 4); ctx.lineTo(px + 4, OY + py + 36); ctx.stroke();
  } else if (kind === 'D') { // desk
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(px + 2, OY + py + 6, 36, 26);
    ctx.fillStyle = '#7a5228'; ctx.fillRect(px + 2, OY + py + 6, 36, 6);
    ctx.fillStyle = '#e8d8a0'; ctx.fillRect(px + 10, OY + py + 12, 12, 8);
    ctx.fillStyle = '#2a4a6b'; ctx.fillRect(px + 24, OY + py + 14, 8, 6);
  } else if (kind === 'B') { // bookshelf
    ctx.fillStyle = '#3a2412'; ctx.fillRect(px + 3, OY + py + 2, 34, 36);
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = ['#a83232', '#3268a8', '#32a852', '#c8a832', '#7a32a8'][(r + i) % 5];
        ctx.fillRect(px + 6 + i * 6, OY + py + 6 + r * 11, 4, 9);
      }
    }
  } else if (kind === 'P') { // plant
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(cx - 7, cy + 6, 14, 10);
    ctx.fillStyle = '#2e7a32';
    ctx.beginPath(); ctx.arc(cx - 7, cy - 4, 9, 0, 7); ctx.arc(cx + 7, cy - 4, 9, 0, 7); ctx.arc(cx, cy - 12, 10, 0, 7); ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath(); ctx.arc(cx, cy - 8, 6, 0, 7); ctx.fill();
  } else if (kind === 'S') { // statue
    ctx.fillStyle = '#b8b0a0'; ctx.fillRect(cx - 9, cy + 8, 18, 8);
    ctx.fillStyle = '#d8d0c0';
    ctx.beginPath(); ctx.arc(cx, cy - 2, 9, 0, 7); ctx.fill();
    ctx.fillRect(cx - 5, cy + 4, 10, 6);
    ctx.fillStyle = '#8a8070'; ctx.beginPath(); ctx.arc(cx - 3, cy - 4, 2, 0, 7); ctx.arc(cx + 3, cy - 4, 2, 0, 7); ctx.fill();
  } else if (kind === 'H') { // hedge
    ctx.fillStyle = '#1e4d24';
    ctx.beginPath(); ctx.arc(cx - 8, cy, 11, 0, 7); ctx.arc(cx + 8, cy, 11, 0, 7); ctx.arc(cx, cy - 8, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#2e7a32';
    ctx.beginPath(); ctx.arc(cx - 5, cy - 4, 7, 0, 7); ctx.arc(cx + 6, cy - 2, 6, 0, 7); ctx.fill();
  } else if (kind === 'T') { // pillar
    ctx.fillStyle = '#9a8f78'; ctx.fillRect(cx - 11, cy - 14, 22, 28);
    ctx.fillStyle = '#c8bda0'; ctx.fillRect(cx - 13, cy - 16, 26, 5); ctx.fillRect(cx - 13, cy + 11, 26, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - 11, cy - 11, 22, 4);
  } else if (kind === 'F') { // fountain
    ctx.fillStyle = '#7a8a9a'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a90c8'; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#9ad0f0'; ctx.beginPath(); ctx.arc(cx, cy - 2, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(cx - 2, cy - 14, 4, 8);
  }
  ctx.restore();
}

function drawProps(ctx, def, level) {
  for (const [key, kind] of level.cover) {
    const [x, y] = key.split(',').map(Number);
    propDraw(ctx, kind, x * TILE, y * TILE);
  }
}

function drawLamps(ctx, game) {
  for (const l of game.level.lamps) {
    const cx = l.x * TILE + 20, cy = OY + l.y * TILE + 20;
    ctx.fillStyle = '#3a2a12';
    ctx.fillRect(cx - 2, cy - 4, 4, 16);
    const flick = 0.85 + Math.sin(game.time * 7 + l.x * 3) * 0.08;
    ctx.fillStyle = `rgba(255,210,110,${flick})`;
    ctx.beginPath(); ctx.arc(cx, cy - 8, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(cx, cy - 8, 3.5, 0, 7); ctx.fill();
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const cx = e.x * TILE + 20, cy = OY + e.y * TILE + 20;
  const open = game.relicsGot >= 3;
  const pulse = 0.5 + Math.sin(game.time * 4) * 0.3;
  ctx.save();
  if (open) {
    ctx.fillStyle = `rgba(80,255,160,${0.25 + pulse * 0.25})`;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.fill();
  }
  ctx.fillStyle = open ? '#2ee88a' : '#5a6a7a';
  ctx.fillRect(cx - 16, cy - 16, 32, 32);
  ctx.fillStyle = open ? '#0a3a22' : '#1a2530';
  ctx.fillRect(cx - 11, cy - 11, 22, 22);
  ctx.fillStyle = open ? '#baffdc' : '#8a9aaa';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCK', cx, cy - 22);
  if (!open) {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('🔒', cx, cy + 5);
  } else {
    ctx.fillStyle = '#baffdc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('→', cx, cy + 6);
  }
  ctx.restore();
}

function drawRelics(ctx, game) {
  for (const r of game.level.relics) {
    if (r.taken) continue;
    const cx = r.x * TILE + 20, cy = OY + r.y * TILE + 20;
    const bob = Math.sin(game.time * 3 + r.x) * 3;
    ctx.save();
    ctx.fillStyle = 'rgba(255,215,74,0.25)';
    ctx.beginPath(); ctx.arc(cx, cy + bob, 18, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12 + bob); ctx.lineTo(cx + 9, cy + bob); ctx.lineTo(cx, cy + 12 + bob); ctx.lineTo(cx - 9, cy + bob);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12 + bob); ctx.lineTo(cx + 4, cy + bob); ctx.lineTo(cx, cy + 12 + bob); ctx.lineTo(cx - 4, cy + bob);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawLasers(ctx, game) {
  for (const l of game.lasers) {
    const blink = Math.sin(game.time * 3 + l.phase) > -0.6;
    if (!blink) continue;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,40,60,0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff283c'; ctx.shadowBlur = 10;
    ctx.beginPath();
    if (l.dir === 'v') { ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y + l.len * TILE); }
    else { ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len * TILE, l.y); }
    ctx.stroke();
    ctx.fillStyle = '#ff283c';
    ctx.beginPath(); ctx.arc(l.x, l.y, 5, 0, 7); ctx.fill();
    ctx.restore();
  }
}

function drawCoins(ctx, game) {
  for (const c of game.coins) {
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(c.x, OY + c.y, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#a8842a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c.x, OY + c.y, 6, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,120,0.3)';
    ctx.beginPath(); ctx.arc(c.x, OY + c.y, c.ring, 0, 7); ctx.stroke();
  }
}

function drawSmokes(ctx, game) {
  for (const s of game.smokes) {
    const g = ctx.createRadialGradient(s.x, OY + s.y, 4, s.x, OY + s.y, s.r);
    g.addColorStop(0, 'rgba(200,200,210,0.85)');
    g.addColorStop(1, 'rgba(200,200,210,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, OY + s.y, s.r, 0, 7); ctx.fill();
  }
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    const cx = g.x, cy = OY + g.y;
    ctx.save();
    // body: dark uniform figure with helmet
    ctx.fillStyle = g.stats.color;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.stroke();
    ctx.fillStyle = g.stats.helmet;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
    // facing tick
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(g.angle) * 9, cy + Math.sin(g.angle) * 9);
    ctx.lineTo(cx + Math.cos(g.angle) * 20, cy + Math.sin(g.angle) * 20);
    ctx.stroke();
    // elite gold trim / heavy bulk
    if (g.type === 'elite') { ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, 7); ctx.stroke(); }
    if (g.type === 'heavy') { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 5, 0, 7); ctx.fill(); }
    // suspicion arc + mark above head
    if (g.suspicion > 3) {
      ctx.strokeStyle = g.suspicion >= 100 ? '#ff4040' : g.suspicion >= 45 ? '#ffb020' : '#ffe94a';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, 21, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2); ctx.stroke();
    }
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    if (g.state === 'alert' || g.state === 'chase') { ctx.fillStyle = '#ff4040'; ctx.fillText('!', cx, cy - 26); }
    else if (g.state === 'wary' || g.state === 'search') { ctx.fillStyle = '#ffb020'; ctx.fillText('?', cx, cy - 26); }
    ctx.restore();
  }
}

function drawCameras(ctx, game) {
  for (const cam of game.cameras) {
    const cx = cam.x, cy = OY + cam.y;
    ctx.save();
    ctx.fillStyle = '#22242e';
    ctx.fillRect(cx - 9, cy - 6, 18, 12);
    ctx.fillStyle = cam.spotted > 60 ? '#ff4040' : '#c8d0e0';
    ctx.beginPath(); ctx.arc(cx + Math.cos(cam.angle) * 10, cy + Math.sin(cam.angle) * 10, 4, 0, 7); ctx.fill();
    // sweep cone (faint, under darkness it is redrawn brighter)
    ctx.fillStyle = cam.spotted > 60 ? 'rgba(255,60,60,0.10)' : 'rgba(255,220,120,0.07)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, cam.range, cam.angle - 0.3, cam.angle + 0.3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  const cx = p.x, cy = OY + p.y;
  ctx.save();
  // shadow ring under player
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 12, 13, 6, 0, 0, 7); ctx.fill();
  // hooded thief: deep violet cloak, pale hood
  ctx.fillStyle = '#5a2a8a';
  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#7a3ab0';
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#f0d8c0';
  ctx.beginPath(); ctx.arc(cx + Math.cos(p.angle) * 3, cy + Math.sin(p.angle) * 3, 5, 0, 7); ctx.fill();
  // direction tick + crouch indicator
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(p.angle) * 8, cy + Math.sin(p.angle) * 8);
  ctx.lineTo(cx + Math.cos(p.angle) * 17, cy + Math.sin(p.angle) * 17);
  ctx.stroke();
  if (p.crouch) {
    ctx.fillStyle = '#8ad0ff';
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SNEAK', cx, cy - 20);
  }
  ctx.restore();
}

function drawDarkness(ctx, game) {
  // Darkness overlay with holes of light: lamps, player radius, exit.
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const o = off.getContext('2d');
  o.fillStyle = 'rgba(6,8,20,0.52)';
  o.fillRect(0, OY, W, H - OY);
  o.globalCompositeOperation = 'destination-out';
  const flick = (l) => 0.85 + Math.sin(game.time * 7 + l.x * 3) * 0.1;
  for (const l of game.level.lamps) {
    const cx = l.x * TILE + 20, cy = OY + l.y * TILE + 20;
    const g = o.createRadialGradient(cx, cy, 8, cx, cy, 110 * flick(l));
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = g;
    o.beginPath(); o.arc(cx, cy, 110 * flick(l), 0, 7); o.fill();
  }
  const px = game.player.x, py = OY + game.player.y;
  const pg = o.createRadialGradient(px, py, 10, px, py, 120);
  pg.addColorStop(0, 'rgba(0,0,0,1)');
  pg.addColorStop(1, 'rgba(0,0,0,0)');
  o.fillStyle = pg;
  o.beginPath(); o.arc(px, py, 120, 0, 7); o.fill();
  if (game.relicsGot >= 3) {
    const e = game.level.exit;
    const ex = e.x * TILE + 20, ey = OY + e.y * TILE + 20;
    const eg = o.createRadialGradient(ex, ey, 8, ex, ey, 100);
    eg.addColorStop(0, 'rgba(0,0,0,1)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = eg;
    o.beginPath(); o.arc(ex, ey, 100, 0, 7); o.fill();
  }
  ctx.drawImage(off, 0, 0);
}

function drawCones(ctx, game) {
  // Cones are drawn ABOVE the darkness so they stay readable.
  for (const g of game.guards) {
    const cx = g.x, cy = OY + g.y;
    const col = g.state === 'alert' || g.state === 'chase' ? '255,50,50'
      : g.state === 'wary' || g.state === 'search' ? '255,176,32' : '255,214,74';
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, g.stats.coneLen);
    grad.addColorStop(0, `rgba(${col},0.34)`);
    grad.addColorStop(1, `rgba(${col},0.05)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, g.stats.coneLen, g.angle - g.stats.coneHalf, g.angle + g.stats.coneHalf);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${col},0.5)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const cam of game.cameras) {
    const cx = cam.x, cy = OY + cam.y;
    const col = cam.spotted > 60 ? '255,60,60' : '255,220,120';
    ctx.fillStyle = `rgba(${col},0.16)`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, cam.range, cam.angle - 0.3, cam.angle + 0.3);
    ctx.closePath(); ctx.fill();
  }
}

function drawNoiseRings(ctx, game) {
  if (!game.noise) return;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(game.noise.x, OY + game.noise.y, game.noise.r * (1 - game.noise.age), 0, 7); ctx.stroke();
}

export function drawHUD(ctx, game) {
  const def = game.def;
  ctx.fillStyle = '#14101f';
  ctx.fillRect(0, 0, W, 72);
  ctx.fillStyle = def.trim;
  ctx.fillRect(0, 70, W, 2);
  ctx.fillStyle = '#f0e8d0';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NIGHTSHADE · The Gilded Vault IV', 16, 28);
  ctx.fillStyle = '#c8b890';
  ctx.font = '15px sans-serif';
  ctx.fillText(def.name, 16, 52, 520);
  // relics
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#ffd94a';
  ctx.fillText('◆'.repeat(game.relicsGot) + '◇'.repeat(3 - game.relicsGot) + '  Relics ' + game.relicsGot + '/3', 560, 30);
  // gadgets
  ctx.fillStyle = '#e8e0c8';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Q coin ×${game.gadgets.coin}   F smoke ×${game.gadgets.smoke}   G whistle ×${game.gadgets.whistle}`, 560, 54);
  // timer + score
  ctx.fillStyle = '#e8e0c8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Time ' + fmtTime(game.elapsed) + '   Score ' + game.score, 1264, 30);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#9ab0d0';
  ctx.fillText('WASD move · Shift sneak · Q/F/G gadgets · R restart · M mute', 1264, 54);
  ctx.textAlign = 'left';
  // detection meter
  const worst = game.guards.reduce((m, g) => Math.max(m, g.suspicion), game.maxCam || 0);
  ctx.fillStyle = '#2a2438';
  ctx.fillRect(16, 640, 0, 0); // (kept for layout clarity)
  drawDetectionBar(ctx, worst, game);
  // alarm banner
  if (game.alarm) {
    ctx.fillStyle = 'rgba(200,20,30,0.9)';
    ctx.fillRect(440, 80, 400, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ALARM — guards converging ⚠', 640, 103);
    ctx.textAlign = 'left';
  }
  drawMinimap(ctx, game);
}

function drawDetectionBar(ctx, worst, game) {
  const x = 16, y = 686, w = 260, h = 16;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#241f33';
  ctx.fillRect(x, y, w, h);
  const col = worst >= 100 ? '#ff4040' : worst >= 45 ? '#ffb020' : '#ffe94a';
  ctx.fillStyle = col;
  ctx.fillRect(x, y, (worst / 100) * w, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(worst >= 100 ? 'SPOTTED!' : worst >= 45 ? 'SUSPICION ' + Math.round(worst) + '%' : 'UNSEEN', x + w + 10, y + 13);
  ctx.fillStyle = '#c8b890';
  ctx.font = '12px sans-serif';
  ctx.fillText('Alerts: ' + game.alerts + '   ·   ' + (game.relicsGot >= 3 ? 'EXIT OPEN — go!' : 'Collect 3 relics to unlock the exit'), x, y + 32);
}

function drawMinimap(ctx, game) {
  const mw = 176, mh = 88, mx = W - mw - 14, my = H - mh - 14;
  ctx.fillStyle = 'rgba(8,10,22,0.82)';
  ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 4, my - 4, mw + 8, mh + 8);
  const sx = mw / (COLS * TILE), sy = mh / (ROWS * TILE);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (game.level.walls.has(x + ',' + y)) {
        ctx.fillStyle = '#6a6252';
        ctx.fillRect(mx + x * TILE * sx, my + y * TILE * sy, TILE * sx + 0.5, TILE * sy + 0.5);
      }
    }
  }
  // exit
  const e = game.level.exit;
  ctx.fillStyle = game.relicsGot >= 3 ? '#2ee88a' : '#5a6a7a';
  ctx.fillRect(mx + e.x * TILE * sx - 2, my + e.y * TILE * sy - 2, 5, 5);
  // relics
  ctx.fillStyle = '#ffd94a';
  for (const r of game.level.relics) {
    if (!r.taken) ctx.fillRect(mx + r.x * TILE * sx - 1, my + r.y * TILE * sy - 1, 3, 3);
  }
  // cameras
  ctx.fillStyle = '#ff8080';
  for (const c of game.cameras) ctx.fillRect(mx + c.x * sx - 1, my + c.y * sy - 1, 3, 3);
  // guards with facing ticks
  for (const g of game.guards) {
    ctx.fillStyle = g.state === 'alert' || g.state === 'chase' ? '#ff4040' : g.state === 'wary' ? '#ffb020' : '#ffe94a';
    ctx.beginPath(); ctx.arc(mx + g.x * sx, my + g.y * sy, 3, 0, 7); ctx.fill();
  }
  // player
  ctx.fillStyle = '#b06ae8';
  ctx.beginPath(); ctx.arc(mx + game.player.x * sx, my + game.player.y * sy, 3.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(mx + game.player.x * sx, my + game.player.y * sy, 3.5, 0, 7); ctx.stroke();
  ctx.fillStyle = '#c8b890';
  ctx.font = '10px sans-serif';
  ctx.fillText('MAP', mx, my - 6);
}

function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export function drawScreen(ctx, game, kind, lines) {
  ctx.fillStyle = 'rgba(8,6,18,0.88)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(kind === 'title' ? 'NIGHTSHADE' : kind, 640, 190);
  if (kind === 'title') {
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('— The Gilded Vault IV —', 640, 228);
  }
  ctx.fillStyle = '#e8e0c8';
  ctx.font = '17px sans-serif';
  let y = 280;
  for (const ln of lines) { ctx.fillText(ln, 640, y); y += 30; }
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(game.screenHint || '', 640, y + 26);
  ctx.textAlign = 'left';
}
