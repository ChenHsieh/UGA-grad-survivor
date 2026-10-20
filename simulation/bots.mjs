// Bot players against the real game rules (js/engine.js and js/data/*).
// usage: node simulation/bots.mjs [runs] [archetype]   (run from the repository root)
// random: coin flips. survivor: keeps the four bars high, ignores Research. balanced: keeps bars up and
// chases Research when it is near the next checkpoint. researcher: chases Research above all.
// Each bot reads the exact effects of both answers, so it plays better informed than a person who sees dots.
import fs from 'fs'; import vm from 'vm';
const dir = '.', RUNS = +(process.argv[2] || 1000), ARCH = process.argv[3] || 'overachiever';
function makeGame(seed) {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const store = {};
  const ctx = { console, Math: Object.create(Math), JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
  ctx.Math.random = rand;
  vm.createContext(ctx);
  for (const f of ['archetypes','pi-data','cards-phase1','cards-phase2','cards-phase3','cards-universal','cards-callback','cards-milestone','cards-exclusive','badges'])
    vm.runInContext(fs.readFileSync(`${dir}/js/data/${f}.js`, 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(`${dir}/js/engine.js`, 'utf8'), ctx);
  vm.runInContext(`function render(){ if (gameState.phase==='play' && !gameState.currentCard) gameState.currentCard = drawCard(); } function highlightArchetype(){} function setTimeout(){}`, ctx);
  return { ctx, rand, run: code => vm.runInContext(code, ctx) };
}
const BARS = ['mind','body','wallet','bonds'];
const policies = {
  random: (g) => g.rand() < 0.5 ? 'left' : 'right',
  survivor: (g) => pickBy(g, (st, fx) => Math.min(...BARS.map(b => st[b] + (fx[b] || 0)))),
  balanced: (g) => pickBy(g, (st, fx, gate) => {
    const after = k => st[k] + (fx[k] || 0);
    const low = Math.min(...BARS.map(after));
    const r = after('research');
    return Math.min(low, 45) + (r < gate.need + 10 ? 0.8 * (fx.research || 0) : 0.1 * (fx.research || 0));
  }),
  researcher: (g) => pickBy(g, (st, fx) => {
    const low = Math.min(...BARS.map(b => st[b] + (fx[b] || 0)));
    return (low <= 0 ? -1000 : 0) + (fx.research || 0) * 3 + Math.min(low, 15);
  }),
};
function pickBy(g, score) {
  const st = g.run('gameState.st'), gate = g.run('nextGate()');
  const L = score(st, g.run("predictEffects('left')"), gate), R = score(st, g.run("predictEffects('right')"), gate);
  if (L === R) return g.rand() < 0.5 ? 'left' : 'right';
  return L > R ? 'left' : 'right';
}
const out = {};
for (const [name, pol] of Object.entries(policies)) {
  const endings = {}; const rAt = {4: [], 6: [], 8: [], 10: []}; let qualsFirst = 0, qualsReached = 0, freeChoices = 0, choices = 0, sem1free = 0, sem1choices = 0;
  const gateFail = { committee_1: 0, committee_2: 0 }; const gateSeen = { committee_1: 0, committee_2: 0 };
  for (let i = 0; i < RUNS; i++) {
    const g = makeGame(i * 7919 + 13);
    g.run(`save.archetypes.push('double_agent','gym_bro','neurodivergent'); selectArchetype('${ARCH}')`);
    let guard = 0;
    while (g.run('gameState.phase') !== 'ending' && guard++ < 400) {
      const ph = g.run('gameState.phase');
      if (ph === 'rotation_complete') { g.run('continueToPI()'); continue; }
      if (ph === 'pi_selection') { const pis = ['micromanager','ghost','mentor','new_pi']; g.run(`selectPI('${pis[Math.floor(g.rand()*4)]}')`); continue; }
      if (ph === 'semester_advance') { g.run('continueSemester()'); continue; }
      if (ph === 'play') {
        if (!g.run('gameState.currentCard')) { g.run('render()'); continue; }
        const card = g.run('gameState.currentCard'); const sem = g.run('gameState.semester'); const r = g.run('gameState.st.research');
        if (card.id === 'ms_quals') { qualsReached++; if (!g.run("gameState.memory.some(m=>m.startsWith('quals_retry'))") && r >= g.run('qualsNeed()')) qualsFirst++; }
        if (card.id === 'ms_committee_1') { gateSeen.committee_1++; }
        if (card.id === 'ms_committee_2') { gateSeen.committee_2++; }
        if ([4,6,8,10].includes(sem) && card.milestone) rAt[sem].push(r);
        if (!card.milestone) { for (const side of ['left','right']) { const fx = g.run(`predictEffects('${side}')`); choices++; const free = !Object.values(fx).some(v => v < 0); if (free) freeChoices++; if (sem <= 2) { sem1choices++; if (free) sem1free++; } } }
        g.run(`choose('${pol(g)}')`);
        continue;
      }
      break;
    }
    const e = g.run('gameState.ending') + (g.run('gameState.cause') ? ':' + g.run('gameState.cause') : '');
    endings[e] = (endings[e] || 0) + 1;
  }
  const med = a => a.length ? a.sort((x,y)=>x-y)[Math.floor(a.length/2)] : '-';
  out[name] = { endings: Object.fromEntries(Object.entries(endings).sort((a,b)=>b[1]-a[1]).map(([k,v]) => [k, (100*v/RUNS).toFixed(1)+'%'])),
    medianResearchAtMilestone: Object.fromEntries(Object.entries(rAt).map(([k,a]) => [k, med(a)])),
    qualsFirstTry: qualsReached ? (100*qualsFirst/qualsReached).toFixed(0)+'%' : '-',
    freeAnswerShare: (100*freeChoices/choices).toFixed(0)+'%', freeAnswerShareSem12: (100*sem1free/sem1choices).toFixed(0)+'%' };
}
console.log(JSON.stringify(out, null, 1));
