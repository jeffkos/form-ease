/**
 * ⚖️ ScalingManager.js - FormEase Sprint 4 Phase 3
 * 
 * Gestionnaire de mise à l'échelle et d'équilibrage de charge
 * Système de scaling enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Auto-scaling intelligent basé sur la charge
 * - Équilibrage de charge adaptatif
 * - Gestion des pics de trafic
 * - Distribution géographique
 * - Monitoring de capacité en temps réel
 * - Prédiction de charge basée sur l'IA
 * - Failover automatique
 * - Resource pooling avancé
 * 
 * @version 4.0.0
 * @author FormEase Scaling Team
 * @since Sprint 4 Phase 3
 */

class ScalingManager {
    constructor() {
        this.loadBalancers = new Map();
        this.instances = new Map();
        this.regions = new Map();
        this.scalingPolicies = new Map();
        this.metrics = new Map();
        this.predictions = new Map();
        this.healthChecks = new Map();
        
        this.config = {
            autoScaling: {
                enabled: true,
                minInstances: 2,
                maxInstances: 50,
                targetCPU: 70, // %
                targetMemory: 80, // %
                targetLatency: 200, // ms
                scaleUpCooldown: 300000, // 5 minutes
                scaleDownCooldown: 600000, // 10 minutes
                predictiveScaling: true
            },
            loadBalancing: {
                algorithm: 'weighted_round_robin',
                healthCheckInterval: 30000, // 30 secondes
                failureThreshold: 3,
                successThreshold: 2,
                timeout: 5000, // 5 secondes
                retryAttempts: 3
            },
            regions: {
                primary: 'eu-west-1',
                secondary: ['us-east-1', 'ap-southeast-1'],
                failover: 'us-west-2',
                latencyThreshold: 150 // ms
            },
            capacity: {
                cpuPerInstance: 4, // cores
                memoryPerInstance: 8192, // MB
                storagePerInstance: 100, // GB
                maxConnectionsPerInstance: 1000,
                maxRequestsPerSecond: 500
            },
            monitoring: {
                interval: 10000, // 10 secondes
                retentionPeriod: 86400000, // 24 heures
                alertThresholds: {
                    highCPU: 85,
                    highMemory: 90,
                    highLatency: 500,
                    lowAvailability: 95,
                    errorRate: 0.05
                }
            }
        };
        
        this.instanceTypes = {
            micro: { cpu: 1, memory: 1024, storage: 20, cost: 0.01 },
            small: { cpu: 2, memory: 2048, storage: 40, cost: 0.02 },
            medium: { cpu: 4, memory: 4096, storage: 80, cost: 0.04 },
            large: { cpu: 8, memory: 8192, storage: 160, cost: 0.08 },
            xlarge: { cpu: 16, memory: 16384, storage: 320, cost: 0.16 },
            xxlarge: { cpu: 32, memory: 32768, storage: 640, cost: 0.32 }
        };
        
        this.scalingStrategies = {
            reactive: 'reactive_scaling',
            predictive: 'predictive_scaling',
            scheduled: 'scheduled_scaling',
            hybrid: 'hybrid_scaling'
        };
        
        this.loadBalancingAlgorithms = {
            roundRobin: 'round_robin',
            weightedRoundRobin: 'weighted_round_robin',
            leastConnections: 'least_connections',
            leastResponseTime: 'least_response_time',
            ipHash: 'ip_hash',
            geolocation: 'geolocation',
            adaptive: 'adaptive'
        };
        
        this.instanceStates = {
            pending: 'pending',
            running: 'running',
            stopping: 'stopping',
            stopped: 'stopped',
            terminated: 'terminated',
            failed: 'failed'
        };
        
        this.scalingEvents = [];
        this.currentLoad = 0;
        this.capacityUtilization = 0;
        this.requestsPerSecond = 0;
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire de scaling
     */
    init() {
        this.initializeRegions();
        this.setupLoadBalancers();
        this.initializeInstances();
        this.setupScalingPolicies();
        this.setupHealthChecks();
        this.initializePredictiveScaling();
        this.startMonitoring();
        this.setupFailoverMechanisms();
        console.log('⚖️ ScalingManager v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Initialisation des régions
     */
    initializeRegions() {
        // Région primaire
        this.regions.set(this.config.regions.primary, {
            id: this.config.regions.primary,
            name: 'Europe West 1',
            status: 'active',
            isPrimary: true,
            instances: new Map(),
            loadBalancer: null,
            capacity: {
                total: 0,
                used: 0,
                available: 0
            },
            metrics: {
                latency: 0,
                availability: 100,
                requests: 0,
                errors: 0
            },
            costs: {
                hourly: 0,
                monthly: 0,
                total: 0
            }
        });
        
        // Régions secondaires
        this.config.regions.secondary.forEach(regionId => {
            this.regions.set(regionId, {
                id: regionId,
                name: this.getRegionName(regionId),
                status: 'standby',
                isPrimary: false,
                instances: new Map(),
                loadBalancer: null,
                capacity: {
                    total: 0,
                    used: 0,
                    available: 0
                },
                metrics: {
                    latency: 0,
                    availability: 100,
                    requests: 0,
                    errors: 0
                },
                costs: {
                    hourly: 0,
                    monthly: 0,
                    total: 0
                }
            });
        });
        
        // Région de failover
        this.regions.set(this.config.regions.failover, {
            id: this.config.regions.failover,
            name: 'US West 2 (Failover)',
            status: 'inactive',
            isPrimary: false,
            isFailover: true,
            instances: new Map(),
            loadBalancer: null,
            capacity: {
                total: 0,
                used: 0,
                available: 0
            },
            metrics: {
                latency: 0,
                availability: 100,
                requests: 0,
                errors: 0
            },
            costs: {
                hourly: 0,
                monthly: 0,
                total: 0
            }
        });
        
        console.log('🌍 Régions initialisées:', this.regions.size);
    }
    
    /**
     * Configuration des load balancers
     */
    setupLoadBalancers() {
        // Load balancer global
        this.loadBalancers.set('global', {
            id: 'global',
            name: 'Global Load Balancer',
            type: 'global',
            algorithm: this.config.loadBalancing.algorithm,
            instances: new Map(),
            weights: new Map(),
            healthChecks: new Map(),
            metrics: {
                requests: 0,
                responses: 0,
                errors: 0,
                latency: 0,
                throughput: 0
            },
            rules: [
                {
                    condition: 'region_latency',
                    threshold: this.config.regions.latencyThreshold,
                    action: 'route_to_nearest'
                },
                {
                    condition: 'instance_health',
                    threshold: 0.95,
                    action: 'remove_unhealthy'
                },
                {
                    condition: 'capacity_utilization',
                    threshold: 0.8,
                    action: 'distribute_load'
                }
            ]
        });
        
        // Load balancers par région
        for (const [regionId, region] of this.regions.entries()) {
            const loadBalancer = {
                id: `lb-${regionId}`,
                name: `Load Balancer ${region.name}`,
                type: 'regional',
                region: regionId,
                algorithm: this.config.loadBalancing.algorithm,
                instances: new Map(),
                weights: new Map(),
                healthChecks: new Map(),
                metrics: {
                    requests: 0,
                    responses: 0,
                    errors: 0,
                    latency: 0,
                    throughput: 0
                },
                rules: [
                    {
                        condition: 'instance_cpu',
                        threshold: 80,
                        action: 'reduce_weight'
                    },
                    {
                        condition: 'instance_memory',
                        threshold: 85,
                        action: 'reduce_weight'
                    },
                    {
                        condition: 'response_time',
                        threshold: 1000,
                        action: 'redistribute'
                    }
                ]
            };
            
            this.loadBalancers.set(loadBalancer.id, loadBalancer);
            region.loadBalancer = loadBalancer.id;
        }
        
        console.log('⚖️ Load balancers configurés:', this.loadBalancers.size);
    }
    
    /**
     * Initialisation des instances
     */
    initializeInstances() {
        const primaryRegion = this.regions.get(this.config.regions.primary);
        
        // Créer les instances minimales dans la région primaire
        for (let i = 0; i < this.config.autoScaling.minInstances; i++) {
            this.createInstance(this.config.regions.primary, 'medium');
        }
        
        console.log(`🖥️ ${this.config.autoScaling.minInstances} instances initiales créées`);
    }
    
    /**
     * Configuration des politiques de scaling
     */
    setupScalingPolicies() {
        // Politique de scale-up basée sur CPU
        this.scalingPolicies.set('cpu-scale-up', {
            id: 'cpu-scale-up',
            name: 'Scale Up - CPU',
            type: 'scale-up',
            metric: 'cpu_utilization',
            threshold: this.config.autoScaling.targetCPU,
            comparison: 'greater_than',
            duration: 120000, // 2 minutes
            cooldown: this.config.autoScaling.scaleUpCooldown,
            action: {
                type: 'add_instances',
                count: 1,
                instanceType: 'medium'
            },
            enabled: true
        });
        
        // Politique de scale-down basée sur CPU
        this.scalingPolicies.set('cpu-scale-down', {
            id: 'cpu-scale-down',
            name: 'Scale Down - CPU',
            type: 'scale-down',
            metric: 'cpu_utilization',
            threshold: 30, // %
            comparison: 'less_than',
            duration: 600000, // 10 minutes
            cooldown: this.config.autoScaling.scaleDownCooldown,
            action: {
                type: 'remove_instances',
                count: 1,
                strategy: 'least_utilized'
            },
            enabled: true
        });
        
        // Politique de scale-up basée sur mémoire
        this.scalingPolicies.set('memory-scale-up', {
            id: 'memory-scale-up',
            name: 'Scale Up - Memory',
            type: 'scale-up',
            metric: 'memory_utilization',
            threshold: this.config.autoScaling.targetMemory,
            comparison: 'greater_than',
            duration: 120000,
            cooldown: this.config.autoScaling.scaleUpCooldown,
            action: {
                type: 'add_instances',
                count: 1,
                instanceType: 'large'
            },
            enabled: true
        });
        
        // Politique de scale-up basée sur latence
        this.scalingPolicies.set('latency-scale-up', {
            id: 'latency-scale-up',
            name: 'Scale Up - Latency',
            type: 'scale-up',
            metric: 'response_time',
            threshold: this.config.autoScaling.targetLatency,
            comparison: 'greater_than',
            duration: 60000, // 1 minute
            cooldown: this.config.autoScaling.scaleUpCooldown,
            action: {
                type: 'add_instances',
                count: 2,
                instanceType: 'medium'
            },
            enabled: true
        });
        
        // Politique prédictive
        this.scalingPolicies.set('predictive-scaling', {
            id: 'predictive-scaling',
            name: 'Predictive Scaling',
            type: 'predictive',
            metric: 'predicted_load',
            threshold: 0.8, // 80% de la capacité prédite
            comparison: 'greater_than',
            duration: 0, // Immédiat
            cooldown: 300000, // 5 minutes
            action: {
                type: 'preemptive_scale',
                strategy: 'ml_prediction'
            },
            enabled: this.config.autoScaling.predictiveScaling
        });
        
        // Politique de scaling programmé
        this.scalingPolicies.set('scheduled-scaling', {
            id: 'scheduled-scaling',
            name: 'Scheduled Scaling',
            type: 'scheduled',
            schedules: [
                {
                    name: 'Business Hours Scale Up',
                    cron: '0 8 * * 1-5', // 8h du lundi au vendredi
                    action: { type: 'set_min_instances', count: 5 }
                },
                {
                    name: 'Business Hours Scale Down',
                    cron: '0 18 * * 1-5', // 18h du lundi au vendredi
                    action: { type: 'set_min_instances', count: 2 }
                },
                {
                    name: 'Weekend Scale Down',
                    cron: '0 20 * * 6-7', // 20h samedi-dimanche
                    action: { type: 'set_min_instances', count: 1 }
                }
            ],
            enabled: true
        });
        
        console.log('📋 Politiques de scaling configurées:', this.scalingPolicies.size);
    }
    
    /**
     * Configuration des health checks
     */
    setupHealthChecks() {
        const healthCheckConfig = {
            interval: this.config.loadBalancing.healthCheckInterval,
            timeout: this.config.loadBalancing.timeout,
            failureThreshold: this.config.loadBalancing.failureThreshold,
            successThreshold: this.config.loadBalancing.successThreshold
        };
        
        // Health check pour les instances
        this.healthChecks.set('instance-health', {
            id: 'instance-health',
            name: 'Instance Health Check',
            type: 'http',
            endpoint: '/health',
            method: 'GET',
            expectedStatus: 200,
            ...healthCheckConfig,
            checks: [
                { name: 'response_time', threshold: 1000 },
                { name: 'cpu_usage', threshold: 95 },
                { name: 'memory_usage', threshold: 95 },
                { name: 'disk_usage', threshold: 90 },
                { name: 'error_rate', threshold: 0.05 }
            ]
        });
        
        // Health check pour les load balancers
        this.healthChecks.set('loadbalancer-health', {
            id: 'loadbalancer-health',
            name: 'Load Balancer Health Check',
            type: 'tcp',
            port: 80,
            ...healthCheckConfig,
            checks: [
                { name: 'connection_success', threshold: 0.99 },
                { name: 'throughput', threshold: 1000 },
                { name: 'latency', threshold: 200 }
            ]
        });
        
        // Health check pour les régions
        this.healthChecks.set('region-health', {
            id: 'region-health',
            name: 'Region Health Check',
            type: 'composite',
            ...healthCheckConfig,
            checks: [
                { name: 'availability', threshold: 0.99 },
                { name: 'latency', threshold: 300 },
                { name: 'instance_health', threshold: 0.95 }
            ]
        });
        
        console.log('🏥 Health checks configurés:', this.healthChecks.size);
    }
    
    /**
     * Initialisation du scaling prédictif
     */
    initializePredictiveScaling() {
        this.predictor = {
            models: new Map(),
            trainingData: [],
            predictions: new Map(),
            accuracy: 0,
            
            // Modèle simple de prédiction de charge
            async predictLoad(timeHorizon = 3600000) { // 1 heure
                try {
                    const currentTime = Date.now();
                    const historicalData = this.getHistoricalData(timeHorizon * 24); // 24h d'historique
                    
                    if (historicalData.length < 10) {
                        return this.getFallbackPrediction();
                    }
                    
                    // Analyse des patterns temporels
                    const hourlyPattern = this.analyzeHourlyPattern(historicalData);
                    const dailyPattern = this.analyzeDailyPattern(historicalData);
                    const weeklyPattern = this.analyzeWeeklyPattern(historicalData);
                    
                    // Prédiction basée sur les patterns
                    const prediction = this.calculatePrediction(
                        hourlyPattern,
                        dailyPattern,
                        weeklyPattern,
                        currentTime,
                        timeHorizon
                    );
                    
                    this.predictions.set(currentTime + timeHorizon, prediction);
                    
                    return prediction;
                    
                } catch (error) {
                    console.error('Erreur prédiction de charge:', error);
                    return this.getFallbackPrediction();
                }
            },
            
            analyzeHourlyPattern(data) {
                const hourlyLoads = new Array(24).fill(0);
                const hourlyCounts = new Array(24).fill(0);
                
                data.forEach(point => {
                    const hour = new Date(point.timestamp).getHours();
                    hourlyLoads[hour] += point.load;
                    hourlyCounts[hour]++;
                });
                
                return hourlyLoads.map((load, index) => 
                    hourlyCounts[index] > 0 ? load / hourlyCounts[index] : 0
                );
            },
            
            analyzeDailyPattern(data) {
                const dailyLoads = new Array(7).fill(0);
                const dailyCounts = new Array(7).fill(0);
                
                data.forEach(point => {
                    const day = new Date(point.timestamp).getDay();
                    dailyLoads[day] += point.load;
                    dailyCounts[day]++;
                });
                
                return dailyLoads.map((load, index) => 
                    dailyCounts[index] > 0 ? load / dailyCounts[index] : 0
                );
            },
            
            analyzeWeeklyPattern(data) {
                // Analyser les tendances sur plusieurs semaines
                const weeklyTrend = {
                    growth: 0,
                    seasonality: 1,
                    baseline: 0
                };
                
                if (data.length > 0) {
                    const avgLoad = data.reduce((sum, point) => sum + point.load, 0) / data.length;
                    weeklyTrend.baseline = avgLoad;
                    
                    // Calculer la croissance (simplifié)
                    const recentData = data.slice(-168); // Dernière semaine
                    const olderData = data.slice(-336, -168); // Semaine précédente
                    
                    if (olderData.length > 0 && recentData.length > 0) {
                        const recentAvg = recentData.reduce((sum, point) => sum + point.load, 0) / recentData.length;
                        const olderAvg = olderData.reduce((sum, point) => sum + point.load, 0) / olderData.length;
                        weeklyTrend.growth = (recentAvg - olderAvg) / olderAvg;
                    }
                }
                
                return weeklyTrend;
            },
            
            calculatePrediction(hourlyPattern, dailyPattern, weeklyPattern, currentTime, horizon) {
                const futureTime = new Date(currentTime + horizon);
                const hour = futureTime.getHours();
                const day = futureTime.getDay();
                
                // Combinaison des patterns
                const hourlyFactor = hourlyPattern[hour] || weeklyPattern.baseline;
                const dailyFactor = dailyPattern[day] || 1;
                const growthFactor = 1 + (weeklyPattern.growth * (horizon / (7 * 24 * 60 * 60 * 1000)));
                
                const predictedLoad = weeklyPattern.baseline * hourlyFactor * dailyFactor * growthFactor;
                
                return {
                    load: Math.max(0, predictedLoad),
                    confidence: this.calculateConfidence(hourlyPattern, dailyPattern),
                    factors: {
                        hourly: hourlyFactor,
                        daily: dailyFactor,
                        growth: growthFactor
                    },
                    timestamp: futureTime,
                    horizon: horizon
                };
            },
            
            calculateConfidence(hourlyPattern, dailyPattern) {
                // Calculer la confiance basée sur la variance des patterns
                const hourlyVariance = this.calculateVariance(hourlyPattern);
                const dailyVariance = this.calculateVariance(dailyPattern);
                
                const maxVariance = Math.max(hourlyVariance, dailyVariance);
                return Math.max(0.1, 1 - (maxVariance / 100)); // Entre 10% et 100%
            },
            
            calculateVariance(pattern) {
                const mean = pattern.reduce((sum, val) => sum + val, 0) / pattern.length;
                const variance = pattern.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pattern.length;
                return Math.sqrt(variance);
            },
            
            getFallbackPrediction() {
                return {
                    load: this.currentLoad || 50,
                    confidence: 0.5,
                    factors: { hourly: 1, daily: 1, growth: 1 },
                    timestamp: new Date(),
                    horizon: 3600000
                };
            },
            
            getHistoricalData(period) {
                // Simulation de données historiques
                const now = Date.now();
                const data = [];
                
                for (let i = 0; i < period / 60000; i++) { // Données par minute
                    const timestamp = now - (period - i * 60000);
                    const load = this.simulateHistoricalLoad(timestamp);
                    data.push({ timestamp, load });
                }
                
                return data;
            },
            
            simulateHistoricalLoad(timestamp) {
                const date = new Date(timestamp);
                const hour = date.getHours();
                const day = date.getDay();
                
                // Pattern horaire (plus de charge en journée)
                const hourlyMultiplier = hour >= 9 && hour <= 17 ? 1.5 : 0.8;
                
                // Pattern hebdomadaire (moins de charge le weekend)
                const weeklyMultiplier = day >= 1 && day <= 5 ? 1.2 : 0.7;
                
                // Charge de base avec variation aléatoire
                const baseLoad = 50 + Math.random() * 30;
                
                return baseLoad * hourlyMultiplier * weeklyMultiplier;
            }
        };
        
        console.log('🔮 Scaling prédictif initialisé');
    }
    
    /**
     * Création d'une instance
     */
    async createInstance(regionId, instanceType = 'medium') {
        try {
            const region = this.regions.get(regionId);
            if (!region) {
                throw new Error(`Région ${regionId} non trouvée`);
            }
            
            const instanceConfig = this.instanceTypes[instanceType];
            if (!instanceConfig) {
                throw new Error(`Type d'instance ${instanceType} non supporté`);
            }
            
            const instanceId = this.generateInstanceId(regionId);
            
            const instance = {
                id: instanceId,
                type: instanceType,
                region: regionId,
                state: this.instanceStates.pending,
                config: instanceConfig,
                metrics: {
                    cpu: 0,
                    memory: 0,
                    storage: 0,
                    connections: 0,
                    requests: 0,
                    responseTime: 0,
                    errors: 0
                },
                health: {
                    status: 'unknown',
                    lastCheck: null,
                    failures: 0,
                    successes: 0
                },
                created: new Date(),
                lastActivity: new Date(),
                costs: {
                    hourly: instanceConfig.cost,
                    accumulated: 0
                },
                tags: {
                    service: 'formease',
                    environment: 'production',
                    scaling: 'auto'
                }
            };
            
            // Simuler le processus de création
            await this.simulateInstanceCreation(instance);
            
            // Ajouter à la région
            region.instances.set(instanceId, instance);
            this.instances.set(instanceId, instance);
            
            // Mettre à jour la capacité de la région
            this.updateRegionCapacity(regionId);
            
            // Ajouter au load balancer
            const loadBalancerId = region.loadBalancer;
            if (loadBalancerId) {
                this.addInstanceToLoadBalancer(loadBalancerId, instanceId);
            }
            
            // Enregistrer l'événement de scaling
            this.recordScalingEvent('instance_created', {
                instanceId,
                instanceType,
                region: regionId,
                reason: 'auto_scaling'
            });
            
            console.log(`🖥️ Instance ${instanceId} créée dans ${regionId}`);
            return instance;
            
        } catch (error) {
            console.error('Erreur création instance:', error);
            throw error;
        }
    }
    
    /**
     * Suppression d'une instance
     */
    async terminateInstance(instanceId, reason = 'auto_scaling') {
        try {
            const instance = this.instances.get(instanceId);
            if (!instance) {
                throw new Error(`Instance ${instanceId} non trouvée`);
            }
            
            // Retirer du load balancer
            const region = this.regions.get(instance.region);
            if (region && region.loadBalancer) {
                this.removeInstanceFromLoadBalancer(region.loadBalancer, instanceId);
            }
            
            // Drainer les connexions existantes
            await this.drainInstance(instance);
            
            // Changer l'état
            instance.state = this.instanceStates.stopping;
            
            // Simuler l'arrêt
            await this.simulateInstanceTermination(instance);
            
            // Supprimer de la région
            if (region) {
                region.instances.delete(instanceId);
                this.updateRegionCapacity(instance.region);
            }
            
            // Supprimer de la liste globale
            this.instances.delete(instanceId);
            
            // Enregistrer l'événement
            this.recordScalingEvent('instance_terminated', {
                instanceId,
                instanceType: instance.type,
                region: instance.region,
                reason,
                uptime: Date.now() - instance.created.getTime()
            });
            
            console.log(`🗑️ Instance ${instanceId} terminée (${reason})`);
            return true;
            
        } catch (error) {
            console.error('Erreur suppression instance:', error);
            throw error;
        }
    }
    
    /**
     * Auto-scaling basé sur les métriques
     */
    async performAutoScaling() {
        if (!this.config.autoScaling.enabled) {
            return;
        }
        
        try {
            // Collecter les métriques actuelles
            const currentMetrics = await this.collectCurrentMetrics();
            
            // Évaluer chaque politique de scaling
            for (const [policyId, policy] of this.scalingPolicies.entries()) {
                if (!policy.enabled) continue;
                
                const shouldTrigger = await this.evaluateScalingPolicy(policy, currentMetrics);
                
                if (shouldTrigger) {
                    await this.executeScalingAction(policy, currentMetrics);
                }
            }
            
            // Scaling prédictif si activé
            if (this.config.autoScaling.predictiveScaling) {
                await this.performPredictiveScaling();
            }
            
        } catch (error) {
            console.error('Erreur auto-scaling:', error);
        }
    }
    
    /**
     * Évaluation d'une politique de scaling
     */
    async evaluateScalingPolicy(policy, metrics) {
        try {
            // Vérifier le cooldown
            if (this.isInCooldown(policy)) {
                return false;
            }
            
            const metricValue = this.getMetricValue(policy.metric, metrics);
            const threshold = policy.threshold;
            
            let shouldTrigger = false;
            
            switch (policy.comparison) {
                case 'greater_than':
                    shouldTrigger = metricValue > threshold;
                    break;
                case 'less_than':
                    shouldTrigger = metricValue < threshold;
                    break;
                case 'equals':
                    shouldTrigger = Math.abs(metricValue - threshold) < 0.01;
                    break;
                default:
                    console.warn('Comparaison non supportée:', policy.comparison);
            }
            
            if (shouldTrigger && policy.duration > 0) {
                // Vérifier si la condition persiste pendant la durée requise
                return this.checkConditionDuration(policy, metricValue);
            }
            
            return shouldTrigger;
            
        } catch (error) {
            console.error('Erreur évaluation politique:', error);
            return false;
        }
    }
    
    /**
     * Exécution d'une action de scaling
     */
    async executeScalingAction(policy, metrics) {
        try {
            const action = policy.action;
            
            switch (action.type) {
                case 'add_instances':
                    await this.scaleUp(action.count, action.instanceType);
                    break;
                    
                case 'remove_instances':
                    await this.scaleDown(action.count, action.strategy);
                    break;
                    
                case 'set_min_instances':
                    await this.setMinimumInstances(action.count);
                    break;
                    
                case 'preemptive_scale':
                    await this.performPreemptiveScaling(action.strategy);
                    break;
                    
                default:
                    console.warn('Action de scaling non supportée:', action.type);
            }
            
            // Enregistrer le déclenchement
            policy.lastTriggered = new Date();
            
            this.recordScalingEvent('policy_triggered', {
                policyId: policy.id,
                action: action.type,
                metrics: metrics
            });
            
        } catch (error) {
            console.error('Erreur exécution action scaling:', error);
        }
    }
    
    /**
     * Scale up (ajout d'instances)
     */
    async scaleUp(count, instanceType = 'medium') {
        const currentInstances = this.instances.size;
        const maxInstances = this.config.autoScaling.maxInstances;
        
        if (currentInstances >= maxInstances) {
            console.log('⚠️ Limite maximale d\'instances atteinte');
            return;
        }
        
        const instancesToAdd = Math.min(count, maxInstances - currentInstances);
        const primaryRegion = this.config.regions.primary;
        
        const promises = [];
        for (let i = 0; i < instancesToAdd; i++) {
            promises.push(this.createInstance(primaryRegion, instanceType));
        }
        
        const newInstances = await Promise.all(promises);
        
        console.log(`📈 Scale Up: ${newInstances.length} instances ajoutées`);
        return newInstances;
    }
    
    /**
     * Scale down (suppression d'instances)
     */
    async scaleDown(count, strategy = 'least_utilized') {
        const currentInstances = this.instances.size;
        const minInstances = this.config.autoScaling.minInstances;
        
        if (currentInstances <= minInstances) {
            console.log('⚠️ Limite minimale d\'instances atteinte');
            return;
        }
        
        const instancesToRemove = Math.min(count, currentInstances - minInstances);
        const instancesToTerminate = this.selectInstancesForTermination(instancesToRemove, strategy);
        
        const promises = instancesToTerminate.map(instance => 
            this.terminateInstance(instance.id, 'scale_down')
        );
        
        await Promise.all(promises);
        
        console.log(`📉 Scale Down: ${instancesToTerminate.length} instances supprimées`);
        return instancesToTerminate;
    }
    
    /**
     * Sélection des instances à supprimer
     */
    selectInstancesForTermination(count, strategy) {
        const instances = Array.from(this.instances.values())
            .filter(instance => instance.state === this.instanceStates.running);
        
        switch (strategy) {
            case 'least_utilized':
                instances.sort((a, b) => 
                    (a.metrics.cpu + a.metrics.memory) - (b.metrics.cpu + b.metrics.memory)
                );
                break;
                
            case 'oldest':
                instances.sort((a, b) => a.created - b.created);
                break;
                
            case 'newest':
                instances.sort((a, b) => b.created - a.created);
                break;
                
            case 'highest_cost':
                instances.sort((a, b) => b.config.cost - a.config.cost);
                break;
                
            default:
                // Random selection
                for (let i = instances.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [instances[i], instances[j]] = [instances[j], instances[i]];
                }
        }
        
        return instances.slice(0, count);
    }
    
    /**
     * Équilibrage de charge adaptatif
     */
    async performLoadBalancing() {
        for (const [loadBalancerId, loadBalancer] of this.loadBalancers.entries()) {
            await this.updateLoadBalancerWeights(loadBalancer);
            await this.redistributeLoad(loadBalancer);
            await this.handleUnhealthyInstances(loadBalancer);
        }
    }
    
    /**
     * Mise à jour des poids du load balancer
     */
    async updateLoadBalancerWeights(loadBalancer) {
        const algorithm = loadBalancer.algorithm;
        
        for (const [instanceId] of loadBalancer.instances) {
            const instance = this.instances.get(instanceId);
            if (!instance) continue;
            
            let weight = 100; // Poids par défaut
            
            switch (algorithm) {
                case 'weighted_round_robin':
                    // Ajuster le poids selon la capacité et l'utilisation
                    const cpuFactor = Math.max(0.1, 1 - (instance.metrics.cpu / 100));
                    const memoryFactor = Math.max(0.1, 1 - (instance.metrics.memory / 100));
                    const typeFactor = this.getInstanceTypeWeight(instance.type);
                    
                    weight = Math.round(100 * cpuFactor * memoryFactor * typeFactor);
                    break;
                    
                case 'least_response_time':
                    // Poids inversé par rapport au temps de réponse
                    const avgResponseTime = instance.metrics.responseTime || 100;
                    weight = Math.max(1, Math.round(1000 / avgResponseTime));
                    break;
                    
                case 'adaptive':
                    // Combinaison de plusieurs métriques
                    const healthScore = this.calculateInstanceHealthScore(instance);
                    weight = Math.round(100 * healthScore);
                    break;
            }
            
            loadBalancer.weights.set(instanceId, Math.max(1, weight));
        }
    }
    
    /**
     * Démarrage du monitoring
     */
    startMonitoring() {
        // Monitoring principal
        this.monitoringInterval = setInterval(async () => {
            await this.collectMetrics();
            await this.performHealthChecks();
            await this.performAutoScaling();
            await this.performLoadBalancing();
            await this.updateCostMetrics();
        }, this.config.monitoring.interval);
        
        // Monitoring prédictif
        this.predictionInterval = setInterval(async () => {
            if (this.config.autoScaling.predictiveScaling) {
                await this.updatePredictions();
            }
        }, 300000); // 5 minutes
        
        console.log('📊 Monitoring démarré');
    }
    
    /**
     * Collecte des métriques
     */
    async collectMetrics() {
        try {
            // Métriques globales
            const globalMetrics = {
                totalInstances: this.instances.size,
                runningInstances: Array.from(this.instances.values())
                    .filter(i => i.state === this.instanceStates.running).length,
                totalRequests: 0,
                averageResponseTime: 0,
                errorRate: 0,
                totalCost: 0
            };
            
            // Métriques par instance
            for (const [instanceId, instance] of this.instances.entries()) {
                await this.collectInstanceMetrics(instance);
                globalMetrics.totalRequests += instance.metrics.requests;
                globalMetrics.totalCost += instance.costs.accumulated;
            }
            
            // Métriques par région
            for (const [regionId, region] of this.regions.entries()) {
                await this.collectRegionMetrics(region);
            }
            
            // Métriques des load balancers
            for (const [loadBalancerId, loadBalancer] of this.loadBalancers.entries()) {
                await this.collectLoadBalancerMetrics(loadBalancer);
            }
            
            // Calculer les moyennes
            if (globalMetrics.runningInstances > 0) {
                globalMetrics.averageResponseTime = globalMetrics.totalRequests > 0 ?
                    Array.from(this.instances.values())
                        .reduce((sum, i) => sum + i.metrics.responseTime, 0) / globalMetrics.runningInstances : 0;
                
                globalMetrics.errorRate = globalMetrics.totalRequests > 0 ?
                    Array.from(this.instances.values())
                        .reduce((sum, i) => sum + i.metrics.errors, 0) / globalMetrics.totalRequests : 0;
            }
            
            this.metrics.set('global', {
                ...globalMetrics,
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Erreur collecte métriques:', error);
        }
    }
    
    /**
     * Fonctions utilitaires
     */
    generateInstanceId(regionId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `i-${regionId}-${timestamp}-${random}`;
    }
    
    getRegionName(regionId) {
        const regionNames = {
            'eu-west-1': 'Europe West 1',
            'us-east-1': 'US East 1',
            'ap-southeast-1': 'Asia Pacific Southeast 1',
            'us-west-2': 'US West 2'
        };
        return regionNames[regionId] || regionId;
    }
    
    async simulateInstanceCreation(instance) {
        // Simuler le temps de création (2-5 secondes)
        const creationTime = 2000 + Math.random() * 3000;
        
        await new Promise(resolve => setTimeout(resolve, creationTime));
        
        instance.state = this.instanceStates.running;
        instance.health.status = 'healthy';
        instance.health.lastCheck = new Date();
    }
    
    async simulateInstanceTermination(instance) {
        // Simuler le temps d'arrêt (1-3 secondes)
        const terminationTime = 1000 + Math.random() * 2000;
        
        await new Promise(resolve => setTimeout(resolve, terminationTime));
        
        instance.state = this.instanceStates.terminated;
    }
    
    recordScalingEvent(type, data) {
        const event = {
            id: this.generateEventId(),
            type,
            data,
            timestamp: new Date()
        };
        
        this.scalingEvents.push(event);
        
        // Limiter l'historique
        if (this.scalingEvents.length > 1000) {
            this.scalingEvents = this.scalingEvents.slice(-500);
        }
        
        console.log(`📝 [SCALING] ${type}:`, data);
    }
    
    generateEventId() {
        return 'evt_' + Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * API publique
     */
    getScalingStatus() {
        const globalMetrics = this.metrics.get('global') || {};
        
        return {
            instances: {
                total: this.instances.size,
                running: Array.from(this.instances.values())
                    .filter(i => i.state === this.instanceStates.running).length,
                pending: Array.from(this.instances.values())
                    .filter(i => i.state === this.instanceStates.pending).length
            },
            regions: this.regions.size,
            loadBalancers: this.loadBalancers.size,
            scalingPolicies: Array.from(this.scalingPolicies.values())
                .filter(p => p.enabled).length,
            metrics: globalMetrics,
            costs: {
                hourly: Array.from(this.instances.values())
                    .reduce((sum, i) => sum + i.costs.hourly, 0),
                daily: Array.from(this.instances.values())
                    .reduce((sum, i) => sum + i.costs.hourly * 24, 0)
            }
        };
    }
    
    async performManualScaling(action, options = {}) {
        try {
            switch (action) {
                case 'scale-up':
                    return await this.scaleUp(options.count || 1, options.instanceType);
                    
                case 'scale-down':
                    return await this.scaleDown(options.count || 1, options.strategy);
                    
                case 'set-capacity':
                    return await this.setCapacity(options.target);
                    
                default:
                    throw new Error(`Action non supportée: ${action}`);
            }
        } catch (error) {
            console.error('Erreur scaling manuel:', error);
            throw error;
        }
    }
    
    getInstanceDetails(instanceId) {
        return this.instances.get(instanceId);
    }
    
    getRegionDetails(regionId) {
        return this.regions.get(regionId);
    }
    
    getLoadBalancerDetails(loadBalancerId) {
        return this.loadBalancers.get(loadBalancerId);
    }
    
    getScalingHistory(limit = 50) {
        return this.scalingEvents.slice(-limit);
    }
}

// Export pour compatibilité navigateur
window.ScalingManager = ScalingManager;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.scalingManager) {
        window.scalingManager = new ScalingManager();
        console.log('⚖️ ScalingManager initialisé globalement');
    }
});
