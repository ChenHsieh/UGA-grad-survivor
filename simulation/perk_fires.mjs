// How often an archetype's perk actually changes a number, with coin-flip play.
// usage: node simulation/perk_fires.mjs [runs]   (run from the repository root)
// random: coin flips. survivor: keeps the four bars high, ignores Research. balanced: keeps bars up and
// chases Research when it is near the next checkpoint. researcher: chases Research above all.
// Each bot reads the exact effects of both answers, so it plays better informed than a person who sees dots.
import fs from 'fs'; import vm from 'vm';
const dir = '.', RUNS = +(process.argv[2] || 1500);
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
for (const ARCH of ['vibe_coder', 'biologist']) {
  let fires = 0, cards = 0, runsWith = 0;
  for (let i = 0; i < RUNS; i++) {
    const g = makeGame(i * 7919 + 13);
    g.run(`save.archetypes.push('double_agent','gym_bro','neurodivergent'); selectArchetype('${ARCH}'); var __fires = 0; var __orig = applyPerk; applyPerk = function(...a) { const r = __orig(...a); if (r !== a[2]) __fires++; return r; };`);
    let guard = 0;
    while (g.run('gameState.phase') !== 'ending' && guard++ < 400) {
      const ph = g.run('gameState.phase');
      if (ph === 'rotation_complete') { g.run('continueToPI()'); continue; }
      if (ph === 'pi_selection') { g.run("selectPI('mentor')"); continue; }
      if (ph === 'semester_advance') { g.run('continueSemester()'); continue; }
      if (ph === 'play') {
        if (!g.run('gameState.currentCard')) { g.run('render()'); continue; }
        cards++; g.run(`choose('${g.rand() < 0.5 ? 'left' : 'right'}')`); continue;
      }
      break;
    }
    const f = g.run('__fires'); fires += f; if (f) runsWith++;
  }
  console.log(`${ARCH}: ${(fires / RUNS).toFixed(2)} perk changes per run, ${(100 * runsWith / RUNS).toFixed(0)}% of runs see at least one, ${(cards / RUNS).toFixed(0)} cards per run (${RUNS} runs)`);
}
