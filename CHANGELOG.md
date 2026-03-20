# UGA Grad Survivor — Version Log

---

## v0.1 — The Naive Version
`24b508a` · 2026-03-18

Single `index.html`, everything inline. 4 stats (Mind, Body, Wallet, Bonds). 5 archetypes: Overachiever, Imposter, Coaster, True Believer, Organizer. 139 cards across 3 phase pools. 6 endings including Left for Industry and ABD. Random play wins ~10%.

---

## v0.2 — The Big Expansion
`ec91e39` · 2026-03-19 · *co-authored with Claude Opus 4.6*

Added **Research** as a 5th stat and a hidden **Network** score. Introduced **PI selection** after the semester 1 rotation — 6 PI types (Micromanager, Ghost, Mentor, New PI, Exploiter, Dynasty), each with persistent perks. Replaced the original 4 archetypes with a new cast of 8 (5 default + 3 unlockable via specific endings). Reworked all 6 milestones: quals now has a 3-attempt retry system, committees gate on research thresholds, and the defense requires Research ≥ 30. Endings simplified to 6 clean stat-death mappings — ABD and Left for Industry removed. Added 87 new cards across 3 external JS files (archetype/PI exclusives, phase 2 drama, Athens life). Added passive drains for low research and low bonds. 226 cards total.

---

## v0.3 — Architecture Refactor
`3adfc26` · 2026-03-19

No gameplay changes. Split the 1,200-line monolith into:
`css/style.css` · `js/engine.js` · `js/ui.js` · `js/controls.js` · `js/data/` (archetypes, pi-data, 8 card files). `index.html` reduced to a 50-line shell.

---

## v0.4 — Balance Patch
`f108640`, `a213b82` · 2026-03-20 · *co-authored with Claude Sonnet 4.6*

Driven by a 96,000-run simulation: overall defense rate was 59.3% (too easy), Overachiever+Mentor reached 99.4%, and the Broke ending was mechanically impossible.

**Bug fix:** removed a wallet floor (`wallet = max(wallet, 5)`) that ran before the broke ending check, making Broke unreachable. Added a post-drain ending check.

**New passive drains:** Wallet −1 per semester (cost of living); Bonds −1 per card from semester 6 (PhD isolation).

**Archetype nerfs:** Overachiever rescues mind only (was any non-research stat); Global Student bonds protection 50%→25% and visa drain starts semester 6 (was 8); Fun Haver research penalty softened to 25% reduction with min-1 guard; Gym Bro body floor 25→15.

**PI nerf:** Mentor advisor buffer +3→+1.

**Result:** Overall defense rate 59.3%→54.0%; Overachiever+Mentor 99.4%→82.0%; Broke is now a real ending (3.9% of deaths).

*Known gaps:* Broke and mastered_out still under-represented; gym_bro defense rate at 32% (below 40% target); burnt_out still dominates deaths at 57%.

---

## vNext — Secret Diary Cards *(planned)*

A hidden card layer: personal journal entries that surface based on accumulated run history, offering narrative reflection and small stat effects.
