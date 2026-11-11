import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(16000);
await page.screenshot({ path: `${out}/h1-globe.png` });
// Fly to a region where hydrography is the point: the Nile and the Black Sea.
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Ukraina'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2000);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  (btns.find((b) => /Russlands krig/.test(b.textContent ?? '')) ?? btns[0])
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(10000);
await page.screenshot({ path: `${out}/h3-regional.png` });
// Turn rivers off for an A/B at the identical camera position.
const off = await page.evaluate(() => {
  const l = [...document.querySelectorAll('.layerrow label')].find((x) => /Elver og innsj/.test(x.textContent ?? ''));
  l?.querySelector('input')?.click();
  return !!l;
});
await sleep(3500);
await page.screenshot({ path: `${out}/h2-globe-nohydro.png` });
console.log(JSON.stringify({ off, errors }, null, 1));
await b.close();
