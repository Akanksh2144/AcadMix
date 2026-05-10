const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://aits.localhost:3000/login', { waitUntil: 'networkidle0' });
  
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log('LOGIN BODY LENGTH:', body.length);
  
  await browser.close();
})();
