// Shared color palette matching web/tailwind variables
// Source: client/src/index.css - The Connection official color palette
export const Colors = {
  // Deep Navy Blue (Primary Identity Color) - hsl(225 60% 11%)
  primary: '#0B132B',
  primaryForeground: '#FFFFFF',

  // Rich Royal Blue (Secondary Color) - hsl(230 63% 37%)
  secondary: '#222D99',
  secondaryForeground: '#FFFFFF',

  // Complementary Blue Accent - hsl(215 75% 55%)
  accent: '#4A90E2',
  accentForeground: '#FFFFFF',

  // Neutral backgrounds and borders
  background: '#F5F8FA', // hsl(220 25% 97%)
  foreground: '#0D1829', // hsl(220 30% 10%)
  muted: '#EAEEF2',      // hsl(220 15% 92%)
  mutedForeground: '#637083', // hsl(220 10% 40%)
  border: '#D1D8DE',     // hsl(220 20% 85%)
  input: '#D1D8DE',

  // Destructive/error state - hsl(0 75% 45%)
  destructive: '#D83636',
  destructiveForeground: '#FFFFFF',

  // Card backgrounds
  card: '#FFFFFF',
  cardForeground: '#0D1829',
} as const;

export type ColorKeys = keyof typeof Colors;
