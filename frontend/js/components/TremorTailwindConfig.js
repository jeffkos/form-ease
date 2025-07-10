/**
 * 🚀 SPRINT 2 - Configuration Tremor + Tailwind CSS
 * Documentation : https://blocks.tremor.so/getting-started
 * Couleurs : Palette Tremor officielle
 * Icônes : Remix Icons
 */

// Configuration Tailwind pour Tremor
const tremorConfig = {
  theme: {
    extend: {
      colors: {
        // Tremor Brand Colors (Blue)
        tremor: {
          brand: {
            faint: '#eff6ff',    // blue-50
            muted: '#bfdbfe',    // blue-200  
            subtle: '#60a5fa',   // blue-400
            DEFAULT: '#3b82f6',  // blue-500
            emphasis: '#1d4ed8', // blue-700
            inverted: '#ffffff', // white
          },
        },
        // Dark Tremor
        'dark-tremor': {
          brand: {
            faint: '#0B1229',    // custom
            muted: '#172554',    // blue-900
            subtle: '#1e40af',   // blue-800
            DEFAULT: '#3b82f6',  // blue-500
            emphasis: '#60a5fa', // blue-400
            inverted: '#030712', // gray-950
          },
        },
      },
      boxShadow: {
        // Tremor Shadows
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'tremor-small': '0.375rem',
        'tremor-default': '0.5rem',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
        'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
};

// Classes utilitaires Tremor
const tremorUtilities = {
  // Cards
  '.tremor-Card': {
    '@apply bg-white shadow-tremor-card rounded-tremor-default border border-tremor-border': {},
  },
  '.tremor-Card-dark': {
    '@apply bg-dark-tremor-background shadow-dark-tremor-card border-dark-tremor-border': {},
  },
  
  // Buttons  
  '.tremor-Button': {
    '@apply inline-flex items-center justify-center rounded-tremor-default border px-3 py-2 text-tremor-default font-medium': {},
  },
  '.tremor-Button-primary': {
    '@apply bg-tremor-brand border-tremor-brand text-tremor-brand-inverted hover:bg-tremor-brand-emphasis hover:border-tremor-brand-emphasis': {},
  },
  '.tremor-Button-secondary': {
    '@apply bg-tremor-background border-tremor-border text-tremor-content hover:bg-tremor-muted': {},
  },
  
  // Inputs
  '.tremor-TextInput': {
    '@apply w-full rounded-tremor-default border border-tremor-border bg-tremor-background px-3 py-2 text-tremor-default shadow-tremor-input': {},
  },
  '.tremor-TextInput:focus': {
    '@apply border-tremor-brand outline-none ring-2 ring-tremor-brand ring-opacity-20': {},
  },
  
  // Typography
  '.tremor-Title': {
    '@apply text-tremor-title font-semibold text-tremor-content': {},
  },
  '.tremor-Text': {
    '@apply text-tremor-default text-tremor-content': {},
  },
  '.tremor-Metric': {
    '@apply text-tremor-metric font-semibold text-tremor-content': {},
  },
  '.tremor-Label': {
    '@apply text-tremor-label font-medium text-tremor-content': {},
  },
  
  // Badges
  '.tremor-Badge': {
    '@apply inline-flex items-center rounded-tremor-small px-2 py-0.5 text-tremor-label font-medium': {},
  },
  '.tremor-Badge-success': {
    '@apply bg-emerald-50 text-emerald-800': {},
  },
  '.tremor-Badge-warning': {
    '@apply bg-yellow-50 text-yellow-800': {},
  },
  '.tremor-Badge-error': {
    '@apply bg-red-50 text-red-800': {},
  },
  '.tremor-Badge-neutral': {
    '@apply bg-gray-50 text-gray-800': {},
  },
};

// Animation classes Tremor
const tremorAnimations = {
  '.tremor-animate-in': {
    '@apply animate-in fade-in-0 zoom-in-95 duration-100 ease-out': {},
  },
  '.tremor-animate-out': {
    '@apply animate-out fade-out-0 zoom-out-95 duration-75 ease-in': {},
  },
  '.tremor-slide-up': {
    '@apply animate-in slide-in-from-bottom-2 duration-300 ease-out': {},
  },
  '.tremor-slide-down': {
    '@apply animate-in slide-in-from-top-2 duration-300 ease-out': {},
  },
};

// Export pour utilisation dans Tailwind config
window.tremorTailwindConfig = {
  ...tremorConfig,
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        ...tremorUtilities,
        ...tremorAnimations,
      });
    },
  ],
};

// Classes CSS prêtes à l'emploi pour les composants Tremor
window.tremorClasses = {
  // Layouts
  dashboard: 'space-y-6 p-6',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  flexStack: 'flex flex-col space-y-4',
  
  // Cards
  card: 'tremor-Card p-6',
  cardHeader: 'flex items-center justify-between mb-4',
  cardContent: 'space-y-4',
  
  // KPI Cards
  kpiCard: 'tremor-Card p-6 space-y-2',
  kpiValue: 'tremor-Metric',
  kpiLabel: 'tremor-Label text-gray-600',
  kpiDelta: 'text-sm font-medium',
  kpiIcon: 'w-8 h-8 p-2 rounded-lg',
  
  // Buttons
  buttonPrimary: 'tremor-Button tremor-Button-primary',
  buttonSecondary: 'tremor-Button tremor-Button-secondary',
  buttonIcon: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border',
  
  // Forms
  input: 'tremor-TextInput',
  label: 'tremor-Label mb-2 block',
  select: 'tremor-TextInput',
  
  // Tables
  table: 'w-full border-collapse',
  tableHeader: 'border-b border-gray-200 text-left',
  tableCell: 'py-3 px-4 border-b border-gray-100',
  tableRow: 'hover:bg-gray-50 transition-colors',
  
  // Navigation
  navItem: 'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
  navItemActive: 'bg-tremor-brand text-white',
  navItemInactive: 'text-gray-700 hover:bg-gray-100',
  
  // Badges
  badgeSuccess: 'tremor-Badge tremor-Badge-success',
  badgeWarning: 'tremor-Badge tremor-Badge-warning',
  badgeError: 'tremor-Badge tremor-Badge-error',
  badgeNeutral: 'tremor-Badge tremor-Badge-neutral',
  
  // Loading states
  skeleton: 'animate-pulse bg-gray-200 rounded',
  shimmer: 'relative overflow-hidden bg-gray-200 rounded',
  
  // Animations
  fadeIn: 'tremor-animate-in',
  slideUp: 'tremor-slide-up',
  
  // Responsive
  responsiveGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  responsiveFlex: 'flex flex-col sm:flex-row items-start sm:items-center gap-4',
};

console.log('🎨 Configuration Tremor + Tailwind chargée');
console.log('📚 Classes disponibles:', Object.keys(window.tremorClasses));
console.log('🎯 Usage: className={tremorClasses.card}');
