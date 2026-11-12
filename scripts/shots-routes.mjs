import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0,160)));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(17000);
// Turn on trade routes and chokepoints, turn conflict clutter down.
const toggled = await page.evaluate(() => {
  const want = { 'Handelsruter': true, 'Knutepunkter til sjøs': true, 'Hendelser og angrep': false, 'Spenningspunkter': false, 'Territoriell kontroll': false };
  const done = [];
  for (const l of document.querySelectorAll('label')) {
    const cb = l.querySelector('input[type=checkbox]'); if (!cb) continue;
    const t = (l.textContent || '').trim();
    for (const [k, v] of Object.entries(want)) if (t.startsWith(k) && cb.checked !== v) { cb.click(); done.push(k + '=' + v); }
  }
  return done;
});
await sleep(9000);
console.log(JSON.stringify({ toggled, errs: errs.slice(0,3) }));
await page.screenshot({ path: `${out}/t1-routes.png` });
await page.screenshot({ path: `${out}/t2-crop.png`, clip: { x: 560, y: 180, width: 420, height: 330 } });
await b.close();
