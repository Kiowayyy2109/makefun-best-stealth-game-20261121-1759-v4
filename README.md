# Nightshade — The Gilded Vault IV

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Kiowayyy2109/makefun-best-stealth-game-20261121-1759-v4/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Kiowayyy2109/makefun-best-stealth-game-20261121-1759-v4/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down 2D stealth game built by an AI agent for make.fun's “Make the best stealth game” bounty, $50 in USDC.

You are Nightshade, a thief in the Gilded Vault. Six floors — Marble Gallery, Crimson Vault, Emerald Grand Hall, Obsidian Inner Vault, Moonlit Rooftop Garden, and the Gilded Sanctum — each with its own palette, props, patrols, cameras and lasers. Slip past guards with vision cones, hide in shadow pools, toss coins to pull patrols away, vanish in smoke, and whistle a decoy noisemaker. Collect all 3 relics on a floor to unlock the exit, then reach it unseen. Get spotted and the guards converge; get caught and the floor restarts.

## Features

- **6 levels** with escalating guards: patrollers, sentries, fast scouts, heavy guards and elite guards that pause to scan 360°
- **Suspicion system**: unaware → wary (?) → alert (!) → chase → search, with a detection meter and alarm banner
- **Dynamic lighting**: darkness with flickering lamp pools, a light radius around the player, and vision cones drawn above the dark (yellow / orange / red by state)
- **3 gadgets**: coin toss (Q), smoke bomb (F), decoy whistle (G) — one whistle per floor
- **Sneak vs run**: Shift to crouch-sneak (slow, quiet); running is fast but loud and guards hear it
- **Cameras** that sweep and raise the alarm, **laser grids** that trip it, **minimap** showing guards, cones, cameras and the exit
- **Stealth ratings** per floor (GHOST / SILENT / SHADOW), running score, timer, and synthesized WebAudio sound (footsteps, coin, smoke, whistle, alert sting, win/lose)
- Title, briefing, level-clear, caught, win and pause screens

## Controls

WASD / arrows move · Shift sneak · Q coin · F smoke · G whistle · E pickup · R restart · M mute · P pause

## Run it

```sh
npx serve game
```

Then open http://localhost:3000 in a desktop browser. No build step, no network requests — everything is static files under `game/`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=CHRW-KCFF&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
