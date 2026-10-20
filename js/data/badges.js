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
const BADGE_BAR_NAMES_ZH = { mind: '心智', body: '身體', wallet: '錢包', bonds: '朋友', research: '研究' };
const BADGE_BAR_NAMES = { mind: 'Mind', body: 'Body', wallet: 'Wallet', bonds: 'Friends', research: 'Research' };
const BADGE_TYPICAL = { mind: 46, body: 45, wallet: 50, bonds: 61, research: 31 };

const BADGES = {
  'mind-body':       { name: 'Calm Mind, Sore Back', line: 'Your head stayed clear. Your back did not. The chair has your shape now.', chips: ['Calm', 'Stiff', 'Caffeinated'],
                       zh: { name: '腦袋清醒，背很痠', line: '腦袋一直很清楚，背就不一定了。那張椅子已經長成你的形狀。', chips: ['冷靜', '僵硬', '咖啡因'] } },
  'mind-wallet':     { name: 'Calm but Broke', line: 'You kept your peace and spent your rent money. The noodles were a fair trade.', chips: ['Calm', 'Thrifty', 'Noodles'],
                       zh: { name: '心很靜，錢很少', line: '你守住了平靜，花光了房租。泡麵換平靜，算公平。', chips: ['冷靜', '節儉', '泡麵'] } },
  'mind-bonds':      { name: 'Head Down, Phone Off', line: 'Quiet head, quiet phone. You will answer the group chat on Thursday.', chips: ['Calm', 'Unreachable', 'Focused'],
                       zh: { name: '埋頭做事，手機不回', line: '腦袋很靜，手機也很靜。群組訊息星期四再回。', chips: ['冷靜', '找不到人', '專心'] } },
  'mind-research':   { name: 'Relaxed and Behind', line: 'Nothing is on fire, not even the thesis. You chose that, and it felt nice.', chips: ['Relaxed', 'Behind', 'Rested'],
                       zh: { name: '悠哉但落後', line: '什麼都沒著火，論文也沒有。這是你自己選的，感覺還不錯。', chips: ['放鬆', '落後', '睡飽'] } },
  'body-mind':       { name: 'Fit but Worried', line: 'Strong legs, loud thoughts. You ran away from the worry and it kept up.', chips: ['Fit', 'Wired', 'Restless'],
                       zh: { name: '身體很棒，心很煩', line: '腿很有力，腦子很吵。你跑著躲開煩惱，它卻跟上來了。', chips: ['健康', '緊繃', '靜不下來'] } },
  'body-wallet':     { name: 'Gym Rat, Empty Wallet', line: 'You paid for the pool and the weights. The bank account noticed.', chips: ['Fit', 'Broke', 'Hydrated'],
                       zh: { name: '練出肌肉，錢包見底', line: '你把錢花在泳池和健身房，銀行帳戶都看見了。', chips: ['健康', '沒錢', '水喝很夠'] } },
  'body-bonds':      { name: 'Runs Alone', line: 'Sunrise, trail, nobody else. You are in great shape and hard to reach.', chips: ['Fit', 'Alone', 'Early'],
                       zh: { name: '一個人晨跑', line: '日出、小徑、沒有別人。你體力很好，也很難聯絡。', chips: ['健康', '獨來獨往', '早起'] } },
  'body-research':   { name: 'Weekend Hiker', line: 'You got outside. The data waited politely.', chips: ['Outdoorsy', 'Rested', 'Behind'],
                       zh: { name: '週末登山客', line: '你出門走走了，資料很有禮貌地等著。', chips: ['愛戶外', '休息夠', '落後'] } },
  'wallet-mind':     { name: 'Saver, Stressed', line: 'Every dollar had its own row. A few worries did too.', chips: ['Careful', 'Tense', 'Solvent'],
                       zh: { name: '存了錢，也存了煩惱', line: '每一塊錢都有自己的一欄，幾個煩惱也有。', chips: ['謹慎', '緊張', '有存款'] } },
  'wallet-body':     { name: 'Instant Noodle Saver', line: 'The savings are real. So is the salt.', chips: ['Frugal', 'Tired', 'Stocked up'],
                       zh: { name: '泡麵存錢族', line: '存款是真的，鈉也是真的。', chips: ['節儉', '疲倦', '囤貨'] } },
  'wallet-bonds':    { name: 'Stays Home, Saves Cash', line: 'You skipped the dinners and kept the money. Fair, and a little lonely.', chips: ['Thrifty', 'At home', 'Solvent'],
                       zh: { name: '宅在家存錢', line: '聚餐都沒去，錢都留下來了。很合理，也有點孤單。', chips: ['節儉', '在家', '有存款'] } },
  'wallet-research': { name: 'Side Job Hero', line: 'The side job paid well. The project is still a rough draft.', chips: ['Hustling', 'Solvent', 'Distracted'],
                       zh: { name: '打工達人', line: '打工賺了不少，研究還只是草稿。', chips: ['很拚', '有存款', '分心'] } },
  'bonds-mind':      { name: 'Everyone’s Lab Parent', line: 'Everyone’s birthday is on your calendar. Your own rest is not.', chips: ['Warm', 'Frazzled', 'Reliable'],
                       zh: { name: '大家的實驗室家長', line: '每個人的生日都在你的行事曆上，你自己的休息卻不在。', chips: ['溫暖', '焦頭爛額', '可靠'] } },
  'bonds-body':      { name: 'Conference Social Star', line: 'Every room knows your name. Your feet want a chair.', chips: ['Social', 'Worn out', 'Well known'],
                       zh: { name: '研討會社交之星', line: '每個會場都認得你，你的腳只想坐下。', chips: ['社交', '累壞了', '人脈廣'] } },
  'bonds-wallet':    { name: 'Always Pays the Bill', line: 'You covered the table again. They love you. Your card has questions.', chips: ['Generous', 'Loved', 'Overdrawn'],
                       zh: { name: '總是請客的人', line: '這桌又是你付。大家都愛你，你的信用卡有疑問。', chips: ['大方', '人緣好', '透支'] } },
  'bonds-research':  { name: 'Party Planner', line: 'The potluck was perfect. The chapter comes after the potluck.', chips: ['Loved', 'Organized', 'Behind'],
                       zh: { name: '聚餐總召', line: '聚餐辦得很完美，論文章節等聚餐之後再說。', chips: ['人緣好', '有條理', '落後'] } },
  'research-mind':   { name: 'Productive but Frazzled', line: 'The jobs ran and the figures got done. Your head has seen better semesters.', chips: ['Productive', 'Wired', 'Persistent'],
                       zh: { name: '很有產出，也很緊繃', line: '程式跑完了，圖也做完了。你的腦袋有過比較好的學期。', chips: ['有產出', '緊繃', '堅持'] } },
  'research-body':   { name: 'Hunched at the Desk', line: 'Papers up, posture down. You and the chair are one organism.', chips: ['Productive', 'Hunched', 'Night owl'],
                       zh: { name: '駝背的工作狂', line: '論文變多，姿勢變差。你和椅子已經合為一體。', chips: ['有產出', '駝背', '夜貓子'] } },
  'research-wallet': { name: 'Papers, No Money', line: 'The results are in. The savings are not.', chips: ['Driven', 'Broke', 'Productive'],
                       zh: { name: '論文多，錢包空', line: '成果都出來了，存款還沒有。', chips: ['拚勁', '沒錢', '有產出'] } },
  'research-bonds':  { name: 'Gets It Done Alone', line: 'You finished, mostly on your own. People will say it went fast.', chips: ['Driven', 'Alone', 'Focused'],
                       zh: { name: '一個人默默完成', line: '你大多是自己完成的，別人會說進度好快。', chips: ['拚勁', '獨自一人', '專心'] } },
};
const BADGE_IDS = Object.keys(BADGES);

function badgeHint(id) {
  const [keep, spend] = id.split('-');
  return lang === 'zh' ? `守住${BADGE_BAR_NAMES_ZH[keep]}，花掉${BADGE_BAR_NAMES_ZH[spend]}` : `Protect ${BADGE_BAR_NAMES[keep]}, spend ${BADGE_BAR_NAMES[spend]}`;
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
