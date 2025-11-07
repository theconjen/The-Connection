const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) files.push(...walk(full));
    else if (st.isFile() && full.endsWith('.js')) files.push(full);
  }
  return files;
}

function fixImports(code, filePath) {
  // Replace path alias @shared/... -> ./shared/...
  code = code.replace(/@shared\/(\S+?)(['";])/g, (m, p1, p2) => `./shared/${p1}.js${p2}`);

  // Replace relative imports that lack an extension: ./foo or ../bar -> ./foo.js
  // Avoid node builtins and package specifiers (those don't start with ./ or ../)
  code = code.replace(/(from\s+|import\s+\(|import\s+\{[^}]*\}\s+from\s+)(['"])(\.\.?\/[\w\-\/\.@]+)(['"])/g,
    (m, pre, q1, imp, q2) => {
      // If already has an extension, keep it
      if (/\.[a-zA-Z0-9]+$/.test(imp)) return `${pre}${q1}${imp}${q2}`;
      return `${pre}${q1}${imp}.js${q2}`;
    }
  );

  // Also handle dynamic import(...) calls: import('./foo')
  code = code.replace(/import\((['"])(\.\.?\/[\w\-\/\.@]+)(['"])\)/g, (m, q1, imp, q2) => {
    if (/\.[a-zA-Z0-9]+$/.test(imp)) return `import(${q1}${imp}${q2})`;
    return `import(${q1}${imp}.js${q2})`;
  });

  return code;
}

function main() {
  const target = path.resolve(__dirname, '..', 'dist-server');
  if (!fs.existsSync(target)) {
    console.error('dist-server not found, run build first');
    process.exit(1);
  }

  const files = walk(target);
  for (const f of files) {
    let code = fs.readFileSync(f, 'utf8');
    const fixed = fixImports(code, f);
    if (fixed !== code) {
      fs.writeFileSync(f, fixed, 'utf8');
      console.log('patched', path.relative(process.cwd(), f));
    }
  }
}

main();
