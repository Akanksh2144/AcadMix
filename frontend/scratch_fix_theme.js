const fs = require('fs');
const path = require('path');
const dir = 'c:/AcadMix/frontend/src/pages';
const files = fs.readdirSync(dir);

let count = 0;
files.forEach(file => {
  if (file.endsWith('Dashboard.jsx') || file === 'LoginPage.jsx' || file === 'AlumniDashboard.jsx' || file === 'CodePlayground.jsx') {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Look for <motion.button ... onClick={toggleTheme} ... className="... hidden sm:block"
    // Because it might be across lines, we can just replace the specific className strings we know of globally.
    // The safest is: replace ' hidden sm:block' with '' BUT only on buttons that also have 'onClick={toggleTheme}'.
    // We can do a string split by onClick={toggleTheme} to find the button's className.

    // A simpler regex that matches onClick={toggleTheme} and looks ahead for className="..."
    content = content.replace(/(onClick=\{toggleTheme\}.*?className="[^"]*?)( hidden sm:block| hidden md:block| hidden md:flex| hidden sm:flex)/gs, '$1');

    // Also, some files might define the class before the onClick: 
    // className="... hidden sm:block" ... onClick={toggleTheme}
    // We can just globally replace ` hidden sm:block` IF the file imports `useTheme`. 
    // Actually, no, other things might be hidden!

    // Let's do a reliable replace: find the exact theme toggle component from AcadMix and just replace its class.
    content = content.replace(/(className="[^"]*rounded-full[^"]*bg-slate-50[^"]*text-slate-500[^"]*)( hidden sm:block| hidden sm:flex)/g, '$1');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log('Fixed', file);
      count++;
    }
  }
});
console.log('Modified', count, 'files');
