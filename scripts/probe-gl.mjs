import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
await page.goto(process.argv[2], { waitUntil: 'load', timeout: 120000 });
await sleep(13000);
await page.evaluate(() => [...document.querySelectorAll('.vs-modes button')].find((x) => /Detaljkart/.test(x.textContent ?? ''))?.click());
await sleep(12000);
const r = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const m = window.__map;
  const root = document.querySelector('.maproot');
  const cv = root?.querySelector('canvas');
  return {
    webgl: !!c.getContext('webgl'),
    webgl2: !!c.getContext('webgl2'),
    mapExists: !!m,
    mapKeys: m ? Object.keys(m).filter((k) => /style|loaded|painter/i.test(k)).slice(0, 10) : null,
    styleRaw: m ? typeof m.style : null,
    styleLoadedFn: m && m.style ? !!m.style.loaded : null,
    styleStylesheet: m && m.style ? !!m.style.stylesheet : null,
    canvasSize: cv ? [cv.width, cv.height] : null,
    rootSize: root ? [root.clientWidth, root.clientHeight] : null,
    chain: (() => {
      const out = [];
      let el = root;
      while (el && el !== document.body) {
        const cs = getComputedStyle(el);
        out.push(`${el.className || el.tagName}: ${el.clientWidth}x${el.clientHeight} pos=${cs.position} disp=${cs.display}`);
        el = el.parentElement;
      }
      return out;
    })(),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
