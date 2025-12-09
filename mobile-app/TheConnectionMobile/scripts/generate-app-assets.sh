#!/usr/bin/env bash
# Checkpoint: added harmless comment for commit (2025-12-09)
# Generate iOS and Android app icons + splash images from source assets
# Requires macOS `sips` (preinstalled). Run from project root or this script's folder.

set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
ASSETS_DIR="$ROOT_DIR/assets"

ICON_SRC="$ASSETS_DIR/icon.png"
SPLASH_SRC="$ASSETS_DIR/splash-icon.png"

if [ ! -f "$ICON_SRC" ]; then
  echo "Source icon not found: $ICON_SRC"
  exit 1
fi
if [ ! -f "$SPLASH_SRC" ]; then
  echo "Source splash not found: $SPLASH_SRC"
  exit 1
fi

mkdir -p "$ASSETS_DIR/generated/ios/AppIcon.appiconset"
mkdir -p "$ASSETS_DIR/generated/android/mipmap-xxxhdpi"
mkdir -p "$ASSETS_DIR/generated/splash"

echo "Generating iOS app icons..."
# iOS sizes (subset) - filename: size
declare -a IOS_SIZES=(
  "20@1x:20"
  "20@2x:40"
  "20@3x:60"
  "29@1x:29"
  "29@2x:58"
  "29@3x:87"
  "40@1x:40"
  "40@2x:80"
  "40@3x:120"
  "60@2x:120"
  "60@3x:180"
  "1024@1x:1024"
)

for entry in "${IOS_SIZES[@]}"; do
  name=${entry%%:*}
  size=${entry##*:}
  out="$ASSETS_DIR/generated/ios/AppIcon.appiconset/AppIcon-${name}.png"
  sips -Z "$size" "$ICON_SRC" --out "$out" >/dev/null
  echo "  created $out ($size)"
done

echo "Generating Android adaptive foreground (xxxhdpi) and launcher icons..."
sips -Z 192 "$ICON_SRC" --out "$ASSETS_DIR/generated/android/mipmap-xxxhdpi/ic_launcher.png" >/dev/null
echo "  created adaptive/ic_launcher 192"

echo "Generating splash images..."
# Typical splash sizes (width x height) - create large versions
sips -Z 1242 "$SPLASH_SRC" --out "$ASSETS_DIR/generated/splash/splash-1242x2688.png" >/dev/null || true
sips -Z 2732 "$SPLASH_SRC" --out "$ASSETS_DIR/generated/splash/splash-2732.png" >/dev/null || true
echo "  created splash images"

echo "Done. Generated assets are under: $ASSETS_DIR/generated"
echo "To apply to native projects, copy the generated images into the appropriate iOS Asset Catalog and Android mipmap folders, or run 'expo prebuild' and replace the native resources."

exit 0
