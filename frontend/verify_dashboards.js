const puppeteer = require('puppeteer');

const ROLES = [
    { role: 'Student', collegeId: '22WJ8A6745', password: '22WJ8A6745' },
    { role: 'Teacher', collegeId: 'T001', password: 'teacher123' },
    { role: 'HOD', collegeId: 'HOD001', password: 'hod123' },
    { role: 'Exam Cell', collegeId: 'EC001', password: 'examcell123' },
    { role: 'Nodal Officer', collegeId: 'nodal@dhte.gov', password: 'nodal123' },
    { role: 'T&P Officer', collegeId: 'TPO001', password: 'tpo123' },
    { role: 'Alumni', collegeId: 'ALUMNI001', password: 'alumni123' },
    { role: 'Parent', collegeId: 'PARENT001', password: 'parent123' },
    { role: 'Industry', collegeId: 'IND001', password: 'industry123' },
    { role: 'Principal', collegeId: 'PRIN001', password: 'teacher123' },
    { role: 'Retired Faculty', collegeId: 'RF001', password: 'retired123' },
    { role: 'Expert', collegeId: 'EXP001', password: 'expert123' },
    { role: 'Warden', collegeId: 'WARDEN001', password: 'warden123' },
    { role: 'Transport', collegeId: 'TRANSPORT001', password: 'transport123' },
    { role: 'Librarian', collegeId: 'LIBRARIAN001', password: 'librarian123' },
    { role: 'Security', collegeId: 'SECURITY001', password: 'security123' }
];

async function run() {
    console.log("Starting Headless Browser to test all dashboards...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Set viewport big enough to avoid layout shifts hiding buttons
    await page.setViewport({ width: 1440, height: 900 });

    const errorsMap = {};

    page.on('pageerror', err => {
        if (!errorsMap.currentRole) return;
        errorsMap[errorsMap.currentRole].push(`[PAGE ERROR] ${err.toString()}`);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const err = msg.text();
            // Ignore generic network or 401 unauth errors that happen legitimately
            if (err.includes('status of 4') || err.includes('net::ERR_')) return;
            // Ignore Sentry fetch errors dynamically injected
            if (err.includes('Sentry')) return;
            
            if (!errorsMap.currentRole) return;
            errorsMap[errorsMap.currentRole].push(`[CONSOLE] ${err}`);
        }
    });

    for (const r of ROLES) {
        console.log(`\n============================`);
        console.log(`Testing Role: ${r.role} (${r.collegeId})`);
        errorsMap.currentRole = r.role;
        errorsMap[r.role] = [];
        
        try {
            await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Fast clear localstorage
            await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
            await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

            let safeRoleName = r.role.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
            let testId = `[data-testid="quick-login-${safeRoleName}"]`;
            console.log(`Clicking Quick Login for ${r.role} via ${testId}...`);
            
            // Wait for the button
            await page.waitForSelector(testId, { timeout: 10000 });
            await page.click(testId);
            
            console.log(`Waiting for ${r.role} dashboard to render...`);
            
            // Wait for URL to NOT be the login page, up to 15s
            for (let i=0; i<30; i++) {
                await new Promise(res => setTimeout(res, 500));
                if (page.url() !== 'http://localhost:3000/' && page.url() !== 'http://localhost:3000/login') {
                    break;
                }
            }
            
            // Give React 1.5s to crash if there are undefined variables
            await new Promise(res => setTimeout(res, 1500));
            
            let slug = r.role.replace(/[^a-zA-Z]/g, '').toLowerCase();
            await page.screenshot({ path: `dashboard_${slug}.png`, fullPage: false });
            console.log(`Screenshot saved for ${r.role}.`);

            // Check if we are stuck on login page
            const url = page.url();
            if (url === 'http://localhost:3000/' || url === 'http://localhost:3000/login') {
                const errorVisible = await page.evaluate(() => {
                    const errEl = document.querySelector('[data-testid="login-error"]');
                    return errEl ? errEl.innerText : null;
                });
                if (errorVisible) {
                    errorsMap[r.role].push(`Login rejected by backend: ${errorVisible}`);
                    console.log(`Login failed for ${r.role}: ${errorVisible}`);
                } else {
                    errorsMap[r.role].push(`Stuck on login page after submit, no error shown.`);
                }
            }

        } catch (e) {
            console.error(`Failed during ${r.role} flow: ${e.message}`);
            errorsMap[r.role].push(`[SCRIPT CRASH] ${e.message}`);
        }
    }
    
    await browser.close();
    
    console.log("\n\n===== TEST SUMMARY =====");
    let allGood = true;
    for (const r of Object.keys(errorsMap)) {
        if (r === 'currentRole') continue;
        if (errorsMap[r].length > 0) {
           allGood = false;
           console.log(`[X] ${r}: ${errorsMap[r].length} warnings/errors captured.`);
           errorsMap[r].forEach(e => console.log(`   -> ${e}`));
        } else {
           console.log(`[OK] ${r}`);
        }
    }

    if (allGood) console.log("All dashboards loaded flawlessly without React crashes!");
}

run().catch(console.error);
