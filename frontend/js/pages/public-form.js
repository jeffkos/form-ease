/**
 * FormEase - Gestionnaire de Formulaires Publics
 * Page de réponse publique pour les formulaires partagés
 */

class PublicFormManager {
    constructor() {
        this.formData = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.responses = {};
        this.isSubmitting = false;
        this.signaturePads = {};
        this.stripeInstance = null;
        this.paymentElements = {};
        this.validationRules = {};
        
        this.init();
    }

    /**
     * Initialisation du gestionnaire
     */
    init() {
        console.log('🚀 PublicFormManager - Initialisation');
        
        // Récupérer les paramètres URL
        this.extractUrlParams();
        
        // Configurer les événements
        this.setupEventListeners();
        
        // Charger le formulaire si ID présent
        if (this.formId) {
            this.loadForm();
        } else {
            this.showError('Aucun formulaire spécifié dans l\'URL.');
        }
    }

    /**
     * Extraire les paramètres de l'URL
     */
    extractUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.formId = urlParams.get('form') || urlParams.get('id');
        this.token = urlParams.get('token');
        this.preview = urlParams.get('preview') === 'true';
        
        console.log('📋 Paramètres URL:', {
            formId: this.formId,
            hasToken: !!this.token,
            isPreview: this.preview
        });
    }

    /**
     * Configurer les événements
     */
    setupEventListeners() {
        // Soumission du formulaire
        const form = document.getElementById('public-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Navigation entre pages
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Validation en temps réel
        document.addEventListener('input', (e) => this.handleFieldChange(e));
        document.addEventListener('change', (e) => this.handleFieldChange(e));
        
        // Gestion du redimensionnement
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Charger les données du formulaire
     */
    async loadForm() {
        try {
            console.log('🔄 Chargement du formulaire:', this.formId);
            
            const endpoint = this.preview 
                ? `/api/forms/${this.formId}/preview`
                : `/api/public/forms/${this.formId}`;
                
            const url = `${endpoint}${this.token ? '?token=' + this.token : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.preview && { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` })
                }
            });

            if (!response.ok) {
                throw new Error(await this.getErrorMessage(response));
            }

            const data = await response.json();
            
            if (data.success) {
                this.formData = data.data;
                this.initializeForm();
                
                // Tracking d'ouverture (sauf preview)
                if (!this.preview) {
                    this.trackFormView();
                }
            } else {
                throw new Error(data.error || 'Erreur inconnue');
            }
            
        } catch (error) {
            console.error('❌ Erreur chargement formulaire:', error);
            this.showError(error.message);
        }
    }

    /**
     * Obtenir le message d'erreur selon le statut
     */
    async getErrorMessage(response) {
        const statusMessages = {
            404: 'Formulaire non trouvé ou non publié.',
            403: 'Accès non autorisé à ce formulaire.',
            410: 'Ce formulaire a expiré.',
            429: 'Trop de tentatives. Veuillez réessayer plus tard.',
            500: 'Erreur serveur. Veuillez réessayer.'
        };
        
        if (statusMessages[response.status]) {
            return statusMessages[response.status];
        }
        
        try {
            const data = await response.json();
            return data.error || 'Erreur lors du chargement du formulaire.';
        } catch {
            return 'Erreur lors du chargement du formulaire.';
        }
    }

    /**
     * Initialiser le formulaire
     */
    initializeForm() {
        console.log('🎯 Initialisation du formulaire:', this.formData.title);
        
        // Mettre à jour les métadonnées
        this.updateFormMetadata();
        
        // Analyser la structure
        this.analyzeFormStructure();
        
        // Générer les champs
        this.renderFormFields();
        
        // Initialiser la navigation multi-pages
        if (this.totalPages > 1) {
            this.initializeMultiPageNavigation();
        }
        
        // Masquer l'état de chargement
        this.hideLoadingState();
        
        // Initialiser les éléments spéciaux
        this.initializeSpecialFields();
        
        // Configurer la validation
        this.setupValidation();
        
        console.log('✅ Formulaire initialisé avec succès');
    }

    /**
     * Mettre à jour les métadonnées du formulaire
     */
    updateFormMetadata() {
        document.title = `${this.formData.title} - FormEase`;
        document.getElementById('form-title-display').textContent = this.formData.title;
        
        const description = this.formData.description || '';
        const descElement = document.getElementById('form-description-display');
        if (description) {
            descElement.textContent = description;
            descElement.style.display = 'block';
        } else {
            descElement.style.display = 'none';
        }
        
        // Favicon si logo disponible
        if (this.formData.settings?.logo) {
            this.setFavicon(this.formData.settings.logo);
        }
    }

    /**
     * Analyser la structure du formulaire
     */
    analyzeFormStructure() {
        let pageCount = 1;
        const fields = this.formData.fields || [];
        
        // Compter les sauts de page
        fields.forEach(field => {
            if (field.type === 'page_break') {
                pageCount++;
            }
        });
        
        this.totalPages = pageCount;
        
        console.log(`📄 Formulaire avec ${this.totalPages} page(s), ${fields.length} champ(s)`);
    }

    /**
     * Générer les champs du formulaire
     */
    renderFormFields() {
        const container = document.getElementById('form-fields-container');
        const fields = this.formData.fields || [];
        
        if (fields.length === 0) {
            container.innerHTML = this.getEmptyFormHTML();
            return;
        }
        
        let currentPageNum = 1;
        let pagesHTML = [`<div class="form-page active" data-page="1">`];
        
        fields.forEach((field, index) => {
            if (field.type === 'page_break') {
                // Fermer la page actuelle
                pagesHTML[currentPageNum - 1] += '</div>';
                currentPageNum++;
                
                // Ouvrir une nouvelle page
                pagesHTML.push(`<div class="form-page" data-page="${currentPageNum}">`);
                
                // Ajouter le titre de page
                if (field.settings?.title) {
                    pagesHTML[currentPageNum - 1] += this.getPageHeaderHTML(field);
                }
            } else {
                // Ajouter le champ à la page actuelle
                const fieldHTML = this.renderField(field, index);
                if (fieldHTML) {
                    pagesHTML[currentPageNum - 1] += fieldHTML;
                }
            }
        });
        
        // Fermer la dernière page
        pagesHTML[pagesHTML.length - 1] += '</div>';
        
        container.innerHTML = pagesHTML.join('');
    }

    /**
     * HTML pour formulaire vide
     */
    getEmptyFormHTML() {
        return `
            <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                <div class="text-gray-500">
                    <i class="ri-file-list-line text-4xl mb-4 block"></i>
                    <p class="text-lg">Ce formulaire ne contient aucun champ.</p>
                    <p class="text-sm mt-2">Contactez l'administrateur si cela semble être une erreur.</p>
                </div>
            </div>
        `;
    }

    /**
     * HTML pour en-tête de page
     */
    getPageHeaderHTML(field) {
        return `
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
                <h2 class="text-xl font-semibold text-gray-900">${field.settings.title}</h2>
                ${field.settings.description ? `<p class="text-gray-600 mt-2">${field.settings.description}</p>` : ''}
            </div>
        `;
    }

    /**
     * Générer le HTML d'un champ
     */
    renderField(field, index) {
        if (!field || !field.type) return '';
        
        const fieldId = field.id || `field_${index}`;
        const required = field.required;
        const requiredMark = required ? '<span class="text-red-500 ml-1">*</span>' : '';
        
        // Cas spéciaux qui ne suivent pas le template standard
        if (field.type === 'section') {
            return this.renderSectionField(field);
        }
        
        if (field.type === 'html') {
            return this.renderHtmlField(field);
        }
        
        if (field.type === 'hidden') {
            return `<input type="hidden" id="${fieldId}" name="${fieldId}" value="${field.settings?.value || ''}">`;
        }
        
        // Template standard
        let fieldHTML = `
            <div class="form-field bg-white rounded-xl shadow-lg p-6" data-field-id="${fieldId}" data-field-type="${field.type}">
        `;
        
        // Label (sauf pour les cases à cocher)
        if (field.type !== 'checkbox' && field.type !== 'consent') {
            fieldHTML += `
                <label class="block text-sm font-medium text-gray-900 mb-2" for="${fieldId}">
                    ${field.label}${requiredMark}
                </label>
            `;
        }
        
        // Description si présente
        if (field.description) {
            fieldHTML += `
                <p class="text-sm text-gray-600 mb-3">${field.description}</p>
            `;
        }
        
        // Contenu du champ
        fieldHTML += this.renderFieldContent(field, fieldId);
        
        // Message d'erreur
        fieldHTML += `
                <div class="error-message hidden mt-2" id="${fieldId}-error"></div>
            </div>
        `;
        
        return fieldHTML;
    }

    /**
     * Générer le contenu d'un champ
     */
    renderFieldContent(field, fieldId) {
        const required = field.required ? 'required' : '';
        const placeholder = field.placeholder || '';
        
        switch (field.type) {
            case 'text':
                return `
                    <input type="text" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           placeholder="${placeholder}"
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${required}>
                `;
                
            case 'textarea':
                const rows = field.settings?.rows || 4;
                const maxLength = field.validation?.maxLength;
                return `
                    <textarea id="${fieldId}" 
                             name="${fieldId}" 
                             placeholder="${placeholder}"
                             rows="${rows}"
                             ${maxLength ? `maxlength="${maxLength}"` : ''}
                             class="form-input w-full p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                             ${required}></textarea>
                    ${maxLength ? `<div class="text-xs text-gray-500 mt-1">Maximum ${maxLength} caractères</div>` : ''}
                `;
                
            case 'email':
                return `
                    <input type="email" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           placeholder="${placeholder || 'exemple@email.com'}"
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${required}>
                `;
                
            case 'number_only':
                const min = field.validation?.min;
                const max = field.validation?.max;
                const step = field.validation?.step || 1;
                return `
                    <input type="number" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           placeholder="${placeholder}"
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${min !== undefined ? `min="${min}"` : ''}
                           ${max !== undefined ? `max="${max}"` : ''}
                           step="${step}"
                           ${required}>
                `;
                
            case 'address':
                return this.renderAddressField(fieldId, field);
                
            case 'website':
                return `
                    <input type="url" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           placeholder="${placeholder || 'https://monsite.com'}"
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${required}>
                `;
                
            case 'select':
                return this.renderSelectField(fieldId, field);
                
            case 'radio':
                return this.renderRadioField(fieldId, field);
                
            case 'checkbox':
                return this.renderCheckboxField(fieldId, field);
                
            case 'date':
                const minDate = field.validation?.minDate;
                const maxDate = field.validation?.maxDate;
                return `
                    <input type="date" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${minDate ? `min="${minDate}"` : ''}
                           ${maxDate ? `max="${maxDate}"` : ''}
                           ${required}>
                `;
                
            case 'time':
                return `
                    <input type="time" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${required}>
                `;
                
            case 'datetime':
                return `
                    <input type="datetime-local" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${required}>
                `;
                
            case 'file':
                return this.renderFileField(fieldId, field);
                
            case 'rating':
                return this.renderRatingField(fieldId, field);
                
            case 'slider':
                return this.renderSliderField(fieldId, field);
                
            case 'signature':
                return this.renderSignatureField(fieldId, field);
                
            case 'currency':
                return this.renderCurrencyField(fieldId, field);
                
            case 'stripe_payment':
                return this.renderStripePaymentField(fieldId, field);
                
            case 'paypal_payment':
                return this.renderPayPalPaymentField(fieldId, field);
                
            case 'consent':
                return this.renderConsentField(fieldId, field);
                
            case 'calculations':
                return this.renderCalculationField(fieldId, field);
                
            case 'captcha':
                return this.renderCaptchaField(fieldId, field);
                
            default:
                return `
                    <input type="text" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           placeholder="${placeholder}"
                           class="form-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           ${required}>
                `;
        }
    }

    /**
     * Champ adresse structuré
     */
    renderAddressField(fieldId, field) {
        const fields = field.settings?.fields || ['street', 'city', 'postal_code', 'country'];
        const labels = {
            street: 'Adresse',
            city: 'Ville',
            postal_code: 'Code postal',
            state: 'État/Région',
            country: 'Pays'
        };
        
        let html = '<div class="space-y-3">';
        
        fields.forEach(subField => {
            const subFieldId = `${fieldId}_${subField}`;
            const label = labels[subField] || subField;
            const required = field.required && ['street', 'city', 'postal_code'].includes(subField) ? 'required' : '';
            
            if (subField === 'country') {
                html += `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                        <select id="${subFieldId}" name="${subFieldId}" class="form-input w-full p-3 border border-gray-300 rounded-lg" ${required}>
                            <option value="">Sélectionner un pays</option>
                            <option value="FR">France</option>
                            <option value="BE">Belgique</option>
                            <option value="CH">Suisse</option>
                            <option value="CA">Canada</option>
                            <option value="US">États-Unis</option>
                            <option value="GB">Royaume-Uni</option>
                            <option value="DE">Allemagne</option>
                            <option value="ES">Espagne</option>
                            <option value="IT">Italie</option>
                        </select>
                    </div>
                `;
            } else {
                html += `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
                        <input type="text" 
                               id="${subFieldId}" 
                               name="${subFieldId}" 
                               class="form-input w-full p-3 border border-gray-300 rounded-lg"
                               ${required}>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Champ de sélection
     */
    renderSelectField(fieldId, field) {
        const options = field.options || [];
        const multiple = field.settings?.multiple;
        
        let html = `
            <select id="${fieldId}" 
                    name="${fieldId}" 
                    class="form-input w-full p-3 border border-gray-300 rounded-lg"
                    ${multiple ? 'multiple' : ''}
                    ${field.required ? 'required' : ''}>
        `;
        
        if (!multiple) {
            html += `<option value="">Choisir une option</option>`;
        }
        
        options.forEach(option => {
            html += `<option value="${option.value}">${option.label}</option>`;
        });
        
        html += '</select>';
        
        if (multiple) {
            html += '<div class="text-xs text-gray-500 mt-1">Maintenez Ctrl/Cmd pour sélectionner plusieurs options</div>';
        }
        
        return html;
    }

    /**
     * Champs radio
     */
    renderRadioField(fieldId, field) {
        const options = field.options || [];
        let html = '<div class="space-y-2">';
        
        options.forEach((option, index) => {
            const optionId = `${fieldId}_${index}`;
            html += `
                <label class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" 
                           id="${optionId}" 
                           name="${fieldId}" 
                           value="${option.value}"
                           class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                           ${field.required ? 'required' : ''}>
                    <span class="text-gray-900">${option.label}</span>
                </label>
            `;
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Cases à cocher
     */
    renderCheckboxField(fieldId, field) {
        const options = field.options || [];
        let html = '<div class="space-y-2">';
        
        options.forEach((option, index) => {
            const optionId = `${fieldId}_${index}`;
            html += `
                <label class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" 
                           id="${optionId}" 
                           name="${fieldId}[]" 
                           value="${option.value}"
                           class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                    <span class="text-gray-900">${option.label}</span>
                </label>
            `;
        });
        
        html += '</div>';
        return html;
    }

    // Continuer les autres méthodes de rendu...
    // La suite sera dans le prochain message pour éviter la limite de longueur

    /**
     * Masquer l'état de chargement
     */
    hideLoadingState() {
        const loadingElement = document.getElementById('loading-state');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Afficher une erreur
     */
    showError(message) {
        console.error('💥 Erreur:', message);
        
        // Masquer le formulaire et afficher l'erreur
        const formContainer = document.getElementById('form-fields-container');
        const errorPage = document.getElementById('error-page');
        const errorDisplay = document.getElementById('error-message-display');
        
        if (formContainer) formContainer.style.display = 'none';
        if (errorDisplay) errorDisplay.textContent = message;
        if (errorPage) errorPage.classList.remove('hidden');
    }

    /**
     * Tracking d'ouverture de formulaire
     */
    async trackFormView() {
        try {
            await fetch(`/api/analytics/forms/${this.formId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    referrer: document.referrer,
                    userAgent: navigator.userAgent
                })
            });
        } catch (error) {
            console.warn('⚠️ Erreur tracking:', error);
        }
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    window.publicFormManager = new PublicFormManager();
});

// Export pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PublicFormManager;
}
