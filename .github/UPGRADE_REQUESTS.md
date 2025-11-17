Upgrade requests and remediation plan

1) @vercel/node -> update undici & esbuild
- Request: Upgrade `undici` to >= 5.28.5 (or 6.21.1/7.2.3) and `esbuild` to >= 0.25.0.
- Rationale: Audits show `.>@vercel/node>undici` and `.>@vercel/node>esbuild` as vulnerable transitive packages.
- Test: `pnpm -w audit` should not show advisories for undici/esbuild after upgrade.

2) React Native / mobile toolchain -> update js-yaml
- Request: Ensure `js-yaml` is >= 4.1.1 in the react-native/jest chain (babel-jest -> babel-plugin-istanbul -> @istanbuljs/load-nyc-config).
- Rationale: `js-yaml` prototype pollution advisory found under the mobile toolchain paths.
- Test: `pnpm -w audit` no advisories for js-yaml.

3) Internal follow-up
- Remove `pnpm.overrides` once upstream releases are available and our tests (API + Playwright) pass.
- Keep `.github/workflows/audit.yml` to prevent regressions.

