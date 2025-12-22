// Shared color palette approximating web/tailwind variables
// Source: client/src/index.css and tailwind.config.ts
export const Colors = {
  primary: '#0B132B', // hsl(225 60% 11%)
  primaryForeground: '#FFFFFF',
  secondary: '#222D99',
  secondaryForeground: '#FFFFFF',
  accent: '#4A90E2',
  accentForeground: '#FFFFFF',
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  border: '#E5E7EB',
  input: '#E5E7EB',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  card: '#FFFFFF',
  cardForeground: '#111827',
} as const;

export type ColorKeys = keyof typeof Colors;
