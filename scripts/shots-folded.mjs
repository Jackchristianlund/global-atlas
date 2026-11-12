import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0,160)));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(16000);
const r = {};
r.foldButtons = await page.evaluate(() => document.querySelectorAll('.mini.fold').length);
await page.evaluate(() => document.querySelectorAll('.mini.fold').forEach((b) => b.click()));
await sleep(5000);
r.afterFold = await page.evaluate(() => ({
  left: getComputedStyle(document.querySelector('.panel.left')).display,
  right: getComputedStyle(document.querySelector('.panel.right')).display,
  events: !!document.querySelector('.tl-events'),
  tabs: document.querySelectorAll('.edge-tab').length,
  tl: Math.round(document.querySelector('.tl').getBoundingClientRect().height),
  legendLeft: Math.round(document.querySelector('.legend-mini, .legendbox')?.getBoundingClientRect().left ?? -1),
}));
await page.screenshot({ path: `${out}/F1-folded.png` });
// A click on a conflict marker must bring the panel back.
await page.evaluate(() => document.querySelector('.mk')?.click());
await sleep(3500);
r.afterSelect = await page.evaluate(() => getComputedStyle(document.querySelector('.panel.right')).display);
// And the preference must survive a reload.
await page.evaluateOnNewDocument(() => {});
r.stored = await page.evaluate(() => ['ga.c.left','ga.c.right','ga.c.events'].map((k) => localStorage.getItem(k)).join(','));
r.errs = errs.slice(0, 3);
console.log(JSON.stringify(r));
await b.close();
