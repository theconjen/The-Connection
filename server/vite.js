function log(...args) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...args);
  }
}

async function setupVite() {
  return { vite: null };
}

function serveStatic() {
  return (_req, _res, next) => next();
}

module.exports = { log, setupVite, serveStatic };