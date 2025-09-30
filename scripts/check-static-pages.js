const fs = require('fs');
const path = require('path');

const pages = [
  { file: 'public/privacy.html', mustHave: /<h1[^>]*>\s*Privacy/i },
  { file: 'public/terms.html', mustHave: /<h1[^>]*>\s*Terms/i },
  { file: 'public/community-guidelines.html', mustHave: /<h1[^>]*>\s*Community Guidelines/i },
];

let failed = false;

for (const p of pages) {
  const fp = path.resolve(process.cwd(), p.file);
  if (!fs.existsSync(fp)) {
    console.error('MISSING:', p.file);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(fp, 'utf8');
  if (!p.mustHave.test(content)) {
    console.error('MISSING HEADING:', p.file);
    failed = true;
  } else {
    console.log('OK:', p.file);
  }
}

if (failed) process.exit(2);
console.log('All static pages validated.');
