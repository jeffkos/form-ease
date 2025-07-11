/**
 * 🎨 UIComponentLibrary.js - FormEase Sprint 5 Phase 1
 * 
 * Bibliothèque de composants UI avancés et réutilisables
 * Système de composants enterprise avec design system intégré
 * 
 * Fonctionnalités :
 * - Composants UI modernes et accessibles
 * - Design system cohérent
 * - Composants interactifs avancés
 * - Theming et personnalisation
 * - Animations et transitions fluides
 * - Composants responsive
 * - Accessibility WCAG 2.1 AA
 * - Performance optimisée
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 1
 */

class UIComponentLibrary {
    constructor() {
        this.components = new Map();
        this.themes = new Map();
        this.animations = new Map();
        this.patterns = new Map();
        this.tokens = new Map();
        
        this.config = {
            // Tailwind CSS Integration
            tailwindClasses: {
                spacing: {
                    xs: 'space-x-1 space-y-1',
                    sm: 'space-x-2 space-y-2', 
                    md: 'space-x-4 space-y-4',
                    lg: 'space-x-6 space-y-6',
                    xl: 'space-x-8 space-y-8',
                    '2xl': 'space-x-12 space-y-12'
                },
                colors: {
                    primary: 'blue',
                    secondary: 'gray',
                    success: 'emerald',
                    warning: 'amber',
                    error: 'red',
                    info: 'sky'
                },
                sizes: {
                    xs: 'text-xs px-2 py-1',
                    sm: 'text-sm px-3 py-1.5',
                    md: 'text-base px-4 py-2',
                    lg: 'text-lg px-6 py-3',
                    xl: 'text-xl px-8 py-4'
                }
            },
            
            // Tremor Integration
            tremorComponents: {
                enabled: true,
                theme: 'light', // 'light' | 'dark' | 'auto'
                customization: {
                    primaryColor: 'blue',
                    borderRadius: 'md',
                    fontSize: 'base'
                }
            },
            
            // Animation Configuration
            animations: {
                enabled: true,
                duration: {
                    fast: 150,
                    normal: 200,
                    slow: 300
                },
                easing: {
                    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
                    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
                    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }
            },
            
            // Accessibility Configuration
            accessibility: {
                enabled: true,
                announcements: true,
                highContrast: false,
                reducedMotion: false,
                focusManagement: true,
                keyboardNavigation: true
            },
            
            // Performance Configuration
            performance: {
                lazyLoading: true,
                virtualScrolling: true,
                memoization: true,
                debounceDelay: 300
            }
        };
        
        this.state = {
            currentTheme: 'default',
            accessibility: {
                announcer: null,
                focusStack: [],
                landmarks: new Set()
            },
            performance: {
                componentCache: new Map(),
                renderQueue: [],
                isRendering: false
            }
        };
        
        this.init();
    }
    
    /**
     * Initialisation de la bibliothèque de composants
     */
    init() {
        this.initializeDesignSystem();
        this.registerCoreComponents();
        this.setupAccessibility();
        this.initializeAnimations();
        this.setupPerformanceOptimizations();
        this.bindGlobalEvents();
        
        console.log('🎨 UIComponentLibrary v5.0 initialisée - Mode ADVANCED');
    }
    
    /**
     * Initialisation du design system avec Tailwind CSS
     */
    initializeDesignSystem() {
        this.tailwindUtils = {
            // Générateur de classes Tailwind
            generateClasses: (baseClasses, variant, size, state = {}) => {
                const classes = [...baseClasses];
                
                // Ajouter les classes de variante
                if (variant) {
                    classes.push(...this.getVariantClasses(variant));
                }
                
                // Ajouter les classes de taille
                if (size) {
                    classes.push(...this.getSizeClasses(size));
                }
                
                // Ajouter les classes d'état
                Object.entries(state).forEach(([stateName, isActive]) => {
                    if (isActive) {
                        classes.push(...this.getStateClasses(stateName));
                    }
                });
                
                return classes.join(' ');
            },
            
            getVariantClasses: (variant) => {
                const variantMap = {
                    primary: ['bg-blue-500', 'hover:bg-blue-600', 'text-white', 'border-blue-500'],
                    secondary: ['bg-gray-100', 'hover:bg-gray-200', 'text-gray-700', 'border-gray-300'],
                    outline: ['bg-transparent', 'hover:bg-blue-50', 'text-blue-500', 'border-blue-500', 'border'],
                    ghost: ['bg-transparent', 'hover:bg-blue-50', 'text-blue-500', 'border-transparent'],
                    danger: ['bg-red-500', 'hover:bg-red-600', 'text-white', 'border-red-500'],
                    success: ['bg-emerald-500', 'hover:bg-emerald-600', 'text-white', 'border-emerald-500'],
                    warning: ['bg-amber-500', 'hover:bg-amber-600', 'text-white', 'border-amber-500']
                };
                
                return variantMap[variant] || variantMap.primary;
            },
            
            getSizeClasses: (size) => {
                const sizeMap = {
                    xs: ['px-2', 'py-1', 'text-xs', 'rounded'],
                    sm: ['px-3', 'py-1.5', 'text-sm', 'rounded-md'],
                    md: ['px-4', 'py-2', 'text-base', 'rounded-md'],
                    lg: ['px-6', 'py-3', 'text-lg', 'rounded-lg'],
                    xl: ['px-8', 'py-4', 'text-xl', 'rounded-lg']
                };
                
                return sizeMap[size] || sizeMap.md;
            },
            
            getStateClasses: (state) => {
                const stateMap = {
                    focused: ['ring-2', 'ring-blue-500', 'ring-opacity-50'],
                    disabled: ['opacity-50', 'cursor-not-allowed', 'pointer-events-none'],
                    loading: ['cursor-wait'],
                    error: ['border-red-500', 'text-red-600'],
                    success: ['border-emerald-500', 'text-emerald-600']
                };
                
                return stateMap[state] || [];
            }
        };
        
        // Appliquer les classes Tremor globalement
        this.applyTremorTheme();
        
        console.log('🎨 Design system Tailwind + Tremor initialisé');
    }
    
    /**
     * Application du thème Tremor
     */
    applyTremorTheme() {
        const tremorTheme = {
            light: {
                background: 'bg-white',
                foreground: 'text-gray-900',
                card: 'bg-white border border-gray-200',
                input: 'bg-white border border-gray-300',
                primary: 'blue',
                secondary: 'gray'
            },
            dark: {
                background: 'bg-gray-900',
                foreground: 'text-gray-100',
                card: 'bg-gray-800 border border-gray-700',
                input: 'bg-gray-800 border border-gray-600',
                primary: 'blue',
                secondary: 'gray'
            }
        };
        
        const currentTheme = tremorTheme[this.config.tremorComponents.theme] || tremorTheme.light;
        
        // Appliquer les classes de base au document
        document.documentElement.classList.add(
            'font-sans',
            'antialiased',
            currentTheme.background,
            currentTheme.foreground
        );
        
        // Stocker le thème actuel
        this.currentTremorTheme = currentTheme;
    }
    
    /**
     * Enregistrement des composants principaux
     */
    registerCoreComponents() {
        // Boutons
        this.register('Button', ButtonComponent);
        this.register('IconButton', IconButtonComponent);
        this.register('ButtonGroup', ButtonGroupComponent);
        
        // Inputs
        this.register('Input', InputComponent);
        this.register('TextArea', TextAreaComponent);
        this.register('Select', SelectComponent);
        this.register('MultiSelect', MultiSelectComponent);
        this.register('AutoComplete', AutoCompleteComponent);
        
        // Navigation
        this.register('Tabs', TabsComponent);
        this.register('Breadcrumb', BreadcrumbComponent);
        this.register('Pagination', PaginationComponent);
        this.register('Stepper', StepperComponent);
        
        // Feedback
        this.register('Alert', AlertComponent);
        this.register('Toast', ToastComponent);
        this.register('Modal', ModalComponent);
        this.register('Tooltip', TooltipComponent);
        this.register('Popover', PopoverComponent);
        
        // Data Display
        this.register('Table', TableComponent);
        this.register('Card', CardComponent);
        this.register('Badge', BadgeComponent);
        this.register('Avatar', AvatarComponent);
        this.register('Progress', ProgressComponent);
        
        // Layout
        this.register('Container', ContainerComponent);
        this.register('Grid', GridComponent);
        this.register('Flex', FlexComponent);
        this.register('Divider', DividerComponent);
        
        // Forms
        this.register('Form', FormComponent);
        this.register('FormField', FormFieldComponent);
        this.register('FormSection', FormSectionComponent);
        this.register('FieldArray', FieldArrayComponent);
        
        // Advanced
        this.register('DatePicker', DatePickerComponent);
        this.register('TimePicker', TimePickerComponent);
        this.register('ColorPicker', ColorPickerComponent);
        this.register('FileUpload', FileUploadComponent);
        this.register('RichTextEditor', RichTextEditorComponent);
        this.register('CodeEditor', CodeEditorComponent);
        this.register('SignaturePad', SignaturePadComponent);
        
        console.log('📦 Composants principaux enregistrés');
    }
    
    /**
     * Enregistrement d'un composant
     */
    register(name, ComponentClass) {
        if (this.components.has(name)) {
            console.warn(`⚠️ Composant "${name}" déjà enregistré, écrasement`);
        }
        
        this.components.set(name, ComponentClass);
        console.log(`✅ Composant "${name}" enregistré`);
    }
    
    /**
     * Création d'un composant
     */
    create(componentName, props = {}, children = []) {
        const ComponentClass = this.components.get(componentName);
        
        if (!ComponentClass) {
            throw new Error(`Composant "${componentName}" non trouvé`);
        }
        
        // Merge avec les props par défaut du design system
        const defaultProps = this.getDefaultProps(componentName);
        const mergedProps = { ...defaultProps, ...props };
        
        // Créer l'instance
        const instance = new ComponentClass(mergedProps, children);
        
        // Appliquer le theming
        this.applyTheme(instance);
        
        // Optimisations performance
        if (this.config.performance.memoization) {
            return this.memoizeComponent(instance);
        }
        
        return instance;
    }
    
    /**
     * Rendu d'un composant avec optimisations
     */
    render(component, container) {
        if (this.config.performance.lazyLoading && this.isOutOfViewport(container)) {
            return this.scheduleRender(component, container);
        }
        
        // Performance monitoring
        const startTime = performance.now();
        
        try {
            const element = component.render();
            
            // Appliquer l'accessibilité
            this.enhanceAccessibility(element, component);
            
            // Appliquer les animations
            this.applyAnimations(element, component);
            
            // Insérer dans le container
            if (container) {
                container.appendChild(element);
            }
            
            // Performance metrics
            const renderTime = performance.now() - startTime;
            this.recordPerformanceMetric('render', renderTime);
            
            return element;
            
        } catch (error) {
            console.error('Erreur rendu composant:', error);
            return this.renderErrorFallback(error);
        }
    }
    
    /**
     * Configuration de l'accessibilité
     */
    setupAccessibility() {
        this.accessibility = {
            // Créer un announcer pour les lecteurs d'écran
            createAnnouncer() {
                const announcer = document.createElement('div');
                announcer.setAttribute('aria-live', 'polite');
                announcer.setAttribute('aria-atomic', 'true');
                announcer.className = 'sr-only';
                announcer.style.cssText = `
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                `;
                
                document.body.appendChild(announcer);
                this.state.accessibility.announcer = announcer;
                
                console.log('📢 Announcer d\'accessibilité créé');
            },
            
            // Annoncer un message
            announce(message, priority = 'polite') {
                if (!this.state.accessibility.announcer) {
                    this.createAnnouncer();
                }
                
                const announcer = this.state.accessibility.announcer;
                announcer.setAttribute('aria-live', priority);
                announcer.textContent = message;
                
                // Clear après un délai
                setTimeout(() => {
                    announcer.textContent = '';
                }, 1000);
            },
            
            // Gestion du focus
            manageFocus() {
                // Focus trap pour les modals
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        this.handleTabNavigation(e);
                    }
                    
                    if (e.key === 'Escape') {
                        this.handleEscapeKey(e);
                    }
                });
            },
            
            handleTabNavigation(e) {
                const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
                if (modal) {
                    const focusableElements = modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            },
            
            // Améliorer l'accessibilité d'un élément
            enhance(element, component) {
                // ARIA labels automatiques
                if (!element.getAttribute('aria-label') && component.props.label) {
                    element.setAttribute('aria-label', component.props.label);
                }
                
                // ARIA descriptions
                if (component.props.description) {
                    const descId = `desc-${component.id}`;
                    const descElement = document.createElement('div');
                    descElement.id = descId;
                    descElement.className = 'sr-only';
                    descElement.textContent = component.props.description;
                    element.appendChild(descElement);
                    element.setAttribute('aria-describedby', descId);
                }
                
                // États ARIA
                if (component.props.disabled) {
                    element.setAttribute('aria-disabled', 'true');
                }
                
                if (component.props.required) {
                    element.setAttribute('aria-required', 'true');
                }
                
                if (component.props.invalid) {
                    element.setAttribute('aria-invalid', 'true');
                }
                
                // Landmarks automatiques
                if (component.type === 'Form') {
                    element.setAttribute('role', 'form');
                }
                
                if (component.type === 'Navigation') {
                    element.setAttribute('role', 'navigation');
                }
                
                // Keyboard navigation
                this.enhanceKeyboardNavigation(element, component);
            },
            
            enhanceKeyboardNavigation(element, component) {
                // Ajout de tabindex si nécessaire
                if (component.props.focusable && !element.hasAttribute('tabindex')) {
                    element.setAttribute('tabindex', '0');
                }
                
                // Gestionnaires de clavier personnalisés
                if (component.keyboardHandlers) {
                    element.addEventListener('keydown', (e) => {
                        const handler = component.keyboardHandlers[e.key];
                        if (handler) {
                            handler(e);
                        }
                    });
                }
            }
        };
        
        this.accessibility.createAnnouncer();
        this.accessibility.manageFocus();
    }
    
    /**
     * Initialisation des animations
     */
    initializeAnimations() {
        this.animationEngine = {
            // Animations prédéfinies
            presets: {
                fadeIn: {
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                    duration: 200,
                    easing: 'ease-out'
                },
                fadeOut: {
                    from: { opacity: 1 },
                    to: { opacity: 0 },
                    duration: 200,
                    easing: 'ease-in'
                },
                slideInUp: {
                    from: { transform: 'translateY(20px)', opacity: 0 },
                    to: { transform: 'translateY(0)', opacity: 1 },
                    duration: 300,
                    easing: 'ease-out'
                },
                slideInDown: {
                    from: { transform: 'translateY(-20px)', opacity: 0 },
                    to: { transform: 'translateY(0)', opacity: 1 },
                    duration: 300,
                    easing: 'ease-out'
                },
                slideInLeft: {
                    from: { transform: 'translateX(-20px)', opacity: 0 },
                    to: { transform: 'translateX(0)', opacity: 1 },
                    duration: 300,
                    easing: 'ease-out'
                },
                slideInRight: {
                    from: { transform: 'translateX(20px)', opacity: 0 },
                    to: { transform: 'translateX(0)', opacity: 1 },
                    duration: 300,
                    easing: 'ease-out'
                },
                scaleIn: {
                    from: { transform: 'scale(0.9)', opacity: 0 },
                    to: { transform: 'scale(1)', opacity: 1 },
                    duration: 200,
                    easing: 'ease-out'
                },
                scaleOut: {
                    from: { transform: 'scale(1)', opacity: 1 },
                    to: { transform: 'scale(0.9)', opacity: 0 },
                    duration: 200,
                    easing: 'ease-in'
                },
                bounce: {
                    keyframes: [
                        { transform: 'scale(1)', offset: 0 },
                        { transform: 'scale(1.1)', offset: 0.5 },
                        { transform: 'scale(1)', offset: 1 }
                    ],
                    duration: 300,
                    easing: 'ease-in-out'
                },
                shake: {
                    keyframes: [
                        { transform: 'translateX(0)', offset: 0 },
                        { transform: 'translateX(-5px)', offset: 0.25 },
                        { transform: 'translateX(5px)', offset: 0.75 },
                        { transform: 'translateX(0)', offset: 1 }
                    ],
                    duration: 400,
                    easing: 'ease-in-out'
                }
            },
            
            // Appliquer une animation
            animate(element, animationName, options = {}) {
                if (!this.config.animations.enabled) {
                    return Promise.resolve();
                }
                
                // Respect des préférences utilisateur
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    return Promise.resolve();
                }
                
                const preset = this.presets[animationName];
                if (!preset) {
                    console.warn(`Animation "${animationName}" non trouvée`);
                    return Promise.resolve();
                }
                
                const animationOptions = {
                    duration: options.duration || preset.duration || 300,
                    easing: options.easing || preset.easing || 'ease',
                    fill: 'both'
                };
                
                let animation;
                
                if (preset.keyframes) {
                    animation = element.animate(preset.keyframes, animationOptions);
                } else {
                    animation = element.animate([preset.from, preset.to], animationOptions);
                }
                
                return animation.finished;
            },
            
            // Animation d'entrée
            enter(element, animationName = 'fadeIn') {
                element.style.visibility = 'hidden';
                
                requestAnimationFrame(() => {
                    element.style.visibility = 'visible';
                    this.animate(element, animationName);
                });
            },
            
            // Animation de sortie
            async exit(element, animationName = 'fadeOut') {
                await this.animate(element, animationName);
                element.style.visibility = 'hidden';
            },
            
            // Transition entre états
            transition(element, fromState, toState, duration = 300) {
                return element.animate([fromState, toState], {
                    duration,
                    easing: 'ease-in-out',
                    fill: 'both'
                }).finished;
            }
        };
        
        console.log('✨ Moteur d\'animations initialisé');
    }
    
    /**
     * Configuration des optimisations de performance
     */
    setupPerformanceOptimizations() {
        this.performance = {
            // Cache des composants
            componentCache: new Map(),
            
            // Mémorisation des composants
            memoize(component) {
                const cacheKey = this.generateCacheKey(component);
                
                if (this.componentCache.has(cacheKey)) {
                    return this.componentCache.get(cacheKey);
                }
                
                const rendered = component.render();
                this.componentCache.set(cacheKey, rendered);
                
                return rendered;
            },
            
            generateCacheKey(component) {
                return `${component.type}_${JSON.stringify(component.props)}_${component.children.length}`;
            },
            
            // Lazy loading
            observeIntersection() {
                if ('IntersectionObserver' in window) {
                    this.intersectionObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const element = entry.target;
                                const pendingRender = element._pendingRender;
                                
                                if (pendingRender) {
                                    this.executeRender(pendingRender);
                                    this.intersectionObserver.unobserve(element);
                                }
                            }
                        });
                    }, {
                        rootMargin: '50px'
                    });
                }
            },
            
            scheduleRender(component, container) {
                const placeholder = document.createElement('div');
                placeholder.className = 'ui-component-placeholder';
                placeholder.style.minHeight = '1px';
                placeholder._pendingRender = { component, container };
                
                container.appendChild(placeholder);
                
                if (this.intersectionObserver) {
                    this.intersectionObserver.observe(placeholder);
                }
                
                return placeholder;
            },
            
            executeRender(pendingRender) {
                const { component, container } = pendingRender;
                const element = this.render(component, null);
                container.replaceChild(element, container.querySelector('.ui-component-placeholder'));
            },
            
            // Debounce pour les événements fréquents
            debounce(func, delay) {
                let timeoutId;
                return function (...args) {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => func.apply(this, args), delay);
                };
            },
            
            // Métriques de performance
            metrics: {
                renderTimes: [],
                componentCounts: new Map(),
                memoryUsage: []
            },
            
            recordMetric(type, value) {
                switch (type) {
                    case 'render':
                        this.metrics.renderTimes.push(value);
                        if (this.metrics.renderTimes.length > 100) {
                            this.metrics.renderTimes = this.metrics.renderTimes.slice(-50);
                        }
                        break;
                        
                    case 'component':
                        const current = this.metrics.componentCounts.get(value) || 0;
                        this.metrics.componentCounts.set(value, current + 1);
                        break;
                        
                    case 'memory':
                        if ('memory' in performance) {
                            this.metrics.memoryUsage.push(performance.memory.usedJSHeapSize);
                            if (this.metrics.memoryUsage.length > 50) {
                                this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-25);
                            }
                        }
                        break;
                }
            },
            
            getAverageRenderTime() {
                if (this.metrics.renderTimes.length === 0) return 0;
                const sum = this.metrics.renderTimes.reduce((a, b) => a + b, 0);
                return sum / this.metrics.renderTimes.length;
            }
        };
        
        this.performance.observeIntersection();
        console.log('⚡ Optimisations de performance configurées');
    }
    
    /**
     * Liaison des événements globaux
     */
    bindGlobalEvents() {
        // Gestion des préférences d'accessibilité
        const mediaQueries = {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
            highContrast: window.matchMedia('(prefers-contrast: high)'),
            colorScheme: window.matchMedia('(prefers-color-scheme: dark)')
        };
        
        Object.entries(mediaQueries).forEach(([key, mediaQuery]) => {
            mediaQuery.addEventListener('change', (e) => {
                this.handleMediaQueryChange(key, e.matches);
            });
            
            // Appliquer l'état initial
            this.handleMediaQueryChange(key, mediaQuery.matches);
        });
        
        // Gestion du redimensionnement
        window.addEventListener('resize', this.performance.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Nettoyage automatique
        setInterval(() => {
            this.cleanup();
        }, 60000); // Toutes les minutes
        
        console.log('🔗 Événements globaux liés');
    }
    
    /**
     * Gestion des changements de media queries
     */
    handleMediaQueryChange(type, matches) {
        switch (type) {
            case 'reducedMotion':
                this.config.accessibility.reducedMotion = matches;
                this.config.animations.enabled = !matches;
                console.log(`♿ Mouvement réduit: ${matches ? 'activé' : 'désactivé'}`);
                break;
                
            case 'highContrast':
                this.config.accessibility.highContrast = matches;
                document.documentElement.classList.toggle('high-contrast', matches);
                console.log(`🔍 Contraste élevé: ${matches ? 'activé' : 'désactivé'}`);
                break;
                
            case 'colorScheme':
                this.applyColorScheme(matches ? 'dark' : 'light');
                console.log(`🌓 Schéma de couleurs: ${matches ? 'sombre' : 'clair'}`);
                break;
        }
    }
    
    /**
     * Application d'un schéma de couleurs
     */
    applyColorScheme(scheme) {
        document.documentElement.setAttribute('data-color-scheme', scheme);
        
        const event = new CustomEvent('colorSchemeChanged', {
            detail: { scheme }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Gestion du redimensionnement
     */
    handleResize() {
        // Recalculer les composants responsive
        const responsiveComponents = document.querySelectorAll('[data-responsive="true"]');
        
        responsiveComponents.forEach(element => {
            const component = element._uiComponent;
            if (component && component.handleResize) {
                component.handleResize();
            }
        });
        
        // Émettre l'événement de redimensionnement
        const event = new CustomEvent('uiResize', {
            detail: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Nettoyage automatique
     */
    cleanup() {
        // Nettoyer le cache des composants
        if (this.performance.componentCache.size > 100) {
            const entries = Array.from(this.performance.componentCache.entries());
            const toKeep = entries.slice(-50);
            this.performance.componentCache.clear();
            toKeep.forEach(([key, value]) => {
                this.performance.componentCache.set(key, value);
            });
        }
        
        // Nettoyer les éléments orphelins
        const orphanElements = document.querySelectorAll('[data-ui-component][data-cleanup="true"]');
        orphanElements.forEach(element => {
            if (!element.isConnected) {
                element.remove();
            }
        });
        
        // Enregistrer les métriques de mémoire
        this.performance.recordMetric('memory');
    }
    
    /**
     * Obtenir les props par défaut d'un composant
     */
    getDefaultProps(componentName) {
        const defaults = {
            Button: {
                variant: 'primary',
                size: 'md',
                disabled: false,
                loading: false
            },
            Input: {
                type: 'text',
                size: 'md',
                disabled: false,
                required: false
            },
            Modal: {
                backdrop: true,
                keyboard: true,
                focus: true,
                centered: false
            }
        };
        
        return defaults[componentName] || {};
    }
    
    /**
     * Application du thème à un composant
     */
    applyTheme(component) {
        const theme = this.themes.get(this.state.currentTheme);
        if (theme && theme.components && theme.components[component.type]) {
            const componentTheme = theme.components[component.type];
            Object.assign(component.props, componentTheme);
        }
    }
    
    /**
     * Amélioration de l'accessibilité
     */
    enhanceAccessibility(element, component) {
        this.accessibility.enhance(element, component);
    }
    
    /**
     * Application des animations
     */
    applyAnimations(element, component) {
        if (component.animation && component.animation.enter) {
            this.animationEngine.enter(element, component.animation.enter);
        }
    }
    
    /**
     * API publique
     */
    
    // Créer et rendre un composant
    createElement(type, props, ...children) {
        return this.create(type, props, children);
    }
    
    // Rendre directement dans un container
    renderTo(componentOrElement, container) {
        if (typeof componentOrElement === 'string') {
            container.innerHTML = componentOrElement;
        } else if (componentOrElement.render) {
            return this.render(componentOrElement, container);
        } else {
            container.appendChild(componentOrElement);
        }
    }
    
    // Changer de thème
    setTheme(themeName) {
        if (this.themes.has(themeName)) {
            this.state.currentTheme = themeName;
            
            const event = new CustomEvent('themeChanged', {
                detail: { theme: themeName }
            });
            document.dispatchEvent(event);
            
            console.log(`🎨 Thème changé: ${themeName}`);
        }
    }
    
    // Enregistrer un thème
    registerTheme(name, theme) {
        this.themes.set(name, theme);
        console.log(`🎨 Thème "${name}" enregistré`);
    }
    
    // Obtenir les métriques de performance
    getPerformanceMetrics() {
        return {
            averageRenderTime: this.performance.getAverageRenderTime(),
            componentCounts: Object.fromEntries(this.performance.metrics.componentCounts),
            cacheSize: this.performance.componentCache.size,
            memoryTrend: this.performance.metrics.memoryUsage.slice(-10)
        };
    }
    
    // Annoncer un message d'accessibilité
    announce(message, priority = 'polite') {
        this.accessibility.announce(message, priority);
    }
}

// Export pour compatibilité navigateur
window.UIComponentLibrary = UIComponentLibrary;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.uiComponentLibrary) {
        window.uiComponentLibrary = new UIComponentLibrary();
        console.log('🎨 UIComponentLibrary initialisée globalement');
    }
});
