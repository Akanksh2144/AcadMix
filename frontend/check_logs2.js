const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  
  try {
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'phani@vjti.ac.in');
    await page.type('input[type="password"]', 'admin123');
    
    // The button might not have type=submit, find it by text or just click the first button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.textContent.includes('Sign in') || b.textContent.includes('Login'));
      if (loginBtn) loginBtn.click();
      else document.querySelector('button[type="submit"]').click();
    });
    
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
    
    // Wait a bit for React to render dashboard
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('FINAL URL:', page.url());
  } catch (e) {
    console.log('SCRIPT ERR:', e.message);
  }
  
  await browser.close();
})();
