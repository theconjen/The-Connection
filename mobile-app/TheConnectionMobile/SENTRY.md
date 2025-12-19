How to configure Sentry for the mobile app

- Package: `sentry-expo` is already included in `package.json`.
- Initialization: the app layout at `app/_layout.tsx` initializes Sentry on startup.
- Set your DSN:
  - For EAS builds, add it to `app.json` under `expo.extra.SENTRY_DSN` or configure secrets in EAS and populate `extra` at build time.
  - For local development, set environment variable before `expo start`:

```bash
export SENTRY_DSN="https://<your-dsn>@sentry.io/<project>"
expo start
```

- Tuning: `tracesSampleRate` is set to `0.05` by default — increase if you need more performance telemetry.

- Notes: keep `enableInExpoDevelopment` disabled unless you want error reporting during development.
