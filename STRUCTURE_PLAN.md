# Structure Analysis & Redesign Plan

## Current State Analysis

### ✅ What's Working

1. **pnpm Workspace** - Already configured
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - apps/*
     - mobile-app/*
     - client
     - shared
     - server
   ```

2. **Platform-Specific Pattern** - Partially implemented
   - Mobile uses `.web.tsx` and `.native.tsx` extensions
   - Metro bundler configured to support platform extensions
   - 12 UI components have platform splits (Button, Card, Avatar, etc.)

3. **Shared Code Exists** - `/shared` directory with:
   - `schema.ts` - Database/API schemas
   - `api.ts` - Cross-platform API utilities
   - `services/` - Business logic (auth, feed)
   - `theme/` - Design tokens
   - `i18n/` - Internationalization

### ❌ What's Broken

#### 1. **Code Duplication & Fragmentation**

**Three separate API implementations**:
- `/shared/api.ts` - Cross-platform (proper!)
- `/client/src/lib/api.ts` - Web-only version
- `/mobile-app/TheConnectionMobile/src/shared/api.ts` - Duplicate copy of /shared/api.ts

**Two separate "shared" folders**:
- `/shared/` - Root shared code (schema, services, theme)
- `/mobile-app/TheConnectionMobile/src/shared/` - Mobile-only utilities

**Import inconsistency**:
```typescript
// Client uses relative imports
import { User } from "../../../shared/schema";

// Mobile has its own copy
import { ThemeProvider } from '../src/shared/ThemeProvider';

// tsconfig defines @shared/* but it's not used
```

#### 2. **Missing Package Structure**

`/shared` directory has NO `package.json`:
- Can't be imported as a proper workspace package
- No dependency management
- No build configuration
- Forces fragile relative imports

#### 3. **Component Architecture Gaps**

**Assets folder confusion**:
- 47 web components in `/mobile-app/.../assets/*.tsx`
- Never imported (dead code)
- Actually belong in `/client/src/components/ui/`

**Missing platform splits**:
- Only 12/47 components have native versions
- No systematic approach for:
  - Storage (localStorage vs AsyncStorage)
  - Maps (react-leaflet vs react-native-maps)
  - File uploads (Uppy vs expo-*)
  - Navigation (wouter vs expo-router)

#### 4. **Dependency Contamination**

**Mobile package has web deps**:
```json
// mobile-app/TheConnectionMobile/package.json
"react-dom": "19.1.0"              ❌ Web renderer
"@types/react-dom": "~19.1.7"      ❌ Web types
"react-native-web": "^0.21.2"      ❌ Wrong direction
```

**Root package has platform-specific deps**:
```json
// Root package.json (affects all workspaces)
"@radix-ui/*"         ❌ Web-only (27 packages)
"@uppy/*"             ❌ Web-only file upload
"leaflet"             ❌ Web-only maps
"react-leaflet"       ❌ Web-only maps
"wouter"              ❌ Web-only routing
"express-session"     ❌ Server-only
```

---

## 🎯 Target Structure

### Workspace Architecture

```
/
├── packages/
│   ├── shared/              ✨ NEW: Proper workspace package
│   │   ├── package.json     ✨ NEW
│   │   ├── tsconfig.json    ✨ NEW
│   │   ├── src/
│   │   │   ├── schema/      (database schemas, types)
│   │   │   ├── services/    (business logic - platform-agnostic)
│   │   │   ├── utils/       (cross-platform utilities)
│   │   │   ├── theme/       (design tokens, colors)
│   │   │   ├── i18n/        (translations)
│   │   │   └── index.ts     (public exports)
│   │   └── platform/        ✨ NEW: Platform-specific implementations
│   │       ├── storage.web.ts
│   │       ├── storage.native.ts
│   │       ├── navigation.web.ts
│   │       ├── navigation.native.ts
│   │       └── ...
│   │
│   ├── ui/                  ✨ NEW: Shared UI components
│   │   ├── package.json     ✨ NEW
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx          (platform-agnostic exports)
│   │   │   │   ├── Button.web.tsx      (web implementation)
│   │   │   │   ├── Button.native.tsx   (native implementation)
│   │   │   │   └── types.ts            (shared types)
│   │   │   ├── Card/
│   │   │   ├── Dialog/
│   │   │   └── ...
│   │
│   └── mobile/              📁 MOVE: mobile-app/TheConnectionMobile → packages/mobile
│       ├── package.json     (cleaned dependencies)
│       ├── app/             (expo-router screens)
│       └── src/
│           └── components/  (mobile-specific components only)
│
├── apps/
│   └── web/                 📁 DELETE: Remove duplicate
│
├── client/                  📁 RENAME: → apps/web or packages/web
│   ├── package.json         (web-specific deps only)
│   └── src/
│       ├── pages/
│       └── components/      (web-specific components only)
│
├── server/
│   └── package.json         (server-specific deps only)
│
└── package.json             (only truly shared runtime deps)
```

### Import Patterns

**Before** (fragile):
```typescript
// Relative path hell
import { User } from "../../../shared/schema";
import { apiFetch } from "../../lib/api";
```

**After** (clean):
```typescript
// Workspace imports
import { User } from "@connection/shared";
import { Button } from "@connection/ui";
import { storage } from "@connection/shared/platform";
```

---

## 📋 Implementation Plan

### Phase 1: Structure Foundation (1-2 hours)

**1.1 Create shared package**
```bash
mkdir -p packages/shared/src
mv shared/* packages/shared/src/
```

**1.2 Create shared/package.json**
```json
{
  "name": "@connection/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema.ts",
    "./services/*": "./src/services/*.ts",
    "./platform": "./src/platform/index.ts"
  },
  "dependencies": {
    "zod": "^4.1.12",
    "date-fns": "^4.1.0"
  }
}
```

**1.3 Create UI component package**
```bash
mkdir -p packages/ui/src
```

**1.4 Update pnpm-workspace.yaml**
```yaml
packages:
  - apps/*
  - packages/*
  - server
```

**1.5 Update root tsconfig.json paths**
```json
{
  "paths": {
    "@connection/shared": ["./packages/shared/src"],
    "@connection/ui": ["./packages/ui/src"],
    "@/*": ["./apps/web/src/*"]
  }
}
```

### Phase 2: Platform Abstraction (2-3 hours)

**2.1 Create storage abstraction**

`packages/shared/src/platform/storage.ts`:
```typescript
export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export { storage } from './storage.native';
```

`packages/shared/src/platform/storage.web.ts`:
```typescript
import { Storage } from './storage';

class WebStorage implements Storage {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

export const storage = new WebStorage();
```

`packages/shared/src/platform/storage.native.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Storage } from './storage';

class NativeStorage implements Storage {
  async getItem(key: string): Promise<string | null> {
    if (key.startsWith('secure:')) {
      return await SecureStore.getItemAsync(key.slice(7));
    }
    return await AsyncStorage.getItem(key);
  }
  // ... implement setItem, removeItem
}

export const storage = new NativeStorage();
```

**2.2 Create navigation abstraction** (similar pattern)
**2.3 Create sharing abstraction** (similar pattern)

### Phase 3: Component Migration (2-3 hours)

**3.1 Move web components**
```bash
# Move shadcn/ui components from mobile/assets to client
mv mobile-app/TheConnectionMobile/assets/*.tsx client/src/components/ui/
```

**3.2 Create component package structure**
```bash
# For each component with platform split:
packages/ui/src/Button/
  ├── Button.tsx         # export { Button } from './Button.native'
  ├── Button.web.tsx     # web implementation
  ├── Button.native.tsx  # native implementation
  └── types.ts           # shared types
```

**3.3 Configure metro.config.js**
```javascript
config.resolver.extraNodeModules = {
  '@connection/shared': path.resolve(__dirname, '../../packages/shared/src'),
  '@connection/ui': path.resolve(__dirname, '../../packages/ui/src'),
};
```

### Phase 4: Dependency Cleanup (30 min)

**4.1 Clean mobile package.json**
```bash
cd packages/mobile
pnpm remove react-dom @types/react-dom react-native-web
```

**4.2 Move web deps from root → apps/web**
```json
// Root package.json - ONLY these
{
  "dependencies": {
    "react": "19.1.0",
    "@tanstack/react-query": "^5.90.9",
    "axios": "^1.13.2",
    "zod": "^4.1.12"
  }
}

// apps/web/package.json - ADD these
{
  "dependencies": {
    "@radix-ui/*": "...",
    "@uppy/*": "...",
    "leaflet": "...",
    "wouter": "..."
  }
}
```

**4.3 Delete duplicate app**
```bash
rm -rf apps/web
```

### Phase 5: Update Imports (1-2 hours)

**5.1 Replace all imports in client**
```bash
# Find-replace across client/
"../../../shared/schema" → "@connection/shared/schema"
"./lib/api" → "@connection/shared"
```

**5.2 Replace all imports in mobile**
```bash
# Find-replace across mobile/
"../src/shared/api" → "@connection/shared"
"../components/ui/Button" → "@connection/ui/Button"
```

---

## 🎯 Success Criteria

### After Structure Phase:

✅ Clean workspace architecture
- [ ] `/packages/shared` with package.json
- [ ] `/packages/ui` with platform-specific components
- [ ] `/packages/mobile` (moved from mobile-app/TheConnectionMobile)
- [ ] `/apps/web` or renamed `/client`
- [ ] Updated pnpm-workspace.yaml

✅ No duplicate code
- [ ] Single `/packages/shared/api.ts` (deleted other copies)
- [ ] Single theme/tokens location
- [ ] Single schema definition

✅ Clean imports
- [ ] All code uses `@connection/*` imports
- [ ] No relative path traversals (`../../../`)
- [ ] TypeScript resolves correctly

### After Dependency Phase:

✅ Clean package.json files
- [ ] Root: Only shared runtime deps (react, tanstack-query, axios, zod)
- [ ] Mobile: No web deps (no react-dom, no radix-ui)
- [ ] Web: All web deps (@radix-ui, leaflet, wouter)
- [ ] Server: All server deps (express, passport)

✅ No contamination
- [ ] Mobile builds without web dependencies
- [ ] Web builds without react-native
- [ ] Shared code has zero platform-specific deps

---

## 🚀 Next Steps

**Now**: Review this plan
**Then**: Execute Phase 1 (Structure Foundation)
**After**: Execute Phase 4 (Dependency Cleanup)

Ready to proceed?
