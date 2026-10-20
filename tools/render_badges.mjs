// Writes r/<badge-id>/index.html and r/<badge-id>/card.png for all 20 badges.
// The PNG comes from the same canvas code as the in-game "Save image" (js/badge-card.js), run in a headless browser.
// usage: PW_FROM=<dir that has playwright-core in node_modules> CHROME=<chrome binary> node tools/render_badges.mjs
import fs from 'fs'; import path from 'path'; import http from 'http'; import { createRequire } from 'module';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { chromium } = createRequire(process.env.PW_FROM || process.cwd() + '/')('playwright-core');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
await page.waitForTimeout(800);
const BASE = 'https://chenhsieh.github.io/UGA-grad-survivor/';
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ids = await page.evaluate(() => BADGE_IDS);
for (const id of ids) {
  const { png, b } = await page.evaluate(async id => {
    const [keep, spend] = id.split('-');
    const avg = { mind: 45, body: 45, wallet: 45, bonds: 45, research: 45 }; avg[keep] = 72; avg[spend] = 24;
    const c = document.createElement('canvas');
    await drawBadgePreview(c, { id, keep, spend, avg, ending: null, semester: 0 });
    return { png: c.toDataURL('image/png'), b: BADGES[id] };
  }, id);
  const dir = path.join(root, 'r', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'card.png'), Buffer.from(png.split(',')[1], 'base64'));
  const title = `I'm ${b.name}`, desc = `${b.line} UGA Grad Survivor: ten semesters, and a badge for the kind of grad student you were.`;
  fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} · UGA Grad Survivor</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${BASE}r/${id}/">
<meta property="og:image" content="${BASE}r/${id}/card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${BASE}r/${id}/card.png">
<meta name="theme-color" content="#0e0c0a">
<meta http-equiv="refresh" content="0; url=../../">
<link rel="canonical" href="${BASE}">
<style>body{background:#0e0c0a;color:#f5f0e8;font:16px/1.5 system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}a{color:#d4a017}</style>
<script>location.replace('../../');</script>
</head>
<body>
<p>Opening <a href="../../">UGA Grad Survivor</a>.</p>
</body>
</html>
`);
}
await browser.close(); server.close();
console.log('wrote', ids.length, 'badge pages');
