import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
// the landing animation settles after ~2.4s; give the globe time to draw
await sleep(20000);
await page.screenshot({ path: `${out}/L1-landing.png` });
// crop around Ukraine as it sits in the default view
await page.screenshot({ path: `${out}/L2-ukraine-crop.png`, clip: { x: 625, y: 285, width: 170, height: 125 } });
console.log(JSON.stringify({ errs: errs.slice(0,3) }));
await b.close();
