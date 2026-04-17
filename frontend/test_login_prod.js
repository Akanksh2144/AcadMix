const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message)); 
  await page.goto('https://www.acadmix.org', { waitUntil: 'networkidle0' }); 
  console.log('Logging in...'); 
  await page.type('[data-testid="college-id-input"]', '22WJ8A6745');
  await page.type('[data-testid="password-input"]', '22WJ8A6745');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('[data-testid="login-submit-button"]')
  ]);
  console.log('Current URL:', page.url()); 
  await new Promise(r => setTimeout(r, 2000));
  await browser.close(); 
})();
