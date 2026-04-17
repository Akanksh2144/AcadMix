const fs = require('fs');
const path = require('path');
const dir = 'c:/AcadMix/frontend/src/pages';
const files = fs.readdirSync(dir);

let count = 0;
files.forEach(file => {
  if (file.endsWith('.jsx')) { // Run on all .jsx files!
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    content = content.replace(/(onClick=\{toggleTheme\}.*?className="[^"]*?)( hidden sm:block| hidden md:block| hidden md:flex| hidden sm:flex)/gs, '$1');
    content = content.replace(/(className="[^"]*rounded-full[^"]*bg-slate-50[^"]*text-slate-500[^"]*)( hidden sm:block| hidden sm:flex)/g, '$1');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log('Fixed', file);
      count++;
    }
  }
});
console.log('Modified', count, 'files');
