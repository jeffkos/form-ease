/**
 * 🤖 FormGeneratorAI - Moteur IA Nouvelle Génération
 * Génération intelligente de formulaires à partir de texte libre
 * Sprint 3 - Fonctionnalités métier avancées
 */

class FormGeneratorAI {
    constructor() {
        this.model = 'gpt-4-turbo'; // Modèle IA utilisé
        this.apiEndpoint = '/api/ai/generate-form';
        this.confidence = 0.85;
        this.maxRetries = 3;
        this.cache = new Map();
        this.learningData = [];
        
        // Patterns de reconnaissance métier
        this.businessPatterns = {
            healthcare: ['patient', 'médical', 'santé', 'diagnostic', 'traitement'],
            education: ['étudiant', 'cours', 'formation', 'éducation', 'école'],
            legal: ['contrat', 'juridique', 'avocat', 'tribunal', 'droit'],
            corporate: ['entreprise', 'business', 'commercial', 'société', 'client'],
            creative: ['design', 'créatif', 'artistique', 'portfolio', 'projet'],
            tech: ['développement', 'software', 'application', 'technique', 'code']
        };
        
        // Templates sectoriels pré-définis
        this.sectorTemplates = {
            healthcare: {
                colors: ['#10b981', '#064e3b'],
                fields: ['nom', 'prénom', 'date_naissance', 'sexe', 'adresse'],
                validations: ['required', 'email', 'phone', 'date'],
                layout: 'vertical'
            },
            education: {
                colors: ['#f59e0b', '#92400e'],
                fields: ['nom_étudiant', 'classe', 'matière', 'note'],
                validations: ['required', 'numeric', 'range'],
                layout: 'grid'
            },
            legal: {
                colors: ['#1f2937', '#fbbf24'],
                fields: ['nom_client', 'type_dossier', 'date_ouverture'],
                validations: ['required', 'legal_format'],
                layout: 'formal'
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('🤖 FormGeneratorAI initialisé');
        this.loadLearningData();
        this.setupEventListeners();
    }
    
    /**
     * 🎯 Génération principale de formulaire depuis texte libre
     */
    async generateFromText(userText) {
        const startTime = performance.now();
        
        try {
            // 1. Cache check
            const cached = this.getCachedResult(userText);
            if (cached) {
                console.log('📋 Résultat trouvé en cache');
                return cached;
            }
            
            // 2. Analyse contextuelle
            const context = await this.analyzeContext(userText);
            console.log('🔍 Contexte analysé:', context);
            
            // 3. Génération IA
            const aiResult = await this.callAIGeneration(userText, context);
            
            // 4. Validation et amélioration
            const optimizedForm = await this.optimizeForm(aiResult, context);
            
            // 5. Application du thème sectoriel
            const themedForm = this.applyTheme(optimizedForm, context.sector);
            
            // 6. Mise en cache et apprentissage
            this.cacheResult(userText, themedForm);
            this.addLearningData(userText, themedForm, context);
            
            const duration = performance.now() - startTime;
            console.log(`✅ Formulaire généré en ${duration.toFixed(2)}ms`);
            
            return {
                form: themedForm,
                metadata: {
                    sector: context.sector,
                    confidence: context.confidence,
                    generation_time: duration,
                    suggestions: context.suggestions
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur génération IA:', error);
            return this.getFallbackForm(userText);
        }
    }
    
    /**
     * 🔍 Analyse contextuelle du texte utilisateur
     */
    async analyzeContext(text) {
        const words = text.toLowerCase().split(/\s+/);
        
        // Détection du secteur
        const sectorScores = {};
        Object.keys(this.businessPatterns).forEach(sector => {
            sectorScores[sector] = this.businessPatterns[sector]
                .filter(pattern => words.some(word => word.includes(pattern)))
                .length;
        });
        
        const detectedSector = Object.keys(sectorScores)
            .reduce((a, b) => sectorScores[a] > sectorScores[b] ? a : b);
        
        // Extraction des entités
        const entities = this.extractEntities(text);
        
        // Analyse d'intention
        const intent = this.analyzeIntent(text);
        
        // Génération de suggestions
        const suggestions = this.generateSuggestions(entities, intent, detectedSector);
        
        return {
            sector: detectedSector,
            confidence: Math.max(...Object.values(sectorScores)) / this.businessPatterns[detectedSector].length,
            entities: entities,
            intent: intent,
            suggestions: suggestions,
            complexity: this.assessComplexity(text)
        };
    }
    
    /**
     * 🎯 Extraction d'entités du texte
     */
    extractEntities(text) {
        const entities = {
            fields: [],
            validations: [],
            actions: [],
            conditions: []
        };
        
        // Pattern matching pour les champs
        const fieldPatterns = [
            /\b(nom|prénom|email|téléphone|adresse|date|âge)\b/gi,
            /\b(champ|zone|input|select|checkbox|radio)\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /\b(saisir|entrer|remplir)\s+([a-zA-ZÀ-ÿ\s]+)/gi
        ];
        
        fieldPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                entities.fields.push(...matches.map(m => m.trim().toLowerCase()));
            }
        });
        
        // Pattern matching pour les validations
        const validationPatterns = [
            /\b(obligatoire|requis|nécessaire)\b/gi,
            /\b(format|validation|vérification)\b/gi,
            /\b(minimum|maximum|entre)\s+(\d+)/gi
        ];
        
        validationPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                entities.validations.push(...matches.map(m => m.trim().toLowerCase()));
            }
        });
        
        return entities;
    }
    
    /**
     * 🎯 Analyse d'intention utilisateur
     */
    analyzeIntent(text) {
        const intents = {
            create: ['créer', 'faire', 'générer', 'construire', 'développer'],
            modify: ['modifier', 'changer', 'adapter', 'ajuster', 'personnaliser'],
            copy: ['copier', 'dupliquer', 'cloner', 'reproduire'],
            template: ['template', 'modèle', 'exemple', 'base']
        };
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
                return intent;
            }
        }
        
        return 'create'; // Défaut
    }
    
    /**
     * 🔧 Appel à l'API IA pour génération
     */
    async callAIGeneration(text, context) {
        const prompt = this.buildPrompt(text, context);
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getApiKey()}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: this.model,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const result = await response.json();
            return this.parseAIResponse(result.choices[0].message.content);
            
        } catch (error) {
            console.error('❌ Erreur API IA:', error);
            
            // Fallback avec génération heuristique
            return this.generateHeuristicForm(text, context);
        }
    }
    
    /**
     * 🏗️ Construction du prompt IA
     */
    buildPrompt(text, context) {
        return `
Tu es un expert en génération de formulaires. Génère un formulaire JSON à partir de cette description:

DESCRIPTION: "${text}"

CONTEXTE:
- Secteur détecté: ${context.sector}
- Entités: ${JSON.stringify(context.entities)}
- Intention: ${context.intent}
- Complexité: ${context.complexity}

INSTRUCTIONS:
1. Crée un formulaire JSON avec les propriétés: title, description, fields, layout, validations
2. Utilise les meilleures pratiques UX pour le secteur ${context.sector}
3. Inclus des validations appropriées
4. Optimise pour l'accessibilité
5. Adapte le layout selon la complexité

FORMAT DE RÉPONSE (JSON uniquement):
{
  "title": "Titre du formulaire",
  "description": "Description claire",
  "fields": [
    {
      "name": "nom_champ",
      "type": "text|email|number|select|textarea|checkbox|radio|date",
      "label": "Libellé visible",
      "placeholder": "Texte d'aide",
      "required": true|false,
      "validation": {...},
      "options": [...] // pour select/radio
    }
  ],
  "layout": "vertical|horizontal|grid|wizard",
  "styling": {
    "theme": "secteur_adapté",
    "colors": ["#primary", "#secondary"]
  },
  "submit": {
    "text": "Texte du bouton",
    "action": "URL ou fonction"
  }
}
        `;
    }
    
    /**
     * 🔄 Génération heuristique de fallback
     */
    generateHeuristicForm(text, context) {
        const template = this.sectorTemplates[context.sector] || this.sectorTemplates.corporate;
        
        return {
            title: this.extractTitle(text) || 'Formulaire Généré',
            description: `Formulaire généré automatiquement à partir de: "${text.substring(0, 100)}..."`,
            fields: this.generateHeuristicFields(context.entities, template),
            layout: template.layout,
            styling: {
                theme: context.sector,
                colors: template.colors
            },
            submit: {
                text: 'Envoyer',
                action: '/submit-form'
            }
        };
    }
    
    /**
     * 🎨 Génération heuristique des champs
     */
    generateHeuristicFields(entities, template) {
        const fields = [];
        
        // Champs de base du template
        template.fields.forEach(fieldName => {
            fields.push({
                name: fieldName,
                type: this.inferFieldType(fieldName),
                label: this.formatLabel(fieldName),
                placeholder: this.generatePlaceholder(fieldName),
                required: true,
                validation: this.getValidationRules(fieldName)
            });
        });
        
        // Champs extraits des entités
        entities.fields.forEach(entity => {
            if (!fields.some(f => f.name === entity)) {
                fields.push({
                    name: entity.replace(/\s+/g, '_'),
                    type: this.inferFieldType(entity),
                    label: this.formatLabel(entity),
                    placeholder: this.generatePlaceholder(entity),
                    required: entities.validations.includes('obligatoire'),
                    validation: this.getValidationRules(entity)
                });
            }
        });
        
        return fields;
    }
    
    /**
     * 🎯 Optimisation du formulaire généré
     */
    async optimizeForm(form, context) {
        // Optimisation UX
        form.fields = this.optimizeFieldOrder(form.fields);
        form.fields = this.addSmartValidations(form.fields);
        form.fields = this.addAccessibilityFeatures(form.fields);
        
        // Optimisation performance
        form = this.addConditionalLogic(form);
        form = this.optimizeForMobile(form);
        
        // Optimisation secteur
        form = this.applySectorBestPractices(form, context.sector);
        
        return form;
    }
    
    /**
     * 🎨 Application du thème sectoriel
     */
    applyTheme(form, sector) {
        const theme = this.sectorTemplates[sector] || this.sectorTemplates.corporate;
        
        form.styling = {
            ...form.styling,
            sector: sector,
            colors: theme.colors,
            layout: theme.layout,
            customCSS: this.generateSectorCSS(sector)
        };
        
        return form;
    }
    
    /**
     * 💾 Gestion du cache
     */
    getCachedResult(text) {
        const key = this.hashText(text);
        return this.cache.get(key);
    }
    
    cacheResult(text, result) {
        const key = this.hashText(text);
        this.cache.set(key, {
            ...result,
            cached_at: Date.now()
        });
        
        // Nettoyage cache (max 100 entrées)
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    /**
     * 📚 Apprentissage et amélioration
     */
    addLearningData(text, form, context) {
        this.learningData.push({
            input: text,
            output: form,
            context: context,
            timestamp: Date.now(),
            usage_count: 1
        });
        
        // Limite des données d'apprentissage
        if (this.learningData.length > 1000) {
            this.learningData = this.learningData.slice(-500);
        }
        
        this.saveLearningData();
    }
    
    /**
     * 🔧 Méthodes utilitaires
     */
    hashText(text) {
        return btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }
    
    extractTitle(text) {
        const titlePatterns = [
            /formulaire\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /créer\s+un?\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /pour\s+([a-zA-ZÀ-ÿ\s]+)/gi
        ];
        
        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    inferFieldType(fieldName) {
        const typeMap = {
            email: 'email',
            téléphone: 'tel',
            phone: 'tel',
            date: 'date',
            âge: 'number',
            age: 'number',
            description: 'textarea',
            commentaire: 'textarea',
            mot_de_passe: 'password',
            password: 'password'
        };
        
        return typeMap[fieldName.toLowerCase()] || 'text';
    }
    
    formatLabel(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    generatePlaceholder(fieldName) {
        const placeholders = {
            nom: 'Votre nom',
            prénom: 'Votre prénom',
            email: 'exemple@email.com',
            téléphone: '06 12 34 56 78',
            adresse: 'Votre adresse complète',
            date: 'JJ/MM/AAAA'
        };
        
        return placeholders[fieldName.toLowerCase()] || `Entrez votre ${fieldName.toLowerCase()}`;
    }
    
    getValidationRules(fieldName) {
        const rules = {
            email: { pattern: '^[^@]+@[^@]+\.[^@]+$', message: 'Email invalide' },
            téléphone: { pattern: '^[0-9]{10}$', message: 'Numéro de téléphone invalide' },
            nom: { minLength: 2, message: 'Minimum 2 caractères' },
            prénom: { minLength: 2, message: 'Minimum 2 caractères' }
        };
        
        return rules[fieldName.toLowerCase()] || {};
    }
    
    assessComplexity(text) {
        const words = text.split(/\s+/).length;
        const entities = this.extractEntities(text);
        const fieldCount = entities.fields.length;
        
        if (words < 10 && fieldCount < 3) return 'simple';
        if (words < 50 && fieldCount < 8) return 'medium';
        return 'complex';
    }
    
    generateSuggestions(entities, intent, sector) {
        return [
            `Ajouter des champs ${sector} typiques`,
            `Optimiser pour mobile`,
            `Ajouter des validations intelligentes`,
            `Personnaliser le thème ${sector}`
        ];
    }
    
    optimizeFieldOrder(fields) {
        // Logique de tri: informations personnelles d'abord, puis spécifiques
        const order = ['nom', 'prénom', 'email', 'téléphone', 'adresse'];
        return fields.sort((a, b) => {
            const aIndex = order.indexOf(a.name);
            const bIndex = order.indexOf(b.name);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }
    
    addSmartValidations(fields) {
        return fields.map(field => {
            if (field.type === 'email') {
                field.validation = {
                    ...field.validation,
                    async: true,
                    checkDomain: true
                };
            }
            return field;
        });
    }
    
    addAccessibilityFeatures(fields) {
        return fields.map(field => ({
            ...field,
            accessibility: {
                ariaLabel: field.label,
                description: field.placeholder,
                required: field.required
            }
        }));
    }
    
    addConditionalLogic(form) {
        // Ajouter de la logique conditionnelle simple
        form.conditionalLogic = {
            rules: [],
            enabled: true
        };
        return form;
    }
    
    optimizeForMobile(form) {
        form.responsive = {
            breakpoints: {
                mobile: '768px',
                tablet: '1024px'
            },
            mobileLayout: 'stack',
            touchOptimized: true
        };
        return form;
    }
    
    applySectorBestPractices(form, sector) {
        const practices = {
            healthcare: {
                privacy: true,
                encryption: true,
                gdprCompliant: true
            },
            legal: {
                audit: true,
                versioning: true,
                signatures: true
            },
            education: {
                simplified: true,
                guidance: true,
                multilingual: false
            }
        };
        
        form.bestPractices = practices[sector] || {};
        return form;
    }
    
    generateSectorCSS(sector) {
        const styles = {
            healthcare: `
                .form-container { border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); }
                .field-group { margin-bottom: 1.5rem; }
                .submit-btn { background: linear-gradient(135deg, #10b981, #059669); }
            `,
            legal: `
                .form-container { border: 2px solid #1f2937; background: #f9fafb; }
                .field-group { border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; }
                .submit-btn { background: #1f2937; color: #fbbf24; }
            `,
            education: `
                .form-container { background: linear-gradient(135deg, #fef3c7, #fde68a); }
                .field-group { background: white; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
                .submit-btn { background: linear-gradient(135deg, #f59e0b, #d97706); }
            `
        };
        
        return styles[sector] || styles.corporate || '';
    }
    
    getFallbackForm(text) {
        return {
            form: {
                title: 'Formulaire Simple',
                description: 'Formulaire généré en mode fallback',
                fields: [
                    { name: 'nom', type: 'text', label: 'Nom', required: true },
                    { name: 'email', type: 'email', label: 'Email', required: true },
                    { name: 'message', type: 'textarea', label: 'Message', required: false }
                ],
                layout: 'vertical',
                styling: { theme: 'default', colors: ['#3b82f6', '#1e40af'] }
            },
            metadata: {
                sector: 'unknown',
                confidence: 0.1,
                fallback: true
            }
        };
    }
    
    getApiKey() {
        return localStorage.getItem('ai_api_key') || 'demo-key';
    }
    
    parseAIResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('❌ Erreur parsing réponse IA:', error);
            throw new Error('Réponse IA invalide');
        }
    }
    
    loadLearningData() {
        const saved = localStorage.getItem('formgen_learning_data');
        if (saved) {
            try {
                this.learningData = JSON.parse(saved);
            } catch (error) {
                console.warn('⚠️ Données d\'apprentissage corrompues');
                this.learningData = [];
            }
        }
    }
    
    saveLearningData() {
        try {
            localStorage.setItem('formgen_learning_data', JSON.stringify(this.learningData));
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder les données d\'apprentissage');
        }
    }
    
    setupEventListeners() {
        // Écouter les événements de génération
        document.addEventListener('formgen:generate', (event) => {
            this.generateFromText(event.detail.text);
        });
        
        // Écouter les retours utilisateur
        document.addEventListener('formgen:feedback', (event) => {
            this.processFeedback(event.detail);
        });
    }
    
    processFeedback(feedback) {
        console.log('📊 Feedback reçu:', feedback);
        // Logique d'amélioration basée sur le feedback
    }
    
    /**
     * 🎯 API publique pour tests et intégration
     */
    async generateQuickForm(description) {
        return await this.generateFromText(description);
    }
    
    getStats() {
        return {
            cache_size: this.cache.size,
            learning_data_count: this.learningData.length,
            supported_sectors: Object.keys(this.businessPatterns),
            last_generation: this.lastGeneration
        };
    }
    
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache vidé');
    }
    
    exportLearningData() {
        return JSON.stringify(this.learningData, null, 2);
    }
}

// Export global
window.FormGeneratorAI = FormGeneratorAI;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.formGeneratorAI) {
        window.formGeneratorAI = new FormGeneratorAI();
        console.log('🤖 FormGeneratorAI initialisé globalement');
    }
});

// Export pour compatibilité navigateur
window.FormGeneratorAI = FormGeneratorAI;
