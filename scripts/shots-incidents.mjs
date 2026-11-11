// Visual check for the UCDP incident layer.
import puppeteer from 'puppeteer-core';
const [url, out = '.'] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  protocolTimeout: 240000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);

// Turn the incident layer on.
const toggled = await page.evaluate(() => {
  const l = [...document.querySelectorAll('.layerrow label')].find((x) => /Hendelser \(UCDP/.test(x.textContent ?? ''));
  l?.querySelector('input')?.click();
  return l?.textContent?.trim() ?? null;
});
await sleep(11000);
await page.screenshot({ path: `${out}/i1-global.png` });
const note = await page.evaluate(() => document.querySelector('.layernote')?.textContent ?? '');

// Turn the conflict markers off: they are DOM buttons over the canvas and
// would take a click meant for a bin.
await page.evaluate(() => {
  const l = [...document.querySelectorAll('.layerrow label')].find((x) => /^\s*Konflikter/.test(x.textContent ?? ''));
  l?.querySelector('input')?.click();
});
await sleep(4000);

// Click across the globe until a bin opens: the bins are drawn just above the
// surface, so the click's own coordinates are what must resolve to one.
const box = await (await page.$('.globe canvas'))?.boundingBox();
const hit = [];
if (box) {
  outer:
  for (let gy = 0.28; gy <= 0.76; gy += 0.04) {
    for (let gx = 0.3; gx <= 0.74; gx += 0.04) {
      await page.mouse.click(box.x + box.width * gx, box.y + box.height * gy);
      await sleep(700);
      const k = await page.evaluate(() => document.querySelector('.p-kicker')?.textContent ?? '');
      if (!/Hendelsesrute|Incident bin/.test(k)) continue;
      const body = await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.textContent?.replace(/\s+/g, ' ').slice(0, 300) ?? '');
      hit.push(`click ${gx.toFixed(2)},${gy.toFixed(2)} -> ${body}`);
      break outer;
    }
  }
}
await sleep(2500);
await page.screenshot({ path: `${out}/i2-bin.png` });
const kicker = await page.evaluate(() => document.querySelector('.p-kicker')?.textContent ?? '');
console.log(JSON.stringify({ toggled, note, kicker, hit, errors }, null, 1));
await browser.close();
