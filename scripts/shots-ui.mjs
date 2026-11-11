import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e).slice(0,160)));
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await sleep(15000);
await page.screenshot({ path: `${out}/ui1-full.png` });
const m = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.layerrow')].map((r) => {
    const lab = r.querySelector('label > span');
    const sl = r.querySelector('.op-slider');
    return { text: lab?.textContent ?? '', w: Math.round(lab?.getBoundingClientRect().width ?? 0),
      h: Math.round(lab?.getBoundingClientRect().height ?? 0),
      clipped: lab ? lab.scrollWidth > lab.clientWidth + 1 : null,
      sliderX: sl ? Math.round(sl.getBoundingClientRect().right) : null };
  });
  const evs = [...document.querySelectorAll('.ev')].map((e) => {
    const sp = e.querySelector('span');
    return { w: Math.round(e.getBoundingClientRect().width), lines: sp ? Math.round(sp.getBoundingClientRect().height / 16) : 0,
      clipped: sp ? sp.scrollHeight > sp.clientHeight + 1 : null, text: sp?.textContent?.slice(0, 40) ?? '' };
  });
  const opts = [...document.querySelectorAll('.opts label')].map((l) => Math.round(l.getBoundingClientRect().height));
  return { rows, evs: evs.slice(0, 5), evWidths: [...new Set(evs.map((e) => e.w))], optHeights: [...new Set(opts)] };
});
console.log(JSON.stringify(m, null, 1).slice(0, 2600));
console.log('errors', errors.length);
await b.close();
