// Save/load tests. Run from the repository root: node test/save.test.mjs
import fs from 'fs';
import vm from 'vm';

const root = process.cwd();

function load(seed, initialStore) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const store = {};
  if (initialStore) {
    for (const [k, v] of Object.entries(initialStore)) {
      store[k] = v;
    }
  }
  const ctx = {
    console,
    Math: Object.create(Math),
    JSON,
    localStorage: {
      getItem: k => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    }
  };
  ctx.Math.random = rand;
  vm.createContext(ctx);
  for (const f of ['archetypes','pi-data','cards-phase1','cards-phase2','cards-phase3','cards-universal','cards-callback','cards-milestone','cards-exclusive','badges'])
    vm.runInContext(fs.readFileSync(`${root}/js/data/${f}.js`, 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(`${root}/js/engine.js`, 'utf8'), ctx);
  vm.runInContext(`function render(){ if (gameState.phase==='play' && !gameState.currentCard) gameState.currentCard = drawCard(); } function highlightArchetype(){} function setTimeout(){}`, ctx);
  return { ctx, rand, run: c => vm.runInContext(c, ctx), store };
}

let failures = 0;
const said = new Set();
const fail = m => { if (said.has(m)) return; said.add(m); failures++; console.log('FAIL ' + m); };
const ok = m => console.log('ok ' + m);

// 1. loadSave() with a v3 save
{
  const g = load(1, { uga_grad_survivor_v2: JSON.stringify({ version: 3, badges: ['b1'], endings: ['e1'], archetypes: ['overachiever'], unlockedPIs: ['ghost'], totalRuns: 7, totalDeaths: 2, bestSemester: 5 }) });
  g.run('loadSave()');
  const totalRuns = g.run('save.totalRuns');
  const badges = g.run('save.badges');
  if (totalRuns === 7 && Array.isArray(badges) && badges[0] === 'b1') ok('1. v3 save loads totalRuns and badges');
  else fail('1. v3 save: expected totalRuns 7, badges ["b1"]; got ' + JSON.stringify({ totalRuns, badges }));
}

// 2. v3 save with no badges field
{
  const g = load(2, { uga_grad_survivor_v2: JSON.stringify({ version: 3, endings: ['e1'], archetypes: ['overachiever'], unlockedPIs: ['ghost'], totalRuns: 5, totalDeaths: 1, bestSemester: 3 }) });
  g.run('loadSave()');
  const totalRuns = g.run('save.totalRuns');
  const badges = g.run('save.badges');
  if (totalRuns === 5 && Array.isArray(badges) && badges.length === 0) ok('2. v3 save without badges loads empty array');
  else fail('2. v3 save without badges: expected totalRuns 5, badges []; got ' + JSON.stringify({ totalRuns, badges }));
}

// 3. v2 save is not loaded
{
  const g = load(3, { uga_grad_survivor_v2: JSON.stringify({ version: 2, totalRuns: 99 }) });
  g.run('loadSave()');
  const totalRuns = g.run('save.totalRuns');
  const version = g.run('save.version');
  if (totalRuns === 0 && version === 3) ok('3. v2 save not loaded');
  else fail('3. v2 save: expected totalRuns 0, version 3; got ' + JSON.stringify({ totalRuns, version }));
}

// 4. corrupt JSON does not throw and leaves default
{
  const g = load(4, { uga_grad_survivor_v2: '{' });
  let threw = false;
  try { g.run('loadSave()'); } catch (e) { threw = true; }
  const totalRuns = g.run('save.totalRuns');
  if (!threw && totalRuns === 0) ok('4. corrupt JSON does not throw, default save');
  else fail('4. corrupt JSON: threw=' + threw + ' totalRuns=' + totalRuns);
}

// 5. saveSave() writes correct JSON
{
  const g = load(5);
  g.run('save.version = 3; save.totalRuns = 42; saveSave()');
  const raw = g.store['uga_grad_survivor_v2'];
  if (!raw) { fail('5. saveSave() did not write key'); }
  else {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === 3 && parsed.totalRuns === 42) ok('5. saveSave() writes version 3');
      else fail('5. saveSave() wrote ' + JSON.stringify(parsed));
    } catch (e) { fail('5. saveSave() wrote invalid JSON: ' + raw); }
  }
}

// 6. savedRun()
{
  // valid run
  const g1 = load(6, { uga_grad_survivor_run: JSON.stringify({ v: 1, gameState: { archetype: 'overachiever', phase: 'play' }, undoSnapshot: null }) });
  const r1 = g1.run('savedRun()');
  if (r1 !== null) ok('6a. savedRun() returns non-null for valid run');
  else fail('6a. savedRun() returned null for valid run');

  // unknown archetype
  const g2 = load(7, { uga_grad_survivor_run: JSON.stringify({ v: 1, gameState: { archetype: 'nobody', phase: 'play' }, undoSnapshot: null }) });
  const r2 = g2.run('savedRun()');
  if (r2 === null) ok('6b. savedRun() returns null for unknown archetype');
  else fail('6b. savedRun() should be null for unknown archetype');

  // wrong version
  const g3 = load(8, { uga_grad_survivor_run: JSON.stringify({ v: 2, gameState: { archetype: 'overachiever', phase: 'play' }, undoSnapshot: null }) });
  const r3 = g3.run('savedRun()');
  if (r3 === null) ok('6c. savedRun() returns null for v2');
  else fail('6c. savedRun() should be null for v2');

  // corrupt JSON
  const g4 = load(9, { uga_grad_survivor_run: '{' });
  let threw4 = false;
  let r4;
  try { r4 = g4.run('savedRun()'); } catch (e) { threw4 = true; }
  if (!threw4 && r4 === null) ok('6d. savedRun() returns null for corrupt JSON');
  else fail('6d. savedRun() corrupt JSON: threw=' + threw4 + ' result=' + JSON.stringify(r4));
}

// 7. persistRun()
{
  const g = load(10);
  // set phase to play
  g.run('gameState.phase = "play"; gameState.archetype = "overachiever"; persistRun()');
  const raw1 = g.store['uga_grad_survivor_run'];
  if (raw1) {
    try {
      const p1 = JSON.parse(raw1);
      if (p1.v === 1) ok('7a. persistRun() writes run when phase=play');
      else fail('7a. persistRun() wrote v=' + p1.v);
    } catch (e) { fail('7a. persistRun() wrote invalid JSON'); }
  } else { fail('7a. persistRun() did not write key'); }

  // set phase to ending
  g.run('gameState.phase = "ending"; persistRun()');
  const raw2 = g.store['uga_grad_survivor_run'];
  if (raw2 === undefined) ok('7b. persistRun() removes key when phase=ending');
  else fail('7b. persistRun() key still present after ending: ' + JSON.stringify(raw2));
}

if (failures) {
  console.log(failures + ' FAILURE(S)');
  process.exit(1);
} else {
  console.log('save tests ok');
  process.exit(0);
}
