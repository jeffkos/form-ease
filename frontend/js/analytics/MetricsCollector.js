/**
 * 📈 MetricsCollector.js - FormEase Sprint 3 Phase 4
 * 
 * Collecteur de métriques et événements avancé
 * Capture et traite toutes les métriques de performance et usage
 * 
 * Fonctionnalités :
 * - Collecte automatique de métriques système
 * - Tracking des interactions utilisateur
 * - Métriques de performance en temps réel
 * - Events custom et business metrics
 * - Collecte de données A/B testing
 * - Métriques de satisfaction utilisateur
 * - Monitoring de santé système
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 4
 */

class MetricsCollector {
    constructor(analyticsEngine) {
        this.analytics = analyticsEngine || window.analyticsEngine;
        this.collectors = new Map();
        this.interceptors = new Map();
        this.sessionData = {};
        this.performanceObserver = null;
        this.mutationObserver = null;
        
        this.config = {
            autoCollect: true,
            batchSize: 50,
            flushInterval: 10000, // 10 secondes
            performanceMetrics: true,
            userInteractions: true,
            errorTracking: true,
            businessMetrics: true,
            sampling: {
                performance: 1.0, // 100%
                interactions: 0.5, // 50%
                errors: 1.0, // 100%
                business: 1.0 // 100%
            }
        };
        
        this.metricCategories = {
            performance: 'performance',
            user: 'user',
            business: 'business',
            system: 'system',
            error: 'error',
            experiment: 'experiment'
        };
        
        this.userInteractionTypes = {
            click: 'click',
            scroll: 'scroll',
            focus: 'focus',
            hover: 'hover',
            submit: 'submit',
            input: 'input',
            navigation: 'navigation',
            download: 'download'
        };
        
        this.performanceMetrics = {
            pageLoad: 'page_load_time',
            firstPaint: 'first_paint',
            firstContentfulPaint: 'first_contentful_paint',
            largestContentfulPaint: 'largest_contentful_paint',
            cumulativeLayoutShift: 'cumulative_layout_shift',
            firstInputDelay: 'first_input_delay',
            timeToInteractive: 'time_to_interactive',
            memoryUsage: 'memory_usage',
            bundleSize: 'bundle_size'
        };
        
        this.businessKPIs = {
            formCreated: 'form_created',
            formSubmitted: 'form_submitted',
            userRegistered: 'user_registered',
            premiumUpgrade: 'premium_upgrade',
            integrationConnected: 'integration_connected',
            workflowExecuted: 'workflow_executed',
            aiGenerated: 'ai_generated',
            reportGenerated: 'report_generated'
        };
        
        this.queue = [];
        this.session = {
            id: this.generateSessionId(),
            startTime: new Date(),
            pageViews: 0,
            interactions: 0,
            errors: 0,
            experiments: {}
        };
        
        this.init();
    }
    
    /**
     * Initialisation du collecteur de métriques
     */
    init() {
        this.initializeSession();
        this.setupPerformanceObserver();
        this.setupUserInteractionTracking();
        this.setupErrorTracking();
        this.setupBusinessMetricsTracking();
        this.setupAutoFlush();
        this.loadExperiments();
        console.log('📈 MetricsCollector v3.0 initialisé');
    }
    
    /**
     * Initialisation de la session
     */
    initializeSession() {
        // Récupérer ou créer l'ID utilisateur
        this.session.userId = this.getUserId();
        this.session.deviceInfo = this.getDeviceInfo();
        this.session.browserInfo = this.getBrowserInfo();
        this.session.referrer = document.referrer;
        this.session.utmParams = this.getUTMParams();
        
        // Tracker le début de session
        this.track(this.metricCategories.user, 'session_start', {
            sessionId: this.session.id,
            userId: this.session.userId,
            device: this.session.deviceInfo,
            browser: this.session.browserInfo,
            referrer: this.session.referrer,
            utm: this.session.utmParams
        });
        
        // Tracker la vue de page
        this.trackPageView();
        
        console.log('🔍 Session initialisée :', this.session.id);
    }
    
    /**
     * Configuration de l'observateur de performance
     */
    setupPerformanceObserver() {
        if (!this.config.performanceMetrics) return;
        
        // Observer les métriques de performance Web Vitals
        if ('PerformanceObserver' in window) {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.processPerformanceEntry(entry);
                }
            });
            
            // Observer différents types de métriques
            try {
                this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
            } catch (error) {
                console.warn('Certaines métriques de performance non supportées :', error);
            }
        }
        
        // Métriques personnalisées
        this.setupCustomPerformanceMetrics();
        
        console.log('🔍 Observateur de performance configuré');
    }
    
    /**
     * Traitement des entrées de performance
     */
    processPerformanceEntry(entry) {
        let metricName = '';
        let value = 0;
        
        switch (entry.entryType) {
            case 'navigation':
                this.trackNavigationTiming(entry);
                break;
                
            case 'paint':
                if (entry.name === 'first-paint') {
                    metricName = this.performanceMetrics.firstPaint;
                    value = entry.startTime;
                } else if (entry.name === 'first-contentful-paint') {
                    metricName = this.performanceMetrics.firstContentfulPaint;
                    value = entry.startTime;
                }
                break;
                
            case 'largest-contentful-paint':
                metricName = this.performanceMetrics.largestContentfulPaint;
                value = entry.startTime;
                break;
                
            case 'layout-shift':
                if (!entry.hadRecentInput) {
                    metricName = this.performanceMetrics.cumulativeLayoutShift;
                    value = entry.value;
                }
                break;
                
            case 'first-input':
                metricName = this.performanceMetrics.firstInputDelay;
                value = entry.processingStart - entry.startTime;
                break;
        }
        
        if (metricName && this.shouldSample(this.metricCategories.performance)) {
            this.track(this.metricCategories.performance, metricName, {
                value: value,
                timestamp: new Date(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        }
    }
    
    /**
     * Tracking des métriques de navigation
     */
    trackNavigationTiming(entry) {
        const metrics = {
            [this.performanceMetrics.pageLoad]: entry.loadEventEnd - entry.loadEventStart,
            dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
            tcp_connect: entry.connectEnd - entry.connectStart,
            server_response: entry.responseStart - entry.requestStart,
            dom_processing: entry.domComplete - entry.domLoading,
            resource_load: entry.loadEventEnd - entry.domComplete
        };
        
        for (const [metricName, value] of Object.entries(metrics)) {
            if (value > 0) {
                this.track(this.metricCategories.performance, metricName, {
                    value: value,
                    timestamp: new Date()
                });
            }
        }
    }
    
    /**
     * Configuration des métriques de performance personnalisées
     */
    setupCustomPerformanceMetrics() {
        // Métriques de mémoire
        setInterval(() => {
            if (performance.memory) {
                this.track(this.metricCategories.performance, this.performanceMetrics.memoryUsage, {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: new Date()
                });
            }
        }, 30000); // Toutes les 30 secondes
        
        // Métriques de connexion
        if (navigator.connection) {
            this.track(this.metricCategories.system, 'connection_info', {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            });
        }
        
        // Métriques d'API timing
        this.setupAPITimingTracking();
    }
    
    /**
     * Configuration du tracking des interactions utilisateur
     */
    setupUserInteractionTracking() {
        if (!this.config.userInteractions) return;
        
        // Clicks
        document.addEventListener('click', (event) => {
            if (this.shouldSample(this.metricCategories.user)) {
                this.trackUserInteraction(this.userInteractionTypes.click, event);
            }
        });
        
        // Scroll
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.shouldSample(this.metricCategories.user)) {
                    this.trackUserInteraction(this.userInteractionTypes.scroll, {
                        scrollY: window.scrollY,
                        scrollPercentage: this.getScrollPercentage()
                    });
                }
            }, 250);
        });
        
        // Focus/Blur
        document.addEventListener('focusin', (event) => {
            if (this.shouldSample(this.metricCategories.user)) {
                this.trackUserInteraction(this.userInteractionTypes.focus, event);
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (event) => {
            this.trackUserInteraction(this.userInteractionTypes.submit, event);
        });
        
        // Input changes
        document.addEventListener('input', (event) => {
            if (event.target.type !== 'password' && this.shouldSample(this.metricCategories.user)) {
                this.trackUserInteraction(this.userInteractionTypes.input, {
                    inputType: event.target.type,
                    inputName: event.target.name,
                    valueLength: event.target.value.length
                });
            }
        });
        
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            this.track(this.metricCategories.user, 'page_visibility', {
                hidden: document.hidden,
                timestamp: new Date()
            });
        });
        
        console.log('👆 Tracking des interactions utilisateur configuré');
    }
    
    /**
     * Tracking d'une interaction utilisateur
     */
    trackUserInteraction(type, eventOrData) {
        this.session.interactions++;
        
        let data = {
            type: type,
            timestamp: new Date(),
            sessionId: this.session.id,
            userId: this.session.userId
        };
        
        if (eventOrData instanceof Event) {
            const event = eventOrData;
            data = {
                ...data,
                elementTag: event.target.tagName,
                elementId: event.target.id,
                elementClass: event.target.className,
                elementText: event.target.textContent?.substring(0, 100),
                x: event.clientX,
                y: event.clientY,
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
        } else {
            data = { ...data, ...eventOrData };
        }
        
        this.track(this.metricCategories.user, 'interaction', data);
    }
    
    /**
     * Configuration du tracking des erreurs
     */
    setupErrorTracking() {
        if (!this.config.errorTracking) return;
        
        // Erreurs JavaScript
        window.addEventListener('error', (event) => {
            this.trackError('javascript', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: new Date()
            });
        });
        
        // Promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('promise', {
                reason: event.reason,
                stack: event.reason?.stack,
                timestamp: new Date()
            });
        });
        
        // Erreurs de ressources
        document.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.trackError('resource', {
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    timestamp: new Date()
                });
            }
        }, true);
        
        console.log('🚨 Tracking des erreurs configuré');
    }
    
    /**
     * Tracking d'une erreur
     */
    trackError(type, errorData) {
        this.session.errors++;
        
        const data = {
            type: type,
            sessionId: this.session.id,
            userId: this.session.userId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date(),
            ...errorData
        };
        
        this.track(this.metricCategories.error, 'error_occurred', data);
        
        console.error(`[MetricsCollector] Erreur ${type} trackée :`, errorData);
    }
    
    /**
     * Configuration du tracking des métriques business
     */
    setupBusinessMetricsTracking() {
        if (!this.config.businessMetrics) return;
        
        // Observer les mutations DOM pour détecter les actions business
        this.mutationObserver = new MutationObserver((mutations) => {
            this.processDOMMutations(mutations);
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-formease-action', 'data-business-event']
        });
        
        console.log('💼 Tracking des métriques business configuré');
    }
    
    /**
     * Traitement des mutations DOM pour les événements business
     */
    processDOMMutations(mutations) {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                const element = mutation.target;
                const action = element.getAttribute('data-formease-action');
                const businessEvent = element.getAttribute('data-business-event');
                
                if (action) {
                    this.trackBusinessAction(action, {
                        element: element.tagName,
                        elementId: element.id,
                        timestamp: new Date()
                    });
                }
                
                if (businessEvent) {
                    this.trackBusinessEvent(businessEvent, {
                        element: element.tagName,
                        elementId: element.id,
                        timestamp: new Date()
                    });
                }
            }
        }
    }
    
    /**
     * Tracking d'une action business
     */
    trackBusinessAction(action, data = {}) {
        const businessData = {
            action: action,
            sessionId: this.session.id,
            userId: this.session.userId,
            timestamp: new Date(),
            ...data
        };
        
        this.track(this.metricCategories.business, 'business_action', businessData);
    }
    
    /**
     * Tracking d'un événement business
     */
    trackBusinessEvent(event, data = {}) {
        const businessData = {
            event: event,
            sessionId: this.session.id,
            userId: this.session.userId,
            timestamp: new Date(),
            ...data
        };
        
        this.track(this.metricCategories.business, 'business_event', businessData);
    }
    
    /**
     * Configuration du tracking des APIs
     */
    setupAPITimingTracking() {
        // Intercepter fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                this.trackAPICall(url, {
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: endTime - startTime,
                    success: response.ok,
                    timestamp: new Date()
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                this.trackAPICall(url, {
                    method: args[1]?.method || 'GET',
                    duration: endTime - startTime,
                    success: false,
                    error: error.message,
                    timestamp: new Date()
                });
                
                throw error;
            }
        };
        
        // Intercepter XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._metricsData = { method, url, startTime: null };
            return originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function() {
            if (this._metricsData) {
                this._metricsData.startTime = performance.now();
                
                this.addEventListener('loadend', () => {
                    const endTime = performance.now();
                    window.metricsCollector?.trackAPICall(this._metricsData.url, {
                        method: this._metricsData.method,
                        status: this.status,
                        duration: endTime - this._metricsData.startTime,
                        success: this.status >= 200 && this.status < 300,
                        timestamp: new Date()
                    });
                });
            }
            
            return originalXHRSend.apply(this, arguments);
        };
        
        console.log('🌐 Tracking des APIs configuré');
    }
    
    /**
     * Tracking d'un appel API
     */
    trackAPICall(url, data) {
        if (this.shouldSample(this.metricCategories.performance)) {
            this.track(this.metricCategories.performance, 'api_call', {
                url: url,
                sessionId: this.session.id,
                userId: this.session.userId,
                ...data
            });
        }
    }
    
    /**
     * Tracking d'une vue de page
     */
    trackPageView() {
        this.session.pageViews++;
        
        this.track(this.metricCategories.user, 'page_view', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            sessionId: this.session.id,
            userId: this.session.userId,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: new Date()
        });
    }
    
    /**
     * Chargement des expériences A/B
     */
    loadExperiments() {
        try {
            const experimentsData = localStorage.getItem('formease-experiments');
            if (experimentsData) {
                this.session.experiments = JSON.parse(experimentsData);
            }
            
            // Simuler quelques expériences actives
            this.session.experiments = {
                'new-ui-design': Math.random() > 0.5 ? 'variant_a' : 'variant_b',
                'ai-suggestions': Math.random() > 0.5 ? 'enabled' : 'disabled',
                'onboarding-flow': Math.random() > 0.33 ? (Math.random() > 0.5 ? 'flow_a' : 'flow_b') : 'control',
                ...this.session.experiments
            };
            
            // Tracker l'assignation aux expériences
            for (const [experiment, variant] of Object.entries(this.session.experiments)) {
                this.track(this.metricCategories.experiment, 'experiment_assigned', {
                    experiment: experiment,
                    variant: variant,
                    sessionId: this.session.id,
                    userId: this.session.userId,
                    timestamp: new Date()
                });
            }
            
            console.log('🧪 Expériences A/B chargées :', this.session.experiments);
        } catch (error) {
            console.error('Erreur chargement expériences :', error);
        }
    }
    
    /**
     * Tracking d'une conversion d'expérience
     */
    trackExperimentConversion(experiment, goal, value = 1) {
        const variant = this.session.experiments[experiment];
        if (variant) {
            this.track(this.metricCategories.experiment, 'experiment_conversion', {
                experiment: experiment,
                variant: variant,
                goal: goal,
                value: value,
                sessionId: this.session.id,
                userId: this.session.userId,
                timestamp: new Date()
            });
        }
    }
    
    /**
     * Méthode principale de tracking
     */
    track(category, event, data = {}) {
        const metric = {
            id: this.generateMetricId(),
            category: category,
            event: event,
            data: data,
            timestamp: new Date(),
            sessionId: this.session.id,
            userId: this.session.userId,
            url: window.location.href
        };
        
        // Ajouter à la queue
        this.queue.push(metric);
        
        // Flush immédiat pour les erreurs critiques
        if (category === this.metricCategories.error || this.queue.length >= this.config.batchSize) {
            this.flush();
        }
        
        // Envoyer à l'AnalyticsEngine si disponible
        if (this.analytics) {
            this.analytics.track(event, data, this.session.userId);
        }
    }
    
    /**
     * Configuration du flush automatique
     */
    setupAutoFlush() {
        setInterval(() => {
            if (this.queue.length > 0) {
                this.flush();
            }
        }, this.config.flushInterval);
        
        // Flush avant la fermeture de la page
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
        
        // Flush sur changement de visibilité
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flush();
            }
        });
    }
    
    /**
     * Flush des métriques en queue
     */
    flush() {
        if (this.queue.length === 0) return;
        
        const metrics = [...this.queue];
        this.queue = [];
        
        console.log(`📤 Flush de ${metrics.length} métriques`);
        
        // Envoyer les métriques (simulation)
        this.sendMetrics(metrics);
    }
    
    /**
     * Envoi des métriques au serveur
     */
    async sendMetrics(metrics) {
        try {
            // En production, on enverrait les métriques à un endpoint
            console.log('📊 Métriques envoyées :', metrics.length);
            
            // Simulation d'envoi
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Stocker localement pour la démo
            this.storeMetricsLocally(metrics);
            
        } catch (error) {
            console.error('Erreur envoi métriques :', error);
            
            // Remettre en queue en cas d'erreur
            this.queue.unshift(...metrics);
        }
    }
    
    /**
     * Stockage local des métriques
     */
    storeMetricsLocally(metrics) {
        try {
            const stored = JSON.parse(localStorage.getItem('formease-metrics') || '[]');
            stored.push(...metrics);
            
            // Garder seulement les 1000 dernières métriques
            const limited = stored.slice(-1000);
            localStorage.setItem('formease-metrics', JSON.stringify(limited));
            
        } catch (error) {
            console.error('Erreur stockage métriques :', error);
        }
    }
    
    /**
     * Vérification d'échantillonnage
     */
    shouldSample(category) {
        const rate = this.config.sampling[category] || 1.0;
        return Math.random() < rate;
    }
    
    /**
     * API publique pour les métriques business
     */
    trackFormCreated(formData) {
        this.track(this.metricCategories.business, this.businessKPIs.formCreated, formData);
    }
    
    trackFormSubmitted(formData) {
        this.track(this.metricCategories.business, this.businessKPIs.formSubmitted, formData);
    }
    
    trackUserRegistered(userData) {
        this.track(this.metricCategories.business, this.businessKPIs.userRegistered, userData);
    }
    
    trackPremiumUpgrade(upgradeData) {
        this.track(this.metricCategories.business, this.businessKPIs.premiumUpgrade, upgradeData);
    }
    
    trackIntegrationConnected(integrationData) {
        this.track(this.metricCategories.business, this.businessKPIs.integrationConnected, integrationData);
    }
    
    trackWorkflowExecuted(workflowData) {
        this.track(this.metricCategories.business, this.businessKPIs.workflowExecuted, workflowData);
    }
    
    trackAIGenerated(aiData) {
        this.track(this.metricCategories.business, this.businessKPIs.aiGenerated, aiData);
    }
    
    trackReportGenerated(reportData) {
        this.track(this.metricCategories.business, this.businessKPIs.reportGenerated, reportData);
    }
    
    /**
     * Métriques de satisfaction utilisateur
     */
    trackSatisfactionRating(rating, context = {}) {
        this.track(this.metricCategories.user, 'satisfaction_rating', {
            rating: rating,
            scale: 5,
            context: context,
            timestamp: new Date()
        });
    }
    
    trackFeatureFeedback(feature, feedback) {
        this.track(this.metricCategories.user, 'feature_feedback', {
            feature: feature,
            feedback: feedback,
            timestamp: new Date()
        });
    }
    
    /**
     * Métriques personnalisées
     */
    trackCustomMetric(name, value, metadata = {}) {
        this.track(this.metricCategories.business, 'custom_metric', {
            name: name,
            value: value,
            metadata: metadata,
            timestamp: new Date()
        });
    }
    
    /**
     * Timing personnalisé
     */
    startTiming(name) {
        this.timings = this.timings || {};
        this.timings[name] = performance.now();
    }
    
    endTiming(name, metadata = {}) {
        if (this.timings && this.timings[name]) {
            const duration = performance.now() - this.timings[name];
            delete this.timings[name];
            
            this.track(this.metricCategories.performance, 'custom_timing', {
                name: name,
                duration: duration,
                metadata: metadata,
                timestamp: new Date()
            });
            
            return duration;
        }
        return null;
    }
    
    /**
     * Fonctions utilitaires
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateMetricId() {
        return 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    getUserId() {
        return localStorage.getItem('formease-user-id') || 
               sessionStorage.getItem('formease-user-id') || 
               'anonymous_' + Math.random().toString(36).substr(2, 9);
    }
    
    getDeviceInfo() {
        return {
            type: this.getDeviceType(),
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            pixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'unknown',
            touchSupport: 'ontouchstart' in window,
            platform: navigator.platform
        };
    }
    
    getBrowserInfo() {
        const ua = navigator.userAgent;
        return {
            userAgent: ua,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            onLine: navigator.onLine,
            vendor: navigator.vendor,
            hardwareConcurrency: navigator.hardwareConcurrency,
            memory: navigator.deviceMemory,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }
    
    getDeviceType() {
        const width = window.innerWidth;
        if (width <= 480) return 'mobile';
        if (width <= 768) return 'tablet';
        return 'desktop';
    }
    
    getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source'),
            medium: params.get('utm_medium'),
            campaign: params.get('utm_campaign'),
            content: params.get('utm_content'),
            term: params.get('utm_term')
        };
    }
    
    getScrollPercentage() {
        const scrollTop = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        return documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    }
    
    /**
     * Méthodes de configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Configuration MetricsCollector mise à jour');
    }
    
    enableCategory(category) {
        this.config[category] = true;
    }
    
    disableCategory(category) {
        this.config[category] = false;
    }
    
    setSamplingRate(category, rate) {
        this.config.sampling[category] = Math.max(0, Math.min(1, rate));
    }
    
    /**
     * Méthodes de diagnostic
     */
    getSessionInfo() {
        return { ...this.session };
    }
    
    getQueueStatus() {
        return {
            queueLength: this.queue.length,
            lastFlush: this.lastFlush,
            totalMetrics: this.totalMetrics || 0
        };
    }
    
    getStoredMetrics() {
        try {
            return JSON.parse(localStorage.getItem('formease-metrics') || '[]');
        } catch {
            return [];
        }
    }
    
    clearStoredMetrics() {
        localStorage.removeItem('formease-metrics');
        console.log('🗑️ Métriques stockées supprimées');
    }
    
    /**
     * Nettoyage
     */
    destroy() {
        this.flush();
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        console.log('🔄 MetricsCollector nettoyé');
    }
}

// Export pour compatibilité navigateur
window.MetricsCollector = MetricsCollector;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.metricsCollector && window.analyticsEngine) {
        window.metricsCollector = new MetricsCollector(window.analyticsEngine);
        console.log('📈 MetricsCollector initialisé globalement');
    }
});
