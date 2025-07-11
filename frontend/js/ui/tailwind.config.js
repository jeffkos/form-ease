/**
 * 🎨 Tailwind Configuration for FormEase UI Components
 * 
 * Configuration Tailwind CSS personnalisée pour FormEase Sprint 5
 * Intégration avec Tremor et extensions custom
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 1
 */

// Configuration Tailwind CSS pour FormEase
const tailwindConfig = {
  content: [
    './frontend/**/*.{html,js}',
    './frontend/js/**/*.js',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette FormEase
        formease: {
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
          950: '#172554'
        },
        
        // Couleurs sémantiques
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        
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
          950: '#451a03'
        },
        
        danger: {
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
          950: '#450a0a'
        }
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        display: ['Poppins', 'Inter', 'sans-serif']
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
        '6xl': ['3.75rem', { lineHeight: '1' }]
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem'
      },
      
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'glow': '0 0 20px rgb(59 130 246 / 0.5)',
        'glow-lg': '0 0 40px rgb(59 130 246 / 0.6)'
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-out': 'fadeOut 0.2s ease-in-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'bounce-subtle': 'bounceSubtle 0.3s ease-in-out',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      },
      
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px'
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    }
  },
  
  plugins: [
    // Plugin pour les composants FormEase
    function({ addComponents, theme }) {
      addComponents({
        // Button components
        '.btn': {
          '@apply inline-flex items-center justify-center font-medium text-center border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        
        '.btn-xs': {
          '@apply px-2 py-1 text-xs rounded': {},
        },
        
        '.btn-sm': {
          '@apply px-3 py-1.5 text-sm rounded-md': {},
        },
        
        '.btn-md': {
          '@apply px-4 py-2 text-base rounded-md': {},
        },
        
        '.btn-lg': {
          '@apply px-6 py-3 text-lg rounded-lg': {},
        },
        
        '.btn-xl': {
          '@apply px-8 py-4 text-xl rounded-lg': {},
        },
        
        '.btn-primary': {
          '@apply bg-formease-500 hover:bg-formease-600 active:bg-formease-700 text-white border-formease-500 focus:ring-formease-500': {},
        },
        
        '.btn-secondary': {
          '@apply bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-300 focus:ring-gray-500': {},
        },
        
        '.btn-outline': {
          '@apply bg-transparent hover:bg-formease-50 active:bg-formease-100 text-formease-500 border-formease-500 focus:ring-formease-500': {},
        },
        
        '.btn-ghost': {
          '@apply bg-transparent hover:bg-formease-50 active:bg-formease-100 text-formease-500 border-transparent focus:ring-formease-500': {},
        },
        
        '.btn-danger': {
          '@apply bg-danger-500 hover:bg-danger-600 active:bg-danger-700 text-white border-danger-500 focus:ring-danger-500': {},
        },
        
        // Input components
        '.input': {
          '@apply block w-full border rounded-md shadow-sm focus:ring-2 focus:ring-formease-500 focus:border-formease-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200': {},
        },
        
        '.input-sm': {
          '@apply px-3 py-1.5 text-sm': {},
        },
        
        '.input-md': {
          '@apply px-3 py-2 text-base': {},
        },
        
        '.input-lg': {
          '@apply px-4 py-3 text-lg': {},
        },
        
        '.input-error': {
          '@apply border-danger-500 focus:ring-danger-500 focus:border-danger-500': {},
        },
        
        // Card components
        '.card': {
          '@apply bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden': {},
        },
        
        '.card-hover': {
          '@apply hover:shadow-md hover:-translate-y-1 transition-all duration-200': {},
        },
        
        '.card-clickable': {
          '@apply cursor-pointer hover:shadow-lg hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-formease-500 focus:ring-offset-2': {},
        },
        
        // Modal components
        '.modal-overlay': {
          '@apply fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto': {},
        },
        
        '.modal': {
          '@apply bg-white rounded-lg shadow-xl max-h-[calc(100vh-2rem)] w-full overflow-hidden': {},
        },
        
        '.modal-sm': {
          '@apply max-w-sm': {},
        },
        
        '.modal-md': {
          '@apply max-w-md': {},
        },
        
        '.modal-lg': {
          '@apply max-w-2xl': {},
        },
        
        '.modal-xl': {
          '@apply max-w-4xl': {},
        },
        
        // Alert components
        '.alert': {
          '@apply flex items-start gap-3 p-4 rounded-md border': {},
        },
        
        '.alert-info': {
          '@apply bg-formease-50 border-formease-200 text-formease-800': {},
        },
        
        '.alert-success': {
          '@apply bg-success-50 border-success-200 text-success-800': {},
        },
        
        '.alert-warning': {
          '@apply bg-warning-50 border-warning-200 text-warning-800': {},
        },
        
        '.alert-danger': {
          '@apply bg-danger-50 border-danger-200 text-danger-800': {},
        },
        
        // Utility classes
        '.glassmorphism': {
          '@apply bg-white bg-opacity-80 backdrop-blur-md border border-white border-opacity-20': {},
        },
        
        '.glassmorphism-dark': {
          '@apply bg-gray-900 bg-opacity-80 backdrop-blur-md border border-gray-700 border-opacity-50': {},
        },
        
        '.gradient-primary': {
          '@apply bg-gradient-to-r from-formease-500 to-formease-600': {},
        },
        
        '.gradient-success': {
          '@apply bg-gradient-to-r from-success-500 to-success-600': {},
        },
        
        '.gradient-warning': {
          '@apply bg-gradient-to-r from-warning-500 to-warning-600': {},
        },
        
        '.gradient-danger': {
          '@apply bg-gradient-to-r from-danger-500 to-danger-600': {},
        },
        
        '.text-gradient': {
          '@apply bg-gradient-to-r from-formease-500 to-formease-600 bg-clip-text text-transparent': {},
        }
      })
    },
    
    // Plugin pour les états d'animation
    function({ addUtilities }) {
      addUtilities({
        '.animate-enter': {
          animation: 'fadeIn 0.2s ease-in-out, slideInUp 0.3s ease-out'
        },
        '.animate-exit': {
          animation: 'fadeOut 0.2s ease-in-out, scaleOut 0.2s ease-in'
        },
        '.animate-bounce-click': {
          animation: 'bounceSubtle 0.3s ease-in-out'
        },
        '.animate-shake-error': {
          animation: 'shake 0.4s ease-in-out'
        }
      })
    }
  ]
};

// Fonction pour appliquer la configuration Tailwind
function applyTailwindConfig() {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = tailwindConfig;
  } else if (typeof window !== 'undefined') {
    window.tailwindConfig = tailwindConfig;
  }
}

// Classes utilitaires pour les composants FormEase
const FormEaseUtilities = {
  // Générateur de classes pour boutons
  button: {
    base: 'btn',
    variants: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'btn-danger'
    },
    sizes: {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
      xl: 'btn-xl'
    },
    states: {
      loading: 'cursor-wait',
      disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
      fullWidth: 'w-full',
      rounded: 'rounded-full'
    }
  },
  
  // Générateur de classes pour inputs
  input: {
    base: 'input',
    sizes: {
      sm: 'input-sm',
      md: 'input-md',
      lg: 'input-lg'
    },
    states: {
      error: 'input-error',
      focused: 'ring-2 ring-formease-500 ring-opacity-50',
      disabled: 'bg-gray-50 opacity-50 cursor-not-allowed',
      readonly: 'bg-gray-50'
    }
  },
  
  // Générateur de classes pour cards
  card: {
    base: 'card',
    variants: {
      elevated: 'shadow-lg',
      outlined: 'border-2 shadow-none'
    },
    states: {
      hover: 'card-hover',
      clickable: 'card-clickable'
    }
  },
  
  // Générateur de classes pour modals
  modal: {
    overlay: 'modal-overlay',
    base: 'modal',
    sizes: {
      sm: 'modal-sm',
      md: 'modal-md',
      lg: 'modal-lg',
      xl: 'modal-xl'
    },
    animations: {
      enter: 'animate-scale-in',
      exit: 'animate-scale-out'
    }
  },
  
  // Générateur de classes pour alerts
  alert: {
    base: 'alert',
    variants: {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      danger: 'alert-danger'
    }
  }
};

// Export des utilitaires
if (typeof window !== 'undefined') {
  window.FormEaseUtilities = FormEaseUtilities;
}

// Appliquer la configuration
applyTailwindConfig();

console.log('🎨 Configuration Tailwind CSS FormEase chargée');

// Instructions d'installation pour Tailwind CSS
const installationInstructions = `
Pour installer Tailwind CSS avec cette configuration :

1. Installer Tailwind CSS :
   npm install -D tailwindcss @tailwindcss/forms @tailwindcss/typography

2. Créer le fichier tailwind.config.js avec cette configuration

3. Créer le fichier CSS principal :
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

4. Construire le CSS :
   npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch

5. Inclure le CSS généré dans votre HTML :
   <link href="./dist/output.css" rel="stylesheet">
`;

console.log(installationInstructions);
