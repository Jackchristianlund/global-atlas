/**
 * Visual acceptance for Sudan.
 *
 * The thing to prove here is that West Kordofan exists on the map at all, that
 * it is painted as contested rather than swallowed by South Kordofan, and that
 * Babanusa, Heglig and Al-Khuwei sit inside it.
 */
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(16000);
const report = {};

await page.click('header input');
await page.evaluate(() => {
  const i = document.querySelector('header input');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, 'Sudan'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2500);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  (btns.find((b) => /Borgerkrigen i Sudan/.test(b.textContent ?? '')) ?? btns[0])
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(8000);
await page.evaluate(() => document.querySelector('.opendetail')?.click());
await sleep(18000);

report.view = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const c = m.getCenter();
  return { lat: +c.lat.toFixed(2), lng: +c.lng.toFixed(2), zoom: +m.getZoom().toFixed(2) };
});
// Which unit is painted where: the whole point of the rebuild.
report.atPoint = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const probe = (lng, lat, label) => {
    const p = m.project([lng, lat]);
    const f = m.queryRenderedFeatures(p, { layers: ['terr-fill'] })[0];
    return `${label}=${f ? (f.properties.code ?? f.properties.id ?? '?') + ':' + (f.properties.actor ?? '?') : 'none'}`;
  };
  return [probe(27.80, 11.32, 'Babanusa'), probe(29.40, 9.93, 'Heglig'),
          probe(29.72, 11.01, 'Kadugli'), probe(30.22, 13.18, 'ElObeid'),
          probe(25.35, 13.63, 'ElFasher')].join('  ');
});
report.renderedUnits = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const fs = m.queryRenderedFeatures({ layers: ['terr-fill'] });
  return [...new Set(fs.map((f) => f.properties.code ?? f.properties.id))].sort().join(',');
});
report.places = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  return m.queryRenderedFeatures({ layers: ['place-pt'] }).map((f) => f.properties.name ?? f.properties.id).sort();
});
await page.screenshot({ path: `${out}/S1-sudan.png` });

// Kordofan close up, where the new state is.
await page.evaluate(() => { window.__ga_map?.jumpTo({ center: [29.0, 12.0], zoom: 6.4 }); });
await sleep(9000);
await page.screenshot({ path: `${out}/S2-kordofan.png` });
report.errors = errors.slice(0, 5);
console.log(JSON.stringify(report, null, 1));
await b.close();
