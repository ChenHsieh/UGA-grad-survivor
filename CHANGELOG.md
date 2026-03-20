# UGA Grad Survivor — Changelog

---

## v0.1 — The Naive Version
**Commit:** `24b508a` · **Date:** 2026-03-18

The original release. A single `index.html` with everything inline: CSS, game logic, card data, and UI. Simple, honest, fully playable.

### Stats (4 visible)
| Stat | Meaning |
|---|---|
| 🧠 Mind | Sanity & focus |
| 💪 Body | Physical health & sleep |
| 💰 Wallet | Financial stability |
| 🤝 Bonds | All relationships (advisor, cohort, family) |

Any stat hitting 0 ends the run.

### Archetypes (5)
| Archetype | Perk |
|---|---|
| 📈 The Overachiever | When any stat < 20, gain +5 to a random stat |
| 🎭 The Imposter | Bonds losses halved; Mind losses doubled on comparison cards |
| 🛋️ The Coaster | Body/Mind can't drop below 15 per card; milestones harder |
| 🔬 The True Believer | +10 Mind every 5th card; Wallet losses ×1.5 |
| ✊ The Organizer | When Bonds > 50, all losses reduced by 3 |

### Cards
- **139 total**, all inline in `index.html`
- Three phase pools (naive years / grind / reckoning) + universal + callback + organizer-exclusive

### Milestones
| Milestone | Semester |
|---|---|
| Qualifying Exam | 2 |
| Paper Submission | 4 |
| Committee Progress Report | 6 |
| Career Fork (industry vs. academia) | 8 |
| Schedule Defense | 9 |
| The Defense | 10 |

### Endings (6)
- 🎓 Defended
- 📜 Mastered Out
- 💼 Left for Industry *(unique to this version — later merged into mastered_out)*
- 📂 All But Dissertation (ABD) *(later renamed/replaced)*
- 🛌 Burned Out *(body = 0)*
- 🪙 Broke *(wallet = 0)*

### Simulation
- Random play win rate: ~10%
- Strategic play win rate: ~70–98%
- Calibrated loosely against CGS/Nature 2022 PhD attrition data

---

## v0.2 — The Big Expansion
**Commit:** `ec91e39` · **Date:** 2026-03-19 (co-authored with Claude Opus 4.6)

Major overhaul. Added a fifth stat, a PI-selection mechanic, three new unlockable archetypes, 87 new cards, and a complete rework of milestones and endings. Replaced the original four archetypes (except Overachiever) with a new cast.

### Stats (5 visible + 1 hidden)
Added **🔬 Research** as a fifth visible stat. Research does not directly kill you but gates milestones (quals, committees, defense). Also added a hidden **Network** score that affects ending flavor text.

### Archetypes (8 total: 5 default + 3 unlockable)
Old archetypes (Imposter, Coaster, True Believer, Organizer) retired. New roster:

**Default (unlocked from start):**
| Archetype | Perk Summary |
|---|---|
| 📈 Overachiever | Any non-research stat < 20 → +5 rescue every 3 cards |
| 🤖 Vibe-Coder | +50% on tech cards; +50% losses on social cards |
| 🎉 Fun Haver | Bonds gains ×1.5; Research gains halved; Mind losses ×1.3 |
| 🌏 Global Student | Bonds losses halved; Mind drain from semester 8 |
| 🧫 Biologist | Tech-card research losses context-dependent on Bonds; harder quals |

**Unlockable:**
| Archetype | Unlock Condition |
|---|---|
| 🧬 Double Agent | Reach semester 7 |
| 💪 Gym Bro | Get the *hospitalized* ending |
| 🧩 Neurodivergent | Get the *burnt_out* ending |

### PI Selection Mechanic
After the semester 1 rotation milestone, players choose a PI type. PI perks apply multiplicatively on top of archetype perks for the rest of the run.

**Default PIs (4):** Micromanager, Ghost, Mentor, New PI
**Unlockable PIs:** Exploiter (*mastered_out* ending), Dynasty Builder (*defended* ending)

### Cards (226 total)
Multi-file architecture introduced:

| File | Cards | Content |
|---|---|---|
| `index.html` (inline) | 128 | Core phase 1–3, universal, callbacks, milestones |
| `js/cards-exclusive.js` | 42 | Archetype & PI exclusive cards |
| `js/cards-new-phase2.js` | 35 | Drama, collaboration, PI interaction cards |
| `js/cards-new-universal.js` | 21 | Athens life, staff, social cards |

Also: research/network effects added to ~80 existing cards; 8 duplicate cards removed; HPC/GACRC cards rewritten to be accurate and positive.

### Milestones (reworked)
| Milestone | Semester | New Mechanic |
|---|---|---|
| Rotation / PI Selection | 1 | Unlocks PI selection screen |
| Qualifying Exam | 4 | Research < 25 → retry (up to 3×); fail 3× → mastered_out |
| Committee Meeting 1 | 6 | Research < 25 → Mind −10 |
| Committee Meeting 2 | 8 | Research < 35 → Mind −15 |
| Schedule Defense | 9 | Delay twice → mastered_out |
| The Defense | 10 | Research < 30 → mastered_out |

### Endings (6, reworked)
Industry/ABD endings removed. Endings now map cleanly to stat deaths:

| Ending | Trigger |
|---|---|
| 🎓 Defended | Research ≥ 30 at defense |
| 📜 Mastered Out | Research too low at milestones, or quals failed 3× |
| 🧠 Burnt Out | Mind = 0 |
| 🏥 Hospitalized | Body = 0 |
| 💸 Broke | Wallet = 0 *(mechanically rare — see v0.4)* |
| 👻 Disappeared | Bonds = 0 |

### Passive Drains Added
- Bonds < 20 → Mind −2, Body −1 per card
- Research < 20 (from sem 3) → Mind −2 per card
- Research < 15 (from sem 5) → Bonds −2 per card

### Save System
- Version bumped to **3** (v2 saves trigger reset)
- Tracks: unlocked archetypes, unlocked PIs, endings seen, total runs/deaths, best semester

---

## v0.3 — Architecture Refactor
**Commit:** `3adfc26` · **Date:** 2026-03-19

The monolithic `index.html` (1,200+ lines) was split into a clean modular structure. No gameplay changes — pure code organization.

### New File Structure
```
css/style.css          ← extracted from index.html
js/engine.js           ← game loop, stat resolution, perk application
js/ui.js               ← all rendering/HTML generation
js/controls.js         ← input handling (click, keyboard, swipe)
js/data/
  archetypes.js        ← ARCHETYPE_DATA
  pi-data.js           ← PI_DATA
  cards-phase1.js      ← semester 1–2 cards
  cards-phase2.js      ← semester 3–6 cards
  cards-phase3.js      ← semester 7–10 cards
  cards-universal.js   ← always-available cards
  cards-exclusive.js   ← archetype & PI exclusive cards
  cards-callback.js    ← cards that unlock based on prior choices
  cards-milestone.js   ← milestone events
```

`index.html` reduced to ~50 lines (shell + script tags).

---

## v0.4 — Balance Patch
**Commits:** `f108640`, `a213b82` · **Date:** 2026-03-20 (co-authored with Claude Sonnet 4.6)

Driven by a 96,000-run Monte Carlo simulation that found the game was too easy overall (59.3% defense rate vs. a 15–35% design target), with `overachiever` nearly unloseable (97.7%) and `broke`/`disappeared` endings mechanically impossible or vanishingly rare.

### Bug Fix
- **Wallet floor removed:** `if (wallet < 5) wallet = 5` ran *before* the broke ending check, making `broke` mechanically impossible to reach via passive drains. Removed entirely.
- **Post-drain ending check added:** wallet drain at semester advance now immediately checks for broke.

### New Passive Drains
| Drain | Trigger |
|---|---|
| Wallet −1 | Each semester advance (cost of living) |
| Bonds −1 | Each card from semester 6 onward (PhD isolation) |

### Archetype Changes
| Archetype | Change |
|---|---|
| Overachiever | Perk now rescues **mind only** (was: any non-research stat) |
| Global Student | Bonds protection reduced from 50% → 25%; visa stress drain starts semester 6 (was 8) |
| Fun Haver | Research penalty softened: `ceil(delta/2)` → `max(1, floor(delta×0.75))` |
| Gym Bro | Body floor lowered: 25 → 15 |

### PI Changes
| PI | Change |
|---|---|
| Mentor | Advisor card buffer reduced: `+3` → `+1` |

### Simulation Results (2,000 runs/combo, random strategy)
| Metric | Before | After |
|---|---|---|
| Overall defense rate | 59.3% | 54.0% |
| Easiest combo (overachiever + mentor) | 99.4% | 82.0% |
| Hardest combo | 25.8% | 22.3% |
| Broke share of deaths | ~0% | 3.9% |

### Known Remaining Gaps (follow-up)
- `broke` and `mastered_out` still under-represented (~4% and ~7% of deaths vs. ~15% and ~20% targets)
- `gym_bro` defense rate slightly below 40% floor (32%) — wallet vulnerability too severe with new drain
- `burnt_out` still dominates deaths (57%) — reflects card pool composition more than mechanical imbalance

---

## Planned

### vNext — Secret Diary Cards *(not yet implemented)*
A mechanic where players can find/unlock a hidden card layer — personal journal entries that surface based on accumulated choices, offering narrative reflection and small stat effects. Intended to add longitudinal storytelling and reward players who explore multiple runs.
