# Gameplay Balance Design — UGA Grad Survivor

**Date:** 2026-03-19
**Status:** Approved

## Goals

1. Bring defense rate into target range: **40% (hardest combo) – 70% (easiest combo)**, overall ~50–55%
2. Redistribute death endings to a realistic PhD distribution:
   - burnt_out: ~35% of deaths (down from 60%)
   - hospitalized: ~20% (down from 27%)
   - mastered_out: ~20% (up from 8%)
   - broke: ~15% (up from ~0%)
   - disappeared: ~10% (up from ~5%)

## Simulation Baseline (2000 runs/combo, random strategy)

| Metric | Current | Target |
|---|---|---|
| Overall defense rate | 59.3% | ~50–55% |
| Easiest combo (overachiever+mentor) | 99.4% | ~70% |
| Hardest combo (fun_haver+new_pi) | 25.8% | ~40% |
| Spread | 73.6 pp | ~30 pp |
| burnt_out share of deaths | 60% | ~35% |
| broke share of deaths | ~0% | ~15% |
| disappeared share of deaths | ~5% | ~10% |

## Root Causes Identified

- **Wallet floor bug:** `wallet = max(wallet, 5)` runs before the `broke` ending check → broke is mechanically impossible
- **Overachiever perk:** rescues ANY stat below 20 every 3 cards — universal safety net, no stat can actually hit 0
- **Global student:** starts with bonds=94 (near-max) and late-game mind drain doesn't start until semester 8
- **Fun haver:** research gains are halved, making quals difficult to pass
- **Mentor PI:** buffers ALL negative advisor effects by +3, neutralizing small hits entirely
- **No ongoing wallet/bonds pressure:** no passive drains create financial or social attrition over time

## Changes

### 1. Fix Wallet Floor Bug (`engine.js`)

Remove the line:
```js
if (stats.wallet < 5) stats.wallet = 5;
```

The passive drain loop already only affects `mind` and `body` when wallet is low — it does not drain wallet itself. Wallet can only reach 0 from card effects, which is the intended broke mechanic.

### 2. Add Wallet Passive Drain (`engine.js`)

Add a "cost of living" drain: subtract 1 from wallet each time the semester advances. This is exactly once per semester, triggered at the existing `gameState.semester++` block (line 253 in `engine.js`), before the ending check.

```js
// After gameState.semester++ (line 253), before startNextSemester():
gameState.st.wallet = Math.max(0, gameState.st.wallet - 1);
// Note: the broke ending check (line 244) runs on the NEXT card, so a wallet=0
// from this drain will be caught then. Acceptable — semester transitions are
// not a gameplay moment where immediate death feels right.
```

This gives wallet a slow bleed of ~10 points over a full 10-semester game.

### 3. Add Late-Game Bonds Drain (`engine.js`)

Add a "PhD isolation" passive: subtract 1 from bonds per card starting semester 6.

```js
if (gameState.semester >= 6) {
    stats.bonds = Math.max(0, stats.bonds - 1);
}
```

This is mild individually but compounds with the existing `bonds < 20 → mind/body drain` cascade, making disappeared a realistic late-game outcome.

### 4. Overachiever Perk — Rescue Mind Only (`engine.js`, `applyPerk`)

**Current** (engine.js lines 195-201): Every 3 total cards, finds all non-research stats below 20 and boosts a random one by +3.
**Change:** Replace the `s !== 'research'` filter with `s === 'mind'` — only rescue mind.

```js
// engine.js line 196 — change filter from:
const weakStats = Object.entries(gameState.st).filter(([s, v]) => v < 20 && s !== 'research');
// To:
const weakStats = Object.entries(gameState.st).filter(([s, v]) => v < 20 && s === 'mind');
```

Thematically: overachievers push through mental strain but are still vulnerable to physical collapse, financial pressure, and social isolation. The `totalCards % 3` trigger (line 195) and +3 bonus (line 199) are unchanged.

### 5. Global Student — Weaken Bonds Protection & Earlier Mind Drain (`engine.js`)

- **Bonds loss halving perk:** change from `Math.ceil(delta / 2)` (50% reduction) to `Math.ceil(delta * 0.75)` (25% reduction)
- **Late-game mind drain:** begins at semester **6** (was 8)

The root cause is not starting bonds (which is 55 — near the middle). It's the bonds-loss-halving perk that causes bonds to accumulate to ~94 by game end, making disappeared impossible. Reducing the perk from 50% reduction to 25% reduction keeps the thematic flavor (tight-knit community softens social losses) while allowing bonds to actually fall. The earlier mind drain starts the visa-stress pressure two semesters sooner.

### 6. Fun Haver — Soften Research Penalty (`engine.js`, `applyPerk`)

**Current:** research gains are `Math.ceil(delta / 2)` (~50% of normal, rounds up — a +1 card still gives +1)
**Change:** `Math.max(1, Math.floor(delta * 0.75))` when delta > 0 (~75% of normal)

The `Math.max(1, ...)` guard preserves the current behavior that any positive research gain is at least +1, preventing small cards from being zeroed out (e.g., `Math.floor(1 * 0.75) = 0` without the guard). Quals remain achievable with active play, but research is still a meaningful disadvantage for this archetype.

### 7. Gym Bro — Lower Body Floor (`engine.js`)

**Current:** `if (stats.body < 25) stats.body = 25`
**Change:** `if (stats.body < 15) stats.body = 15`

Body resilience is preserved thematically, but extreme body drain can now lead to hospitalized. Reduces the 96% burnt_out death dominance for this archetype.

### 8. Mentor PI — Reduce Advisor Buffer (`engine.js`, `applyPIPerk`)

**Current:** negative effects on advisor cards are buffered by +3: `Math.min(delta + 3, 0)`
**Change:** buffer reduced to +1: `Math.min(delta + 1, 0)`

Mentor still softens advisor card damage (thematically correct) but no longer neutralizes small hits entirely.

## Files Changed

| File | Changes |
|---|---|
| `engine.js` | Wallet floor removal, wallet drain, bonds drain, overachiever perk, gym bro floor, fun haver penalty, global student perk + drain, mentor buffer |

## Risks & Watch Points

- **fun_haver + new_pi** (currently 25.8%) should land near 40% after fun haver research buff. If it falls below 35%, consider reducing new_pi's `research * 0.8` ghost-equivalent penalty.
- **ghost PI** (currently 62.2%) expected to drop naturally from passive drains. If it stays above 65%, add a mild ghost-specific bonds drain (no advisor support = social isolation).
- **Wallet drain timing:** applying once per semester means early-game players won't feel it much. If broke still doesn't fire enough, increase to -2 per semester.
- **Neurodivergent watch:** all mind changes are ×1.5 for this archetype. The new bonds drain (sem 6+) can cascade into mind drain (bonds < 20 → mind -2). Monitor that neurodivergent doesn't drop below 40% after all changes are applied.
- **Post-implementation re-simulation required:** run 2000 games/combo after all 8 changes are applied together before shipping. Confirm all combos land in the 40–70% range and broke/disappeared shares are visible.
- Do not change milestone card effects or save version — out of scope for this pass.
