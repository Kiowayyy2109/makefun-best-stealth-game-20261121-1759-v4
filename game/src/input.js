// input.js — keyboard state. WASD/arrows move, Shift sneak, Q coin, F smoke,
// G whistle, E interact, R restart, M mute, P/Esc pause, Enter/Space advance.
export const keys = {};

export function initInput(onAction) {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (e.repeat) return;
    keys[k] = true;
    if (onAction) onAction(k, e);
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
}

export function moveVector() {
  let x = 0, y = 0;
  if (keys['a'] || keys['arrowleft']) x -= 1;
  if (keys['d'] || keys['arrowright']) x += 1;
  if (keys['w'] || keys['arrowup']) y -= 1;
  if (keys['s'] || keys['arrowdown']) y += 1;
  if (x && y) { x *= 0.7071; y *= 0.7071; }
  return { x, y };
}

export function sneaking() {
  return !!(keys['shift']);
}
