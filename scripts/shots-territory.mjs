// Visual check for territorial control: global view, Yemen, and an actor panel.
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
await page.screenshot({ path: `${out}/t1-global.png` });

// Search for Yemen's conflict and open it.
await page.evaluate(() => { const b = document.querySelector('button.mk[data-key="conflict:yem"]'); b?.click(); });
await sleep(9000);
await page.screenshot({ path: `${out}/t2-yemen.png` });

// Open the first territorial actor from the conflict panel.
const openedActor = await page.evaluate(() => {
  const b = document.querySelector('.chip.actor');
  b?.scrollIntoView({ block: 'center' }); b?.click(); return !!b;
});
await sleep(8000);
await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.scrollTo(0, 0));
await page.screenshot({ path: `${out}/t3-actor.png` });

// Click a territory polygon on the globe near Sanaa.
const box = await (await page.$('.globe canvas'))?.boundingBox();
if (box) { await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.45); }
await sleep(7000);
await page.screenshot({ path: `${out}/t4-territory.png` });
const sel = await page.evaluate(() => document.querySelector('.p-kicker')?.textContent ?? '');
console.log(JSON.stringify({ openedActor, sel, errors }));
await browser.close();
