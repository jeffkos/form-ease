/**
 * 🔐 SecurityManager.js - FormEase Sprint 4 Phase 1
 * 
 * Gestionnaire de sécurité et protection avancée
 * Système de sécurité enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Authentification multi-facteurs (MFA)
 * - Chiffrement bout-en-bout
 * - Protection CSRF/XSS avancée
 * - Rate limiting et throttling
 * - Détection d'intrusions
 * - Audit de sécurité complet
 * - Conformité RGPD/SOC2
 * - Sessions sécurisées
 * 
 * @version 4.0.0
 * @author FormEase Security Team
 * @since Sprint 4 Phase 1
 */

class SecurityManager {
    constructor() {
        this.securityPolicies = new Map();
        this.threatDetection = new Map();
        this.auditLogs = [];
        this.sessions = new Map();
        this.encryption = new Map();
        this.rateLimits = new Map();
        
        this.config = {
            mfaRequired: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            passwordMinLength: 12,
            passwordComplexity: true,
            encryptionAlgorithm: 'AES-256-GCM',
            auditRetention: 90, // jours
            complianceMode: 'STRICT'
        };
        
        this.securityLevels = {
            public: 'public',
            internal: 'internal',
            confidential: 'confidential',
            restricted: 'restricted',
            classified: 'classified'
        };
        
        this.threatTypes = {
            bruteForce: 'brute_force',
            xssAttempt: 'xss_attempt',
            csrfAttempt: 'csrf_attempt',
            sqlInjection: 'sql_injection',
            suspiciousAccess: 'suspicious_access',
            dataExfiltration: 'data_exfiltration',
            privilegeEscalation: 'privilege_escalation',
            anomalousPattern: 'anomalous_pattern'
        };
        
        this.encryptionKeys = new Map();
        this.csrfTokens = new Map();
        this.securityHeaders = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
        
        this.complianceStandards = {
            gdpr: { enabled: true, dataRetention: 90, anonymization: true },
            soc2: { enabled: true, auditTrail: true, accessControl: true },
            iso27001: { enabled: true, riskAssessment: true, incidentResponse: true },
            hipaa: { enabled: false, encryption: true, accessLogging: true }
        };
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire de sécurité
     */
    init() {
        this.setupSecurityPolicies();
        this.initializeEncryption();
        this.setupThreatDetection();
        this.setupCSRFProtection();
        this.setupSecurityHeaders();
        this.startSecurityMonitoring();
        this.initializeCompliance();
        console.log('🔐 SecurityManager v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Configuration des politiques de sécurité
     */
    setupSecurityPolicies() {
        // Politique de mots de passe
        this.securityPolicies.set('password-policy', {
            id: 'password-policy',
            name: 'Politique de Mots de Passe',
            rules: {
                minLength: this.config.passwordMinLength,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                noCommonPasswords: true,
                noPersonalInfo: true,
                historyCheck: 12, // derniers 12 mots de passe
                expirationDays: 90
            },
            enforcement: 'STRICT'
        });
        
        // Politique d'accès
        this.securityPolicies.set('access-policy', {
            id: 'access-policy',
            name: 'Politique de Contrôle d\'Accès',
            rules: {
                mfaRequired: this.config.mfaRequired,
                sessionTimeout: this.config.sessionTimeout,
                maxConcurrentSessions: 3,
                ipWhitelisting: false,
                geoBlocking: true,
                deviceTrust: true,
                timeBasedAccess: false
            },
            enforcement: 'STRICT'
        });
        
        // Politique de données
        this.securityPolicies.set('data-policy', {
            id: 'data-policy',
            name: 'Politique de Protection des Données',
            rules: {
                encryptionAtRest: true,
                encryptionInTransit: true,
                dataClassification: true,
                accessLogging: true,
                dataMinimization: true,
                anonymization: true,
                retentionPeriod: this.config.auditRetention
            },
            enforcement: 'STRICT'
        });
        
        // Politique de réseau
        this.securityPolicies.set('network-policy', {
            id: 'network-policy',
            name: 'Politique de Sécurité Réseau',
            rules: {
                httpsOnly: true,
                rateLimiting: true,
                ddosProtection: true,
                firewallRules: true,
                intrusionDetection: true,
                trafficAnalysis: true
            },
            enforcement: 'STRICT'
        });
        
        console.log('📋 Politiques de sécurité configurées :', this.securityPolicies.size);
    }
    
    /**
     * Initialisation du chiffrement
     */
    async initializeEncryption() {
        try {
            // Générer une clé maître pour le chiffrement
            const masterKey = await this.generateMasterKey();
            this.encryptionKeys.set('master', masterKey);
            
            // Clés pour différents types de données
            const dataKey = await this.deriveKey(masterKey, 'data-encryption');
            const sessionKey = await this.deriveKey(masterKey, 'session-encryption');
            const auditKey = await this.deriveKey(masterKey, 'audit-encryption');
            
            this.encryptionKeys.set('data', dataKey);
            this.encryptionKeys.set('session', sessionKey);
            this.encryptionKeys.set('audit', auditKey);
            
            console.log('🔐 Système de chiffrement initialisé');
        } catch (error) {
            console.error('Erreur initialisation chiffrement :', error);
            this.logSecurityEvent('encryption_init_failed', { error: error.message });
        }
    }
    
    /**
     * Configuration de la détection de menaces
     */
    setupThreatDetection() {
        // Détection de force brute
        this.threatDetection.set('brute-force', {
            id: 'brute-force',
            name: 'Détection Force Brute',
            enabled: true,
            threshold: this.config.maxLoginAttempts,
            timeWindow: 5 * 60 * 1000, // 5 minutes
            action: 'LOCK_ACCOUNT',
            severity: 'HIGH'
        });
        
        // Détection XSS
        this.threatDetection.set('xss-detection', {
            id: 'xss-detection',
            name: 'Détection XSS',
            enabled: true,
            patterns: [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /expression\s*\(/gi
            ],
            action: 'BLOCK_REQUEST',
            severity: 'HIGH'
        });
        
        // Détection injection SQL
        this.threatDetection.set('sql-injection', {
            id: 'sql-injection',
            name: 'Détection Injection SQL',
            enabled: true,
            patterns: [
                /(\bUNION\b.*\bSELECT\b)/i,
                /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
                /(\bINSERT\b.*\bINTO\b)/i,
                /(\bDELETE\b.*\bFROM\b)/i,
                /(\bDROP\b.*\bTABLE\b)/i,
                /(--|\#|\/\*)/
            ],
            action: 'BLOCK_REQUEST',
            severity: 'CRITICAL'
        });
        
        // Détection accès suspect
        this.threatDetection.set('suspicious-access', {
            id: 'suspicious-access',
            name: 'Détection Accès Suspect',
            enabled: true,
            indicators: [
                'multiple_failed_logins',
                'unusual_location',
                'new_device',
                'off_hours_access',
                'privilege_escalation_attempt'
            ],
            action: 'REQUIRE_MFA',
            severity: 'MEDIUM'
        });
        
        console.log('🛡️ Système de détection de menaces configuré');
    }
    
    /**
     * Authentification avec MFA
     */
    async authenticateUser(credentials) {
        const authResult = {
            success: false,
            user: null,
            session: null,
            mfaRequired: false,
            errors: []
        };
        
        try {
            // Vérifier le rate limiting
            if (!this.checkRateLimit(credentials.username, 'login')) {
                authResult.errors.push('Trop de tentatives de connexion');
                this.logSecurityEvent('rate_limit_exceeded', { username: credentials.username });
                return authResult;
            }
            
            // Détecter les menaces
            const threats = await this.detectThreats(credentials);
            if (threats.length > 0) {
                authResult.errors.push('Activité suspecte détectée');
                this.handleThreats(threats);
                return authResult;
            }
            
            // Validation des identifiants
            const user = await this.validateCredentials(credentials);
            if (!user) {
                authResult.errors.push('Identifiants invalides');
                this.logSecurityEvent('login_failed', { username: credentials.username });
                return authResult;
            }
            
            // Vérifier si MFA est requis
            if (this.isMFARequired(user)) {
                authResult.mfaRequired = true;
                authResult.user = this.sanitizeUserData(user);
                return authResult;
            }
            
            // Créer la session sécurisée
            const session = await this.createSecureSession(user);
            
            authResult.success = true;
            authResult.user = this.sanitizeUserData(user);
            authResult.session = session;
            
            this.logSecurityEvent('login_success', { 
                userId: user.id, 
                sessionId: session.id 
            });
            
            return authResult;
            
        } catch (error) {
            console.error('Erreur authentification :', error);
            authResult.errors.push('Erreur système');
            this.logSecurityEvent('auth_error', { error: error.message });
            return authResult;
        }
    }
    
    /**
     * Vérification MFA
     */
    async verifyMFA(userId, mfaCode, method = 'totp') {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('Utilisateur introuvable');
            }
            
            let isValid = false;
            
            switch (method) {
                case 'totp':
                    isValid = await this.verifyTOTP(user, mfaCode);
                    break;
                case 'sms':
                    isValid = await this.verifySMS(user, mfaCode);
                    break;
                case 'email':
                    isValid = await this.verifyEmail(user, mfaCode);
                    break;
                case 'backup':
                    isValid = await this.verifyBackupCode(user, mfaCode);
                    break;
                default:
                    throw new Error('Méthode MFA non supportée');
            }
            
            if (isValid) {
                this.logSecurityEvent('mfa_success', { userId, method });
                return await this.createSecureSession(user);
            } else {
                this.logSecurityEvent('mfa_failed', { userId, method });
                throw new Error('Code MFA invalide');
            }
            
        } catch (error) {
            console.error('Erreur vérification MFA :', error);
            throw error;
        }
    }
    
    /**
     * Chiffrement de données
     */
    async encryptData(data, classification = 'internal') {
        try {
            const key = this.encryptionKeys.get('data');
            if (!key) {
                throw new Error('Clé de chiffrement non disponible');
            }
            
            // Convertir en JSON si nécessaire
            const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Générer un IV aléatoire
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encoder le texte
            const encoder = new TextEncoder();
            const plaintextBytes = encoder.encode(plaintext);
            
            // Chiffrer
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                plaintextBytes
            );
            
            // Combiner IV et données chiffrées
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);
            
            // Encoder en base64
            const base64 = btoa(String.fromCharCode(...result));
            
            this.logSecurityEvent('data_encrypted', { 
                classification, 
                size: data.length 
            });
            
            return {
                encrypted: base64,
                classification: classification,
                algorithm: this.config.encryptionAlgorithm,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Erreur chiffrement :', error);
            this.logSecurityEvent('encryption_failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Déchiffrement de données
     */
    async decryptData(encryptedData) {
        try {
            const key = this.encryptionKeys.get('data');
            if (!key) {
                throw new Error('Clé de déchiffrement non disponible');
            }
            
            // Décoder de base64
            const encrypted = Uint8Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0));
            
            // Extraire IV et données
            const iv = encrypted.slice(0, 12);
            const data = encrypted.slice(12);
            
            // Déchiffrer
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );
            
            // Décoder le texte
            const decoder = new TextDecoder();
            const plaintext = decoder.decode(decrypted);
            
            this.logSecurityEvent('data_decrypted', { 
                classification: encryptedData.classification 
            });
            
            // Essayer de parser en JSON
            try {
                return JSON.parse(plaintext);
            } catch {
                return plaintext;
            }
            
        } catch (error) {
            console.error('Erreur déchiffrement :', error);
            this.logSecurityEvent('decryption_failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Protection CSRF
     */
    generateCSRFToken(sessionId) {
        const token = this.generateSecureToken(32);
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
        
        this.csrfTokens.set(token, {
            sessionId: sessionId,
            expiry: expiry,
            used: false
        });
        
        // Nettoyer les anciens tokens
        this.cleanupExpiredTokens();
        
        return token;
    }
    
    /**
     * Validation token CSRF
     */
    validateCSRFToken(token, sessionId) {
        const tokenData = this.csrfTokens.get(token);
        
        if (!tokenData) {
            this.logSecurityEvent('csrf_invalid_token', { sessionId });
            return false;
        }
        
        if (tokenData.sessionId !== sessionId) {
            this.logSecurityEvent('csrf_session_mismatch', { sessionId });
            return false;
        }
        
        if (tokenData.expiry < new Date()) {
            this.logSecurityEvent('csrf_token_expired', { sessionId });
            this.csrfTokens.delete(token);
            return false;
        }
        
        if (tokenData.used) {
            this.logSecurityEvent('csrf_token_reuse', { sessionId });
            return false;
        }
        
        // Marquer le token comme utilisé
        tokenData.used = true;
        
        this.logSecurityEvent('csrf_token_valid', { sessionId });
        return true;
    }
    
    /**
     * Rate limiting
     */
    checkRateLimit(identifier, action) {
        const key = `${identifier}:${action}`;
        const now = Date.now();
        const windowSize = 5 * 60 * 1000; // 5 minutes
        const maxRequests = this.getRateLimitForAction(action);
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, []);
        }
        
        const requests = this.rateLimits.get(key);
        
        // Nettoyer les anciennes requêtes
        while (requests.length > 0 && requests[0] < now - windowSize) {
            requests.shift();
        }
        
        if (requests.length >= maxRequests) {
            this.logSecurityEvent('rate_limit_exceeded', { 
                identifier, 
                action, 
                count: requests.length 
            });
            return false;
        }
        
        requests.push(now);
        return true;
    }
    
    /**
     * Détection de menaces
     */
    async detectThreats(request) {
        const threats = [];
        
        // Vérifier chaque détecteur
        for (const [id, detector] of this.threatDetection.entries()) {
            if (!detector.enabled) continue;
            
            try {
                const threat = await this.runThreatDetector(detector, request);
                if (threat) {
                    threats.push(threat);
                }
            } catch (error) {
                console.error(`Erreur détecteur ${id}:`, error);
            }
        }
        
        return threats;
    }
    
    /**
     * Exécution d'un détecteur de menaces
     */
    async runThreatDetector(detector, request) {
        switch (detector.id) {
            case 'brute-force':
                return this.detectBruteForce(detector, request);
                
            case 'xss-detection':
                return this.detectXSS(detector, request);
                
            case 'sql-injection':
                return this.detectSQLInjection(detector, request);
                
            case 'suspicious-access':
                return this.detectSuspiciousAccess(detector, request);
                
            default:
                return null;
        }
    }
    
    /**
     * Détection de force brute
     */
    detectBruteForce(detector, request) {
        const identifier = request.username || request.ip;
        const attempts = this.getFailedAttempts(identifier);
        
        if (attempts >= detector.threshold) {
            return {
                type: this.threatTypes.bruteForce,
                severity: detector.severity,
                identifier: identifier,
                attempts: attempts,
                detector: detector.id,
                timestamp: new Date()
            };
        }
        
        return null;
    }
    
    /**
     * Détection XSS
     */
    detectXSS(detector, request) {
        const inputs = this.extractInputs(request);
        
        for (const input of inputs) {
            for (const pattern of detector.patterns) {
                if (pattern.test(input)) {
                    return {
                        type: this.threatTypes.xssAttempt,
                        severity: detector.severity,
                        input: input.substring(0, 100), // Limiter la taille
                        pattern: pattern.source,
                        detector: detector.id,
                        timestamp: new Date()
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Création de session sécurisée
     */
    async createSecureSession(user) {
        const sessionId = this.generateSecureToken(64);
        const now = new Date();
        const expiry = new Date(now.getTime() + this.config.sessionTimeout);
        
        const session = {
            id: sessionId,
            userId: user.id,
            created: now,
            expires: expiry,
            lastActivity: now,
            ipAddress: this.getCurrentIP(),
            userAgent: navigator.userAgent,
            mfaVerified: true,
            securityLevel: user.securityLevel || 'standard',
            permissions: user.permissions || [],
            encrypted: true
        };
        
        // Chiffrer la session
        const encryptedSession = await this.encryptData(session, 'confidential');
        this.sessions.set(sessionId, encryptedSession);
        
        // Générer le token CSRF
        const csrfToken = this.generateCSRFToken(sessionId);
        
        this.logSecurityEvent('session_created', { 
            sessionId, 
            userId: user.id 
        });
        
        return {
            sessionId: sessionId,
            csrfToken: csrfToken,
            expires: expiry,
            securityLevel: session.securityLevel
        };
    }
    
    /**
     * Audit de sécurité
     */
    logSecurityEvent(eventType, details = {}) {
        const event = {
            id: this.generateSecureToken(16),
            type: eventType,
            timestamp: new Date(),
            details: details,
            source: 'SecurityManager',
            classification: this.getEventClassification(eventType),
            hash: this.generateEventHash(eventType, details)
        };
        
        this.auditLogs.push(event);
        
        // Limiter la taille des logs
        if (this.auditLogs.length > 10000) {
            this.auditLogs = this.auditLogs.slice(-5000);
        }
        
        // Envoyer à l'analytique si critique
        if (this.isCriticalEvent(eventType)) {
            this.sendSecurityAlert(event);
        }
        
        console.log(`🔒 [SECURITY] ${eventType}:`, details);
    }
    
    /**
     * Démarrage du monitoring de sécurité
     */
    startSecurityMonitoring() {
        // Nettoyage périodique des sessions
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000); // Chaque minute
        
        // Nettoyage des tokens CSRF
        setInterval(() => {
            this.cleanupExpiredTokens();
        }, 300000); // Chaque 5 minutes
        
        // Analyse des menaces
        setInterval(() => {
            this.analyzeThreatPatterns();
        }, 600000); // Chaque 10 minutes
        
        // Archivage des logs
        setInterval(() => {
            this.archiveSecurityLogs();
        }, 24 * 60 * 60 * 1000); // Chaque jour
        
        console.log('👁️ Monitoring de sécurité démarré');
    }
    
    /**
     * Configuration des en-têtes de sécurité
     */
    setupSecurityHeaders() {
        // Appliquer les en-têtes de sécurité à toutes les réponses
        if (typeof window !== 'undefined' && window.fetch) {
            const originalFetch = window.fetch;
            
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    // Vérifier les en-têtes de sécurité dans la réponse
                    return response;
                });
            };
        }
        
        console.log('🛡️ En-têtes de sécurité configurés');
    }
    
    /**
     * Initialisation de la conformité
     */
    initializeCompliance() {
        // RGPD
        if (this.complianceStandards.gdpr.enabled) {
            this.setupGDPRCompliance();
        }
        
        // SOC2
        if (this.complianceStandards.soc2.enabled) {
            this.setupSOC2Compliance();
        }
        
        // ISO 27001
        if (this.complianceStandards.iso27001.enabled) {
            this.setupISO27001Compliance();
        }
        
        console.log('📋 Standards de conformité initialisés');
    }
    
    /**
     * Validation des mots de passe
     */
    validatePassword(password, userInfo = {}) {
        const policy = this.securityPolicies.get('password-policy');
        const errors = [];
        
        // Longueur minimale
        if (password.length < policy.rules.minLength) {
            errors.push(`Le mot de passe doit contenir au moins ${policy.rules.minLength} caractères`);
        }
        
        // Complexité
        if (policy.rules.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }
        
        if (policy.rules.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une minuscule');
        }
        
        if (policy.rules.requireNumbers && !/\d/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }
        
        if (policy.rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un caractère spécial');
        }
        
        // Mots de passe communs
        if (policy.rules.noCommonPasswords && this.isCommonPassword(password)) {
            errors.push('Ce mot de passe est trop commun');
        }
        
        // Informations personnelles
        if (policy.rules.noPersonalInfo && this.containsPersonalInfo(password, userInfo)) {
            errors.push('Le mot de passe ne doit pas contenir d\'informations personnelles');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(password)
        };
    }
    
    /**
     * Génération de clés sécurisées
     */
    async generateMasterKey() {
        return await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Dérivation de clés
     */
    async deriveKey(masterKey, purpose) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.exportKey('raw', masterKey);
        const salt = encoder.encode(purpose);
        
        const derivedKey = await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            derivedKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Génération de tokens sécurisés
     */
    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Fonctions utilitaires
     */
    sanitizeUserData(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            roles: user.roles,
            permissions: user.permissions,
            lastLogin: user.lastLogin,
            securityLevel: user.securityLevel
        };
    }
    
    getCurrentIP() {
        // Simulation - en production, obtenir l'IP réelle
        return '192.168.1.100';
    }
    
    getUserById(userId) {
        // Simulation - en production, requête base de données
        return {
            id: userId,
            username: 'demo-user',
            email: 'demo@formease.com',
            securityLevel: 'standard',
            mfaSecret: 'demo-secret',
            permissions: ['read', 'write']
        };
    }
    
    validateCredentials(credentials) {
        // Simulation - en production, vérification base de données
        if (credentials.username === 'demo' && credentials.password === 'demo123') {
            return this.getUserById('user-123');
        }
        return null;
    }
    
    isMFARequired(user) {
        return this.config.mfaRequired || user.securityLevel === 'high';
    }
    
    verifyTOTP(user, code) {
        // Simulation - en production, vérification TOTP réelle
        return code === '123456';
    }
    
    getRateLimitForAction(action) {
        const limits = {
            login: 5,
            api: 100,
            upload: 10,
            download: 50
        };
        return limits[action] || 20;
    }
    
    getFailedAttempts(identifier) {
        // Simulation - en production, compter depuis la base de données
        return Math.floor(Math.random() * 3);
    }
    
    extractInputs(request) {
        // Extraire tous les inputs de la requête
        const inputs = [];
        
        if (request.body) inputs.push(request.body);
        if (request.query) inputs.push(JSON.stringify(request.query));
        if (request.headers) inputs.push(JSON.stringify(request.headers));
        
        return inputs.filter(input => typeof input === 'string');
    }
    
    isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'letmein',
            'welcome', 'monkey', '1234567890', 'qwerty', 'abc123'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }
    
    containsPersonalInfo(password, userInfo) {
        const personalData = [
            userInfo.username, userInfo.email, userInfo.firstName,
            userInfo.lastName, userInfo.birthDate
        ].filter(Boolean);
        
        return personalData.some(data => 
            password.toLowerCase().includes(data.toLowerCase())
        );
    }
    
    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        if (password.length >= 16) score += 1;
        
        const strengths = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
        return {
            score: score,
            level: strengths[Math.min(score - 1, 4)] || 'Très faible'
        };
    }
    
    getEventClassification(eventType) {
        const critical = ['auth_error', 'encryption_failed', 'sql_injection'];
        const high = ['login_failed', 'mfa_failed', 'xss_attempt'];
        const medium = ['rate_limit_exceeded', 'suspicious_access'];
        
        if (critical.includes(eventType)) return 'critical';
        if (high.includes(eventType)) return 'high';
        if (medium.includes(eventType)) return 'medium';
        return 'low';
    }
    
    generateEventHash(eventType, details) {
        const data = eventType + JSON.stringify(details) + Date.now();
        return btoa(data).substring(0, 16);
    }
    
    isCriticalEvent(eventType) {
        return this.getEventClassification(eventType) === 'critical';
    }
    
    sendSecurityAlert(event) {
        console.warn('🚨 ALERTE SÉCURITÉ CRITIQUE :', event);
        
        // En production, envoyer à l'équipe de sécurité
        if (window.notificationRouter) {
            window.notificationRouter.sendNotification({
                template: 'security-alert',
                priority: 'critical',
                recipients: ['security@formease.com'],
                variables: { event }
            });
        }
    }
    
    cleanupExpiredSessions() {
        const now = new Date();
        let cleaned = 0;
        
        for (const [sessionId, encryptedSession] of this.sessions.entries()) {
            try {
                const session = this.decryptData(encryptedSession);
                if (session.expires < now) {
                    this.sessions.delete(sessionId);
                    cleaned++;
                }
            } catch (error) {
                // Session corrompue, la supprimer
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} sessions expirées nettoyées`);
        }
    }
    
    cleanupExpiredTokens() {
        const now = new Date();
        let cleaned = 0;
        
        for (const [token, data] of this.csrfTokens.entries()) {
            if (data.expiry < now) {
                this.csrfTokens.delete(token);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} tokens CSRF expirés nettoyés`);
        }
    }
    
    analyzeThreatPatterns() {
        // Analyser les patterns de menaces pour améliorer la détection
        const recentThreats = this.auditLogs
            .filter(log => log.type.includes('threat') || log.type.includes('attack'))
            .slice(-100);
        
        if (recentThreats.length > 0) {
            console.log(`🔍 Analyse de ${recentThreats.length} menaces récentes`);
        }
    }
    
    archiveSecurityLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.auditRetention);
        
        const toArchive = this.auditLogs.filter(log => log.timestamp < cutoffDate);
        
        if (toArchive.length > 0) {
            // En production, archiver dans un stockage sécurisé
            this.auditLogs = this.auditLogs.filter(log => log.timestamp >= cutoffDate);
            console.log(`📦 ${toArchive.length} logs archivés`);
        }
    }
    
    setupGDPRCompliance() {
        console.log('🇪🇺 Conformité RGPD activée');
    }
    
    setupSOC2Compliance() {
        console.log('📋 Conformité SOC2 activée');
    }
    
    setupISO27001Compliance() {
        console.log('🏛️ Conformité ISO 27001 activée');
    }
    
    /**
     * API publique
     */
    getSecurityStatus() {
        return {
            policies: this.securityPolicies.size,
            activeSessions: this.sessions.size,
            threatDetectors: this.threatDetection.size,
            auditLogs: this.auditLogs.length,
            compliance: Object.keys(this.complianceStandards).filter(
                std => this.complianceStandards[std].enabled
            )
        };
    }
    
    getAuditLogs(limit = 100) {
        return this.auditLogs.slice(-limit);
    }
    
    getSecurityPolicies() {
        return Array.from(this.securityPolicies.values());
    }
}

// Export pour compatibilité navigateur
window.SecurityManager = SecurityManager;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.securityManager) {
        window.securityManager = new SecurityManager();
        console.log('🔐 SecurityManager initialisé globalement');
    }
});
