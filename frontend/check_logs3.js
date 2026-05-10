const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  
  try {
    await page.goto('http://aits.localhost:3000', { waitUntil: 'networkidle0' });
    console.log('FINAL URL:', page.url());
  } catch (e) {
    console.log('SCRIPT ERR:', e.message);
  }
  
  await browser.close();
})();
