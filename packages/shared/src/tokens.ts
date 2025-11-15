// Shared design tokens matching The Connection color palette
// Synced with client/src/index.css
export const tokens = {
  color: {
    // Light mode colors (default)
    bg: '#F5F8FA',       // hsl(220 25% 97%) - Soft White Background
    card: '#FFFFFF',     // White cards
    text: '#0D1829',     // hsl(220 30% 10%) - Deep text
    muted: '#637083',    // hsl(220 10% 40%) - Muted text
    primary: '#0B132B',  // hsl(225 60% 11%) - Deep Navy Blue
    secondary: '#222D99', // hsl(230 63% 37%) - Rich Royal Blue
    accent: '#4A90E2',   // hsl(215 75% 55%) - Blue Accent
    success: '#22C55E',  // Green for success states
    danger: '#D83636',   // hsl(0 75% 45%) - Red for errors/destructive
    border: '#D1D8DE',   // hsl(220 20% 85%) - Border color
  },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 },
};
