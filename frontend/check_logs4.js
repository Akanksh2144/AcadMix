const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  
  await page.evaluateOnNewDocument(() => {
    window.onerror = (msg, url, lineNo, columnNo, error) => {
      console.log('WINDOW ERROR:', msg, error ? error.stack : '');
      return false;
    };
    window.addEventListener('unhandledrejection', event => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
  });
  
  await page.goto('http://aits.localhost:3000/principal', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('FINAL URL:', page.url());
  
  await browser.close();
})();
