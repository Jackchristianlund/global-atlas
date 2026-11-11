import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e).slice(0,160)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);
await page.screenshot({ path: `${out}/pl1-base.png` });
const legend = await page.evaluate(() => document.querySelector('.legend-mini')?.textContent?.replace(/\s+/g,' ').slice(0,140) ?? null);
// Type a search and measure how many markers dim.
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Sudan'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(3000);
const dim = await page.evaluate(() => ({
  total: document.querySelectorAll('.mk').length,
  off: document.querySelectorAll('.mk.off').length,
  lit: [...document.querySelectorAll('.mk:not(.off)')].map((m) => m.dataset.key).slice(0, 8),
}));
await page.screenshot({ path: `${out}/pl2-search.png` });
const count = await page.evaluate(() => document.querySelector('.tl-count')?.textContent ?? '');
console.log(JSON.stringify({ legend, dim, count, errors }, null, 1));
await b.close();
