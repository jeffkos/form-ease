/**
 * 🔄 DataMapper.js - FormEase Sprint 3 Phase 3
 * 
 * Système de transformation et mapping de données intelligent
 * Convertit et enrichit les données entre FormEase et les systèmes externes
 * 
 * Fonctionnalités :
 * - Mapping de schémas automatique et personnalisé
 * - Transformation de données avec règles complexes
 * - Validation et nettoyage des données
 * - Enrichissement avec données externes
 * - Support des formats JSON, XML, CSV
 * - Templates de transformation réutilisables
 * - Mapping bidirectionnel (import/export)
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 3
 */

class DataMapper {
    constructor() {
        this.schemas = new Map();
        this.mappings = new Map();
        this.transformations = new Map();
        this.validators = new Map();
        this.enrichers = new Map();
        
        this.config = {
            maxFieldDepth: 10,
            maxArraySize: 1000,
            validateData: true,
            enrichData: true,
            cacheResults: true,
            cacheTimeout: 300000 // 5 minutes
        };
        
        this.dataTypes = {
            string: 'string',
            number: 'number',
            boolean: 'boolean',
            date: 'date',
            email: 'email',
            phone: 'phone',
            url: 'url',
            array: 'array',
            object: 'object',
            file: 'file',
            custom: 'custom'
        };
        
        this.formatters = {
            json: 'json',
            xml: 'xml',
            csv: 'csv',
            yaml: 'yaml',
            form: 'form'
        };
        
        this.cache = new Map();
        this.metrics = {
            totalMappings: 0,
            successfulMappings: 0,
            failedMappings: 0,
            averageProcessingTime: 0,
            dataValidationErrors: 0,
            enrichmentCount: 0
        };
        
        this.init();
    }
    
    /**
     * Initialisation du mappeur de données
     */
    init() {
        this.setupDefaultSchemas();
        this.setupDefaultTransformations();
        this.setupDefaultValidators();
        this.setupDefaultEnrichers();
        this.startCacheCleanup();
        console.log('🔄 DataMapper v3.0 initialisé');
    }
    
    /**
     * Configuration des schémas par défaut
     */
    setupDefaultSchemas() {
        // Schéma FormEase standard
        this.schemas.set('formease-form', {
            id: 'formease-form',
            name: 'FormEase Form Schema',
            description: 'Schéma standard pour les formulaires FormEase',
            version: '1.0',
            fields: {
                id: { type: this.dataTypes.string, required: true, description: 'Identifiant unique' },
                title: { type: this.dataTypes.string, required: true, description: 'Titre du formulaire' },
                description: { type: this.dataTypes.string, required: false, description: 'Description' },
                fields: { type: this.dataTypes.array, required: true, description: 'Champs du formulaire' },
                created_at: { type: this.dataTypes.date, required: true, description: 'Date de création' },
                updated_at: { type: this.dataTypes.date, required: false, description: 'Date de modification' },
                status: { type: this.dataTypes.string, required: true, enum: ['draft', 'published', 'archived'] },
                settings: { type: this.dataTypes.object, required: false, description: 'Configuration' }
            }
        });
        
        // Schéma Contact/Lead générique
        this.schemas.set('contact-lead', {
            id: 'contact-lead',
            name: 'Contact/Lead Schema',
            description: 'Schéma générique pour contacts et leads',
            version: '1.0',
            fields: {
                first_name: { type: this.dataTypes.string, required: true, description: 'Prénom' },
                last_name: { type: this.dataTypes.string, required: true, description: 'Nom' },
                email: { type: this.dataTypes.email, required: true, description: 'Email' },
                phone: { type: this.dataTypes.phone, required: false, description: 'Téléphone' },
                company: { type: this.dataTypes.string, required: false, description: 'Entreprise' },
                job_title: { type: this.dataTypes.string, required: false, description: 'Poste' },
                source: { type: this.dataTypes.string, required: false, description: 'Source du lead' },
                tags: { type: this.dataTypes.array, required: false, description: 'Tags' },
                custom_fields: { type: this.dataTypes.object, required: false, description: 'Champs personnalisés' }
            }
        });
        
        // Schéma HubSpot Contact
        this.schemas.set('hubspot-contact', {
            id: 'hubspot-contact',
            name: 'HubSpot Contact Schema',
            description: 'Schéma spécifique HubSpot',
            version: '1.0',
            fields: {
                firstname: { type: this.dataTypes.string, required: true, hubspot_property: 'firstname' },
                lastname: { type: this.dataTypes.string, required: true, hubspot_property: 'lastname' },
                email: { type: this.dataTypes.email, required: true, hubspot_property: 'email' },
                phone: { type: this.dataTypes.phone, required: false, hubspot_property: 'phone' },
                company: { type: this.dataTypes.string, required: false, hubspot_property: 'company' },
                jobtitle: { type: this.dataTypes.string, required: false, hubspot_property: 'jobtitle' },
                hs_lead_status: { type: this.dataTypes.string, required: false, hubspot_property: 'hs_lead_status' },
                lifecyclestage: { type: this.dataTypes.string, required: false, hubspot_property: 'lifecyclestage' }
            }
        });
        
        // Schéma Salesforce Lead
        this.schemas.set('salesforce-lead', {
            id: 'salesforce-lead',
            name: 'Salesforce Lead Schema',
            description: 'Schéma spécifique Salesforce',
            version: '1.0',
            fields: {
                FirstName: { type: this.dataTypes.string, required: true, salesforce_field: 'FirstName' },
                LastName: { type: this.dataTypes.string, required: true, salesforce_field: 'LastName' },
                Email: { type: this.dataTypes.email, required: true, salesforce_field: 'Email' },
                Phone: { type: this.dataTypes.phone, required: false, salesforce_field: 'Phone' },
                Company: { type: this.dataTypes.string, required: true, salesforce_field: 'Company' },
                Title: { type: this.dataTypes.string, required: false, salesforce_field: 'Title' },
                LeadSource: { type: this.dataTypes.string, required: false, salesforce_field: 'LeadSource' },
                Status: { type: this.dataTypes.string, required: false, salesforce_field: 'Status' }
            }
        });
        
        console.log('📋 Schémas par défaut configurés :', this.schemas.size);
    }
    
    /**
     * Configuration des transformations par défaut
     */
    setupDefaultTransformations() {
        // Transformation FormEase -> Contact générique
        this.transformations.set('formease-to-contact', {
            id: 'formease-to-contact',
            name: 'FormEase vers Contact',
            description: 'Convertit les données FormEase en contact générique',
            sourceSchema: 'formease-form',
            targetSchema: 'contact-lead',
            rules: [
                {
                    source: 'fields.prenom.value',
                    target: 'first_name',
                    transform: 'capitalize'
                },
                {
                    source: 'fields.nom.value',
                    target: 'last_name',
                    transform: 'capitalize'
                },
                {
                    source: 'fields.email.value',
                    target: 'email',
                    transform: 'lowercase'
                },
                {
                    source: 'fields.telephone.value',
                    target: 'phone',
                    transform: 'formatPhone'
                },
                {
                    source: 'fields.entreprise.value',
                    target: 'company',
                    transform: 'capitalize'
                },
                {
                    source: 'title',
                    target: 'source',
                    transform: 'constant',
                    value: 'FormEase'
                }
            ]
        });
        
        // Transformation Contact -> HubSpot
        this.transformations.set('contact-to-hubspot', {
            id: 'contact-to-hubspot',
            name: 'Contact vers HubSpot',
            description: 'Convertit un contact générique en format HubSpot',
            sourceSchema: 'contact-lead',
            targetSchema: 'hubspot-contact',
            rules: [
                {
                    source: 'first_name',
                    target: 'firstname',
                    transform: 'string'
                },
                {
                    source: 'last_name',
                    target: 'lastname',
                    transform: 'string'
                },
                {
                    source: 'email',
                    target: 'email',
                    transform: 'string'
                },
                {
                    source: 'phone',
                    target: 'phone',
                    transform: 'string'
                },
                {
                    source: 'company',
                    target: 'company',
                    transform: 'string'
                },
                {
                    source: 'job_title',
                    target: 'jobtitle',
                    transform: 'string'
                },
                {
                    target: 'lifecyclestage',
                    transform: 'constant',
                    value: 'lead'
                }
            ]
        });
        
        // Transformation Contact -> Salesforce
        this.transformations.set('contact-to-salesforce', {
            id: 'contact-to-salesforce',
            name: 'Contact vers Salesforce',
            description: 'Convertit un contact générique en format Salesforce',
            sourceSchema: 'contact-lead',
            targetSchema: 'salesforce-lead',
            rules: [
                {
                    source: 'first_name',
                    target: 'FirstName',
                    transform: 'string'
                },
                {
                    source: 'last_name',
                    target: 'LastName',
                    transform: 'string'
                },
                {
                    source: 'email',
                    target: 'Email',
                    transform: 'string'
                },
                {
                    source: 'phone',
                    target: 'Phone',
                    transform: 'string'
                },
                {
                    source: 'company',
                    target: 'Company',
                    transform: 'string'
                },
                {
                    source: 'job_title',
                    target: 'Title',
                    transform: 'string'
                },
                {
                    target: 'LeadSource',
                    transform: 'constant',
                    value: 'Web'
                },
                {
                    target: 'Status',
                    transform: 'constant',
                    value: 'Open - Not Contacted'
                }
            ]
        });
        
        console.log('🔄 Transformations par défaut configurées :', this.transformations.size);
    }
    
    /**
     * Configuration des validateurs par défaut
     */
    setupDefaultValidators() {
        // Validateur email
        this.validators.set('email', {
            id: 'email',
            name: 'Email Validator',
            validate: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                    valid: emailRegex.test(value),
                    message: emailRegex.test(value) ? 'Email valide' : 'Format email invalide'
                };
            }
        });
        
        // Validateur téléphone
        this.validators.set('phone', {
            id: 'phone',
            name: 'Phone Validator',
            validate: (value) => {
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                const cleanPhone = value?.replace(/[\s\-\(\)\.]/g, '');
                return {
                    valid: phoneRegex.test(cleanPhone),
                    message: phoneRegex.test(cleanPhone) ? 'Téléphone valide' : 'Format téléphone invalide'
                };
            }
        });
        
        // Validateur URL
        this.validators.set('url', {
            id: 'url',
            name: 'URL Validator',
            validate: (value) => {
                try {
                    new URL(value);
                    return { valid: true, message: 'URL valide' };
                } catch {
                    return { valid: false, message: 'Format URL invalide' };
                }
            }
        });
        
        // Validateur date
        this.validators.set('date', {
            id: 'date',
            name: 'Date Validator',
            validate: (value) => {
                const date = new Date(value);
                return {
                    valid: !isNaN(date.getTime()),
                    message: !isNaN(date.getTime()) ? 'Date valide' : 'Format date invalide'
                };
            }
        });
        
        console.log('✅ Validateurs par défaut configurés :', this.validators.size);
    }
    
    /**
     * Configuration des enrichisseurs par défaut
     */
    setupDefaultEnrichers() {
        // Enrichisseur géolocalisation
        this.enrichers.set('geolocation', {
            id: 'geolocation',
            name: 'Geolocation Enricher',
            description: 'Enrichit avec données de géolocalisation',
            enrich: async (data, context) => {
                // Simulation d'enrichissement géographique
                if (data.country || data.city) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    return {
                        ...data,
                        location: {
                            country: data.country || 'France',
                            city: data.city || 'Paris',
                            latitude: 48.8566,
                            longitude: 2.3522,
                            timezone: 'Europe/Paris'
                        }
                    };
                }
                return data;
            }
        });
        
        // Enrichisseur entreprise
        this.enrichers.set('company', {
            id: 'company',
            name: 'Company Enricher',
            description: 'Enrichit avec données d\'entreprise',
            enrich: async (data, context) => {
                // Simulation d'enrichissement entreprise
                if (data.company || (data.email && data.email.includes('@'))) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    const domain = data.email ? data.email.split('@')[1] : data.company;
                    
                    return {
                        ...data,
                        company_info: {
                            name: data.company || domain,
                            domain: domain,
                            industry: 'Technology',
                            size: '50-200',
                            founded: '2010',
                            website: `https://${domain}`
                        }
                    };
                }
                return data;
            }
        });
        
        // Enrichisseur social
        this.enrichers.set('social', {
            id: 'social',
            name: 'Social Media Enricher',
            description: 'Enrichit avec profils sociaux',
            enrich: async (data, context) => {
                // Simulation d'enrichissement réseaux sociaux
                if (data.first_name && data.last_name) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                    
                    const fullName = `${data.first_name} ${data.last_name}`;
                    
                    return {
                        ...data,
                        social_profiles: {
                            linkedin: `https://linkedin.com/in/${data.first_name.toLowerCase()}-${data.last_name.toLowerCase()}`,
                            twitter: `@${data.first_name.toLowerCase()}${data.last_name.toLowerCase()}`,
                            github: `https://github.com/${data.first_name.toLowerCase()}${data.last_name.toLowerCase()}`
                        }
                    };
                }
                return data;
            }
        });
        
        console.log('🚀 Enrichisseurs par défaut configurés :', this.enrichers.size);
    }
    
    /**
     * Création d'un mapping personnalisé
     */
    createMapping(config) {
        const mappingId = 'map_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const mapping = {
            id: mappingId,
            name: config.name || `Mapping ${mappingId}`,
            description: config.description || '',
            sourceSchema: config.sourceSchema,
            targetSchema: config.targetSchema,
            rules: config.rules || [],
            options: {
                validateSource: config.validateSource !== false,
                validateTarget: config.validateTarget !== false,
                enrichData: config.enrichData !== false,
                strictMode: config.strictMode || false,
                ...config.options
            },
            created: new Date(),
            modified: new Date(),
            metrics: {
                usageCount: 0,
                successCount: 0,
                errorCount: 0,
                averageProcessingTime: 0
            }
        };
        
        this.mappings.set(mappingId, mapping);
        
        console.log('🗺️ Mapping créé :', mappingId);
        return mapping;
    }
    
    /**
     * Exécution d'un mapping de données
     */
    async mapData(mappingId, sourceData, context = {}) {
        const startTime = Date.now();
        
        try {
            const mapping = this.mappings.get(mappingId);
            if (!mapping) {
                throw new Error(`Mapping ${mappingId} introuvable`);
            }
            
            // Vérifier le cache
            const cacheKey = this.generateCacheKey(mappingId, sourceData);
            if (this.config.cacheResults) {
                const cached = this.getCachedResult(cacheKey);
                if (cached) {
                    console.log('💾 Résultat en cache pour mapping :', mappingId);
                    return cached;
                }
            }
            
            // Validation des données source
            if (mapping.options.validateSource) {
                const validation = await this.validateData(sourceData, mapping.sourceSchema);
                if (!validation.valid) {
                    throw new Error(`Données source invalides : ${validation.errors.join(', ')}`);
                }
            }
            
            // Application des règles de transformation
            let targetData = {};
            
            for (const rule of mapping.rules) {
                try {
                    const value = await this.applyTransformationRule(rule, sourceData, context);
                    if (value !== undefined && value !== null) {
                        this.setNestedValue(targetData, rule.target, value);
                    }
                } catch (error) {
                    if (mapping.options.strictMode) {
                        throw new Error(`Erreur règle ${rule.source} -> ${rule.target} : ${error.message}`);
                    } else {
                        console.warn(`⚠️ Règle ignorée ${rule.source} -> ${rule.target} :`, error.message);
                    }
                }
            }
            
            // Enrichissement des données
            if (mapping.options.enrichData && this.config.enrichData) {
                targetData = await this.enrichData(targetData, context);
            }
            
            // Validation des données cible
            if (mapping.options.validateTarget) {
                const validation = await this.validateData(targetData, mapping.targetSchema);
                if (!validation.valid) {
                    throw new Error(`Données cible invalides : ${validation.errors.join(', ')}`);
                }
            }
            
            const processingTime = Date.now() - startTime;
            
            // Mise à jour des métriques
            this.updateMappingMetrics(mapping, processingTime, true);
            this.updateGlobalMetrics(processingTime, true);
            
            // Mise en cache
            if (this.config.cacheResults) {
                this.cacheResult(cacheKey, targetData);
            }
            
            console.log(`✅ Mapping ${mappingId} réussi (${processingTime}ms)`);
            
            return {
                success: true,
                data: targetData,
                processingTime: processingTime,
                sourceSchema: mapping.sourceSchema,
                targetSchema: mapping.targetSchema
            };
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            // Mise à jour des métriques d'erreur
            const mapping = this.mappings.get(mappingId);
            if (mapping) {
                this.updateMappingMetrics(mapping, processingTime, false);
            }
            this.updateGlobalMetrics(processingTime, false);
            
            console.error(`❌ Erreur mapping ${mappingId} :`, error.message);
            
            throw error;
        }
    }
    
    /**
     * Application d'une règle de transformation
     */
    async applyTransformationRule(rule, sourceData, context) {
        // Récupérer la valeur source
        let sourceValue;
        
        if (rule.source) {
            sourceValue = this.getNestedValue(sourceData, rule.source);
        } else if (rule.value !== undefined) {
            sourceValue = rule.value;
        } else {
            return undefined;
        }
        
        // Appliquer la transformation
        switch (rule.transform) {
            case 'string':
                return String(sourceValue || '');
                
            case 'number':
                return Number(sourceValue) || 0;
                
            case 'boolean':
                return Boolean(sourceValue);
                
            case 'date':
                return sourceValue ? new Date(sourceValue) : null;
                
            case 'capitalize':
                return this.capitalize(sourceValue);
                
            case 'lowercase':
                return String(sourceValue || '').toLowerCase();
                
            case 'uppercase':
                return String(sourceValue || '').toUpperCase();
                
            case 'formatPhone':
                return this.formatPhone(sourceValue);
                
            case 'formatEmail':
                return this.formatEmail(sourceValue);
                
            case 'constant':
                return rule.value;
                
            case 'concat':
                return this.concatValues(rule.values, sourceData, rule.separator);
                
            case 'split':
                return String(sourceValue || '').split(rule.separator || ',');
                
            case 'replace':
                return String(sourceValue || '').replace(new RegExp(rule.search, 'g'), rule.replace);
                
            case 'custom':
                if (rule.customFunction) {
                    return await rule.customFunction(sourceValue, sourceData, context);
                }
                break;
                
            case 'lookup':
                return this.lookupValue(sourceValue, rule.lookupTable);
                
            case 'default':
                return sourceValue || rule.defaultValue;
                
            default:
                return sourceValue;
        }
    }
    
    /**
     * Récupération d'une valeur imbriquée
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            if (current && typeof current === 'object') {
                return current[key];
            }
            return undefined;
        }, obj);
    }
    
    /**
     * Définition d'une valeur imbriquée
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }
    
    /**
     * Formatage des transformations communes
     */
    capitalize(value) {
        if (!value) return '';
        return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
    }
    
    formatPhone(value) {
        if (!value) return '';
        const cleaned = String(value).replace(/\D/g, '');
        
        // Format français
        if (cleaned.startsWith('33')) {
            return `+33 ${cleaned.substring(2, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9, 11)}`;
        }
        
        // Format international générique
        if (cleaned.length >= 10) {
            return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
        }
        
        return value;
    }
    
    formatEmail(value) {
        if (!value) return '';
        return String(value).toLowerCase().trim();
    }
    
    concatValues(values, sourceData, separator = ' ') {
        return values
            .map(val => this.getNestedValue(sourceData, val))
            .filter(val => val)
            .join(separator);
    }
    
    lookupValue(value, lookupTable) {
        if (!lookupTable || !value) return value;
        return lookupTable[value] || value;
    }
    
    /**
     * Validation des données selon un schéma
     */
    async validateData(data, schemaId) {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            return { valid: true, errors: [] };
        }
        
        const errors = [];
        
        for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
            const value = this.getNestedValue(data, fieldName);
            
            // Vérifier les champs requis
            if (fieldDef.required && (value === undefined || value === null || value === '')) {
                errors.push(`Champ requis manquant : ${fieldName}`);
                continue;
            }
            
            // Vérifier les types si la valeur existe
            if (value !== undefined && value !== null && value !== '') {
                const validation = await this.validateFieldType(value, fieldDef.type);
                if (!validation.valid) {
                    errors.push(`${fieldName} : ${validation.message}`);
                }
                
                // Vérifier les enums
                if (fieldDef.enum && !fieldDef.enum.includes(value)) {
                    errors.push(`${fieldName} : valeur non autorisée (${fieldDef.enum.join(', ')})`);
                }
            }
        }
        
        if (errors.length > 0) {
            this.metrics.dataValidationErrors += errors.length;
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Validation du type d'un champ
     */
    async validateFieldType(value, type) {
        const validator = this.validators.get(type);
        if (validator) {
            return validator.validate(value);
        }
        
        // Validation de type simple
        switch (type) {
            case this.dataTypes.string:
                return {
                    valid: typeof value === 'string',
                    message: typeof value === 'string' ? 'Chaîne valide' : 'Doit être une chaîne'
                };
                
            case this.dataTypes.number:
                return {
                    valid: typeof value === 'number' && !isNaN(value),
                    message: typeof value === 'number' && !isNaN(value) ? 'Nombre valide' : 'Doit être un nombre'
                };
                
            case this.dataTypes.boolean:
                return {
                    valid: typeof value === 'boolean',
                    message: typeof value === 'boolean' ? 'Booléen valide' : 'Doit être un booléen'
                };
                
            case this.dataTypes.array:
                return {
                    valid: Array.isArray(value),
                    message: Array.isArray(value) ? 'Tableau valide' : 'Doit être un tableau'
                };
                
            case this.dataTypes.object:
                return {
                    valid: typeof value === 'object' && value !== null && !Array.isArray(value),
                    message: typeof value === 'object' && value !== null && !Array.isArray(value) ? 'Objet valide' : 'Doit être un objet'
                };
                
            default:
                return { valid: true, message: 'Type non vérifié' };
        }
    }
    
    /**
     * Enrichissement des données
     */
    async enrichData(data, context) {
        let enrichedData = { ...data };
        
        for (const enricher of this.enrichers.values()) {
            try {
                enrichedData = await enricher.enrich(enrichedData, context);
                this.metrics.enrichmentCount++;
            } catch (error) {
                console.warn(`⚠️ Erreur enrichissement ${enricher.id} :`, error.message);
            }
        }
        
        return enrichedData;
    }
    
    /**
     * Génération de clé de cache
     */
    generateCacheKey(mappingId, data) {
        const dataHash = btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '');
        return `${mappingId}_${dataHash}`;
    }
    
    /**
     * Récupération du résultat en cache
     */
    getCachedResult(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Mise en cache du résultat
     */
    cacheResult(key, data) {
        this.cache.set(key, {
            data: data,
            expires: Date.now() + this.config.cacheTimeout
        });
    }
    
    /**
     * Mise à jour des métriques de mapping
     */
    updateMappingMetrics(mapping, processingTime, success) {
        mapping.metrics.usageCount++;
        
        if (success) {
            mapping.metrics.successCount++;
            mapping.metrics.averageProcessingTime = Math.round(
                (mapping.metrics.averageProcessingTime + processingTime) / 2
            );
        } else {
            mapping.metrics.errorCount++;
        }
        
        mapping.modified = new Date();
    }
    
    /**
     * Mise à jour des métriques globales
     */
    updateGlobalMetrics(processingTime, success) {
        this.metrics.totalMappings++;
        
        if (success) {
            this.metrics.successfulMappings++;
            this.metrics.averageProcessingTime = Math.round(
                (this.metrics.averageProcessingTime + processingTime) / 2
            );
        } else {
            this.metrics.failedMappings++;
        }
    }
    
    /**
     * Nettoyage périodique du cache
     */
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.cache.entries()) {
                if (now > cached.expires) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Toutes les minutes
    }
    
    /**
     * Export de données dans différents formats
     */
    exportData(data, format = 'json') {
        switch (format) {
            case this.formatters.json:
                return JSON.stringify(data, null, 2);
                
            case this.formatters.csv:
                return this.convertToCSV(data);
                
            case this.formatters.xml:
                return this.convertToXML(data);
                
            case this.formatters.yaml:
                return this.convertToYAML(data);
                
            default:
                return JSON.stringify(data);
        }
    }
    
    /**
     * Conversion en CSV
     */
    convertToCSV(data) {
        if (!Array.isArray(data)) {
            data = [data];
        }
        
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }
    
    /**
     * Conversion en XML
     */
    convertToXML(data, rootName = 'data') {
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
        
        const toXml = (obj, name) => {
            if (Array.isArray(obj)) {
                return obj.map(item => toXml(item, name.slice(0, -1))).join('');
            }
            
            if (typeof obj === 'object' && obj !== null) {
                const elements = Object.entries(obj)
                    .map(([key, value]) => toXml(value, key))
                    .join('');
                return `<${name}>${elements}</${name}>`;
            }
            
            return `<${name}>${obj}</${name}>`;
        };
        
        return xmlHeader + '\n' + toXml(data, rootName);
    }
    
    /**
     * Conversion en YAML (simplifié)
     */
    convertToYAML(data, indent = 0) {
        const spaces = '  '.repeat(indent);
        
        if (Array.isArray(data)) {
            return data.map(item => 
                spaces + '- ' + this.convertToYAML(item, indent + 1).trim()
            ).join('\n');
        }
        
        if (typeof data === 'object' && data !== null) {
            return Object.entries(data)
                .map(([key, value]) => {
                    if (typeof value === 'object') {
                        return spaces + key + ':\n' + this.convertToYAML(value, indent + 1);
                    }
                    return spaces + key + ': ' + value;
                })
                .join('\n');
        }
        
        return String(data);
    }
    
    /**
     * Import de données depuis différents formats
     */
    importData(rawData, format = 'json') {
        switch (format) {
            case this.formatters.json:
                return JSON.parse(rawData);
                
            case this.formatters.csv:
                return this.parseCSV(rawData);
                
            case this.formatters.xml:
                return this.parseXML(rawData);
                
            default:
                throw new Error(`Format d'import non supporté : ${format}`);
        }
    }
    
    /**
     * Parsing CSV
     */
    parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            rows.push(row);
        }
        
        return rows;
    }
    
    /**
     * Parsing XML simplifié
     */
    parseXML(xmlData) {
        // Parser XML très basique pour démo
        // En production, utiliser DOMParser
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlData, 'text/xml');
            return this.xmlToObject(doc.documentElement);
        } catch (error) {
            throw new Error(`Erreur parsing XML : ${error.message}`);
        }
    }
    
    /**
     * Conversion XML vers objet
     */
    xmlToObject(element) {
        const obj = {};
        
        // Attributs
        for (const attr of element.attributes) {
            obj[attr.name] = attr.value;
        }
        
        // Enfants
        for (const child of element.children) {
            const key = child.tagName;
            const value = child.children.length > 0 ? this.xmlToObject(child) : child.textContent;
            
            if (obj[key]) {
                if (!Array.isArray(obj[key])) {
                    obj[key] = [obj[key]];
                }
                obj[key].push(value);
            } else {
                obj[key] = value;
            }
        }
        
        return obj;
    }
    
    /**
     * Test d'un mapping
     */
    async testMapping(mappingId, testData) {
        try {
            const result = await this.mapData(mappingId, testData, { test: true });
            
            return {
                success: true,
                input: testData,
                output: result.data,
                processingTime: result.processingTime,
                validation: 'passed'
            };
            
        } catch (error) {
            return {
                success: false,
                input: testData,
                error: error.message,
                validation: 'failed'
            };
        }
    }
    
    /**
     * Obtention des schémas disponibles
     */
    getSchemas() {
        return Array.from(this.schemas.values());
    }
    
    /**
     * Obtention des mappings disponibles
     */
    getMappings() {
        return Array.from(this.mappings.values());
    }
    
    /**
     * Obtention des transformations disponibles
     */
    getTransformations() {
        return Array.from(this.transformations.values());
    }
    
    /**
     * Obtention des métriques globales
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Suppression d'un mapping
     */
    deleteMapping(mappingId) {
        const mapping = this.mappings.get(mappingId);
        if (!mapping) {
            throw new Error(`Mapping ${mappingId} introuvable`);
        }
        
        this.mappings.delete(mappingId);
        console.log(`🗑️ Mapping ${mapping.name} supprimé`);
    }
    
    /**
     * Vidage du cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache de mapping vidé');
    }
}

// Export pour compatibilité navigateur
window.DataMapper = DataMapper;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.dataMapper) {
        window.dataMapper = new DataMapper();
        console.log('🔄 DataMapper initialisé globalement');
    }
});
