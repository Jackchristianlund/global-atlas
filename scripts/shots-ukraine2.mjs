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
const search = async (q, pick) => {
  await page.click('header input');
  await page.evaluate((text) => {
    const i = document.querySelector('header input');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(i, text); i.dispatchEvent(new Event('input', { bubbles: true }));
  }, q);
  await sleep(2000);
  return page.evaluate((re) => {
    const btns = [...document.querySelectorAll('.search-dd button')];
    const x = btns.find((b) => new RegExp(re).test(b.textContent ?? '')) ?? btns[0];
    const t = x?.textContent ?? null;
    x?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    return t;
  }, pick);
};
// 1. A city panel.
const city = await search('Mariupol', 'Mariupol');
await sleep(9000);
await page.screenshot({ path: `${out}/u3-city.png` });
const cityBody = await page.evaluate(() => document.querySelector('.panel.right .panel-scroll')?.textContent?.replace(/\s+/g,' ').slice(0,300) ?? '');
// 2. The comparison, from the Ukraine conflict panel.
const confl = await search('Ukraina', 'Russlands krig');
await sleep(9000);
const cmp = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('.sec')].find((s) => /Sammenlikn to vurderinger/.test(s.textContent ?? ''));
  sec?.scrollIntoView({ block: 'center' });
  const sel = sec?.querySelector('select');
  if (!sel) return null;
  const opts = [...sel.options].map((o) => o.textContent);
  const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  set.call(sel, '2014'); sel.dispatchEvent(new Event('change', { bubbles: true }));
  return opts;
});
await sleep(4000);
await page.evaluate(() => [...document.querySelectorAll('.sec')].find((s) => /Sammenlikn/.test(s.textContent ?? ''))?.scrollIntoView({ block: 'center' }));
await sleep(1200);
await page.screenshot({ path: `${out}/u4-compare.png` });
const changes = await page.evaluate(() => [...document.querySelectorAll('.cmplist li')].map((li) => li.textContent?.replace(/\s+/g,' ').slice(0,70)));
console.log(JSON.stringify({ city, cityBody, confl, cmp, changes, errors }, null, 1));
await b.close();
