/**
 * 📊 AnalyticsEngine.js - FormEase Sprint 3 Phase 4
 * 
 * Moteur d'analytics et de reporting avancé
 * Collecte, traite et analyse toutes les données de FormEase
 * 
 * Fonctionnalités :
 * - Collecte de données en temps réel
 * - Agrégation et calcul de métriques
 * - Analyse prédictive avec IA
 * - Détection d'anomalies
 * - Segmentation utilisateurs avancée
 * - KPIs business et techniques
 * - Export de données et rapports
 * 
 * @version 3.0.0
 * @author FormEase Team
 * @since Sprint 3 Phase 4
 */

class AnalyticsEngine {
    constructor() {
        this.dataPoints = new Map();
        this.metrics = new Map();
        this.segments = new Map();
        this.events = [];
        this.aggregations = new Map();
        
        this.config = {
            realTimeCollection: true,
            batchSize: 1000,
            retentionDays: 90,
            anomalyDetection: true,
            predictiveAnalysis: true,
            maxEventsInMemory: 10000,
            aggregationInterval: 60000 // 1 minute
        };
        
        this.eventTypes = {
            form_created: 'form_created',
            form_submitted: 'form_submitted',
            form_viewed: 'form_viewed',
            user_registered: 'user_registered',
            user_login: 'user_login',
            integration_sync: 'integration_sync',
            workflow_executed: 'workflow_executed',
            ai_generation: 'ai_generation',
            error_occurred: 'error_occurred',
            performance_metric: 'performance_metric'
        };
        
        this.metricTypes = {
            counter: 'counter',
            gauge: 'gauge',
            histogram: 'histogram',
            distribution: 'distribution',
            rate: 'rate'
        };
        
        this.kpis = {
            // Métriques Business
            totalForms: { type: 'counter', value: 0, target: 1000 },
            totalSubmissions: { type: 'counter', value: 0, target: 5000 },
            conversionRate: { type: 'gauge', value: 0, target: 85 },
            averageCompletionTime: { type: 'gauge', value: 0, target: 120 },
            userRetention: { type: 'gauge', value: 0, target: 70 },
            
            // Métriques Techniques
            systemUptime: { type: 'gauge', value: 0, target: 99.9 },
            averageResponseTime: { type: 'gauge', value: 0, target: 200 },
            errorRate: { type: 'gauge', value: 0, target: 1 },
            apiCallsPerMinute: { type: 'rate', value: 0, target: 100 },
            
            // Métriques IA
            aiGenerationsPerDay: { type: 'counter', value: 0, target: 100 },
            aiAccuracyRate: { type: 'gauge', value: 0, target: 90 },
            
            // Métriques Intégrations
            activeIntegrations: { type: 'gauge', value: 0, target: 10 },
            syncSuccessRate: { type: 'gauge', value: 0, target: 95 },
            
            // Métriques Workflows
            workflowExecutions: { type: 'counter', value: 0, target: 500 },
            workflowSuccessRate: { type: 'gauge', value: 0, target: 98 }
        };
        
        this.anomalyDetectors = new Map();
        this.predictions = new Map();
        this.alerts = [];
        
        this.init();
    }
    
    /**
     * Initialisation du moteur d'analytics
     */
    init() {
        this.setupMetrics();
        this.setupSegments();
        this.setupAnomalyDetectors();
        this.startDataCollection();
        this.startAggregation();
        this.loadHistoricalData();
        console.log('📊 AnalyticsEngine v3.0 initialisé');
    }
    
    /**
     * Configuration des métriques prédéfinies
     */
    setupMetrics() {
        // Métrique : Utilisation des formulaires
        this.metrics.set('form_usage', {
            id: 'form_usage',
            name: 'Utilisation des Formulaires',
            type: this.metricTypes.counter,
            description: 'Nombre total d\'utilisations de formulaires',
            dimensions: ['form_id', 'user_id', 'date', 'source'],
            aggregations: ['sum', 'count', 'avg'],
            value: 0,
            history: [],
            lastUpdated: new Date()
        });
        
        // Métrique : Performance des formulaires
        this.metrics.set('form_performance', {
            id: 'form_performance',
            name: 'Performance des Formulaires',
            type: this.metricTypes.histogram,
            description: 'Temps de chargement et de soumission',
            dimensions: ['form_id', 'browser', 'device_type'],
            aggregations: ['avg', 'p50', 'p95', 'p99'],
            buckets: [100, 250, 500, 1000, 2000, 5000],
            values: [],
            lastUpdated: new Date()
        });
        
        // Métrique : Conversion par étapes
        this.metrics.set('funnel_conversion', {
            id: 'funnel_conversion',
            name: 'Conversion par Étapes',
            type: this.metricTypes.distribution,
            description: 'Taux de conversion à chaque étape',
            dimensions: ['form_id', 'step', 'source'],
            steps: ['view', 'start', 'complete', 'submit'],
            values: { view: 0, start: 0, complete: 0, submit: 0 },
            lastUpdated: new Date()
        });
        
        // Métrique : Satisfaction utilisateur
        this.metrics.set('user_satisfaction', {
            id: 'user_satisfaction',
            name: 'Satisfaction Utilisateur',
            type: this.metricTypes.gauge,
            description: 'Score de satisfaction moyen',
            dimensions: ['form_id', 'user_segment', 'date'],
            scale: { min: 1, max: 5 },
            value: 0,
            reviews: [],
            lastUpdated: new Date()
        });
        
        // Métrique : Intégrations actives
        this.metrics.set('integration_health', {
            id: 'integration_health',
            name: 'Santé des Intégrations',
            type: this.metricTypes.gauge,
            description: 'Statut de santé des intégrations',
            dimensions: ['integration_type', 'status'],
            statuses: { active: 0, error: 0, warning: 0 },
            lastUpdated: new Date()
        });
        
        console.log('📈 Métriques configurées :', this.metrics.size);
    }
    
    /**
     * Configuration des segments utilisateurs
     */
    setupSegments() {
        // Segment : Nouveaux utilisateurs
        this.segments.set('new_users', {
            id: 'new_users',
            name: 'Nouveaux Utilisateurs',
            description: 'Utilisateurs inscrits dans les 30 derniers jours',
            criteria: {
                registration_date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            users: [],
            lastUpdated: new Date()
        });
        
        // Segment : Utilisateurs actifs
        this.segments.set('active_users', {
            id: 'active_users',
            name: 'Utilisateurs Actifs',
            description: 'Utilisateurs ayant une activité dans les 7 derniers jours',
            criteria: {
                last_activity: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            users: [],
            lastUpdated: new Date()
        });
        
        // Segment : Power users
        this.segments.set('power_users', {
            id: 'power_users',
            name: 'Power Users',
            description: 'Utilisateurs avec plus de 10 formulaires créés',
            criteria: {
                forms_created: { gte: 10 }
            },
            users: [],
            lastUpdated: new Date()
        });
        
        // Segment : Utilisateurs premium
        this.segments.set('premium_users', {
            id: 'premium_users',
            name: 'Utilisateurs Premium',
            description: 'Utilisateurs avec abonnement premium',
            criteria: {
                subscription_type: 'premium'
            },
            users: [],
            lastUpdated: new Date()
        });
        
        console.log('👥 Segments configurés :', this.segments.size);
    }
    
    /**
     * Configuration des détecteurs d'anomalies
     */
    setupAnomalyDetectors() {
        // Détecteur : Pic de trafic
        this.anomalyDetectors.set('traffic_spike', {
            id: 'traffic_spike',
            name: 'Pic de Trafic',
            description: 'Détecte les pics anormaux de trafic',
            metric: 'page_views',
            threshold: 3, // 3x la moyenne
            windowSize: 3600000, // 1 heure
            sensitivity: 0.8,
            enabled: true,
            lastCheck: new Date()
        });
        
        // Détecteur : Taux d'erreur élevé
        this.anomalyDetectors.set('error_rate_high', {
            id: 'error_rate_high',
            name: 'Taux d\'Erreur Élevé',
            description: 'Détecte un taux d\'erreur anormalement élevé',
            metric: 'error_rate',
            threshold: 5, // 5% d'erreurs
            windowSize: 1800000, // 30 minutes
            sensitivity: 0.9,
            enabled: true,
            lastCheck: new Date()
        });
        
        // Détecteur : Chute de conversion
        this.anomalyDetectors.set('conversion_drop', {
            id: 'conversion_drop',
            name: 'Chute de Conversion',
            description: 'Détecte une baisse significative du taux de conversion',
            metric: 'conversion_rate',
            threshold: 0.5, // 50% de baisse
            windowSize: 7200000, // 2 heures
            sensitivity: 0.7,
            enabled: true,
            lastCheck: new Date()
        });
        
        console.log('🚨 Détecteurs d\'anomalies configurés :', this.anomalyDetectors.size);
    }
    
    /**
     * Enregistrement d'un événement
     */
    track(eventType, data = {}, userId = null) {
        const event = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: eventType,
            timestamp: new Date(),
            userId: userId,
            sessionId: this.getSessionId(),
            data: { ...data },
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };
        
        // Ajouter à la liste des événements
        this.events.push(event);
        
        // Nettoyer les anciens événements si nécessaire
        if (this.events.length > this.config.maxEventsInMemory) {
            this.events = this.events.slice(-this.config.maxEventsInMemory);
        }
        
        // Traitement en temps réel
        if (this.config.realTimeCollection) {
            this.processEventRealTime(event);
        }
        
        console.log(`📊 Événement tracké : ${eventType}`, data);
        return event;
    }
    
    /**
     * Traitement d'événement en temps réel
     */
    processEventRealTime(event) {
        // Mise à jour des métriques
        this.updateMetricsFromEvent(event);
        
        // Mise à jour des KPIs
        this.updateKPIsFromEvent(event);
        
        // Détection d'anomalies
        if (this.config.anomalyDetection) {
            this.checkAnomalies(event);
        }
        
        // Mise à jour des segments
        this.updateSegments(event);
    }
    
    /**
     * Mise à jour des métriques depuis un événement
     */
    updateMetricsFromEvent(event) {
        switch (event.type) {
            case this.eventTypes.form_submitted:
                this.incrementMetric('form_usage', 1, {
                    form_id: event.data.form_id,
                    user_id: event.userId
                });
                
                this.updateFunnelConversion('submit', event.data.form_id);
                break;
                
            case this.eventTypes.form_viewed:
                this.updateFunnelConversion('view', event.data.form_id);
                break;
                
            case this.eventTypes.performance_metric:
                this.recordPerformance('form_performance', event.data.responseTime, {
                    form_id: event.data.form_id,
                    browser: this.getBrowser(),
                    device_type: this.getDeviceType()
                });
                break;
                
            case this.eventTypes.integration_sync:
                this.updateIntegrationHealth(event.data.integration_id, event.data.status);
                break;
        }
    }
    
    /**
     * Mise à jour des KPIs depuis un événement
     */
    updateKPIsFromEvent(event) {
        switch (event.type) {
            case this.eventTypes.form_created:
                this.kpis.totalForms.value++;
                break;
                
            case this.eventTypes.form_submitted:
                this.kpis.totalSubmissions.value++;
                this.calculateConversionRate();
                break;
                
            case this.eventTypes.user_registered:
                this.updateUserRetention();
                break;
                
            case this.eventTypes.ai_generation:
                this.kpis.aiGenerationsPerDay.value++;
                break;
                
            case this.eventTypes.workflow_executed:
                this.kpis.workflowExecutions.value++;
                break;
                
            case this.eventTypes.error_occurred:
                this.calculateErrorRate();
                break;
        }
    }
    
    /**
     * Incrémentation d'une métrique
     */
    incrementMetric(metricId, value, dimensions = {}) {
        const metric = this.metrics.get(metricId);
        if (!metric) return;
        
        if (metric.type === this.metricTypes.counter) {
            metric.value += value;
        }
        
        // Ajouter aux données historiques
        metric.history.push({
            timestamp: new Date(),
            value: value,
            dimensions: dimensions
        });
        
        metric.lastUpdated = new Date();
    }
    
    /**
     * Enregistrement d'une performance
     */
    recordPerformance(metricId, value, dimensions = {}) {
        const metric = this.metrics.get(metricId);
        if (!metric || metric.type !== this.metricTypes.histogram) return;
        
        metric.values.push({
            timestamp: new Date(),
            value: value,
            dimensions: dimensions
        });
        
        metric.lastUpdated = new Date();
    }
    
    /**
     * Mise à jour de la conversion par étapes
     */
    updateFunnelConversion(step, formId) {
        const metric = this.metrics.get('funnel_conversion');
        if (!metric) return;
        
        metric.values[step]++;
        metric.lastUpdated = new Date();
        
        // Calculer les taux de conversion
        this.calculateFunnelRates(formId);
    }
    
    /**
     * Calcul des taux de conversion
     */
    calculateFunnelRates(formId) {
        const metric = this.metrics.get('funnel_conversion');
        if (!metric) return;
        
        const values = metric.values;
        const rates = {
            startRate: values.view > 0 ? (values.start / values.view) * 100 : 0,
            completeRate: values.start > 0 ? (values.complete / values.start) * 100 : 0,
            submitRate: values.complete > 0 ? (values.submit / values.complete) * 100 : 0,
            overallRate: values.view > 0 ? (values.submit / values.view) * 100 : 0
        };
        
        metric.rates = rates;
        
        // Mettre à jour le KPI global
        this.kpis.conversionRate.value = rates.overallRate;
    }
    
    /**
     * Calcul du taux de conversion global
     */
    calculateConversionRate() {
        const views = this.getEventCount(this.eventTypes.form_viewed, '24h');
        const submissions = this.getEventCount(this.eventTypes.form_submitted, '24h');
        
        if (views > 0) {
            this.kpis.conversionRate.value = (submissions / views) * 100;
        }
    }
    
    /**
     * Calcul du taux d'erreur
     */
    calculateErrorRate() {
        const errors = this.getEventCount(this.eventTypes.error_occurred, '1h');
        const total = this.getEventCount('*', '1h');
        
        if (total > 0) {
            this.kpis.errorRate.value = (errors / total) * 100;
        }
    }
    
    /**
     * Mise à jour de la rétention utilisateur
     */
    updateUserRetention() {
        // Calcul simplifié de la rétention à 7 jours
        const newUsers = this.getEventCount(this.eventTypes.user_registered, '7d');
        const activeUsers = this.getUniqueUsers('7d');
        
        if (newUsers > 0) {
            this.kpis.userRetention.value = (activeUsers / newUsers) * 100;
        }
    }
    
    /**
     * Mise à jour de la santé des intégrations
     */
    updateIntegrationHealth(integrationId, status) {
        const metric = this.metrics.get('integration_health');
        if (!metric) return;
        
        metric.statuses[status] = (metric.statuses[status] || 0) + 1;
        metric.lastUpdated = new Date();
        
        // Mettre à jour les KPIs
        const total = Object.values(metric.statuses).reduce((sum, count) => sum + count, 0);
        if (total > 0) {
            this.kpis.syncSuccessRate.value = (metric.statuses.active / total) * 100;
        }
    }
    
    /**
     * Détection d'anomalies
     */
    checkAnomalies(event) {
        for (const detector of this.anomalyDetectors.values()) {
            if (!detector.enabled) continue;
            
            try {
                const isAnomaly = this.detectAnomaly(detector, event);
                if (isAnomaly) {
                    this.triggerAnomalyAlert(detector, event);
                }
            } catch (error) {
                console.error(`Erreur détection anomalie ${detector.id}:`, error);
            }
        }
    }
    
    /**
     * Détection d'anomalie spécifique
     */
    detectAnomaly(detector, event) {
        const windowStart = new Date(Date.now() - detector.windowSize);
        const recentEvents = this.events.filter(e => 
            e.timestamp >= windowStart && 
            e.type === detector.metric
        );
        
        if (recentEvents.length < 10) return false; // Pas assez de données
        
        const currentValue = this.calculateMetricValue(detector.metric, recentEvents);
        const historicalAverage = this.getHistoricalAverage(detector.metric, detector.windowSize);
        
        switch (detector.id) {
            case 'traffic_spike':
                return currentValue > historicalAverage * detector.threshold;
                
            case 'error_rate_high':
                return currentValue > detector.threshold;
                
            case 'conversion_drop':
                return currentValue < historicalAverage * detector.threshold;
                
            default:
                return false;
        }
    }
    
    /**
     * Déclenchement d'alerte d'anomalie
     */
    triggerAnomalyAlert(detector, event) {
        const alert = {
            id: 'alert_' + Date.now(),
            type: 'anomaly',
            detector: detector.id,
            severity: this.calculateSeverity(detector),
            message: `Anomalie détectée : ${detector.name}`,
            timestamp: new Date(),
            event: event,
            resolved: false
        };
        
        this.alerts.push(alert);
        
        console.warn(`🚨 Anomalie détectée :`, alert);
        
        // Déclencher les notifications si configurées
        this.notifyAnomaly(alert);
    }
    
    /**
     * Notification d'anomalie
     */
    notifyAnomaly(alert) {
        // Intégration avec le NotificationRouter si disponible
        if (window.notificationRouter) {
            window.notificationRouter.sendNotification({
                template: 'system-alert',
                priority: 'critical',
                recipients: ['admin@formease.com'],
                variables: {
                    alert: alert,
                    severity: alert.severity,
                    message: alert.message
                }
            });
        }
    }
    
    /**
     * Calcul de la sévérité
     */
    calculateSeverity(detector) {
        if (detector.sensitivity >= 0.9) return 'critical';
        if (detector.sensitivity >= 0.7) return 'high';
        if (detector.sensitivity >= 0.5) return 'medium';
        return 'low';
    }
    
    /**
     * Mise à jour des segments
     */
    updateSegments(event) {
        for (const segment of this.segments.values()) {
            if (this.userMatchesSegment(event.userId, segment)) {
                if (!segment.users.includes(event.userId)) {
                    segment.users.push(event.userId);
                    segment.lastUpdated = new Date();
                }
            }
        }
    }
    
    /**
     * Vérification si un utilisateur correspond à un segment
     */
    userMatchesSegment(userId, segment) {
        if (!userId) return false;
        
        // Simulation de vérification des critères
        // En production, on interrogerait la base de données
        
        switch (segment.id) {
            case 'new_users':
                return this.isNewUser(userId);
            case 'active_users':
                return this.isActiveUser(userId);
            case 'power_users':
                return this.isPowerUser(userId);
            case 'premium_users':
                return this.isPremiumUser(userId);
            default:
                return false;
        }
    }
    
    /**
     * Démarrage de la collecte de données
     */
    startDataCollection() {
        // Collecte automatique des métriques système
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000); // Toutes les 30 secondes
        
        // Collecte des métriques de performance
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000); // Toutes les minutes
        
        console.log('📡 Collecte de données démarrée');
    }
    
    /**
     * Collecte des métriques système
     */
    collectSystemMetrics() {
        // Uptime
        this.kpis.systemUptime.value = (performance.now() / 1000 / 60 / 60 / 24) % 1 * 100;
        
        // Mémoire utilisée
        if (performance.memory) {
            const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100;
            this.track('performance_metric', { metric: 'memory_usage', value: memoryUsage });
        }
        
        // Nombre d'utilisateurs connectés (simulation)
        const connectedUsers = Math.floor(Math.random() * 100) + 50;
        this.track('performance_metric', { metric: 'connected_users', value: connectedUsers });
    }
    
    /**
     * Collecte des métriques de performance
     */
    collectPerformanceMetrics() {
        // Performance de navigation
        if (performance.navigation) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.track('performance_metric', { metric: 'page_load_time', value: loadTime });
        }
        
        // Temps de réponse API moyen
        const apiResponseTime = this.calculateAverageAPIResponseTime();
        this.kpis.averageResponseTime.value = apiResponseTime;
        
        // Calls API par minute
        const apiCalls = this.getEventCount('api_call', '1m');
        this.kpis.apiCallsPerMinute.value = apiCalls;
    }
    
    /**
     * Démarrage de l'agrégation
     */
    startAggregation() {
        setInterval(() => {
            this.performAggregations();
        }, this.config.aggregationInterval);
        
        console.log('🔄 Agrégation des données démarrée');
    }
    
    /**
     * Exécution des agrégations
     */
    performAggregations() {
        for (const metric of this.metrics.values()) {
            this.aggregateMetric(metric);
        }
        
        this.aggregateKPIs();
        this.cleanupOldData();
    }
    
    /**
     * Agrégation d'une métrique
     */
    aggregateMetric(metric) {
        const now = new Date();
        const intervals = ['1h', '24h', '7d', '30d'];
        
        for (const interval of intervals) {
            const aggregation = this.calculateAggregation(metric, interval);
            
            if (!this.aggregations.has(metric.id)) {
                this.aggregations.set(metric.id, {});
            }
            
            this.aggregations.get(metric.id)[interval] = {
                ...aggregation,
                timestamp: now
            };
        }
    }
    
    /**
     * Calcul d'une agrégation
     */
    calculateAggregation(metric, interval) {
        const windowStart = this.getTimeWindow(interval);
        const data = metric.history.filter(h => h.timestamp >= windowStart);
        
        if (data.length === 0) {
            return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
        }
        
        const values = data.map(d => d.value);
        
        return {
            count: data.length,
            sum: values.reduce((sum, val) => sum + val, 0),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            p50: this.percentile(values, 50),
            p95: this.percentile(values, 95),
            p99: this.percentile(values, 99)
        };
    }
    
    /**
     * Calcul de percentile
     */
    percentile(values, percentile) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
    
    /**
     * Agrégation des KPIs
     */
    aggregateKPIs() {
        // Calculs dérivés et prédictions
        this.calculateDerivedKPIs();
        this.generatePredictions();
    }
    
    /**
     * Calcul des KPIs dérivés
     */
    calculateDerivedKPIs() {
        // Taux de croissance
        const submissionsGrowth = this.calculateGrowthRate('totalSubmissions', '7d');
        this.kpis.submissionsGrowthRate = {
            type: 'gauge',
            value: submissionsGrowth,
            target: 10
        };
        
        // Score de santé global
        const healthScore = this.calculateOverallHealthScore();
        this.kpis.overallHealthScore = {
            type: 'gauge',
            value: healthScore,
            target: 85
        };
    }
    
    /**
     * Calcul du taux de croissance
     */
    calculateGrowthRate(kpiName, period) {
        const current = this.kpis[kpiName]?.value || 0;
        const previous = this.getHistoricalKPI(kpiName, period) || 0;
        
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }
    
    /**
     * Calcul du score de santé global
     */
    calculateOverallHealthScore() {
        const kpiScores = [];
        
        for (const [name, kpi] of Object.entries(this.kpis)) {
            if (kpi.target && kpi.value !== undefined) {
                const score = Math.min((kpi.value / kpi.target) * 100, 100);
                kpiScores.push(score);
            }
        }
        
        return kpiScores.length > 0 ? 
            kpiScores.reduce((sum, score) => sum + score, 0) / kpiScores.length : 0;
    }
    
    /**
     * Génération de prédictions
     */
    generatePredictions() {
        if (!this.config.predictiveAnalysis) return;
        
        // Prédiction de croissance des soumissions
        const submissionsPrediction = this.predictGrowth('totalSubmissions', 30);
        this.predictions.set('submissions_30d', submissionsPrediction);
        
        // Prédiction de charge système
        const systemLoadPrediction = this.predictSystemLoad(7);
        this.predictions.set('system_load_7d', systemLoadPrediction);
    }
    
    /**
     * Prédiction de croissance
     */
    predictGrowth(metricName, days) {
        const current = this.kpis[metricName]?.value || 0;
        const growthRate = this.calculateGrowthRate(metricName, '7d');
        const dailyGrowth = growthRate / 7;
        
        const prediction = current * Math.pow(1 + dailyGrowth / 100, days);
        
        return {
            current: current,
            predicted: Math.round(prediction),
            confidence: this.calculatePredictionConfidence(metricName),
            horizon: days,
            generatedAt: new Date()
        };
    }
    
    /**
     * Prédiction de charge système
     */
    predictSystemLoad(days) {
        const currentLoad = this.getCurrentSystemLoad();
        const trend = this.getSystemLoadTrend();
        
        return {
            current: currentLoad,
            predicted: Math.min(currentLoad + (trend * days), 100),
            confidence: 0.7,
            horizon: days,
            generatedAt: new Date()
        };
    }
    
    /**
     * Calcul de la confiance de prédiction
     */
    calculatePredictionConfidence(metricName) {
        // Basé sur la variance historique
        const variance = this.getMetricVariance(metricName, '30d');
        
        if (variance < 0.1) return 0.9;
        if (variance < 0.3) return 0.7;
        if (variance < 0.5) return 0.5;
        return 0.3;
    }
    
    /**
     * Nettoyage des anciennes données
     */
    cleanupOldData() {
        const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
        
        // Nettoyer les événements
        this.events = this.events.filter(event => event.timestamp >= cutoffDate);
        
        // Nettoyer l'historique des métriques
        for (const metric of this.metrics.values()) {
            metric.history = metric.history.filter(h => h.timestamp >= cutoffDate);
        }
        
        // Nettoyer les alertes résolues
        this.alerts = this.alerts.filter(alert => 
            !alert.resolved || alert.timestamp >= cutoffDate
        );
    }
    
    /**
     * Chargement des données historiques
     */
    loadHistoricalData() {
        try {
            const saved = localStorage.getItem('formease-analytics-data');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Restaurer les KPIs
                if (data.kpis) {
                    Object.assign(this.kpis, data.kpis);
                }
                
                // Restaurer les événements récents
                if (data.events) {
                    this.events = data.events.map(e => ({
                        ...e,
                        timestamp: new Date(e.timestamp)
                    }));
                }
                
                console.log('💾 Données historiques chargées');
            }
        } catch (error) {
            console.error('Erreur chargement données analytics :', error);
        }
    }
    
    /**
     * Sauvegarde des données
     */
    saveAnalyticsData() {
        try {
            const dataToSave = {
                kpis: this.kpis,
                events: this.events.slice(-1000), // Garder seulement les 1000 derniers
                timestamp: new Date()
            };
            
            localStorage.setItem('formease-analytics-data', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Erreur sauvegarde données analytics :', error);
        }
    }
    
    /**
     * Obtention des métriques filtrées
     */
    getMetrics(filters = {}) {
        const result = {};
        
        for (const [id, metric] of this.metrics.entries()) {
            if (filters.types && !filters.types.includes(metric.type)) continue;
            if (filters.period) {
                result[id] = this.getMetricForPeriod(metric, filters.period);
            } else {
                result[id] = metric;
            }
        }
        
        return result;
    }
    
    /**
     * Obtention des KPIs
     */
    getKPIs() {
        return { ...this.kpis };
    }
    
    /**
     * Obtention des segments
     */
    getSegments() {
        return Array.from(this.segments.values());
    }
    
    /**
     * Obtention des alertes
     */
    getAlerts(onlyActive = true) {
        return this.alerts.filter(alert => !onlyActive || !alert.resolved);
    }
    
    /**
     * Obtention des prédictions
     */
    getPredictions() {
        return Object.fromEntries(this.predictions);
    }
    
    /**
     * Export des données
     */
    exportData(format = 'json', period = '30d') {
        const data = {
            period: period,
            generated: new Date(),
            kpis: this.getKPIs(),
            metrics: this.getMetrics({ period }),
            segments: this.getSegments(),
            alerts: this.getAlerts(false),
            predictions: this.getPredictions()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }
    
    /**
     * Fonctions utilitaires
     */
    getSessionId() {
        return sessionStorage.getItem('formease-session-id') || 'anonymous';
    }
    
    getClientIP() {
        return '127.0.0.1'; // Simulation
    }
    
    getBrowser() {
        return navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other';
    }
    
    getDeviceType() {
        return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    
    getEventCount(eventType, period) {
        const windowStart = this.getTimeWindow(period);
        return this.events.filter(e => 
            (eventType === '*' || e.type === eventType) && 
            e.timestamp >= windowStart
        ).length;
    }
    
    getUniqueUsers(period) {
        const windowStart = this.getTimeWindow(period);
        const users = new Set();
        
        this.events
            .filter(e => e.timestamp >= windowStart && e.userId)
            .forEach(e => users.add(e.userId));
        
        return users.size;
    }
    
    getTimeWindow(period) {
        const now = Date.now();
        
        switch (period) {
            case '1m': return new Date(now - 60 * 1000);
            case '1h': return new Date(now - 60 * 60 * 1000);
            case '24h': return new Date(now - 24 * 60 * 60 * 1000);
            case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
            case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
            default: return new Date(now - 24 * 60 * 60 * 1000);
        }
    }
    
    // Méthodes de simulation pour la démo
    isNewUser(userId) { return Math.random() < 0.3; }
    isActiveUser(userId) { return Math.random() < 0.6; }
    isPowerUser(userId) { return Math.random() < 0.1; }
    isPremiumUser(userId) { return Math.random() < 0.2; }
    
    calculateMetricValue(metric, events) { return events.length; }
    getHistoricalAverage(metric, window) { return 50; }
    getCurrentSystemLoad() { return Math.random() * 80; }
    getSystemLoadTrend() { return (Math.random() - 0.5) * 10; }
    getMetricVariance(metric, period) { return Math.random() * 0.5; }
    getHistoricalKPI(kpi, period) { return this.kpis[kpi]?.value * 0.9; }
    calculateAverageAPIResponseTime() { return 150 + Math.random() * 100; }
    
    convertToCSV(data) {
        // Conversion simplifiée en CSV
        const rows = ['Metric,Value,Target,Status'];
        
        for (const [name, kpi] of Object.entries(data.kpis)) {
            const status = kpi.value >= (kpi.target || 0) ? 'OK' : 'Warning';
            rows.push(`${name},${kpi.value},${kpi.target || 'N/A'},${status}`);
        }
        
        return rows.join('\n');
    }
}

// Export pour compatibilité navigateur
window.AnalyticsEngine = AnalyticsEngine;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.analyticsEngine) {
        window.analyticsEngine = new AnalyticsEngine();
        console.log('📊 AnalyticsEngine initialisé globalement');
        
        // Sauvegarde automatique toutes les 5 minutes
        setInterval(() => {
            window.analyticsEngine.saveAnalyticsData();
        }, 300000);
    }
});
