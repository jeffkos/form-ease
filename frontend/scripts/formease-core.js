/**
 * FORMEASE CORE JAVASCRIPT UTILITIES
 * Fonctions et utilitaires extraits des modèles form-ai-generator.html et form-builder-fixed.html
 * Framework léger pour l'écosystème FormEase V2.0
 */

/* ===== CONFIGURATION GLOBALE ===== */
window.FormEase = {
  version: '2.0.0',
  apiUrl: 'http://localhost:3000/api',
  config: {
    animationDuration: 300,
    loadingTimeout: 30000,
    autosaveInterval: 5000,
    maxRetries: 3
  },
  state: {
    user: null,
    currentForm: null,
    isLoading: false,
    errors: []
  }
};

/* ===== UTILITIES DE BASE ===== */
const Utils = {
  /**
   * Génère un UUID simple
   */
  generateId() {
    return 'fe-' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Debounce function pour limiter les appels
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function pour limiter la fréquence
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  },

  /**
   * Formatage des dates
   */
  formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    switch(format) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      default: return d.toLocaleDateString('fr-FR');
    }
  },

  /**
   * Validation email
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Escape HTML pour éviter XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
};

/* ===== GESTIONNAIRE D'ANIMATIONS ===== */
const Animations = {
  /**
   * Fade in/out
   */
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    const animate = (timestamp) => {
      const progress = (timestamp - start) / duration;
      element.style.opacity = Math.min(progress, 1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  },

  fadeOut(element, duration = 300) {
    const start = performance.now();
    const startOpacity = parseFloat(element.style.opacity) || 1;
    
    const animate = (timestamp) => {
      const progress = (timestamp - start) / duration;
      element.style.opacity = startOpacity * (1 - Math.min(progress, 1));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    requestAnimationFrame(animate);
  },

  /**
   * Slide animations
   */
  slideDown(element, duration = 300) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight;
    const start = performance.now();
    
    const animate = (timestamp) => {
      const progress = (timestamp - start) / duration;
      element.style.height = (targetHeight * Math.min(progress, 1)) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.height = '';
        element.style.overflow = '';
      }
    };
    requestAnimationFrame(animate);
  },

  slideUp(element, duration = 300) {
    const startHeight = element.offsetHeight;
    const start = performance.now();
    
    const animate = (timestamp) => {
      const progress = (timestamp - start) / duration;
      element.style.height = (startHeight * (1 - Math.min(progress, 1))) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        element.style.height = '';
      }
    };
    requestAnimationFrame(animate);
  }
};

/* ===== GESTIONNAIRE DE NOTIFICATIONS ===== */
const Notifications = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 5000) {
    this.init();
    
    const notification = document.createElement('div');
    notification.className = `tremor-Alert tremor-Alert-${type} max-w-sm shadow-lg transform transition-all duration-300 translate-x-full`;
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${Utils.escapeHtml(message)}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-70 hover:opacity-100">
          <i class="ri-close-line"></i>
        </button>
      </div>
    `;
    
    this.container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 10);
    
    // Suppression automatique
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.classList.add('translate-x-full');
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

/* ===== GESTIONNAIRE DE CHARGEMENT ===== */
const Loading = {
  overlay: null,

  show(message = 'Chargement...') {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
      this.overlay.innerHTML = `
        <div class="tremor-Card p-6 text-center">
          <div class="ai-thinking mb-4">
            <i class="ri-loader-4-line text-2xl text-blue-600"></i>
          </div>
          <p class="tremor-Text">${Utils.escapeHtml(message)}</p>
        </div>
      `;
    }
    
    document.body.appendChild(this.overlay);
    FormEase.state.isLoading = true;
  },

  hide() {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.remove();
    }
    FormEase.state.isLoading = false;
  }
};

/* ===== GESTIONNAIRE D'API ===== */
const API = {
  /**
   * Requête générique avec gestion d'erreurs
   */
  async request(endpoint, options = {}) {
    const url = `${FormEase.apiUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('formease_token');
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  /**
   * Méthodes HTTP spécifiques
   */
  async get(endpoint) {
    return this.request(endpoint);
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};

/* ===== GESTIONNAIRE D'AUTHENTIFICATION ===== */
const Auth = {
  /**
   * Connexion utilisateur
   */
  async login(email, password) {
    try {
      Loading.show('Connexion en cours...');
      
      const response = await API.post('/auth/login', { email, password });
      
      if (response.token) {
        localStorage.setItem('formease_token', response.token);
        localStorage.setItem('formease_user', JSON.stringify(response.user));
        FormEase.state.user = response.user;
        
        Notifications.success('Connexion réussie !');
        return response;
      }
      
      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      Notifications.error('Erreur de connexion : ' + error.message);
      throw error;
    } finally {
      Loading.hide();
    }
  },

  /**
   * Déconnexion
   */
  logout() {
    localStorage.removeItem('formease_token');
    localStorage.removeItem('formease_user');
    FormEase.state.user = null;
    
    Notifications.info('Vous avez été déconnecté');
    window.location.href = '/auth/login.html';
  },

  /**
   * Vérification de l'authentification
   */
  isAuthenticated() {
    const token = localStorage.getItem('formease_token');
    const user = localStorage.getItem('formease_user');
    
    if (token && user) {
      try {
        FormEase.state.user = JSON.parse(user);
        return true;
      } catch (error) {
        this.logout();
        return false;
      }
    }
    
    return false;
  },

  /**
   * Redirection si non authentifié
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/auth/login.html';
      return false;
    }
    return true;
  }
};

/* ===== GESTIONNAIRE DE FORMULAIRES ===== */
const Forms = {
  /**
   * Validation d'un formulaire
   */
  validate(formElement) {
    const errors = [];
    const inputs = formElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Reset previous errors
      input.classList.remove('tremor-TextInput-error');
      
      // Required fields
      if (input.hasAttribute('required') && !input.value.trim()) {
        errors.push(`Le champ "${input.name || input.id}" est requis`);
        input.classList.add('tremor-TextInput-error');
      }
      
      // Email validation
      if (input.type === 'email' && input.value && !Utils.isValidEmail(input.value)) {
        errors.push(`L'email "${input.value}" n'est pas valide`);
        input.classList.add('tremor-TextInput-error');
      }
      
      // Min/Max length
      if (input.minLength && input.value.length < input.minLength) {
        errors.push(`Le champ "${input.name || input.id}" doit contenir au moins ${input.minLength} caractères`);
        input.classList.add('tremor-TextInput-error');
      }
      
      if (input.maxLength && input.value.length > input.maxLength) {
        errors.push(`Le champ "${input.name || input.id}" ne peut pas dépasser ${input.maxLength} caractères`);
        input.classList.add('tremor-TextInput-error');
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Soumission d'un formulaire avec gestion d'erreurs
   */
  async submit(formElement, endpoint, options = {}) {
    const validation = this.validate(formElement);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => Notifications.error(error));
      return false;
    }
    
    try {
      Loading.show(options.loadingMessage || 'Envoi en cours...');
      
      const formData = new FormData(formElement);
      const data = Object.fromEntries(formData.entries());
      
      const response = await API.post(endpoint, data);
      
      if (options.successMessage) {
        Notifications.success(options.successMessage);
      }
      
      if (options.redirectTo) {
        setTimeout(() => {
          window.location.href = options.redirectTo;
        }, 1000);
      }
      
      return response;
    } catch (error) {
      Notifications.error(options.errorMessage || 'Erreur lors de l\'envoi : ' + error.message);
      return false;
    } finally {
      Loading.hide();
    }
  }
};

/* ===== GESTIONNAIRE D'ÉVÉNEMENTS GLOBAUX ===== */
const Events = {
  init() {
    // Gestion des formulaires automatique
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      const endpoint = form.dataset.endpoint;
      
      if (endpoint) {
        e.preventDefault();
        await Forms.submit(form, endpoint, {
          successMessage: form.dataset.successMessage,
          errorMessage: form.dataset.errorMessage,
          redirectTo: form.dataset.redirectTo,
          loadingMessage: form.dataset.loadingMessage
        });
      }
    });
    
    // Gestion des boutons de déconnexion
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="logout"]')) {
        e.preventDefault();
        Auth.logout();
      }
    });
    
    // Auto-save pour les formulaires
    const autoSaveInputs = document.querySelectorAll('[data-autosave]');
    autoSaveInputs.forEach(input => {
      input.addEventListener('input', Utils.debounce(() => {
        const key = `formease_autosave_${input.dataset.autosave}`;
        localStorage.setItem(key, input.value);
      }, 1000));
    });
    
    // Récupération auto-save au chargement
    autoSaveInputs.forEach(input => {
      const key = `formease_autosave_${input.dataset.autosave}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        input.value = saved;
      }
    });
  }
};

/* ===== INITIALISATION ===== */
document.addEventListener('DOMContentLoaded', () => {
  console.log(`FormEase v${FormEase.version} initialized`);
  
  // Initialiser les gestionnaires
  Events.init();
  
  // Vérifier l'authentification si nécessaire
  const requiresAuth = document.body.dataset.requiresAuth === 'true';
  if (requiresAuth) {
    Auth.requireAuth();
  }
  
  // Ajouter les utilitaires au scope global pour faciliter l'accès
  window.Utils = Utils;
  window.Animations = Animations;
  window.Notifications = Notifications;
  window.Loading = Loading;
  window.API = API;
  window.Auth = Auth;
  window.Forms = Forms;
});

/* ===== EXPORT POUR LES MODULES ===== */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormEase,
    Utils,
    Animations,
    Notifications,
    Loading,
    API,
    Auth,
    Forms,
    Events
  };
}
