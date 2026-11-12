/**
 * Visual acceptance for Myanmar.
 *
 * The question this answers is not "does the code run" but "does a reader who
 * opens Myanmar see townships, and can they tell an administration from a
 * decree". So it counts rendered features per layer, opens the popup on a
 * township that carries two layers and on one that carries none, and saves the
 * frames for a human to look at.
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
  set.call(i, 'Myanmar'); i.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(2500);
report.hits = await page.evaluate(() =>
  [...document.querySelectorAll('.search-dd button')].map((b) => (b.textContent ?? '').slice(0, 40)));
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.search-dd button')];
  (btns.find((b) => /Myanmar|Burma/i.test(b.textContent ?? '')) ?? btns[0])
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
});
await sleep(8000);
report.openBtn = await page.evaluate(() => document.querySelector('.opendetail')?.textContent ?? null);
await page.evaluate(() => document.querySelector('.opendetail')?.click());
await sleep(18000);

report.view = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const c = m.getCenter();
  return { lat: +c.lat.toFixed(2), lng: +c.lng.toFixed(2), zoom: +m.getZoom().toFixed(2) };
});
report.layersPresent = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  return ['mmr-mesh-line','mmr-f-aa','mmr-e-aa','mmr-f-wa','mmr-f-wa-unclear','mmr-f-ndaa','mmr-d-martial','mmr-site-pt']
    .map((id) => id + '=' + (m.getLayer(id) ? 'yes' : 'MISSING')).join(' ');
});
report.rendered = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const q = (id) => { try { return m.queryRenderedFeatures({ layers: [id] }).length; } catch (e) { return String(e); } };
  return { mesh: q('mmr-mesh-line'), aa: q('mmr-f-aa'), wa: q('mmr-f-wa'), ndaa: q('mmr-f-ndaa'), martial: q('mmr-d-martial'), sites: q('mmr-site-pt') };
});
report.visible = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  return ['mmr-f-aa','mmr-d-martial','mmr-site-pt'].map((id) => id + '=' + m.getLayoutProperty(id, 'visibility')).join(' ');
});
await page.screenshot({ path: `${out}/M1-myanmar.png` });

// Rakhine, where the AA layer and the martial-law outline sit on the same ground.
await page.evaluate(() => { window.__ga_map?.jumpTo({ center: [93.2, 20.6], zoom: 7.2 }); });
await sleep(9000);
report.rakhine = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const q = (id) => { try { return m.queryRenderedFeatures({ layers: [id] }).length; } catch { return -1; } };
  return { aa: q('mmr-f-aa'), martial: q('mmr-d-martial'), mesh: q('mmr-mesh-line'), towns: q('ne-places-label') };
});
await page.screenshot({ path: `${out}/M2-rakhine.png` });

// A township carrying two layers: administered by the AA, and under martial law.
report.popupTwo = await page.evaluate(() => {
  const m = window.__ga_map; if (!m) return null;
  const f = m.queryRenderedFeatures({ layers: ['mmr-f-aa'] })[0];
  if (!f) return 'no feature';
  const c = m.getCenter();
  m.fire('click', { lngLat: c, point: m.project(c), features: [f], originalEvent: new MouseEvent('click') });
  return f.properties?.n ?? null;
});
await sleep(2500);
report.popupText = await page.evaluate(() => {
  const el = document.querySelector('.mmr-pop');
  return el ? el.textContent.replace(/\s+/g, ' ').slice(0, 220) : null;
});
report.popupStyled = await page.evaluate(() => {
  const el = document.querySelector('.mmr-popup .maplibregl-popup-content');
  return el ? getComputedStyle(el).backgroundColor : null;
});
await page.screenshot({ path: `${out}/M3-popup.png` });

// The layer switch has to reach these too, or they are decoration the reader
// cannot turn off.
report.toggle = await page.evaluate(async () => {
  const m = window.__ga_map;
  const before = m.queryRenderedFeatures({ layers: ['mmr-f-aa'] }).length;
  const label = [...document.querySelectorAll('aside label')]
    .find((l) => /Territoriell kontroll/i.test(l.textContent ?? ''));
  if (!label) return 'control label not found';
  label.querySelector('input')?.click();
  await new Promise((r) => setTimeout(r, 2500));
  const after = m.queryRenderedFeatures({ layers: ['mmr-f-aa'] }).length;
  const vis = m.getLayoutProperty('mmr-f-aa', 'visibility');
  const ml = m.getLayoutProperty('mmr-d-martial', 'visibility');
  label.querySelector('input')?.click();
  await new Promise((r) => setTimeout(r, 6000));
  const back = m.queryRenderedFeatures({ layers: ['mmr-f-aa'] }).length;
  const visBack = m.getLayoutProperty('mmr-f-aa', 'visibility');
  const terrBack = m.getLayoutProperty('terr-fill', 'visibility');
  const styleLoaded = m.isStyleLoaded();
  const checked = label.querySelector('input')?.checked;
  // The group counter is rendered from the store, so it says whether React
  // actually took the second click or only the DOM did.
  const counter = [...document.querySelectorAll('aside *')]
    .map((e) => (e.textContent ?? '').trim())
    .find((t) => /^KONTROLL OG FRONTLINJER\s*\d\/\d$/i.test(t.replace(/\s+/g, ' '))) ?? 'counter not found';
  return { before, afterOff: after, visOff: vis, martialOff: ml, backOn: back, visBack, terrBack, styleLoaded, checked, counter };
});

report.errors = errors.slice(0, 5);
console.log(JSON.stringify(report, null, 1));
await b.close();
