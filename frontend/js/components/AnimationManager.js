/**
 * 🎨 Animation Manager - Gestionnaire centralisé d'animations
 * Optimisé pour performance GPU et transitions fluides
 */

class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.observers = new Map();
        this.config = {
            duration: {
                fast: 150,
                normal: 300,
                slow: 500
            },
            easing: {
                ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
                easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
                easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
                bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
        };
        
        this.initializeIntersectionObserver();
        this.setupReducedMotionPreference();
    }

    /**
     * 🔄 Micro-animations pour interactions
     */
    microInteraction(element, type = 'pulse', options = {}) {
        const defaultOptions = {
            duration: this.config.duration.fast,
            easing: this.config.easing.bounce
        };
        
        const animOptions = { ...defaultOptions, ...options };
        
        const animations = {
            pulse: () => this.animate(element, [
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.05)', opacity: 0.9 },
                { transform: 'scale(1)', opacity: 1 }
            ], animOptions),
            
            shake: () => this.animate(element, [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(3px)' },
                { transform: 'translateX(0)' }
            ], { ...animOptions, duration: animOptions.duration * 2 }),
            
            bounce: () => this.animate(element, [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' },
                { transform: 'translateY(-5px)' },
                { transform: 'translateY(0)' }
            ], { ...animOptions, duration: animOptions.duration * 1.5 }),
            
            glow: () => this.animate(element, [
                { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
                { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
                { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' }
            ], animOptions),
            
            flip: () => this.animate(element, [
                { transform: 'rotateY(0deg)' },
                { transform: 'rotateY(180deg)' },
                { transform: 'rotateY(0deg)' }
            ], { ...animOptions, duration: animOptions.duration * 2 })
        };
        
        if (animations[type]) {
            return animations[type]();
        } else {
            console.warn(`Animation type "${type}" not found`);
            return Promise.resolve();
        }
    }

    /**
     * 🔀 Transitions entre états
     */
    stateTransition(element, fromState, toState, options = {}) {
        const defaultOptions = {
            duration: this.config.duration.normal,
            easing: this.config.easing.easeInOut
        };
        
        const animOptions = { ...defaultOptions, ...options };
        
        const transitions = {
            fadeIn: {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
            },
            fadeOut: {
                from: { opacity: 1, transform: 'translateY(0)' },
                to: { opacity: 0, transform: 'translateY(-20px)' }
            },
            slideInLeft: {
                from: { opacity: 0, transform: 'translateX(-100%)' },
                to: { opacity: 1, transform: 'translateX(0)' }
            },
            slideInRight: {
                from: { opacity: 0, transform: 'translateX(100%)' },
                to: { opacity: 1, transform: 'translateX(0)' }
            },
            slideOutLeft: {
                from: { opacity: 1, transform: 'translateX(0)' },
                to: { opacity: 0, transform: 'translateX(-100%)' }
            },
            slideOutRight: {
                from: { opacity: 1, transform: 'translateX(0)' },
                to: { opacity: 0, transform: 'translateX(100%)' }
            },
            scaleIn: {
                from: { opacity: 0, transform: 'scale(0.8)' },
                to: { opacity: 1, transform: 'scale(1)' }
            },
            scaleOut: {
                from: { opacity: 1, transform: 'scale(1)' },
                to: { opacity: 0, transform: 'scale(0.8)' }
            },
            rotateIn: {
                from: { opacity: 0, transform: 'rotate(-180deg) scale(0.8)' },
                to: { opacity: 1, transform: 'rotate(0deg) scale(1)' }
            }
        };
        
        const transition = transitions[toState];
        if (!transition) {
            console.warn(`Transition "${toState}" not found`);
            return Promise.resolve();
        }
        
        // Appliquer l'état initial
        Object.assign(element.style, transition.from);
        
        // Animer vers l'état final
        return this.animate(element, [transition.from, transition.to], animOptions);
    }

    /**
     * 📱 Animations responsives (scroll-triggered)
     */
    onScrollAnimation(element, animationType = 'fadeIn', options = {}) {
        const defaultOptions = {
            threshold: 0.1,
            duration: this.config.duration.normal,
            easing: this.config.easing.easeOut,
            once: true
        };
        
        const animOptions = { ...defaultOptions, ...options };
        
        // Créer un observer pour cet élément
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.stateTransition(entry.target, 'hidden', animationType, animOptions)
                        .then(() => {
                            if (animOptions.once) {
                                observer.unobserve(entry.target);
                            }
                        });
                }
            });
        }, {
            threshold: animOptions.threshold,
            rootMargin: '50px'
        });
        
        // Configurer l'état initial
        this.stateTransition(element, 'visible', 'fadeOut', { duration: 0 });
        
        // Observer l'élément
        observer.observe(element);
        this.observers.set(element, observer);
        
        return observer;
    }

    /**
     * 🎯 Animation de focus pour accessibilité
     */
    focusAnimation(element, options = {}) {
        const defaultOptions = {
            duration: this.config.duration.fast,
            easing: this.config.easing.easeOut,
            color: '#3b82f6'
        };
        
        const animOptions = { ...defaultOptions, ...options };
        
        return this.animate(element, [
            { 
                outline: 'none',
                boxShadow: `0 0 0 0px ${animOptions.color}40`
            },
            { 
                outline: `2px solid ${animOptions.color}`,
                boxShadow: `0 0 0 4px ${animOptions.color}20`
            }
        ], animOptions);
    }

    /**
     * 💫 Animation de chargement
     */
    loadingAnimation(element, type = 'spinner', options = {}) {
        const defaultOptions = {
            duration: 1000,
            iterations: Infinity,
            easing: 'linear'
        };
        
        const animOptions = { ...defaultOptions, ...options };
        
        const loadingTypes = {
            spinner: [
                { transform: 'rotate(0deg)' },
                { transform: 'rotate(360deg)' }
            ],
            pulse: [
                { opacity: 0.3, transform: 'scale(0.8)' },
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0.3, transform: 'scale(0.8)' }
            ],
            wave: [
                { transform: 'translateX(-100%)' },
                { transform: 'translateX(100%)' }
            ],
            dots: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' }
            ]
        };
        
        const animation = this.animate(element, loadingTypes[type], animOptions);
        this.animations.set(element, animation);
        
        return animation;
    }

    /**
     * 🎨 Animation personnalisée avec keyframes
     */
    customAnimation(element, keyframes, options = {}) {
        const defaultOptions = {
            duration: this.config.duration.normal,
            easing: this.config.easing.ease,
            fill: 'forwards'
        };
        
        return this.animate(element, keyframes, { ...defaultOptions, ...options });
    }

    /**
     * 🔧 Méthode d'animation de base (wrapper Web Animations API)
     */
    animate(element, keyframes, options = {}) {
        if (this.prefersReducedMotion) {
            // Mode réduit : application immédiate du dernier keyframe
            if (keyframes.length > 0) {
                Object.assign(element.style, keyframes[keyframes.length - 1]);
            }
            return Promise.resolve();
        }
        
        try {
            const animation = element.animate(keyframes, options);
            
            // Optimisation GPU
            element.style.willChange = 'transform, opacity';
            
            animation.addEventListener('finish', () => {
                element.style.willChange = 'auto';
            });
            
            return animation.finished;
        } catch (error) {
            console.warn('Animation failed:', error);
            return Promise.resolve();
        }
    }

    /**
     * ⏹️ Arrêter une animation
     */
    stop(element) {
        const animation = this.animations.get(element);
        if (animation) {
            animation.cancel();
            this.animations.delete(element);
        }
        
        const observer = this.observers.get(element);
        if (observer) {
            observer.unobserve(element);
            this.observers.delete(element);
        }
        
        element.style.willChange = 'auto';
    }

    /**
     * ⏸️ Mettre en pause une animation
     */
    pause(element) {
        const animation = this.animations.get(element);
        if (animation) {
            animation.pause();
        }
    }

    /**
     * ▶️ Reprendre une animation
     */
    resume(element) {
        const animation = this.animations.get(element);
        if (animation) {
            animation.play();
        }
    }

    /**
     * 🧹 Nettoyer toutes les animations
     */
    cleanup() {
        this.animations.forEach((animation, element) => {
            this.stop(element);
        });
        
        this.observers.forEach((observer, element) => {
            observer.disconnect();
        });
        
        this.animations.clear();
        this.observers.clear();
    }

    /**
     * 🔧 Configuration des préférences d'accessibilité
     */
    setupReducedMotionPreference() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Écouter les changements de préférence
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.prefersReducedMotion = e.matches;
        });
    }

    /**
     * 👁️ Initialiser l'Intersection Observer global
     */
    initializeIntersectionObserver() {
        this.globalObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-viewport');
                } else {
                    entry.target.classList.remove('in-viewport');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
    }

    /**
     * 📊 Statistiques de performance
     */
    getStats() {
        return {
            activeAnimations: this.animations.size,
            activeObservers: this.observers.size,
            prefersReducedMotion: this.prefersReducedMotion,
            supportedFeatures: {
                webAnimations: 'animate' in Element.prototype,
                intersectionObserver: 'IntersectionObserver' in window,
                cssAnimations: CSS.supports('animation-name', 'test')
            }
        };
    }

    /**
     * 🎯 Méthodes utilitaires pour intégration facile
     */
    
    // Animation d'apparition pour nouveaux éléments
    appearElement(element, delay = 0) {
        setTimeout(() => {
            this.stateTransition(element, 'hidden', 'fadeIn');
        }, delay);
    }
    
    // Animation de disparition pour suppression
    disappearElement(element, callback) {
        this.stateTransition(element, 'visible', 'fadeOut')
            .then(() => {
                if (callback) callback();
            });
    }
    
    // Animation de succès
    success(element) {
        return this.microInteraction(element, 'bounce')
            .then(() => this.microInteraction(element, 'glow'));
    }
    
    // Animation d'erreur
    error(element) {
        return this.microInteraction(element, 'shake');
    }
}

// Instance globale
window.AnimationManager = new AnimationManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}

/**
 * 🎨 UTILISATION EXEMPLES:
 * 
 * // Micro-interaction sur bouton
 * button.addEventListener('click', () => {
 *     AnimationManager.microInteraction(button, 'pulse');
 * });
 * 
 * // Transition d'état
 * AnimationManager.stateTransition(modal, 'hidden', 'fadeIn');
 * 
 * // Animation au scroll
 * AnimationManager.onScrollAnimation(card, 'slideInLeft');
 * 
 * // Animation de chargement
 * AnimationManager.loadingAnimation(spinner, 'spinner');
 * 
 * // Animation de succès
 * AnimationManager.success(submitButton);
 * 
 * // Animation d'erreur
 * AnimationManager.error(errorField);
 */
