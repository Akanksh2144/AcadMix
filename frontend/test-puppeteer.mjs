import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.setContent(`
    <html>
      <head>
        <script type="module">
          import { Simulation } from './node_modules/eecircuit-engine/dist/eecircuit-engine.mjs';
          async function test() {
            try {
              console.log('Starting simulation...');
              const sim = new Simulation();
              const p = sim.start();
              console.log('Promise created, awaiting...');
              await p;
              console.log('Started!');
            } catch (e) {
              console.error('Error:', e);
            }
          }
          test();
        </script>
      </head>
      <body></body>
    </html>
  `, { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
