# Balance Patch v0.8 — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Driven by:** 96,000-run Monte Carlo simulation (v0.7 mechanics)

---

## Problem

The v0.4 balance patch overcorrected. The simulation with fully-corrected v0.7 mechanics shows:

- **Overall defense rate: 13.6%** (target: 20–60% per archetype)
- 6 of 8 archetypes below 20% defense rate
- gym_bro at **3.2%**, fun_haver at **8.2%**, double_agent at **7.3%**
- Overachiever at 30.5% — the only archetype near target
- Spread: **45pp** between easiest and hardest combo
- Burnt out dominates deaths at **62%** — mind is the universal chokepoint

Root cause: the v0.4 bonds isolation drain (`−1 per card` from sem 6) fires 3× per semester and compounds with every negative bonds card. Combined with mind-amplifying archetype multipliers (neurodivergent 1.5×, fun_haver 1.3×, vibe_coder social 1.5×), the card pool's naturally negative mind bias produces near-inevitable burnout.

---

## Goals

- All archetypes: 20–60% defense rate (with 3 unlockable "hard mode" archetypes accepted at 17–20%)
- Overall defense rate: ~20–25%
- Spread between easiest/hardest combo: ≤ 20pp
- Preserve archetype identity — no archetype should feel like another one

---

## Changes

### 1a. Passive Drains — changes that stay in `choose()` (`js/engine.js`)

| Drain | Before | After |
|---|---|---|
| Global student visa drain | −3 mind/card from sem 6 | −2 mind/card from sem 7 |
| Low-wallet → mind | −3/card when wallet < 20 | −2/card when wallet < 20 |
| Low-bonds → mind | −2/card when bonds < 20 | −1/card when bonds < 20 |
| Research → mind drain threshold | research < 20, from sem 3 | research < 15, from sem 3 |

**Research drain clarification:** Two research drain conditions currently exist in `choose()`:
- `research < 20 && sem >= 3` → mind −2 ← **change threshold to < 15**
- `research < 15 && sem >= 5` → bonds −2 ← **keep unchanged**

After the change both conditions use `research < 15` — the first one fires from sem 3, the second from sem 5. This effectively collapses the early warning threshold but keeps the bonds cascade.

**Note on neurodivergent multiplier:** The `applyPerk()` change (section 2) reduces the neurodivergent mind multiplier from 1.5× to 1.3×. This reduces both mind damage *and* mind recovery, since the multiplier applies to all mind deltas. The net effect is a survivability improvement because the card pool has a negative mind bias — losses outweigh gains — so the smaller multiplier helps more than it hurts.

### 1b. Bonds Isolation Drain — moves from `choose()` to `continueSemester()` (`js/engine.js`)

**Remove** from `choose()`:
```js
if (gameState.semester >= 6) {
  gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
}
```

**Add** to `continueSemester()`, after the existing wallet drain and broke check (currently lines ~271–272), following the same pattern:
```js
// PhD isolation: bonds −1 per semester from sem 6 onward
if (gameState.semester >= 6) {
  gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
  if (gameState.st.bonds <= 0) {
    gameState.phase = 'ending';
    gameState.ending = 'disappeared';
    gameState.cause = 'Bonds';
    return render();
  }
}
```

This fires once per semester advance (5 times over semesters 6–10) instead of once per card (15 times).

### 2. Archetype Multiplier Rebalance — `js/engine.js` `applyPerk()`

| Archetype | Stat | Before | After | Note |
|---|---|---|---|---|
| fun_haver | mind losses | 1.3× | 1.0× | Remove penalty — they don't overthink it |
| vibe_coder | social card losses | 1.5× | 1.3× | Still penalized, just survivably so |
| neurodivergent | mind (all changes) | 1.5× | 1.3× | Reduces both damage and recovery; net positive due to card pool bias |
| gym_bro | wallet losses | 1.3× | 1.15× | Low starting wallet + 1.3× compounded too fast |
| gym_bro | mind losses | 1.3× | 1.15× | Same |
| double_agent | random drain | −2/card | −1/card | −2 to a random stat every card ≈ −60 total over a run |

### 3. Archetype Starting Stats — `js/data/archetypes.js`

| Archetype | Stat | Before | After |
|---|---|---|---|
| gym_bro | wallet | 35 | 52 |
| gym_bro | mind | 40 | 52 |
| vibe_coder | body | 40 | 47 |
| vibe_coder | mind | 55 | 60 |
| fun_haver | mind | 40 | 50 |
| fun_haver | body | 55 | 58 |
| double_agent | mind | 50 | 55 |
| double_agent | bonds | 50 | 55 |
| double_agent | wallet | 55 | 58 |
| neurodivergent | mind | 55 | 65 |

### 4. Archetype Description Fixes — `js/data/archetypes.js`

| Archetype | Fix |
|---|---|
| global_student | Update description: "Visa stress hits Mind hard in **semesters 7–10**" (was "8–10"; code now fires from sem 7) |
| gym_bro | Update description: "Body can't drop below **15**" (was "25"; code already enforces 15 — description was stale) |

### 5. New Simulation Notebook — `simulation/simulation-v2.ipynb`

**Structure:**
- Cell 0: Markdown header — "UGA Grad Survivor v0.8 Balance Simulation"
- Cell 1: Imports + JS data loader (port the existing `load_js_array` / `load_js_dict` helpers)
- Cell 2: v0.8 game engine — port `choose()`, `applyPerk()`, `applyPIPerk()`, `continueSemester()` exactly as they exist in the JS after this patch. No generalizations. Comment each perk rule with the JS line number.
- Cell 3: Baseline run with v0.7 mechanics (the simulation that showed 13.6%)
- Cell 4: v0.8 run — 96,000 games (2,000 × 8 archetypes × 6 PIs)
- Cell 5: Results — archetype × PI heatmap, archetype bar chart, death cause breakdown
- Cell 6: Balance summary with flagging logic (same format as original notebook)

**Preservation:** Original `simulation/simulation.ipynb` is left unchanged — it documents the v0.4 baseline state.

**Dependencies:** Add `simulation/requirements.txt` listing `pandas`, `numpy`, `matplotlib`, `seaborn`, `jupyter` — these are what `uv pip install` in `.venv` needs.

**Sync discipline:** When engine mechanics change, update Cell 2 before re-running. The notebook is a snapshot tool, not a live mirror.

---

## Expected Results (96,000-run simulation)

| Metric | Before (v0.7) | After (v0.8) |
|---|---|---|
| Overall defense rate | 13.6% | ~23% |
| Archetypes in 20–60% range | 2/8 | 5/8 |
| Spread (easiest–hardest combo) | 45pp | ~16pp |
| Burnt out % of deaths | 62% | ~57% |

### Per-archetype targets

| Archetype | v0.7 | v0.8 | Status |
|---|---|---|---|
| overachiever | 30.5% | ~33% | ✅ in range |
| vibe_coder | 11.7% | ~21% | ✅ fixed |
| fun_haver | 8.2% | ~28% | ✅ fixed |
| global_student | 12.6% | ~23% | ✅ fixed |
| biologist | 23.2% | ~25% | ✅ in range |
| double_agent | 7.3% | ~19% | ⚠️ hard mode (unlockable) |
| gym_bro | 3.2% | ~18% | ⚠️ hard mode (unlockable) |
| neurodivergent | 12.1% | ~18% | ⚠️ hard mode (unlockable) |

The three hard-mode archetypes are all unlockables earned through failure runs — intentionally harder.

---

## Files Changed

1. `js/engine.js` — passive drains in `choose()` and `continueSemester()`; multipliers in `applyPerk()`
2. `js/data/archetypes.js` — starting stats and descriptions for 5 archetypes
3. `simulation/simulation-v2.ipynb` — new notebook (created)
4. `simulation/requirements.txt` — Python deps (created)
5. `CHANGELOG.md` — v0.8 entry

## Do Not Change

- Milestone card effects (difficulty curve calibrated)
- Save version (no schema change)
- PI perk multipliers (all PIs already in acceptable range)
- Card content
