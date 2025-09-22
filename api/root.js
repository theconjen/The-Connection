module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.statusCode = 200;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Connection</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      margin: 0;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      max-width: 600px;
      background: rgba(255,255,255,0.1);
      padding: 3rem;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 1rem; }
    .status { 
      background: rgba(255,255,255,0.2); 
      padding: 1rem; 
      border-radius: 10px; 
      margin: 2rem 0; 
    }
    .loading {
      margin-top: 2rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 The Connection</h1>
    <p>Your Christian community platform</p>
    
    <div class="status">
      <p><strong>✅ Vercel deployment is live!</strong></p>
      <p>🔄 Loading full application...</p>
    </div>
    
    <div class="loading">
      <p>The site will automatically refresh when ready</p>
    </div>
  </div>
  
  <script>
    let attempts = 0;
    function checkSite() {
      attempts++;
      if (attempts > 10) {
        document.querySelector('.loading p').textContent = 'Taking longer than expected. Please refresh manually.';
        return;
      }
      
      // Try to fetch the main site
      fetch('/api/index.ts').then(response => {
        if (response.ok) {
          window.location.reload();
        } else {
          setTimeout(checkSite, 5000);
        }
      }).catch(() => {
        setTimeout(checkSite, 5000);
      });
    }
    
    setTimeout(checkSite, 3000);
  </script>
</body>
</html>`;
  
  res.end(html);
};
