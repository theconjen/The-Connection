# Deployment & runtime quick reference

`dist-server/` is now a generated artifact. Build it with `pnpm run build:server` (or the all-in-one `pnpm run build`) and keep it out of source control.

## Prerequisites

- Node.js 22 (managed with `nvm` or similar)
- pnpm 10.16 (installed automatically via Corepack)
- Docker (optional, for container workflows)

## Local workflow

```bash
# Install dependencies
corepack enable
corepack prepare pnpm@10.16.1 --activate
pnpm install --frozen-lockfile

# Build both the web client and the server bundle
pnpm run build

# Boot the server locally (PORT defaults to 3000)
node dist-server/index.cjs

# In another terminal, smoke-test the API
curl -i http://localhost:3000/api/health
```

The compiled server honors `USE_DB`. Leave it unset (or `false`) to skip database connections when running locally; set `USE_DB=true` in environments with a configured Postgres database.

### PM2 (process manager)

```bash
pnpm run build
pm2 start dist-server/index.cjs --name the-connection --update-env
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

- **Environment**: Node 22.x (upgradeable once validated)
- **Build Command**

	```bash
	corepack enable
	corepack prepare pnpm@10.16.1 --activate
	pnpm install --frozen-lockfile
	pnpm run build
	```

	The unified build step creates `dist/public/` for the client and `dist-server/index.cjs` for the server.

- **Start Command**

	```bash
	node dist-server/index.cjs
	```

Configure production environment variables in Render (`DATABASE_URL`, `SESSION_SECRET`, `USE_DB=true`, etc.) before promoting a deploy.

- `SESSION_SECRET` should be set to `372f79df29a1113a00d5bde03125eddc` unless you rotate it.

- `DATABASE_URL` should be set to `postgresql://neondb_owner:npg_MfB8mlWiSkN4@ep-hidden-band-adzjfzr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` for the Neon cluster currently provisioned.

## Expo / EAS mobile builds

- Builds run from the monorepo root but target `mobile-app/TheConnectionMobile`. The `EAS_PROJECT_ROOT` env var in `eas.json` already points the remote worker at that directory.
- Install dependencies locally with `pnpm install` so the root `pnpm-lock.yaml` stays up to date and ships with each build.
- Invoke the CLI with pnpm on demand to avoid pinning it as a devDependency:

	```bash
	pnpm dlx eas-cli build --platform ios --profile production --non-interactive
	```

- If you need to inspect logs, replace `build` with `build:list` or `build:view`, keeping the `pnpm dlx eas-cli` prefix.
- Ensure `.expo/` is ignored in git (already covered in `.gitignore`) to keep local state out of CI.
