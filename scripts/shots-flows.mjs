// Visual check for displacement corridors and the territorial time series.
import puppeteer from 'puppeteer-core';
const [url, out = '.'] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  protocolTimeout: 240000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);

// 1. Humanitarian view: corridors on the globe plus the overview panel.
const toHuman = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Humanit|Menneske/i.test(x.textContent ?? ''));
  b?.click(); return b?.textContent?.trim() ?? null;
});
await sleep(9000);
await page.screenshot({ path: `${out}/f1-human.png` });

// 2. The corridor list, scrolled into view.
const corridors = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.flowrow')];
  rows[0]?.scrollIntoView({ block: 'center' });
  return rows.length;
});
await sleep(2500);
await page.screenshot({ path: `${out}/f2-list.png` });

// 3. One corridor opened.
const opened = await page.evaluate(() => {
  const b = document.querySelector('.flowrow-btn');
  b?.click(); return b?.textContent?.trim() ?? null;
});
await sleep(7000);
await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.scrollTo(0, 0));
await page.screenshot({ path: `${out}/f3-corridor.png` });

// 4. Scrub the timeline back and read the territorial counter.
const scrubbed = await page.evaluate(() => {
  const r = document.querySelector('.tl input[type="range"]');
  if (!r) return null;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(r, '2022');
  r.dispatchEvent(new Event('input', { bubbles: true }));
  r.dispatchEvent(new Event('change', { bubbles: true }));
  return r.value;
});
await sleep(9000);
await page.screenshot({ path: `${out}/f4-year2022.png` });
const readout = await page.evaluate(() => document.querySelector('.tl-count')?.textContent?.replace(/\s+/g, ' ').slice(0, 220) ?? '');

// 5. Back to the overview, still in 2022, framed on Ukraine: historical control.
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /Oversikt|Overview/.test(b.textContent ?? ''))?.click();
});
await sleep(3000);
await page.evaluate(() => { document.querySelector('button.mk[data-key="conflict:ukr"]')?.click(); });
await sleep(9000);
await page.screenshot({ path: `${out}/f5-ukraine2022.png` });
console.log(JSON.stringify({ toHuman, corridors, opened, scrubbed, readout, errors }, null, 1));
await browser.close();
