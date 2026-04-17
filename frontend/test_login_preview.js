const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message)); 
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' }); 
  console.log('Clicking student quick login...'); 
  await page.click('[data-testid="quick-login-student"]'); 
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>console.log('nav timeout or done')); 
  console.log('Current URL:', page.url()); 
  await browser.close(); 
})();
