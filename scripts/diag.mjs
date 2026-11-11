import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
const errs = [], logs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
page.on('requestfailed', (r) => logs.push('REQFAIL ' + r.url().slice(-60)));
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 120000 });
await new Promise((r) => setTimeout(r, 12000));
const html = await page.evaluate(() => ({ root: document.getElementById('root')?.innerHTML.length ?? -1, header: !!document.querySelector('header'), inputs: document.querySelectorAll('input').length }));
console.log(JSON.stringify({ html, errs, logs }, null, 1));
await b.close();
