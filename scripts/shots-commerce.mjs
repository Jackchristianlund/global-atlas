import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(14000);
const adsFree = await page.evaluate(() => document.querySelectorAll('.adslot').length);
await page.evaluate(() => [...document.querySelectorAll('header button')].find((x) => /Free og Pro|Free and Pro/.test(x.textContent ?? ''))?.click());
await sleep(2500);
await page.screenshot({ path: `${out}/p1-pricing.png` });
const pricing = await page.evaluate(() => document.querySelector('.modal-scroll')?.textContent?.replace(/\s+/g,' ').slice(0,300) ?? '');
// Switch the preview to Pro and confirm the ad slots disappear.
await page.evaluate(() => [...document.querySelectorAll('.modal-scroll .chip')].find((x) => x.textContent?.trim() === 'Pro')?.click());
await sleep(1200);
await page.evaluate(() => document.querySelector('.modal .mini, .modal button[aria-label]')?.click());
await sleep(1500);
const adsPro = await page.evaluate(() => document.querySelectorAll('.adslot').length);
console.log(JSON.stringify({ adsFree, adsPro, pricing, errors }, null, 1));
await b.close();
