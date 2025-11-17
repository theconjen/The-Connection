# Platform Abstractions

This directory contains platform-specific implementations that provide a unified API across web and React Native.

## Architecture

Each platform abstraction consists of three files:

- `{name}.ts` - TypeScript interface and exports
- `{name}.web.ts` - Web implementation
- `{name}.native.ts` - React Native implementation

The bundler (Metro for React Native, Vite for web) automatically resolves to the correct platform-specific file based on the `.web.ts` or `.native.ts` extension.

## Available Abstractions

### Storage

Provides unified storage API:
- **Web**: Uses `localStorage`
- **Native**: Uses `AsyncStorage` + `SecureStore` (keys prefixed with `secure:` use encrypted storage)

```typescript
import { storage } from '@connection/shared/platform';

// Basic usage
await storage.setItem('user_id', '123');
const userId = await storage.getItem('user_id');

// Secure storage (native only - uses encrypted SecureStore)
await storage.setItem('secure:auth_token', 'abc123');
const token = await storage.getItem('secure:auth_token');
```

### Navigation

Provides unified navigation API:
- **Web**: Uses `wouter` / browser history
- **Native**: Uses `expo-router`

```typescript
import { navigation } from '@connection/shared/platform';

// Navigate to a route
navigation.navigate('/profile/123');

// Go back
navigation.goBack();

// Replace current route
navigation.replace('/home');

// Get current path
const path = navigation.getCurrentPath();
```

### Sharing

Provides unified sharing API:
- **Web**: Uses Web Share API with clipboard fallback
- **Native**: Uses `react-native-share` native share sheet

```typescript
import { sharing } from '@connection/shared/platform';

// Share content
const result = await sharing.share({
  url: 'https://example.com',
  title: 'Check this out!',
  message: 'This is an amazing app',
});

if (result.success) {
  console.log('Shared successfully!');
}

// Check if sharing is available
if (sharing.isAvailable()) {
  // Show share button
}
```

## Usage in Components

Platform abstractions can be used in any component that's shared between web and native:

```typescript
// In a shared component
import { storage, navigation, sharing } from '@connection/shared/platform';

export function UserProfile() {
  const handleShare = async () => {
    await sharing.share({
      url: window.location.href,
      title: 'Check out my profile!',
    });
  };

  const handleLogout = async () => {
    await storage.removeItem('secure:auth_token');
    navigation.navigate('/auth');
  };

  // Component implementation...
}
```

## Adding New Abstractions

To add a new platform abstraction:

1. Create the interface file (`{name}.ts`)
2. Create web implementation (`{name}.web.ts`)
3. Create native implementation (`{name}.native.ts`)
4. Export from `index.ts`
5. Update this README

Example:

```typescript
// camera.ts
export interface Camera {
  takePicture(): Promise<string>;
}
export { camera } from './camera.native';

// camera.web.ts
export const camera = { /* web implementation */ };

// camera.native.ts
export const camera = { /* native implementation */ };
```
