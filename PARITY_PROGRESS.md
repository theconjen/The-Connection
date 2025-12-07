# Web/Native Parity Progress

This document tracks the progress toward achieving full feature parity between the web app and React Native mobile app.

## ✅ Completed Phases

### Phase 1: Structure Foundation (Complete)
**Goal**: Set up proper monorepo workspace architecture

**Achievements**:
- ✅ Created `packages/shared` with package.json and proper exports
- ✅ Created `packages/ui` for shared component library
- ✅ Moved `/shared` → `/packages/shared/src`
- ✅ Updated `pnpm-workspace.yaml` to include packages
- ✅ Configured TypeScript paths (`@connection/shared`, `@connection/ui`)
- ✅ Configured Metro bundler for mobile to watch workspace packages
- ✅ Set up clean imports: `@connection/shared` instead of `../../../shared`

**Files Created**:
- `/packages/shared/package.json`
- `/packages/shared/tsconfig.json`
- `/packages/shared/src/index.ts`
- `/packages/ui/package.json`
- `/packages/ui/tsconfig.json`
- `/packages/ui/src/index.ts`

**Commit**: `077efd7`

---

### Phase 4: Dependency Cleanup (Complete)
**Goal**: Separate platform-specific dependencies into proper workspaces

**Achievements**:
- ✅ Removed web dependencies from mobile package (react-dom, @types/react-dom, react-native-web)
- ✅ Created `client/package.json` with web-only dependencies
- ✅ Moved 27 `@radix-ui/*` packages from root → client
- ✅ Moved web libraries from root → client (leaflet, wouter, uppy, react-share)
- ✅ Cleaned root package.json (only server + shared deps)
- ✅ Deleted duplicate `/apps/web` directory (32 files, 4,500+ lines)
- ✅ Updated workspace configuration

**Dependencies Moved to Client**:
- `@radix-ui/*` (27 packages)
- `@uppy/*` (5 packages)
- `leaflet`, `react-leaflet`
- `wouter`
- `react-share`, `react-day-picker`
- `embla-carousel-react`
- `input-otp`, `isomorphic-dompurify`
- `lucide-react`
- Web devDependencies (tailwindcss, vite, autoprefixer)

**Commit**: `cdf1f17`

---

### Phase 2: Platform Abstractions (Complete)
**Goal**: Create unified APIs that work across web and React Native

**Achievements**:
- ✅ Created storage abstraction (localStorage vs AsyncStorage/SecureStore)
- ✅ Created navigation abstraction (wouter vs expo-router)
- ✅ Created sharing abstraction (Web Share API vs react-native-share)
- ✅ Installed `react-native-share` for mobile
- ✅ Documented platform abstraction pattern
- ✅ Exported from `@connection/shared/platform`

**Platform Abstractions Created**:

1. **Storage** (`packages/shared/src/platform/storage.*`)
   - Interface: Async storage API
   - Web: localStorage
   - Native: AsyncStorage + SecureStore (encrypted for "secure:" prefix)

2. **Navigation** (`packages/shared/src/platform/navigation.*`)
   - Interface: Navigation API
   - Web: Browser history / wouter
   - Native: expo-router

3. **Sharing** (`packages/shared/src/platform/sharing.*`)
   - Interface: Share API
   - Web: Web Share API with clipboard fallback
   - Native: react-native-share

**Usage Example**:
```typescript
import { storage, navigation, sharing } from '@connection/shared/platform';

// Storage - works on both platforms!
await storage.setItem('user_id', '123');
await storage.setItem('secure:token', 'abc'); // Encrypted on native

// Navigation - unified API
navigation.navigate('/profile/123');
navigation.goBack();

// Sharing - platform-appropriate
await sharing.share({
  url: 'https://example.com',
  title: 'Check this out!',
});
```

**Commit**: `c0e68d1`

---

### Phase 5: Import Path Unification (Complete)
**Goal**: Standardize workspace imports for shared code across web and native apps.

**Achievements**:
- ✅ Client imports now use `@connection/shared/*` instead of legacy `@shared` paths
- ✅ Mobile UI components pull palette tokens from `@connection/shared/mobile-web/colors`
- ✅ Vite, Expo Metro, and TypeScript configs map `@connection/shared`/`@connection/ui` to workspace packages

---

## 🚧 Remaining Tasks

### Phase 3: Component Migration
**Status**: In Progress

**Tasks**:
- [ ] Move remaining web components from `mobile-app/TheConnectionMobile/assets/*.tsx` to `client/src/components/ui/`
- [x] Organize UI package with platform splits
- [x] Create component directory structure in `packages/ui/src/`

**Estimated Time**: 2-3 hours

---

### Missing Features in Mobile

**Critical** (needed for basic parity):
1. [x] **Maps**: Implemented `react-native-maps` with graceful web fallback (`MapScreen`)
2. [x] **File Upload**: Implemented `expo-document-picker` + `expo-image-picker` (`FileUploadPicker`)
3. [x] **Dialog Component**: Created native modal dialog API compatible with web
4. [x] **Form Component**: Created native form handling with `react-hook-form`

**Important** (nice to have):
5. [x] **Badge Component**: Created native status badges (6 uses)
6. [x] **Select Component**: Created native dropdown (3 uses)
7. [x] **Admin Routes**: Ported 3 admin dashboard routes to mobile
8. [x] **Organization Dashboard**: Ported organization management screen

---

## 📊 Metrics

### Dependency Cleanup

| Package | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Mobile web deps** | 3 (react-dom, etc.) | 0 | ✅ 100% clean |
| **Root web deps** | 50+ (@radix-ui, etc.) | 0 | ✅ 100% clean |
| **Root package size** | 130 lines | 73 lines | ✅ 44% smaller |

### Component Coverage

| Component | Web | Native | Status |
|-----------|-----|--------|--------|
| Button | ✅ | ✅ | Complete |
| Card | ✅ | ✅ | Complete |
| Avatar | ✅ | ✅ | Complete |
| Input | ✅ | ✅ | Complete |
| Textarea | ✅ | ✅ | Complete |
| Tabs | ✅ | ✅ | Complete |
| Label | ✅ | ✅ | Complete |
| Separator | ✅ | ✅ | Complete |
| Switch | ✅ | ✅ | Complete |
| Toggle | ✅ | ✅ | Complete |
| Skeleton | ✅ | ✅ | Complete |
| Modal | ✅ | ✅ | Complete |
| Dialog | ✅ | ✅ | Complete |
| Form | ✅ | ✅ | Complete |
| Badge | ✅ | ✅ | Complete |
| Select | ✅ | ✅ | Complete |

**Coverage**: 16/16 components (100%)

### Route Coverage

| Route Type | Web | Mobile | Status |
|------------|-----|--------|--------|
| Core routes | 40+ | ~20 | 50% |
| Admin routes | 3 | 3 | Complete |
| Organization | 1 | 1 | Complete |
| Application forms | 2 | 2 | Complete |

---

## 🎯 Next Steps

### Immediate (Do Now)
1. ✅ ~~Phase 1: Structure~~ (Complete)
2. ✅ ~~Phase 4: Dependencies~~ (Complete)
3. ✅ ~~Phase 2: Platform Abstractions~~ (Complete)

### Short-term (This Week)
4. ✅ Phase 5: Update import paths across codebase
5. ✅ Install and configure `react-native-maps` for mobile
6. ✅ Install and configure `expo-document-picker` and `expo-image-picker`
7. ✅ Create Dialog, Form, Badge, and Select native components

### Medium-term (Next 2 Weeks)
8. Phase 3: Component migration and organization (remaining web primitives)
9. ✅ Port admin routes to mobile
10. ✅ Port organization dashboard to mobile
11. Complete all missing routes

---

## 🏗️ Current Architecture

```
/
├── packages/
│   ├── shared/              ✅ Business logic, schemas, services
│   │   ├── package.json     ✅ Proper workspace
│   │   └── src/
│   │       ├── api.ts
│   │       ├── schema.ts
│   │       ├── services/
│   │       ├── theme/
│   │       └── platform/    ✅ NEW - Platform abstractions
│   │           ├── storage.*
│   │           ├── navigation.*
│   │           └── sharing.*
│   │
│   └── ui/                  ✅ Shared UI components
│       ├── package.json     ✅ Component library
│       └── src/
│
├── client/                  ✅ Web app
│   ├── package.json         ✅ Web deps only
│   └── src/
│       ├── App.tsx
│       ├── components/
│       └── pages/
│
├── mobile-app/              ✅ React Native app
│   └── TheConnectionMobile/
│       ├── package.json     ✅ Clean - No web deps
│       ├── app/             (expo-router screens)
│       └── src/
│           └── components/
│
├── server/                  ✅ Server code
│   └── ...
│
└── package.json             ✅ Server + shared deps only
```

---

## 📝 Notes

- Metro bundler automatically resolves `.web.ts` vs `.native.ts` files
- Platform abstractions eliminate need for platform checks in business logic
- Workspace imports (`@connection/*`) provide clean, maintainable code
- All dependencies are properly scoped to their platform

**Last Updated**: 2026-02-22
