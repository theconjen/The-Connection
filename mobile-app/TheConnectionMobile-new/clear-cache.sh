#!/bin/bash
echo "Clearing Metro bundler cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
watchman watch-del-all 2>/dev/null || echo "Watchman not installed (optional)"
echo "Cache cleared!"
echo ""
echo "Now restart the app with:"
echo "  npx expo start --clear"
