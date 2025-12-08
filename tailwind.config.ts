import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        theme: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
            tertiary: 'var(--bg-tertiary)',
            card: 'var(--bg-card)',
            'card-hover': 'var(--bg-card-hover)',
            input: 'var(--bg-input)',
            header: 'var(--bg-header)',
            footer: 'var(--bg-footer)',
          },
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            tertiary: 'var(--text-tertiary)',
            muted: 'var(--text-muted)',
            inverted: 'var(--text-inverted)',
          },
          border: {
            primary: 'var(--border-primary)',
            secondary: 'var(--border-secondary)',
            hover: 'var(--border-hover)',
          },
          accent: {
            primary: 'var(--accent-primary)',
            'primary-hover': 'var(--accent-primary-hover)',
            'primary-light': 'var(--accent-primary-light)',
            'primary-bg': 'var(--accent-primary-bg)',
          },
        },
        // Primary color: Copper/Bronze (#C27B43)
        primary: {
          50: '#fef6f0',
          100: '#fdecd9',
          200: '#fbd5b3',
          300: '#f7b887',
          400: '#f39b5b',
          500: '#8e542e',  // Main copper color
          600: '#a86638',
          700: '#8e542e',
          800: '#744424',
          900: '#5a341b',
        },
        // Legacy WooCommerce dark theme colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#94a3b8',
          400: '#404055',  // Borders
          500: '#323244',  // Hover state, lighter cards
          600: '#2a2a3e',  // Cards, sections
          700: '#1e293b',
          800: '#1a1a2e',  // Header, primary dark
          900: '#0f0f1e',  // Footer, darkest
          950: '#1a1d24',
        },
        // Light mode background colors
        light: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f5f5f5',
          300: '#e5e5e5',
          400: '#d4d4d4',
          500: '#a3a3a3',
          600: '#737373',
          700: '#525252',
          800: '#404040',
          900: '#262626',
          950: '#171717',
        },
        // Copper/Bronze accent colors (legacy WooCommerce highlight color)
        copper: {
          300: '#e0a06f',  // Very light copper
          400: '#d18b59',  // Lighter copper
          500: '#C27B43',  // Primary copper accent (menu hover, prices, active buttons)
          600: '#a86638',  // Darker copper
          700: '#8e542e',  // Very dark copper
        },
        // Keep gold as alias for backward compatibility
        gold: {
          300: '#e0a06f',
          400: '#d18b59',
          500: '#C27B43',
          600: '#a86638',
          700: '#8e542e',
        },
      },
      fontFamily: {
        sans: ['var(--font-jost)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

export default config
