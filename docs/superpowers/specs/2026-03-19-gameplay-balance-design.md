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

Add a "cost of living" drain: subtract 1 from wallet every 3 cards (once per semester). This gives wallet a slow bleed, making financial management an active concern.

```js
if (gameState.cardCount % 3 === 0) {
    stats.wallet = Math.max(0, stats.wallet - 1);
}
```

Apply before the ending check so it can trigger broke.

### 3. Add Late-Game Bonds Drain (`engine.js`)

Add a "PhD isolation" passive: subtract 1 from bonds per card starting semester 6.

```js
if (gameState.semester >= 6) {
    stats.bonds = Math.max(0, stats.bonds - 1);
}
```

This is mild individually but compounds with the existing `bonds < 20 → mind/body drain` cascade, making disappeared a realistic late-game outcome.

### 4. Overachiever Perk — Rescue Mind Only (`engine.js`, `applyPerk`)

**Current:** Every 3 cards, if any of `mind/body/wallet/bonds` is below 20, boost that stat by +3.
**Change:** Only rescue `mind`. Body, wallet, and bonds are no longer protected.

```js
// In the overachiever post-choice block:
if (gameState.cardCount % 3 === 0 && stats.mind < 20) {
    stats.mind = Math.min(100, stats.mind + 3);
}
```

Thematically: overachievers push through mental strain but are still vulnerable to physical collapse, financial pressure, and social isolation.

### 5. Global Student — Lower Starting Bonds & Earlier Mind Drain (`js/data/archetypes.js`, `engine.js`)

- **Starting bonds:** 94 → **70**
- **Late-game mind drain:** begins at semester **6** (was 8)

The high starting bonds meant disappeared was nearly impossible for this archetype. The earlier drain makes the final push to defense riskier.

### 6. Fun Haver — Soften Research Penalty (`engine.js`, `applyPerk`)

**Current:** research gains are `Math.ceil(delta / 2)` (~50% of normal)
**Change:** `Math.floor(delta * 0.75)` (~75% of normal)

Quals remain achievable with active play, but research is still a meaningful disadvantage for this archetype.

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
| `engine.js` | Wallet floor removal, wallet drain, bonds drain, overachiever perk, gym bro floor, fun haver penalty, mentor buffer |
| `js/data/archetypes.js` | Global student starting bonds: 94 → 70 |

## Risks & Watch Points

- **fun_haver + new_pi** (currently 25.8%) should land near 40% after fun haver research buff. If it falls below 35%, consider reducing new_pi's `research * 0.8` ghost-equivalent penalty.
- **ghost PI** (currently 62.2%) expected to drop naturally from passive drains. If it stays above 65%, add a mild ghost-specific bonds drain (no advisor support = social isolation).
- **Wallet drain timing:** applying once per semester means early-game players won't feel it much. If broke still doesn't fire enough, increase to -2 per semester.
- Do not change milestone card effects or save version — out of scope for this pass.
