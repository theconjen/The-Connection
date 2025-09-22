module.exports = (req, res) => {
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <title>The Connection</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>🔗 The Connection</h1>
  <p>Site is loading successfully!</p>
  <p>Deployment working at: ${new Date().toISOString()}</p>
</body>
</html>`);
};
