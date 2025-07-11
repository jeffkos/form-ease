/**
 * 🎨 ThemeSystem.js - FormEase Sprint 5 Phase 1
 * 
 * Système de thèmes avancé compatible Tremor
 * Gestion des thèmes, mode sombre, et personnalisation
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 1
 */

class ThemeSystem {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'tremor';
        this.isDarkMode = this.detectDarkMode();
        this.customProperties = new Map();
        this.observers = new Set();
        
        this.initThemeSystem();
        this.setupDarkModeDetection();
    }
    
    initThemeSystem() {
        // Thème Tremor par défaut
        this.registerTheme('tremor', {
            name: 'Tremor',
            description: 'Thème officiel basé sur Tremor UI',
            colors: {
                // Couleurs primaires Tremor
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
                    900: '#1e3a8a'
                },
                // Couleurs secondaires
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a'
                },
                // États
                success: {
                    50: '#ecfdf5',
                    500: '#10b981',
                    600: '#059669'
                },
                warning: {
                    50: '#fffbeb',
                    500: '#f59e0b',
                    600: '#d97706'
                },
                danger: {
                    50: '#fef2f2',
                    500: '#ef4444',
                    600: '#dc2626'
                }
            },
            spacing: {
                'tremor-xs': '0.25rem',
                'tremor-sm': '0.5rem',
                'tremor-default': '0.75rem',
                'tremor-lg': '1rem',
                'tremor-xl': '1.5rem',
                'tremor-2xl': '2rem',
                'tremor-3xl': '3rem'
            },
            borderRadius: {
                'tremor-small': '0.375rem',
                'tremor-default': '0.5rem',
                'tremor-full': '9999px'
            },
            fontSize: {
                'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
                'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
                'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
                'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }]
            },
            components: {
                // Composants Tremor
                card: {
                    base: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-tremor-default shadow-tremor-card',
                    header: 'px-tremor-default py-tremor-sm border-b border-gray-200 dark:border-gray-800',
                    body: 'px-tremor-default py-tremor-default',
                    footer: 'px-tremor-default py-tremor-sm border-t border-gray-200 dark:border-gray-800'
                },
                button: {
                    base: 'inline-flex items-center justify-center rounded-tremor-default border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                    primary: 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
                    secondary: 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
                    outline: 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
                    ghost: 'bg-transparent border-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
                    danger: 'bg-red-500 border-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                },
                input: {
                    base: 'block w-full rounded-tremor-default border-gray-300 text-tremor-default placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
                    error: 'border-red-300 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500',
                    success: 'border-green-300 text-green-900 focus:border-green-500 focus:ring-green-500'
                }
            }
        });
        
        // Thème FormEase personnalisé
        this.registerTheme('formease', {
            name: 'FormEase',
            description: 'Thème personnalisé FormEase',
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e'
                },
                accent: {
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9',
                    500: '#d946ef',
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75'
                }
            },
            gradients: {
                primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
                secondary: 'bg-gradient-to-r from-gray-400 to-gray-600',
                success: 'bg-gradient-to-r from-green-400 to-green-600'
            },
            animations: {
                duration: {
                    fast: '150ms',
                    normal: '300ms',
                    slow: '500ms'
                },
                easing: {
                    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }
            }
        });
        
        // Thème mode sombre
        this.registerTheme('dark', {
            name: 'Dark Mode',
            description: 'Thème sombre optimisé',
            colors: {
                background: {
                    primary: '#0f172a',
                    secondary: '#1e293b',
                    tertiary: '#334155'
                },
                text: {
                    primary: '#f8fafc',
                    secondary: '#cbd5e1',
                    muted: '#64748b'
                }
            }
        });
    }
    
    /**
     * Enregistrer un nouveau thème
     */
    registerTheme(name, theme) {
        this.themes.set(name, {
            ...theme,
            id: name,
            created: new Date().toISOString()
        });
        
        console.log(`🎨 Thème '${name}' enregistré`);
        
        return this;
    }
    
    /**
     * Appliquer un thème
     */
    applyTheme(themeName, options = {}) {
        const theme = this.themes.get(themeName);
        
        if (!theme) {
            console.warn(`Thème '${themeName}' non trouvé`);
            return false;
        }
        
        this.currentTheme = themeName;
        
        // Appliquer les variables CSS
        this.applyCSSVariables(theme);
        
        // Appliquer les classes Tailwind
        this.applyTailwindClasses(theme);
        
        // Sauvegarder la préférence
        if (options.persist !== false) {
            localStorage.setItem('formease-theme', themeName);
        }
        
        // Notifier les observateurs
        this.notifyObservers('themeChanged', { theme: themeName, themeData: theme });
        
        console.log(`🎨 Thème '${themeName}' appliqué`);
        
        return true;
    }
    
    /**
     * Appliquer les variables CSS personnalisées
     */
    applyCSSVariables(theme) {
        const root = document.documentElement;
        
        // Couleurs
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
                if (typeof colorValue === 'object') {
                    Object.entries(colorValue).forEach(([shade, value]) => {
                        root.style.setProperty(`--color-${colorName}-${shade}`, value);
                    });
                } else {
                    root.style.setProperty(`--color-${colorName}`, colorValue);
                }
            });
        }
        
        // Espacements
        if (theme.spacing) {
            Object.entries(theme.spacing).forEach(([name, value]) => {
                root.style.setProperty(`--spacing-${name}`, value);
            });
        }
        
        // Border radius
        if (theme.borderRadius) {
            Object.entries(theme.borderRadius).forEach(([name, value]) => {
                root.style.setProperty(`--radius-${name}`, value);
            });
        }
        
        // Typographie
        if (theme.fontSize) {
            Object.entries(theme.fontSize).forEach(([name, value]) => {
                const size = Array.isArray(value) ? value[0] : value;
                root.style.setProperty(`--font-size-${name}`, size);
            });
        }
        
        // Animations
        if (theme.animations) {
            if (theme.animations.duration) {
                Object.entries(theme.animations.duration).forEach(([name, value]) => {
                    root.style.setProperty(`--duration-${name}`, value);
                });
            }
            
            if (theme.animations.easing) {
                Object.entries(theme.animations.easing).forEach(([name, value]) => {
                    root.style.setProperty(`--easing-${name}`, value);
                });
            }
        }
    }
    
    /**
     * Appliquer les classes Tailwind dynamiquement
     */
    applyTailwindClasses(theme) {
        const body = document.body;
        
        // Nettoyer les anciennes classes de thème
        body.classList.forEach(className => {
            if (className.startsWith('theme-')) {
                body.classList.remove(className);
            }
        });
        
        // Ajouter la nouvelle classe de thème
        body.classList.add(`theme-${theme.id}`);
        
        // Ajouter des classes spécifiques au thème
        if (theme.bodyClasses) {
            theme.bodyClasses.forEach(className => {
                body.classList.add(className);
            });
        }
    }
    
    /**
     * Basculer le mode sombre
     */
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        
        const html = document.documentElement;
        
        if (this.isDarkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        // Sauvegarder la préférence
        localStorage.setItem('formease-dark-mode', this.isDarkMode.toString());
        
        // Notifier les observateurs
        this.notifyObservers('darkModeChanged', { isDark: this.isDarkMode });
        
        return this.isDarkMode;
    }
    
    /**
     * Définir le mode sombre
     */
    setDarkMode(enabled) {
        if (enabled !== this.isDarkMode) {
            this.toggleDarkMode();
        }
        
        return this;
    }
    
    /**
     * Détecter la préférence de mode sombre
     */
    detectDarkMode() {
        // Vérifier localStorage d'abord
        const saved = localStorage.getItem('formease-dark-mode');
        if (saved !== null) {
            return saved === 'true';
        }
        
        // Sinon, utiliser la préférence système
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    /**
     * Configurer la détection automatique du mode sombre
     */
    setupDarkModeDetection() {
        // Appliquer le mode initial
        this.setDarkMode(this.isDarkMode);
        
        // Écouter les changements de préférence système
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Seulement si aucune préférence manuelle n'est sauvegardée
                if (localStorage.getItem('formease-dark-mode') === null) {
                    this.setDarkMode(e.matches);
                }
            });
        }
    }
    
    /**
     * Créer un thème personnalisé
     */
    createCustomTheme(baseTheme, customizations) {
        const base = this.themes.get(baseTheme) || this.themes.get('tremor');
        
        const customTheme = this.deepMerge(base, customizations);
        
        const themeName = customizations.name || `custom-${Date.now()}`;
        this.registerTheme(themeName, customTheme);
        
        return themeName;
    }
    
    /**
     * Exporter un thème
     */
    exportTheme(themeName) {
        const theme = this.themes.get(themeName);
        
        if (!theme) {
            throw new Error(`Thème '${themeName}' non trouvé`);
        }
        
        return {
            name: themeName,
            theme: theme,
            exported: new Date().toISOString(),
            version: '5.0.0'
        };
    }
    
    /**
     * Importer un thème
     */
    importTheme(themeData) {
        if (!themeData.name || !themeData.theme) {
            throw new Error('Format de thème invalide');
        }
        
        this.registerTheme(themeData.name, themeData.theme);
        
        return themeData.name;
    }
    
    /**
     * Obtenir le thème actuel
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            data: this.themes.get(this.currentTheme),
            isDarkMode: this.isDarkMode
        };
    }
    
    /**
     * Obtenir tous les thèmes disponibles
     */
    getAvailableThemes() {
        const themes = [];
        
        this.themes.forEach((theme, name) => {
            themes.push({
                id: name,
                name: theme.name || name,
                description: theme.description || '',
                colors: theme.colors || {}
            });
        });
        
        return themes;
    }
    
    /**
     * Générer une prévisualisation de thème
     */
    generateThemePreview(themeName) {
        const theme = this.themes.get(themeName);
        
        if (!theme) {
            return null;
        }
        
        const preview = document.createElement('div');
        preview.className = 'theme-preview p-4 border rounded-lg space-y-3';
        
        // Titre
        const title = document.createElement('h3');
        title.className = 'font-semibold text-lg';
        title.textContent = theme.name || themeName;
        
        // Palette de couleurs
        const colorPalette = document.createElement('div');
        colorPalette.className = 'flex gap-2';
        
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
                const colorSwatch = document.createElement('div');
                colorSwatch.className = 'w-6 h-6 rounded border';
                
                if (typeof colorValue === 'object' && colorValue[500]) {
                    colorSwatch.style.backgroundColor = colorValue[500];
                } else if (typeof colorValue === 'string') {
                    colorSwatch.style.backgroundColor = colorValue;
                }
                
                colorSwatch.title = colorName;
                colorPalette.appendChild(colorSwatch);
            });
        }
        
        // Bouton d'exemple
        const exampleButton = document.createElement('button');
        exampleButton.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
        exampleButton.textContent = 'Exemple de bouton';
        
        preview.appendChild(title);
        preview.appendChild(colorPalette);
        preview.appendChild(exampleButton);
        
        return preview;
    }
    
    /**
     * Observer les changements de thème
     */
    subscribe(callback) {
        this.observers.add(callback);
        
        return () => {
            this.observers.delete(callback);
        };
    }
    
    /**
     * Notifier les observateurs
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Erreur dans l\'observateur de thème:', error);
            }
        });
    }
    
    /**
     * Initialiser automatiquement au chargement
     */
    autoInit() {
        // Charger le thème sauvegardé
        const savedTheme = localStorage.getItem('formease-theme');
        if (savedTheme && this.themes.has(savedTheme)) {
            this.applyTheme(savedTheme, { persist: false });
        } else {
            this.applyTheme('tremor');
        }
        
        // Configurer les event listeners globaux
        this.setupGlobalListeners();
    }
    
    /**
     * Configurer les event listeners globaux
     */
    setupGlobalListeners() {
        // Raccourci clavier pour basculer le mode sombre
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDarkMode();
            }
        });
        
        // Méthodes globales
        window.switchTheme = (theme) => this.applyTheme(theme);
        window.toggleDarkMode = () => this.toggleDarkMode();
        window.getCurrentTheme = () => this.getCurrentTheme();
    }
    
    // Utilitaires
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
}

/**
 * Générateur de thèmes automatique
 */
class ThemeGenerator {
    static generateFromColors(primaryColor, secondaryColor, name = 'custom') {
        const theme = {
            name: name,
            description: `Thème généré automatiquement basé sur ${primaryColor}`,
            colors: {
                primary: this.generateColorShades(primaryColor),
                secondary: this.generateColorShades(secondaryColor)
            }
        };
        
        return theme;
    }
    
    static generateColorShades(color) {
        // Logique simplifiée - dans un vrai projet, utiliser une bibliothèque comme chroma.js
        const shades = {};
        const baseHue = this.colorToHsl(color).h;
        
        [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].forEach(shade => {
            const lightness = shade === 500 ? 50 : 
                            shade < 500 ? 95 - (shade / 500) * 45 :
                            50 - ((shade - 500) / 400) * 40;
                            
            shades[shade] = this.hslToColor(baseHue, 70, lightness);
        });
        
        return shades;
    }
    
    static colorToHsl(color) {
        // Conversion couleur vers HSL (implémentation simplifiée)
        return { h: 200, s: 70, l: 50 }; // Valeurs par défaut
    }
    
    static hslToColor(h, s, l) {
        // Conversion HSL vers couleur hex (implémentation simplifiée)
        return `hsl(${h}, ${s}%, ${l}%)`;
    }
}

// Instance globale du système de thèmes
const themeSystem = new ThemeSystem();

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    themeSystem.autoInit();
});

// Export global
window.ThemeSystem = ThemeSystem;
window.themeSystem = themeSystem;
window.ThemeGenerator = ThemeGenerator;

console.log('🎨 ThemeSystem initialisé avec', themeSystem.getAvailableThemes().length, 'thèmes');
