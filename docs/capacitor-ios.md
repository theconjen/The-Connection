# Capacitor iOS Ops Notes

Switch Node versions with `nvm` depending on the task:

- Use **Node 22** for local web/server development and builds.
- Use **Node 20** when running Capacitor CLI commands (`cap copy ios`, `cap sync ios`, `cap open ios`).

## Build & Bundle Steps

```bash
pnpm -C apps/web build
nvm use 20
pnpm exec cap copy ios
pnpm exec cap open ios
```

## Simulator QA Checklist

1. Sign in within the iOS simulator.
2. Force close the app, reopen it, and confirm the session persists.
3. Tap the Share button and verify the native share sheet appears.
