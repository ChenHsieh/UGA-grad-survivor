# UGA Grad Survivor — Claude Context

A Reigns-style card game about surviving a Bioinformatics PhD at UGA. Single-player, browser-based, no build step.

## Dev Server

```
python3 -m http.server 8765
```

## File Structure

```
index.html              # Shell — loads all scripts, no game logic
css/style.css           # All styles
js/
  engine.js             # Game loop: drawCard(), choose(), applyPerk(), applyPIPerk()
  ui.js                 # All rendering
  controls.js           # Input handling (click, keyboard, swipe)
  data/
    archetypes.js       # ARCHETYPE_DATA
    pi-data.js          # PI_DATA
    cards-phase1.js     # Semesters 1–2 (19 cards)
    cards-phase2.js     # Semesters 3–6 (99 cards)
    cards-phase3.js     # Semesters 7–10 (22 cards)
    cards-universal.js  # Always available (32 cards)
    cards-exclusive.js  # Archetype & PI exclusive cards (42 cards)
    cards-callback.js   # Unlocked by prior choices (6 cards)
    cards-milestone.js  # Milestone events (6 cards)
simulation/
  simulation.ipynb      # Monte Carlo balance simulator
```

**Total: 226 cards**

## Adding New Cards

Add to the appropriate file in `js/data/`. Card schema:

```js
{
  id: 'unique_snake_case_id',
  tag: "Tag Label",
  emoji: "🔬",
  title: "Card Title",
  body: "Card body text.",
  cL: "Left choice label",
  cR: "Right choice label",
  eL: { mind: +10, research: +5, bonds: -5 },
  eR: { body: -10, wallet: +3 },
  // optional:
  minSem: 3,
  maxSem: 8,
  exclusive: 'vibe_coder',    // archetype key
  piExclusive: 'micromanager' // PI type key
}
```

Stat keys: `mind`, `body`, `wallet`, `bonds`, `research`, `network`

## engine.js Key Functions

| Function | Line | Purpose |
|---|---|---|
| `drawCard()` | 57 | Build card pool, serve milestones |
| `choose(side)` | 122 | Apply effects, passive drains, ending checks |
| `applyPerk()` | 276 | Archetype perk multipliers |
| `applyPIPerk()` | 320 | PI perk multipliers |
| `selectPI()` | 266 | PI selection after rotation |

## Game Mechanics

### Stats (0–100)
- `mind` — Hits 0 → **Burnt Out**
- `body` — Hits 0 → **Hospitalized**
- `wallet` — Hits 0 → **Broke**
- `bonds` — Hits 0 → **Disappeared**
- `research` — Gated at milestones; hitting 0 does NOT end the game
- `network` — Hidden; affects **Defended** flavor text

### Passive Drains (per card, in `choose()`)
- `wallet < 20`: Mind −3, Body −2
- `bonds < 20`: Mind −2, Body −1
- `research < 20` && `sem >= 3`: Mind −2
- `research < 15` && `sem >= 5`: Bonds −2
- `sem >= 6`: Bonds −1 (PhD isolation)
- `global_student` && `sem >= 6`: Mind −3
- Per semester advance: Wallet −1 (cost of living)

### Archetypes (8)
Default: `overachiever`, `vibe_coder`, `fun_haver`, `global_student`, `biologist`
Unlockable: `double_agent` (sem 7), `gym_bro` (hospitalized), `neurodivergent` (burnt_out)

### PI Types (6)
Default: `micromanager`, `ghost`, `mentor`, `new_pi`
Unlockable: `exploiter` (mastered_out), `dynasty` (defended)

### Milestones
| ID | Sem | Effect |
|---|---|---|
| `ms_rotation` | 1 | PI selection screen |
| `ms_quals` | 4 | Research < 25 → retry (3× max) → mastered_out |
| `ms_committee_1` | 6 | Research < 25 → Mind −10 |
| `ms_committee_2` | 8 | Research < 35 → Mind −15 |
| `ms_defense_sched` | 9 | Schedule or delay defense |
| `ms_defense` | 10 | Research ≥ 30 → Defended; else Mastered Out |

### Endings
🎓 `defended` · 📜 `mastered_out` · 🧠 `burnt_out` · 🏥 `hospitalized` · 💸 `broke` · 👻 `disappeared`

### Save System
- `localStorage` key: `uga_grad_survivor_v2`
- Save schema version: **3** — mismatches reset save data

## Do Not Change
- Milestone card effects — difficulty curve is calibrated
- Save version (bump + add migration only when `gameState` schema changes)
- Perk application order in `choose()`: card effects → archetype perk → PI perk
