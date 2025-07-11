/**
 * 🔍 ContextAnalyzer - Analyseur Contextuel Intelligent
 * Analyse et compréhension du contexte métier
 * Sprint 3 - Intelligence et Automatisation
 */

class ContextAnalyzer {
    constructor() {
        this.version = '3.0';
        this.confidence_threshold = 0.7;
        this.max_suggestions = 10;
        
        // Base de connaissances sectorielles
        this.knowledgeBase = {
            healthcare: {
                keywords: ['patient', 'médecin', 'hôpital', 'clinique', 'santé', 'diagnostic', 'traitement', 'symptôme', 'médicament', 'rendez-vous', 'consultation', 'ordonnance'],
                entities: ['nom_patient', 'date_naissance', 'sexe', 'adresse', 'téléphone', 'email', 'médecin_traitant', 'antécédents', 'allergies', 'traitement_actuel'],
                validations: ['required', 'date', 'phone', 'email', 'medical_format'],
                regulations: ['RGPD', 'secret_médical', 'consentement'],
                layout_preferences: ['vertical', 'wizard'],
                colors: ['#10b981', '#064e3b', '#ffffff'],
                typical_workflows: ['prise_rdv', 'admission', 'suivi_traitement']
            },
            education: {
                keywords: ['étudiant', 'élève', 'cours', 'formation', 'école', 'université', 'professeur', 'note', 'évaluation', 'diplôme', 'inscription', 'scolarité'],
                entities: ['nom_étudiant', 'prénom', 'classe', 'niveau', 'matière', 'note', 'date_évaluation', 'professeur', 'établissement'],
                validations: ['required', 'numeric', 'range', 'academic_year'],
                regulations: ['CNIL', 'protection_mineurs'],
                layout_preferences: ['grid', 'card'],
                colors: ['#f59e0b', '#92400e', '#fef3c7'],
                typical_workflows: ['inscription', 'évaluation', 'suivi_scolaire']
            },
            legal: {
                keywords: ['contrat', 'juridique', 'avocat', 'tribunal', 'droit', 'clause', 'signature', 'testament', 'procédure', 'litige', 'conseil'],
                entities: ['nom_client', 'type_dossier', 'date_ouverture', 'référence_dossier', 'avocat_responsable', 'statut_dossier'],
                validations: ['required', 'legal_format', 'signature_required'],
                regulations: ['RGPD', 'secret_professionnel', 'archivage_légal'],
                layout_preferences: ['formal', 'vertical'],
                colors: ['#1f2937', '#fbbf24', '#f3f4f6'],
                typical_workflows: ['ouverture_dossier', 'suivi_procédure', 'facturation']
            },
            corporate: {
                keywords: ['entreprise', 'société', 'client', 'business', 'commercial', 'vente', 'service', 'produit', 'commande', 'facture'],
                entities: ['nom_entreprise', 'contact', 'email', 'téléphone', 'secteur', 'chiffre_affaires', 'nombre_employés'],
                validations: ['required', 'business_format', 'siret', 'tva'],
                regulations: ['RGPD', 'commerce'],
                layout_preferences: ['grid', 'horizontal'],
                colors: ['#3b82f6', '#1e40af', '#dbeafe'],
                typical_workflows: ['prospect', 'devis', 'commande', 'support']
            },
            creative: {
                keywords: ['design', 'créatif', 'artistique', 'portfolio', 'projet', 'création', 'art', 'graphique', 'illustration'],
                entities: ['nom_artiste', 'type_projet', 'budget', 'délai', 'style', 'format', 'usage'],
                validations: ['required', 'file_upload', 'creative_format'],
                regulations: ['droit_auteur', 'propriété_intellectuelle'],
                layout_preferences: ['creative', 'asymmetric'],
                colors: ['#8b5cf6', '#7c3aed', '#f3e8ff'],
                typical_workflows: ['brief_créatif', 'validation', 'livraison']
            },
            tech: {
                keywords: ['développement', 'software', 'application', 'code', 'technique', 'API', 'database', 'serveur', 'bug', 'feature'],
                entities: ['nom_projet', 'type_tech', 'langage', 'framework', 'version', 'environnement', 'priorité'],
                validations: ['required', 'tech_format', 'version_format'],
                regulations: ['RGPD', 'sécurité_données'],
                layout_preferences: ['technical', 'tabbed'],
                colors: ['#06b6d4', '#0891b2', '#cffafe'],
                typical_workflows: ['ticket', 'feature_request', 'bug_report']
            }
        };
        
        // Dictionnaire de synonymes et variantes
        this.synonyms = {
            'nom': ['name', 'appelation', 'dénomination', 'intitulé'],
            'prénom': ['first_name', 'prenom'],
            'email': ['courriel', 'mail', 'e-mail', 'adresse_email'],
            'téléphone': ['phone', 'tel', 'numero', 'mobile', 'portable'],
            'adresse': ['address', 'domicile', 'résidence', 'lieu'],
            'date': ['jour', 'moment', 'échéance', 'deadline'],
            'description': ['détail', 'explication', 'commentaire', 'note']
        };
        
        // Patterns de reconnaissance avancés
        this.patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /\b(\+33|0)[1-9](\d{8}|\s\d{2}\s\d{2}\s\d{2}\s\d{2})\b/g,
            date: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
            number: /\b\d+\b/g,
            currency: /\b\d+[.,]?\d*\s?€?\$?\b/g,
            url: /https?:\/\/[^\s]+/g
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔍 ContextAnalyzer v3.0 initialisé');
        this.loadUserPreferences();
        this.initializeNLP();
    }
    
    /**
     * 🎯 Analyse contextuelle principale
     */
    async analyzeContext(text, userPreferences = {}) {
        const startTime = performance.now();
        
        try {
            const analysis = {
                // Détection du secteur métier
                sector: await this.detectSector(text),
                
                // Extraction d'entités
                entities: this.extractEntities(text),
                
                // Analyse d'intention
                intent: this.analyzeIntent(text),
                
                // Complexité du formulaire
                complexity: this.assessComplexity(text),
                
                // Suggestions intelligentes
                suggestions: [],
                
                // Métriques de confiance
                confidence: 0,
                
                // Métadonnées
                metadata: {
                    text_length: text.length,
                    word_count: text.split(/\s+/).length,
                    analysis_time: 0,
                    version: this.version
                }
            };
            
            // Enrichissement de l'analyse
            analysis.confidence = this.calculateConfidence(analysis);
            analysis.suggestions = await this.generateSuggestions(analysis);
            analysis.validations = this.suggestValidations(analysis);
            analysis.layout = this.suggestLayout(analysis);
            analysis.styling = this.suggestStyling(analysis);
            
            analysis.metadata.analysis_time = performance.now() - startTime;
            
            console.log('✅ Analyse contextuelle terminée:', analysis);
            return analysis;
            
        } catch (error) {
            console.error('❌ Erreur analyse contextuelle:', error);
            return this.getFallbackAnalysis(text);
        }
    }
    
    /**
     * 🏢 Détection du secteur métier
     */
    async detectSector(text) {
        const normalizedText = text.toLowerCase();
        const scores = {};
        
        // Calcul des scores par secteur
        Object.keys(this.knowledgeBase).forEach(sector => {
            const keywords = this.knowledgeBase[sector].keywords;
            let score = 0;
            
            keywords.forEach(keyword => {
                if (normalizedText.includes(keyword)) {
                    score += 1;
                    
                    // Bonus pour les mots exacts
                    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                    const matches = normalizedText.match(regex);
                    if (matches) {
                        score += matches.length * 0.5;
                    }
                }
            });
            
            // Normalisation du score
            scores[sector] = score / keywords.length;
        });
        
        // Détection du secteur principal
        const bestSector = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        // Vérification du seuil de confiance
        if (scores[bestSector] < 0.1) {
            return {
                primary: 'corporate', // Secteur par défaut
                secondary: null,
                confidence: 0.1,
                scores: scores
            };
        }
        
        // Secteur secondaire
        const sortedSectors = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        const secondary = sortedSectors[1];
        
        return {
            primary: bestSector,
            secondary: scores[secondary] > 0.05 ? secondary : null,
            confidence: scores[bestSector],
            scores: scores
        };
    }
    
    /**
     * 🔍 Extraction d'entités avancée
     */
    extractEntities(text) {
        const entities = {
            fields: [],
            data_types: [],
            constraints: [],
            relationships: [],
            business_rules: []
        };
        
        // 1. Extraction des champs potentiels
        entities.fields = this.extractFields(text);
        
        // 2. Détection des types de données
        entities.data_types = this.detectDataTypes(text);
        
        // 3. Extraction des contraintes
        entities.constraints = this.extractConstraints(text);
        
        // 4. Détection des relations entre champs
        entities.relationships = this.detectRelationships(text);
        
        // 5. Extraction des règles métier
        entities.business_rules = this.extractBusinessRules(text);
        
        return entities;
    }
    
    /**
     * 📝 Extraction des champs
     */
    extractFields(text) {
        const fields = [];
        const fieldPatterns = [
            // Patterns directs
            /\b(champ|zone|field|input)\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /\b(saisir|entrer|remplir)\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /\b(demander|collecter)\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            
            // Patterns contextuels
            /pour\s+le\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /concernant\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /\b([a-zA-ZÀ-ÿ]+)\s+obligatoire/gi,
            
            // Patterns spécifiques métier
            /\b(nom|prénom|email|téléphone|adresse|date|âge)\b/gi
        ];
        
        fieldPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const cleanField = this.cleanFieldName(match);
                    if (cleanField && !fields.includes(cleanField)) {
                        fields.push(cleanField);
                    }
                });
            }
        });
        
        // Normalisation et déduplication
        return [...new Set(fields.map(f => this.normalizeFieldName(f)))];
    }
    
    /**
     * 🎯 Détection des types de données
     */
    detectDataTypes(text) {
        const types = {};
        
        Object.keys(this.patterns).forEach(type => {
            const matches = text.match(this.patterns[type]);
            if (matches) {
                types[type] = matches.length;
            }
        });
        
        return types;
    }
    
    /**
     * ⚖️ Extraction des contraintes
     */
    extractConstraints(text) {
        const constraints = [];
        
        const constraintPatterns = {
            required: /\b(obligatoire|requis|nécessaire|indispensable)\b/gi,
            optional: /\b(optionnel|facultatif|si\s+possible)\b/gi,
            unique: /\b(unique|seul|distinct)\b/gi,
            min_length: /\b(minimum|min)\s+(\d+)\s+(caractères?|lettres?)/gi,
            max_length: /\b(maximum|max)\s+(\d+)\s+(caractères?|lettres?)/gi,
            range: /\bentre\s+(\d+)\s+et\s+(\d+)/gi,
            format: /\b(format|formatage)\s+([a-zA-Z]+)/gi
        };
        
        Object.keys(constraintPatterns).forEach(type => {
            const matches = text.match(constraintPatterns[type]);
            if (matches) {
                constraints.push({
                    type: type,
                    matches: matches,
                    count: matches.length
                });
            }
        });
        
        return constraints;
    }
    
    /**
     * 🔗 Détection des relations entre champs
     */
    detectRelationships(text) {
        const relationships = [];
        
        const relationPatterns = [
            /si\s+([a-zA-ZÀ-ÿ\s]+)\s+alors\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /quand\s+([a-zA-ZÀ-ÿ\s]+)\s+afficher\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /en\s+fonction\s+de\s+([a-zA-ZÀ-ÿ\s]+)/gi,
            /dépend\s+de\s+([a-zA-ZÀ-ÿ\s]+)/gi
        ];
        
        relationPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    relationships.push({
                        type: 'conditional',
                        expression: match,
                        confidence: 0.8
                    });
                });
            }
        });
        
        return relationships;
    }
    
    /**
     * 📋 Extraction des règles métier
     */
    extractBusinessRules(text) {
        const rules = [];
        
        const rulePatterns = [
            /\b(règle|condition|exigence)\s*:\s*([^.]+)/gi,
            /\b(important|attention|note)\s*:\s*([^.]+)/gi,
            /\b(contrainte|limitation)\s*:\s*([^.]+)/gi
        ];
        
        rulePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    rules.push({
                        type: 'business_rule',
                        description: match,
                        priority: 'medium'
                    });
                });
            }
        });
        
        return rules;
    }
    
    /**
     * 🎯 Analyse d'intention utilisateur
     */
    analyzeIntent(text) {
        const intents = {
            create: {
                keywords: ['créer', 'faire', 'générer', 'construire', 'développer', 'nouveau'],
                weight: 1.0
            },
            modify: {
                keywords: ['modifier', 'changer', 'adapter', 'ajuster', 'personnaliser', 'mettre à jour'],
                weight: 0.8
            },
            copy: {
                keywords: ['copier', 'dupliquer', 'cloner', 'reproduire', 'basé sur'],
                weight: 0.7
            },
            template: {
                keywords: ['template', 'modèle', 'exemple', 'base', 'structure'],
                weight: 0.6
            },
            integrate: {
                keywords: ['intégrer', 'connecter', 'lier', 'synchroniser', 'importer'],
                weight: 0.9
            }
        };
        
        const scores = {};
        const normalizedText = text.toLowerCase();
        
        Object.keys(intents).forEach(intent => {
            let score = 0;
            intents[intent].keywords.forEach(keyword => {
                if (normalizedText.includes(keyword)) {
                    score += intents[intent].weight;
                }
            });
            scores[intent] = score;
        });
        
        const primaryIntent = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return {
            primary: primaryIntent,
            confidence: Math.max(...Object.values(scores)) / intents[primaryIntent].keywords.length,
            all_scores: scores
        };
    }
    
    /**
     * 🎚️ Évaluation de la complexité
     */
    assessComplexity(text) {
        const metrics = {
            word_count: text.split(/\s+/).length,
            sentence_count: text.split(/[.!?]+/).length,
            field_count: this.extractFields(text).length,
            constraint_count: this.extractConstraints(text).length,
            relationship_count: this.detectRelationships(text).length
        };
        
        // Calcul du score de complexité
        let complexityScore = 0;
        
        if (metrics.word_count > 100) complexityScore += 1;
        if (metrics.field_count > 10) complexityScore += 1;
        if (metrics.constraint_count > 5) complexityScore += 1;
        if (metrics.relationship_count > 2) complexityScore += 1;
        
        const levels = ['simple', 'medium', 'complex', 'very_complex'];
        const level = levels[Math.min(complexityScore, 3)];
        
        return {
            level: level,
            score: complexityScore,
            metrics: metrics,
            recommendations: this.getComplexityRecommendations(level)
        };
    }
    
    /**
     * 💡 Génération de suggestions intelligentes
     */
    async generateSuggestions(analysis) {
        const suggestions = [];
        const sector = analysis.sector.primary;
        const knowledge = this.knowledgeBase[sector];
        
        // Suggestions basées sur le secteur
        if (knowledge) {
            suggestions.push({
                type: 'sector_optimization',
                title: `Optimiser pour le secteur ${sector}`,
                description: `Ajouter les champs typiques du secteur ${sector}`,
                fields: knowledge.entities.slice(0, 5),
                priority: 'high'
            });
        }
        
        // Suggestions de validation
        if (analysis.entities.fields.length > 0) {
            suggestions.push({
                type: 'validation_enhancement',
                title: 'Améliorer les validations',
                description: 'Ajouter des validations intelligentes',
                validations: this.suggestValidations(analysis),
                priority: 'medium'
            });
        }
        
        // Suggestions UX
        suggestions.push({
            type: 'ux_improvement',
            title: 'Optimiser l\'expérience utilisateur',
            description: 'Améliorer la navigation et l\'ergonomie',
            improvements: [
                'Groupement logique des champs',
                'Progressive disclosure',
                'Feedback temps réel',
                'Auto-sauvegarde'
            ],
            priority: 'medium'
        });
        
        // Suggestions d'intégration
        if (analysis.intent.primary === 'integrate') {
            suggestions.push({
                type: 'integration',
                title: 'Possibilités d\'intégration',
                description: 'Connecter avec des services externes',
                integrations: this.suggestIntegrations(sector),
                priority: 'low'
            });
        }
        
        return suggestions;
    }
    
    /**
     * ✅ Suggestion de validations
     */
    suggestValidations(analysis) {
        const validations = [];
        const sector = analysis.sector.primary;
        const knowledge = this.knowledgeBase[sector];
        
        if (knowledge && knowledge.validations) {
            knowledge.validations.forEach(validation => {
                validations.push({
                    type: validation,
                    description: this.getValidationDescription(validation),
                    applicable_fields: this.getApplicableFields(validation, analysis.entities.fields)
                });
            });
        }
        
        return validations;
    }
    
    /**
     * 🎨 Suggestion de layout
     */
    suggestLayout(analysis) {
        const sector = analysis.sector.primary;
        const complexity = analysis.complexity.level;
        const knowledge = this.knowledgeBase[sector];
        
        let layout = 'vertical'; // Défaut
        
        if (knowledge && knowledge.layout_preferences) {
            layout = knowledge.layout_preferences[0];
        }
        
        // Adaptation selon la complexité
        if (complexity === 'complex' || complexity === 'very_complex') {
            layout = 'wizard';
        } else if (analysis.entities.fields.length <= 5) {
            layout = 'vertical';
        } else if (analysis.entities.fields.length <= 10) {
            layout = 'grid';
        }
        
        return {
            primary: layout,
            alternatives: knowledge ? knowledge.layout_preferences : ['vertical', 'grid'],
            responsive: true,
            mobile_optimized: true
        };
    }
    
    /**
     * 🎨 Suggestion de styling
     */
    suggestStyling(analysis) {
        const sector = analysis.sector.primary;
        const knowledge = this.knowledgeBase[sector];
        
        return {
            theme: sector,
            colors: knowledge ? knowledge.colors : ['#3b82f6', '#1e40af', '#dbeafe'],
            typography: this.getSectorTypography(sector),
            spacing: this.getSectorSpacing(complexity),
            effects: this.getSectorEffects(sector)
        };
    }
    
    /**
     * 🔧 Méthodes utilitaires
     */
    cleanFieldName(field) {
        return field
            .replace(/\b(champ|zone|field|input|saisir|entrer|remplir|demander|collecter|pour|le|la|les|du|de|des)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    normalizeFieldName(field) {
        // Recherche de synonymes
        const normalized = field.toLowerCase();
        for (const [standard, variants] of Object.entries(this.synonyms)) {
            if (variants.some(variant => normalized.includes(variant))) {
                return standard;
            }
        }
        return normalized.replace(/\s+/g, '_');
    }
    
    calculateConfidence(analysis) {
        let confidence = 0;
        
        // Confiance basée sur la détection de secteur
        confidence += analysis.sector.confidence * 0.4;
        
        // Confiance basée sur l'extraction d'entités
        if (analysis.entities.fields.length > 0) {
            confidence += 0.3;
        }
        
        // Confiance basée sur l'intention
        confidence += analysis.intent.confidence * 0.2;
        
        // Bonus pour la complexité détectée
        if (analysis.complexity.score > 0) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    getComplexityRecommendations(level) {
        const recommendations = {
            simple: [
                'Utiliser un layout vertical simple',
                'Minimiser le nombre de champs',
                'Validation en temps réel'
            ],
            medium: [
                'Grouper les champs par thème',
                'Utiliser un layout en grille',
                'Ajouter des indicateurs de progression'
            ],
            complex: [
                'Implémenter un assistant étape par étape',
                'Sauvegarder automatiquement',
                'Fournir une aide contextuelle'
            ],
            very_complex: [
                'Diviser en plusieurs formulaires',
                'Implémenter un workflow guidé',
                'Prévoir des validations avancées'
            ]
        };
        
        return recommendations[level] || recommendations.simple;
    }
    
    suggestIntegrations(sector) {
        const integrations = {
            healthcare: ['DMP', 'RPPS', 'FHIR', 'HL7'],
            education: ['Pronote', 'ENT', 'SIECLE', 'LSU'],
            legal: ['e-barreau', 'RPVA', 'DataJust'],
            corporate: ['Salesforce', 'HubSpot', 'SAP', 'Monday'],
            creative: ['Behance', 'Dribbble', 'Adobe CC'],
            tech: ['GitHub', 'Jira', 'Slack', 'GitLab']
        };
        
        return integrations[sector] || ['Zapier', 'Webhooks', 'API REST'];
    }
    
    getValidationDescription(validation) {
        const descriptions = {
            required: 'Champ obligatoire à remplir',
            email: 'Format email valide',
            phone: 'Format téléphone français',
            date: 'Format date valide',
            numeric: 'Valeur numérique uniquement',
            range: 'Valeur dans une plage définie',
            medical_format: 'Format médical spécialisé',
            legal_format: 'Format juridique conforme',
            business_format: 'Format business standard'
        };
        
        return descriptions[validation] || 'Validation personnalisée';
    }
    
    getApplicableFields(validation, fields) {
        const applicability = {
            email: ['email', 'courriel', 'mail'],
            phone: ['téléphone', 'phone', 'tel', 'mobile'],
            date: ['date', 'jour', 'naissance'],
            numeric: ['âge', 'nombre', 'quantité', 'prix']
        };
        
        return fields.filter(field => 
            applicability[validation] && 
            applicability[validation].some(pattern => field.includes(pattern))
        );
    }
    
    getSectorTypography(sector) {
        const typography = {
            healthcare: { font: 'Inter', weight: '400', size: '16px' },
            education: { font: 'Roboto', weight: '300', size: '15px' },
            legal: { font: 'Georgia', weight: '400', size: '16px' },
            corporate: { font: 'Arial', weight: '400', size: '14px' },
            creative: { font: 'Poppins', weight: '300', size: '16px' },
            tech: { font: 'Fira Code', weight: '400', size: '14px' }
        };
        
        return typography[sector] || typography.corporate;
    }
    
    getSectorSpacing(complexity) {
        const base = complexity === 'simple' ? 'compact' : 
                   complexity === 'complex' ? 'spacious' : 'normal';
        
        return {
            mode: base,
            field_gap: base === 'compact' ? '0.75rem' : base === 'spacious' ? '1.5rem' : '1rem',
            section_gap: base === 'compact' ? '1rem' : base === 'spacious' ? '2rem' : '1.5rem'
        };
    }
    
    getSectorEffects(sector) {
        const effects = {
            healthcare: ['subtle_shadow', 'rounded_corners'],
            education: ['colorful_borders', 'hover_animations'],
            legal: ['formal_borders', 'minimal_effects'],
            corporate: ['professional_shadow', 'clean_lines'],
            creative: ['gradient_backgrounds', 'creative_animations'],
            tech: ['code_styling', 'tech_borders']
        };
        
        return effects[sector] || effects.corporate;
    }
    
    getFallbackAnalysis(text) {
        return {
            sector: { primary: 'corporate', confidence: 0.1 },
            entities: { fields: ['nom', 'email'], data_types: {}, constraints: [] },
            intent: { primary: 'create', confidence: 0.5 },
            complexity: { level: 'simple', score: 0 },
            confidence: 0.1,
            suggestions: [],
            metadata: { fallback: true }
        };
    }
    
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('context_analyzer_preferences');
            if (saved) {
                this.userPreferences = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger les préférences utilisateur');
        }
    }
    
    initializeNLP() {
        // Initialisation des capacités de traitement du langage naturel
        console.log('🧠 Capacités NLP initialisées');
    }
    
    /**
     * 🎯 API publique
     */
    async quickAnalyze(text) {
        return await this.analyzeContext(text);
    }
    
    getSupportedSectors() {
        return Object.keys(this.knowledgeBase);
    }
    
    getKnowledgeBase(sector = null) {
        return sector ? this.knowledgeBase[sector] : this.knowledgeBase;
    }
    
    updateKnowledgeBase(sector, updates) {
        if (this.knowledgeBase[sector]) {
            this.knowledgeBase[sector] = { ...this.knowledgeBase[sector], ...updates };
        }
    }
}

// Export global
window.ContextAnalyzer = ContextAnalyzer;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.contextAnalyzer) {
        window.contextAnalyzer = new ContextAnalyzer();
        console.log('🔍 ContextAnalyzer initialisé globalement');
    }
});

// Export pour compatibilité navigateur
window.ContextAnalyzer = ContextAnalyzer;
