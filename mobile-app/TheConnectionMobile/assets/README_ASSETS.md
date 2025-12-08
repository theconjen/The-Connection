This folder contains app assets for the mobile app.

Generated assets (icons, splash) are placed under `assets/generated` by
the script `scripts/generate-app-assets.sh`.

How to regenerate (macOS):

```bash
cd mobile-app/TheConnectionMobile
./scripts/generate-app-assets.sh
```

Notes:
- The script uses `sips` (macOS built-in) to create a minimal set of
  iOS AppIcon sizes and an Android xxxhdpi launcher icon. For full
  production sets you should create or export images from your design
  tool (Figma/Sketch/Illustrator) and populate the native asset
  catalogs or let `expo prebuild` generate them and then replace the
  produced native resources.
