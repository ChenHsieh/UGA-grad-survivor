// Badges, the narrator, and the speaker labels.
//
// Every run ends on a badge. It comes from what you protected and what you spent: of the five bars
// (Mind, Body, Wallet, Friends, Research) the one that sat highest across the run, and the one you let
// sit lowest. 5 x 4 = 20 badges, written by hand. The id is "<kept>-<spent>".
//
// "Highest" and "lowest" are measured against what a typical run does to each bar, because Research
// climbs by design while Wallet slides; BADGE_TYPICAL holds those typical averages (measured from bot
// runs, see simulation/badges.mjs, bot not human) and a bar's score is its average minus its typical one.

const BADGE_BARS = ['mind', 'body', 'wallet', 'bonds', 'research'];
const BADGE_BAR_NAMES = { mind: 'Mind', body: 'Body', wallet: 'Wallet', bonds: 'Friends', research: 'Research' };
const BADGE_TYPICAL = { mind: 46, body: 45, wallet: 50, bonds: 61, research: 31 };

const BADGES = {
  'mind-body':     { name: 'The Sleepless Sage',          line: 'Your head stayed clear and your back did not. The chair has your shape now.', chips: ['Clear-headed', 'Stooped', 'Caffeinated'] },
  'mind-wallet':   { name: 'The Broke Philosopher',       line: 'You kept your peace and spent your rent. The noodles were a fair trade.', chips: ['Calm', 'Thrifty', 'Noodle-fed'] },
  'mind-bonds':    { name: 'The Lab Hermit',              line: 'Quiet head, quiet phone. You will answer the group chat on Thursday.', chips: ['Calm', 'Unreachable', 'Focused'] },
  'mind-research': { name: 'The Contented Procrastinator', line: 'Nothing is on fire, including the thesis. That was a choice, and a pleasant one.', chips: ['Relaxed', 'Behind', 'Well-rested'] },
  'body-mind':     { name: 'The Marathon Worrier',        line: 'Strong legs, loud thoughts. You ran from the spiral and it kept up.', chips: ['Fit', 'Wired', 'Restless'] },
  'body-wallet':   { name: 'The Gym Membership Believer', line: 'You paid for the pool and the lungs. The bank account noticed.', chips: ['Fit', 'Broke', 'Hydrated'] },
  'body-bonds':    { name: 'The Lone Runner',             line: 'Sunrise, trail, nobody. You are in great shape and hard to reach.', chips: ['Fit', 'Solo', 'Early'] },
  'body-research': { name: 'The Weekend Hiker',           line: 'You got outside. The data waited politely.', chips: ['Outdoorsy', 'Rested', 'Behind'] },
  'wallet-mind':   { name: 'The Spreadsheet Saver',       line: 'Every dollar had a row. A few worries did not.', chips: ['Careful', 'Tense', 'Solvent'] },
  'wallet-body':   { name: 'The Instant Noodle Banker',   line: 'The savings are real. So is the sodium.', chips: ['Frugal', 'Tired', 'Stocked'] },
  'wallet-bonds':  { name: 'The Coupon Hermit',           line: 'You skipped the dinners and kept the cash. Fair, and a little lonely.', chips: ['Thrifty', 'At home', 'Solvent'] },
  'wallet-research': { name: 'The Side-Gig Genius',       line: 'The side job paid. The project is still a rough draft.', chips: ['Hustling', 'Solvent', 'Distracted'] },
  'bonds-mind':    { name: 'The Lab Parent',              line: 'Everyone’s birthday is on your calendar. Your own head is not.', chips: ['Warm', 'Frazzled', 'Reliable'] },
  'bonds-body':    { name: 'The Conference Butterfly',    line: 'Every room knows your name. Your knees want a chair.', chips: ['Social', 'Frayed', 'Well-known'] },
  'bonds-wallet':  { name: 'The Round Buyer',             line: 'You covered the table again. They love you and your card has questions.', chips: ['Generous', 'Beloved', 'Overdrawn'] },
  'bonds-research': { name: 'The Social Chair',           line: 'The potluck was flawless. The chapter will come after the potluck.', chips: ['Beloved', 'Organized', 'Behind'] },
  'research-mind': { name: 'The Cluster Whisperer',       line: 'The jobs ran and the figures got done. Your head has seen better semesters.', chips: ['Productive', 'Wired', 'Persistent'] },
  'research-body': { name: 'The Lab Gremlin',             line: 'Papers up, posture down. You and the chair are one organism.', chips: ['Productive', 'Hunched', 'Nocturnal'] },
  'research-wallet': { name: 'The Ramen Scholar',         line: 'The results are in. The savings are not.', chips: ['Driven', 'Broke', 'Productive'] },
  'research-bonds': { name: 'The Quiet Finisher',          line: 'You got it done, mostly alone. People will say it went fast.', chips: ['Driven', 'Solo', 'Focused'] },
};
const BADGE_IDS = Object.keys(BADGES);

function badgeHint(id) {
  const [keep, spend] = id.split('-');
  return `Protect ${BADGE_BAR_NAMES[keep]}, spend ${BADGE_BAR_NAMES[spend]}`;
}

// Which badge a run earned. `track` holds the running sum of each bar as the player saw it before each
// card; the bars as the run ended count as one more sample.
function computeBadge(track, finalBars) {
  const n = (track && track.n) || 0;
  const avg = {};
  BADGE_BARS.forEach(k => { avg[k] = ((track ? track.sum[k] : 0) + finalBars[k]) / (n + 1); });
  const score = {};
  BADGE_BARS.forEach(k => { score[k] = avg[k] - BADGE_TYPICAL[k]; });
  const byScore = BADGE_BARS.slice().sort((a, b) => score[b] - score[a]);
  const keep = byScore[0];
  const spend = byScore.filter(k => k !== keep).pop();
  return { id: `${keep}-${spend}`, keep, spend, avg };
}

// ── The narrator: a fifth-year in your lab, unnamed ─────────────────
const NARRATOR = 'Fifth-year';
const NARRATOR_INTRO = 'Ten semesters. Keep four bars above zero. At the end I will tell you what kind of grad student you are.';
const NARRATOR_SEM = {
  3: 'Second year. Nobody warned me either.',
  4: 'Exam term. Eat something first.',
  5: 'Still here. That counts.',
  6: 'Halfway. The hard part is quiet.',
  7: 'Fourth year. Everyone gets strange here.',
  8: 'Look up once in a while.',
  9: 'I can see the door from here.',
  10: 'Last one. Take your time. Not too much.',
};
const NARRATOR_REVEAL = {
  defended: 'You made it. Here is how I would describe you.',
  mastered_out: 'Not the road you planned. Here is who you were on it.',
  default: 'That one stung. Here is who you were while it lasted.',
};

// ── Speaker labels: who is talking on a card ────────────────────────
const SPEAKER_BY_TAG = {
  'Day One': 'The program', Milestone: 'The program', MILESTONE: 'The program', Rotation: 'Rotation lab',
  Advisor: 'Your advisor', Committee: 'Your committee', 'Peer Review': 'Reviewer 2',
  Funding: 'Stipend office', 'Funding Crisis': 'Stipend office',
  Computing: 'The cluster', Pipeline: 'The cluster', 'Pipeline Failure': 'The cluster',
  'Lab Politics': 'The lab', 'Lab Drama': 'The lab', 'Lab Life': 'The lab',
  Social: 'Cohort chat', 'Social Drama': 'Cohort chat',
  'Human Existence': 'You, at 2am', 'Existential Event': 'You, at 2am', 'Big Mood': 'You, at 2am', 'Self Care': 'You, at 2am',
  Health: 'You, at 2am', 'Mental Health': 'You, at 2am', 'Identity Crisis': 'You, at 2am', Survival: 'You, at 2am',
  'Rare Win': 'A good day', 'Small Win': 'A good day', Validation: 'A good day',
  'Black Swan': 'Out of nowhere', Cruel: 'Bad luck',
  Privilege: 'The fine print', 'Academic Politics': 'The fine print',
  'Athens Life': 'Athens', 'Athens Reality': 'Athens', 'Campus Life': 'Athens', 'Campus Reality': 'Athens',
  'Life Event': 'Home', Callback: 'Past you', 'Support Staff': 'The front office',
  Collaboration: 'A collaborator', Networking: 'A stranger', Career: 'The job market', Conference: 'Conference hall',
  Marketing: 'Your feed', Temptation: 'A side offer', Teaching: 'Your students', 'Teaching Labor': 'Your students',
  Dissertation: 'Your dissertation', Preparation: 'Your calendar',
  Overachiever: 'You, being you', 'Vibe-Coder': 'You, being you', 'Fun Haver': 'You, being you', 'Global Student': 'You, being you',
  Biologist: 'You, being you', 'Double Agent': 'You, being you', 'Gym Bro': 'You, being you', Neurodivergent: 'You, being you',
};
// Cards where the tag's speaker is the wrong person.
const SPEAKER_BY_CARD = {
  conf_inspiration: 'Conference hall',
  practice_defense: 'Your committee',
  free_food: 'Seminar flyer',
  stress_baking: 'You, at midnight',
  first_ta: 'Your students',
  imposter_moment: 'A first-year',
  cohort_party: 'Cohort chat',
  advisor_leaves: 'Your advisor',
  cohort_dropout: 'Cohort chat',
  committee_betrayal: 'Your committee',
  journal_rejection: 'The editor',
  scooped: 'A preprint server',
  retaliation: 'The lab',
  grade_dispute_escalation: 'Your students',
};
function speakerFor(card) {
  if (!card) return '';
  return SPEAKER_BY_CARD[card.id] || SPEAKER_BY_TAG[card.tag] || card.tag;
}
