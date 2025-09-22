const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Set headers first
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Try to find index.html in various locations
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'public', 'index.html'),
      path.join(process.cwd(), 'public', 'index.html'),
      path.join(__dirname, '..', 'dist', 'public', 'index.html'),
      path.join(__dirname, '..', 'public', 'index.html')
    ];
    
    let html = null;
    let foundPath = null;
    
    for (const indexPath of possiblePaths) {
      try {
        if (fs.existsSync(indexPath)) {
          html = fs.readFileSync(indexPath, 'utf8');
          foundPath = indexPath;
          break;
        }
      } catch (err) {
        // Continue to next path
        continue;
      }
    }
    
    if (html) {
      res.statusCode = 200;
      res.end(html);
    } else {
      // Fallback HTML with debugging info
      const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <title>The Connection</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; }
    .error { background: #fee; border: 1px solid #fcc; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 The Connection</h1>
    <p>Your Christian community platform is starting up...</p>
    <div class="error">
      <p><strong>Build Status:</strong> Searching for built assets...</p>
      <p><strong>Paths checked:</strong></p>
      <ul>
        ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
    <p>The site will be fully functional once the build completes. Please refresh in a moment.</p>
  </div>
  <script>
    setTimeout(() => window.location.reload(), 10000);
  </script>
</body>
</html>`;
      
      res.statusCode = 200;
      res.end(fallbackHtml);
    }
  } catch (err) {
    // Final fallback
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html>
<head><title>The Connection</title></head>
<body>
  <h1>The Connection</h1>
  <p>Loading... (Error: ${err.message})</p>
  <script>setTimeout(() => window.location.reload(), 5000);</script>
</body>
</html>`);
  }
};
