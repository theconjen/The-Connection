This folder contains React Native equivalents of selected web components from client/src/components.

Guidelines:
- Only components that do not rely on browser-only APIs (window, document) are ported.
- HTML elements are replaced with RN primitives (View, Text, Image, Pressable, TextInput, ScrollView).
- Tailwind/className styles are approximated using StyleSheet.create and theme tokens in `src/theme`.
- Image tags are mapped to Image with static require() packed under assets/web.
- Props and component names are kept aligned where reasonable.

Available primitives include map rendering (`MapScreen`), upload helpers (`FileUploadPicker`), dialog/form scaffolding, and utility UI like `Badge` and `Select` that mirror the contracts used on the web counterparts.
