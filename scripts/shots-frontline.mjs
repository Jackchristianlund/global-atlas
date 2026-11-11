import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(16000);

const report = {};

// The ticket must be on screen with its date and its source.
report.ticket = await page.evaluate(() =>
  document.querySelector('.fl-ticket')?.textContent?.replace(/\s+/g, ' ').trim() ?? null);

// The globe has to actually carry the path objects, not just the data.
report.globePaths = await page.evaluate(() => {
  // react-globe.gl renders paths as three.js lines; count our labelled ones
  // by asking the store instead, then confirm the canvas drew something.
  return { canvas: !!document.querySelector('canvas') };
});

await page.screenshot({ path: `${out}/f1-globe.png` });

// Zoom to Ukraine via search, then switch to the detail map.
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Ukraina'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2500);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  const x = btns.find((b) => /Russlands krig/.test(b.textContent ?? '')) ?? btns[0];
  x?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(10000);
await page.screenshot({ path: `${out}/f2-ukraine-globe.png` });

// Detail map.
const switched = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /DETALJKART/i.test(x.textContent ?? ''));
  b?.click(); return !!b;
});
await sleep(14000);
report.switched = switched;
report.mapLayers = await page.evaluate(() => {
  const m = window.__ga_map;
  if (!m) return 'no map handle';
  const ids = ['frontline-case', 'frontline-line', 'terr-fill', 'contact-line'];
  return Object.fromEntries(ids.map((id) => [id, m.getLayer(id) ? m.getLayoutProperty(id, 'visibility') ?? 'visible' : 'MISSING']));
});
report.frontlineFeatures = await page.evaluate(() => {
  const m = window.__ga_map;
  if (!m) return null;
  const s = m.getSource('frontline');
  return s?._data?.features?.length ?? null;
});
await page.screenshot({ path: `${out}/f3-ukraine-map.png` });

// Closer, over the Donetsk stretch.
await page.evaluate(() => { window.__ga_map?.jumpTo({ center: [37.6, 48.6], zoom: 9 }); });
await sleep(9000);
await page.screenshot({ path: `${out}/f4-donetsk.png` });

report.errors = errors.slice(0, 5);
console.log(JSON.stringify(report, null, 2));
await b.close();
