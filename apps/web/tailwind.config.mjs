// Avoid importing a TypeScript module directly from the Tailwind config
// because Node may not be able to load .ts files during the build. Try
// to dynamically import a compiled JS version first, then fall back to a
// conservative default so builds in CI or local dev don't break.
let tokens;
try {
  tokens = (await import('../../shared/tokens.js')).tokens;
} catch (e1) {
  try {
    tokens = (await import('../../packages/shared/src/tokens.js')).tokens;
  } catch (e2) {
    // Minimal fallback tokens to keep Tailwind build working
    tokens = { color: {}, radius: { md: '8px', lg: '12px', xl: '16px' }, space: {} };
  }
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ...tokens.color },
      borderRadius: { DEFAULT: tokens.radius.md, lg: tokens.radius.lg, xl: tokens.radius.xl },
      spacing: tokens.space,
    },
  },
  plugins: [],
};
