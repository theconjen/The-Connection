import path from "path";
import { fileURLToPath } from "url";
import type { Config } from "tailwindcss";

// Use absolute paths for content so Tailwind can reliably find files
// regardless of the working directory (Render/production was missing styles
// because relative globs weren't being resolved).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentPaths = [
  path.join(__dirname, "client", "index.html"),
  path.join(__dirname, "client", "src", "**/*.{js,jsx,ts,tsx}"),
  path.join(__dirname, "packages", "ui", "src", "**/*.{js,jsx,ts,tsx}"),
  path.join(__dirname, "packages", "shared", "src", "**/*.{js,jsx,ts,tsx}"),
];

export default {
  darkMode: ["class"],
  content: contentPaths,
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Global design system
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Earth-forward color palette
        sage: {
          DEFAULT: "#5C6B5E",
          light: "#7C8F78",
          dark: "#4A574C",
        },
        terracotta: {
          DEFAULT: "#B56A55",
          light: "#C98570",
          dark: "#9A5543",
        },
        gold: {
          DEFAULT: "#C7A45B",
          light: "#D4B87A",
          dark: "#A88A47",
        },
        warmPaper: "#F3EFE9",

        // Legacy TC colors (keeping for backwards compatibility)
        neutralGray: "#8E8E93",
        deepCharcoal: "#1C1C1E",
        softWhite: "#F2F2F7",
        tcPink: "#F649A8",
        tcPurple: "#7B41F7",
        tcGradientStart: "#F649A8",
        tcGradientEnd: "#7B41F7",
        tcGradientMid: "#D645D0",
        
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
