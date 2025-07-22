/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/src/**/*.{js,jsx,ts,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        primary:      '#E73AA4',
        secondary:    '#6B46C1',
        accent:       '#C855DD',
        background:   '#F8F9FB',
        foreground:   '#1A1D29',
        card:         '#FFFFFF',
        'muted-bg':   '#EDEDF0',
        'muted-fg':   '#64748B',
        border:       '#D1D5DB',
        ring:         '#E73AA4',
        destructive:  '#DC2626'
      }
    }
  },
  plugins: []
};
