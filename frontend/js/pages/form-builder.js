/**
 * 🛠️ FormEase - Form Builder
 * Script de dynamisation pour la page de construction de formulaires
 */

class FormBuilder {
    constructor() {
        this.apiService = window.ApiService;
        this.dynamicPageService = window.DynamicPageService;
        
        this.currentForm = null;
        this.formFields = [];
        this.isDirty = false;
        this.autoSaveInterval = null;
        this.previewMode = false;
        
        // ID du formulaire à éditer (depuis l'URL)
        const urlParams = new URLSearchParams(window.location.search);
        this.editingFormId = urlParams.get('id');
        
        this.init();
    }

    async init() {
        try {
            await this.loadFormData();
            this.setupEventListeners();
            this.setupDragAndDrop();
            this.setupFieldTypes();
            this.startAutoSave();
            this.initializePreview();
            
            console.log('✅ Form Builder initialisé');
        } catch (error) {
            console.error('❌ Erreur initialisation form builder:', error);
            this.showError('Erreur lors du chargement du constructeur');
        }
    }

    async loadFormData() {
        try {
            if (this.editingFormId) {
                // Charger un formulaire existant
                const response = await this.apiService.getForm(this.editingFormId);
                if (response.success) {
                    this.currentForm = response.data;
                    this.formFields = response.data.fields || [];
                    this.updateFormInfo();
                    this.renderFormFields();
                    this.updatePreview();
                } else {
                    throw new Error(response.error);
                }
            } else {
                // Nouveau formulaire
                this.currentForm = {
                    title: '',
                    description: '',
                    settings: {
                        theme: 'default',
                        submitButtonText: 'Envoyer',
                        successMessage: 'Merci pour votre réponse !',
                        requireAuth: false,
                        allowMultiple: true,
                        collectEmail: true
                    }
                };
                this.formFields = [];
                this.updateFormInfo();
            }

            // Charger les templates de champs
            await this.loadFieldTemplates();
            
        } catch (error) {
            console.error('❌ Erreur chargement formulaire:', error);
            this.showError('Erreur lors du chargement du formulaire');
        }
    }

    async loadFieldTemplates() {
        try {
            const response = await this.apiService.getFieldTemplates();
            if (response.success) {
                this.renderFieldTemplates(response.data.templates);
            }
        } catch (error) {
            console.warn('❌ Erreur chargement templates:', error);
            // Utiliser des templates par défaut
            this.renderDefaultFieldTemplates();
        }
    }

    updateFormInfo() {
        const titleInput = document.getElementById('form-title');
        const descInput = document.getElementById('form-description');
        
        if (titleInput) titleInput.value = this.currentForm.title || '';
        if (descInput) descInput.value = this.currentForm.description || '';
        
        // Mettre à jour les paramètres
        this.updateFormSettings();
    }

    updateFormSettings() {
        const settings = this.currentForm.settings || {};
        
        // Theme
        const themeSelect = document.getElementById('form-theme');
        if (themeSelect) themeSelect.value = settings.theme || 'default';
        
        // Texte du bouton
        const submitTextInput = document.getElementById('submit-button-text');
        if (submitTextInput) submitTextInput.value = settings.submitButtonText || 'Envoyer';
        
        // Message de succès
        const successMsgInput = document.getElementById('success-message');
        if (successMsgInput) successMsgInput.value = settings.successMessage || 'Merci pour votre réponse !';
        
        // Checkboxes
        const requireAuthCheck = document.getElementById('require-auth');
        if (requireAuthCheck) requireAuthCheck.checked = settings.requireAuth || false;
        
        const allowMultipleCheck = document.getElementById('allow-multiple');
        if (allowMultipleCheck) allowMultipleCheck.checked = settings.allowMultiple !== false;
        
        const collectEmailCheck = document.getElementById('collect-email');
        if (collectEmailCheck) collectEmailCheck.checked = settings.collectEmail !== false;
    }

    renderFieldTemplates(templates) {
        const container = document.getElementById('field-templates');
        if (!container) return;

        // Grouper les templates par catégorie
        const categories = {
            'basic': { name: 'Champs de Base', icon: '📝' },
            'selection': { name: 'Sélection', icon: '🎯' },
            'datetime': { name: 'Date & Heure', icon: '📅' },
            'advanced': { name: 'Avancés', icon: '⚙️' },
            'payment': { name: 'Paiement', icon: '💳' },
            'layout': { name: 'Structure', icon: '📐' }
        };

        const groupedTemplates = templates.reduce((groups, template) => {
            const category = template.category || 'basic';
            if (!groups[category]) groups[category] = [];
            groups[category].push(template);
            return groups;
        }, {});

        const templatesHTML = Object.entries(categories).map(([categoryKey, categoryInfo]) => {
            const categoryTemplates = groupedTemplates[categoryKey] || [];
            if (categoryTemplates.length === 0) return '';

            const templatesInCategory = categoryTemplates.map(template => `
                <div class="field-template bg-white p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer group ${template.premium ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50' : ''}"
                     draggable="true"
                     data-field-type="${template.type}"
                     data-template='${JSON.stringify(template)}'
                     onclick="formBuilder.addFieldFromTemplate('${template.type}')">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 ${template.premium ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-blue-100'} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span class="text-sm">${this.getFieldIcon(template.type)}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2">
                                <h4 class="font-medium text-gray-900 truncate">${template.name}</h4>
                                ${template.premium ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Premium</span>' : ''}
                            </div>
                            <p class="text-xs text-gray-500 mt-1">${template.description}</p>
                        </div>
                    </div>
                </div>
            `).join('');

            return `
                <div class="mb-6">
                    <div class="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
                        <span class="text-lg">${categoryInfo.icon}</span>
                        <h3 class="font-semibold text-gray-800">${categoryInfo.name}</h3>
                        <span class="text-xs text-gray-500">(${categoryTemplates.length})</span>
                    </div>
                    <div class="space-y-2">
                        ${templatesInCategory}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = templatesHTML;
    }

    renderDefaultFieldTemplates() {
        const defaultTemplates = [
            // Champs de base
            { type: 'text', name: 'Texte court', description: 'Champ de texte simple', category: 'basic' },
            { type: 'textarea', name: 'Zone de texte', description: 'Zone de texte multi-lignes', category: 'basic' },
            { type: 'email', name: 'Email', description: 'Adresse email validée', category: 'basic' },
            { type: 'number_only', name: 'Numéro', description: 'Uniquement les chiffres', category: 'basic' },
            { type: 'address', name: 'Adresse', description: 'Adresse complète structurée', category: 'basic' },
            { type: 'website', name: 'Lien web', description: 'URL du site web', category: 'basic' },
            { type: 'hidden', name: 'Champ caché', description: 'Valeur cachée du formulaire', category: 'basic' },
            
            // Champs de sélection
            { type: 'select', name: 'Liste déroulante', description: 'Choix dans une liste', category: 'selection' },
            { type: 'radio', name: 'Choix unique', description: 'Boutons radio', category: 'selection' },
            { type: 'checkbox', name: 'Cases à cocher', description: 'Choix multiples', category: 'selection' },
            { type: 'slider', name: 'Curseur', description: 'Sélection par curseur', category: 'selection' },
            { type: 'rating', name: 'Évaluation', description: 'Étoiles ou échelle de notation', category: 'selection' },
            
            // Champs de date et heure
            { type: 'date', name: 'Date', description: 'Sélecteur de date', category: 'datetime' },
            { type: 'time', name: 'Heure', description: 'Sélecteur d\'heure', category: 'datetime' },
            { type: 'publish_date', name: 'Date de publication', description: 'Date et heure de publication', category: 'datetime' },
            
            // Champs avancés
            { type: 'file', name: 'Fichier', description: 'Upload de fichier', category: 'advanced' },
            { type: 'signature', name: 'Signature électronique', description: 'Signature numérique (Premium)', category: 'advanced', premium: true },
            { type: 'captcha', name: 'Captcha', description: 'Vérification anti-robot', category: 'advanced' },
            { type: 'html', name: 'HTML personnalisé', description: 'Code HTML libre', category: 'advanced' },
            { type: 'calculations', name: 'Calculs', description: 'Champ de calcul automatique', category: 'advanced' },
            
            // Champs de paiement
            { type: 'currency', name: 'Devise', description: 'Montant avec devise', category: 'payment' },
            { type: 'stripe_payment', name: 'Paiement Stripe', description: 'Paiement sécurisé Stripe', category: 'payment' },
            { type: 'paypal_payment', name: 'Paiement PayPal', description: 'Paiement sécurisé PayPal', category: 'payment' },
            
            // Éléments de structure
            { type: 'section', name: 'Section', description: 'Groupe de champs avec titre', category: 'layout' },
            { type: 'field_group', name: 'Groupe de champs', description: 'Groupement de champs connexes', category: 'layout' },
            { type: 'page_break', name: 'Saut de page', description: 'Diviser en plusieurs pages', category: 'layout' },
            { type: 'consent', name: 'Consentement', description: 'Case de consentement RGPD', category: 'layout' }
        ];

        this.renderFieldTemplates(defaultTemplates);
    }

    getFieldIcon(type) {
        const icons = {
            // Champs de base
            'text': '📝',
            'textarea': '📄',
            'email': '📧',
            'number_only': '🔢',
            'address': '🏠',
            'website': '🔗',
            'hidden': '👁️‍🗨️',
            
            // Champs de sélection
            'select': '📋',
            'radio': '⚪',
            'checkbox': '☑️',
            'slider': '🎚️',
            'rating': '⭐',
            
            // Champs de date et heure
            'date': '📅',
            'time': '🕐',
            'publish_date': '📰',
            
            // Champs avancés
            'file': '📎',
            'signature': '✍️',
            'captcha': '🤖',
            'html': '💻',
            'calculations': '🧮',
            
            // Champs de paiement
            'currency': '💰',
            'stripe_payment': '💳',
            'paypal_payment': '🅿️',
            
            // Éléments de structure
            'section': '📑',
            'field_group': '📊',
            'page_break': '📃',
            'consent': '✅'
        };
        return icons[type] || '📝';
    }

    setupDragAndDrop() {
        // Drag des templates
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('field-template')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.template);
            }
        });

        // Drop zone pour les champs
        const dropZone = document.getElementById('form-fields-container');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', (e) => {
                if (!dropZone.contains(e.relatedTarget)) {
                    dropZone.classList.remove('drag-over');
                }
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const templateData = e.dataTransfer.getData('text/plain');
                if (templateData) {
                    this.addField(JSON.parse(templateData));
                }
            });
        }
    }

    addField(template) {
        const fieldDefaults = this.getFieldDefaults(template.type);
        
        const newField = {
            id: this.generateFieldId(),
            type: template.type,
            label: fieldDefaults.label,
            placeholder: fieldDefaults.placeholder,
            required: false,
            options: fieldDefaults.options || [],
            validation: fieldDefaults.validation || {},
            settings: fieldDefaults.settings || {}
        };

        this.formFields.push(newField);
        this.renderFormFields();
        this.updatePreview();
        this.markAsDirty();
        
        // Scroll vers le nouveau champ
        setTimeout(() => {
            const fieldElement = document.querySelector(`[data-field-id="${newField.id}"]`);
            if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    addFieldFromTemplate(fieldType) {
        // Vérifier si c'est un champ premium
        const templates = this.getDefaultTemplates();
        const template = templates.find(t => t.type === fieldType);
        
        if (template && template.premium && !this.checkPremiumAccess()) {
            this.showPremiumModal(template.name);
            return;
        }

        this.addField({ type: fieldType });
    }

    getDefaultTemplates() {
        return [
            // Champs de base
            { type: 'text', name: 'Texte court', description: 'Champ de texte simple', category: 'basic' },
            { type: 'textarea', name: 'Zone de texte', description: 'Zone de texte multi-lignes', category: 'basic' },
            { type: 'email', name: 'Email', description: 'Adresse email validée', category: 'basic' },
            { type: 'number_only', name: 'Numéro', description: 'Uniquement les chiffres', category: 'basic' },
            { type: 'address', name: 'Adresse', description: 'Adresse complète structurée', category: 'basic' },
            { type: 'website', name: 'Lien web', description: 'URL du site web', category: 'basic' },
            { type: 'hidden', name: 'Champ caché', description: 'Valeur cachée du formulaire', category: 'basic' },
            
            // Champs de sélection
            { type: 'select', name: 'Liste déroulante', description: 'Choix dans une liste', category: 'selection' },
            { type: 'radio', name: 'Choix unique', description: 'Boutons radio', category: 'selection' },
            { type: 'checkbox', name: 'Cases à cocher', description: 'Choix multiples', category: 'selection' },
            { type: 'slider', name: 'Curseur', description: 'Sélection par curseur', category: 'selection' },
            { type: 'rating', name: 'Évaluation', description: 'Étoiles ou échelle de notation', category: 'selection' },
            
            // Champs de date et heure
            { type: 'date', name: 'Date', description: 'Sélecteur de date', category: 'datetime' },
            { type: 'time', name: 'Heure', description: 'Sélecteur d\'heure', category: 'datetime' },
            { type: 'publish_date', name: 'Date de publication', description: 'Date et heure de publication', category: 'datetime' },
            
            // Champs avancés
            { type: 'file', name: 'Fichier', description: 'Upload de fichier', category: 'advanced' },
            { type: 'signature', name: 'Signature électronique', description: 'Signature numérique (Premium)', category: 'advanced', premium: true },
            { type: 'captcha', name: 'Captcha', description: 'Vérification anti-robot', category: 'advanced' },
            { type: 'html', name: 'HTML personnalisé', description: 'Code HTML libre', category: 'advanced' },
            { type: 'calculations', name: 'Calculs', description: 'Champ de calcul automatique', category: 'advanced' },
            
            // Champs de paiement
            { type: 'currency', name: 'Devise', description: 'Montant avec devise', category: 'payment' },
            { type: 'stripe_payment', name: 'Paiement Stripe', description: 'Paiement sécurisé Stripe', category: 'payment' },
            { type: 'paypal_payment', name: 'Paiement PayPal', description: 'Paiement sécurisé PayPal', category: 'payment' },
            
            // Éléments de structure
            { type: 'section', name: 'Section', description: 'Groupe de champs avec titre', category: 'layout' },
            { type: 'field_group', name: 'Groupe de champs', description: 'Groupement de champs connexes', category: 'layout' },
            { type: 'page_break', name: 'Saut de page', description: 'Diviser en plusieurs pages', category: 'layout' },
            { type: 'consent', name: 'Consentement', description: 'Case de consentement RGPD', category: 'layout' }
        ];
    }

    checkPremiumAccess() {
        // TODO: Vérifier si l'utilisateur a un accès Premium
        return window.apiService?.user?.plan === 'premium' || false;
    }

    showPremiumModal(featureName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                <div class="text-center">
                    <div class="text-4xl mb-4">👑</div>
                    <h3 class="text-lg font-semibold mb-2">Fonctionnalité Premium</h3>
                    <p class="text-gray-600 mb-4">
                        "${featureName}" est une fonctionnalité Premium.<br>
                        Mettez à niveau votre compte pour l'utiliser.
                    </p>
                    <div class="flex space-x-3 justify-center">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">
                            Annuler
                        </button>
                        <button onclick="window.open('/premium', '_blank')" 
                                class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                            Voir Premium
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    generateFieldId() {
        return 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderFormFields() {
        const container = document.getElementById('form-fields-container');
        if (!container) return;

        if (this.formFields.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div class="text-4xl mb-4">📝</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Commencez à construire votre formulaire</h3>
                    <p class="text-gray-500 mb-4">Glissez-déposez des champs depuis la bibliothèque</p>
                    <p class="text-sm text-gray-400">ou cliquez sur les champs pour les ajouter</p>
                </div>
            `;
            return;
        }

        const fieldsHTML = this.formFields.map((field, index) => `
            <div class="form-field bg-white border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow"
                 data-field-id="${field.id}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <span class="text-lg">${this.getFieldIcon(field.type)}</span>
                        <span class="font-medium text-gray-900">${field.label}</span>
                        ${field.required ? '<span class="text-red-500">*</span>' : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 text-sm"
                                onclick="formBuilder.editField('${field.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="text-gray-600 hover:text-gray-800 text-sm"
                                onclick="formBuilder.duplicateField('${field.id}')">
                            📋 Dupliquer
                        </button>
                        <button class="text-gray-600 hover:text-gray-800 text-sm"
                                onclick="formBuilder.moveField('${field.id}', ${index - 1})"
                                ${index === 0 ? 'disabled' : ''}>
                            ⬆️
                        </button>
                        <button class="text-gray-600 hover:text-gray-800 text-sm"
                                onclick="formBuilder.moveField('${field.id}', ${index + 1})"
                                ${index === this.formFields.length - 1 ? 'disabled' : ''}>
                            ⬇️
                        </button>
                        <button class="text-red-600 hover:text-red-800 text-sm"
                                onclick="formBuilder.removeField('${field.id}')">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
                
                <div class="field-preview bg-gray-50 rounded p-3">
                    ${this.renderFieldPreview(field)}
                </div>
            </div>
        `).join('');

        container.innerHTML = fieldsHTML;
    }

    renderFieldPreview(field) {
        const required = field.required ? '<span class="text-red-500 ml-1">*</span>' : '';
        
        switch (field.type) {
            // Champs de base
            case 'text':
                return `<input type="text" placeholder="${field.placeholder || field.label}" 
                               class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled />`;
            
            case 'textarea':
                return `<textarea placeholder="${field.placeholder || field.label}" 
                                 class="w-full p-2 border rounded h-20 focus:ring-2 focus:ring-blue-500" disabled></textarea>`;
            
            case 'email':
                return `<input type="email" placeholder="${field.placeholder || field.label}" 
                               class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled />`;
            
            case 'number_only':
                return `<input type="number" placeholder="${field.placeholder || field.label}" 
                               class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled />`;
            
            case 'address':
                return `
                    <div class="space-y-2">
                        <input type="text" placeholder="Rue" class="w-full p-2 border rounded" disabled />
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Ville" class="p-2 border rounded" disabled />
                            <input type="text" placeholder="Code postal" class="p-2 border rounded" disabled />
                        </div>
                        <input type="text" placeholder="Pays" class="w-full p-2 border rounded" disabled />
                    </div>
                `;
            
            case 'website':
                return `<input type="url" placeholder="${field.placeholder || field.label}" 
                               class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled />`;
            
            case 'hidden':
                return `<div class="text-gray-500 italic bg-gray-100 p-2 rounded">Champ caché: ${field.settings?.value || 'valeur'}</div>`;
            
            // Champs de sélection
            case 'select':
                return `
                    <select class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled>
                        <option>${field.placeholder || 'Choisissez une option'}</option>
                        ${field.options.map(opt => `<option>${opt}</option>`).join('')}
                    </select>
                `;
            
            case 'radio':
                return field.options.map(opt => `
                    <label class="flex items-center space-x-2 mb-2 cursor-pointer">
                        <input type="radio" name="${field.id}" class="text-blue-600" disabled />
                        <span>${opt}</span>
                    </label>
                `).join('');
            
            case 'checkbox':
                return field.options.map(opt => `
                    <label class="flex items-center space-x-2 mb-2 cursor-pointer">
                        <input type="checkbox" class="text-blue-600 rounded" disabled />
                        <span>${opt}</span>
                    </label>
                `).join('');
            
            case 'slider':
                const sliderSettings = field.settings || {};
                return `
                    <div class="space-y-2">
                        <input type="range" min="${sliderSettings.min || 0}" max="${sliderSettings.max || 100}" 
                               step="${sliderSettings.step || 1}" class="w-full" disabled />
                        <div class="flex justify-between text-sm text-gray-500">
                            <span>${sliderSettings.min || 0}</span>
                            ${sliderSettings.showValue ? '<span class="font-medium">Valeur</span>' : ''}
                            <span>${sliderSettings.max || 100}</span>
                        </div>
                    </div>
                `;
            
            case 'rating':
                const maxRating = field.settings?.maxRating || 5;
                return `
                    <div class="flex space-x-1">
                        ${Array(maxRating).fill().map((_, i) => `<span class="text-2xl text-yellow-400 cursor-pointer hover:text-yellow-500">⭐</span>`).join('')}
                    </div>
                `;
            
            // Champs de date et heure
            case 'date':
                return `<input type="date" class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled />`;
            
            case 'time':
                return `<input type="time" class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" disabled />`;
            
            case 'publish_date':
                return `
                    <div class="space-y-2">
                        <input type="datetime-local" class="w-full p-2 border rounded" disabled />
                        ${field.settings?.timezone ? '<select class="w-full p-2 border rounded" disabled><option>Europe/Paris</option></select>' : ''}
                    </div>
                `;
            
            // Champs avancés
            case 'file':
                const fileSettings = field.settings || {};
                return `
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <div class="text-gray-500">
                            <span class="text-3xl">📎</span>
                            <p>Glissez vos fichiers ici ou cliquez pour parcourir</p>
                            <p class="text-sm">${fileSettings.acceptedTypes?.join(', ') || 'Tous les types'} - Max: ${fileSettings.maxSize || '10MB'}</p>
                        </div>
                    </div>
                `;
            
            case 'signature':
                return `
                    <div class="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 text-center" style="min-height: 150px;">
                        <div class="text-gray-500">
                            <span class="text-3xl">✍️</span>
                            <p>Zone de signature électronique</p>
                            <p class="text-sm">Fonctionnalité Premium</p>
                        </div>
                    </div>
                `;
            
            case 'captcha':
                return `
                    <div class="border border-gray-300 rounded p-4 bg-gray-50 text-center">
                        <div class="flex items-center justify-center space-x-2">
                            <span class="text-2xl">🤖</span>
                            <span>Je ne suis pas un robot</span>
                            <div class="w-6 h-6 border-2 border-gray-400"></div>
                        </div>
                    </div>
                `;
            
            case 'html':
                return `
                    <div class="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                        <div class="text-blue-600">
                            <span class="text-2xl">💻</span>
                            <p>Contenu HTML personnalisé</p>
                            <div class="text-sm font-mono mt-2">${field.settings?.content || '<p>Votre HTML ici...</p>'}</div>
                        </div>
                    </div>
                `;
            
            case 'calculations':
                return `
                    <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-xl">🧮</span>
                            <span class="font-medium">Calcul automatique</span>
                        </div>
                        <div class="mt-2 text-sm text-gray-600">
                            Formule: ${field.settings?.formula || 'Aucune formule définie'}
                        </div>
                        <div class="mt-2 text-lg font-bold">Résultat: 0.00</div>
                    </div>
                `;
            
            // Champs de paiement
            case 'currency':
                const currencySettings = field.settings || {};
                return `
                    <div class="relative">
                        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            ${currencySettings.currency === 'USD' ? '$' : currencySettings.currency === 'EUR' ? '€' : '€'}
                        </div>
                        <input type="number" placeholder="0.00" 
                               class="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-blue-500" disabled />
                    </div>
                `;
            
            case 'stripe_payment':
                return `
                    <div class="border border-gray-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div class="flex items-center space-x-2 mb-3">
                            <span class="text-2xl">💳</span>
                            <span class="font-semibold">Paiement Stripe</span>
                        </div>
                        <div class="space-y-2">
                            <input type="text" placeholder="Numéro de carte" class="w-full p-2 border rounded" disabled />
                            <div class="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="MM/AA" class="p-2 border rounded" disabled />
                                <input type="text" placeholder="CVC" class="p-2 border rounded" disabled />
                            </div>
                        </div>
                        <div class="mt-3 text-lg font-bold">Montant: ${field.settings?.amount || 0}€</div>
                    </div>
                `;
            
            case 'paypal_payment':
                return `
                    <div class="border border-blue-600 rounded-lg p-4 bg-blue-50">
                        <div class="flex items-center space-x-2 mb-3">
                            <span class="text-2xl">🅿️</span>
                            <span class="font-semibold text-blue-800">Paiement PayPal</span>
                        </div>
                        <button class="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded" disabled>
                            Payer avec PayPal - ${field.settings?.amount || 0}€
                        </button>
                    </div>
                `;
            
            // Éléments de structure
            case 'section':
                return `
                    <div class="border-l-4 border-blue-500 pl-4 py-2">
                        <h3 class="text-lg font-semibold text-gray-800">${field.label}</h3>
                        ${field.settings?.description ? `<p class="text-gray-600 text-sm">${field.settings.description}</p>` : ''}
                    </div>
                `;
            
            case 'field_group':
                return `
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div class="text-gray-500 text-center">
                            <span class="text-2xl">📊</span>
                            <p class="font-medium">${field.label}</p>
                            <p class="text-sm">Groupe de champs (${field.settings?.fields?.length || 0} champs)</p>
                        </div>
                    </div>
                `;
            
            case 'page_break':
                return `
                    <div class="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 text-center">
                        <div class="text-blue-600">
                            <span class="text-3xl">📃</span>
                            <p class="font-bold">${field.settings?.title || 'Nouvelle page'}</p>
                            <p class="text-sm">${field.settings?.description || 'Les champs suivants seront sur une nouvelle page'}</p>
                        </div>
                    </div>
                `;
            
            case 'consent':
                return `
                    <label class="flex items-start space-x-3 cursor-pointer">
                        <input type="checkbox" class="mt-1 text-blue-600 rounded" disabled />
                        <div class="text-sm">
                            <span>${field.label}</span>
                            ${field.settings?.link ? `<a href="#" class="text-blue-600 underline ml-1">${field.settings.linkText || 'En savoir plus'}</a>` : ''}
                        </div>
                    </label>
                `;
            
            default:
                return `<input type="text" placeholder="${field.label}" class="w-full p-2 border rounded" disabled />`;
        }
    }

    editField(fieldId) {
        const field = this.formFields.find(f => f.id === fieldId);
        if (!field) return;

        this.showFieldEditModal(field);
    }

    showFieldEditModal(field) {
        const modal = document.getElementById('field-edit-modal');
        if (!modal) return;

        // Remplir le modal avec les données du champ
        document.getElementById('edit-field-label').value = field.label;
        document.getElementById('edit-field-placeholder').value = field.placeholder || '';
        document.getElementById('edit-field-required').checked = field.required || false;

        // Options pour select/radio/checkbox
        const optionsContainer = document.getElementById('edit-field-options');
        if (optionsContainer) {
            if (['select', 'radio', 'checkbox'].includes(field.type)) {
                optionsContainer.style.display = 'block';
                this.renderFieldOptions(field.options || []);
            } else {
                optionsContainer.style.display = 'none';
            }
        }

        // Stocker l'ID du champ en cours d'édition
        modal.dataset.editingFieldId = field.id;
        
        // Afficher le modal
        modal.classList.remove('hidden');
    }

    renderFieldOptions(options) {
        const container = document.getElementById('field-options-list');
        if (!container) return;

        const optionsHTML = options.map((option, index) => `
            <div class="flex items-center space-x-2 mb-2">
                <input type="text" value="${option}" 
                       class="flex-1 p-2 border rounded"
                       onchange="formBuilder.updateFieldOption(${index}, this.value)" />
                <button onclick="formBuilder.removeFieldOption(${index})"
                        class="text-red-600 hover:text-red-800">
                    🗑️
                </button>
            </div>
        `).join('');

        container.innerHTML = optionsHTML + `
            <button onclick="formBuilder.addFieldOption()"
                    class="text-blue-600 hover:text-blue-800 text-sm">
                + Ajouter une option
            </button>
        `;
    }

    updateFieldOption(index, value) {
        const modal = document.getElementById('field-edit-modal');
        const fieldId = modal.dataset.editingFieldId;
        const field = this.formFields.find(f => f.id === fieldId);
        
        if (field && field.options) {
            field.options[index] = value;
        }
    }

    addFieldOption() {
        const modal = document.getElementById('field-edit-modal');
        const fieldId = modal.dataset.editingFieldId;
        const field = this.formFields.find(f => f.id === fieldId);
        
        if (field) {
            if (!field.options) field.options = [];
            field.options.push('Nouvelle option');
            this.renderFieldOptions(field.options);
        }
    }

    removeFieldOption(index) {
        const modal = document.getElementById('field-edit-modal');
        const fieldId = modal.dataset.editingFieldId;
        const field = this.formFields.find(f => f.id === fieldId);
        
        if (field && field.options) {
            field.options.splice(index, 1);
            this.renderFieldOptions(field.options);
        }
    }

    saveFieldEdit() {
        const modal = document.getElementById('field-edit-modal');
        const fieldId = modal.dataset.editingFieldId;
        const field = this.formFields.find(f => f.id === fieldId);
        
        if (field) {
            field.label = document.getElementById('edit-field-label').value;
            field.placeholder = document.getElementById('edit-field-placeholder').value;
            field.required = document.getElementById('edit-field-required').checked;
            
            this.renderFormFields();
            this.updatePreview();
            this.markAsDirty();
        }
        
        modal.classList.add('hidden');
    }

    duplicateField(fieldId) {
        const field = this.formFields.find(f => f.id === fieldId);
        if (!field) return;

        const duplicatedField = {
            ...field,
            id: this.generateFieldId(),
            label: field.label + ' (copie)'
        };

        const index = this.formFields.findIndex(f => f.id === fieldId);
        this.formFields.splice(index + 1, 0, duplicatedField);
        
        this.renderFormFields();
        this.updatePreview();
        this.markAsDirty();
    }

    moveField(fieldId, newIndex) {
        const currentIndex = this.formFields.findIndex(f => f.id === fieldId);
        if (currentIndex === -1 || newIndex < 0 || newIndex >= this.formFields.length) return;

        const field = this.formFields.splice(currentIndex, 1)[0];
        this.formFields.splice(newIndex, 0, field);
        
        this.renderFormFields();
        this.updatePreview();
        this.markAsDirty();
    }

    removeField(fieldId) {
        if (!confirm('Voulez-vous vraiment supprimer ce champ ?')) return;

        this.formFields = this.formFields.filter(f => f.id !== fieldId);
        this.renderFormFields();
        this.updatePreview();
        this.markAsDirty();
    }

    updatePreview() {
        const previewContainer = document.getElementById('form-preview');
        if (!previewContainer) return;

        const formHTML = `
            <div class="bg-white p-6 rounded-lg shadow-sm border max-w-2xl mx-auto">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">
                        ${this.currentForm.title || 'Titre du formulaire'}
                    </h2>
                    <p class="text-gray-600">
                        ${this.currentForm.description || 'Description du formulaire'}
                    </p>
                </div>
                
                <form class="space-y-6">
                    ${this.formFields.map(field => this.renderFieldPreview(field)).join('')}
                    
                    <div class="pt-4">
                        <button type="submit" 
                                class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                            ${this.currentForm.settings?.submitButtonText || 'Envoyer'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        previewContainer.innerHTML = formHTML;
    }

    setupEventListeners() {
        // Sauvegarde
        document.getElementById('save-form')?.addEventListener('click', () => {
            this.saveForm();
        });

        // Prévisualisation
        document.getElementById('preview-form')?.addEventListener('click', () => {
            this.togglePreview();
        });

        // Publication
        document.getElementById('publish-form')?.addEventListener('click', () => {
            this.publishForm();
        });

        // Informations du formulaire
        document.getElementById('form-title')?.addEventListener('input', (e) => {
            this.currentForm.title = e.target.value;
            this.updatePreview();
            this.markAsDirty();
        });

        document.getElementById('form-description')?.addEventListener('input', (e) => {
            this.currentForm.description = e.target.value;
            this.updatePreview();
            this.markAsDirty();
        });

        // Paramètres
        document.querySelectorAll('#form-settings input, #form-settings select').forEach(input => {
            input.addEventListener('change', () => {
                this.updateFormSettings();
                this.markAsDirty();
            });
        });

        // Modal field edit
        document.getElementById('save-field-edit')?.addEventListener('click', () => {
            this.saveFieldEdit();
        });

        document.getElementById('cancel-field-edit')?.addEventListener('click', () => {
            document.getElementById('field-edit-modal').classList.add('hidden');
        });

        // Clic sur les templates pour ajouter (géré par onclick dans renderFieldTemplates)
        
        // Prévenir la fermeture accidentelle
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
            }
        });
    }

    setupFieldTypes() {
        // Configuration des types de champs supportés
        this.fieldTypes = {
            text: { name: 'Texte court', icon: '📝' },
            textarea: { name: 'Texte long', icon: '📄' },
            email: { name: 'Email', icon: '📧' },
            number: { name: 'Nombre', icon: '🔢' },
            select: { name: 'Liste déroulante', icon: '📋' },
            radio: { name: 'Choix unique', icon: '⚪' },
            checkbox: { name: 'Cases à cocher', icon: '☑️' },
            date: { name: 'Date', icon: '📅' },
            file: { name: 'Fichier', icon: '📎' },
            rating: { name: 'Évaluation', icon: '⭐' }
        };
    }

    async saveForm() {
        try {
            // Validation
            if (!this.currentForm.title) {
                this.showError('Le titre du formulaire est requis');
                return;
            }

            if (this.formFields.length === 0) {
                this.showError('Le formulaire doit contenir au moins un champ');
                return;
            }

            // Préparer les données
            const formData = {
                ...this.currentForm,
                fields: this.formFields
            };

            let response;
            if (this.editingFormId) {
                response = await this.apiService.updateForm(this.editingFormId, formData);
            } else {
                response = await this.apiService.createForm(formData);
            }

            if (response.success) {
                this.currentForm = response.data;
                this.editingFormId = response.data.id;
                this.isDirty = false;
                this.showSuccess('Formulaire sauvegardé avec succès');
                
                // Mettre à jour l'URL
                if (!this.editingFormId) {
                    window.history.replaceState({}, '', `?id=${response.data.id}`);
                }
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.showError('Erreur lors de la sauvegarde');
        }
    }

    async publishForm() {
        try {
            if (!this.editingFormId) {
                await this.saveForm();
                if (!this.editingFormId) return;
            }

            const response = await this.apiService.publishForm(this.editingFormId);
            if (response.success) {
                this.currentForm.status = 'published';
                this.showSuccess('Formulaire publié avec succès');
                
                // Afficher les liens de partage
                this.showShareModal(response.data.urls);
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('❌ Erreur publication:', error);
            this.showError('Erreur lors de la publication');
        }
    }

    showShareModal(urls) {
        const modal = document.getElementById('share-modal');
        if (!modal) return;

        document.getElementById('form-public-url').value = urls.public;
        document.getElementById('form-embed-code').value = urls.embed;
        
        modal.classList.remove('hidden');
    }

    togglePreview() {
        this.previewMode = !this.previewMode;
        
        const builderView = document.getElementById('builder-view');
        const previewView = document.getElementById('preview-view');
        const previewBtn = document.getElementById('preview-form');
        
        if (this.previewMode) {
            builderView.classList.add('hidden');
            previewView.classList.remove('hidden');
            previewBtn.textContent = '✏️ Modifier';
            this.updatePreview();
        } else {
            builderView.classList.remove('hidden');
            previewView.classList.add('hidden');
            previewBtn.textContent = '👁️ Aperçu';
        }
    }

    startAutoSave() {
        // Sauvegarde automatique toutes les 2 minutes
        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty && this.editingFormId) {
                this.saveForm();
            }
        }, 2 * 60 * 1000);
    }

    initializePreview() {
        this.updatePreview();
    }

    markAsDirty() {
        this.isDirty = true;
        
        // Indication visuelle
        const saveBtn = document.getElementById('save-form');
        if (saveBtn) {
            saveBtn.classList.add('bg-orange-600');
            saveBtn.classList.remove('bg-blue-600');
            saveBtn.textContent = '💾 Sauvegarder *';
        }
    }

    showSuccess(message) {
        this.dynamicPageService?.showSuccess?.(message) || console.log('✅', message);
    }

    showError(message) {
        this.dynamicPageService?.showError?.(message) || console.error('❌', message);
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Initialiser quand la page est chargée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.formBuilder = new FormBuilder();
    });
} else {
    window.formBuilder = new FormBuilder();
}

// Nettoyage lors du déchargement
window.addEventListener('beforeunload', () => {
    if (window.formBuilder) {
        window.formBuilder.destroy();
    }
});
