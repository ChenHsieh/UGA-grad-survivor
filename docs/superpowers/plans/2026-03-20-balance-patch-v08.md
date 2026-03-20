# Balance Patch v0.8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance archetype difficulty so all 8 archetypes hit a 17–35% defense rate (5/8 at 20%+), up from the current 3–30% range.

**Architecture:** Three targeted edit sites — passive drain constants in `engine.js`, archetype multipliers in `engine.js`, and starting stats in `archetypes.js`. Plus one new file: a simulation notebook that verifies the changes with 96,000 simulated runs.

**Tech Stack:** Vanilla JS (no build step), Python 3.13 + uv for simulation, Jupyter for the notebook.

**Spec:** `docs/superpowers/specs/2026-03-20-balance-patch-v08-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `js/engine.js` | Modify lines 205, 210, 216, 221, 229–231, 234–236, 269–280, 311, 315, 333–334, 338 | Drain values, multipliers, bonds isolation relocation |
| `js/data/archetypes.js` | Modify lines 3, 4, 5, 7, 8, 9 | Starting stats for 5 archetypes, 2 description fixes |
| `simulation/simulation-v2.ipynb` | Create | New notebook with v0.8 mechanics |
| `simulation/requirements.txt` | Create | Python deps for uv venv |
| `CHANGELOG.md` | Modify | v0.8 entry |

---

## Task 1: Fix passive drains in `choose()` and relocate bonds isolation to `continueSemester()`

**Files:**
- Modify: `js/engine.js:205,210,216,221,229–231,234–236,269–280`

These are all numeric constant changes plus a block relocation. Make them together — they are all in one function or adjacent functions, and committing them atomically makes the diff readable.

- [ ] **Step 1: Change the double_agent random drain from −2 to −1 (engine.js line 205)**

Find:
```js
    gameState.st[drainStat] = Math.max(0, gameState.st[drainStat] - 2);
```
Replace with:
```js
    gameState.st[drainStat] = Math.max(0, gameState.st[drainStat] - 1);
```

- [ ] **Step 2: Soften the wallet→mind passive drain (engine.js line 210)**

Find:
```js
    gameState.st.mind = Math.max(0, gameState.st.mind - 3);
```
Replace with:
```js
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
```

- [ ] **Step 3: Soften the bonds→mind passive drain (engine.js line 216)**

Find:
```js
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
```
Replace with (inside the `bonds < 20` block only — confirm it's the one inside `if (gameState.st.bonds < 20)`):
```js
    gameState.st.mind = Math.max(0, gameState.st.mind - 1);
```

- [ ] **Step 4: Raise the research→mind drain threshold from 20 to 15 (engine.js line 221)**

Find:
```js
  if (gameState.st.research < 20 && gameState.semester >= 3) {
```
Replace with:
```js
  if (gameState.st.research < 15 && gameState.semester >= 3) {
```
The second research condition (`research < 15 && semester >= 5 → bonds −2`) on line 224 stays exactly as-is — do not touch it.

- [ ] **Step 5: Change global_student visa drain — reduce to −2 and delay to sem 7 (engine.js lines 229–231)**

Find:
```js
  // GLOBAL STUDENT: visa pressure in late game
  if (gameState.archetype === 'global_student' && gameState.semester >= 6) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 3);
  }
```
Replace with:
```js
  // GLOBAL STUDENT: visa pressure in late game
  if (gameState.archetype === 'global_student' && gameState.semester >= 7) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
  }
```

- [ ] **Step 6: Remove the bonds isolation drain from `choose()` (engine.js lines 233–236)**

Find and delete the entire block:
```js
  // PASSIVE DRAIN: PhD isolation in late game
  if (gameState.semester >= 6) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
  }
```

- [ ] **Step 7: Add bonds isolation drain to `continueSemester()` (engine.js after line 272)**

Find:
```js
  if (gameState.st.wallet <= 0) { gameState.phase='ending'; gameState.ending='broke'; gameState.cause='Wallet'; return render(); }
  gameState.semester = gameState.nextSemester;
```
Replace with:
```js
  if (gameState.st.wallet <= 0) { gameState.phase='ending'; gameState.ending='broke'; gameState.cause='Wallet'; return render(); }
  gameState.semester = gameState.nextSemester;
  // PhD isolation: bonds −1 per semester from sem 6 onward (fires once per advance, not per card)
  if (gameState.semester >= 6) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
    if (gameState.st.bonds <= 0) { gameState.phase='ending'; gameState.ending='disappeared'; gameState.cause='Bonds'; return render(); }
  }
```

Note: the bonds drain fires *after* `gameState.semester = gameState.nextSemester` so it uses the new semester value. This is intentional — it drains when you *enter* semester 6, matching the original per-card behavior's timing.

- [ ] **Step 8: Smoke-test in browser**

```bash
cd /Users/chenhsieh/dev/UGA-grad-survivor && python3 -m http.server 8765
```

Open http://localhost:8765. Play one quick run as gym_bro with any PI. Confirm:
- Game loads, no console errors
- Stats bar shows 4 stats (no research bar)
- Cards draw and choices apply stats
- Semester advance screen shows "Wallet −1"
- You can reach the ending screen

- [ ] **Step 9: Commit**

```bash
git add js/engine.js
git commit -m "fix: v0.8 passive drain rebalance and bonds isolation relocation

- Bonds isolation: per-card from sem6 → per-semester-advance from sem6
- Global student visa drain: -3/card from sem6 → -2/card from sem7
- Wallet low-drain: mind -3 → -2 per card
- Bonds low-drain: mind -2 → -1 per card
- Research drain threshold: <20 → <15
- Double agent random drain: -2 → -1 per card

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Fix archetype multipliers in `applyPerk()`

**Files:**
- Modify: `js/engine.js:311,315,333,334,338`

All changes are in the `applyPerk()` switch statement.

- [ ] **Step 1: vibe_coder — reduce social card losses from 1.5× to 1.3× (line 311)**

Find:
```js
      if (socialTags.includes(tag) && delta < 0) return Math.floor(delta * 1.5);
```
Replace with:
```js
      if (socialTags.includes(tag) && delta < 0) return Math.floor(delta * 1.3);
```

- [ ] **Step 2: fun_haver — remove mind loss penalty (line 315)**

Find:
```js
      if (stat === 'mind' && delta < 0) return Math.floor(delta * 1.3);
```
Delete that line entirely. The `bonds` gain and `research` penalty lines above and below it stay.

- [ ] **Step 3: gym_bro — reduce wallet and mind loss multipliers from 1.3× to 1.15× (lines 333–334)**

Find:
```js
    case 'gym_bro':
      if (stat === 'wallet' && delta < 0) return Math.floor(delta * 1.3);
      if (stat === 'mind' && delta < 0) return Math.floor(delta * 1.3);
```
Replace with:
```js
    case 'gym_bro':
      if (stat === 'wallet' && delta < 0) return Math.floor(delta * 1.15);
      if (stat === 'mind' && delta < 0) return Math.floor(delta * 1.15);
```

- [ ] **Step 4: neurodivergent — reduce mind multiplier from 1.5× to 1.3× (line 338)**

Find:
```js
      if (stat === 'mind') return Math.floor(delta * 1.5);
```
Replace with:
```js
      if (stat === 'mind') return Math.floor(delta * 1.3);
```

- [ ] **Step 5: Smoke-test in browser**

Load http://localhost:8765. Play a quick run as neurodivergent. Confirm no JS errors in console and mind stat moves on card choices.

- [ ] **Step 6: Commit**

```bash
git add js/engine.js
git commit -m "fix: v0.8 archetype multiplier rebalance

- vibe_coder social losses: 1.5x -> 1.3x
- fun_haver: remove mind loss penalty (was 1.3x)
- gym_bro wallet/mind losses: 1.3x -> 1.15x
- neurodivergent mind multiplier: 1.5x -> 1.3x

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Update starting stats and archetype descriptions

**Files:**
- Modify: `js/data/archetypes.js:3,4,5,7,8,9`

Each archetype is a single object literal on one line. Make all changes to this file in one pass.

- [ ] **Step 1: Update vibe_coder starting stats (line 3)**

Current: `st: { mind: 55, body: 40, wallet: 60, bonds: 45, research: 60 }`
Change to: `st: { mind: 60, body: 47, wallet: 60, bonds: 45, research: 60 }`

- [ ] **Step 2: Update fun_haver starting stats (line 4)**

Current: `st: { mind: 40, body: 55, wallet: 50, bonds: 70, research: 35 }`
Change to: `st: { mind: 50, body: 58, wallet: 50, bonds: 70, research: 35 }`

- [ ] **Step 3: Update global_student description (line 5)**

Current desc contains: `"Visa stress hits Mind hard in semesters 8-10."`
Change to: `"Visa stress hits Mind hard in semesters 7-10."` (code now fires from sem 7)

- [ ] **Step 4: Update double_agent starting stats and description (line 7)**

Current: `st: { mind: 50, body: 45, wallet: 55, bonds: 50, research: 55 }`
Change to: `st: { mind: 55, body: 45, wallet: 58, bonds: 55, research: 55 }`

Current desc contains: `"random -2 drain to one stat per card"`
Change to: `"random -1 drain to one stat per card"`

- [ ] **Step 5: Update gym_bro starting stats and description (line 8)**

Current: `st: { mind: 40, body: 70, wallet: 35, bonds: 55, research: 45 }`
Change to: `st: { mind: 52, body: 70, wallet: 52, bonds: 55, research: 45 }`

Current desc contains: `"Body can't drop below 25"`
Change to: `"Body can't drop below 15"` (the code already enforces 15 — description was stale)

- [ ] **Step 6: Update neurodivergent starting stats (line 9)**

Current: `st: { mind: 55, body: 45, wallet: 50, bonds: 50, research: 50 }`
Change to: `st: { mind: 65, body: 45, wallet: 50, bonds: 50, research: 50 }`

- [ ] **Step 7: Smoke-test in browser**

Load http://localhost:8765. Open the archetype selection screen. Verify:
- gym_bro shows 💰52 and 🧠52 in the stat row
- neurodivergent shows 🧠65
- vibe_coder shows 💪47

- [ ] **Step 8: Commit**

```bash
git add js/data/archetypes.js
git commit -m "fix: v0.8 archetype starting stat adjustments

gym_bro: wallet 35->52, mind 40->52
vibe_coder: body 40->47, mind 55->60
fun_haver: mind 40->50, body 55->58
double_agent: mind 50->55, bonds 50->55, wallet 55->58
neurodivergent: mind 55->65

Also fix stale descriptions: gym_bro body floor (25->15),
global_student visa timing (8-10->7-10),
double_agent random drain (-2->-1)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Create simulation-v2.ipynb and requirements.txt

**Files:**
- Create: `simulation/simulation-v2.ipynb`
- Create: `simulation/requirements.txt`

The notebook documents the v0.8 balance state as the new canonical simulation. The original `simulation/simulation.ipynb` is **not touched** — it preserves the v0.4 baseline.

- [ ] **Step 1: Create `simulation/requirements.txt`**

```
pandas>=2.2
numpy>=2.0
matplotlib>=3.9
seaborn>=0.13
jupyter>=1.1
```

- [ ] **Step 2: Verify the uv venv already has these installed**

```bash
cd /Users/chenhsieh/dev/UGA-grad-survivor/simulation
.venv/bin/python3 -c "import pandas, numpy, matplotlib, seaborn, jupyter; print('all deps ok')"
```

Expected: `all deps ok`

If not: `uv pip install --python .venv/bin/python3 -r requirements.txt`

- [ ] **Step 3: Create the notebook**

The notebook must be created as a `.ipynb` JSON file. Use Python to write it:

```bash
cd /Users/chenhsieh/dev/UGA-grad-survivor/simulation
.venv/bin/python3 -c "
import nbformat, json

nb = nbformat.v4.new_notebook()
nb.metadata['kernelspec'] = {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}

cells = []

# Cell 0: Title
cells.append(nbformat.v4.new_markdown_cell('''# UGA Grad Survivor — Balance Simulation v0.8
96,000-run Monte Carlo. Mirrors engine mechanics after the v0.8 balance patch.
Original simulation.ipynb (v0.4 baseline) is preserved unchanged.'''))

# Cell 1: Imports (just the code string — long, paste from sim_run.py logic)
cells.append(nbformat.v4.new_code_cell('''import random, math, re, json, os
from collections import Counter
import pandas as pd
import numpy as np

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    sns.set_theme(style=\"whitegrid\")
    HAS_PLT = True
except ImportError:
    HAS_PLT = False

JS_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(\"__file__\")), \"..\", \"js\", \"data\")
if not os.path.isdir(JS_DATA_DIR):
    JS_DATA_DIR = os.path.join(\"..\", \"js\", \"data\")'''))

nb.cells = cells
with open('simulation-v2.ipynb', 'w') as f:
    nbformat.write(nb, f)
print('scaffold created')
"
```

This scaffolds the file. The full cell content will be written in the next step via `nbformat`.

- [ ] **Step 4: Write the complete notebook content**

Run this script to overwrite the scaffold with all cells:

```bash
cd /Users/chenhsieh/dev/UGA-grad-survivor/simulation
.venv/bin/python3 << 'NBSCRIPT'
import nbformat, os

nb = nbformat.v4.new_notebook()
nb.metadata['kernelspec'] = {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}

C = nbformat.v4.new_code_cell
M = nbformat.v4.new_markdown_cell

# ── helpers ──
LOAD = r'''
import random, math, re, json, os, sys
from collections import Counter
import pandas as pd
import numpy as np
try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    sns.set_theme(style='whitegrid')
    HAS_PLT = True
except ImportError:
    HAS_PLT = False

JS_DATA_DIR = os.path.join('..', 'js', 'data')

def pjs(s):
    s = re.sub(r'//.*?$', '', s, flags=re.MULTILINE)
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)
    r = []; ins = False; sc = None; i = 0
    while i < len(s):
        c = s[i]
        if not ins:
            if c in '"\'': ins = True; sc = c; r.append('"')
            else: r.append(c)
        else:
            if c == '\\' and i+1 < len(s):
                nc = s[i+1]
                if sc == "'" and nc == "'": r.append("'"); i += 2; continue
                if sc == "'" and nc == '"': r.append('\\"'); i += 2; continue
                r.append(c); r.append(nc); i += 2; continue
            elif c == sc: ins = False; r.append('"')
            elif c == '"' and sc == "'": r.append('\\"')
            else: r.append(c)
        i += 1
    s = ''.join(r)
    s = re.sub(r'(?<=[{,\n])\s*([a-zA-Z_]\w*)\s*:', r' "\1":', s)
    s = re.sub(r':\s*\+(\d)', r': \1', s)
    s = re.sub(r',\s*([}\]])', r'\1', s)
    s = re.sub(r'Math\.\w+\([^)]*\)', '0', s)
    return json.loads(s)

def la(v, f): return pjs(re.search(rf'(?:const|let|var)\s+{v}\s*=\s*(\[[\s\S]*?\]);', open(os.path.join(JS_DATA_DIR, f)).read()).group(1))
def ld(v, f): return pjs(re.search(rf'(?:const|let|var)\s+{v}\s*=\s*(\{{[\s\S]*?\}});', open(os.path.join(JS_DATA_DIR, f)).read()).group(1))

ARCH = ld('ARCHETYPE_DATA', 'archetypes.js')
PI   = ld('PI_DATA', 'pi-data.js')
P1   = la('PHASE1_CARDS',    'cards-phase1.js')
P2   = la('PHASE2_CARDS',    'cards-phase2.js')
P3   = la('PHASE3_CARDS',    'cards-phase3.js')
UN   = la('UNIVERSAL_CARDS', 'cards-universal.js')
CB   = la('CALLBACK_CARDS',  'cards-callback.js')
MS   = la('MILESTONE_CARDS', 'cards-milestone.js')
EX   = la('EXCLUSIVE_CARDS', 'cards-exclusive.js')
PIX  = la('PI_EXCLUSIVE_CARDS', 'cards-exclusive.js')

print("Card pools loaded:")
for name, pool in [('PHASE1',P1),('PHASE2',P2),('PHASE3',P3),('UNIVERSAL',UN),
                   ('CALLBACK',CB),('MILESTONE',MS),('EXCLUSIVE',EX),('PI_EXCL',PIX)]:
    print(f"  {name:12s}: {len(pool):3d}")
'''

ENGINE = r'''
# ── v0.8 game engine — mirrors engine.js after balance patch ──
# apply_perk() mirrors applyPerk() (engine.js ~line 301)
# apply_pi_perk() mirrors applyPIPerk() (engine.js ~line 345)
# simulate_game() mirrors choose() + continueSemester() + drawCard() (engine.js ~line 57–280)

def get_phase(s): return 1 if s <= 2 else 2 if s <= 6 else 3

def apply_perk(arch, stat, delta, tag, bonds):
    """Mirrors applyPerk() — v0.8: reduced multipliers for vibe_coder/fun_haver/gym_bro/neurodivergent."""
    tt = ['Pipeline Failure', 'Pipeline']
    sl = ['Social', 'Human Existence', 'Athens Life', 'Social Drama', 'Lab Drama']
    if arch == 'vibe_coder':
        if tag in tt and delta > 0: return math.floor(delta * 1.5)
        if tag in sl and delta < 0: return math.floor(delta * 1.3)   # v0.8: 1.5 -> 1.3
    elif arch == 'fun_haver':
        if stat == 'bonds' and delta > 0: return math.floor(delta * 1.5)
        # v0.8: mind loss penalty removed (was 1.3x)
        if stat == 'research' and delta > 0: return max(1, math.floor(delta * 0.75))
    elif arch == 'global_student':
        if stat == 'bonds' and delta < 0: return math.ceil(delta * 0.75)
    elif arch == 'biologist':
        if stat == 'research' and delta < 0 and tag in tt:
            if bonds > 50: return math.ceil(delta / 2)
            if bonds < 30: return math.floor(delta * 2)
        if stat == 'research' and delta > 0 and tag in ('Lab Life', 'Lab Politics'):
            return math.floor(delta * 1.3)
    elif arch == 'double_agent':
        if stat == 'research' and delta > 0: return delta + 3
    elif arch == 'gym_bro':
        if stat == 'wallet' and delta < 0: return math.floor(delta * 1.15)  # v0.8: 1.3 -> 1.15
        if stat == 'mind'   and delta < 0: return math.floor(delta * 1.15)  # v0.8: 1.3 -> 1.15
    elif arch == 'neurodivergent':
        if stat == 'mind': return math.floor(delta * 1.3)       # v0.8: 1.5 -> 1.3
        if stat == 'research': return math.floor(delta * 1.3)
    return delta

def apply_pi_perk(pt, stat, delta, tag):
    """Mirrors applyPIPerk() — unchanged from v0.7."""
    ia = (tag == 'Advisor')
    if pt == 'micromanager':
        if stat == 'research' and delta > 0: return math.floor(delta * 1.2)
        if stat == 'mind' and delta < 0 and ia: return math.floor(delta * 1.3)
    elif pt == 'ghost':
        if stat == 'research' and delta > 0: return math.floor(delta * 0.8)
    elif pt == 'exploiter':
        if stat == 'research' and delta > 0: return math.floor(delta * 1.3)
        if stat == 'wallet' and delta < 0: return math.floor(delta * 1.3)
        if stat == 'bonds' and delta < 0 and ia: return math.floor(delta * 1.3)
    elif pt == 'mentor':
        if delta < 0 and ia: return min(delta + 1, 0)
        if stat == 'bonds' and delta > 0 and ia: return math.floor(delta * 1.2)
        if stat == 'research' and delta > 0: return min(delta, 10)
    elif pt == 'new_pi':
        if stat == 'research' and delta > 0: return math.floor(delta * 1.25)
        if stat == 'mind' and delta < 0: return math.floor(delta * 1.2)
    elif pt == 'dynasty':
        if stat == 'wallet' and delta > 0: return math.floor(delta * 1.2)
        if stat == 'bonds' and delta < 0: return math.floor(delta * 1.3)
    return delta

def simulate_game(archetype, pi_type, strategy='random', rng=None):
    """One full game. Mirrors choose() + continueSemester() + drawCard()."""
    if rng is None: rng = random.Random()
    st = dict(ARCH[archetype]['st'])
    sem = 1; cc = 0; tc = 0; net = 0; qa = 0; mem = set()
    gms = lambda s: next((m for m in MS if m.get('semester') == s), None)
    nm = gms(sem)

    def draw():
        nonlocal nm, cc
        ph = get_phase(sem)
        if cc >= 3 and nm:
            ms = nm; nm = None
            if ms.get('piSelection'): return 'PI'
            if ms['id'] == 'ms_committee_1' and st['research'] < 25: st['mind'] = max(0, st['mind'] - 10)
            if ms['id'] == 'ms_committee_2' and st['research'] < 35: st['mind'] = max(0, st['mind'] - 15)
            return ms
        if cc >= 3: cc = 0
        pool = list(P1 if ph == 1 else P2 if ph == 2 else P3) + list(UN)
        pool = [c for c in pool if (c.get('minSem') or 0) <= sem <= (c.get('maxSem') or 99) and c['id'] not in mem]
        for c in CB:
            if c['id'] in mem: continue
            if all(r in mem for r in c.get('requires', [c['id']])): pool.append(c)
        for c in EX:
            if c.get('exclusive') != archetype or c['id'] in mem: continue
            if (c.get('minSem') or 0) <= sem <= (c.get('maxSem') or 99): pool += [c, c]
        if pi_type:
            for c in PIX:
                if c.get('exclusive') != pi_type or c['id'] in mem: continue
                if (c.get('minSem') or 0) <= sem <= (c.get('maxSem') or 99): pool += [c, c]
        if not pool: pool = [c for c in UN if c['id'] not in mem]
        return rng.choice(pool) if pool else None

    def advance():
        """Mirrors continueSemester() — wallet drain + bonds isolation."""
        nonlocal sem, cc
        sem += 1
        st['wallet'] = max(0, st['wallet'] - 1)   # cost of living
        if sem >= 6:                                # v0.8: bonds isolation per-semester (not per-card)
            st['bonds'] = max(0, st['bonds'] - 1)
        cc = 0
        return gms(sem)

    for _ in range(300):
        card = draw()
        if card is None: return {'ending': 'defended', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if card == 'PI':
            nm = advance()
            if st['wallet'] <= 0: return {'ending': 'broke', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
            if st['bonds'] <= 0: return {'ending': 'disappeared', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
            tc += 1; cc += 1; continue

        tag = card.get('tag', '')
        side = rng.choice(['left', 'right']) if strategy == 'random' else strategy(card, st)
        fx = (card.get('eL') or {}) if side == 'left' else (card.get('eR') or {})

        if card['id'] == 'ms_quals':
            th = 30 if archetype == 'biologist' else 25
            if st['research'] < th:
                qa += 1
                if qa >= 3: return {'ending': 'mastered_out', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net, 'cause': 'Failed Quals'}
                st['mind'] = max(0, st['mind'] - 15); mem.add('quals_retry_' + str(qa))
                cc += 1; tc += 1; sem += 1; nm = next((c for c in MS if c['id'] == 'ms_quals'), None); continue
        if card.get('milestone') and side == 'right' and card['id'] == 'ms_defense_sched':
            if 'defense_delayed' in mem: return {'ending': 'mastered_out', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
            mem.add('defense_delayed')
        if card['id'] == 'ms_defense' and st['research'] < 30:
            return {'ending': 'mastered_out', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}

        for sk, dv in fx.items():
            if sk == 'network': net = max(0, net + dv); continue
            m = apply_perk(archetype, sk, dv, tag, st.get('bonds', 50))
            if pi_type: m = apply_pi_perk(pi_type, sk, m, tag)
            st[sk] = max(0, min(100, st[sk] + m))

        # Post-choice archetype effects
        if archetype == 'overachiever' and tc % 3 == 0:
            if st['mind'] < 20: st['mind'] = min(100, st['mind'] + 3)
        if archetype == 'gym_bro' and st['body'] < 15: st['body'] = 15
        if archetype == 'double_agent':
            d = rng.choice(['mind', 'body', 'wallet', 'bonds'])
            st[d] = max(0, st[d] - 1)  # v0.8: -2 -> -1

        # Passive drains per card
        if st['wallet'] < 20: st['mind'] = max(0, st['mind'] - 2); st['body'] = max(0, st['body'] - 2)   # v0.8: mind -3->-2
        if st['bonds']  < 20: st['mind'] = max(0, st['mind'] - 1); st['body'] = max(0, st['body'] - 1)   # v0.8: mind -2->-1
        if st['research'] < 15 and sem >= 3: st['mind'] = max(0, st['mind'] - 2)                          # v0.8: threshold 20->15
        if st['research'] < 15 and sem >= 5: st['bonds'] = max(0, st['bonds'] - 2)
        if archetype == 'global_student' and sem >= 7: st['mind'] = max(0, st['mind'] - 2)                # v0.8: sem6->7, -3->-2
        # NOTE: bonds isolation drain removed from per-card; now in advance() above

        if card.get('sets'):
            for fl in card['sets']: mem.add(fl)
        mem.add(card['id']); tc += 1; cc += 1

        if st['wallet'] <= 0: return {'ending': 'broke',       'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if st['body']   <= 0: return {'ending': 'hospitalized','semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if st['mind']   <= 0: return {'ending': 'burnt_out',   'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if st['bonds']  <= 0: return {'ending': 'disappeared', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if 'defended' in mem: return {'ending': 'defended',    'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if sem > 10: return {'ending': 'mastered_out', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
        if cc >= 3 and not nm:
            nm = advance()
            if st['wallet'] <= 0: return {'ending': 'broke',      'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}
            if st['bonds']  <= 0: return {'ending': 'disappeared', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}

    return {'ending': 'stuck', 'semester': sem, 'total_cards': tc, 'st': dict(st), 'network': net}

print("Engine loaded. Quick test:")
r = simulate_game('overachiever', 'mentor', rng=random.Random(42))
print(f"  overachiever+mentor seed42: {r['ending']} at sem {r['semester']} ({r['total_cards']} cards)")
'''

RUN = r'''
N_RUNS = 2000  # per archetype × PI combo (96,000 total)
archetypes = list(ARCH.keys())
pi_types   = list(PI.keys())

print(f"Running {N_RUNS} games × {len(archetypes)} archetypes × {len(pi_types)} PIs = {N_RUNS*len(archetypes)*len(pi_types):,} total...")
results = []
for arch in archetypes:
    for pi in pi_types:
        for _ in range(N_RUNS):
            r = simulate_game(arch, pi)
            r['archetype'] = arch; r['pi_type'] = pi
            results.append(r)
    sys.stdout.write('.'); sys.stdout.flush()
print()

df = pd.DataFrame(results)
df['defended'] = (df['ending'] == 'defended').astype(int)
for stat in ['mind', 'body', 'wallet', 'bonds', 'research']:
    df[f'final_{stat}'] = df['st'].apply(lambda x: x.get(stat, 0))

print(f"\nTotal runs: {len(df)}")
print(df['ending'].value_counts().to_string())
'''

ANALYSIS = r'''
# ── Defense rate by archetype × PI ──
pivot = df.pivot_table(values='defended', index='archetype', columns='pi_type', aggfunc='mean').mul(100).round(1)
pivot['ALL'] = df.groupby('archetype')['defended'].mean().mul(100).round(1)

print("=== Defense Rate (%) — Archetype × PI ===")
print(pivot.to_string())

if HAS_PLT:
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.heatmap(pivot.drop(columns='ALL'), annot=True, fmt='.1f', cmap='RdYlGn',
                vmin=0, vmax=60, ax=ax, linewidths=0.5)
    ax.set_title('Defense Rate (%) — v0.8 Archetype × PI')
    plt.tight_layout(); plt.show()
'''

SUMMARY = r'''
print("=" * 60)
print("BALANCE SUMMARY — v0.8")
print("=" * 60)

overall = df['defended'].mean() * 100
print(f"\nOverall defense rate: {overall:.1f}%  (target: 20–60% per archetype)")

arch_rate = df.groupby('archetype')['defended'].mean().mul(100).round(1).sort_values(ascending=False)
print("\nArchetype defense rates:")
for a, r in arch_rate.items():
    flag = "✅" if 20 <= r <= 60 else ("⚠️" if r >= 17 else "❌")
    bar  = "█" * int(r / 2)
    print(f"  {flag} {a:20s} {r:5.1f}%  {bar}")

pi_rate = df.groupby('pi_type')['defended'].mean().mul(100).round(1).sort_values(ascending=False)
print("\nPI defense rates:")
for p, r in pi_rate.items():
    flag = "✅" if r >= 10 else "⚠️"
    print(f"  {flag} {p:20s} {r:5.1f}%")

combo = df.groupby(['archetype', 'pi_type'])['defended'].mean().mul(100).round(1)
best  = combo.idxmax(); worst = combo.idxmin()
print(f"\nBest  combo: {best}  → {combo[best]:.1f}%")
print(f"Worst combo: {worst} → {combo[worst]:.1f}%")
print(f"Spread:      {combo[best] - combo[worst]:.1f} pp  (target: ≤ 20pp)")

deaths = df[df['ending'] != 'defended']
print("\nDeath causes:")
for e, c in deaths['ending'].value_counts(normalize=True).mul(100).items():
    print(f"  {e:20s}: {c:.1f}%")

in_range = sum(1 for r in arch_rate if 20 <= arch_rate[r] <= 60)
print(f"\nArchetypes in 20–60% range: {in_range}/8  (target: 5+)")

if HAS_PLT:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    order = ['defended','burnt_out','hospitalized','disappeared','broke','mastered_out']
    colors = ['#4CAF50','#9C27B0','#F44336','#607D8B','#795548','#FF9800']
    by_arch = df.groupby(['archetype','ending']).size().unstack(fill_value=0)
    by_arch_pct = by_arch.div(by_arch.sum(axis=1), axis=0).mul(100).reindex(columns=order, fill_value=0)
    by_arch_pct.plot(kind='bar', stacked=True, ax=axes[0], color=colors, legend=False)
    axes[0].set_title('Ending % by Archetype — v0.8'); axes[0].set_ylabel('%')
    axes[0].tick_params(axis='x', rotation=40)

    death_counts = df['ending'].value_counts().reindex(order, fill_value=0)
    axes[1].bar(death_counts.index, death_counts.values, color=colors)
    axes[1].set_title('Overall Ending Distribution — v0.8')
    for i, v in enumerate(death_counts.values):
        if v: axes[1].text(i, v + len(df)*0.005, f'{v/len(df)*100:.1f}%', ha='center', fontsize=9)
    axes[1].tick_params(axis='x', rotation=40)
    fig.legend(order, loc='lower center', ncol=6, bbox_to_anchor=(0.5, -0.05))
    plt.tight_layout(); plt.show()
'''

nb = nbformat.v4.new_notebook()
nb.metadata['kernelspec'] = {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}
nb.cells = [
    M('# UGA Grad Survivor — Balance Simulation v0.8\n\n96,000-run Monte Carlo. Mirrors JS engine mechanics after the v0.8 balance patch.\n\n**Original `simulation.ipynb` (v0.4 baseline) is preserved unchanged.**\n\nSync discipline: when engine mechanics change, update the engine cell (cell 2) before re-running.'),
    M('## 1. Setup & Data Load'),
    C(LOAD.strip()),
    M('## 2. Game Engine (v0.8)\n\nPorted directly from `engine.js`. Comments note every v0.8 change.'),
    C(ENGINE.strip()),
    M('## 3. Run Simulation (96,000 games)'),
    C(RUN.strip()),
    M('## 4. Defense Rate Heatmap'),
    C(ANALYSIS.strip()),
    M('## 5. Balance Summary'),
    C(SUMMARY.strip()),
]

with open('simulation-v2.ipynb', 'w') as f:
    nbformat.write(nb, f)
print('simulation-v2.ipynb written successfully')
NBSCRIPT
```

- [ ] **Step 5: Execute the notebook to verify results**

```bash
cd /Users/chenhsieh/dev/UGA-grad-survivor/simulation
.venv/bin/jupyter nbconvert --to notebook --execute simulation-v2.ipynb --output simulation-v2.ipynb --ExecutePreprocessor.timeout=600 2>&1 | tail -5
```

Expected: `...written simulation-v2.ipynb` with no errors.

Then check the output:
```bash
.venv/bin/python3 -c "
import json
nb = json.load(open('simulation-v2.ipynb'))
# Find the summary cell output
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        for out in cell.get('outputs', []):
            text = out.get('text', '')
            if 'Overall defense rate' in text:
                print(text[:500])
                break
"
```

Expected output should show:
- Overall defense rate: ~22–24%
- Archetypes in 20–60% range: 5/8
- Spread: ≤ 20pp

If the overall rate is outside 18–28%, stop and investigate which mechanic diverges from the JS.

- [ ] **Step 6: Commit**

```bash
cd /Users/chenhsieh/dev/UGA-grad-survivor
git add simulation/simulation-v2.ipynb simulation/requirements.txt
git commit -m "feat: add simulation-v2.ipynb with v0.8 mechanics

96,000-run Monte Carlo verifying the v0.8 balance patch.
Overall defense rate: ~23%, 5/8 archetypes in 20-60% range.
Original simulation.ipynb (v0.4 baseline) preserved unchanged.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add v0.8 entry at the top of CHANGELOG.md (after the header, before v0.7)**

Insert after the first `---` separator:

```markdown
## v0.8 — Balance Patch (Round 2)
2026-03-20 · *co-authored with Claude Sonnet 4.6*

Driven by a 96,000-run simulation with corrected v0.7 mechanics: overall defense rate was 13.6% (too hard), gym_bro at 3.2%, and 6/8 archetypes below the 20% floor.

**Passive drain rebalance:** Bonds isolation drain moved from per-card to per-semester-advance (−1 per semester from sem 6, not per card played — the v0.4 add was 3× too aggressive). Global student visa drain: −3/card from sem 6 → −2/card from sem 7. Low-wallet mind drain: −3 → −2. Low-bonds mind drain: −2 → −1. Research→mind threshold raised from <20 to <15.

**Archetype multiplier fixes:** fun_haver mind loss penalty removed (was 1.3×). vibe_coder social losses: 1.5× → 1.3×. neurodivergent mind multiplier: 1.5× → 1.3×. gym_bro wallet/mind losses: 1.3× → 1.15×. double_agent random drain: −2 → −1 per card.

**Starting stat adjustments:** gym_bro (wallet 35→52, mind 40→52), vibe_coder (body 40→47, mind 55→60), fun_haver (mind 40→50, body 55→58), double_agent (mind 50→55, bonds 50→55, wallet 55→58), neurodivergent (mind 55→65).

**Description fixes:** gym_bro body floor corrected to 15 (was stale at 25), global_student visa timing updated to semesters 7–10, double_agent drain updated to −1.

**Result:** Overall defense rate 13.6% → ~23%. 5/8 archetypes in 20–60% range. Spread 45pp → ~16pp. double_agent (~19%), gym_bro (~18%), and neurodivergent (~18%) remain intentionally hard (all unlockable through failure runs).

---
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add v0.8 changelog entry

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] Open http://localhost:8765 and play one run each as gym_bro and neurodivergent — both should feel harder than overachiever but reachable
- [ ] Check archetype selection screen: gym_bro description shows "below 15", global_student shows "7–10"
- [ ] Confirm `simulation/simulation.ipynb` is unmodified: `git log --oneline simulation/simulation.ipynb` should show no new commits
- [ ] Run `git log --oneline -6` — should show 5 clean commits (Tasks 1–5)
