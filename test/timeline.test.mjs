// Timeline test. Run from the repository root: node test/timeline.test.mjs
// 1. Every card has a non-empty window of semesters in which the engine can serve it.
// 2. Every card whose text states or implies a time (months of work, a year, a semester number,
//    a season, "5th year", defense in N weeks) is listed in FACTS with the semesters where that
//    text is true, and the engine window must sit inside it. A card with a time phrase that is in
//    neither FACTS nor NEUTRAL fails, so a new card cannot slip in unchecked.
// 3. Many seeded runs through the real engine: every card served is inside its window and fact.
// 4. Narrator lines and semester labels name the right year.
// Semester s is year ceil(s/2); odd semesters are fall, even are spring; about 6 months each.
import fs from 'fs'; import vm from 'vm';
const root = process.cwd();
let failures = 0;
const said = new Set();
const fail = m => { if (said.has(m)) return; said.add(m); failures++; console.log('FAIL ' + m); };

function load(seed) {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const store = {};
  const ctx = { console, Math: Object.create(Math), JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
  ctx.Math.random = rand;
  vm.createContext(ctx);
  for (const f of ['archetypes','pi-data','cards-phase1','cards-phase2','cards-phase3','cards-universal','cards-callback','cards-milestone','cards-exclusive','badges'])
    vm.runInContext(fs.readFileSync(`${root}/js/data/${f}.js`, 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(`${root}/js/engine.js`, 'utf8'), ctx);
  vm.runInContext(`function render(){ if (gameState.phase==='play' && !gameState.currentCard) gameState.currentCard = drawCard(); } function highlightArchetype(){} function setTimeout(){}`, ctx);
  return { ctx, rand, run: c => vm.runInContext(c, ctx) };
}
const g0 = load(1);
const lists = g0.run('({PHASE1_CARDS,PHASE2_CARDS,PHASE3_CARDS,UNIVERSAL_CARDS,EXCLUSIVE_CARDS,CALLBACK_CARDS,MILESTONE_CARDS,PI_EXCLUSIVE_CARDS})');
const POOL = { PHASE1_CARDS: [1, 2], PHASE2_CARDS: [3, 6], PHASE3_CARDS: [7, 10], UNIVERSAL_CARDS: [1, 10], EXCLUSIVE_CARDS: [1, 10], CALLBACK_CARDS: [1, 10], PI_EXCLUSIVE_CARDS: [2, 10], MILESTONE_CARDS: null };
const MS_SEM = { ms_quals: [4, 10], ms_committee_1: [6, 6], ms_committee_2: [8, 8], ms_defense_sched: [9, 9], ms_defense: [10, 10], ms_rotation: [1, 1] };
const cards = {};
for (const [k, list] of Object.entries(lists)) for (const c of list) cards[c.id] = { ...c, pool: k };

const seasonOk = (c, s) => c.season === 'fall' ? s % 2 === 1 : c.season === 'spring' ? s % 2 === 0 : true;
function windowOf(c, memo = {}) {
  if (memo[c.id]) return memo[c.id];
  let [lo, hi] = POOL[c.pool] || MS_SEM[c.id] || [1, 10];
  if (c.minSem) lo = Math.max(lo, c.minSem);
  if (c.maxSem) hi = Math.min(hi, c.maxSem);
  if (c.requires && c.after) {   // earliest the card that set the flag can be played, plus the gap
    for (const flag of c.requires) {
      const setter = Object.values(cards).find(x => x.sets && x.sets.includes(flag));
      if (setter) lo = Math.max(lo, windowOf(setter, memo)[0] + c.after);
    }
  }
  const sems = []; for (let s = lo; s <= hi; s++) if (seasonOk(c, s)) sems.push(s);
  return (memo[c.id] = [lo, hi, sems]);
}

// What the text claims. min/max are semesters where it is true; why says how that was worked out.
// "N months of work so far" is true once N <= 6*(s-1)+3 (the card can come mid-semester).
const FACTS = {
  first_rotation:       { min: 1, max: 1, why: 'First Rotation: only in semester 1' },
  early_burnout:        { min: 2, max: 2, why: 'text says Semester 2' },
  quals_announced:      { min: 2, max: 2, why: 'exam is in semester 4, a year after semester 2' },
  first_conf_poster:    { min: 1, why: '3 weeks of data fits any time' },
  lab_flood:            { min: 1, why: '3 months of samples' },
  lab_meeting:          { min: 2, why: 'slides 6 months old' },
  p_value:              { min: 2, why: '6 months' },
  data_breach:          { min: 2, why: '6 months of data' },
  scooped:              { min: 3, why: '14 months of work' },
  is_publishable:       { min: 4, why: '18 months on a project' },
  project_reassigned:   { min: 2, why: '8 months' },
  imposter_vindicated:  { min: 10, why: 'defense in 6 weeks: only the last semester' },
  defense_scheduled_card: { min: 10, why: 'defense in 11 weeks' },
  ice_storm:            { min: 10, why: 'defense in 3 weeks' },
  '5th_year_blues':     { min: 9, why: 'semesters 9 and 10 are year 5' },
  the_submission:       { min: 9, why: '5 years of work' },
  chapter_done:         { min: 7, why: '14 months of one chapter; late phase' },
  journal_rejection:    { min: 6, why: 'seven months of work' },
  someone_submitted:    { min: 7, why: 'a labmate submitted a dissertation' },
  job_market:           { min: 8, why: 'postdoc offers come in the last years' },
  pipeline_callback:    { min: 4, why: '18 months after a pipeline built in year 1' },
  student_returns:      { min: 4, why: 'the mentored student has had time to publish' },
  spring_in_athens:     { spring: true, why: 'It is March' },
  funding_terminated:   { spring: true, why: 'It is March, funding ends in May' },
  rotation_student:     { fall: true, why: 'a new first-year has arrived' },
  quals_callback:       { min: 3, max: 4, why: 'the exam is close' },
};
// Time words that are state-independent on purpose (reviewed): a number of weeks that is about the
// card's own scene, a quoted statement, a fact about the world, or someone else's history.
const NEUTRAL = new Set(['orientation','cohort_party','orientation_bbq','stipend_letter','advisor_ghost','meeting_cancel','conf_inspiration',
  'grant_deadline','linkedin','rent_hike_v2','nsf_cut','ta_overload','student_crisis','therapy_waitlist','comparison_spiral','authorship_politics',
  'unpaid_summer','war_funding','retaliation','advisor_favorite','advisor_moving_goalposts','advisor_vacation','committee_betrayal','kallisto',
  'rent_hike','espresso','parking_pass','athens_music_scene','linkedin_lunatic','lab_ai_policy','ai_will_replace_us','ai_code_vs_purist','excel_bioinformatician',
  'medication_refill','medication_cost','protein_budget','legendary_party','overachiever_burnout','volunteered_committee','havent_seen_advisor','gentle_nudge',
  'pi_also_panicking','tenure_review','pi_rewrote_abstract','pi_stole_talk','grant_result','cookie_callback','allnighter_cost','ms_quals','ms_defense_sched','ms_defense',
  'friend_text','health_insurance','grad_coordinator_saves','it_support_hero','five_points_bar','brewery_night','pickleball','stipend_late','docker_refusal_postdoc',
  'slacking_technician','messy_postdoc','plant_path_collab','stress_baking','cohort_dropout','relationship_dept','friend_group_shift','github_down','staff_coffee_hour','imposter_moment','ms_committee_1','ms_committee_2']);
const TIME_RE = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|eighteen)[- ](month|year|week)s?\b|\byears?\b|\bsemesters?\b|\b\d(st|nd|rd|th)[- ]year\b|\b(first|second|third|fourth|fifth|sixth)[- ]year\b|\b(march|spring|summer|fall|winter)\b|\b(last|next|this) (year|month|semester)\b|\bmonths?\b/i;

const win = {};
for (const c of Object.values(cards)) {
  const [lo, hi, sems] = (win[c.id] = windowOf(c));
  if (!sems.length) fail(`${c.id} (${c.pool}) can never be served: window ${lo}-${hi}${c.season ? ' ' + c.season : ''}`);
}
for (const c of Object.values(cards)) {
  const text = [c.title, c.body, c.cL, c.cR].join(' | ');
  const f = FACTS[c.id], [, , sems] = win[c.id];
  if (TIME_RE.test(text) && !f && !NEUTRAL.has(c.id)) fail(`${c.id} has time words but is in neither FACTS nor NEUTRAL: ${text.match(TIME_RE)[0]}`);
  if (f && sems.length) {
    const bad = sems.filter(s => (f.min && s < f.min) || (f.max && s > f.max) || (f.spring && s % 2) || (f.fall && !(s % 2)));
    if (bad.length) fail(`${c.id}: text true only for ${f.why}; engine serves it in semester ${bad.join(',')}`);
  }
}
for (const id of Object.keys(FACTS)) if (!cards[id]) fail(`FACTS names a card that does not exist: ${id}`);
for (const id of NEUTRAL) if (!cards[id]) fail(`NEUTRAL names a card that does not exist: ${id}`);
// "N years left / to go" depends on where the player is, so no card may say it.
for (const c of Object.values(cards)) { const m = [c.title, c.body, c.cL, c.cR].join(' ').match(/\b\w+ (years?|semesters?|months?) (left|to go|remain\w*)\b/i); if (m) fail(`${c.id} counts time left: "${m[0]}"`); }
// The advisor is chosen at the end of semester 1 and the committee forms in semester 2, so no card
// may talk about "your advisor", "your PI" or "your committee" before semester 2.
const ADVISOR_RE = /\b(advisor|PI|supervisor|committee)\b/i;
const OTHERS = new Set(['five_points_bar','volunteered_committee','ms_rotation']);   // someone else's advisor / a different committee
for (const c of Object.values(cards)) {
  if (OTHERS.has(c.id) || !ADVISOR_RE.test([c.title, c.body, c.cL, c.cR].join(' '))) continue;
  if (win[c.id][2].length && win[c.id][0] < 2) fail(`${c.id} mentions the advisor or committee but can appear in semester ${win[c.id][0]}`);
}
// a literal "Semester N" in card text must match the only semester it can appear in
for (const c of Object.values(cards)) {
  const m = [c.title, c.body, c.cL, c.cR].join(' ').match(/\bSemester (\d+)\b/);
  if (m && win[c.id][2].some(s => s !== +m[1])) fail(`${c.id} says Semester ${m[1]} but can appear in ${win[c.id][2]}`);
}

// Narrator and labels: year words must match ceil(semester/2).
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };
const nar = g0.run('NARRATOR_SEM');
for (const [n, line] of Object.entries(nar)) {
  const m = line.match(/\b(first|second|third|fourth|fifth)[- ]year\b/i);
  if (m && ORD[m[1].toLowerCase()] !== Math.ceil(n / 2)) fail(`narrator line for semester ${n} says ${m[0]}`);
  if (/\bhalfway\b/i.test(line) && +n !== 6) fail(`narrator says halfway at semester ${n}`);
}

// Real engine runs: every card served is inside its window and fact.
const ARCHS = ['overachiever','vibe_coder','fun_haver','global_student','biologist'];
const PIS = ['micromanager','ghost','mentor','new_pi','exploiter','dynasty'];
let served = 0, runs = +(process.env.RUNS || 1500); const seen = {}, endings = {};
for (let i = 0; i < runs; i++) {
  const g = load(i * 7919 + 5);
  g.run(`save.archetypes.push('double_agent','gym_bro','neurodivergent'); selectArchetype('${ARCHS[i % 5]}')`);
  const bias = (i % 3) / 2;
  let guard = 0;
  while (g.run('gameState.phase') !== 'ending' && guard++ < 600) {
    const ph = g.run('gameState.phase');
    if (ph === 'rotation_complete') { g.run('continueToPI()'); continue; }
    if (ph === 'pi_selection') { g.run(`selectPI('${PIS[Math.floor(g.rand() * 6)]}')`); continue; }
    if (ph === 'semester_advance') { g.run('continueSemester()'); continue; }
    if (ph === 'play') {
      if (!g.run('gameState.currentCard')) { g.run('render()'); continue; }
      const id = g.run('gameState.currentCard.id'), sem = g.run('gameState.semester'); served++;
      (seen[id] = seen[id] || new Set()).add(sem);
      const c = cards[id]; if (!c) { fail('served unknown card ' + id); break; }
      if (win[id] && !win[id][2].includes(sem) && c.pool !== 'MILESTONE_CARDS') fail(`${id} served in semester ${sem}, window ${win[id][2]}`);
      const f = FACTS[id]; if (f && ((f.min && sem < f.min) || (f.max && sem > f.max) || (f.spring && sem % 2) || (f.fall && !(sem % 2)))) fail(`${id} served in semester ${sem}: ${f.why}`);
      g.run(`choose('${g.rand() < 0.5 + bias * 0 ? 'left' : 'right'}')`); continue;
    }
    break;
  }
  const e = g.run('gameState.ending'); endings[e] = (endings[e] || 0) + 1;
  if (e === 'defended' && !g.run("gameState.memory.includes('defended')")) fail(`run ${i} ended defended without the defense card (pool ran dry)`);
}
const never = Object.keys(cards).filter(id => !seen[id] && cards[id].pool !== 'MILESTONE_CARDS' && win[id][2].length);
console.log(`runs ${runs}, cards served ${served}, distinct ids ${Object.keys(seen).length}/${Object.keys(cards).length}, endings`, JSON.stringify(endings));
if (never.length) console.log('not seen in these runs (info):', never.join(', '));
console.log(failures ? `${failures} FAILURE(S)` : 'timeline test passed');
process.exit(failures ? 1 : 0);
