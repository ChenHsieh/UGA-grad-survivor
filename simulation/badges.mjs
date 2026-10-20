// How the 20 badges fall across bot players (bot, not human). Also measures the typical per-bar average
// that BADGE_TYPICAL in js/data/badges.js is set from.
// usage: node simulation/badges.mjs [runs per persona]   (run from the repository root)
import fs from 'fs'; import vm from 'vm';
const RUNS = +(process.argv[2] || 400);
function makeGame(seed) {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const store = {};
  const ctx = { console, Math: Object.create(Math), JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
  ctx.Math.random = rand;
  vm.createContext(ctx);
  for (const f of ['archetypes','pi-data','cards-phase1','cards-phase2','cards-phase3','cards-universal','cards-callback','cards-milestone','cards-exclusive','badges'])
    vm.runInContext(fs.readFileSync(`./js/data/${f}.js`, 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('./js/engine.js', 'utf8'), ctx);
  vm.runInContext(`function render(){ if (gameState.phase==='play' && !gameState.currentCard) gameState.currentCard = drawCard(); } function highlightArchetype(){} function setTimeout(){}`, ctx);
  return { ctx, rand, run: code => vm.runInContext(code, ctx) };
}
const BARS = ['mind','body','wallet','bonds'];
function pickBy(g, score) {
  const st = g.run('gameState.st'), gate = g.run('nextGate()');
  const L = score(st, g.run("predictEffects('left')"), gate), R = score(st, g.run("predictEffects('right')"), gate);
  if (L === R) return g.rand() < 0.5 ? 'left' : 'right';
  return L > R ? 'left' : 'right';
}
const policies = {
  random: g => g.rand() < 0.5 ? 'left' : 'right',
  survivor: g => pickBy(g, (st, fx) => Math.min(...BARS.map(b => st[b] + (fx[b] || 0)))),
  balanced: g => pickBy(g, (st, fx, gate) => { const after = k => st[k] + (fx[k] || 0); const low = Math.min(...BARS.map(after)); const r = after('research'); return Math.min(low, 45) + (r < gate.need + 10 ? 0.8 * (fx.research || 0) : 0.1 * (fx.research || 0)); }),
  researcher: g => pickBy(g, (st, fx) => { const low = Math.min(...BARS.map(b => st[b] + (fx[b] || 0))); return (low <= 0 ? -1000 : 0) + (fx.research || 0) * 3 + Math.min(low, 15); }),
  // keeps one named bar high and lets another go: gives each badge a way to be earned
  keeper: (g, keep, spend) => pickBy(g, (st, fx) => { const a = k => st[k] + (fx[k] || 0); const low = Math.min(...BARS.map(a)); return (low <= 5 ? -1000 : 0) + 2 * (fx[keep] || 0) - 1.2 * Math.max(0, -(fx[spend] || 0)) * 0 + (fx[spend] || 0) * -0.5 + Math.min(low, 12); }),
};
const ARCHS = ['overachiever','vibe_coder','fun_haver','global_student','biologist'];
function play(seed, pol, arch, ...rest) {
  const g = makeGame(seed);
  g.run(`selectArchetype('${arch}')`);
  let guard = 0;
  while (g.run('gameState.phase') !== 'ending' && guard++ < 500) {
    const ph = g.run('gameState.phase');
    if (ph === 'rotation_complete') { g.run('continueToPI()'); continue; }
    if (ph === 'pi_selection') { const pis = ['micromanager','ghost','mentor','new_pi']; g.run(`selectPI('${pis[Math.floor(g.rand()*4)]}')`); continue; }
    if (ph === 'semester_advance') { g.run('continueSemester()'); continue; }
    if (ph === 'play') { if (!g.run('gameState.currentCard')) { g.run('render()'); continue; } g.run(`choose('${pol(g, ...rest)}')`); continue; }
    break;
  }
  const t = g.run('gameState.track'), st = g.run('gameState.st');
  const n = t.n + 1, avg = {}; for (const k of Object.keys(st)) avg[k] = ((t.sum[k] || 0) + st[k]) / n;
  return { avg, badge: g.run('computeBadge(gameState.track, gameState.st)').id, ending: g.run('gameState.ending') };
}
const tot = { mind: 0, body: 0, wallet: 0, bonds: 0, research: 0 }; let N = 0;
const dist = {}, byPersona = {}, endingOf = {};
for (const [name, pol] of Object.entries(policies)) {
  const specs = name === 'keeper' ? ['mind','body','wallet','bonds','research'].flatMap(k => ['mind','body','wallet','bonds','research'].filter(x => x !== k).map(x => [k, x])) : [[]];
  for (const [i0] of specs.map((x, i) => [i])) for (let i = 0; i < Math.ceil(RUNS / specs.length); i++) {
    const r = play(i * 7919 + 13 + i0 * 104729, pol, ARCHS[i % ARCHS.length], ...specs[i0]);
    for (const k of Object.keys(tot)) tot[k] += r.avg[k]; N++;
    dist[r.badge] = (dist[r.badge] || 0) + 1; (byPersona[name] ||= {})[r.badge] = ((byPersona[name] ||= {})[r.badge] || 0) + 1;
  }
}
console.log('typical per-bar average over', N, 'bot runs:', Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, +(v / N).toFixed(1)])));
const ids = ['mind','body','wallet','bonds','research'].flatMap(k => ['mind','body','wallet','bonds','research'].filter(x => x !== k).map(x => k + '-' + x));
console.log('badges reached:', ids.filter(i => dist[i]).length, 'of 20; missing:', ids.filter(i => !dist[i]).join(' ') || 'none');
console.log(ids.map(i => `${i}:${dist[i] || 0}`).join('  '));
