function log(...args) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...args);
  }
}

async function setupVite(_app, _server) {
  return { vite: null };
}

function serveStatic(_app) {
  return (_req, _res, next) => next();
}

module.exports = { log, setupVite, serveStatic };