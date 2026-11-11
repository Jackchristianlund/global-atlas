import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0,200)));
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 120000 });
await sleep(14000);
await page.evaluate(() => [...document.querySelectorAll('.vs-modes button')].find((x) => /Detaljkart/.test(x.textContent ?? ''))?.click());
await sleep(14000);
const r = await page.evaluate(() => {
  const m = window.__map;
  if (!m) return { nomap: true };
  let st = null, styleErr = null;
  try { st = m.getStyle(); } catch (e) { styleErr = String(e).slice(0, 160); }
  if (!st) return { noStyle: true, styleErr, loaded: m.isStyleLoaded?.(), errs: window.__mapErrs ?? null };
  const terr = m.getSource('terr');
  const data = terr && terr._data;
  return {
    center: m.getCenter(), zoom: m.getZoom(), loaded: m.isStyleLoaded(),
    layers: (st.layers || []).map((l) => l.id),
    sources: Object.keys(st.sources || {}),
    terrFeatures: data && data.features ? data.features.length : null,
    firstGeom: data && data.features && data.features[0] ? JSON.stringify(data.features[0].geometry).slice(0, 110) : null,
    rendered: m.queryRenderedFeatures({ layers: ['terr-fill'] }).length,
    srcFeatures: (() => { try { return m.querySourceFeatures('terr').length; } catch (e) { return 'ERR ' + e; } })(),
    serialized: (() => { try { const d = m.getStyle().sources.terr.data; return d && d.features ? d.features.length : typeof d; } catch (e) { return 'ERR ' + e; } })(),
    bounds: (() => { const b = m.getBounds(); return [b.getWest().toFixed(1), b.getSouth().toFixed(1), b.getEast().toFixed(1), b.getNorth().toFixed(1)]; })(),
    canvasPx: [m.getCanvas().width, m.getCanvas().height],
    repaintOk: (() => { try { m.triggerRepaint(); return true; } catch { return false; } })(),
  };
});
console.log(JSON.stringify({ r, errs }, null, 1));
await b.close();
