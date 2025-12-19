Sentry integration
=================

This project reads Sentry configuration from environment variables. The server-side (Node) integration is implemented in `server/index.ts` and uses `@sentry/node`.

Environment variables
- `SENTRY_DSN` - The Sentry DSN for your project.
- `SENTRY_TRACES_SAMPLE_RATE` - Sampling rate for performance tracing (0..1). Default: `0`.
- `SENTRY_SEND_DEFAULT_PII` - `true` to send default PII (IP address and other automatic data). Default: `false`.

Example (zsh):
```bash
export SENTRY_DSN="https://<key>@o12345.ingest.sentry.io/67890"
export SENTRY_TRACES_SAMPLE_RATE=0.1
export SENTRY_SEND_DEFAULT_PII=true
pnpm --filter server install
pnpm --filter server exec tsx server/index.ts
```

Notes
- The server only initializes Sentry when `SENTRY_DSN` is provided.
- `SENTRY_SEND_DEFAULT_PII` defaults to `false` to avoid sending IP addresses and similar data by default. Set it to `true` only if you understand the privacy implications.
- For frontend / mobile builds (Expo / web) see platform-specific instructions in the respective app folders.

Uploading source maps / release configuration
- For production builds, configure releases and upload source maps per Sentry docs. For React Native/Expo apps, follow Sentry/EAS integration guides to upload sourcemaps at build time.

If you want me to add release/sourcemap upload steps for EAS or CI, say which platform and CI provider to update.
