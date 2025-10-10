# Deployment & local run (no-bundle server)

This file contains copy/paste commands to build and run the app locally or on a server using the lightweight "no-bundle" server wrapper at `dist-server/index.nobundle.js`.

Prerequisites
- Node 18 (recommended via `nvm`)
- Docker (optional, for container runs)
- `npm` (for installing packages if not using Docker)

1) Quick local dev (use existing node env)

```bash
# Install deps (if you haven't already)
npm ci

# Build client and server if needed (project may already have the built artifacts)
# npm run build  # if you usually build both client + server

# Run the tiny no-bundle server in foreground for debugging
node dist-server/index.nobundle.js

# In another terminal, test health
curl -i http://localhost:5000/api/health
```

2) Run with PM2 (process manager) — recommended for single-VM production

```bash
# install pm2 (once)
npm install -g pm2

# start the no-bundle server with pm2
pm2 start dist-server/index.nobundle.js --name the-connection --update-env
pm2 save

# view logs
pm2 logs the-connection --lines 200
```

3) Docker (recommended for reproducible runtime)

Build image locally
```bash
docker build -t the-connection:local .
```

Run the image (set DATABASE_URL and other envs as needed)
```bash
docker run --rm -e DATABASE_URL="$DATABASE_URL" -p 5000:5000 the-connection:local
```

Or use docker-compose for local development
```bash
docker compose up --build
```

4) Notes & tips
- If the server throws missing-module errors, run `npm ci` on the host (or ensure docker build completed successfully) so `node_modules` are present.
- For smaller artifacts and no node_modules on the server, consider building a bundled artifact with `esbuild --bundle` and adjusting the Dockerfile to copy that single file instead of relying on node_modules.
