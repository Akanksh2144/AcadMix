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
  });
  
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
  
  // Dump all inputs to see what we have
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name }));
  });
  console.log('INPUTS:', inputs);
  
  // Try to login if we can find inputs
  if (inputs.length >= 2) {
    const emailInput = await page.$('input[type="email"]') || await page.$('input[name="email"]') || await page.$('input[placeholder*="email" i]');
    if (emailInput) await emailInput.type('phani@vjti.ac.in');
    
    const passInput = await page.$('input[type="password"]') || await page.$('input[name="password"]');
    if (passInput) await passInput.type('admin123');
    
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });
    
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Nav timeout:', e.message));
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('URL AFTER LOGIN:', page.url());
    const body = await page.evaluate(() => document.body.innerHTML);
    console.log('BODY LENGTH AFTER LOGIN:', body.length);
  }
  
  await browser.close();
})();
