// Visual check: Ukraine control, derived line of contact, and the panel.
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Ukraina'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2200);
const picked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  const x = btns.find((b) => /Krigen i Ukraina|Russlands/.test(b.textContent ?? '')) ?? btns[0];
  const t = x?.textContent ?? null;
  x?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  return t;
});
await sleep(10000);
await page.screenshot({ path: `${out}/u1-ukraine.png` });
const ct = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.sec')].find((s) => /Kontaktlinjer/.test(s.textContent ?? ''));
  el?.scrollIntoView({ block: 'center' });
  return el?.textContent?.replace(/\s+/g, ' ').slice(0, 320) ?? null;
});
await sleep(1500);
await page.screenshot({ path: `${out}/u2-contact.png` });
console.log(JSON.stringify({ picked, ct, errors }, null, 1));
await b.close();
