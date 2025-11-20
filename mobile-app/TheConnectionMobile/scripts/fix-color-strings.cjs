/**
 * Fix hardcoded 'Colors.primary' strings to use Colors.primary constant
 */

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../app');

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixColorStrings() {
  const files = getAllTsxFiles(appDir);
  let totalChanges = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Replace 'Colors.primary' with Colors.primary in style objects
    content = content.replace(/'Colors\.primary'/g, 'Colors.primary');

    // Replace "Colors.primary" with Colors.primary in style objects
    content = content.replace(/"Colors\.primary"/g, 'Colors.primary');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      const changes = (originalContent.match(/'Colors\.primary'/g) || []).length +
                      (originalContent.match(/"Colors\.primary"/g) || []).length;
      totalChanges += changes;
      console.log(`✓ Fixed ${changes} color strings in: ${path.relative(appDir, file)}`);
    }
  }

  console.log(`\n✓ Total: Fixed ${totalChanges} color strings across all files`);
}

fixColorStrings();
