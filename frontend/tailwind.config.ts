import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

/**
 * MedAI Hub - Tailwind Configuration
 * ==================================
 *
 * Design System: Clinical Modern
 * Token Reference: lib/design-system/tokens.ts
 *
 * Key Decisions:
 * - Semantic color names (primary, accent) over raw colors (blue-600)
 * - Three radius profiles: card (16px), button (8px), badge (6px)
 * - Minimal animations - only essential transitions
 * - Typography: Sans for UI, Serif for medical content
 */

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* === Typography === */
      fontFamily: {
        // Plus Jakarta Sans - Modern, clean UI font
        sans: ["var(--font-plus-jakarta)", ...fontFamily.sans],
        // Source Serif - Academic, trustworthy for medical content
        serif: ["var(--font-source-serif)", ...fontFamily.serif],
        // JetBrains Mono - Code, queries, technical data
        mono: ["var(--font-jetbrains-mono)", ...fontFamily.mono],
      },

      /* === Colors (from CSS variables) === */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      /* === Border Radius (Semantic Profiles) === */
      borderRadius: {
        lg: "var(--radius-card)",    // 16px - Cards, dialogs
        md: "var(--radius-button)",  // 8px - Buttons, inputs
        sm: "var(--radius-badge)",   // 6px - Badges, tags
      },

      /* === Spacing (Additional values) === */
      spacing: {
        "sidebar": "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
      },

      /* === Animations (Essential only) === */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
