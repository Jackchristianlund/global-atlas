// Globe → detailed map, with overlays drawn on the offline base.
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e).slice(0,200)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);
// Fly to Ukraine on the globe first, so the handover has something to carry.
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Ukraina'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2000);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  (btns.find((x) => /Russlands krig/.test(x.textContent ?? '')) ?? btns[0])
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(10000);
const before = await page.evaluate(() => document.querySelector('.hud')?.textContent ?? '');
// Switch to the detailed map.
await page.evaluate(() => [...document.querySelectorAll('.vs-modes button')].find((x) => /Detaljkart/.test(x.textContent ?? ''))?.click());
await sleep(12000);
await page.screenshot({ path: `${out}/m1-map.png` });
const state = await page.evaluate(() => ({
  canvas: !!document.querySelector('.maproot canvas'),
  notice: document.querySelector('.mapnotice')?.textContent?.replace(/\s+/g,' ').slice(0,140) ?? null,
  styles: [...(document.querySelectorAll('.vs-map select')[0]?.options ?? [])].map((o) => o.textContent),
  density: [...(document.querySelectorAll('.vs-map select')[1]?.options ?? [])].map((o) => o.textContent),
  attr: document.querySelector('.mapattr')?.textContent ?? null,
}));
// Back to the globe; the camera should return to the same ground.
await page.evaluate(() => [...document.querySelectorAll('.vs-modes button')].find((x) => /Klode/.test(x.textContent ?? ''))?.click());
await sleep(6000);
const after = await page.evaluate(() => document.querySelector('.hud')?.textContent ?? '');
await page.screenshot({ path: `${out}/m2-back.png` });
console.log(JSON.stringify({ before, after, state, errors }, null, 1));
await b.close();
