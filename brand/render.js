/* Regenerates the brand images from the 3D scene in generator.html (the same scene as icone.html, with an export hook).
   Needs Playwright and a copy of three.js 0.160.0 (build/three.min.js):
     npm i -D playwright three@0.160.0 && npx playwright install chromium
     node brand/render.js
   It writes the raw frames to brand/out/. The site uses:
     public/brand/mark-sprite.webp   31 frames of 144 px, 8 columns by 4 rows, tilted from -0.32 to +0.32 rad (frame 15 is face on)
     public/brand/mark.png           the mark face on, 192 px
     app/og/[id]/mark.png            the mark face on, 360 px
     public/icon-192.png, icon-512.png, apple-icon.png   the app icon (mark on its dark plate) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const three = fs.readFileSync(require.resolve('three/build/three.min.js'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.route('**/*', (r) => { const u = r.request().url(); if (u.includes('three.min.js')) return r.fulfill({ body: three, contentType: 'application/javascript' }); return u.startsWith('http') ? r.abort() : r.continue(); });
  await p.goto('about:blank');
  await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(path.join(__dirname, 'generator.html'), 'utf8') + '</body></html>', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__calypso === 'function');
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  /* __calypso(size, onPlate, tiltX, tiltY, appearance, cameraDistance) returns a PNG data URL */
  const save = async (name, args) => { const d = await p.evaluate((a) => window.__calypso.apply(null, a), args); fs.writeFileSync(path.join(out, name), Buffer.from(d.split(',')[1], 'base64')); };
  const N = 31, A = 0.32;
  for (let k = 0; k < N; k++) { const a = -A + (2 * A * k) / (N - 1); await save('f' + String(k).padStart(2, '0') + '.png', [432, false, a, -0.6 * a, 'dark', 7.6]); }
  await save('mark-1024.png', [1024, false, 0, 0, 'dark', 7.6]);
  await save('app-dark-1024.png', [1024, true, 0, 0, 'dark']);
  await save('app-light-1024.png', [1024, true, 0, 0, 'light']);
  await b.close();
})();
