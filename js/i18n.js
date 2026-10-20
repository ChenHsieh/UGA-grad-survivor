// Language for the badge screens: English (default) or Traditional Chinese. The choice is remembered.
// Only the badge, its words and the transcript are translated; the cards stay in English.
let lang = 'en';
try { if (localStorage.getItem('uga_lang') === 'zh') lang = 'zh'; } catch (e) {}
document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');

const UI_ZH = {
  kept: (k, s) => `守住${BADGE_BAR_NAMES_ZH[k]} · 花掉${BADGE_BAR_NAMES_ZH[s]}`,
  semester: n => `第 ${n} 學期`,
  ending: { defended: '通過口試', mastered_out: '拿了碩士離開', burnt_out: '心力耗盡', hospitalized: '進了醫院', broke: '錢花光了', disappeared: '不再出現' },
  seeEnding: '看看怎麼結束的', yourBadge: '你的徽章', saveImage: '儲存圖片', share: '分享',
  saved: '已儲存。', couldNot: '做不出圖片。', badgeCard: '徽章卡',
  badgesOf: (a, b) => `徽章 ${a} / ${b}`,
  credit: '致敬 Reigns（Nerial, 2016）。虛構作品，非 UGA 官方產品。',
  tag: '十個學期，看看你是哪一種研究生。',
  iAm: '我是', shareLine: (n, e, sem, c) => `我是「${n}」。第 ${sem} 學期${e}，找到 ${c} / 6 種結局。你能順利畢業嗎？`,
  protectSpend: '守住', transcript: '紀錄',
};
function bt(id) {
  const b = BADGES[id];
  return lang === 'zh' ? b.zh : b;
}
function barName(k) { return lang === 'zh' ? BADGE_BAR_NAMES_ZH[k] : BADGE_BAR_NAMES[k]; }
function keptLine(k, s) { return lang === 'zh' ? UI_ZH.kept(k, s) : `Kept ${BADGE_BAR_NAMES[k]} · spent ${BADGE_BAR_NAMES[s]}`; }
function setLang(l) {
  lang = l === 'zh' ? 'zh' : 'en';
  try { localStorage.setItem('uga_lang', lang); } catch (e) {}
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
  render();
}
function langSwitch() {
  return `<div class="lang-switch" role="group" aria-label="Language"><button class="lang-btn ${lang === 'en' ? 'on' : ''}" aria-pressed="${lang === 'en'}" onclick="setLang('en')">English</button><button class="lang-btn ${lang === 'zh' ? 'on' : ''}" aria-pressed="${lang === 'zh'}" lang="zh-Hant" onclick="setLang('zh')">繁體中文</button></div>`;
}
