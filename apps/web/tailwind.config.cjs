const { tokens } = require('../../shared/tokens');

module.exports = {
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
