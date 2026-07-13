/**
 * Tailwind CSS v4 Compatibility Reference Configuration
 * Note: Since this project is powered by Tailwind CSS v4 (@tailwindcss/vite),
 * the design tokens, custom colors, and dark mode class strategy are defined
 * directly in your CSS entrypoint file: client/src/index.css.
 * 
 * This file is kept for IDE configuration and editor autocompletions.
 */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--bg-background) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        border: 'rgb(var(--border-color) / <alpha-value>)',
        primary: 'rgb(var(--brand-primary) / <alpha-value>)',
      },
      textColor: {
        DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        primary: 'rgb(var(--brand-primary) / <alpha-value>)',
      }
    },
  },
};
