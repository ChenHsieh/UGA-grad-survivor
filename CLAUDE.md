# UGA Grad Survivor — Claude Context

A Reigns-style card game about surviving a Bioinformatics PhD at UGA. Single-player, browser-based, no build step.

## Dev Server

```
python3 -m http.server 8765
```

## Deploying

Push to the branch and let GitHub Pages build it. Do not publish preview
artifacts — the Pages URL is the preview.

## Framing

This is a comedy about the texture of a bioinformatics PhD, not an advocacy
piece about pay. Money is one of four survival stats, not the thesis. Avoid
pinning copy to a specific stipend figure or any other number that dates —
the game outlives the number.

## File Structure

```
index.html              # Shell — loads all scripts, no game logic
css/style.css           # All styles
js/
  art.js                # Isotype pictogram system — all card and interface marks
  engine.js             # Game loop: drawCard(), choose(), applyPerk(), applyPIPerk()
  ui.js                 # All rendering
  controls.js           # Input handling (click, keyboard, swipe)
  data/
    archetypes.js       # ARCHETYPE_DATA
    pi-data.js          # PI_DATA
    cards-phase1.js     # Semesters 1–2 (19 cards)
    cards-phase2.js     # Semesters 3–6 (97 cards)
    cards-phase3.js     # Semesters 7–10 (24 cards)
    cards-universal.js  # Always available (39 cards)
    cards-exclusive.js  # Archetype & PI exclusive cards (42 cards)
    cards-callback.js   # Unlocked by prior choices (6 cards)
    cards-milestone.js  # Milestone events (6 cards)
tools/
  lint-cards.js         # Text budget + art coverage check — run before committing
simulation/
  simulation.ipynb      # Monte Carlo balance simulator
```

Run `node tools/lint-cards.js` after touching card data. It fails the budget
below and catches motifs referenced but undefined.

**Total: 233 cards**

## Art

There are no emoji in the interface. Every mark is an inline SVG from `js/art.js`,
drawn in the style of Otto Neurath and Gerd Arntz's Isotype (1925-40):

- **Solid filled silhouettes, never outline strokes.** Detail is carried by the
  gap between shapes. A 2px-stroke outline set is the current template default
  and reads as generic; it also disappears at the 14px stat bar.
- Flat front or profile view, no perspective, no shading.
- **Quantity is repetition of a unit**, never one symbol scaled up — five coins,
  not a bigger coin.
- Related meanings are small additions to a shared base figure (`artFigure`).
- Everything is `fill="currentColor"`, so all six themes work with no per-theme
  asset.

Card art is keyed to `card.tag`, so ~30 motifs cover all 233 cards, and each is
seeded from the card id so cards sharing a motif never draw alike (233 cards →
224 distinct drawings). `ART_CARD` overrides the tag for signature cards.

| Function | Returns |
|---|---|
| `cardArt(card)` | the card's 64×64 mark |
| `statIcon(key)` | 24×24 mark for a stat |
| `endingIcon(id)`, `archIcon(key)`, `piIcon(key)` | 64×64 marks |

**Adding a motif:** add it to `ART_MOTIFS`, then map tags to it in `ART_TAG`. It
must take the seeded `r()` and vary its output — a motif that ignores `r()` makes
every card sharing it identical. A startup guard logs any motif named in
`ART_TAG`/`ART_CARD` but missing from `ART_MOTIFS`.

## Card Text Budget

Card text is the main pacing lever — players read every word of every card.

- **Body: 30 words hard cap**, aim for ~24. Two sentences.
- **Choice labels: 22 characters hard cap**, aim for ~17. The label is the verb of
  the choice, not a restatement of the situation.
- Don't put stat hints in labels (`(move stress)`) — `fxHints()` already renders
  the affected stats as icon arrows under each button.

## Adding New Cards

Add to the appropriate file in `js/data/`. Card schema:

```js
{
  id: 'unique_snake_case_id',
  tag: "Tag Label",   // also picks the card's art — see ART_TAG in js/art.js
  title: "Card Title",
  body: "Card body text.",
  cL: "Left choice label",
  cR: "Right choice label",
  eL: { mind: +10, research: +5, bonds: -5 },
  eR: { body: -10, wallet: +3 },
  // optional:
  minSem: 3,
  maxSem: 8,
  exclusive: 'vibe_coder',           // archetype key — only this archetype draws it
  excludeArchetype: 'global_student', // archetype key — every archetype BUT this one
  piExclusive: 'micromanager'        // PI type key
}
```

Stat keys: `mind`, `body`, `wallet`, `bonds`, `research`, `network`

## engine.js Key Functions

| Function | Line | Purpose |
|---|---|---|
| `drawCard()` | 59 | Build card pool, serve milestones |
| `choose(side)` | 123 | Apply effects, passive drains, ending checks |
| `selectPI()` | 319 | PI selection after rotation |
| `applyPerk()` | 329 | Archetype perk multipliers |
| `applyPIPerk()` | 372 | PI perk multipliers |

`commitRun()` in `ui.js` persists a finished run to `save` — it is guarded by
`gameState.runCommitted` and must be called before any HTML that reads `save`.

## Card Draw Rules (`drawCard()`)

- A phase deck only draws inside its own semester window — phase 1 is semesters
  1–2, phase 2 is 3–6, phase 3 is 7–10. **A `minSem`/`maxSem` outside that
  window makes the card unreachable**; the linter fails on it.
- **Semester 1 is the establishing act.** It draws from the phase-1 deck alone —
  no universal, exclusive or callback cards. Those three would otherwise swamp
  it: universal outnumbers phase-1 34 to 17, and exclusives enter at 2x weight.
- The first card of a run is always one flagged `opener: true`. Without it the
  game's thesis card was a 1-in-51 shot at the top of a run.
- Callbacks need distance from their setup card, so they are also held back
  until semester 2.
- `excludeArchetype` drops a card for one archetype. Used where a card would
  contradict that archetype's own premise — `side_gig` and `unpaid_summer` offer
  paid outside work the game has already said an F-1 student cannot take.

## Game Mechanics

### Stats (0–100)
- `mind` — Hits 0 → **Burnt Out**
- `body` — Hits 0 → **Hospitalized**
- `wallet` — Hits 0 → **Broke**
- `bonds` — Hits 0 → **Disappeared**
- `research` — Gated at milestones; hitting 0 does NOT end the game
- `network` — Hidden; affects **Defended** flavor text

`gameState.cause` records *how* a run ended and is read by `renderEnding()` to
pick the Mastered Out copy — the four routes in (failed quals, delayed twice,
short at the defense, out of time) each get their own paragraph and subtitle.

### Passive Drains (per card, in `choose()`)
- `wallet < 20`: Mind −2, Body −2
- `bonds < 20`: Mind −1, Body −1
- `research < 15` && `sem >= 3`: Mind −2
- `research < 15` && `sem >= 5`: Bonds −2
- `global_student` && `sem >= 7`: Mind −2

### Per Semester Advance (in `continueSemester()`)
- Wallet −1 (cost of living)
- `sem >= 6`: Bonds −1 (PhD isolation) — fires once per advance, not per card

### Archetypes (8)
Default: `overachiever`, `vibe_coder`, `fun_haver`, `global_student`, `biologist`
Unlockable: `double_agent` (sem 7), `gym_bro` (hospitalized **or** 3 runs),
`neurodivergent` (burnt_out **or** 5 runs)

Every unlock needs a route that playing well does not close off. Competent play
reaches Hospitalized 0.0% of the time and Burnt Out 2.6%, so ending-only gates
meant improving locked content away.

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
| `ms_defense_sched` | 9 | Schedule, or delay → re-queues after 3 more cards; 2nd delay → mastered_out |
| `ms_defense` | 10 | Research ≥ 30 → Defended; else Mastered Out |

### Save System
- `localStorage` key: `uga_grad_survivor_v2`
- Save schema version: **3** — mismatches reset save data

## Accessibility Floor

Hold these when adding UI — they are verified, not aspirational:

- **Contrast**: `--dim`, `--muted` and `--card-dim` are tuned per theme to clear
  WCAG AA 4.5:1 against that theme's own background. Changing a theme colour
  means re-checking all three.
- **Focus**: `:focus-visible` draws a 3px `--gold` ring. Anything interactive
  must be a `button` or carry `role="button"` + `tabindex="0"`.
- **Reduced motion**: a `prefers-reduced-motion` block neutralises all animation.
  The low-stat pulse would otherwise loop forever.
- Keyboard nav and Tab share `menuIndex` via `syncMenuIndex()` — a card that is
  focused is the card Space selects.

## Do Not Change
- Milestone card effects — difficulty curve is calibrated
- Save version (bump + add migration only when `gameState` schema changes)
- Perk application order in `choose()`: card effects → archetype perk → PI perk
