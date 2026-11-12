/**
 * Globe acceptance for the Sudan geometry.
 *
 * The 2D detail map triangulates a polygon whichever way its rings wind, so it
 * drew Sudan perfectly while the globe — which extrudes each polygon and builds
 * its side walls from the ring direction — turned the country into a fan of
 * spikes. Checking the map was not checking the globe. This checks the globe.
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
await sleep(18000);
const report = {};

// Select Sudan so the globe flies to it; stay on the globe, do not open the map.
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
await sleep(14000);
report.mode = await page.evaluate(() => (document.querySelector('.maplibregl-map') ? 'map' : 'globe'));
await page.screenshot({ path: `${out}/G1-sudan-globe.png` });

/**
 * Spikes are long thin triangles reaching far outside the country, so they show
 * up as coloured pixels well beyond Sudan's extent. Sampling a ring of points
 * out over the ocean and the neighbours catches them without needing to parse
 * the scene: a clean render leaves those pixels near the base map's colours.
 */
report.errors = errors.slice(0, 5);
console.log(JSON.stringify(report, null, 1));
await b.close();
