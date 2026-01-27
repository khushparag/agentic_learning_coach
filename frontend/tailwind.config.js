/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Mobile-specific breakpoints
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' },
        // Orientation breakpoints
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
        // Touch device detection
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        // High DPI displays
        'retina': { 'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)' },
      },
      colors: {
        // Primary brand colors (blue)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Secondary colors (indigo)
        secondary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Success colors (green)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Warning colors (amber)
        warning: {
          50: '#fffbeb',
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
        // Error colors (red)
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Neutral grays
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Learning-specific colors
        learning: {
          beginner: '#22c55e',    // Green
          intermediate: '#f59e0b', // Amber
          advanced: '#ef4444',     // Red
          expert: '#8b5cf6',      // Purple
        },
        // Gamification colors
        xp: '#fbbf24',           // Gold
        streak: '#f97316',       // Orange
        achievement: '#8b5cf6',  // Purple
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        // Mobile-optimized font sizes
        'mobile-xs': ['0.75rem', { lineHeight: '1.125rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.375rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.625rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.875rem' }],
        'mobile-xl': ['1.25rem', { lineHeight: '2rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Touch-friendly spacing
        'touch': '44px',
        'touch-comfortable': '48px',
        // Safe area spacing
        'safe-top': 'env(safe-area-inset-top)',
        'safe-right': 'env(safe-area-inset-right)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        // Mobile-optimized shadows
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Mobile-specific animations
        'mobile-slide-up': 'mobileSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'mobile-slide-down': 'mobileSlideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        mobileSlideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        mobileSlideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      // Accessibility-specific extensions
      minHeight: {
        'touch': '44px', // Minimum touch target size
        'touch-comfortable': '48px', // Comfortable touch target size
        'screen-mobile': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': '44px', // Minimum touch target size
        'touch-comfortable': '48px', // Comfortable touch target size
      },
      maxWidth: {
        'mobile': '100vw',
        'mobile-safe': 'calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right))',
      },
      zIndex: {
        'mobile-nav': '1000',
        'mobile-overlay': '999',
        'modal': '1050',
        'tooltip': '1060',
        'notification': '1070',
      },
    },
  },
  plugins: [
    // Custom plugin for accessibility and mobile utilities
    function({ addUtilities, addComponents, addBase, theme }) {
      // Base styles for mobile optimization
      addBase({
        // Prevent zoom on input focus (iOS)
        '@media (max-width: 767px)': {
          'input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="tel"], input[type="url"], input[type="search"], textarea, select': {
            fontSize: '16px !important',
          },
        },
        // Smooth scrolling
        'html': {
          scrollBehavior: 'smooth',
        },
        // Touch scrolling for iOS
        '*': {
          '-webkit-overflow-scrolling': 'touch',
        },
        // Prevent text size adjust on orientation change
        'html, body': {
          '-webkit-text-size-adjust': '100%',
          '-ms-text-size-adjust': '100%',
        },
      })

      // Screen reader only utility
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.sr-only:focus, .sr-only:active': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'inherit',
        },
        // Skip link utilities
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          backgroundColor: theme('colors.gray.900'),
          color: theme('colors.white'),
          padding: '8px',
          textDecoration: 'none',
          borderRadius: '4px',
          zIndex: '1000',
          fontWeight: 'bold',
        },
        '.skip-link:focus': {
          top: '6px',
        },
        // Focus visible improvements
        '.focus-visible': {
          '&:focus-visible': {
            outline: `2px solid ${theme('colors.primary.500')}`,
            outlineOffset: '2px',
          },
        },
        // Safe area utilities
        '.safe-area-pt': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-area-pr': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-area-pb': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-area-pl': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        // Touch utilities
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        '.touch-pan-x': {
          touchAction: 'pan-x',
        },
        '.touch-pan-y': {
          touchAction: 'pan-y',
        },
        '.touch-pinch-zoom': {
          touchAction: 'pinch-zoom',
        },
        // Mobile-specific utilities
        '.mobile-only': {
          '@media (min-width: 768px)': {
            display: 'none !important',
          },
        },
        '.desktop-only': {
          '@media (max-width: 767px)': {
            display: 'none !important',
          },
        },
        // Viewport height fix for mobile
        '.min-h-screen-mobile': {
          minHeight: '100vh',
          minHeight: 'calc(var(--vh, 1vh) * 100)',
        },
        '.h-screen-mobile': {
          height: '100vh',
          height: 'calc(var(--vh, 1vh) * 100)',
        },
      });

      // Accessible component styles
      addComponents({
        // Button components
        '.btn': {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.md'),
          cursor: 'pointer',
          transition: 'all 0.15s ease-in-out',
          textDecoration: 'none',
          minHeight: theme('minHeight.touch'),
          minWidth: theme('minWidth.touch'),
          '&:disabled': {
            opacity: '0.6',
            cursor: 'not-allowed',
          },
        },
        '.btn-accessible': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.500')}33`,
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.white'),
          border: `2px solid ${theme('colors.primary.600')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.primary.700'),
            borderColor: theme('colors.primary.700'),
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.white'),
          color: theme('colors.gray.700'),
          border: `2px solid ${theme('colors.gray.300')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.gray.50'),
            borderColor: theme('colors.gray.400'),
          },
        },
        '.btn-success': {
          backgroundColor: theme('colors.success.600'),
          color: theme('colors.white'),
          border: `2px solid ${theme('colors.success.600')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.success.700'),
          },
        },
        '.btn-warning': {
          backgroundColor: theme('colors.warning.500'),
          color: theme('colors.white'),
          border: `2px solid ${theme('colors.warning.500')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.warning.600'),
          },
        },
        '.btn-error': {
          backgroundColor: theme('colors.error.600'),
          color: theme('colors.white'),
          border: `2px solid ${theme('colors.error.600')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.error.700'),
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.gray.700'),
          border: '2px solid transparent',
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.gray.100'),
          },
        },

        // Form components
        '.form-input': {
          width: '100%',
          padding: '0.5rem',
          border: `2px solid ${theme('colors.gray.300')}`,
          borderRadius: theme('borderRadius.md'),
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          minHeight: theme('minHeight.touch'),
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.500')}1a`,
          },
          '&[aria-invalid="true"]': {
            borderColor: theme('colors.error.500'),
            '&:focus': {
              borderColor: theme('colors.error.500'),
              boxShadow: `0 0 0 3px ${theme('colors.error.500')}1a`,
            },
          },
        },
        '.form-label': {
          display: 'block',
          fontWeight: theme('fontWeight.semibold'),
          marginBottom: '0.25rem',
          color: 'inherit',
          '&.required::after': {
            content: '" *"',
            color: theme('colors.error.600'),
          },
        },
        '.form-error': {
          color: theme('colors.error.600'),
          fontSize: theme('fontSize.sm[0]'),
          marginTop: '0.25rem',
        },
        '.form-help': {
          color: theme('colors.gray.500'),
          fontSize: theme('fontSize.sm[0]'),
          marginTop: '0.25rem',
        },

        // Navigation components
        '.nav-accessible': {
          'a': {
            display: 'block',
            padding: '0.75rem 1rem',
            textDecoration: 'none',
            borderRadius: theme('borderRadius.md'),
            transition: 'background-color 0.15s ease-in-out',
            minHeight: theme('minHeight.touch'),
            '&:focus': {
              outline: 'none',
              backgroundColor: `${theme('colors.primary.500')}1a`,
              boxShadow: `inset 3px 0 0 ${theme('colors.primary.500')}`,
            },
            '&[aria-current="page"]': {
              backgroundColor: theme('colors.primary.600'),
              color: theme('colors.white'),
            },
          },
        },

        // Card components
        '.card-accessible': {
          backgroundColor: theme('colors.white'),
          border: `1px solid ${theme('colors.gray.200')}`,
          borderRadius: theme('borderRadius.lg'),
          padding: '1rem',
          boxShadow: theme('boxShadow.soft'),
          '&:focus-within': {
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.500')}1a`,
          },
        },

        // Mobile-optimized components
        '.mobile-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          padding: '1rem',
          boxShadow: theme('boxShadow.mobile'),
          '@media (min-width: 768px)': {
            padding: '1.5rem',
            boxShadow: theme('boxShadow.soft'),
          },
        },

        '.mobile-button': {
          minHeight: theme('minHeight.touch-comfortable'),
          minWidth: theme('minWidth.touch-comfortable'),
          padding: '0.75rem 1.5rem',
          fontSize: theme('fontSize.base[0]'),
          '@media (max-width: 767px)': {
            width: '100%',
            justifyContent: 'center',
          },
        },
      });
    },
  ],
}