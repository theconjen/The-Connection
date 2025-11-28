# Expo SDK Fixes

This document describes automated fixes applied to work around issues in Expo SDK 54.

## Objective-C Protocol Import Order Fix

### Problem

Expo SDK 54 has a warning in `EXAppDelegatesLoader.m` where the Objective-C protocol `EXAppDelegateSubscriberProtocol` is used before the generated Swift header is imported.

**Error Message:**
```
Cannot find protocol definition for 'EXAppDelegateSubscriberProtocol'
```

### Root Cause

The Swift protocol is declared as:
```swift
@objc(EXAppDelegateSubscriberProtocol)
public protocol ExpoAppDelegateSubscriberProtocol: UIApplicationDelegate { ... }
```

The Objective-C file `EXAppDelegatesLoader.m` imports `Expo-Swift.h` conditionally, but the import order is incorrect:
1. First: `#import <EXAppDelegates/EXLegacyAppDelegateWrapper.h>`
2. Then: `#if __has_include ... Expo-Swift.h`
3. Then: `@interface EXLegacyAppDelegateWrapper () <EXAppDelegateSubscriberProtocol>`

The category that adopts the protocol is parsed before the Swift header is available, causing the compiler warning.

### Solution

The automated fix script `scripts/fix-expo-objc-imports.js` reorders the imports so that:
1. **First**: Import the generated Swift header (`Expo-Swift.h`)
2. **Then**: Import the wrapper header
3. **Finally**: Declare the category that uses the protocol

This ensures the protocol is visible to the Objective-C compiler when it's used.

### How It Works

1. **Automatic Execution**: The fix runs automatically after `expo prebuild`:
   - `pnpm run prebuild` - Runs `expo prebuild --clean && pnpm run postbuild`
   - `pnpm run postbuild` - Executes `scripts/fix-expo-objc-imports.js`

2. **Smart Detection**: The script:
   - Checks if the iOS project exists (created by `expo prebuild`)
   - Detects if the fix has already been applied
   - Only modifies the file if needed
   - Provides clear console output about what it's doing

3. **Safe Application**: The fix:
   - Only runs if the target file exists
   - Preserves all existing code
   - Adds a comment marker to prevent duplicate fixes
   - Validates the file structure before making changes

### Usage

**After running `expo prebuild`:**
```bash
# The fix is automatically applied
pnpm run prebuild

# Or run it manually if needed
pnpm run postbuild
```

**During iOS builds:**
```bash
# The fix is automatically applied during the build process
pnpm run build:ios-local
```

### Verification

After running the fix, you should see:
```
🔧 Fixing Expo SDK Objective-C import order...
✅ Successfully fixed import order in EXAppDelegatesLoader.m
   Swift header is now imported before protocol usage
```

The warning should no longer appear during Xcode builds.

### Files Modified

- **Target**: `ios/Pods/EXAppDelegates/ios/EXAppDelegates/EXAppDelegatesLoader.m`
- **Script**: `scripts/fix-expo-objc-imports.js`
- **Configuration**: `package.json` (postbuild script)

### When This Can Be Removed

This fix can be removed when:
1. Expo SDK is updated to a version that fixes this issue
2. The fix is no longer needed (test by removing the postbuild script and rebuilding)

To check if the fix is still needed in a newer Expo SDK version:
1. Comment out the `&& pnpm run postbuild` from the prebuild script
2. Run `pnpm run prebuild`
3. Build the iOS app in Xcode
4. If the warning appears, the fix is still needed

### References

- Expo SDK Version: 54.0.25
- Related Expo Modules: `expo-modules-core`, `expo-dev-client`
- Issue Type: Objective-C/Swift interop import order

---

**Last Updated**: 2025-11-28
**Applies To**: Expo SDK 54.x
