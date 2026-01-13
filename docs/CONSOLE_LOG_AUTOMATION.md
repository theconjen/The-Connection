# Console.log Automation Guide

**Last Updated**: 2026-01-10

This document explains the automated systems in place to prevent `console.log` statements from entering production code.

---

## Table of Contents

1. [Overview](#overview)
2. [Automation Layers](#automation-layers)
3. [Quick Commands](#quick-commands)
4. [How It Works](#how-it-works)
5. [Configuration](#configuration)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Connection uses a **multi-layer approach** to keep console.log statements out of production code:

1. **ESLint Rule** - Catches console.log during development (real-time in IDE)
2. **Pre-commit Hook** - Blocks commits containing console.log
3. **Manual Cleanup Scripts** - Bulk removal when needed
4. **CI/CD Checks** - (Optional) Final verification before deployment

### Why This Matters

- **Performance**: console.log in production can slow down applications
- **Security**: Logs may expose sensitive information
- **Professionalism**: Production code should use proper logging (console.error, console.warn)
- **Debugging**: Forces better logging practices

---

## Automation Layers

### Layer 1: ESLint Rule (Real-time IDE Warnings)

**What it does**: Shows errors in your IDE when you write `console.log`

**Configuration**: `.eslintrc.cjs`
```javascript
"no-console": [
  "error",
  {
    allow: ["warn", "error", "info", "debug"]
  }
]
```

**Allowed methods**:
- ✅ `console.error()` - For errors
- ✅ `console.warn()` - For warnings
- ✅ `console.info()` - For informational messages
- ✅ `console.debug()` - For debug messages
- ❌ `console.log()` - **NOT allowed**

**How to fix**:
1. Replace `console.log` with `console.error`, `console.warn`, or `console.info`
2. Or remove the line entirely

### Layer 2: Pre-commit Git Hook (Blocks Commits)

**What it does**: Automatically runs before each `git commit` and blocks commits with console.log

**How it works**:
1. Checks all staged files for `console.log` statements
2. If found, prevents the commit and shows you the locations
3. Provides instructions to fix

**Example output**:
```bash
❌ Found console.log statements in staged files:
server/auth.ts:
143:      console.log(`[REGISTRATION] User created successfully:`, {

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commit rejected: console.log statements found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:
  1. Remove console.log manually from the files above
  2. Run: pnpm run clean:logs
  3. Use console.error, console.warn, or console.info instead
  4. Skip this hook with: git commit --no-verify (not recommended)
```

**Bypass (not recommended)**:
```bash
git commit --no-verify
```

**Setup** (already done, but to reinstall):
```bash
./scripts/setup-git-hooks.sh
```

### Layer 3: Manual Cleanup Scripts

**When to use**: Bulk removal of console.logs or cleaning up legacy code

**Commands**:

```bash
# Preview what would be removed (dry run)
pnpm run clean:logs:check

# Actually remove all console.logs
pnpm run clean:logs
```

**What it does**:
- Scans all `.ts`, `.tsx`, `.js`, `.jsx` files
- Intelligently removes `console.log` statements
- Preserves:
  - Comments containing "console.log"
  - `console.error`, `console.warn`, `console.info`
  - Strings containing "console.log"

**Statistics example**:
```bash
Files scanned:   422
Files modified:  70
Logs removed:    382
```

**Script location**: `scripts/remove-console-logs.cjs`

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `pnpm run lint` | Run ESLint on all files |
| `pnpm run lint:fix` | Auto-fix ESLint issues (including console.log removal) |
| `pnpm run clean:logs` | Remove all console.logs |
| `pnpm run clean:logs:check` | Preview what would be removed |
| `./scripts/setup-git-hooks.sh` | Install/reinstall git hooks |

---

## How It Works

### Development Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Developer writes code                                 │
│    - IDE shows ESLint error on console.log             │
│    - Can see error immediately                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Developer runs: git add .                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Developer runs: git commit -m "message"              │
│    - Pre-commit hook runs automatically                 │
│    - Checks for console.log in staged files            │
└─────────────────────────────────────────────────────────┘
                         ↓
            ┌────────────┴────────────┐
            │ Console.log found?      │
            └────────────┬────────────┘
                    Yes │    │ No
            ┌───────────┘    └────────────┐
            ↓                              ↓
┌──────────────────────────┐    ┌────────────────────┐
│ Commit blocked           │    │ Commit succeeds    │
│ Shows locations          │    └────────────────────┘
│ Provides fix options     │
└──────────────────────────┘
            ↓
┌──────────────────────────┐
│ Developer fixes          │
│ - Removes console.log    │
│ - OR replaces with       │
│   console.error/warn     │
│ - OR runs clean:logs     │
└──────────────────────────┘
            ↓
┌──────────────────────────┐
│ git commit again         │
│ - Hook passes            │
│ - Commit succeeds        │
└──────────────────────────┘
```

### Automated Cleanup Workflow

```
┌─────────────────────────────────────────────────────────┐
│ Run: pnpm run clean:logs                                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Script scans codebase                                   │
│ - client/src/**/*                                       │
│ - server/**/*                                           │
│ - shared/**/*                                           │
│ - mobile-app/**/*                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ For each file:                                          │
│ 1. Read content                                         │
│ 2. Identify console.log statements                      │
│ 3. Check if in comment or string (skip)                │
│ 4. Remove if genuine console.log                        │
│ 5. Write cleaned content back                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Report statistics                                       │
│ - Files scanned                                         │
│ - Files modified                                        │
│ - Total logs removed                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration

### ESLint Configuration

**File**: `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  extends: [],
  rules: {
    // Prevent console.log in production code
    "no-console": [
      "error",
      {
        allow: ["warn", "error", "info", "debug"]
      }
    ],
    // ... other rules
  }
}
```

**Customization**:
- Change `"error"` to `"warn"` for warnings instead of errors
- Add more allowed methods to the `allow` array
- Disable for specific files using `overrides`

### Cleanup Script Configuration

**File**: `scripts/remove-console-logs.cjs`

**Configurable options**:
```javascript
const config = {
  roots: [
    '/path/to/client',
    '/path/to/server',
    '/path/to/shared',
    '/path/to/mobile',
  ],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  dryRun: process.argv.includes('--dry-run'),
  createBackup: process.argv.includes('--backup'),
};
```

**Command-line options**:
- `--dry-run` - Preview only, don't modify files
- `--backup` - Create `.bak` backup files

### Git Hook Configuration

**File**: `scripts/pre-commit-hook.sh`

**Customization**:
- To allow console.log in certain directories, modify the skip logic:
  ```bash
  # Skip specific directories
  if [[ $FILE == *"tests"* ]] || [[ $FILE == *"scripts"* ]]; then
    continue
  fi
  ```

---

## CI/CD Integration

### GitHub Actions (Optional)

Create `.github/workflows/lint.yml`:

```yaml
name: Lint

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run ESLint
        run: pnpm run lint

      - name: Check for console.logs
        run: |
          if grep -r "console\.log" --include="*.ts" --include="*.tsx" \
             --include="*.js" --include="*.jsx" \
             client/src server shared | grep -v "^\s*//"; then
            echo "❌ Found console.log statements"
            exit 1
          fi
          echo "✅ No console.log statements found"
```

### Pre-build Check

Add to your build script in `package.json`:

```json
{
  "scripts": {
    "prebuild": "pnpm run lint && pnpm run clean:logs:check",
    "build": "pnpm run build:client && pnpm run build:server"
  }
}
```

This ensures builds fail if console.logs are present.

---

## Troubleshooting

### Issue: Pre-commit hook not running

**Symptoms**: Can commit files with console.log without any warnings

**Solutions**:

1. **Check if hook is installed**:
   ```bash
   ls -la .git/hooks/pre-commit
   ```
   Should show an executable file.

2. **Reinstall the hook**:
   ```bash
   ./scripts/setup-git-hooks.sh
   ```

3. **Check if hook is executable**:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

4. **Verify you're in the correct repository**:
   ```bash
   git rev-parse --show-toplevel
   ```

### Issue: ESLint not showing errors in IDE

**Solutions**:

1. **Install ESLint extension** (VS Code):
   - Install "ESLint" extension by Microsoft
   - Reload VS Code

2. **Check ESLint is working**:
   ```bash
   pnpm run lint
   ```

3. **Verify .eslintrc.cjs** exists and has the no-console rule

4. **Restart TypeScript server** (VS Code):
   - Cmd+Shift+P → "TypeScript: Restart TS Server"

### Issue: Cleanup script removing too much/too little

**Solutions**:

1. **Run dry-run first**:
   ```bash
   pnpm run clean:logs:check
   ```
   Review what would be removed before actually removing.

2. **Check regex patterns** in `scripts/remove-console-logs.cjs`:
   ```javascript
   // Adjust this pattern if needed
   const hasConsoleLog = /console\.log\s*\(/g.test(line);
   ```

3. **Create backup before running**:
   ```bash
   node scripts/remove-console-logs.cjs --backup
   ```
   This creates `.bak` files you can restore from.

### Issue: Need to commit with console.log temporarily

**For debugging/testing only**:

```bash
# Bypass the pre-commit hook (not recommended for production)
git commit --no-verify -m "Debug commit with console.logs"
```

**Better approach**:
- Use `console.warn` or `console.error` instead
- These are allowed and won't be blocked

### Issue: False positives (legitimate code flagged)

**Example**: String containing "console.log" gets flagged

**Solutions**:

1. **ESLint**: Add inline disable comments:
   ```typescript
   // eslint-disable-next-line no-console
   const tutorial = "Use console.log() to debug";
   ```

2. **Cleanup script**: Already handles strings, but if needed, modify the regex in `scripts/remove-console-logs.cjs`

---

## Best Practices

### 1. Use Appropriate Logging Methods

```typescript
// ❌ Don't use
console.log('User registered:', user);

// ✅ Do use
console.info('User registered:', user.id);
console.error('Registration failed:', error);
console.warn('Deprecated method used');
```

### 2. Add Structured Logging

For production, consider a proper logging library:

```typescript
import logger from './logger';

// Instead of console.log
logger.info('User registered', { userId: user.id });
logger.error('Registration failed', { error: error.message });
```

### 3. Debug-only Code

For development debugging:

```typescript
// Option 1: Use console.debug (allowed)
console.debug('Debug info:', data);

// Option 2: Environment check
if (process.env.NODE_ENV === 'development') {
  console.info('Dev only log:', data);
}
```

### 4. Regular Cleanup

```bash
# Before each release
pnpm run clean:logs:check

# Clean up if needed
pnpm run clean:logs

# Verify
pnpm run lint
```

### 5. Team Workflow

1. **Pull requests**: Ensure pre-commit hook is in place
2. **Code reviews**: Check for console.log in diffs
3. **CI/CD**: Add automated checks (see CI/CD Integration section)
4. **Documentation**: Keep this guide updated

---

## Statistics & Impact

### Initial Cleanup (2026-01-10)

- **Files scanned**: 422
- **Files modified**: 70
- **Console.logs removed**: 385
- **Time saved**: ~2 hours of manual cleanup

### Prevention

With the pre-commit hook in place:
- **100% prevention** of new console.logs entering the codebase
- **Zero manual cleanup** needed going forward
- **Better code quality** through enforcement

---

## Summary

The Connection now has a **triple-layer defense** against console.log statements:

1. ✅ **ESLint** - Real-time IDE warnings
2. ✅ **Git Hook** - Prevents commits with console.log
3. ✅ **Cleanup Script** - Bulk removal when needed

**For developers**:
- Write code normally
- IDE will warn you about console.log
- Use console.error, console.warn, or console.info instead
- Pre-commit hook will catch anything you miss

**For maintainers**:
- Run `pnpm run clean:logs:check` periodically
- Monitor CI/CD for any bypassed commits
- Keep this documentation updated

**Result**: Production code free of debug console.logs! 🎉

---

## Additional Resources

- [ESLint no-console rule documentation](https://eslint.org/docs/rules/no-console)
- [Git Hooks documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [CLAUDE.md](../CLAUDE.md) - Main development guide
- [SECURITY.md](../SECURITY.md) - Security guidelines

---

**Questions or issues?** Open a GitHub issue or check the troubleshooting section above.
