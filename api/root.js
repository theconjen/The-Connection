const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Try multiple possible locations for index.html
    const possiblePaths = [
      path.resolve(__dirname, '..', 'dist', 'public', 'index.html'),
      path.resolve(__dirname, '..', 'public', 'index.html'),
      path.resolve(__dirname, '..', 'index.html')
    ];
    
    let html = null;
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        html = fs.readFileSync(indexPath, 'utf8');
        break;
      }
    }
    
    if (html) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.statusCode = 200;
      res.end(html);
    } else {
      // Fallback HTML if no index.html found
      const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <title>The Connection</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">
    <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
      <h1>The Connection</h1>
      <p>Site is building... Please refresh in a moment.</p>
    </div>
  </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.statusCode = 200;
      res.end(fallbackHtml);
    }
  } catch (err) {
    console.error('Error in root.js:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Error loading site');
  }
};
