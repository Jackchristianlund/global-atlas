// Visual check: drives the built app in headless Chrome in real time and saves screenshots.
// Usage: node scripts/shots.mjs <url> <outDir>
import puppeteer from 'puppeteer-core';
const [url, out = '.'] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1500,900'],
  protocolTimeout: 240000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(14000);
await page.screenshot({ path: `${out}/v1-start.png` });

// Select the Iran war via its marker, then follow the first connection.
await page.evaluate(() => document.querySelector('button.mk[data-key="conflict:iran"]')?.click());
await sleep(9000);
await page.screenshot({ path: `${out}/v2-conflict.png` });
const followed = await page.evaluate(() => { const b = document.querySelector('.link .follow'); b?.scrollIntoView({ block: 'center' }); b?.click(); return !!b; });
await sleep(7000);
await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.scrollTo(0, 0));
await page.screenshot({ path: `${out}/v3-trace.png` });

// History view (overview panel) with the legend open.
await page.evaluate(() => { [...document.querySelectorAll('.views button')][5]?.click(); });
await sleep(500);
await page.evaluate(() => { document.querySelector('.panel.right .panel-bar .mini')?.click(); document.querySelector('.legend-toggle')?.click(); });
await sleep(7000);
await page.screenshot({ path: `${out}/v4-history.png` });
// Hover the first chart to show the readout, legend closed.
await page.evaluate(() => document.querySelector('.legendbox .mini')?.click());
const box = await (await page.$('.hchart'))?.boundingBox();
if (box) await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5);
await sleep(2500);
await page.screenshot({ path: `${out}/v5-charts.png` });
console.log(JSON.stringify({ followed, errors }));
await browser.close();
