'use strict'

import mixCssColor from 'mix-css-color'

/** @type {import('tailwindcss').Config} */

const colors = {
  neptuneBlue: '#4a7dff',
  neptuneBlueDark: '#2057e3',
  neptuneBlueLight: '#94b2ff',
  cassioPeiaPink: '#ed158a',
  cassioPeiaPinkDark: '#be106e',
  cassioPeiaPinkLight: '#fc6cba'
}

module.exports = {
  content: [
    './renderer/src/**/*.{html,js,jsx,tsx}'
  ],
  theme: {
    fontSize: {
      'title-3xs': ['1.25rem', '1.5rem'],
      'title-2xs': ['1.5rem', '1.75rem'],
      'title-xs': ['1.75rem', '2.25rem'],
      'title-s': ['2.25rem', '2.75rem'],
      'title-m': ['2.75rem', '3.25rem'],
      'title-l': ['3.25rem', '4.25rem'],
      'body-3xs': ['0.625rem', '0.875rem'],
      'body-2xs': ['0.75rem', '1rem'],
      'body-xs': ['0.875rem', '1.25rem'],
      'body-s': ['1rem', '1.25rem'],
      'body-m': ['1.25rem', '1.75rem'],
      'body-l': ['2.25rem', '3.25rem'],
      'mono-3xs': ['0.75rem', '1rem'],
      'mono-2xs': ['0.875rem', '1.25rem'],
      'mono-xs': ['1rem', '1.25rem'],
      'mono-s': ['1.25rem', '1.75rem'],
      'mono-m': ['1.5rem', '2.25rem'],
      'mono-l': ['1.75rem', '2.25rem'],
      'mono-xl': ['2.25rem', '3.25rem'],
      'mono-2xl': ['2.75rem', '3.25rem']
    },
    fontFamily: {
      title: ['SuisseIntl', 'sans-serif'],
      body: ['SpaceGrotesk', 'serif'],
      mono: ['SpaceMono', 'monospace']
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700
    },
    boxShadow: {
      switchButton: '0px 1px 3px 0px #1018281A, 0px 1px 2px -1px #1018281A'
    },
    keyframes: {
      fadeIn: {
        from: {
          opacity: 0
        },
        to: {
          opacity: 1
        }
      },
      fadeOut: {
        from: {
          opacity: 1
        },
        to: {
          opacity: 0
        }
      },
      spin: {
        from: {
          transform: 'rotate(0deg);'
        },
        to: {
          transform: 'rotate(360deg);'
        }
      },
      addressFormMoveUp: {
        from: {
          top: '70%'
        },
        to: {
          top: '30%'
        }
      },
      fradeFromBlue: {
        from: {
          background: '#E9EFFF',
          color: colors.neptuneBlue
        },
        to: {
          background: 'transparent',
          color: '#000'
        }
      },
      moveGridBlur: {
        from: {
          top: '70%'
        },
        '50%': {
          top: '10%',
          scale: 1
        },
        '100%': {
          top: '10%',
          scale: 0
        }
      }
    },
    animation: {
      fadeIn: 'fadeIn 200ms ease forwards',
      fadeOut: 'fadeOut 200ms ease forwards',
      spin: 'spin 1s linear infinite',
      moveGridBlur: `moveGridBlur 3s 1s cubic-bezier(0.33, 1, 0.68, 1) 
      infinite`,
      addressFormMoveUp: `addressFormMoveUp calc(0.7s * var(--factor)) 
      calc(0.1s * var(--factor))
      cubic-bezier(0.87, 0, 0.13, 1) forwards`,
      fradeFromBlue: 'fradeFromBlue 6s cubic-bezier(0.64, 0, 0.78, 0)'
    },
    colors: {
      white: '#fff',
      black: '#000',
      primary: colors.neptuneBlue,
      'primary-hover': colors.neptuneBlueDark,
      'primary-click':
        mixCssColor(colors.neptuneBlue, colors.neptuneBlueDark).hex,
      blue: {
        50: colors.neptuneBlueLight,
        300: mixCssColor(colors.neptuneBlue, colors.neptuneBlueLight).hex,
        700: colors.neptuneBlue
      },
      grayscale: {
        100: '#f0f0f0',
        200: '#f7f7f7',
        250: '#e9ebf1',
        300: '#ebeaea',
        400: '#c3cad9',
        500: '#b3b3b3',
        600: '#666666',
        700: '#313131'
      },
      slate: {
        50: '#F1F1F5',
        100: '#EAEAEF',
        200: '#D9D9E4',
        400: '#A0A1BA',
        800: '#5F5A73'
      },
      red: {
        100: colors.cassioPeiaPinkLight,
        200: colors.cassioPeiaPink,
        400: colors.cassioPeiaPinkDark
      },
      transparent: '#ffffff00'
    }
  },
  plugins: [],
  safelist: [
    {
      pattern: /text-(title|body|mono)-(3xs|2xs|xs|s|m|l|xl|2xl)/
    },
    {
      pattern: /text-(black|secondary|primary|white)/
    },
    {
      pattern: /font-(title|body|mono)/
    }
  ]
}
