// Captures the share-preview image for each conflict that has a share page.
//
//   npm run build && npx vite preview --port 4173 &
//   npx tsx scripts/build-og.mjs http://localhost:4173/
//
// Each image is the atlas itself, 1200×630, with the conflict selected on the
// globe: what the reader will actually see when they open the link. The
// images are committed under public/og/; scripts/build-share-pages.ts makes a
// page for each one at build time.
import puppeteer from 'puppeteer-core';
import { SHARE_CONFLICTS } from '../src/lib/shareConflicts';

const [base = 'http://localhost:4173/'] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
for (const id of SHARE_CONFLICTS) {
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630 });
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); localStorage.setItem('ga.c.left', '1'); } catch { /* none */ } });
  await p.goto(`${base}#m=globe&s=conflict%3A${id}`, { waitUntil: 'load' });
  await sleep(12000);
  await p.screenshot({ path: `public/og/${id}.jpg`, type: 'jpeg', quality: 82 });
  await p.close();
  console.log('ok', id);
}
await b.close();
