#!/usr/bin/env node
// Card text budget check. Run: node tools/lint-cards.js
//
// Card text is the main pacing lever — players read every word of every card, so
// the budget is enforced rather than remembered. Also verifies every card's art
// resolves to a real motif, since a typo'd tag silently falls back to the
// generic mark and makes every card sharing it draw identically.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BODY_MAX = 30;      // hard cap; aim ~24
const LABEL_MAX = 22;     // hard cap; aim ~17
const TITLE_MAX = 46;

let src = '';
for (const f of fs.readdirSync(path.join(ROOT, 'js/data')).filter(f => f.endsWith('.js'))) {
  src += fs.readFileSync(path.join(ROOT, 'js/data', f), 'utf8') + '\n';
}
src += fs.readFileSync(path.join(ROOT, 'js/art.js'), 'utf8') + '\n';
src += `globalThis.__X = {
  pools: { PHASE1_CARDS, PHASE2_CARDS, PHASE3_CARDS, UNIVERSAL_CARDS,
           CALLBACK_CARDS, EXCLUSIVE_CARDS, PI_EXCLUSIVE_CARDS, MILESTONE_CARDS },
  ARCHETYPE_DATA, PI_DATA, cardArt, artMotifFor, ART_MOTIFS, ART_TAG, ART_CARD
};`;

const ctx = { console, Math };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const X = ctx.__X;

const cards = [];
for (const p of Object.values(X.pools)) cards.push(...p);

const words = s => (s || '').replace(/<br>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
const fail = [];
const warn = [];

// ── text budget ─────────────────────────────────────────────────────────
for (const c of cards) {
  const bw = words(c.body);
  if (bw > BODY_MAX) fail.push(`${c.id}: body ${bw} words (max ${BODY_MAX})`);
  if (c.cL.length > LABEL_MAX) fail.push(`${c.id}: cL ${c.cL.length} chars — "${c.cL}"`);
  if (c.cR.length > LABEL_MAX) fail.push(`${c.id}: cR ${c.cR.length} chars — "${c.cR}"`);
  if (c.title.length > TITLE_MAX) warn.push(`${c.id}: title ${c.title.length} chars`);
  if (/\(.*(mind|body|wallet|bonds|stress|research).*\)/i.test(c.cL + c.cR)) {
    warn.push(`${c.id}: label restates a stat — fxHints() already draws it`);
  }
}

// ── data integrity ──────────────────────────────────────────────────────
const ids = cards.map(c => c.id);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (dupes.length) fail.push(`duplicate card ids: ${dupes.join(', ')}`);
for (const c of cards) {
  if (!c.body || !c.title || !c.cL || !c.cR) fail.push(`${c.id}: missing text field`);
  if (!c.tag) fail.push(`${c.id}: missing tag (art is keyed to it)`);
}

// ── reachability ────────────────────────────────────────────────────────
// A phase deck only draws inside its own semester window, so a minSem/maxSem
// that falls outside it can never be satisfied and the card is dead on arrival.
const PHASE_WINDOW = { PHASE1_CARDS: [1, 2], PHASE2_CARDS: [3, 6], PHASE3_CARDS: [7, 10] };
for (const [pool, [lo, hi]] of Object.entries(PHASE_WINDOW)) {
  for (const c of X.pools[pool]) {
    if (c.minSem > hi) fail.push(`${c.id}: minSem ${c.minSem} but ${pool} only draws in semesters ${lo}-${hi} — unreachable`);
    if (c.maxSem < lo) fail.push(`${c.id}: maxSem ${c.maxSem} but ${pool} only draws in semesters ${lo}-${hi} — unreachable`);
  }
}
// Semester 1 draws from the phase-1 deck alone, so it needs enough ungated
// cards to fill the two slots after the opener without repeating.
const openers = X.pools.PHASE1_CARDS.filter(c => c.opener);
if (!openers.length) fail.push('no card flagged `opener` — runs would start on a random card');
const sem1 = X.pools.PHASE1_CARDS.filter(c => !c.minSem || c.minSem <= 1);
if (sem1.length < 6) fail.push(`only ${sem1.length} phase-1 cards available in semester 1 — pool too thin`);

// ── art coverage ────────────────────────────────────────────────────────
const missing = [...new Set([...Object.values(X.ART_TAG), ...Object.values(X.ART_CARD)])]
  .filter(m => typeof X.ART_MOTIFS[m] !== 'function');
if (missing.length) fail.push(`motifs referenced but not defined: ${missing.join(', ')}`);

const byMotif = {};
for (const c of cards) {
  const m = X.artMotifFor(c);
  (byMotif[m] = byMotif[m] || []).push(X.cardArt(c));
}
const fellBack = (byMotif.mark || []).length;
if (fellBack) warn.push(`${fellBack} cards fall back to the generic mark — add a tag mapping`);
for (const [m, svgs] of Object.entries(byMotif)) {
  if (svgs.length > 1 && new Set(svgs).size / svgs.length < 0.6) {
    warn.push(`motif "${m}": ${svgs.length} cards but only ${new Set(svgs).size} distinct drawings — vary it on r()`);
  }
}
for (const c of cards) {
  const svg = X.cardArt(c);
  if (svg.includes('NaN') || svg.includes('undefined')) fail.push(`${c.id}: art contains NaN/undefined`);
}

// ── report ──────────────────────────────────────────────────────────────
const bodies = cards.map(c => words(c.body)).sort((a, b) => a - b);
const labels = cards.flatMap(c => [c.cL.length, c.cR.length]).sort((a, b) => a - b);
const mean = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
const distinct = new Set(cards.map(c => X.cardArt(c))).size;

console.log(`${cards.length} cards`);
console.log(`  body   mean ${mean(bodies)}w  max ${bodies[bodies.length - 1]}w  (cap ${BODY_MAX})`);
console.log(`  labels mean ${mean(labels)}c  max ${labels[labels.length - 1]}c  (cap ${LABEL_MAX})`);
console.log(`  art    ${Object.keys(byMotif).length} motifs, ${distinct} distinct drawings, ${fellBack} on fallback`);

for (const w of warn) console.log(`  warn  ${w}`);
if (fail.length) {
  console.error(`\n${fail.length} problem(s):`);
  for (const f of fail) console.error(`  ${f}`);
  process.exit(1);
}
console.log('\nOK');
