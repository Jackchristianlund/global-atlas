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
// Search for Georgia's conflict and open it.
await page.click('header input');
const typed = await page.evaluate(() => {
  const i = document.querySelector('header input[type="text"], header input');
  if (!i) return null;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Abkhas'); i.dispatchEvent(new Event('input', { bubbles: true }));
  return i.placeholder ?? 'ok';
});
await sleep(2500);
const picked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  const b = btns.find((x) => /Abkhas|Abkhaz/.test(x.textContent ?? '')) ?? btns[0];
  const t = b?.textContent ?? null;
  // The list closes on mousedown, which is what the component listens for.
  b?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  return t;
});
await sleep(9000);
await page.screenshot({ path: `${out}/c1-georgia.png` });
await page.click('header input');
const chech = await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Tsjetsj'); i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
});
await sleep(2200);
const picked2 = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.search-dd button')][0];
  const t = b?.textContent ?? null;
  b?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  return t;
});
await sleep(9000);
await page.screenshot({ path: `${out}/c2-chechnya.png` });
const body2 = await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.textContent?.replace(/\s+/g,' ').slice(0,330) ?? '');
const body = await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.textContent?.replace(/\s+/g,' ').slice(0,400) ?? '');
console.log(JSON.stringify({ picked, body, chech, picked2, body2, errors }, null, 1));
await b.close();
