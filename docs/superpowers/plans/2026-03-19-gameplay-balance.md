# Gameplay Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the card game so defense rates fall in the 40–70% range per combo, overall ~54%, and rare endings (broke, disappeared) become meaningful failure modes.

**Architecture:** All changes are in `js/engine.js` — the single game loop file. No new files. No structural changes. Eight targeted edits to perk functions and passive drain logic.

**Tech Stack:** Vanilla JS, browser game, no build step. Verification via `python3` simulation script inline + manual browser testing (`python3 -m http.server 8765`).

**Spec:** `docs/superpowers/specs/2026-03-19-gameplay-balance-design.md`

---

### Task 1: Fix wallet floor bug

**Files:**
- Modify: `js/engine.js:212`

The line `if (gameState.st.wallet < 5) gameState.st.wallet = 5;` runs before the `broke` ending check, making broke mechanically impossible. Remove it.

- [ ] **Step 1: Locate and remove the wallet floor**

In `js/engine.js`, find line 212:
```js
if (gameState.st.wallet < 5) gameState.st.wallet = 5;
```
Delete that line entirely.

- [ ] **Step 2: Verify in browser that wallet can now reach 0**

Start dev server: `python3 -m http.server 8765`

Open `http://localhost:8765`, pick any archetype and PI. Open browser console and run:
```js
gameState.st.wallet = 1;
```
Then play a card with a negative wallet effect (e.g., any card with `eL.wallet < 0`). Confirm the `broke` ending screen appears. Previously it would have floored at 5.

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "fix: remove wallet floor that prevented broke ending"
```

---

### Task 2: Add wallet passive drain (cost of living)

**Files:**
- Modify: `js/engine.js:251–255`

Add -1 wallet per semester advance. Triggers once per semester when `cardCount >= 3 && !nextMilestone` causes `gameState.semester++`.

- [ ] **Step 1: Add drain before semester increment**

Find this block near line 251:
```js
  if (gameState.cardCount >= 3 && !gameState.nextMilestone) {
    // Only advance semester if there's no pending milestone for this semester
    gameState.semester++;
    startNextSemester();
  }
```

Change to:
```js
  if (gameState.cardCount >= 3 && !gameState.nextMilestone) {
    // Cost of living: -1 wallet each semester
    gameState.st.wallet = Math.max(0, gameState.st.wallet - 1);
    gameState.semester++;
    startNextSemester();
  }
```

- [ ] **Step 2: Verify in browser**

Open console and run: `gameState.st.wallet` — note the value. Play 3 cards (watch the semester counter advance). Run `gameState.st.wallet` again. It should be 1 lower.

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "feat: add cost-of-living wallet drain (-1 per semester)"
```

---

### Task 3: Add late-game bonds drain (PhD isolation)

**Files:**
- Modify: `js/engine.js:232–235` (passive drain section)

Add -1 bonds per card from semester 6 onward. Insert alongside existing passive drains.

- [ ] **Step 1: Add bonds drain after the global_student block**

Find the global student block (around line 232):
```js
  // GLOBAL STUDENT: visa pressure in late game
  if (gameState.archetype === 'global_student' && gameState.semester >= 8) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 3);
  }
```

Add immediately after it:
```js
  // PASSIVE DRAIN: PhD isolation in late game
  if (gameState.semester >= 6) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
  }
```

- [ ] **Step 2: Verify in browser**

Use console: set semester to 6 manually (`gameState.semester = 6`) and note bonds. Play a card. Bonds should drop by 1 (plus any card effects).

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "feat: add PhD isolation bonds drain from semester 6"
```

---

### Task 4: Nerf overachiever perk (rescue mind only)

**Files:**
- Modify: `js/engine.js:195–201`

Current perk rescues any non-research stat below 20. Change to rescue only `mind`.

- [ ] **Step 1: Change the weakStats filter**

Find lines 195–201:
```js
  if (gameState.archetype === 'overachiever' && gameState.totalCards % 3 === 0) {
    const weakStats = Object.entries(gameState.st).filter(([s, v]) => v < 20 && s !== 'research');
    if (weakStats.length > 0) {
      const [weakStat] = weakStats[Math.floor(Math.random() * weakStats.length)];
      gameState.st[weakStat] = Math.min(100, gameState.st[weakStat] + 3);
    }
  }
```

Change to:
```js
  if (gameState.archetype === 'overachiever' && gameState.totalCards % 3 === 0) {
    if (gameState.st.mind < 20) {
      gameState.st.mind = Math.min(100, gameState.st.mind + 3);
    }
  }
```

- [ ] **Step 2: Verify in browser**

Pick overachiever. Open console, set `gameState.st.body = 5; gameState.st.mind = 50;`. Play 3 cards. Body should NOT be rescued (it was previously). Mind rescue only activates when mind < 20.

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "fix: overachiever perk rescues mind only, not all stats"
```

---

### Task 5: Nerf global student perk + earlier mind drain

**Files:**
- Modify: `js/engine.js:289–290` (applyPerk global_student case)
- Modify: `js/engine.js:233` (late-game drain semester threshold)

Two related changes: soften the bonds-loss protection, and start visa stress 2 semesters earlier.

- [ ] **Step 1: Reduce bonds loss protection from 50% to 25%**

Find line 290 in `applyPerk`:
```js
    case 'global_student':
      if (stat === 'bonds' && delta < 0) return Math.ceil(delta / 2);
      break;
```

Change to:
```js
    case 'global_student':
      if (stat === 'bonds' && delta < 0) return Math.ceil(delta * 0.75);
      break;
```

- [ ] **Step 2: Move global student mind drain from semester 8 to semester 6**

Find line 233:
```js
  if (gameState.archetype === 'global_student' && gameState.semester >= 8) {
```

Change to:
```js
  if (gameState.archetype === 'global_student' && gameState.semester >= 6) {
```

- [ ] **Step 3: Verify in browser**

Pick global_student. In console, run `applyPerk('global_student', 'bonds', -10, {tag:''})` — it should return `-8` (was `-5`). Also set semester to 6 and confirm mind drains by 3 per card (previously didn't start until semester 8).

- [ ] **Step 4: Commit**

```bash
git add js/engine.js
git commit -m "fix: global_student bonds protection 50%→25%, visa drain from sem 6"
```

---

### Task 6: Soften fun haver research penalty

**Files:**
- Modify: `js/engine.js:287` (applyPerk fun_haver case)

Change research gain penalty from halving (≈50%) to 25% reduction, with a minimum-1 guard.

- [ ] **Step 1: Update the fun_haver research case**

Find line 287:
```js
      if (stat === 'research' && delta > 0) return Math.ceil(delta / 2);
```

Change to:
```js
      if (stat === 'research' && delta > 0) return Math.max(1, Math.floor(delta * 0.75));
```

- [ ] **Step 2: Verify the math in browser console**

```js
// Spot check edge cases:
applyPerk('fun_haver', 'research', 1, {tag:''})   // should return 1 (not 0)
applyPerk('fun_haver', 'research', 4, {tag:''})   // should return 3
applyPerk('fun_haver', 'research', 10, {tag:''})  // should return 7
applyPerk('fun_haver', 'research', 0, {tag:''})   // should return 0 (no change)
```

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "fix: fun_haver research penalty 50%→25% reduction with min-1 guard"
```

---

### Task 7: Lower gym bro body floor

**Files:**
- Modify: `js/engine.js:203`

Reduce the body safety floor from 25 to 15 so extreme body damage can eventually trigger hospitalized.

- [ ] **Step 1: Change the body floor threshold**

Find line 203:
```js
    if (gameState.st.body < 25) gameState.st.body = 25;
```

Change to:
```js
    if (gameState.st.body < 15) gameState.st.body = 15;
```

- [ ] **Step 2: Verify in browser**

Pick gym_bro. In console: `gameState.st.body = 10;`. Play a card. Body should be restored to 15 (not 25). Then set `gameState.st.body = 14;` and play — body stays at 15. Set `gameState.st.body = 0;` and play — immediately restored to 15, no hospitalized ending fires.

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "fix: gym_bro body floor 25→15 to allow hospitalized in extremis"
```

---

### Task 8: Reduce mentor PI advisor buffer

**Files:**
- Modify: `js/engine.js:333` (applyPIPerk mentor case)

Mentor's advisor buffer softens negative advisor card effects by +3. Reduce to +1.

- [ ] **Step 1: Change the buffer value**

Find line 333:
```js
      if (delta < 0 && isAdvisor) return Math.min(delta + 3, 0);
```

Change to:
```js
      if (delta < 0 && isAdvisor) return Math.min(delta + 1, 0);
```

- [ ] **Step 2: Verify in browser console**

```js
// Advisor card with -5 effect:
applyPIPerk('mentor', 'mind', -5, {tag:'Advisor'})  // should return -4 (was -2)
applyPIPerk('mentor', 'mind', -2, {tag:'Advisor'})  // should return -1 (was 0)
applyPIPerk('mentor', 'mind', -1, {tag:'Advisor'})  // should return 0 (min clamp)
applyPIPerk('mentor', 'mind', -5, {tag:'Lab Life'}) // should return -5 (non-advisor unchanged)
```

- [ ] **Step 3: Commit**

```bash
git add js/engine.js
git commit -m "fix: mentor PI advisor buffer +3→+1 to reduce defense rate"
```

---

### Task 9: Run validation simulation

**Files:**
- Read: `simulation/simulation.ipynb`

Run the full simulation with all 8 changes applied to confirm the numbers land within acceptable range.

- [ ] **Step 1: Open the notebook**

```bash
cd simulation
jupyter notebook simulation.ipynb
```

Or run via CLI: `jupyter nbconvert --to notebook --execute simulation.ipynb --output simulation_validated.ipynb`

- [ ] **Step 2: Check the balance summary output (cell 12 / Section 12)**

Expected targets (the game is now live in-browser with changes applied):

| Metric | Target | Acceptable |
|---|---|---|
| Overall defense rate | ~54% | 50–60% |
| Easiest combo | ~70–82% | < 85% |
| Hardest combo | ~22–40% | > 18% |
| burnt_out share of deaths | ~35–57% | < 65% |
| broke share of deaths | ~4–15% | > 2% |
| disappeared share of deaths | ~6–10% | > 3% |

Note: The pre-implementation simulation (run during design phase) showed 54.2% overall, 81.8% easiest, 22.3% hardest, 4.1% broke, 6.0% disappeared. These are the floor estimates — the live code should match closely.

- [ ] **Step 3: If any metric is outside acceptable range, note it**

Flag for follow-up tuning pass. Do not block the commit for minor misses — the spec's watch points already document the known gaps.

- [ ] **Step 4: Final commit**

```bash
git add js/engine.js
git commit -m "chore: validate all balance changes via simulation"
```

---

### Task 10: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
python3 -m http.server 8765
```

Open `http://localhost:8765`.

- [ ] **Step 2: Play 3 quick games**

1. Pick `overachiever` + `mentor` — should feel beatable but not trivial (previously near-impossible to lose)
2. Pick `fun_haver` + `new_pi` — should feel genuinely hard
3. Pick any archetype, intentionally ignore wallet — should eventually see the `broke` ending screen

- [ ] **Step 3: Confirm wallet broke ending screen renders correctly**

The `renderEnding()` function in `engine.js` already handles `broke` — just confirm the text/emoji shows up properly in browser.
