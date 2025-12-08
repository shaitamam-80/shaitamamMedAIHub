/**
 * MedAI Hub Design System - Design Tokens
 * ========================================
 * Single Source of Truth for all design values.
 *
 * Usage:
 * - Import in TypeScript/React for programmatic access
 * - CSS variables are generated from these values in globals.css
 * - Use semantic names (primary, accent) not raw colors (blue-600)
 */

export const tokens = {
  /**
   * Color Palette
   * Based on "Clinical Modern" aesthetic:
   * - Primary: Medical Blue (trust, professionalism)
   * - Accent: Violet (AI, innovation) - for high-priority actions
   * - Neutral: Slate scale (clean, readable)
   */
  colors: {
    primary: {
      DEFAULT: '#2563eb', // Blue-600
      foreground: '#ffffff',
      // HSL for CSS variables: 221.2 83.2% 53.3%
    },
    accent: {
      DEFAULT: '#7c3aed', // Violet-600
      foreground: '#ffffff',
      // HSL: 263 70% 58%
    },
    secondary: {
      DEFAULT: '#14b8a6', // Teal-500
      foreground: '#ffffff',
    },
    background: {
      light: '#ffffff',
      dark: '#020817', // Slate-950
    },
    foreground: {
      light: '#020817', // Slate-950
      dark: '#f8fafc',  // Slate-50
    },
    muted: {
      light: '#f1f5f9', // Slate-100
      dark: '#1e293b',  // Slate-800
    },
    border: {
      light: '#e2e8f0', // Slate-200
      dark: '#334155',  // Slate-700
    },
    /**
     * Status Colors
     * Used for screening decisions, validation states, etc.
     */
    status: {
      success: '#10b981', // Emerald-500 - Include/Valid
      warning: '#f59e0b', // Amber-500 - Maybe/Caution
      error: '#ef4444',   // Red-500 - Exclude/Error
      info: '#3b82f6',    // Blue-500 - Information
    },
    /**
     * Screening Decision Colors
     * Semantic names for the Review tool
     */
    screening: {
      include: '#10b981',  // Emerald-500
      exclude: '#ef4444',  // Red-500
      maybe: '#f59e0b',    // Amber-500
      pending: '#94a3b8',  // Slate-400
    },
  },

  /**
   * Border Radius Profiles
   * Three semantic sizes for different use cases
   */
  radius: {
    card: '1rem',       // 16px - Cards, dialogs, containers
    button: '0.5rem',   // 8px - Buttons, inputs, interactive elements
    badge: '0.375rem',  // 6px - Badges, tags, small elements
    full: '9999px',     // Pills, avatars
  },

  /**
   * Typography
   * - Sans (Plus Jakarta): UI elements, labels, buttons
   * - Serif (Source Serif): Article content, abstracts, long-form text
   * - Mono (JetBrains Mono): Code, queries, technical content
   */
  typography: {
    fontFamily: {
      sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      serif: ['var(--font-source-serif)', 'Georgia', 'serif'],
      mono: ['var(--font-jetbrains-mono)', 'Consolas', 'monospace'],
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    /**
     * Font size scale
     * Based on a 1.25 ratio (Major Third)
     */
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
  },

  /**
   * Spacing Scale
   * Standard Tailwind scale, documented for reference
   */
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    2: '0.5rem',      // 8px
    3: '0.75rem',     // 12px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    8: '2rem',        // 32px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
  },

  /**
   * Shadows
   * Elevation system for depth hierarchy
   */
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  /**
   * Transitions
   * Consistent animation timing
   */
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  /**
   * Z-Index Scale
   * Layering system for overlays
   */
  zIndex: {
    dropdown: 50,
    sticky: 100,
    modal: 200,
    popover: 300,
    tooltip: 400,
  },

  /**
   * Breakpoints
   * Mobile-first responsive design
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },
} as const;

/**
 * Type exports for TypeScript usage
 */
export type TokenColors = typeof tokens.colors;
export type TokenRadius = typeof tokens.radius;
export type TokenTypography = typeof tokens.typography;

/**
 * Helper: Get status color by name
 */
export function getStatusColor(status: keyof typeof tokens.colors.status): string {
  return tokens.colors.status[status];
}

/**
 * Helper: Get screening color by decision
 */
export function getScreeningColor(decision: keyof typeof tokens.colors.screening): string {
  return tokens.colors.screening[decision];
}
