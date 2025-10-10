# Web ↔ Mobile Unity & Synchronicity — Step-by-Step Execution Plan

**Objective:** One codebase with shared contracts/services/tokens, thin platform adapters, stable cookie auth over HTTPS, and CI/E2E to prevent drift. Result: web and Expo (Go/dev client/production) behave identically against the same API.

---

## 0) Preconditions

- Monorepo layout (example):
  - `apps/web` (Vite/React)
  - `apps/mobile` (Expo + Expo Router)
  - `shared` (pure TS: schemas, services, tokens)
- Node + pnpm/yarn; EAS CLI installed; Apple dev setup already done.
- Backend reachable locally.

---

## 1) One HTTPS Dev Domain (No IPs, No http)

**Choose one:** Cloudflare Tunnel (preferred) or ngrok.

### Option A: Cloudflare Tunnel

1. `npm i -g cloudflared` (or brew).
2. `cloudflared tunnel login` → pick your domain.
3. `cloudflared tunnel create dev-api`.
4. `cloudflared tunnel route dns dev-api dev.api.<yourdomain>.com`.
5. `cloudflared tunnel run dev-api --url http://localhost:PORT` (replace PORT with your API).
6. Verify `https://dev.api.<yourdomain>.com/health` resolves.

### Option B: ngrok (with custom domain)

1. `ngrok config add-authtoken <token>`.
2. Reserve a domain in ngrok dashboard.
3. `ngrok http --domain=dev-api-<you>.ngrok.dev <PORT>`.
4. In GoDaddy (or DNS host), create a CNAME `dev.api` → the ngrok host they provide (only if you’re not using the `*.ngrok.dev` reserved domain). Otherwise use the reserved domain directly.

**Backend cookie policy for dev over HTTPS:** `SameSite=None; Secure; HttpOnly; Path=/`.

---

## 2) Backend: CORS + Cookies (Express example)

```ts
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // native apps often send no Origin
    const allow = [
      'https://dev.api.<yourdomain>.com', // self (optional)
      'https://dev.<yourwebapp>.com',     // web dev origin if separate
    ];
    return allow.includes(origin) ? cb(null, true) : cb(new Error(`CORS: ${origin}`));
  },
  credentials: true,
}));

res.cookie('sid', token, {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  path: '/',
});
```

**Assumptions challenged:** If you keep `SameSite=Lax` in any env with cross-origin, mobile/web will fail. Lock to `None; Secure` for https.

---

## 3) Shared Env Adapter (no `process`/`window` in shared)

Create a virtual module `shared-env` and map per platform.

**Mobile:** `apps/mobile/src/env.native.ts`

```ts
import Constants from 'expo-constants';
export const API_BASE =
  (Constants?.expoConfig as any)?.extra?.apiBase ||
  process.env.EXPO_PUBLIC_API_BASE ||
  '';
```

**Web:** `apps/web/src/env.web.ts`

```ts
export const API_BASE = import.meta.env.VITE_API_BASE || '';
```

**TS paths**

- `apps/mobile/tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "shared/*": ["../../shared/*"],
      "shared-env": ["./src/env.native"]
    }
  }
}
```

- `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "shared/*": ["../../shared/*"],
      "shared-env": ["./src/env.web"]
    }
  }
}
```

---

## 4) Shared HTTP + Schemas + Services

**Install:** `pnpm add zod`

`shared/http.ts`

```ts
import { API_BASE } from 'shared-env';

type HttpInit = Omit<RequestInit, 'body' | 'credentials'> & { body?: unknown };

export async function http<T>(path: string, init: HttpInit = {}): Promise<T> {
  if (!API_BASE) throw new Error('API_BASE is not set');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = json?.message || json?.error || res.statusText || 'Request failed';
    throw Object.assign(new Error(msg), { status: res.status, data: json });
  }
  return json as T;
}
```

`shared/schema.ts`

```ts
import { z } from 'zod';
export const UserZ = z.object({ id: z.string(), email: z.string().email(), name: z.string().optional() });
export type User = z.infer<typeof UserZ>;
export const LoginReqZ = z.object({ email: z.string().email(), password: z.string().min(6) });
export type LoginReq = z.infer<typeof LoginReqZ>;
export const FeedItemZ = z.object({ id: z.string(), title: z.string(), body: z.string(), createdAt: z.string() });
export const FeedZ = z.array(FeedItemZ);
export type Feed = z.infer<typeof FeedZ>;
```

`shared/services/auth.ts`

```ts
import { http } from '../http';
import { LoginReqZ, UserZ, type LoginReq, type User } from '../schema';
export async function login(body: LoginReq): Promise<User> { LoginReqZ.parse(body); return UserZ.parse(await http('/api/login', { method: 'POST', body })); }
export async function me(): Promise<User | null> { const d = await http('/api/user'); return d ? UserZ.parse(d) : null; }
export async function logout(): Promise<void> { await http('/api/logout', { method: 'POST' }); }
export async function register(body: LoginReq & { name?: string }): Promise<User> { return UserZ.parse(await http('/api/register', { method: 'POST', body })); }
```

`shared/services/feed.ts`

```ts
import { http } from '../http';
import { FeedZ, type Feed } from '../schema';
export async function getFeed(): Promise<Feed> { return FeedZ.parse(await http('/api/feed')); }
```

---

## 5) Shared Tokens consumed by Tailwind (web) + NativeWind (mobile)

`shared/tokens.ts`

```ts
export const tokens = {
  color: { bg: '#0B0B0C', card: '#121214', text: '#F5F7FA', muted: '#9AA4B2', primary: '#5B8CFF', success: '#22C55E', danger: '#EF4444', border: '#1F242B' },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 },
};
```

**Web Tailwind:** `apps/web/tailwind.config.cjs`

```js
const { tokens } = require('../../shared/tokens');
module.exports = { content: ['./index.html', './src/**/*.{ts,tsx}'], theme: { extend: { colors: { ...tokens.color }, borderRadius: { DEFAULT: tokens.radius.md, lg: tokens.radius.lg, xl: tokens.radius.xl }, spacing: tokens.space } }, plugins: [] };
```

**Mobile NativeWind:** `apps/mobile/tailwind.config.js`

```js
const { tokens } = require('../../shared/tokens');
module.exports = { content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'], theme: { extend: { colors: { ...tokens.color }, borderRadius: { DEFAULT: tokens.radius.md, lg: tokens.radius.lg, xl: tokens.radius.xl }, spacing: tokens.space } }, plugins: [] };
```

---

## 6) Metro/Babel: ensure `shared/*` compiles

`apps/mobile/metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
module.exports = config;
```

**Babel (mobile):** keep `babel-preset-expo` + `nativewind/babel` only. No custom plugin clutter.

---

## 7) Mobile hooks/screens consuming shared services

`apps/mobile/src/queries/useMe.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { me } from 'shared/services/auth';
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: me });
```

`apps/mobile/app/register.tsx` (Expo Router)

```tsx
import { useState } from 'react';
import { View, TextInput, Text, Pressable, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from 'shared/services/auth';
import { useRouter } from 'expo-router';

export default function Register() {
  const qc = useQueryClient();
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const m = useMutation({
    mutationFn: () => register({ email, password, name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); r.replace('/'); },
  });

  return (
    <View className="flex-1 bg-bg p-6 gap-4">
      <Text className="text-text text-xl font-semibold">Create account</Text>
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Name" placeholderTextColor="#9AA4B2" value={name} onChangeText={setName} />
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Email" placeholderTextColor="#9AA4B2" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput className="bg-card text-text p-4 rounded" placeholder="Password" placeholderTextColor="#9AA4B2" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable className="bg-primary rounded-xl p-4 items-center" disabled={m.isPending} onPress={() => m.mutate()}>
        {m.isPending ? <ActivityIndicator /> : <Text className="text-white">Sign up</Text>}
      </Pressable>
      {m.isError ? <Text className="text-danger mt-2">{(m.error as any)?.message || 'Registration failed'}</Text> : null}
    </View>
  );
}
```

**Route guard**: keep your existing `AuthProvider` + redirect to `/login` if unauthenticated.

---

## 8) Environment pinning (no host drift)

**Mobile EAS:** `eas.json` (excerpt)

```json
{
  "build": {
    "development": { "developmentClient": true, "channel": "dev", "env": { "EXPO_PUBLIC_API_BASE": "https://dev.api.<yourdomain>.com" } },
    "preview":     { "channel": "preview", "env": { "EXPO_PUBLIC_API_BASE": "https://staging.api.<yourdomain>.com" } },
    "production":  { "channel": "production", "env": { "EXPO_PUBLIC_API_BASE": "https://api.<yourdomain>.com" } }
  }
}
```

**Mobile app config:** `app.config.ts`

```ts
import 'dotenv/config';
export default ({ config }) => ({
  ...config,
  extra: { apiBase: process.env.EXPO_PUBLIC_API_BASE },
  runtimeVersion: { policy: 'sdkVersion' },
});
```

**Web Vite:** `.env.development` → `VITE_API_BASE=https://dev.api.<yourdomain>.com` (staging/prod similarly).

**Fail-fast guard**: throw if `API_BASE` is empty (already in `http.ts`).

---

## 9) Parity Checklist Doc (to stop rot)

Create `PARITY.md` in repo root and keep routes/features in sync. Example section:

```
[ ] /feed ↔ (tabs)/feed
[ ] /communities ↔ (tabs)/communities
[ ] /events ↔ (tabs)/events
[ ] /apologetics ↔ (tabs)/apologetics
[ ] /login ↔ /login
[ ] /register ↔ /register
[ ] /settings ↔ /settings
```

---

## 10) E2E Smokes (fast, minimal)

**Auth smoke (Node):** `tools/smoke-auth.ts`

```ts
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
const fetch = fetchCookie(globalThis.fetch as any, new CookieJar());
const API = process.env.API_BASE!;
(async () => {
  const r1 = await fetch(`${API}/api/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email:'test@example.com', password:'secret123' })});
  if (!r1.ok) throw new Error('login failed');
  const r2 = await fetch(`${API}/api/user`);
  if (!r2.ok) throw new Error('me failed');
  const u = await r2.json();
  if (!u?.email) throw new Error('me invalid');
  const r3 = await fetch(`${API}/api/logout`, { method: 'POST' });
  if (!r3.ok) throw new Error('logout failed');
  console.log('SMOKE OK');
})();
```

**Run:** `pnpm add -D tough-cookie fetch-cookie && API_BASE=https://dev.api.<yourdomain>.com node tools/smoke-auth.ts`

**Mobile UI smoke (Maestro minimal):** `apps/mobile/maestro/auth.yaml`

```yaml
appId: com.your.app
name: Auth flow
steps:
  - launchApp
  - tapOn: "Login"
  - inputText: "test@example.com"
  - tapOn: "Password"
  - inputText: "secret123"
  - tapOn: "Sign in"
  - assertVisible: "Feed"
  - tapOn: "Settings"
  - tapOn: "Logout"
  - assertVisible: "Login"
```

**Install Maestro:** `curl -Ls https://get.maestro.mobile.dev | bash` **Run:** `maestro test apps/mobile/maestro/auth.yaml`

**Web Playwright smoke (optional):** login → /me → logout.

---

## 11) CI Guardrails (GitHub Actions)

`.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm i
      - run: pnpm -C apps/web i && pnpm -C apps/mobile i || true
      - run: pnpm add -D tough-cookie fetch-cookie
      - run: API_BASE=${{ secrets.DEV_API_BASE }} node tools/smoke-auth.ts

  parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ensure PARITY.md has no unchecked items
        run: |
          if grep -q "\[ \]" PARITY.md; then
            echo "Parity items unchecked. Update PARITY.md before merge."; exit 1;
          fi
```

**Secrets:** set `DEV_API_BASE` to your dev HTTPS URL.

---

## 12) Observability (before store submit)

- Sentry (or `expo-crash-reporter`): add now. Log schema-parse failures (Zod) as breadcrumbs.
- Minimal analytics (screen views) — respect privacy.

---

## 13) iOS/Android Network Reality Checks

- iOS ATS: you already use HTTPS. No exceptions needed.
- Android cleartext: irrelevant if HTTPS. If you ever test http, add a `network_security_config.xml` and manifest flag (not recommended).
- Cookie domain: must be exactly the FQDN you call. Do not mix `dev.api.<yourdomain>.com` with raw IPs in the same session.

---

## 14) Release Path Discipline

- **Mobile:** EAS Build per profile; `runtimeVersion: { policy: 'sdkVersion' }`; publish updates to matching channel only.
- **Web:** Deploy with `.env.production` pointing to `https://api.<yourdomain>.com`.
- **API:** Enforce HTTPS; HSTS; rate-limit `/api/login`.

---

## 15) Definition of Done

-

---

## 16) Fast Verification Steps (manual)

1. Mobile (device): login → background app → reopen → `/me` still authenticated → logout.
2. Web (different origin): login → refresh → `/me` persists → logout.
3. Change `EXPO_PUBLIC_API_BASE` to a wrong host → app fails fast with explicit error.
4. Update a Zod schema to be stricter → service call throws in dev and is reported in prod.

---

## 17) Optional Upgrades

- Generate clients from OpenAPI to eliminate hand-written fetchers.
- Add feature-flag remote config with checksum to prevent drift.
- Add Detox (Android) or XCUITest (iOS) for deeper mobile flows.

---

**Execute in order. Don’t mix http and https or IP and FQDN. Keep **``** pure and platform adapters thin.**
