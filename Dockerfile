# Dockerfile (production - no-bundle)
FROM node:22-slim AS deps
WORKDIR /app

# Install build tools required by some native modules (better-sqlite3, node-gyp)
# Keep packages minimal to reduce image size. Clean apt caches afterwards.
RUN apt-get update \
		&& apt-get install -y --no-install-recommends \
			python3 python3-dev build-essential git ca-certificates libsqlite3-dev pkg-config \ 
		&& rm -rf /var/lib/apt/lists/* \
		&& [ -x "/usr/bin/python3" ] && ln -sf /usr/bin/python3 /usr/bin/python || true

# Install only production dependencies (assumes package-lock.json present)
# Use npm's --omit=dev to avoid pulling devDependencies and set legacy-peer-deps
# to tolerate peer conflicts that can happen in upstream packages during image builds.
COPY package.json package-lock.json ./
RUN npm config set legacy-peer-deps true \
	&& npm config set python /usr/bin/python \
	&& npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Build server artifacts (no-bundle) so runtime has compiled JS modules in dist-server
# Use the project's local esbuild (in devDeps) if available, otherwise install a small local
# esbuild binary. We run npx esbuild to produce the no-bundle server wrapper and compiled
# server modules required by dist-server/index.nobundle.js.
RUN npx --yes esbuild server/index.ts --platform=node --format=esm --outfile=dist-server/index.nobundle.js || true
# Create a bundled CommonJS single-file server to avoid ESM dynamic-require issues
RUN npx --yes esbuild server/index.ts --bundle --platform=node --format=cjs --outfile=dist-server/index.cjs --metafile=dist-server/meta.json || true
RUN npx --yes esbuild server --outdir=dist-server --platform=node --format=esm --loader:.ts=ts --external:*.css || true
# Fix import specifiers for ESM compatibility
RUN node scripts/fix-dist-imports.cjs

FROM node:22-slim
WORKDIR /app

# Minimal runtime dependencies
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& apt-get autoremove -y \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Copy dependency manifests and install production deps only
COPY package.json package-lock.json ./
RUN npm config set legacy-peer-deps true \
	&& npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy app files (assumes dist-server/* is present in the repo)
COPY . .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Run the bundled server artifact (checked into the repo)
CMD ["node", "dist-server/index.nobundle.js"]
