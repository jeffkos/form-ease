/**
 * 🎯 AdvancedFormTemplates.js - FormEase Sprint 5 Phase 2
 * 
 * Système de templates de formulaires avancés avec constructeur drag & drop
 * Générateur de formulaires dynamiques et intelligents
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 2
 */

class AdvancedFormTemplates {
    constructor() {
        this.templates = new Map();
        this.categories = new Map();
        this.formBuilder = null;
        this.presets = new Map();
        this.validationRules = new Map();
        
        this.initTemplateSystem();
        this.loadDefaultTemplates();
    }
    
    initTemplateSystem() {
        // Configuration des catégories de templates
        this.categories.set('contact', {
            name: 'Contact',
            icon: '📞',
            description: 'Formulaires de contact et communication',
            color: 'blue'
        });
        
        this.categories.set('registration', {
            name: 'Inscription',
            icon: '👤',
            description: 'Formulaires d\'inscription et création de compte',
            color: 'green'
        });
        
        this.categories.set('survey', {
            name: 'Enquête',
            icon: '📊',
            description: 'Questionnaires et sondages',
            color: 'purple'
        });
        
        this.categories.set('application', {
            name: 'Candidature',
            icon: '💼',
            description: 'Formulaires de candidature et CV',
            color: 'indigo'
        });
        
        this.categories.set('booking', {
            name: 'Réservation',
            icon: '📅',
            description: 'Réservations et prises de rendez-vous',
            color: 'orange'
        });
        
        this.categories.set('ecommerce', {
            name: 'E-commerce',
            icon: '🛒',
            description: 'Commandes et paiements',
            color: 'red'
        });
        
        this.categories.set('feedback', {
            name: 'Feedback',
            icon: '💬',
            description: 'Avis et commentaires',
            color: 'teal'
        });
        
        // Presets de validation
        this.setupValidationPresets();
    }
    
    setupValidationPresets() {
        this.validationRules.set('email', {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Veuillez saisir une adresse email valide'
        });
        
        this.validationRules.set('phone', {
            required: true,
            pattern: /^[\d\s\-\+\(\)]+$/,
            minLength: 10,
            message: 'Veuillez saisir un numéro de téléphone valide'
        });
        
        this.validationRules.set('name', {
            required: true,
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-zA-ZÀ-ÿ\s\-\']+$/,
            message: 'Le nom doit contenir uniquement des lettres'
        });
        
        this.validationRules.set('password', {
            required: true,
            minLength: 8,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
        });
        
        this.validationRules.set('url', {
            pattern: /^https?:\/\/.+/,
            message: 'Veuillez saisir une URL valide (http:// ou https://)'
        });
    }
    
    loadDefaultTemplates() {
        // Template de contact simple
        this.registerTemplate('contact-simple', {
            name: 'Contact Simple',
            description: 'Formulaire de contact basique avec nom, email et message',
            category: 'contact',
            difficulty: 'easy',
            estimatedTime: '5 min',
            tags: ['contact', 'simple', 'basique'],
            fields: [
                {
                    id: 'name',
                    type: 'input',
                    inputType: 'text',
                    label: 'Nom complet',
                    placeholder: 'Votre nom',
                    required: true,
                    validation: 'name',
                    gridColumn: 'span-12'
                },
                {
                    id: 'email',
                    type: 'input',
                    inputType: 'email',
                    label: 'Adresse email',
                    placeholder: 'votre@email.com',
                    required: true,
                    validation: 'email',
                    gridColumn: 'span-12'
                },
                {
                    id: 'subject',
                    type: 'input',
                    inputType: 'text',
                    label: 'Sujet',
                    placeholder: 'Sujet de votre message',
                    required: true,
                    gridColumn: 'span-12'
                },
                {
                    id: 'message',
                    type: 'textarea',
                    label: 'Message',
                    placeholder: 'Votre message...',
                    required: true,
                    rows: 5,
                    gridColumn: 'span-12'
                }
            ],
            styling: {
                layout: 'vertical',
                spacing: 'comfortable',
                theme: 'modern'
            },
            actions: [
                {
                    type: 'submit',
                    text: 'Envoyer le message',
                    variant: 'primary',
                    icon: 'send'
                },
                {
                    type: 'reset',
                    text: 'Effacer',
                    variant: 'ghost'
                }
            ]
        });
        
        // Template d'inscription utilisateur
        this.registerTemplate('user-registration', {
            name: 'Inscription Utilisateur',
            description: 'Formulaire d\'inscription complet avec validation',
            category: 'registration',
            difficulty: 'medium',
            estimatedTime: '10 min',
            tags: ['inscription', 'utilisateur', 'compte'],
            fields: [
                {
                    id: 'firstName',
                    type: 'input',
                    inputType: 'text',
                    label: 'Prénom',
                    placeholder: 'Votre prénom',
                    required: true,
                    validation: 'name',
                    gridColumn: 'span-6'
                },
                {
                    id: 'lastName',
                    type: 'input',
                    inputType: 'text',
                    label: 'Nom',
                    placeholder: 'Votre nom',
                    required: true,
                    validation: 'name',
                    gridColumn: 'span-6'
                },
                {
                    id: 'email',
                    type: 'input',
                    inputType: 'email',
                    label: 'Adresse email',
                    placeholder: 'votre@email.com',
                    required: true,
                    validation: 'email',
                    gridColumn: 'span-12'
                },
                {
                    id: 'phone',
                    type: 'input',
                    inputType: 'tel',
                    label: 'Téléphone',
                    placeholder: '+33 1 23 45 67 89',
                    validation: 'phone',
                    gridColumn: 'span-6'
                },
                {
                    id: 'birthDate',
                    type: 'datePicker',
                    label: 'Date de naissance',
                    placeholder: 'JJ/MM/AAAA',
                    maxDate: new Date(),
                    gridColumn: 'span-6'
                },
                {
                    id: 'password',
                    type: 'input',
                    inputType: 'password',
                    label: 'Mot de passe',
                    placeholder: 'Mot de passe sécurisé',
                    required: true,
                    validation: 'password',
                    gridColumn: 'span-6'
                },
                {
                    id: 'confirmPassword',
                    type: 'input',
                    inputType: 'password',
                    label: 'Confirmer le mot de passe',
                    placeholder: 'Répéter le mot de passe',
                    required: true,
                    validation: 'password',
                    gridColumn: 'span-6'
                },
                {
                    id: 'terms',
                    type: 'checkbox',
                    label: 'J\'accepte les conditions d\'utilisation',
                    required: true,
                    gridColumn: 'span-12'
                },
                {
                    id: 'newsletter',
                    type: 'checkbox',
                    label: 'Je souhaite recevoir la newsletter',
                    gridColumn: 'span-12'
                }
            ],
            styling: {
                layout: 'grid',
                spacing: 'comfortable',
                theme: 'modern'
            },
            actions: [
                {
                    type: 'submit',
                    text: 'Créer mon compte',
                    variant: 'primary',
                    icon: 'user-plus'
                }
            ]
        });
        
        // Template de questionnaire de satisfaction
        this.registerTemplate('satisfaction-survey', {
            name: 'Questionnaire de Satisfaction',
            description: 'Sondage de satisfaction client avec échelles et commentaires',
            category: 'survey',
            difficulty: 'medium',
            estimatedTime: '8 min',
            tags: ['satisfaction', 'sondage', 'feedback'],
            fields: [
                {
                    id: 'overallSatisfaction',
                    type: 'rating',
                    label: 'Satisfaction générale',
                    description: 'Comment évaluez-vous votre expérience globale ?',
                    maxRating: 5,
                    required: true,
                    gridColumn: 'span-12'
                },
                {
                    id: 'serviceQuality',
                    type: 'select',
                    label: 'Qualité du service',
                    options: [
                        { value: 'excellent', label: 'Excellent' },
                        { value: 'good', label: 'Bon' },
                        { value: 'average', label: 'Moyen' },
                        { value: 'poor', label: 'Médiocre' }
                    ],
                    required: true,
                    gridColumn: 'span-6'
                },
                {
                    id: 'recommendation',
                    type: 'select',
                    label: 'Recommanderiez-vous nos services ?',
                    options: [
                        { value: 'definitely', label: 'Certainement' },
                        { value: 'probably', label: 'Probablement' },
                        { value: 'maybe', label: 'Peut-être' },
                        { value: 'no', label: 'Non' }
                    ],
                    required: true,
                    gridColumn: 'span-6'
                },
                {
                    id: 'improvements',
                    type: 'checkbox-group',
                    label: 'Quels aspects pourrions-nous améliorer ?',
                    options: [
                        { value: 'speed', label: 'Rapidité du service' },
                        { value: 'quality', label: 'Qualité des produits' },
                        { value: 'support', label: 'Support client' },
                        { value: 'pricing', label: 'Tarification' },
                        { value: 'website', label: 'Site web' }
                    ],
                    gridColumn: 'span-12'
                },
                {
                    id: 'comments',
                    type: 'textarea',
                    label: 'Commentaires supplémentaires',
                    placeholder: 'Vos suggestions et commentaires...',
                    rows: 4,
                    gridColumn: 'span-12'
                }
            ],
            styling: {
                layout: 'sections',
                spacing: 'comfortable',
                theme: 'survey'
            },
            actions: [
                {
                    type: 'submit',
                    text: 'Envoyer le questionnaire',
                    variant: 'primary',
                    icon: 'send'
                }
            ]
        });
        
        // Template de candidature d'emploi
        this.registerTemplate('job-application', {
            name: 'Candidature d\'Emploi',
            description: 'Formulaire de candidature professionnel avec upload de CV',
            category: 'application',
            difficulty: 'hard',
            estimatedTime: '15 min',
            tags: ['emploi', 'candidature', 'CV', 'professionnel'],
            fields: [
                {
                    id: 'personalInfo',
                    type: 'section',
                    title: 'Informations personnelles',
                    gridColumn: 'span-12'
                },
                {
                    id: 'firstName',
                    type: 'input',
                    inputType: 'text',
                    label: 'Prénom',
                    required: true,
                    validation: 'name',
                    gridColumn: 'span-6'
                },
                {
                    id: 'lastName',
                    type: 'input',
                    inputType: 'text',
                    label: 'Nom',
                    required: true,
                    validation: 'name',
                    gridColumn: 'span-6'
                },
                {
                    id: 'email',
                    type: 'input',
                    inputType: 'email',
                    label: 'Email',
                    required: true,
                    validation: 'email',
                    gridColumn: 'span-6'
                },
                {
                    id: 'phone',
                    type: 'input',
                    inputType: 'tel',
                    label: 'Téléphone',
                    required: true,
                    validation: 'phone',
                    gridColumn: 'span-6'
                },
                {
                    id: 'address',
                    type: 'textarea',
                    label: 'Adresse complète',
                    rows: 3,
                    gridColumn: 'span-12'
                },
                {
                    id: 'jobInfo',
                    type: 'section',
                    title: 'Informations sur le poste',
                    gridColumn: 'span-12'
                },
                {
                    id: 'position',
                    type: 'input',
                    inputType: 'text',
                    label: 'Poste souhaité',
                    required: true,
                    gridColumn: 'span-8'
                },
                {
                    id: 'salary',
                    type: 'input',
                    inputType: 'number',
                    label: 'Prétentions salariales (€)',
                    gridColumn: 'span-4'
                },
                {
                    id: 'experience',
                    type: 'select',
                    label: 'Années d\'expérience',
                    options: [
                        { value: '0-1', label: 'Débutant (0-1 an)' },
                        { value: '2-5', label: 'Junior (2-5 ans)' },
                        { value: '5-10', label: 'Confirmé (5-10 ans)' },
                        { value: '10+', label: 'Senior (10+ ans)' }
                    ],
                    required: true,
                    gridColumn: 'span-6'
                },
                {
                    id: 'availability',
                    type: 'datePicker',
                    label: 'Disponibilité',
                    placeholder: 'Date de disponibilité',
                    gridColumn: 'span-6'
                },
                {
                    id: 'motivation',
                    type: 'textarea',
                    label: 'Lettre de motivation',
                    placeholder: 'Décrivez votre motivation pour ce poste...',
                    rows: 6,
                    required: true,
                    gridColumn: 'span-12'
                },
                {
                    id: 'documents',
                    type: 'section',
                    title: 'Documents',
                    gridColumn: 'span-12'
                },
                {
                    id: 'cv',
                    type: 'fileUpload',
                    label: 'CV (PDF, DOC)',
                    accept: '.pdf,.doc,.docx',
                    maxSize: 5 * 1024 * 1024,
                    required: true,
                    gridColumn: 'span-6'
                },
                {
                    id: 'coverLetter',
                    type: 'fileUpload',
                    label: 'Lettre de motivation (optionnel)',
                    accept: '.pdf,.doc,.docx',
                    maxSize: 5 * 1024 * 1024,
                    gridColumn: 'span-6'
                }
            ],
            styling: {
                layout: 'sections',
                spacing: 'comfortable',
                theme: 'professional'
            },
            actions: [
                {
                    type: 'save-draft',
                    text: 'Sauvegarder le brouillon',
                    variant: 'ghost',
                    icon: 'save'
                },
                {
                    type: 'submit',
                    text: 'Envoyer la candidature',
                    variant: 'primary',
                    icon: 'send'
                }
            ]
        });
        
        console.log('🎯 Templates par défaut chargés');
    }
    
    /**
     * Enregistrer un nouveau template
     */
    registerTemplate(id, template) {
        const templateData = {
            id: id,
            ...template,
            created: new Date().toISOString(),
            version: '1.0.0',
            usage: 0
        };
        
        this.templates.set(id, templateData);
        
        console.log(`📝 Template '${template.name}' enregistré`);
        
        return this;
    }
    
    /**
     * Obtenir un template par ID
     */
    getTemplate(id) {
        return this.templates.get(id);
    }
    
    /**
     * Obtenir tous les templates d'une catégorie
     */
    getTemplatesByCategory(category) {
        const templates = [];
        
        this.templates.forEach(template => {
            if (template.category === category) {
                templates.push(template);
            }
        });
        
        return templates.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    /**
     * Rechercher des templates
     */
    searchTemplates(query, filters = {}) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        this.templates.forEach(template => {
            let matches = false;
            
            // Recherche dans le nom, description et tags
            if (template.name.toLowerCase().includes(searchTerm) ||
                template.description.toLowerCase().includes(searchTerm) ||
                template.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
                matches = true;
            }
            
            // Appliquer les filtres
            if (matches) {
                if (filters.category && template.category !== filters.category) {
                    matches = false;
                }
                
                if (filters.difficulty && template.difficulty !== filters.difficulty) {
                    matches = false;
                }
                
                if (filters.tags && !filters.tags.every(tag => template.tags.includes(tag))) {
                    matches = false;
                }
            }
            
            if (matches) {
                results.push({
                    ...template,
                    relevance: this.calculateRelevance(template, searchTerm)
                });
            }
        });
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Générer un formulaire à partir d'un template
     */
    generateForm(templateId, options = {}) {
        const template = this.getTemplate(templateId);
        
        if (!template) {
            throw new Error(`Template '${templateId}' non trouvé`);
        }
        
        // Incrémenter l'usage
        template.usage++;
        
        // Créer le formulaire
        const form = new AdvancedFormBuilder(template, options);
        
        console.log(`🏗️ Formulaire généré à partir du template '${template.name}'`);
        
        return form;
    }
    
    /**
     * Créer un template personnalisé
     */
    createCustomTemplate(baseTemplateId, customizations) {
        const baseTemplate = this.getTemplate(baseTemplateId);
        
        if (!baseTemplate) {
            throw new Error(`Template de base '${baseTemplateId}' non trouvé`);
        }
        
        const customTemplate = this.deepMerge(baseTemplate, {
            ...customizations,
            id: `custom-${Date.now()}`,
            created: new Date().toISOString(),
            version: '1.0.0',
            usage: 0,
            custom: true,
            baseTemplate: baseTemplateId
        });
        
        const templateId = customTemplate.id;
        this.templates.set(templateId, customTemplate);
        
        return templateId;
    }
    
    /**
     * Exporter un template
     */
    exportTemplate(templateId) {
        const template = this.getTemplate(templateId);
        
        if (!template) {
            throw new Error(`Template '${templateId}' non trouvé`);
        }
        
        return {
            formease_template: template,
            version: '5.0.0',
            exported: new Date().toISOString()
        };
    }
    
    /**
     * Importer un template
     */
    importTemplate(templateData) {
        if (!templateData.formease_template) {
            throw new Error('Format de template invalide');
        }
        
        const template = templateData.formease_template;
        const templateId = template.id || `imported-${Date.now()}`;
        
        this.registerTemplate(templateId, {
            ...template,
            imported: true,
            importedAt: new Date().toISOString()
        });
        
        return templateId;
    }
    
    /**
     * Obtenir les statistiques des templates
     */
    getStats() {
        const stats = {
            totalTemplates: this.templates.size,
            categories: {},
            difficulties: { easy: 0, medium: 0, hard: 0 },
            totalUsage: 0,
            mostUsed: null,
            recentlyCreated: []
        };
        
        let maxUsage = 0;
        
        this.templates.forEach(template => {
            // Catégories
            stats.categories[template.category] = (stats.categories[template.category] || 0) + 1;
            
            // Difficultés
            if (template.difficulty) {
                stats.difficulties[template.difficulty]++;
            }
            
            // Usage total
            stats.totalUsage += template.usage || 0;
            
            // Template le plus utilisé
            if (template.usage > maxUsage) {
                maxUsage = template.usage;
                stats.mostUsed = template;
            }
            
            // Templates récemment créés
            const created = new Date(template.created);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            if (created > weekAgo) {
                stats.recentlyCreated.push(template);
            }
        });
        
        return stats;
    }
    
    // Méthodes utilitaires
    calculateRelevance(template, searchTerm) {
        let score = 0;
        
        if (template.name.toLowerCase().includes(searchTerm)) {
            score += 10;
        }
        
        if (template.description.toLowerCase().includes(searchTerm)) {
            score += 5;
        }
        
        template.tags.forEach(tag => {
            if (tag.toLowerCase().includes(searchTerm)) {
                score += 3;
            }
        });
        
        // Bonus pour l'usage
        score += template.usage * 0.1;
        
        return score;
    }
    
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
 * Constructeur de formulaires avancé
 */
class AdvancedFormBuilder {
    constructor(template, options = {}) {
        this.template = template;
        this.options = {
            container: null,
            autoRender: false,
            customValidation: {},
            onSubmit: null,
            onFieldChange: null,
            theme: 'default',
            ...options
        };
        
        this.form = null;
        this.fields = new Map();
        this.validators = new Map();
        this.data = new Map();
        this.errors = new Map();
        
        this.init();
    }
    
    init() {
        this.setupValidators();
        this.createForm();
        
        if (this.options.autoRender && this.options.container) {
            this.render(this.options.container);
        }
    }
    
    setupValidators() {
        // Charger les validateurs depuis AdvancedFormTemplates
        if (window.advancedFormTemplates) {
            window.advancedFormTemplates.validationRules.forEach((rule, key) => {
                this.validators.set(key, rule);
            });
        }
        
        // Ajouter les validateurs personnalisés
        Object.entries(this.options.customValidation).forEach(([key, rule]) => {
            this.validators.set(key, rule);
        });
    }
    
    createForm() {
        this.form = document.createElement('form');
        this.form.className = this.getFormClasses();
        this.form.noValidate = true;
        
        // Créer les champs
        this.template.fields.forEach(fieldConfig => {
            const field = this.createField(fieldConfig);
            if (field) {
                this.fields.set(fieldConfig.id, field);
            }
        });
        
        // Créer les actions
        if (this.template.actions) {
            const actionsContainer = this.createActions();
            this.form.appendChild(actionsContainer);
        }
        
        // Event listeners
        this.setupEventListeners();
    }
    
    createField(fieldConfig) {
        const wrapper = document.createElement('div');
        wrapper.className = this.getFieldWrapperClasses(fieldConfig);
        
        let fieldElement = null;
        
        switch (fieldConfig.type) {
            case 'section':
                fieldElement = this.createSection(fieldConfig);
                break;
            case 'input':
                fieldElement = this.createInput(fieldConfig);
                break;
            case 'textarea':
                fieldElement = this.createTextarea(fieldConfig);
                break;
            case 'select':
                fieldElement = this.createSelect(fieldConfig);
                break;
            case 'datePicker':
                fieldElement = this.createDatePicker(fieldConfig);
                break;
            case 'fileUpload':
                fieldElement = this.createFileUpload(fieldConfig);
                break;
            case 'checkbox':
                fieldElement = this.createCheckbox(fieldConfig);
                break;
            case 'checkbox-group':
                fieldElement = this.createCheckboxGroup(fieldConfig);
                break;
            case 'radio':
                fieldElement = this.createRadio(fieldConfig);
                break;
            case 'rating':
                fieldElement = this.createRating(fieldConfig);
                break;
            default:
                console.warn(`Type de champ non supporté: ${fieldConfig.type}`);
                return null;
        }
        
        if (fieldElement) {
            if (fieldConfig.type !== 'section') {
                // Ajouter le label si nécessaire
                if (fieldConfig.label && fieldConfig.type !== 'checkbox') {
                    const label = this.createLabel(fieldConfig);
                    wrapper.appendChild(label);
                }
                
                // Ajouter la description si présente
                if (fieldConfig.description) {
                    const description = this.createDescription(fieldConfig);
                    wrapper.appendChild(description);
                }
            }
            
            wrapper.appendChild(fieldElement);
            
            // Ajouter le conteneur d'erreur
            if (fieldConfig.type !== 'section') {
                const errorContainer = this.createErrorContainer(fieldConfig.id);
                wrapper.appendChild(errorContainer);
            }
        }
        
        this.form.appendChild(wrapper);
        return wrapper;
    }
    
    createSection(fieldConfig) {
        const section = document.createElement('div');
        section.className = 'col-span-12 mb-6';
        
        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600';
        title.textContent = fieldConfig.title;
        
        section.appendChild(title);
        
        return section;
    }
    
    createInput(fieldConfig) {
        let input;
        
        if (window.createComponent && window.InputComponent) {
            input = createComponent('input', {
                type: fieldConfig.inputType || 'text',
                placeholder: fieldConfig.placeholder || '',
                required: fieldConfig.required || false,
                disabled: fieldConfig.disabled || false,
                onChange: (value) => this.handleFieldChange(fieldConfig.id, value)
            });
            
            return input.render();
        }
        
        // Fallback si les composants UI ne sont pas disponibles
        input = document.createElement('input');
        input.type = fieldConfig.inputType || 'text';
        input.id = fieldConfig.id;
        input.name = fieldConfig.id;
        input.className = this.getInputClasses();
        input.placeholder = fieldConfig.placeholder || '';
        input.required = fieldConfig.required || false;
        input.disabled = fieldConfig.disabled || false;
        
        input.addEventListener('input', (e) => {
            this.handleFieldChange(fieldConfig.id, e.target.value);
        });
        
        return input;
    }
    
    createTextarea(fieldConfig) {
        const textarea = document.createElement('textarea');
        textarea.id = fieldConfig.id;
        textarea.name = fieldConfig.id;
        textarea.className = this.getInputClasses();
        textarea.placeholder = fieldConfig.placeholder || '';
        textarea.required = fieldConfig.required || false;
        textarea.disabled = fieldConfig.disabled || false;
        textarea.rows = fieldConfig.rows || 3;
        
        textarea.addEventListener('input', (e) => {
            this.handleFieldChange(fieldConfig.id, e.target.value);
        });
        
        return textarea;
    }
    
    createSelect(fieldConfig) {
        if (window.createComponent && window.SelectComponent) {
            const select = createComponent('select', {
                options: fieldConfig.options || [],
                placeholder: fieldConfig.placeholder || 'Sélectionner...',
                required: fieldConfig.required || false,
                searchable: fieldConfig.searchable || false,
                multiple: fieldConfig.multiple || false,
                onChange: (value) => this.handleFieldChange(fieldConfig.id, value)
            });
            
            return select.render();
        }
        
        // Fallback
        const select = document.createElement('select');
        select.id = fieldConfig.id;
        select.name = fieldConfig.id;
        select.className = this.getInputClasses();
        select.required = fieldConfig.required || false;
        
        if (fieldConfig.placeholder) {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = fieldConfig.placeholder;
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            select.appendChild(placeholderOption);
        }
        
        fieldConfig.options?.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            select.appendChild(optionElement);
        });
        
        select.addEventListener('change', (e) => {
            this.handleFieldChange(fieldConfig.id, e.target.value);
        });
        
        return select;
    }
    
    createDatePicker(fieldConfig) {
        if (window.createComponent && window.DatePickerComponent) {
            const datePicker = createComponent('datePicker', {
                placeholder: fieldConfig.placeholder || 'Sélectionner une date',
                format: fieldConfig.format || 'DD/MM/YYYY',
                minDate: fieldConfig.minDate,
                maxDate: fieldConfig.maxDate,
                clearable: fieldConfig.clearable !== false,
                onChange: (date, formatted) => this.handleFieldChange(fieldConfig.id, date)
            });
            
            return datePicker.render();
        }
        
        // Fallback
        const input = document.createElement('input');
        input.type = 'date';
        input.id = fieldConfig.id;
        input.name = fieldConfig.id;
        input.className = this.getInputClasses();
        input.required = fieldConfig.required || false;
        
        input.addEventListener('change', (e) => {
            this.handleFieldChange(fieldConfig.id, e.target.value);
        });
        
        return input;
    }
    
    createFileUpload(fieldConfig) {
        if (window.createComponent && window.FileUploadComponent) {
            const fileUpload = createComponent('fileUpload', {
                accept: fieldConfig.accept || '*/*',
                multiple: fieldConfig.multiple || false,
                maxSize: fieldConfig.maxSize || 10 * 1024 * 1024,
                dragAndDrop: fieldConfig.dragAndDrop !== false,
                showPreview: fieldConfig.showPreview !== false,
                onSelect: (files) => this.handleFieldChange(fieldConfig.id, files),
                onError: (error) => this.setFieldError(fieldConfig.id, error)
            });
            
            return fileUpload.render();
        }
        
        // Fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.id = fieldConfig.id;
        input.name = fieldConfig.id;
        input.className = this.getInputClasses();
        input.accept = fieldConfig.accept || '*/*';
        input.multiple = fieldConfig.multiple || false;
        input.required = fieldConfig.required || false;
        
        input.addEventListener('change', (e) => {
            this.handleFieldChange(fieldConfig.id, e.target.files);
        });
        
        return input;
    }
    
    createCheckbox(fieldConfig) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-3';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = fieldConfig.id;
        checkbox.name = fieldConfig.id;
        checkbox.className = 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2';
        checkbox.required = fieldConfig.required || false;
        checkbox.checked = fieldConfig.checked || false;
        
        const label = document.createElement('label');
        label.htmlFor = fieldConfig.id;
        label.className = 'text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer';
        label.textContent = fieldConfig.label;
        
        checkbox.addEventListener('change', (e) => {
            this.handleFieldChange(fieldConfig.id, e.target.checked);
        });
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        
        return wrapper;
    }
    
    createCheckboxGroup(fieldConfig) {
        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-3';
        
        fieldConfig.options?.forEach(option => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'flex items-center gap-3';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${fieldConfig.id}_${option.value}`;
            checkbox.name = fieldConfig.id;
            checkbox.value = option.value;
            checkbox.className = 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2';
            
            const label = document.createElement('label');
            label.htmlFor = `${fieldConfig.id}_${option.value}`;
            label.className = 'text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer';
            label.textContent = option.label;
            
            checkbox.addEventListener('change', () => {
                this.handleCheckboxGroupChange(fieldConfig.id);
            });
            
            optionWrapper.appendChild(checkbox);
            optionWrapper.appendChild(label);
            wrapper.appendChild(optionWrapper);
        });
        
        return wrapper;
    }
    
    createRating(fieldConfig) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2';
        
        const maxRating = fieldConfig.maxRating || 5;
        
        for (let i = 1; i <= maxRating; i++) {
            const star = document.createElement('button');
            star.type = 'button';
            star.className = 'w-8 h-8 text-gray-300 hover:text-yellow-400 transition-colors focus:outline-none';
            star.innerHTML = `
                <svg fill="currentColor" viewBox="0 0 20 20" class="w-full h-full">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
            `;
            
            star.addEventListener('click', () => {
                this.handleRatingChange(fieldConfig.id, i, maxRating);
            });
            
            wrapper.appendChild(star);
        }
        
        return wrapper;
    }
    
    createLabel(fieldConfig) {
        const label = document.createElement('label');
        label.htmlFor = fieldConfig.id;
        label.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
        label.textContent = fieldConfig.label;
        
        if (fieldConfig.required) {
            const required = document.createElement('span');
            required.className = 'text-red-500 ml-1';
            required.textContent = '*';
            label.appendChild(required);
        }
        
        return label;
    }
    
    createDescription(fieldConfig) {
        const description = document.createElement('p');
        description.className = 'text-sm text-gray-500 dark:text-gray-400 mb-2';
        description.textContent = fieldConfig.description;
        
        return description;
    }
    
    createErrorContainer(fieldId) {
        const container = document.createElement('div');
        container.id = `error-${fieldId}`;
        container.className = 'mt-1 text-sm text-red-600 dark:text-red-400 hidden';
        
        return container;
    }
    
    createActions() {
        const container = document.createElement('div');
        container.className = 'col-span-12 flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-600';
        
        this.template.actions.forEach(action => {
            let button;
            
            if (window.createComponent && window.ButtonComponent) {
                button = createComponent('button', {
                    text: action.text,
                    variant: action.variant || 'primary',
                    type: action.type === 'submit' ? 'submit' : 'button',
                    onClick: () => this.handleActionClick(action)
                });
                
                container.appendChild(button.render());
            } else {
                // Fallback
                button = document.createElement('button');
                button.type = action.type === 'submit' ? 'submit' : 'button';
                button.className = this.getButtonClasses(action.variant);
                button.textContent = action.text;
                
                button.addEventListener('click', (e) => {
                    if (action.type !== 'submit') {
                        e.preventDefault();
                    }
                    this.handleActionClick(action);
                });
                
                container.appendChild(button);
            }
        });
        
        return container;
    }
    
    // Event handlers
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }
    
    handleFieldChange(fieldId, value) {
        this.data.set(fieldId, value);
        this.validateField(fieldId, value);
        
        if (this.options.onFieldChange) {
            this.options.onFieldChange(fieldId, value, this.getFormData());
        }
    }
    
    handleCheckboxGroupChange(fieldId) {
        const checkboxes = this.form.querySelectorAll(`input[name="${fieldId}"]:checked`);
        const values = Array.from(checkboxes).map(cb => cb.value);
        this.handleFieldChange(fieldId, values);
    }
    
    handleRatingChange(fieldId, rating, maxRating) {
        const wrapper = this.form.querySelector(`#${fieldId}`).closest('.flex');
        const stars = wrapper.querySelectorAll('button');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
        
        this.handleFieldChange(fieldId, rating);
    }
    
    handleActionClick(action) {
        switch (action.type) {
            case 'submit':
                // Géré par l'event listener du formulaire
                break;
            case 'reset':
                this.reset();
                break;
            case 'save-draft':
                this.saveDraft();
                break;
            default:
                if (action.onClick) {
                    action.onClick(this.getFormData());
                }
        }
    }
    
    handleSubmit() {
        if (this.validate()) {
            const formData = this.getFormData();
            
            if (this.options.onSubmit) {
                this.options.onSubmit(formData, this);
            } else {
                console.log('Formulaire soumis:', formData);
            }
        }
    }
    
    // Validation
    validateField(fieldId, value) {
        const fieldConfig = this.template.fields.find(f => f.id === fieldId);
        if (!fieldConfig) return true;
        
        const errors = [];
        
        // Validation required
        if (fieldConfig.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
            errors.push('Ce champ est obligatoire');
        }
        
        // Validation avec règles prédéfinies
        if (fieldConfig.validation && value) {
            const rule = this.validators.get(fieldConfig.validation);
            if (rule) {
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors.push(rule.message);
                } else if (rule.minLength && value.length < rule.minLength) {
                    errors.push(`Minimum ${rule.minLength} caractères`);
                } else if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push(`Maximum ${rule.maxLength} caractères`);
                }
            }
        }
        
        // Validation personnalisée
        if (fieldConfig.customValidation && typeof fieldConfig.customValidation === 'function') {
            const customError = fieldConfig.customValidation(value);
            if (customError) {
                errors.push(customError);
            }
        }
        
        if (errors.length > 0) {
            this.setFieldError(fieldId, errors[0]);
            return false;
        } else {
            this.clearFieldError(fieldId);
            return true;
        }
    }
    
    validate() {
        let isValid = true;
        
        this.template.fields.forEach(fieldConfig => {
            if (fieldConfig.type !== 'section') {
                const value = this.data.get(fieldConfig.id);
                if (!this.validateField(fieldConfig.id, value)) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }
    
    setFieldError(fieldId, message) {
        const errorContainer = this.form.querySelector(`#error-${fieldId}`);
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.remove('hidden');
        }
        
        this.errors.set(fieldId, message);
    }
    
    clearFieldError(fieldId) {
        const errorContainer = this.form.querySelector(`#error-${fieldId}`);
        if (errorContainer) {
            errorContainer.classList.add('hidden');
        }
        
        this.errors.delete(fieldId);
    }
    
    // Méthodes publiques
    render(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container) {
            container.appendChild(this.form);
        }
        
        return this.form;
    }
    
    getFormData() {
        const data = {};
        this.data.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }
    
    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            this.data.set(key, value);
            
            // Mettre à jour l'interface
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else if (field.type === 'radio') {
                    this.form.querySelector(`[name="${key}"][value="${value}"]`).checked = true;
                } else {
                    field.value = value;
                }
            }
        });
    }
    
    reset() {
        this.data.clear();
        this.errors.clear();
        this.form.reset();
        
        // Nettoyer les erreurs
        this.form.querySelectorAll('[id^="error-"]').forEach(error => {
            error.classList.add('hidden');
        });
    }
    
    saveDraft() {
        const data = this.getFormData();
        const draftKey = `formease-draft-${this.template.id}`;
        
        localStorage.setItem(draftKey, JSON.stringify({
            data: data,
            savedAt: new Date().toISOString(),
            templateId: this.template.id
        }));
        
        console.log('Brouillon sauvegardé');
    }
    
    loadDraft() {
        const draftKey = `formease-draft-${this.template.id}`;
        const draft = localStorage.getItem(draftKey);
        
        if (draft) {
            try {
                const draftData = JSON.parse(draft);
                this.setFormData(draftData.data);
                return draftData;
            } catch (error) {
                console.error('Erreur lors du chargement du brouillon:', error);
            }
        }
        
        return null;
    }
    
    // Utilitaires de style
    getFormClasses() {
        const layoutClass = this.template.styling?.layout === 'grid' ? 'grid grid-cols-12 gap-6' : 'space-y-6';
        return `${layoutClass} p-6`;
    }
    
    getFieldWrapperClasses(fieldConfig) {
        const gridColumn = fieldConfig.gridColumn || 'span-12';
        return `col-${gridColumn}`;
    }
    
    getInputClasses() {
        return 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    }
    
    getButtonClasses(variant = 'primary') {
        const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
        
        switch (variant) {
            case 'primary':
                return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`;
            case 'secondary':
                return `${baseClasses} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500`;
            case 'ghost':
                return `${baseClasses} text-gray-700 hover:bg-gray-100 focus:ring-gray-500`;
            default:
                return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`;
        }
    }
}

// Export global
window.AdvancedFormTemplates = AdvancedFormTemplates;
window.AdvancedFormBuilder = AdvancedFormBuilder;

// Instance globale
const advancedFormTemplates = new AdvancedFormTemplates();
window.advancedFormTemplates = advancedFormTemplates;

// Méthodes globales
window.createFormFromTemplate = (templateId, options) => {
    return advancedFormTemplates.generateForm(templateId, options);
};

window.getFormTemplates = (category) => {
    if (category) {
        return advancedFormTemplates.getTemplatesByCategory(category);
    }
    return Array.from(advancedFormTemplates.templates.values());
};

console.log('🎯 AdvancedFormTemplates initialisé avec', advancedFormTemplates.templates.size, 'templates');
