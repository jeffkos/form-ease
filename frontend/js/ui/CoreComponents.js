/**
 * 🧩 CoreComponents.js - FormEase Sprint 5 Phase 1
 * 
 * Composants UI de base pour FormEase
 * Implementation complète des composants essentiels
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 1
 */

/**
 * Classe de base pour tous les composants UI
 */
class BaseComponent {
    constructor(props = {}, children = []) {
        this.props = { ...this.getDefaultProps(), ...props };
        this.children = children;
        this.type = this.constructor.name;
        this.id = this.generateId();
        this.state = {};
        this.element = null;
        this.eventListeners = new Map();
        
        this.init();
    }
    
    init() {
        // Hook d'initialisation pour les sous-classes
    }
    
    getDefaultProps() {
        return {};
    }
    
    generateId() {
        return `ui-${this.type.toLowerCase()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    setState(newState) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.onStateChange(prevState, this.state);
    }
    
    onStateChange(prevState, newState) {
        // Hook pour réagir aux changements d'état
        if (this.element) {
            this.update();
        }
    }
    
    render() {
        throw new Error('La méthode render() doit être implémentée');
    }
    
    update() {
        if (this.element && this.element.parentNode) {
            const newElement = this.render();
            this.element.parentNode.replaceChild(newElement, this.element);
            this.element = newElement;
        }
    }
    
    addEventListener(event, handler) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(handler);
        
        if (this.element) {
            this.element.addEventListener(event, handler);
        }
    }
    
    removeEventListener(event, handler) {
        const handlers = this.eventListeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                if (this.element) {
                    this.element.removeEventListener(event, handler);
                }
            }
        }
    }
    
    destroy() {
        // Nettoyer les événements
        for (const [event, handlers] of this.eventListeners) {
            handlers.forEach(handler => {
                if (this.element) {
                    this.element.removeEventListener(event, handler);
                }
            });
        }
        
        // Supprimer l'élément du DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.eventListeners.clear();
    }
    
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }
    
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }
    
    toggleClass(className, force) {
        if (this.element) {
            this.element.classList.toggle(className, force);
        }
    }
    
    getAttribute(name) {
        return this.element ? this.element.getAttribute(name) : null;
    }
    
    setAttribute(name, value) {
        if (this.element) {
            this.element.setAttribute(name, value);
        }
    }
    
    focus() {
        if (this.element && this.element.focus) {
            this.element.focus();
        }
    }
    
    blur() {
        if (this.element && this.element.blur) {
            this.element.blur();
        }
    }
}

/**
 * Composant Button
 */
class ButtonComponent extends BaseComponent {
    getDefaultProps() {
        return {
            type: 'button',
            variant: 'primary',
            size: 'md',
            disabled: false,
            loading: false,
            icon: null,
            iconPosition: 'left',
            fullWidth: false,
            rounded: false,
            onClick: () => {}
        };
    }
    
    init() {
        this.addEventListener('click', this.handleClick.bind(this));
    }
    
    handleClick(e) {
        if (this.props.disabled || this.props.loading) {
            e.preventDefault();
            return;
        }
        
        this.props.onClick(e);
        
        // Animation de clic
        this.addClass('ui-button--clicked');
        setTimeout(() => {
            this.removeClass('ui-button--clicked');
        }, 150);
    }
    
    render() {
        const button = document.createElement('button');
        button.type = this.props.type;
        button.disabled = this.props.disabled || this.props.loading;
        button.id = this.id;
        
        // Classes Tailwind CSS
        const baseClasses = [
            'inline-flex', 'items-center', 'justify-center', 'font-medium', 'text-center',
            'border', 'transition-all', 'duration-200', 'focus:outline-none', 'focus:ring-2',
            'focus:ring-offset-2', 'disabled:opacity-50', 'disabled:cursor-not-allowed'
        ];
        
        // Classes de variante
        const variantClasses = this.getVariantClasses();
        
        // Classes de taille
        const sizeClasses = this.getSizeClasses();
        
        // Classes d'état
        const stateClasses = [];
        if (this.props.fullWidth) stateClasses.push('w-full');
        if (this.props.rounded) stateClasses.push('rounded-full');
        if (this.props.loading) stateClasses.push('cursor-wait');
        
        const allClasses = [...baseClasses, ...variantClasses, ...sizeClasses, ...stateClasses];
        button.className = allClasses.join(' ');
        
        // Contenu du bouton
        const content = document.createElement('span');
        content.className = 'flex items-center justify-center gap-2';
        
        // Icône de chargement
        if (this.props.loading) {
            const spinner = document.createElement('span');
            spinner.className = 'w-4 h-4 animate-spin';
            spinner.innerHTML = `
                <svg class="w-full h-full" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
            `;
            content.appendChild(spinner);
        }
        
        // Icône normale
        if (this.props.icon && !this.props.loading) {
            const icon = document.createElement('span');
            icon.className = `w-4 h-4 ${this.props.iconPosition === 'right' ? 'order-2' : 'order-1'}`;
            
            if (typeof this.props.icon === 'string') {
                icon.innerHTML = this.props.icon;
            } else {
                icon.appendChild(this.props.icon);
            }
            
            content.appendChild(icon);
        }
        
        // Texte
        if (this.children.length > 0 || this.props.text) {
            const text = document.createElement('span');
            text.className = this.props.icon ? 'order-1' : '';
            text.textContent = this.props.text || this.children.join('');
            content.appendChild(text);
        }
        
        button.appendChild(content);
        
        // ARIA
        if (this.props.ariaLabel) {
            button.setAttribute('aria-label', this.props.ariaLabel);
        }
        
        if (this.props.loading) {
            button.setAttribute('aria-busy', 'true');
        }
        
        this.element = button;
        this.bindEvents();
        
        return button;
    }
    
    getVariantClasses() {
        const variants = {
            primary: [
                'bg-blue-500', 'hover:bg-blue-600', 'active:bg-blue-700',
                'text-white', 'border-blue-500', 'focus:ring-blue-500'
            ],
            secondary: [
                'bg-gray-100', 'hover:bg-gray-200', 'active:bg-gray-300',
                'text-gray-700', 'border-gray-300', 'focus:ring-gray-500'
            ],
            outline: [
                'bg-transparent', 'hover:bg-blue-50', 'active:bg-blue-100',
                'text-blue-500', 'border-blue-500', 'focus:ring-blue-500'
            ],
            ghost: [
                'bg-transparent', 'hover:bg-blue-50', 'active:bg-blue-100',
                'text-blue-500', 'border-transparent', 'focus:ring-blue-500'
            ],
            danger: [
                'bg-red-500', 'hover:bg-red-600', 'active:bg-red-700',
                'text-white', 'border-red-500', 'focus:ring-red-500'
            ]
        };
        
        return variants[this.props.variant] || variants.primary;
    }
    
    getSizeClasses() {
        const sizes = {
            xs: ['px-2', 'py-1', 'text-xs', 'rounded'],
            sm: ['px-3', 'py-1.5', 'text-sm', 'rounded-md'],
            md: ['px-4', 'py-2', 'text-base', 'rounded-md'],
            lg: ['px-6', 'py-3', 'text-lg', 'rounded-lg'],
            xl: ['px-8', 'py-4', 'text-xl', 'rounded-lg']
        };
        
        return sizes[this.props.size] || sizes.md;
    }
    
    bindEvents() {
        this.eventListeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                this.element.addEventListener(event, handler);
            });
        });
    }
}

/**
 * Composant Input
 */
class InputComponent extends BaseComponent {
    getDefaultProps() {
        return {
            type: 'text',
            size: 'md',
            disabled: false,
            required: false,
            readonly: false,
            placeholder: '',
            value: '',
            label: '',
            error: '',
            hint: '',
            icon: null,
            iconPosition: 'left',
            clearable: false,
            onInput: () => {},
            onChange: () => {},
            onFocus: () => {},
            onBlur: () => {}
        };
    }
    
    init() {
        this.state = {
            focused: false,
            value: this.props.value
        };
        
        this.addEventListener('input', this.handleInput.bind(this));
        this.addEventListener('change', this.handleChange.bind(this));
        this.addEventListener('focus', this.handleFocus.bind(this));
        this.addEventListener('blur', this.handleBlur.bind(this));
    }
    
    handleInput(e) {
        this.setState({ value: e.target.value });
        this.props.onInput(e.target.value, e);
    }
    
    handleChange(e) {
        this.props.onChange(e.target.value, e);
    }
    
    handleFocus(e) {
        this.setState({ focused: true });
        this.props.onFocus(e);
    }
    
    handleBlur(e) {
        this.setState({ focused: false });
        this.props.onBlur(e);
    }
    
    handleClear() {
        this.setState({ value: '' });
        this.props.onInput('');
        this.props.onChange('');
        
        if (this.element) {
            const input = this.element.querySelector('input');
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'space-y-2';
        container.id = this.id;
        
        // Label
        if (this.props.label) {
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
            label.textContent = this.props.label;
            label.setAttribute('for', `${this.id}-input`);
            
            if (this.props.required) {
                const required = document.createElement('span');
                required.className = 'text-red-500 ml-1';
                required.textContent = '*';
                label.appendChild(required);
            }
            
            container.appendChild(label);
        }
        
        // Wrapper d'input
        const wrapper = document.createElement('div');
        wrapper.className = this.getInputWrapperClasses();
        
        // Icône gauche
        if (this.props.icon && this.props.iconPosition === 'left') {
            const icon = document.createElement('span');
            icon.className = 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4';
            icon.innerHTML = this.props.icon;
            wrapper.appendChild(icon);
        }
        
        // Input
        const input = document.createElement('input');
        input.type = this.props.type;
        input.id = `${this.id}-input`;
        input.className = this.getInputFieldClasses();
        input.placeholder = this.props.placeholder;
        input.value = this.state.value;
        input.disabled = this.props.disabled;
        input.readonly = this.props.readonly;
        input.required = this.props.required;
        
        // ARIA
        if (this.props.error) {
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', `${this.id}-error`);
        }
        
        if (this.props.hint) {
            input.setAttribute('aria-describedby', `${this.id}-hint`);
        }
        
        wrapper.appendChild(input);
        
        // Bouton clear
        if (this.props.clearable && this.state.value) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center';
            clearBtn.innerHTML = '×';
            clearBtn.setAttribute('aria-label', 'Effacer');
            clearBtn.addEventListener('click', this.handleClear.bind(this));
            wrapper.appendChild(clearBtn);
        }
        
        // Icône droite
        if (this.props.icon && this.props.iconPosition === 'right' && (!this.props.clearable || !this.state.value)) {
            const icon = document.createElement('span');
            icon.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4';
            icon.innerHTML = this.props.icon;
            wrapper.appendChild(icon);
        }
        
        container.appendChild(wrapper);
        
        // Message d'erreur
        if (this.props.error) {
            const error = document.createElement('div');
            error.id = `${this.id}-error`;
            error.className = 'flex items-center gap-1 text-sm text-red-600 dark:text-red-400';
            error.innerHTML = `
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                ${this.props.error}
            `;
            error.setAttribute('role', 'alert');
            container.appendChild(error);
        }
        
        // Texte d'aide
        if (this.props.hint && !this.props.error) {
            const hint = document.createElement('div');
            hint.id = `${this.id}-hint`;
            hint.className = 'text-sm text-gray-500 dark:text-gray-400';
            hint.textContent = this.props.hint;
            container.appendChild(hint);
        }
        
        this.element = container;
        this.bindEvents();
        
        return container;
    }
    
    getInputWrapperClasses() {
        const baseClasses = ['relative'];
        return baseClasses.join(' ');
    }
    
    getInputFieldClasses() {
        const baseClasses = [
            'block', 'w-full', 'border', 'rounded-md', 'shadow-sm',
            'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500',
            'disabled:opacity-50', 'disabled:cursor-not-allowed',
            'transition-colors', 'duration-200'
        ];
        
        // Classes de taille
        const sizeClasses = this.getSizeClasses();
        
        // Classes d'état
        const stateClasses = [];
        if (this.props.error) {
            stateClasses.push('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        } else {
            stateClasses.push('border-gray-300', 'dark:border-gray-600');
        }
        
        if (this.props.disabled) {
            stateClasses.push('bg-gray-50', 'dark:bg-gray-700');
        } else if (this.props.readonly) {
            stateClasses.push('bg-gray-50', 'dark:bg-gray-700');
        } else {
            stateClasses.push('bg-white', 'dark:bg-gray-800');
        }
        
        // Padding pour les icônes
        if (this.props.icon && this.props.iconPosition === 'left') {
            stateClasses.push('pl-10');
        }
        
        if ((this.props.icon && this.props.iconPosition === 'right') || this.props.clearable) {
            stateClasses.push('pr-10');
        }
        
        stateClasses.push('text-gray-900', 'dark:text-gray-100');
        stateClasses.push('placeholder-gray-400', 'dark:placeholder-gray-500');
        
        return [...baseClasses, ...sizeClasses, ...stateClasses].join(' ');
    }
    
    getSizeClasses() {
        const sizes = {
            sm: ['px-3', 'py-1.5', 'text-sm'],
            md: ['px-3', 'py-2', 'text-base'],
            lg: ['px-4', 'py-3', 'text-lg']
        };
        
        return sizes[this.props.size] || sizes.md;
    }
    
    bindEvents() {
        const input = this.element.querySelector('input');
        if (input) {
            this.eventListeners.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    input.addEventListener(event, handler);
                });
            });
        }
    }
    
    getValue() {
        return this.state.value;
    }
    
    setValue(value) {
        this.setState({ value });
        const input = this.element.querySelector('input');
        if (input) {
            input.value = value;
        }
    }
}

/**
 * Composant Modal
 */
class ModalComponent extends BaseComponent {
    getDefaultProps() {
        return {
            open: false,
            backdrop: true,
            keyboard: true,
            focus: true,
            centered: false,
            size: 'md',
            title: '',
            closable: true,
            onClose: () => {},
            onOpen: () => {},
            onBackdropClick: null
        };
    }
    
    init() {
        this.state = {
            isOpen: this.props.open
        };
        
        this.previousActiveElement = null;
        this.focusableElements = [];
        
        if (this.props.keyboard) {
            this.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }
    
    open() {
        if (this.state.isOpen) return;
        
        this.previousActiveElement = document.activeElement;
        this.setState({ isOpen: true });
        
        // Ajouter au DOM
        document.body.appendChild(this.element);
        
        // Gérer le focus
        if (this.props.focus) {
            this.manageFocus();
        }
        
        // Bloquer le scroll du body
        document.body.style.overflow = 'hidden';
        
        // Animation d'ouverture
        requestAnimationFrame(() => {
            this.addClass('ui-modal--open');
        });
        
        this.props.onOpen();
        
        // Annoncer aux lecteurs d'écran
        if (window.uiComponentLibrary) {
            window.uiComponentLibrary.announce(`Modal ouverte: ${this.props.title || 'Dialog'}`);
        }
    }
    
    close() {
        if (!this.state.isOpen) return;
        
        // Animation de fermeture
        this.removeClass('ui-modal--open');
        
        setTimeout(() => {
            this.setState({ isOpen: false });
            
            // Retirer du DOM
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            
            // Restaurer le scroll
            document.body.style.overflow = '';
            
            // Restaurer le focus
            if (this.previousActiveElement) {
                this.previousActiveElement.focus();
            }
            
            this.props.onClose();
            
            // Annoncer aux lecteurs d'écran
            if (window.uiComponentLibrary) {
                window.uiComponentLibrary.announce('Modal fermée');
            }
        }, 200);
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.props.keyboard) {
            this.close();
        }
        
        if (e.key === 'Tab') {
            this.handleTabKey(e);
        }
    }
    
    handleTabKey(e) {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
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
    
    handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            if (this.props.onBackdropClick) {
                this.props.onBackdropClick();
            } else if (this.props.backdrop) {
                this.close();
            }
        }
    }
    
    manageFocus() {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            this.element.focus();
        }
    }
    
    render() {
        const overlay = document.createElement('div');
        overlay.className = this.getOverlayClasses();
        overlay.id = this.id;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('tabindex', '-1');
        
        if (this.props.title) {
            overlay.setAttribute('aria-labelledby', `${this.id}-title`);
        }
        
        // Gestionnaire de clic sur le backdrop
        if (this.props.backdrop) {
            overlay.addEventListener('click', this.handleBackdropClick.bind(this));
        }
        
        // Modal
        const modal = document.createElement('div');
        modal.className = this.getModalClasses();
        modal.addEventListener('click', (e) => e.stopPropagation());
        
        // En-tête
        if (this.props.title || this.props.closable) {
            const header = document.createElement('div');
            header.className = 'ui-modal__header';
            
            if (this.props.title) {
                const title = document.createElement('h2');
                title.id = `${this.id}-title`;
                title.className = 'ui-modal__title';
                title.textContent = this.props.title;
                header.appendChild(title);
            }
            
            if (this.props.closable) {
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'ui-modal__close';
                closeBtn.innerHTML = '×';
                closeBtn.setAttribute('aria-label', 'Fermer');
                closeBtn.addEventListener('click', () => this.close());
                header.appendChild(closeBtn);
            }
            
            modal.appendChild(header);
        }
        
        // Corps
        const body = document.createElement('div');
        body.className = 'ui-modal__body';
        
        // Contenu
        this.children.forEach(child => {
            if (typeof child === 'string') {
                body.innerHTML += child;
            } else if (child.nodeType) {
                body.appendChild(child);
            } else if (child.render) {
                body.appendChild(child.render());
            }
        });
        
        modal.appendChild(body);
        overlay.appendChild(modal);
        
        this.element = overlay;
        this.bindEvents();
        
        return overlay;
    }
    
    getOverlayClasses() {
        const classes = ['ui-modal-overlay'];
        
        if (this.props.centered) classes.push('ui-modal-overlay--centered');
        
        return classes.join(' ');
    }
    
    getModalClasses() {
        const classes = [
            'ui-modal',
            `ui-modal--${this.props.size}`
        ];
        
        return classes.join(' ');
    }
    
    bindEvents() {
        if (this.props.keyboard) {
            this.eventListeners.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    this.element.addEventListener(event, handler);
                });
            });
        }
    }
}

/**
 * Composant Alert
 */
class AlertComponent extends BaseComponent {
    getDefaultProps() {
        return {
            variant: 'info',
            dismissible: false,
            icon: true,
            title: '',
            onDismiss: () => {}
        };
    }
    
    dismiss() {
        // Animation de sortie
        this.addClass('ui-alert--dismissing');
        
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.props.onDismiss();
        }, 200);
    }
    
    render() {
        const alert = document.createElement('div');
        alert.className = this.getAlertClasses();
        alert.id = this.id;
        alert.setAttribute('role', 'alert');
        
        // Icône
        if (this.props.icon) {
            const icon = document.createElement('span');
            icon.className = 'ui-alert__icon';
            icon.innerHTML = this.getIcon();
            alert.appendChild(icon);
        }
        
        // Contenu
        const content = document.createElement('div');
        content.className = 'ui-alert__content';
        
        if (this.props.title) {
            const title = document.createElement('div');
            title.className = 'ui-alert__title';
            title.textContent = this.props.title;
            content.appendChild(title);
        }
        
        const body = document.createElement('div');
        body.className = 'ui-alert__body';
        
        this.children.forEach(child => {
            if (typeof child === 'string') {
                body.innerHTML += child;
            } else {
                body.appendChild(child);
            }
        });
        
        content.appendChild(body);
        alert.appendChild(content);
        
        // Bouton de fermeture
        if (this.props.dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'ui-alert__close';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Fermer l\'alerte');
            closeBtn.addEventListener('click', () => this.dismiss());
            alert.appendChild(closeBtn);
        }
        
        this.element = alert;
        return alert;
    }
    
    getAlertClasses() {
        return [
            'ui-alert',
            `ui-alert--${this.props.variant}`
        ].join(' ');
    }
    
    getIcon() {
        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕',
            info: 'ℹ'
        };
        
        return icons[this.props.variant] || icons.info;
    }
}

/**
 * Composant Card
 */
class CardComponent extends BaseComponent {
    getDefaultProps() {
        return {
            variant: 'default',
            hover: false,
            clickable: false,
            padding: 'md',
            onClick: () => {}
        };
    }
    
    init() {
        if (this.props.clickable) {
            this.addEventListener('click', this.props.onClick);
        }
    }
    
    render() {
        const card = document.createElement('div');
        card.className = this.getCardClasses();
        card.id = this.id;
        
        if (this.props.clickable) {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
        }
        
        // Contenu
        this.children.forEach(child => {
            if (typeof child === 'string') {
                card.innerHTML += child;
            } else if (child.nodeType) {
                card.appendChild(child);
            } else if (child.render) {
                card.appendChild(child.render());
            }
        });
        
        this.element = card;
        this.bindEvents();
        
        return card;
    }
    
    getCardClasses() {
        const classes = [
            'ui-card',
            `ui-card--${this.props.variant}`,
            `ui-card--padding-${this.props.padding}`
        ];
        
        if (this.props.hover) classes.push('ui-card--hover');
        if (this.props.clickable) classes.push('ui-card--clickable');
        
        return classes.join(' ');
    }
    
    bindEvents() {
        if (this.props.clickable) {
            this.eventListeners.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    this.element.addEventListener(event, handler);
                });
            });
        }
    }
}

// Export des composants
window.ButtonComponent = ButtonComponent;
window.InputComponent = InputComponent;
window.ModalComponent = ModalComponent;
window.AlertComponent = AlertComponent;
window.CardComponent = CardComponent;

console.log('🧩 Composants UI de base chargés');
