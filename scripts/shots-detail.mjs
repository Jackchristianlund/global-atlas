import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
const failed = []; page.on('requestfailed', (r) => failed.push(r.url().slice(0, 90)));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(16000);
const report = {};

// Pick the Ukraine conflict, then use the new button.
await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Ukraina'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2500);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  (btns.find((b) => /Russlands krig/.test(b.textContent ?? '')) ?? btns[0])
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(8000);
report.buttonText = await page.evaluate(() => document.querySelector('.opendetail')?.textContent ?? null);
await page.evaluate(() => document.querySelector('.opendetail')?.click());
await sleep(16000);
report.view = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const c = m.getCenter();
  return { lat: +c.lat.toFixed(2), lng: +c.lng.toFixed(2), zoom: +m.getZoom().toFixed(2) };
});
report.baseLayers = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  return ['ne-urban-fill','ne-roads-line','ne-rail-line','ne-places-dot','ne-places-label','frontline-line']
    .map((id) => id + '=' + (m.getLayer(id) ? 'yes' : 'MISSING')).join(' ');
});
report.renderedPlaces = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  try { return m.queryRenderedFeatures({ layers: ['ne-places-label'] }).length; } catch (e) { return String(e); }
});
await page.screenshot({ path: `${out}/d1-ukraine.png` });
await page.evaluate(() => { window.__ga_map?.jumpTo({ center: [37.55, 48.45], zoom: 8.6 }); });
await page.evaluate(() => new Promise((res) => {
  const m = window.__ga_map; if (!m) return res();
  const t = setTimeout(res, 60000);
  const done = () => { if (m.loaded()) { clearTimeout(t); res(); } };
  m.on('idle', done); done();
}));
await sleep(3000);
await page.screenshot({ path: `${out}/d2-donbas.png` });
report.errors = errors.slice(0, 4);
report.failedReq = [...new Set(failed)].slice(0, 6);
console.log(JSON.stringify(report, null, 2));
await b.close();
