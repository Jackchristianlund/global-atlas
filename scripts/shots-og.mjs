import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
// 1200x630 is the aspect every link preview crops to.
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(18000);
// Strip the chrome: a preview wants the map, not the controls.
await page.evaluate(() => {
  // Keep the app recognisable: the panels are what it looks like in use.
  // Only the timeline and the small overlays go, and the globe is re-centred
  // in what is left.
  for (const sel of ['.tl', '.timeline', '.hud', '.mapattr', '.viewswitch', '.fl-ticket']) {
    document.querySelectorAll(sel).forEach((e) => { e.style.display = 'none'; });
  }
  window.dispatchEvent(new Event('resize'));
});
await sleep(6000);
await page.screenshot({ path: `${out}/og.png` });
console.log('ok');
await b.close();
