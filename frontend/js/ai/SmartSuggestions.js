/**
 * 💡 SmartSuggestions - Suggestions Intelligentes Temps Réel
 * Système de suggestions contextuelles et apprentissage adaptatif
 * Sprint 3 - Intelligence et Automatisation
 */

class SmartSuggestions {
    constructor() {
        this.version = '3.0';
        this.maxSuggestions = 8;
        this.debounceDelay = 300;
        this.confidence_threshold = 0.6;
        
        // Cache des suggestions
        this.suggestionsCache = new Map();
        this.userInteractions = [];
        this.learningData = {
            accepted_suggestions: [],
            rejected_suggestions: [],
            user_patterns: {},
            sector_preferences: {}
        };
        
        // Types de suggestions disponibles
        this.suggestionTypes = {
            field_suggestion: {
                priority: 1,
                icon: '📝',
                category: 'Champs'
            },
            validation_suggestion: {
                priority: 2,
                icon: '✅',
                category: 'Validation'
            },
            layout_suggestion: {
                priority: 3,
                icon: '🎨',
                category: 'Mise en page'
            },
            ux_suggestion: {
                priority: 4,
                icon: '🎯',
                category: 'Expérience utilisateur'
            },
            integration_suggestion: {
                priority: 5,
                icon: '🔗',
                category: 'Intégration'
            },
            optimization_suggestion: {
                priority: 6,
                icon: '⚡',
                category: 'Optimisation'
            }
        };
        
        // Templates de suggestions par secteur
        this.sectorSuggestions = {
            healthcare: {
                fields: [
                    { name: 'numero_secu', label: 'Numéro de sécurité sociale', type: 'text', validation: 'secu_format' },
                    { name: 'medecin_traitant', label: 'Médecin traitant', type: 'text' },
                    { name: 'allergies', label: 'Allergies connues', type: 'textarea' },
                    { name: 'antecedents', label: 'Antécédents médicaux', type: 'textarea' },
                    { name: 'mutuelle', label: 'Mutuelle', type: 'select' }
                ],
                validations: ['rgpd_consent', 'medical_consent', 'data_retention'],
                layouts: ['wizard', 'vertical'],
                integrations: ['DMP', 'RPPS', 'FHIR']
            },
            education: {
                fields: [
                    { name: 'ine', label: 'Numéro INE', type: 'text', validation: 'ine_format' },
                    { name: 'classe', label: 'Classe', type: 'select' },
                    { name: 'etablissement', label: 'Établissement', type: 'text' },
                    { name: 'responsable_legal', label: 'Responsable légal', type: 'text' },
                    { name: 'niveau_scolaire', label: 'Niveau scolaire', type: 'select' }
                ],
                validations: ['age_verification', 'parental_consent', 'academic_year'],
                layouts: ['card', 'grid'],
                integrations: ['Pronote', 'ENT', 'SIECLE']
            },
            legal: {
                fields: [
                    { name: 'reference_dossier', label: 'Référence dossier', type: 'text', validation: 'legal_ref' },
                    { name: 'type_procedure', label: 'Type de procédure', type: 'select' },
                    { name: 'juridiction', label: 'Juridiction compétente', type: 'select' },
                    { name: 'avocat_ref', label: 'Avocat référent', type: 'text' },
                    { name: 'date_echeance', label: 'Date d\'échéance', type: 'date' }
                ],
                validations: ['legal_format', 'signature_required', 'archive_duration'],
                layouts: ['formal', 'vertical'],
                integrations: ['e-barreau', 'RPVA', 'DataJust']
            },
            corporate: {
                fields: [
                    { name: 'siret', label: 'Numéro SIRET', type: 'text', validation: 'siret_format' },
                    { name: 'secteur_activite', label: 'Secteur d\'activité', type: 'select' },
                    { name: 'chiffre_affaires', label: 'Chiffre d\'affaires', type: 'number', validation: 'currency' },
                    { name: 'effectif', label: 'Nombre d\'employés', type: 'number' },
                    { name: 'forme_juridique', label: 'Forme juridique', type: 'select' }
                ],
                validations: ['business_format', 'tva_validation', 'commercial_register'],
                layouts: ['grid', 'horizontal'],
                integrations: ['Salesforce', 'HubSpot', 'SAP']
            }
        };
        
        // Patterns de suggestions contextuelles
        this.contextPatterns = {
            incomplete_form: {
                trigger: (form) => form.fields.length < 3,
                suggestions: ['add_essential_fields', 'sector_specific_fields']
            },
            missing_validation: {
                trigger: (form) => form.fields.some(f => !f.validation),
                suggestions: ['add_validations', 'smart_validation']
            },
            poor_ux: {
                trigger: (form) => form.fields.length > 10 && form.layout === 'vertical',
                suggestions: ['wizard_layout', 'group_fields', 'progressive_disclosure']
            },
            mobile_unfriendly: {
                trigger: (form) => !form.responsive,
                suggestions: ['mobile_optimization', 'touch_friendly', 'responsive_layout']
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('💡 SmartSuggestions v3.0 initialisé');
        this.loadLearningData();
        this.setupEventListeners();
        this.initializeML();
    }
    
    /**
     * 🎯 Génération de suggestions principales
     */
    async generateSuggestions(context, currentForm = null) {
        const startTime = performance.now();
        
        try {
            const suggestions = [];
            
            // 1. Suggestions basées sur le contexte
            const contextSuggestions = await this.generateContextSuggestions(context);
            suggestions.push(...contextSuggestions);
            
            // 2. Suggestions basées sur le secteur
            const sectorSuggestions = this.generateSectorSuggestions(context.sector);
            suggestions.push(...sectorSuggestions);
            
            // 3. Suggestions basées sur le formulaire actuel
            if (currentForm) {
                const formSuggestions = this.generateFormSuggestions(currentForm, context);
                suggestions.push(...formSuggestions);
            }
            
            // 4. Suggestions d'apprentissage automatique
            const mlSuggestions = await this.generateMLSuggestions(context);
            suggestions.push(...mlSuggestions);
            
            // 5. Filtrage et classement
            const rankedSuggestions = this.rankSuggestions(suggestions, context);
            const finalSuggestions = this.filterSuggestions(rankedSuggestions);
            
            const duration = performance.now() - startTime;
            console.log(`💡 ${finalSuggestions.length} suggestions générées en ${duration.toFixed(2)}ms`);
            
            return {
                suggestions: finalSuggestions,
                metadata: {
                    total_generated: suggestions.length,
                    final_count: finalSuggestions.length,
                    generation_time: duration,
                    context_used: context.sector.primary
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur génération suggestions:', error);
            return { suggestions: [], metadata: { error: true } };
        }
    }
    
    /**
     * 🔍 Suggestions basées sur le contexte
     */
    async generateContextSuggestions(context) {
        const suggestions = [];
        
        // Suggestions basées sur l'intention
        if (context.intent.primary === 'create') {
            suggestions.push({
                id: 'quick_start',
                type: 'field_suggestion',
                title: 'Démarrage rapide',
                description: 'Ajouter les champs essentiels pour commencer',
                action: 'add_essential_fields',
                data: ['nom', 'email', 'téléphone'],
                confidence: 0.9,
                impact: 'high'
            });
        }
        
        // Suggestions basées sur la complexité
        if (context.complexity.level === 'complex') {
            suggestions.push({
                id: 'wizard_layout',
                type: 'layout_suggestion',
                title: 'Assistant étape par étape',
                description: 'Diviser le formulaire en étapes pour simplifier la saisie',
                action: 'convert_to_wizard',
                data: { max_fields_per_step: 5 },
                confidence: 0.8,
                impact: 'high'
            });
        }
        
        // Suggestions basées sur les entités détectées
        if (context.entities.fields.length > 0) {
            suggestions.push({
                id: 'smart_validation',
                type: 'validation_suggestion',
                title: 'Validations intelligentes',
                description: 'Ajouter des validations automatiques pour les champs détectés',
                action: 'add_smart_validations',
                data: context.entities.fields,
                confidence: 0.85,
                impact: 'medium'
            });
        }
        
        return suggestions;
    }
    
    /**
     * 🏢 Suggestions basées sur le secteur
     */
    generateSectorSuggestions(sector) {
        const suggestions = [];
        const sectorData = this.sectorSuggestions[sector.primary];
        
        if (!sectorData) return suggestions;
        
        // Suggestions de champs sectoriels
        sectorData.fields.forEach((field, index) => {
            if (index < 3) { // Limiter aux 3 premiers
                suggestions.push({
                    id: `sector_field_${field.name}`,
                    type: 'field_suggestion',
                    title: `Ajouter ${field.label}`,
                    description: `Champ typique du secteur ${sector.primary}`,
                    action: 'add_field',
                    data: field,
                    confidence: 0.7 + sector.confidence * 0.2,
                    impact: 'medium',
                    sector: sector.primary
                });
            }
        });
        
        // Suggestions de layout sectorielles
        sectorData.layouts.forEach(layout => {
            suggestions.push({
                id: `sector_layout_${layout}`,
                type: 'layout_suggestion',
                title: `Layout ${layout}`,
                description: `Mise en page optimisée pour le secteur ${sector.primary}`,
                action: 'change_layout',
                data: { layout: layout },
                confidence: 0.6 + sector.confidence * 0.3,
                impact: 'medium',
                sector: sector.primary
            });
        });
        
        // Suggestions d'intégrations
        sectorData.integrations.forEach((integration, index) => {
            if (index < 2) { // Limiter aux 2 premiers
                suggestions.push({
                    id: `sector_integration_${integration}`,
                    type: 'integration_suggestion',
                    title: `Intégration ${integration}`,
                    description: `Connecter avec ${integration} pour le secteur ${sector.primary}`,
                    action: 'add_integration',
                    data: { service: integration },
                    confidence: 0.5 + sector.confidence * 0.2,
                    impact: 'low',
                    sector: sector.primary
                });
            }
        });
        
        return suggestions;
    }
    
    /**
     * 📝 Suggestions basées sur le formulaire actuel
     */
    generateFormSuggestions(form, context) {
        const suggestions = [];
        
        // Analyser les patterns du formulaire
        Object.keys(this.contextPatterns).forEach(patternKey => {
            const pattern = this.contextPatterns[patternKey];
            if (pattern.trigger(form)) {
                pattern.suggestions.forEach(suggestionAction => {
                    suggestions.push(this.createSuggestionFromAction(suggestionAction, form, context));
                });
            }
        });
        
        // Suggestions de champs manquants
        const missingFields = this.detectMissingFields(form, context);
        missingFields.forEach(field => {
            suggestions.push({
                id: `missing_field_${field.name}`,
                type: 'field_suggestion',
                title: `Ajouter ${field.label}`,
                description: 'Champ couramment utilisé dans ce type de formulaire',
                action: 'add_field',
                data: field,
                confidence: 0.6,
                impact: 'medium'
            });
        });
        
        // Suggestions d'optimisation
        const optimizations = this.detectOptimizations(form);
        suggestions.push(...optimizations);
        
        return suggestions;
    }
    
    /**
     * 🤖 Suggestions basées sur l'apprentissage automatique
     */
    async generateMLSuggestions(context) {
        const suggestions = [];
        
        // Analyser les patterns d'usage utilisateur
        const userPatterns = this.analyzeUserPatterns(context);
        if (userPatterns.length > 0) {
            userPatterns.forEach(pattern => {
                suggestions.push({
                    id: `ml_pattern_${pattern.type}`,
                    type: 'optimization_suggestion',
                    title: pattern.title,
                    description: pattern.description,
                    action: pattern.action,
                    data: pattern.data,
                    confidence: pattern.confidence,
                    impact: 'medium',
                    source: 'machine_learning'
                });
            });
        }
        
        // Suggestions basées sur les formulaires similaires
        const similarForms = await this.findSimilarForms(context);
        if (similarForms.length > 0) {
            const topForm = similarForms[0];
            suggestions.push({
                id: 'similar_form_suggestion',
                type: 'field_suggestion',
                title: 'Inspiré de formulaires similaires',
                description: `Ajouter des champs populaires dans ${context.sector.primary}`,
                action: 'add_popular_fields',
                data: topForm.popular_fields,
                confidence: 0.7,
                impact: 'medium'
            });
        }
        
        return suggestions;
    }
    
    /**
     * 📊 Classement des suggestions
     */
    rankSuggestions(suggestions, context) {
        return suggestions
            .map(suggestion => ({
                ...suggestion,
                score: this.calculateSuggestionScore(suggestion, context)
            }))
            .sort((a, b) => b.score - a.score);
    }
    
    /**
     * 🎯 Calcul du score d'une suggestion
     */
    calculateSuggestionScore(suggestion, context) {
        let score = suggestion.confidence * 100;
        
        // Bonus pour le type de suggestion
        const typeData = this.suggestionTypes[suggestion.type];
        if (typeData) {
            score += (6 - typeData.priority) * 5; // Plus la priorité est élevée, plus le bonus est important
        }
        
        // Bonus pour l'impact
        const impactBonus = {
            high: 20,
            medium: 10,
            low: 5
        };
        score += impactBonus[suggestion.impact] || 0;
        
        // Bonus pour la correspondance secteur
        if (suggestion.sector === context.sector.primary) {
            score += 15;
        }
        
        // Malus si déjà rejeté par l'utilisateur
        if (this.wasRejectedBefore(suggestion.id)) {
            score -= 30;
        }
        
        // Bonus si accepté précédemment
        if (this.wasAcceptedBefore(suggestion.type)) {
            score += 10;
        }
        
        return Math.max(score, 0);
    }
    
    /**
     * 🔽 Filtrage des suggestions
     */
    filterSuggestions(rankedSuggestions) {
        return rankedSuggestions
            .filter(s => s.confidence >= this.confidence_threshold)
            .slice(0, this.maxSuggestions)
            .map(suggestion => {
                // Nettoyage final
                delete suggestion.score;
                return {
                    ...suggestion,
                    icon: this.suggestionTypes[suggestion.type]?.icon || '💡',
                    category: this.suggestionTypes[suggestion.type]?.category || 'Général'
                };
            });
    }
    
    /**
     * 🎬 Suggestions temps réel lors de la saisie
     */
    async generateRealTimeSuggestions(inputText, currentField = null) {
        // Debounce pour éviter trop d'appels
        clearTimeout(this.debounceTimer);
        
        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                try {
                    const suggestions = [];
                    
                    // Auto-complétion intelligente
                    if (currentField) {
                        const completions = await this.generateAutoCompletions(inputText, currentField);
                        suggestions.push(...completions);
                    }
                    
                    // Corrections automatiques
                    const corrections = this.generateCorrections(inputText);
                    suggestions.push(...corrections);
                    
                    // Suggestions contextuelles
                    const contextual = await this.generateContextualSuggestions(inputText);
                    suggestions.push(...contextual);
                    
                    resolve(suggestions.slice(0, 5)); // Limiter pour le temps réel
                    
                } catch (error) {
                    console.error('❌ Erreur suggestions temps réel:', error);
                    resolve([]);
                }
            }, this.debounceDelay);
        });
    }
    
    /**
     * ✨ Auto-complétion intelligente
     */
    async generateAutoCompletions(text, field) {
        const completions = [];
        
        // Données de référence par type de champ
        const referenceData = {
            ville: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes'],
            pays: ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'],
            secteur: ['Informatique', 'Santé', 'Éducation', 'Commerce', 'Finance'],
            civilite: ['Monsieur', 'Madame', 'Docteur', 'Professeur'],
            fonction: ['Directeur', 'Manager', 'Développeur', 'Commercial', 'Assistant']
        };
        
        // Recherche dans les données de référence
        const fieldType = this.detectFieldType(field);
        const data = referenceData[fieldType];
        
        if (data && text.length >= 2) {
            const matches = data.filter(item => 
                item.toLowerCase().startsWith(text.toLowerCase())
            );
            
            matches.forEach(match => {
                completions.push({
                    type: 'autocompletion',
                    text: match,
                    confidence: 0.8,
                    source: 'reference_data'
                });
            });
        }
        
        return completions;
    }
    
    /**
     * 🔧 Génération de corrections
     */
    generateCorrections(text) {
        const corrections = [];
        
        // Détection d'erreurs communes
        const commonErrors = {
            'gmail.co': 'gmail.com',
            'hotmil.': 'hotmail.',
            'yahooo.': 'yahoo.',
            'gmial.': 'gmail.',
            '06 ': '06',
            '07 ': '07'
        };
        
        Object.keys(commonErrors).forEach(error => {
            if (text.includes(error)) {
                corrections.push({
                    type: 'correction',
                    original: text,
                    corrected: text.replace(error, commonErrors[error]),
                    confidence: 0.9,
                    reason: 'Erreur de frappe commune'
                });
            }
        });
        
        return corrections;
    }
    
    /**
     * 🎯 Suggestions contextuelles avancées
     */
    async generateContextualSuggestions(text) {
        const suggestions = [];
        
        // Détection d'entités dans le texte
        if (text.includes('@') && !text.includes('.')) {
            suggestions.push({
                type: 'contextual',
                title: 'Format email incomplet',
                description: 'Il semble manquer le domaine (.com, .fr, etc.)',
                confidence: 0.7
            });
        }
        
        if (/\b\d{9,10}\b/.test(text) && !text.includes(' ')) {
            suggestions.push({
                type: 'contextual',
                title: 'Formatage téléphone',
                description: 'Ajouter des espaces pour améliorer la lisibilité',
                suggested: text.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5'),
                confidence: 0.8
            });
        }
        
        return suggestions;
    }
    
    /**
     * 🎯 Application d'une suggestion
     */
    async applySuggestion(suggestionId, formData = null) {
        try {
            const suggestion = this.findSuggestionById(suggestionId);
            if (!suggestion) {
                throw new Error('Suggestion non trouvée');
            }
            
            let result = null;
            
            switch (suggestion.action) {
                case 'add_field':
                    result = this.addField(suggestion.data, formData);
                    break;
                case 'add_essential_fields':
                    result = this.addEssentialFields(suggestion.data, formData);
                    break;
                case 'change_layout':
                    result = this.changeLayout(suggestion.data.layout, formData);
                    break;
                case 'add_validations':
                    result = this.addValidations(suggestion.data, formData);
                    break;
                case 'convert_to_wizard':
                    result = this.convertToWizard(suggestion.data, formData);
                    break;
                default:
                    result = await this.executeCustomAction(suggestion.action, suggestion.data, formData);
            }
            
            // Enregistrer l'acceptance de la suggestion
            this.recordSuggestionAcceptance(suggestion);
            
            console.log('✅ Suggestion appliquée:', suggestion.title);
            return result;
            
        } catch (error) {
            console.error('❌ Erreur application suggestion:', error);
            throw error;
        }
    }
    
    /**
     * ❌ Rejet d'une suggestion
     */
    rejectSuggestion(suggestionId, reason = null) {
        const suggestion = this.findSuggestionById(suggestionId);
        if (suggestion) {
            this.recordSuggestionRejection(suggestion, reason);
            console.log('❌ Suggestion rejetée:', suggestion.title, reason || '');
        }
    }
    
    /**
     * 📊 Analyse des patterns utilisateur
     */
    analyzeUserPatterns(context) {
        const patterns = [];
        
        // Analyser les interactions passées
        const sectorInteractions = this.userInteractions.filter(
            interaction => interaction.sector === context.sector.primary
        );
        
        if (sectorInteractions.length > 5) {
            // Pattern de champs fréquemment utilisés
            const fieldUsage = {};
            sectorInteractions.forEach(interaction => {
                if (interaction.fields) {
                    interaction.fields.forEach(field => {
                        fieldUsage[field] = (fieldUsage[field] || 0) + 1;
                    });
                }
            });
            
            const popularFields = Object.keys(fieldUsage)
                .sort((a, b) => fieldUsage[b] - fieldUsage[a])
                .slice(0, 3);
            
            if (popularFields.length > 0) {
                patterns.push({
                    type: 'popular_fields',
                    title: 'Champs fréquemment utilisés',
                    description: 'Basé sur votre historique d\'utilisation',
                    action: 'add_popular_fields',
                    data: popularFields,
                    confidence: 0.8
                });
            }
        }
        
        return patterns;
    }
    
    /**
     * 🔍 Recherche de formulaires similaires
     */
    async findSimilarForms(context) {
        // Simulation de recherche dans une base de données
        const similarForms = [
            {
                id: 'form_123',
                sector: context.sector.primary,
                similarity: 0.85,
                popular_fields: ['nom', 'email', 'téléphone', 'adresse', 'commentaires']
            }
        ];
        
        return similarForms.filter(form => form.similarity > 0.7);
    }
    
    /**
     * 🔧 Méthodes utilitaires
     */
    createSuggestionFromAction(action, form, context) {
        const actionMap = {
            add_essential_fields: {
                title: 'Ajouter les champs essentiels',
                description: 'Nom, email et téléphone pour un démarrage rapide',
                type: 'field_suggestion',
                data: ['nom', 'email', 'téléphone'],
                confidence: 0.9
            },
            wizard_layout: {
                title: 'Convertir en assistant',
                description: 'Diviser en étapes pour simplifier la saisie',
                type: 'layout_suggestion',
                data: { layout: 'wizard' },
                confidence: 0.8
            }
        };
        
        const template = actionMap[action] || {
            title: 'Suggestion personnalisée',
            description: `Action: ${action}`,
            type: 'optimization_suggestion',
            confidence: 0.5
        };
        
        return {
            id: `auto_${action}_${Date.now()}`,
            action: action,
            impact: 'medium',
            ...template
        };
    }
    
    detectMissingFields(form, context) {
        const essentialFields = ['nom', 'email'];
        const existingFields = form.fields.map(f => f.name);
        
        return essentialFields
            .filter(field => !existingFields.includes(field))
            .map(field => ({
                name: field,
                label: field === 'nom' ? 'Nom' : 'Email',
                type: field === 'email' ? 'email' : 'text',
                required: true
            }));
    }
    
    detectOptimizations(form) {
        const optimizations = [];
        
        // Trop de champs sans groupement
        if (form.fields.length > 8 && !form.groups) {
            optimizations.push({
                id: 'group_fields',
                type: 'ux_suggestion',
                title: 'Grouper les champs',
                description: 'Organiser les champs en sections logiques',
                action: 'group_fields',
                confidence: 0.7,
                impact: 'medium'
            });
        }
        
        // Champs sans validation
        const fieldsWithoutValidation = form.fields.filter(f => !f.validation).length;
        if (fieldsWithoutValidation > 0) {
            optimizations.push({
                id: 'add_missing_validations',
                type: 'validation_suggestion',
                title: 'Ajouter des validations',
                description: `${fieldsWithoutValidation} champs sans validation`,
                action: 'add_missing_validations',
                confidence: 0.8,
                impact: 'high'
            });
        }
        
        return optimizations;
    }
    
    detectFieldType(field) {
        if (!field) return 'unknown';
        
        const name = field.name || field.label || '';
        const type = name.toLowerCase();
        
        if (type.includes('ville')) return 'ville';
        if (type.includes('pays')) return 'pays';
        if (type.includes('secteur')) return 'secteur';
        if (type.includes('civilite')) return 'civilite';
        if (type.includes('fonction')) return 'fonction';
        
        return 'unknown';
    }
    
    findSuggestionById(id) {
        // En réalité, on chercherait dans une structure de données globale
        return this.lastGeneratedSuggestions?.find(s => s.id === id) || null;
    }
    
    wasRejectedBefore(suggestionId) {
        return this.learningData.rejected_suggestions.some(s => s.id === suggestionId);
    }
    
    wasAcceptedBefore(suggestionType) {
        return this.learningData.accepted_suggestions.some(s => s.type === suggestionType);
    }
    
    recordSuggestionAcceptance(suggestion) {
        this.learningData.accepted_suggestions.push({
            ...suggestion,
            accepted_at: Date.now()
        });
        this.saveLearningData();
    }
    
    recordSuggestionRejection(suggestion, reason) {
        this.learningData.rejected_suggestions.push({
            ...suggestion,
            rejected_at: Date.now(),
            reason: reason
        });
        this.saveLearningData();
    }
    
    // Actions concrètes
    addField(fieldData, formData) {
        if (!formData) return { success: false, error: 'Aucun formulaire fourni' };
        
        formData.fields = formData.fields || [];
        formData.fields.push(fieldData);
        
        return { success: true, field: fieldData };
    }
    
    addEssentialFields(fieldsData, formData) {
        if (!formData) return { success: false, error: 'Aucun formulaire fourni' };
        
        const addedFields = [];
        fieldsData.forEach(fieldName => {
            const field = {
                name: fieldName,
                label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
                type: fieldName === 'email' ? 'email' : 'text',
                required: true
            };
            formData.fields.push(field);
            addedFields.push(field);
        });
        
        return { success: true, fields: addedFields };
    }
    
    changeLayout(layout, formData) {
        if (!formData) return { success: false, error: 'Aucun formulaire fourni' };
        
        formData.layout = layout;
        return { success: true, layout: layout };
    }
    
    addValidations(validationsData, formData) {
        if (!formData) return { success: false, error: 'Aucun formulaire fourni' };
        
        formData.fields.forEach(field => {
            if (!field.validation && this.shouldAddValidation(field)) {
                field.validation = this.getDefaultValidation(field);
            }
        });
        
        return { success: true, validations: 'added' };
    }
    
    convertToWizard(data, formData) {
        if (!formData) return { success: false, error: 'Aucun formulaire fourni' };
        
        const maxFieldsPerStep = data.max_fields_per_step || 5;
        const steps = [];
        
        for (let i = 0; i < formData.fields.length; i += maxFieldsPerStep) {
            steps.push({
                title: `Étape ${Math.floor(i / maxFieldsPerStep) + 1}`,
                fields: formData.fields.slice(i, i + maxFieldsPerStep)
            });
        }
        
        formData.layout = 'wizard';
        formData.steps = steps;
        
        return { success: true, steps: steps.length };
    }
    
    async executeCustomAction(action, data, formData) {
        console.log(`🔧 Exécution action personnalisée: ${action}`, data);
        return { success: true, action: action };
    }
    
    shouldAddValidation(field) {
        return ['email', 'téléphone', 'date'].includes(field.type) || 
               ['email', 'phone', 'tel'].includes(field.name);
    }
    
    getDefaultValidation(field) {
        const validations = {
            email: { type: 'email', message: 'Format email invalide' },
            tel: { type: 'phone', message: 'Format téléphone invalide' },
            date: { type: 'date', message: 'Format date invalide' }
        };
        
        return validations[field.type] || validations[field.name] || { type: 'required' };
    }
    
    loadLearningData() {
        try {
            const saved = localStorage.getItem('smart_suggestions_learning');
            if (saved) {
                this.learningData = { ...this.learningData, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger les données d\'apprentissage');
        }
    }
    
    saveLearningData() {
        try {
            localStorage.setItem('smart_suggestions_learning', JSON.stringify(this.learningData));
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder les données d\'apprentissage');
        }
    }
    
    setupEventListeners() {
        // Écouter les événements de suggestion
        document.addEventListener('suggestions:request', async (event) => {
            const suggestions = await this.generateSuggestions(event.detail.context, event.detail.form);
            event.detail.callback(suggestions);
        });
        
        document.addEventListener('suggestions:apply', (event) => {
            this.applySuggestion(event.detail.suggestionId, event.detail.formData);
        });
        
        document.addEventListener('suggestions:reject', (event) => {
            this.rejectSuggestion(event.detail.suggestionId, event.detail.reason);
        });
    }
    
    initializeML() {
        console.log('🤖 Capacités d\'apprentissage automatique initialisées');
    }
    
    /**
     * 🎯 API publique
     */
    async quickSuggest(context, form = null) {
        const result = await this.generateSuggestions(context, form);
        this.lastGeneratedSuggestions = result.suggestions;
        return result;
    }
    
    getStats() {
        return {
            accepted_suggestions: this.learningData.accepted_suggestions.length,
            rejected_suggestions: this.learningData.rejected_suggestions.length,
            cache_size: this.suggestionsCache.size,
            user_interactions: this.userInteractions.length
        };
    }
    
    clearLearningData() {
        this.learningData = {
            accepted_suggestions: [],
            rejected_suggestions: [],
            user_patterns: {},
            sector_preferences: {}
        };
        this.saveLearningData();
    }
}

// Export global
window.SmartSuggestions = SmartSuggestions;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.smartSuggestions) {
        window.smartSuggestions = new SmartSuggestions();
        console.log('💡 SmartSuggestions initialisé globalement');
    }
});
