// The badge as a picture. The same code draws the "Save image" card in the browser (1080 x 1350)
// and, run once offline by tools/render_badges.mjs, the link-preview images in r/<badge>/.
// It carries no card text and no names, so a saved image gives nothing away.

const CARD_W = 1080, CARD_H = 1350;
const CARD_CREDIT = 'After Reigns by Nerial (2016). Fiction, not an official UGA product.';
const CARD_URL = 'chenhsieh.github.io/UGA-grad-survivor';
const CARD_C = { bg: '#0e0c0a', panel: '#1a1714', text: '#f5f0e8', dim: '#c9c0ae', muted: '#8f8676', gold: '#d4a017', down: '#ff8a78', track: '#2e2a24' };
const CARD_SERIF = 'Georgia, "Times New Roman", serif';
const CARD_SANS = '"DM Sans", Helvetica, Arial, sans-serif';

const ENDING_WORDS = { defended: 'Defended', mastered_out: 'Left with a master’s', burnt_out: 'Burnt out', hospitalized: 'Ended in hospital', broke: 'Ran out of money', disappeared: 'Stopped showing up' };

function svgToImage(inner, box, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" fill="${color}">${inner}</svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  words.forEach(w => {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}

function fillWrapped(ctx, text, x, y, maxW, lineH) {
  const lines = wrapLines(ctx, text, maxW);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + lines.length * lineH;
}

// spec: { id, keep, spend, avg: {mind..research}, ending, semester }
async function drawBadgeCard(canvas, spec) {
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  const b = BADGES[spec.id];
  ctx.fillStyle = CARD_C.bg; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.textBaseline = 'alphabetic';

  // logo and title, top left
  const hat = await svgToImage(ART_ENDINGS.defended, 64, CARD_C.gold);
  ctx.drawImage(hat, 56, 48, 84, 84);
  ctx.fillStyle = CARD_C.text; ctx.textAlign = 'left';
  ctx.font = `700 46px ${CARD_SERIF}`;
  ctx.fillText('UGA Grad Survivor', 158, 104);

  // badge mark: a ring around the bar you protected, with the bar you spent beside it
  const cx = 540, cy = 430;
  ctx.fillStyle = CARD_C.panel; ctx.beginPath(); ctx.arc(cx, cy, 220, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = CARD_C.gold; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, 220, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  const keepImg = await svgToImage(ART_STATS[spec.keep], 24, CARD_C.gold);
  ctx.drawImage(keepImg, cx - 110, cy - 110, 220, 220);
  const spendDisc = { x: cx + 160, y: cy + 160, r: 62 };
  ctx.fillStyle = CARD_C.bg; ctx.beginPath(); ctx.arc(spendDisc.x, spendDisc.y, spendDisc.r + 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CARD_C.panel; ctx.strokeStyle = CARD_C.down; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(spendDisc.x, spendDisc.y, spendDisc.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const spendImg = await svgToImage(ART_STATS[spec.spend], 24, CARD_C.down);
  ctx.globalAlpha = 0.9; ctx.drawImage(spendImg, spendDisc.x - 34, spendDisc.y - 34, 68, 68); ctx.globalAlpha = 1;

  // title and the one-line read
  ctx.textAlign = 'center';
  ctx.fillStyle = CARD_C.text;
  let size = 84;
  ctx.font = `700 ${size}px ${CARD_SERIF}`;
  while (ctx.measureText(b.name).width > 940 && size > 56) { size -= 4; ctx.font = `700 ${size}px ${CARD_SERIF}`; }
  let y = 790;
  const nameLines = wrapLines(ctx, b.name, 940);
  nameLines.forEach((l, i) => ctx.fillText(l, cx, y + i * (size + 6)));
  y += (nameLines.length - 1) * (size + 6) + 70;
  ctx.fillStyle = CARD_C.dim; ctx.font = `italic 400 38px ${CARD_SERIF}`;
  y = fillWrapped(ctx, b.line, cx, y, 880, 52);

  // ending, semester, and five bars (the run's average, kept and spent marked)
  const rowY = 1030;
  ctx.fillStyle = CARD_C.text; ctx.font = `700 40px ${CARD_SANS}`;
  const rowText = spec.ending ? `${ENDING_WORDS[spec.ending] || 'Finished'} · semester ${spec.semester}`
    : `Kept ${BADGE_BAR_NAMES[spec.keep]} · spent ${BADGE_BAR_NAMES[spec.spend]}`;
  ctx.fillText(rowText, cx, rowY);
  const barW = 150, gap = 28, x0 = (CARD_W - (5 * barW + 4 * gap)) / 2;
  for (let i = 0; i < BADGE_BARS.length; i++) {
    const k = BADGE_BARS[i], x = x0 + i * (barW + gap);
    const col = k === spec.keep ? CARD_C.gold : k === spec.spend ? CARD_C.down : CARD_C.muted;
    const ic = await svgToImage(ART_STATS[k], 24, col);
    ctx.drawImage(ic, x + barW / 2 - 18, rowY + 34, 36, 36);
    ctx.fillStyle = CARD_C.track; ctx.fillRect(x, rowY + 86, barW, 16);
    ctx.fillStyle = col; ctx.fillRect(x, rowY + 86, Math.max(4, barW * Math.min(100, spec.avg[k]) / 100), 16);
    ctx.fillStyle = col; ctx.font = `700 26px ${CARD_SANS}`;
    ctx.fillText(k === spec.keep ? 'Kept' : k === spec.spend ? 'Spent' : '', x + barW / 2, rowY + 136);
  }

  // credit and link
  ctx.fillStyle = CARD_C.muted; ctx.font = `400 27px ${CARD_SANS}`;
  ctx.fillText(CARD_CREDIT, cx, 1268);
  ctx.fillStyle = CARD_C.dim; ctx.font = `700 30px ${CARD_SANS}`;
  ctx.fillText(CARD_URL, cx, 1314);
  return canvas;
}

// The link preview: 1200 x 630, the card on the right and the badge in words on the left.
async function drawBadgePreview(canvas, spec) {
  canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  const b = BADGES[spec.id];
  ctx.fillStyle = CARD_C.bg; ctx.fillRect(0, 0, 1200, 630);
  const full = document.createElement('canvas');
  await drawBadgeCard(full, spec);
  const h = 630 - 40, w = h * CARD_W / CARD_H;
  ctx.drawImage(full, 1200 - w - 30, 20, w, h);
  const hat = await svgToImage(ART_ENDINGS.defended, 64, CARD_C.gold);
  ctx.drawImage(hat, 52, 44, 64, 64);
  ctx.textAlign = 'left'; ctx.fillStyle = CARD_C.text; ctx.font = `700 34px ${CARD_SERIF}`;
  ctx.fillText('UGA Grad Survivor', 134, 90);
  ctx.fillStyle = CARD_C.gold; ctx.font = `700 24px ${CARD_SANS}`;
  ctx.fillText('I got this badge', 54, 214);
  ctx.fillStyle = CARD_C.text;
  let size = 78;
  ctx.font = `700 ${size}px ${CARD_SERIF}`;
  const maxW = 1200 - w - 30 - 54 - 40;
  while (wrapLines(ctx, b.name, maxW).length > 3 && size > 50) { size -= 4; ctx.font = `700 ${size}px ${CARD_SERIF}`; }
  let y = 214 + 24 + size;
  y = fillWrapped(ctx, b.name, 54, y, maxW, size + 6);
  ctx.fillStyle = CARD_C.dim; ctx.font = `italic 400 30px ${CARD_SERIF}`;
  fillWrapped(ctx, b.line, 54, y + 20, maxW, 42);
  ctx.fillStyle = CARD_C.dim; ctx.font = `700 28px ${CARD_SANS}`;
  ctx.fillText('Ten semesters. Which one are you?', 54, 580);
  return canvas;
}
