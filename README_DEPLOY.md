# Deployment & runtime quick reference

`dist-server/` is now a generated artifact. Build it with `pnpm run build:server` (or the all-in-one `pnpm run build`) and keep it out of source control.

## Prerequisites

- Node.js 22 (managed with `nvm` or similar)
- pnpm 10.19 (installed automatically via Corepack)
- Docker (optional, for container workflows)

## Local workflow

```bash
# Install dependencies
corepack enable
corepack prepare pnpm@10.19.0 --activate
pnpm install --frozen-lockfile

# Build both the web client and the server bundle
pnpm run build

# Boot the server locally (PORT defaults to 3000)
node dist-server/index.js

# In another terminal, smoke-test the API
curl -i http://localhost:3000/api/health
```

The compiled server honors `USE_DB`. Leave it unset (or `false`) to skip database connections when running locally; set `USE_DB=true` in environments with a configured Postgres database.

### PM2 (process manager)

```bash
pnpm run build
pm2 start dist-server/index.js --name the-connection --update-env
pm2 logs the-connection --lines 200
```

### Docker

```bash
docker build -t the-connection:local .
docker run --rm \
	-p 3000:3000 \
	-e USE_DB=true \
	-e DATABASE_URL="$DATABASE_URL" \
	the-connection:local
```

Or bring everything up with Compose:

```bash
docker compose up --build
```

## Render deployment (Web Service)

Use these settings for Render:

- **Environment**: Node 18.x (upgradeable once validated)
- **Build Command**

	```bash
	corepack enable
	corepack prepare pnpm@10.19.0 --activate
	pnpm install --frozen-lockfile
	pnpm run build
	```

	The unified build step creates `dist/public/` for the client and `dist-server/index.js` for the server.

- **Start Command**

	```bash
	node dist-server/index.js
	```

Configure production environment variables in Render (`DATABASE_URL`, `SESSION_SECRET`, `USE_DB=true`, etc.) before promoting a deploy.
