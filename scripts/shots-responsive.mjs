import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const sizes = [['phone', 390, 844], ['tablet', 834, 1112], ['laptop', 1280, 800]];
for (const [name, w, h] of sizes) {
  const page = await b.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500 });
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await sleep(17000);
  const info = await page.evaluate(() => {
    const d = document.documentElement;
    const over = [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 2)
      .slice(0, 6)
      .map((e) => (e.className || e.tagName) + '@' + Math.round(e.getBoundingClientRect().right));
    return {
      scrollW: d.scrollWidth, innerW: window.innerWidth,
      horizontalOverflow: d.scrollWidth > window.innerWidth + 2,
      offscreen: over,
      canvas: !!document.querySelector('canvas'),
    };
  });
  console.log(name, JSON.stringify(info));
  await page.screenshot({ path: `${out}/r-${name}.png` });
  await page.close();
}
await b.close();
