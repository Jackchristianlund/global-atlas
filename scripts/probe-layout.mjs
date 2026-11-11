import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 120000 });
await sleep(14000);
const r = await page.evaluate(() => {
  const h = document.querySelector('header');
  const leg = document.querySelector('.legend-mini');
  const sb = document.querySelector('.panel.left, aside');
  return { headerH: Math.round(h.getBoundingClientRect().height),
    legendLeft: leg ? Math.round(leg.getBoundingClientRect().left) : null,
    sidebarRight: sb ? Math.round(sb.getBoundingClientRect().right) : null };
});
await page.screenshot({ path: '/tmp/shots/pl3-final.png' });
console.log(JSON.stringify(r));
await b.close();
