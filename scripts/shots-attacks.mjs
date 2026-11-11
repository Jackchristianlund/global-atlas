// Visual check: Recent Developments, an incident panel, and the zoom thresholds.
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);
await page.screenshot({ path: `${out}/a1-recent.png` });
const n = await page.evaluate(() => document.querySelectorAll('.atlist li').length);
const periods = await page.evaluate(() => [...document.querySelectorAll('.periods .chip')].map((x) => x.textContent));
// Narrow to the last 30 days, then open the first incident.
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.periods .chip')].find((x) => /30/.test(x.textContent ?? ''));
  b?.click();
});
await sleep(2000);
const n30 = await page.evaluate(() => document.querySelectorAll('.atlist li').length);
await page.evaluate(() => document.querySelector('.atlist button')?.click());
await sleep(9000);
await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.scrollTo(0, 0));
await page.screenshot({ path: `${out}/a2-incident.png` });
const body = await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.textContent?.replace(/\s+/g,' ').slice(0,420) ?? '');
console.log(JSON.stringify({ n, periods, n30, body, errors }, null, 1));
await b.close();
