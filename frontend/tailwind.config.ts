import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'elegant-gradient': 'linear-gradient(to right, #D4B896, #C4A47C, #B08D5B)',
        'gradient-luxury': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
        'gradient-premium': 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Sophisticated warm palette extracted from the image
        cream: {
          50: '#FDFCFA',
          100: '#FAF7F2',
          200: '#F5F0E8',
          300: '#EFE8DD',
          400: '#E8DDD0',
          500: '#DDCBB1',
          600: '#D4B896',
          700: '#C4A47C',
          800: '#B08D5B',
          900: '#8B7355',
        },
        warm: {
          50: '#FDF9F6',
          100: '#F9F2ED',
          200: '#F2E8DD',
          300: '#EADDD0',
          400: '#DFD0C0',
          500: '#D4B896',
          600: '#C4A47C',
          700: '#B08D5B',
          800: '#9F8C78',
          900: '#6B5B49',
        },
        camel: {
          50: '#FDF8F4',
          100: '#F8F0E8',
          200: '#F0E2D1',
          300: '#E8D4BA',
          400: '#DFC6A3',
          500: '#D4B896',
          600: '#C4A47C',
          700: '#B08D5B',
          800: '#9C7A4A',
          900: '#7A5F3A',
        }
      },
      boxShadow: {
        'elegant': '0 4px 20px -4px hsl(var(--primary) / 0.1)',
        'luxury': '0 10px 40px -10px hsl(var(--primary) / 0.15)',
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'luxury-glow': 'luxury-glow 2s ease-in-out infinite alternate',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in': 'slide-in 0.8s ease-out',
        'gradient-shift': 'gradient-shift 3s ease infinite'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'luxury-glow': {
          '0%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
          '100%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.6)' }
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        }
      },
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;