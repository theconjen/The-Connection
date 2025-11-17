// Avoid importing a TypeScript module directly from the Tailwind config
// because Tailwind's loader (via jiti) may not support top-level await.
// Use synchronous require() fallbacks so the config can be loaded reliably.
let tokens;
try {
  // Try compiled JS in shared
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  tokens = require('../../shared/tokens.js').tokens;
} catch (e1) {
  try {
    // Try the workspace packages path
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    tokens = require('../../packages/shared/src/tokens.js').tokens;
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
