const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message)); 
  page.on('request', request => { if(request.url().includes('api')) console.log('API REQ:', request.url()); }); 
  await page.goto('https://www.acadmix.org', { waitUntil: 'networkidle0' }); 
  console.log('Checking for quick login button...'); 
  const quickLogin = await page.$('[data-testid="quick-login-student"]'); 
  console.log('Quick login button present:', !!quickLogin); 
  if(quickLogin) { 
    console.log('Clicking quick login...'); 
    await page.click('[data-testid="quick-login-student"]'); 
    await new Promise(r => setTimeout(r, 6000)); 
    console.log('Current URL:', page.url()); 
  } else {
    // try normal login
    console.log('Clicking normal login fallback...');
    await page.type('[data-testid="college-id-input"]', '22WJ8A6745');
    await page.type('[data-testid="password-input"]', '22WJ8A6745');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
      page.click('[data-testid="login-submit-button"]')
    ]);
  }
  await browser.close(); 
})();
