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

## v0.5 — Narrative Polish
2026-03-20 · *co-authored with Claude Sonnet 4.6*

**Card timing fixes:** Added `minSem` to 8 cards whose flavor text referenced events that couldn't have happened yet — dissertation writing, published papers, committee, quals — preventing them from surfacing in semester 1 or 2.

**Rotation transition screen:** Added a dedicated `rotation_complete` transition between the end of semester 1 and the PI selection screen, giving the lab-choice decision the narrative weight it deserves.

**Ending screen polish:** All 6 share texts now include archetype, PI, semester, and card count in a consistent format. Removed wrong stipend figure from the Broke share text. Rewrote `mastered_out` and `burnt_out` body copy to be observational rather than editorializing.

**Sentence-level prose:** Fixed 9 cards with choppy all-short-sentence body text by combining clauses — preserving the dry deadpan voice without the staccato rhythm.

**Semester 5 transition:** Fixed flavor text that said "the dissertation is real" at a point when no one is writing a dissertation yet.

---

## v0.6 — Themes & Network Endings
2026-03-20 · *co-authored with Claude Sonnet 4.6*

**Theme system:** Added 4 selectable visual themes (Institutional Cold, Terminal/Hacker, Lo-fi Zine, Pixel Retro) plus the original as "Classic." Themes are switchable from the `?` help overlay and persist across sessions via `localStorage`. All colors and fonts are driven by CSS custom properties (`--bg`, `--font-serif`, etc.); switching themes is a single `data-theme` attribute swap on `<html>`.

**Network-flavored endings:** Extended the existing network mechanic (previously only affecting the Defended ending) to Mastered Out and Broke. Each now has a high-network (>30) and low-network (≤30) body text variant. Mastered Out: high network = a conference contact becomes a hiring manager; low = resume, scratch. Broke: high network = a poster session contact surfaces a contract role; low = the original vending machine scene with "There's no one to call." added.

**Network replayability hint:** Low-network Mastered Out and Broke endings now show a dashed-border callout below the ending body, telling the player that networking choices unlock a different version of the outcome.

---

## v0.7 — Hidden Stats & Card Cleanup
2026-03-20 · *co-authored with Claude Sonnet 4.6*

**Research hidden during play (Option B):** Research removed from the stat bar and card fx hints. Players no longer see a running total — they manage the four life stats (mind/body/wallet/bonds) and find out their research standing only when it matters.

**Research revealed at milestones:** A colored banner (green = above threshold, red = below) appears above the card at quals (sem 4), both committee meetings (sem 6, 8), and defense (sem 10), showing current value and the required threshold. Biologist archetype threshold at quals correctly shown as 30.

**Network flavor hints mid-game:** Two narrative-only checkpoints added — no number shown, just tone. Committee meeting (sem 6) signals whether you've built outside connections. Defense scheduling (sem 9) signals whether the job search has already started informally or not. Three tiers each, driven by `gameState.network`.

**Defended ending — 3-tier network:** Expanded from 2 to 3 network tiers: industry reached out before you updated LinkedIn (>50) / a few warm leads, enough to start (25–50) / the degree is real but the network isn't there yet (<25).

**Stats bar fixed:** Grid corrected from 5 columns to 4 after research was removed.

**Card stat cleanup:** Fixed 10 duplicate key bugs (JS silently drops duplicate object keys — `network:+5, network:+5` was being read as `+5` not `+10`). Trimmed ~25 cards from 4–5 visible stat keys to 2–3, removing weakly-justified research/bonds deltas that didn't match the card narrative.

---

## v0.8 — Broader Audience Pass
2026-03-20 · *co-authored with Claude Sonnet 4.6*

Tuned the game to be accessible to any bioinformatics or computational biology PhD student, not just those at UGA's IOB program — while keeping the UGA flavor intact as local color rather than required context.

**Genericized (the things that actually excluded outsiders):**
- Sapelo2 → "the cluster"; GACRC → "HPC support" across all HPC cards (Cluster Maintenance, HPC Container Workshop, LLM on the Cluster, scratch purge, job queue)
- Exact UGA-specific dollar figures removed from mid-card body text: health insurance premium, tax season breakdown, student crisis TA salary, teaching labor rates, parking pass percentage, TA grade dispute salary, international student stipend comparison, housing crisis stipend reference
- Georgia-Florida week → "rivalry game weekend"; bulldog onesie → "team onesie"
- Building names that need a campus map: Brooks Hall → "the department building", Baxter Street → generic intersection
- Program-specific acronyms: BIOL 1107 → "Intro Biology", ABRF → "a conference", UCWGA petition → "a petition going around"
- "UGA sends a vague email" → "your university sends a vague email"
- Rent hike card de-Athens-ified: "Athens Rent: +35% Since 2020" → "Rent: Up 30% in Four Years", "Athens rents" → "local rents", "2.1% vacancy rate" removed

**UGA flavor kept (names where context carries the meaning):**
- Athens venue names restored: 40 Watt, Jittery Joe's, Five Points, Creature Comforts/Tropicalia, Sips, Normaltown, Ramsey, Sanford, Athens Farmers Market
- "Athens Life" tags preserved throughout
- Stipend letter ($34,738) kept — the number is the joke, and it's close enough to real for any program

**README updated:** "How to Play" and "226 Cards" sections now frame the game as UGA-rooted but universally relatable to any computational biology PhD.

---

## v0.9 — Field Identity & AI Cards
2026-03-20 · *co-authored with Claude Sonnet 4.6*

Added 7 new universal cards covering two under-represented tensions in computational biology PhD life.

**Field identity (2 cards):**
- **Bioinformatics or Computational Biology?** — The lab meeting debate over what the field is actually called. You've been using both terms on your CV. Pick a side or rebrand as "data science for biology."
- **"I Also Do Bioinformatics"** — A wet lab biologist sorted a DEG list in Excel, colored the significant rows red, and now has opinions about why your pipeline is overcomplicated. You spent three weeks on that pipeline.

**AI usage debates (5 cards):**
- **The Hallucinated Citation** — LLM invents a convincing Nature paper. Advisor catches it. One comment: "This paper is not real."
- **The Lab AI Policy Meeting** — Strong opinions, the postdoc admits they've been using it for 18 months, meeting ends with "let's revisit this." No policy established.
- **"In 5 Years, AI Does All of This"** — Visiting professor's closing slide. Half the room is excited. The other half is doing the math on their PhD timeline.
- **"Did You Write This Yourself?"** — You wrote the logic. An LLM wrote the boilerplate. You understood every line. The script works. You wait.
- **The Principled Bug** — The hand-typed purist drops the last sample from every analysis with an off-by-one error. Six months of results silently wrong. Your AI-assisted script has no such bug.

---

## vNext — Secret Diary Cards *(planned)*

A hidden card layer: personal journal entries that surface based on accumulated run history, offering narrative reflection and small stat effects.
