import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/blocks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand palette — liturgical burgundy/maroon
        burgundy: {
          50:  '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d7',
          300: '#f4aab6',
          400: '#ec7a90',
          500: '#e04d6a',
          600: '#cc2d50',
          700: '#ab2141',
          800: '#8f1e3a',
          900: '#7b1d37',
          950: '#440a1b',
        },
        // Eparchy primary — deep maroon
        maroon: {
          50:  '#fdf2f2',
          100: '#fde3e3',
          200: '#fbcccc',
          300: '#f7a8a8',
          400: '#f07676',
          500: '#e44c4c',
          600: '#d12e2e',
          700: '#af2323',
          800: '#911e1e', // main brand color
          900: '#791e1e',
          950: '#420b0b',
        },
        // Gold accents
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Ivory / parchment backgrounds
        parchment: {
          50:  '#fefdf9',
          100: '#fdf9ee',
          200: '#fbf4dd',
          300: '#f7e9bb',
          400: '#f2d88e',
          500: '#ecc45e',
          600: '#e0a932',
          DEFAULT: '#fdf9ee', // primary background
        },
        // Charcoal for text
        charcoal: {
          50:  '#f6f6f6',
          100: '#e7e7e7',
          200: '#cfcfcf',
          300: '#b3b3b3',
          400: '#8c8c8c',
          500: '#6d6d6d',
          600: '#585858',
          700: '#3f3f3f',
          800: '#2d2d2d', // primary body text
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
      },
      fontFamily: {
        // System serif for headlines — deeply readable, liturgical feel
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        // Sans for body and UI
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Geez script — when web font is loaded
        geez: ['var(--font-geez)', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        // Subtle cross/liturgical texture overlay
        'liturgical-pattern': "url('/images/pattern-subtle.png')",
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)',
        'nav': '0 1px 3px 0 rgb(0 0 0 / 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        eparchy: {
          css: {
            '--tw-prose-body': theme('colors.charcoal.800'),
            '--tw-prose-headings': theme('colors.maroon.900'),
            '--tw-prose-links': theme('colors.maroon.800'),
            '--tw-prose-bold': theme('colors.charcoal.900'),
            '--tw-prose-quotes': theme('colors.maroon.700'),
            '--tw-prose-quote-borders': theme('colors.gold.400'),
            '--tw-prose-hr': theme('colors.charcoal.200'),
            maxWidth: 'none',
            h1: {
              fontFamily: theme('fontFamily.serif'),
              fontWeight: '700',
            },
            h2: {
              fontFamily: theme('fontFamily.serif'),
              fontWeight: '600',
            },
            a: {
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
          },
        },
      }),
    },
  },
  plugins: [forms, typography],
}

export default config
