/**
 * 🎯 ComponentRegistry.js - FormEase Sprint 5 Phase 1
 * 
 * Registre central pour tous les composants UI
 * Système d'enregistrement et d'instanciation automatique
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 1
 */

class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.instances = new Map();
        this.themes = new Map();
        this.plugins = new Map();
        
        this.initRegistry();
    }
    
    initRegistry() {
        // Enregistrer les thèmes par défaut
        this.registerTheme('default', {
            colors: {
                primary: 'blue',
                secondary: 'gray',
                success: 'green',
                warning: 'yellow',
                danger: 'red',
                info: 'cyan'
            },
            spacing: {
                xs: '0.5rem',
                sm: '0.75rem',
                md: '1rem',
                lg: '1.5rem',
                xl: '2rem'
            },
            typography: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem'
                }
            }
        });
        
        this.registerTheme('tremor', {
            colors: {
                primary: 'blue',
                secondary: 'slate',
                success: 'emerald',
                warning: 'amber',
                danger: 'red',
                info: 'sky'
            },
            components: {
                card: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-tremor-default shadow-tremor-card',
                button: 'px-tremor-default py-tremor-sm rounded-tremor-default font-medium transition-all',
                input: 'px-tremor-default py-tremor-sm border border-tremor-border rounded-tremor-default'
            }
        });
        
        // Auto-enregistrement des composants existants
        this.autoRegisterComponents();
    }
    
    /**
     * Enregistrer un composant
     */
    register(name, componentClass, options = {}) {
        const componentInfo = {
            class: componentClass,
            name: name,
            category: options.category || 'general',
            version: options.version || '1.0.0',
            dependencies: options.dependencies || [],
            props: options.props || {},
            examples: options.examples || [],
            tags: options.tags || [],
            created: new Date().toISOString()
        };
        
        this.components.set(name, componentInfo);
        
        // Créer des méthodes de création automatiques
        this.createFactoryMethod(name);
        
        console.log(`📦 Composant '${name}' enregistré`);
        
        return this;
    }
    
    /**
     * Créer une instance de composant
     */
    create(name, props = {}, container = null) {
        const componentInfo = this.components.get(name);
        
        if (!componentInfo) {
            throw new Error(`Composant '${name}' non trouvé`);
        }
        
        // Vérifier les dépendances
        this.checkDependencies(componentInfo.dependencies);
        
        // Créer l'instance
        const instance = new componentInfo.class(props);
        
        // Appliquer le thème actuel
        this.applyTheme(instance);
        
        // Enregistrer l'instance
        const instanceId = this.generateInstanceId(name);
        this.instances.set(instanceId, {
            component: instance,
            name: name,
            created: new Date(),
            container: container
        });
        
        // Render automatique si container fourni
        if (container) {
            this.renderToContainer(instance, container);
        }
        
        return instance;
    }
    
    /**
     * Créer des méthodes de factory automatiques
     */
    createFactoryMethod(name) {
        const methodName = `create${this.capitalize(name)}`;
        
        this[methodName] = (props = {}, container = null) => {
            return this.create(name, props, container);
        };
        
        // Méthode statique pour l'UIComponentLibrary
        if (window.UIComponentLibrary) {
            window.UIComponentLibrary[methodName] = (props = {}, container = null) => {
                return this.create(name, props, container);
            };
        }
    }
    
    /**
     * Auto-enregistrement des composants existants
     */
    autoRegisterComponents() {
        const coreComponents = [
            { name: 'button', class: window.ButtonComponent, category: 'form' },
            { name: 'input', class: window.InputComponent, category: 'form' },
            { name: 'modal', class: window.ModalComponent, category: 'overlay' },
            { name: 'alert', class: window.AlertComponent, category: 'feedback' },
            { name: 'card', class: window.CardComponent, category: 'layout' },
            { name: 'datePicker', class: window.DatePickerComponent, category: 'form' },
            { name: 'select', class: window.SelectComponent, category: 'form' },
            { name: 'fileUpload', class: window.FileUploadComponent, category: 'form' }
        ];
        
        coreComponents.forEach(comp => {
            if (comp.class) {
                this.register(comp.name, comp.class, {
                    category: comp.category,
                    version: '5.0.0'
                });
            }
        });
    }
    
    /**
     * Enregistrer un thème
     */
    registerTheme(name, theme) {
        this.themes.set(name, {
            ...theme,
            name: name,
            created: new Date().toISOString()
        });
        
        console.log(`🎨 Thème '${name}' enregistré`);
        
        return this;
    }
    
    /**
     * Appliquer un thème à une instance
     */
    applyTheme(instance, themeName = 'tremor') {
        const theme = this.themes.get(themeName);
        
        if (theme && instance.applyTheme) {
            instance.applyTheme(theme);
        }
        
        return this;
    }
    
    /**
     * Enregistrer un plugin
     */
    registerPlugin(name, plugin) {
        this.plugins.set(name, {
            ...plugin,
            name: name,
            installed: new Date().toISOString()
        });
        
        // Exécuter l'installation du plugin
        if (plugin.install) {
            plugin.install(this);
        }
        
        console.log(`🔌 Plugin '${name}' installé`);
        
        return this;
    }
    
    /**
     * Rechercher des composants
     */
    search(query) {
        const results = [];
        
        this.components.forEach((info, name) => {
            const searchText = `${name} ${info.category} ${info.tags.join(' ')}`.toLowerCase();
            
            if (searchText.includes(query.toLowerCase())) {
                results.push({
                    name: name,
                    ...info,
                    score: this.calculateRelevanceScore(query, searchText)
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    /**
     * Obtenir tous les composants par catégorie
     */
    getByCategory(category) {
        const results = [];
        
        this.components.forEach((info, name) => {
            if (info.category === category) {
                results.push({ name, ...info });
            }
        });
        
        return results;
    }
    
    /**
     * Obtenir les statistiques du registre
     */
    getStats() {
        const categories = new Map();
        const totalComponents = this.components.size;
        const totalInstances = this.instances.size;
        
        this.components.forEach(info => {
            const count = categories.get(info.category) || 0;
            categories.set(info.category, count + 1);
        });
        
        return {
            totalComponents,
            totalInstances,
            totalThemes: this.themes.size,
            totalPlugins: this.plugins.size,
            categories: Object.fromEntries(categories),
            memoryUsage: this.getMemoryUsage()
        };
    }
    
    /**
     * Nettoyer les instances non utilisées
     */
    cleanup() {
        let cleaned = 0;
        
        this.instances.forEach((instanceInfo, id) => {
            const element = instanceInfo.component.element;
            
            // Vérifier si l'élément est toujours dans le DOM
            if (element && !document.contains(element)) {
                // Nettoyer l'instance
                if (instanceInfo.component.destroy) {
                    instanceInfo.component.destroy();
                }
                
                this.instances.delete(id);
                cleaned++;
            }
        });
        
        console.log(`🧹 ${cleaned} instances nettoyées`);
        
        return cleaned;
    }
    
    /**
     * Exporter la configuration
     */
    exportConfig() {
        const config = {
            version: '5.0.0',
            timestamp: new Date().toISOString(),
            components: [],
            themes: [],
            plugins: []
        };
        
        // Exporter les composants
        this.components.forEach((info, name) => {
            config.components.push({
                name: name,
                category: info.category,
                version: info.version,
                props: info.props,
                tags: info.tags
            });
        });
        
        // Exporter les thèmes
        this.themes.forEach((theme, name) => {
            config.themes.push({
                name: name,
                ...theme
            });
        });
        
        // Exporter les plugins
        this.plugins.forEach((plugin, name) => {
            config.plugins.push({
                name: name,
                version: plugin.version,
                description: plugin.description
            });
        });
        
        return config;
    }
    
    /**
     * Importer une configuration
     */
    importConfig(config) {
        console.log(`📥 Import configuration v${config.version}`);
        
        // Importer les thèmes
        config.themes?.forEach(theme => {
            this.registerTheme(theme.name, theme);
        });
        
        // Note: Les composants et plugins doivent être chargés manuellement
        // car ils contiennent des classes et fonctions
        
        return this;
    }
    
    // Méthodes utilitaires
    generateInstanceId(componentName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${componentName}_${timestamp}_${random}`;
    }
    
    checkDependencies(dependencies) {
        dependencies.forEach(dep => {
            if (!this.components.has(dep)) {
                throw new Error(`Dépendance manquante: ${dep}`);
            }
        });
    }
    
    calculateRelevanceScore(query, text) {
        const queryWords = query.toLowerCase().split(' ');
        let score = 0;
        
        queryWords.forEach(word => {
            if (text.includes(word)) {
                score += word.length;
            }
        });
        
        return score;
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    renderToContainer(instance, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container && instance.render) {
            const element = instance.render();
            container.appendChild(element);
        }
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        return { used: 'N/A', total: 'N/A', limit: 'N/A' };
    }
}

/**
 * Plugin système pour étendre les fonctionnalités
 */
class PluginSystem {
    static createValidationPlugin() {
        return {
            name: 'validation',
            version: '1.0.0',
            description: 'Plugin de validation avancée',
            
            install(registry) {
                // Ajouter des méthodes de validation
                const validators = {
                    required: (value) => value != null && value !== '',
                    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                    phone: (value) => /^[\d\s\-\+\(\)]+$/.test(value),
                    url: (value) => {
                        try {
                            new URL(value);
                            return true;
                        } catch {
                            return false;
                        }
                    },
                    minLength: (min) => (value) => value && value.length >= min,
                    maxLength: (max) => (value) => value && value.length <= max,
                    pattern: (regex) => (value) => regex.test(value),
                    custom: (fn) => fn
                };
                
                // Étendre BaseComponent avec validation
                if (window.BaseComponent) {
                    window.BaseComponent.prototype.addValidation = function(rules) {
                        this.validationRules = rules;
                        
                        this.validate = function() {
                            const errors = [];
                            
                            Object.entries(rules).forEach(([field, fieldRules]) => {
                                const value = this.getValue ? this.getValue(field) : this.props[field];
                                
                                fieldRules.forEach(rule => {
                                    const validator = validators[rule.type];
                                    if (validator && !validator(value)) {
                                        errors.push({
                                            field: field,
                                            message: rule.message || `Validation failed for ${field}`
                                        });
                                    }
                                });
                            });
                            
                            return errors;
                        };
                    };
                }
                
                registry.validators = validators;
            }
        };
    }
    
    static createAnimationPlugin() {
        return {
            name: 'animations',
            version: '1.0.0',
            description: 'Plugin d\'animations CSS',
            
            install(registry) {
                const animations = {
                    fadeIn: 'animate-fade-in',
                    fadeOut: 'animate-fade-out',
                    slideIn: 'animate-slide-in',
                    slideOut: 'animate-slide-out',
                    bounce: 'animate-bounce',
                    pulse: 'animate-pulse',
                    spin: 'animate-spin'
                };
                
                // Étendre BaseComponent avec animations
                if (window.BaseComponent) {
                    window.BaseComponent.prototype.animate = function(animationType, duration = 300) {
                        const animationClass = animations[animationType];
                        
                        if (animationClass && this.element) {
                            this.element.classList.add(animationClass);
                            
                            setTimeout(() => {
                                this.element.classList.remove(animationClass);
                            }, duration);
                        }
                    };
                }
                
                registry.animations = animations;
            }
        };
    }
    
    static createThemePlugin() {
        return {
            name: 'themes',
            version: '1.0.0',
            description: 'Plugin de gestion des thèmes',
            
            install(registry) {
                // Gestionnaire de thème dynamique
                const themeManager = {
                    current: 'tremor',
                    
                    switch(themeName) {
                        if (registry.themes.has(themeName)) {
                            this.current = themeName;
                            
                            // Appliquer le thème à toutes les instances
                            registry.instances.forEach(instanceInfo => {
                                registry.applyTheme(instanceInfo.component, themeName);
                            });
                            
                            // Déclencher un événement
                            document.dispatchEvent(new CustomEvent('themeChanged', {
                                detail: { theme: themeName }
                            }));
                        }
                    },
                    
                    isDark() {
                        return document.documentElement.classList.contains('dark');
                    },
                    
                    toggleDark() {
                        document.documentElement.classList.toggle('dark');
                    }
                };
                
                registry.themeManager = themeManager;
                
                // Méthodes globales
                window.switchTheme = (theme) => themeManager.switch(theme);
                window.toggleDarkMode = () => themeManager.toggleDark();
            }
        };
    }
}

// Instance globale du registre
const componentRegistry = new ComponentRegistry();

// Installation des plugins par défaut
componentRegistry.registerPlugin('validation', PluginSystem.createValidationPlugin());
componentRegistry.registerPlugin('animations', PluginSystem.createAnimationPlugin());
componentRegistry.registerPlugin('themes', PluginSystem.createThemePlugin());

// Export global
window.ComponentRegistry = ComponentRegistry;
window.componentRegistry = componentRegistry;
window.PluginSystem = PluginSystem;

// Méthodes globales pour faciliter l'utilisation
window.createComponent = (name, props, container) => componentRegistry.create(name, props, container);
window.registerComponent = (name, componentClass, options) => componentRegistry.register(name, componentClass, options);

console.log('🎯 ComponentRegistry initialisé avec', componentRegistry.getStats());
