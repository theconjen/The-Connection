# Platform Abstractions

This directory contains platform-agnostic abstractions that provide unified APIs across web and React Native platforms.

## Available Abstractions

### Storage
Unified key-value storage interface.

**Web**: Uses `localStorage`
**Native**: Uses `@react-native-async-storage/async-storage`

```typescript
import storage from '@shared/platform/storage';

// All methods are async for consistency
await storage.setItem('key', 'value');
const value = await storage.getItem('key');
await storage.removeItem('key');
await storage.clear();
```

### Navigation
Unified navigation interface.

**Web**: Uses `wouter`
**Native**: Uses `expo-router`

```typescript
import { useLocation, useNavigate, navigate } from '@shared/platform/navigation';

// Hook-based navigation
function MyComponent() {
  const [location, setLocation] = useLocation();
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/profile')}>
      Go to Profile
    </button>
  );
}

// Imperative navigation
import { navigate } from '@shared/platform/navigation';
navigate('/home');
```

### Sharing
Unified sharing interface.

**Web**: Uses Web Share API
**Native**: Uses `react-native-share`

```typescript
import sharing from '@shared/platform/sharing';

// Check if sharing is supported
if (sharing.canShare()) {
  await sharing.share({
    title: 'Check this out!',
    text: 'Amazing content',
    url: 'https://example.com',
  });
}
```

## How It Works

Each abstraction has three files:
- `<name>.ts` - Default export (points to `.native`)
- `<name>.web.ts` - Web implementation
- `<name>.native.ts` - React Native implementation

Metro bundler (React Native) and Vite (Web) automatically resolve the correct platform version based on file extensions.

## Adding New Abstractions

1. Create `<name>.ts`, `<name>.web.ts`, `<name>.native.ts`
2. Define a common interface in both `.web` and `.native` files
3. Export from the main `.ts` file
4. Document usage in this README

## Type Safety

All abstractions export TypeScript interfaces to ensure type safety across platforms. Import the types when needed:

```typescript
import type { StorageAdapter } from '@shared/platform/storage';
import type { ShareOptions } from '@shared/platform/sharing';
```
