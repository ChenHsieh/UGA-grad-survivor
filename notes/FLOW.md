# UGA Grad Survivor: the real flow, in plain words

Written 2026-10-20 from js/engine.js and js/ui.js, then checked by playing six full runs by touch
(390x844 and 320x568, English and Traditional Chinese). This folder is not served by Pages.

## Time in the game

- A run is 10 semesters. Semester 1 is fall of year 1, semester 2 is spring, and so on: odd semesters are
  fall, even are spring, and semester s is year ceil(s/2). A semester is about 6 months.
- A semester is 3 cards. After the third card the semester changes (a strip over the next card), except
  after a checkpoint, where a full screen shows what the checkpoint did.
- Checkpoints: qualifying exam in semester 4 (Research 20), committee meetings in 6 and 8 (35, 50),
  "Book the room" in 9, defense in 10 (65). A failed exam is retaken in a later semester, at most 3 tries.

## The advisor

- You do not have an advisor in semester 1. You are rotating through labs. No card talks about "your advisor",
  "your PI" or "your committee" before semester 2 (the timeline test enforces this).
- After the third card of semester 1 a screen says "Choose your lab", then "Pick your advisor" lists every
  advisor you have unlocked (4 at the start; The Exploiter opens after a master's ending, The Dynasty Builder
  after a defense). You tap one. That is the only way an advisor is chosen.
- What an advisor changes (scales Research gains or Mind, Wallet and Friends losses) is the one-line blurb on
  each option; "How each advisor works" has the exact rules.
- Before this fix the start screen also "dealt" a random advisor, and that one carried a "dealt" tag in the
  list. It changed nothing (it was only pre-selected), so it is gone. The start screen now says the advisor
  comes later.

## The start

- "Begin": the very first run is always The Overachiever (it teaches the game). After that Begin deals a random
  unlocked character. "Choose who to play instead" opens the full list.
- The start screen shows the character (what it changes, the starting bars) and a card saying the advisor is
  chosen after semester 1, with one button, "Start semester 1". Nothing advances on a timer.

## Screens, in order, with what each asks

1. Title: Begin / Continue / New run / Choose who to play instead / Transcript / language.
2. Start screen: read, then "Start semester 1" (or choose a different character).
3. Play, semester 1: three cards. Card 1 is always "Welcome to the Program".
4. "Choose your lab" (one button: Pick your advisor).
5. "Pick your advisor": tap one.
6. Play, semester 2 onward. A strip with the semester name and a narrator line appears at each semester change
   (tap to continue; it no longer disappears by itself).
7. Checkpoint screens ("Semester N done", what the checkpoint did, Start semester N+1).
8. Badge reveal, then "See how it ended", then the ending (take back the last choice once if a bar hit 0).

## Inconsistencies found in the playthroughs, and what happened

| Found | Status |
|---|---|
| Start screen vanished after 2 s with two unexplained items | fixed: waits for a tap, one line each on what it changes |
| "dealt" tag on one advisor, no meaning | fixed: removed; advisor is picked by the player only |
| Card said "You have 3 years left" in semester 1 (universal card, any semester) | fixed, and a test forbids "N years left" |
| 25 cards stated times the engine could not make true (18 months of work in semester 3, "5th Year Blues" in year 4, "Defense is in 18 months" at any time, "It is March" in fall, quals "10 weeks away" when the exam is a year off) | fixed by moving windows or rewording, listed in test/timeline.test.mjs |
| Two cards (someone_submitted, imposter_vindicated) sat in a semester 3-6 pool with minimum semester 7/8 and could never appear | moved to the late pool |
| Callback cards ignored minimum/maximum semester and could fire the very next card ("Qualifying Exam Day: It's here", "Your Pipeline, 18 Months Later", "Remember that all-nighter") | fixed: callbacks wait a number of semesters after the card that set them; the exam callback is now a practice round in semesters 3-4 |
| 11 cards mentioned the advisor or committee in semester 1, before either exists | fixed: earliest semester 2 (committee meeting karaoke: 6) |
| When the card pool ran dry the fallback ignored windows | fixed |
| Semester strip vanished after 1.2 s | fixed: tap to continue |
| "Start semester N" button below the fold at 320x568 (looked like a dead end) | fixed: button stays on screen |
| Ending screen said "Next run you choose who to play" but Begin deals a random character | fixed wording |
| Pick-advisor screen repeated the sentence from the screen before | shortened |
| Picking an advisor moves to semester 2 without the Wallet -1 rent cost or a strip | left as is; no balance change in this round |
| Reloading on the start screen loses the dealt character (the run is only saved from the first card) | left as is; costs nothing but the deal |
| The 5 Traditional Chinese runs show English cards and menus (only badges and the transcript are translated) | known and documented in the changelog |

## Fresh-eyes review, 2026-10-20 (P1a62)

| Found | Status |
|---|---|
| At 320x568 the two answers sat 26 px below the fold (the play screen had a 600 px minimum height) | fixed: under 640 px tall the screen fits; long card text scrolls inside the card |
| Chinese mode showed English cards with no warning | fixed: a line under the toggle says only badges and the transcript are translated |
| Narrator tag "Fifth-year:" read like a timeline label ("Fifth-year: Second year.") | now "A fifth-year:" |
| Vibe-Coder and Biologist rules said "pipeline cards", a word no card shows | now "cards from The cluster" (the label on those 12 cards) |
| The "Choose Your Advisor" milestone card (ms_rotation) is never shown; it only triggers the lab screen | left: the engine uses it as the trigger |
| Career contacts appears only on the ending screen, never during play | left; needs a design call |
