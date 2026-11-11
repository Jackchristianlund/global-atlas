import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader'], protocolTimeout: 240000 });
const page = await b.newPage();
await page.goto('about:blank');
const r = await page.evaluate(() => {
  const a = document.createElement('canvas');
  const gl2 = a.getContext('webgl2');
  const b2 = document.createElement('canvas');
  const gl1 = b2.getContext('webgl');
  return {
    webgl2: !!gl2,
    webgl2Version: gl2 ? gl2.getParameter(gl2.VERSION) : null,
    webgl1: !!gl1,
    workers: typeof Worker !== 'undefined',
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
