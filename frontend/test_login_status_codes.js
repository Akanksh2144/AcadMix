const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('requestfinished', r => { 
    if(r.url().includes('api')) {
      console.log('REQ FINISH:', r.url(), r.response()?.status()); 
    }
  }); 
  await page.goto('https://www.acadmix.org'); 
  const quickLogin = await page.$('[data-testid="quick-login-student"]'); 
  if(quickLogin) { 
    await page.click('[data-testid="quick-login-student"]'); 
    await new Promise(r => setTimeout(r, 6000)); 
  } 
  await browser.close(); 
})();
