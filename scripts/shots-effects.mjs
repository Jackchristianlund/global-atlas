import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0,160)));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(17000);
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Iran'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2500);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  (btns.find((b) => /Iran/.test(b.textContent ?? '')) ?? btns[0])?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(9000);
// scroll the right panel to the effects section
const found = await page.evaluate(() => {
  const h = [...document.querySelectorAll('.panel.right h4, .panel.right h3, .panel.right .sec > h3')]
    .find((x) => /påvirker|affects/i.test(x.textContent || ''));
  if (h) h.scrollIntoView({ block: 'start' });
  return !!h;
});
await sleep(2500);
console.log(JSON.stringify({ found, errs: errs.slice(0,3) }));
await page.screenshot({ path: `${out}/e1-effects.png`, clip: { x: 1090, y: 90, width: 410, height: 880 } });
await b.close();
