import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const bad = [], workers = [];
page.on('requestfailed', (r) => bad.push(`FAIL ${r.failure()?.errorText} ${r.url().slice(-70)}`));
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(-70)}`); });
page.on('workercreated', (w) => workers.push(w.url().slice(-70)));
page.on('pageerror', (e) => bad.push('PAGEERR ' + String(e).slice(0, 160)));
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 120000 });
await sleep(13000);
await page.evaluate(() => [...document.querySelectorAll('.vs-modes button')].find((x) => /Detaljkart/.test(x.textContent ?? ''))?.click());
await sleep(14000);
console.log(JSON.stringify({ bad, workers }, null, 1));
await b.close();
