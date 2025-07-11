/**
 * ⚡ LoadBalancer.js - FormEase Sprint 4 Phase 3
 * 
 * Équilibreur de charge intelligent et adaptatif
 * Système de load balancing enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Algorithmes de répartition de charge multiples
 * - Health check automatique des serveurs
 * - Failover intelligent et transparent
 * - Circuit breaker pattern
 * - Rate limiting par serveur
 * - Monitoring en temps réel
 * - Sticky sessions avancées
 * - Répartition géographique
 * 
 * @version 4.0.0
 * @author FormEase LoadBalancer Team
 * @since Sprint 4 Phase 3
 */

class LoadBalancer {
    constructor() {
        this.servers = new Map();
        this.pools = new Map();
        this.algorithms = new Map();
        this.healthChecks = new Map();
        this.sessions = new Map();
        this.metrics = new Map();
        this.circuitBreakers = new Map();
        
        this.config = {
            algorithms: {
                default: 'weighted_round_robin',
                fallback: 'round_robin',
                session: 'consistent_hash'
            },
            healthCheck: {
                enabled: true,
                interval: 30000, // 30 secondes
                timeout: 5000, // 5 secondes
                retries: 3,
                gracePeriod: 60000, // 1 minute
                endpoints: ['/health', '/status', '/ping']
            },
            failover: {
                enabled: true,
                maxRetries: 3,
                timeout: 10000, // 10 secondes
                backoffMultiplier: 2,
                jitterRange: 0.1
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                recoveryTimeout: 30000, // 30 secondes
                halfOpenRequests: 3
            },
            rateLimit: {
                enabled: true,
                requestsPerSecond: 100,
                burstSize: 200,
                windowSize: 60000 // 1 minute
            },
            session: {
                enabled: true,
                ttl: 30 * 60 * 1000, // 30 minutes
                cookieName: 'FORMEASE_SESSION',
                stickyEnabled: true
            },
            monitoring: {
                enabled: true,
                interval: 10000, // 10 secondes
                historySize: 1000,
                alertThresholds: {
                    errorRate: 0.05, // 5%
                    responseTime: 2000, // 2 secondes
                    availability: 0.95 // 95%
                }
            }
        };
        
        this.serverStates = {
            healthy: 'healthy',
            unhealthy: 'unhealthy',
            draining: 'draining',
            maintenance: 'maintenance',
            unknown: 'unknown'
        };
        
        this.algorithmTypes = {
            roundRobin: 'round_robin',
            weightedRoundRobin: 'weighted_round_robin',
            leastConnections: 'least_connections',
            leastResponseTime: 'least_response_time',
            ipHash: 'ip_hash',
            consistentHash: 'consistent_hash',
            geolocation: 'geolocation',
            adaptive: 'adaptive'
        };
        
        this.circuitStates = {
            closed: 'closed',
            open: 'open',
            halfOpen: 'half_open'
        };
        
        this.requestQueue = [];
        this.globalMetrics = {
            totalRequests: 0,
            totalResponses: 0,
            totalErrors: 0,
            totalTimeouts: 0,
            avgResponseTime: 0,
            currentConnections: 0
        };
        
        this.init();
    }
    
    /**
     * Initialisation du load balancer
     */
    init() {
        this.initializeAlgorithms();
        this.setupHealthChecks();
        this.initializeCircuitBreakers();
        this.setupSessionManagement();
        this.setupRateLimiting();
        this.startMonitoring();
        this.initializeDefaultPool();
        console.log('⚡ LoadBalancer v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Initialisation des algorithmes de répartition
     */
    initializeAlgorithms() {
        // Round Robin classique
        this.algorithms.set('round_robin', {
            id: 'round_robin',
            name: 'Round Robin',
            currentIndex: 0,
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                const server = availableServers[this.currentIndex % availableServers.length];
                this.currentIndex = (this.currentIndex + 1) % availableServers.length;
                
                return server;
            }
        });
        
        // Weighted Round Robin
        this.algorithms.set('weighted_round_robin', {
            id: 'weighted_round_robin',
            name: 'Weighted Round Robin',
            currentWeights: new Map(),
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                let selectedServer = null;
                let maxWeight = -1;
                
                for (const server of availableServers) {
                    const currentWeight = this.currentWeights.get(server.id) || 0;
                    const newWeight = currentWeight + server.weight;
                    this.currentWeights.set(server.id, newWeight);
                    
                    if (newWeight > maxWeight) {
                        maxWeight = newWeight;
                        selectedServer = server;
                    }
                }
                
                if (selectedServer) {
                    const totalWeight = availableServers.reduce((sum, s) => sum + s.weight, 0);
                    const adjustedWeight = this.currentWeights.get(selectedServer.id) - totalWeight;
                    this.currentWeights.set(selectedServer.id, adjustedWeight);
                }
                
                return selectedServer;
            }
        });
        
        // Least Connections
        this.algorithms.set('least_connections', {
            id: 'least_connections',
            name: 'Least Connections',
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                return availableServers.reduce((min, server) => 
                    server.activeConnections < min.activeConnections ? server : min
                );
            }
        });
        
        // Least Response Time
        this.algorithms.set('least_response_time', {
            id: 'least_response_time',
            name: 'Least Response Time',
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                return availableServers.reduce((min, server) => {
                    const minScore = min.avgResponseTime * min.activeConnections;
                    const serverScore = server.avgResponseTime * server.activeConnections;
                    return serverScore < minScore ? server : min;
                });
            }
        });
        
        // IP Hash (pour la persistence)
        this.algorithms.set('ip_hash', {
            id: 'ip_hash',
            name: 'IP Hash',
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                const clientIP = this.getClientIP(request);
                const hash = this.hashFunction(clientIP);
                const index = hash % availableServers.length;
                
                return availableServers[index];
            },
            
            hashFunction(input) {
                let hash = 0;
                for (let i = 0; i < input.length; i++) {
                    const char = input.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convertir en 32-bit
                }
                return Math.abs(hash);
            },
            
            getClientIP(request) {
                return request.clientIP || 
                       request.headers?.['x-forwarded-for']?.split(',')[0] ||
                       request.headers?.['x-real-ip'] ||
                       '127.0.0.1';
            }
        });
        
        // Consistent Hash (pour les sessions distribuées)
        this.algorithms.set('consistent_hash', {
            id: 'consistent_hash',
            name: 'Consistent Hash',
            ring: new Map(),
            virtualNodes: 150,
            
            initializeRing(servers) {
                this.ring.clear();
                
                for (const server of servers) {
                    for (let i = 0; i < this.virtualNodes; i++) {
                        const hash = this.hashFunction(`${server.id}:${i}`);
                        this.ring.set(hash, server);
                    }
                }
                
                // Trier les clés
                this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
            },
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                // Réinitialiser l'anneau si nécessaire
                if (!this.sortedKeys || this.sortedKeys.length === 0) {
                    this.initializeRing(availableServers);
                }
                
                const sessionId = this.getSessionId(request);
                const hash = this.hashFunction(sessionId);
                
                // Trouver le serveur suivant dans l'anneau
                for (const ringHash of this.sortedKeys) {
                    if (ringHash >= hash) {
                        const server = this.ring.get(ringHash);
                        if (availableServers.includes(server)) {
                            return server;
                        }
                    }
                }
                
                // Si aucun serveur trouvé, prendre le premier
                const firstServer = this.ring.get(this.sortedKeys[0]);
                return availableServers.includes(firstServer) ? firstServer : availableServers[0];
            },
            
            hashFunction(input) {
                // Utiliser la même fonction de hash que ip_hash
                return this.algorithms.get('ip_hash').hashFunction(input);
            },
            
            getSessionId(request) {
                return request.sessionId ||
                       request.headers?.cookie?.match(/FORMEASE_SESSION=([^;]+)/)?.[1] ||
                       request.clientIP ||
                       'anonymous';
            }
        });
        
        // Geolocation-based
        this.algorithms.set('geolocation', {
            id: 'geolocation',
            name: 'Geolocation',
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                const clientLocation = this.getClientLocation(request);
                if (!clientLocation) {
                    // Fallback vers round robin
                    return this.algorithms.get('round_robin').selectServer(availableServers, request);
                }
                
                // Trouver le serveur le plus proche
                let closestServer = availableServers[0];
                let minDistance = this.calculateDistance(clientLocation, closestServer.location);
                
                for (const server of availableServers.slice(1)) {
                    const distance = this.calculateDistance(clientLocation, server.location);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestServer = server;
                    }
                }
                
                return closestServer;
            },
            
            getClientLocation(request) {
                // En production, utiliser un service de géolocalisation IP
                return request.location || 
                       this.mockGeoLocation(request.clientIP) ||
                       null;
            },
            
            mockGeoLocation(ip) {
                // Simulation simple basée sur l'IP
                const hash = this.hashFunction(ip || '127.0.0.1');
                return {
                    latitude: (hash % 180) - 90,  // -90 à 90
                    longitude: (hash % 360) - 180 // -180 à 180
                };
            },
            
            calculateDistance(loc1, loc2) {
                if (!loc1 || !loc2) return Infinity;
                
                const R = 6371; // Rayon de la Terre en km
                const dLat = this.toRadians(loc2.latitude - loc1.latitude);
                const dLon = this.toRadians(loc2.longitude - loc1.longitude);
                
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                         Math.cos(this.toRadians(loc1.latitude)) * 
                         Math.cos(this.toRadians(loc2.latitude)) *
                         Math.sin(dLon/2) * Math.sin(dLon/2);
                
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            },
            
            toRadians(degrees) {
                return degrees * (Math.PI / 180);
            },
            
            hashFunction(input) {
                return this.algorithms.get('ip_hash').hashFunction(input);
            }
        });
        
        // Adaptive (combine plusieurs métriques)
        this.algorithms.set('adaptive', {
            id: 'adaptive',
            name: 'Adaptive',
            
            selectServer(servers, request) {
                const availableServers = servers.filter(s => s.state === this.serverStates.healthy);
                if (availableServers.length === 0) return null;
                
                // Calculer un score pour chaque serveur
                const scoredServers = availableServers.map(server => ({
                    server,
                    score: this.calculateServerScore(server)
                }));
                
                // Trier par score (plus bas = meilleur)
                scoredServers.sort((a, b) => a.score - b.score);
                
                return scoredServers[0].server;
            },
            
            calculateServerScore(server) {
                // Poids des différents facteurs
                const weights = {
                    responseTime: 0.4,
                    connections: 0.3,
                    cpuUsage: 0.2,
                    errorRate: 0.1
                };
                
                // Normaliser les métriques (0-1)
                const normalizedResponseTime = Math.min(server.avgResponseTime / 1000, 1);
                const normalizedConnections = Math.min(server.activeConnections / 100, 1);
                const normalizedCPU = Math.min(server.cpuUsage / 100, 1);
                const normalizedErrorRate = Math.min(server.errorRate, 1);
                
                // Calculer le score pondéré
                return (normalizedResponseTime * weights.responseTime) +
                       (normalizedConnections * weights.connections) +
                       (normalizedCPU * weights.cpuUsage) +
                       (normalizedErrorRate * weights.errorRate);
            }
        });
        
        console.log('🔄 Algorithmes de load balancing initialisés:', this.algorithms.size);
    }
    
    /**
     * Configuration des health checks
     */
    setupHealthChecks() {
        this.healthChecker = {
            checks: new Map(),
            results: new Map(),
            
            async performCheck(server) {
                const startTime = Date.now();
                const checkId = `${server.id}-${startTime}`;
                
                try {
                    const result = await this.executeHealthCheck(server);
                    const responseTime = Date.now() - startTime;
                    
                    const checkResult = {
                        id: checkId,
                        serverId: server.id,
                        timestamp: new Date(),
                        success: result.success,
                        responseTime: responseTime,
                        status: result.status,
                        details: result.details
                    };
                    
                    this.results.set(checkId, checkResult);
                    this.updateServerHealth(server, checkResult);
                    
                    return checkResult;
                    
                } catch (error) {
                    const checkResult = {
                        id: checkId,
                        serverId: server.id,
                        timestamp: new Date(),
                        success: false,
                        responseTime: Date.now() - startTime,
                        status: 'error',
                        error: error.message
                    };
                    
                    this.results.set(checkId, checkResult);
                    this.updateServerHealth(server, checkResult);
                    
                    return checkResult;
                }
            },
            
            async executeHealthCheck(server) {
                // Simuler un health check HTTP
                return new Promise((resolve) => {
                    const delay = 50 + Math.random() * 200; // 50-250ms
                    const success = Math.random() > 0.05; // 95% de succès
                    
                    setTimeout(() => {
                        resolve({
                            success: success,
                            status: success ? 'healthy' : 'unhealthy',
                            details: {
                                endpoint: server.healthEndpoint || '/health',
                                responseCode: success ? 200 : 500,
                                uptime: server.uptime || Date.now() - server.startTime
                            }
                        });
                    }, delay);
                });
            },
            
            updateServerHealth(server, checkResult) {
                if (!server.healthHistory) {
                    server.healthHistory = [];
                }
                
                server.healthHistory.push(checkResult);
                
                // Limiter l'historique
                if (server.healthHistory.length > 50) {
                    server.healthHistory = server.healthHistory.slice(-25);
                }
                
                // Calculer l'état de santé basé sur les derniers checks
                const recentChecks = server.healthHistory.slice(-5);
                const successCount = recentChecks.filter(c => c.success).length;
                const successRate = successCount / recentChecks.length;
                
                if (successRate >= 0.8) {
                    server.state = this.serverStates.healthy;
                } else if (successRate >= 0.4) {
                    server.state = this.serverStates.unhealthy;
                } else {
                    server.state = this.serverStates.unhealthy;
                }
                
                // Mettre à jour les métriques du serveur
                server.lastHealthCheck = checkResult.timestamp;
                server.avgResponseTime = recentChecks.reduce((sum, c) => sum + c.responseTime, 0) / recentChecks.length;
                server.availability = successRate;
            },
            
            startHealthChecks() {
                if (!this.config.healthCheck.enabled) {
                    return;
                }
                
                setInterval(() => {
                    for (const [poolId, pool] of this.pools.entries()) {
                        for (const server of pool.servers) {
                            if (server.state !== this.serverStates.maintenance) {
                                this.performCheck(server);
                            }
                        }
                    }
                }, this.config.healthCheck.interval);
                
                console.log('🏥 Health checks démarrés');
            }
        };
        
        this.healthChecker.startHealthChecks();
    }
    
    /**
     * Initialisation des circuit breakers
     */
    initializeCircuitBreakers() {
        this.circuitBreakerManager = {
            breakers: new Map(),
            
            getBreaker(serverId) {
                if (!this.breakers.has(serverId)) {
                    this.breakers.set(serverId, {
                        id: serverId,
                        state: this.circuitStates.closed,
                        failureCount: 0,
                        successCount: 0,
                        lastFailure: null,
                        lastSuccess: null,
                        nextAttempt: null,
                        halfOpenRequests: 0
                    });
                }
                return this.breakers.get(serverId);
            },
            
            async executeRequest(server, request) {
                if (!this.config.circuitBreaker.enabled) {
                    return await this.directRequest(server, request);
                }
                
                const breaker = this.getBreaker(server.id);
                
                switch (breaker.state) {
                    case this.circuitStates.closed:
                        return await this.handleClosedState(breaker, server, request);
                        
                    case this.circuitStates.open:
                        return await this.handleOpenState(breaker, server, request);
                        
                    case this.circuitStates.halfOpen:
                        return await this.handleHalfOpenState(breaker, server, request);
                        
                    default:
                        throw new Error(`État de circuit breaker inconnu: ${breaker.state}`);
                }
            },
            
            async handleClosedState(breaker, server, request) {
                try {
                    const result = await this.directRequest(server, request);
                    this.recordSuccess(breaker);
                    return result;
                } catch (error) {
                    this.recordFailure(breaker);
                    
                    if (breaker.failureCount >= this.config.circuitBreaker.failureThreshold) {
                        this.openCircuit(breaker);
                    }
                    
                    throw error;
                }
            },
            
            async handleOpenState(breaker, server, request) {
                const now = Date.now();
                
                if (now >= breaker.nextAttempt) {
                    breaker.state = this.circuitStates.halfOpen;
                    breaker.halfOpenRequests = 0;
                    return await this.handleHalfOpenState(breaker, server, request);
                }
                
                throw new Error(`Circuit breaker ouvert pour le serveur ${server.id}`);
            },
            
            async handleHalfOpenState(breaker, server, request) {
                if (breaker.halfOpenRequests >= this.config.circuitBreaker.halfOpenRequests) {
                    throw new Error(`Circuit breaker en test pour le serveur ${server.id}`);
                }
                
                breaker.halfOpenRequests++;
                
                try {
                    const result = await this.directRequest(server, request);
                    this.recordSuccess(breaker);
                    
                    if (breaker.successCount >= this.config.circuitBreaker.halfOpenRequests) {
                        this.closeCircuit(breaker);
                    }
                    
                    return result;
                } catch (error) {
                    this.recordFailure(breaker);
                    this.openCircuit(breaker);
                    throw error;
                }
            },
            
            async directRequest(server, request) {
                // Simuler une requête HTTP
                return new Promise((resolve, reject) => {
                    const delay = server.avgResponseTime || (100 + Math.random() * 200);
                    const success = Math.random() > server.errorRate;
                    
                    setTimeout(() => {
                        if (success) {
                            resolve({
                                status: 200,
                                data: { message: 'Success' },
                                server: server.id,
                                responseTime: delay
                            });
                        } else {
                            reject(new Error(`Erreur serveur ${server.id}`));
                        }
                    }, delay);
                });
            },
            
            recordSuccess(breaker) {
                breaker.successCount++;
                breaker.failureCount = Math.max(0, breaker.failureCount - 1);
                breaker.lastSuccess = Date.now();
            },
            
            recordFailure(breaker) {
                breaker.failureCount++;
                breaker.successCount = 0;
                breaker.lastFailure = Date.now();
            },
            
            openCircuit(breaker) {
                breaker.state = this.circuitStates.open;
                breaker.nextAttempt = Date.now() + this.config.circuitBreaker.recoveryTimeout;
                
                console.warn(`🔴 Circuit breaker ouvert pour ${breaker.id}`);
            },
            
            closeCircuit(breaker) {
                breaker.state = this.circuitStates.closed;
                breaker.failureCount = 0;
                breaker.halfOpenRequests = 0;
                
                console.log(`🟢 Circuit breaker fermé pour ${breaker.id}`);
            }
        };
        
        console.log('⚡ Circuit breakers initialisés');
    }
    
    /**
     * Ajout d'un serveur au pool
     */
    addServer(poolId, server) {
        try {
            const pool = this.pools.get(poolId) || this.createPool(poolId);
            
            const serverConfig = {
                id: server.id || this.generateServerId(),
                host: server.host,
                port: server.port,
                protocol: server.protocol || 'http',
                weight: server.weight || 1,
                maxConnections: server.maxConnections || 1000,
                
                // État et métriques
                state: this.serverStates.unknown,
                activeConnections: 0,
                totalRequests: 0,
                totalResponses: 0,
                totalErrors: 0,
                avgResponseTime: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                errorRate: 0,
                availability: 1,
                
                // Configuration
                healthEndpoint: server.healthEndpoint || '/health',
                location: server.location || null,
                tags: server.tags || [],
                
                // Timestamps
                startTime: Date.now(),
                lastHealthCheck: null,
                lastRequest: null,
                
                // Historique
                healthHistory: [],
                requestHistory: []
            };
            
            pool.servers.push(serverConfig);
            this.servers.set(serverConfig.id, serverConfig);
            
            // Initialiser le circuit breaker
            if (this.config.circuitBreaker.enabled) {
                this.circuitBreakerManager.getBreaker(serverConfig.id);
            }
            
            console.log(`🖥️ Serveur ${serverConfig.id} ajouté au pool ${poolId}`);
            return serverConfig;
            
        } catch (error) {
            console.error('Erreur ajout serveur:', error);
            throw error;
        }
    }
    
    /**
     * Création d'un pool de serveurs
     */
    createPool(poolId, config = {}) {
        const pool = {
            id: poolId,
            name: config.name || poolId,
            algorithm: config.algorithm || this.config.algorithms.default,
            servers: [],
            metrics: {
                totalRequests: 0,
                totalResponses: 0,
                totalErrors: 0,
                avgResponseTime: 0,
                availability: 1
            },
            config: {
                ...this.config,
                ...config
            }
        };
        
        this.pools.set(poolId, pool);
        
        console.log(`🏊 Pool ${poolId} créé`);
        return pool;
    }
    
    /**
     * Traitement d'une requête
     */
    async handleRequest(request, poolId = 'default') {
        const startTime = Date.now();
        
        try {
            const pool = this.pools.get(poolId);
            if (!pool) {
                throw new Error(`Pool ${poolId} non trouvé`);
            }
            
            // Sélectionner un serveur
            const server = await this.selectServer(pool, request);
            if (!server) {
                throw new Error('Aucun serveur disponible');
            }
            
            // Vérifier le rate limiting
            if (this.config.rateLimit.enabled) {
                await this.checkRateLimit(server, request);
            }
            
            // Traiter la requête avec circuit breaker
            const response = await this.circuitBreakerManager.executeRequest(server, request);
            
            // Mettre à jour les métriques
            this.updateRequestMetrics(server, pool, request, response, startTime);
            
            this.globalMetrics.totalRequests++;
            this.globalMetrics.totalResponses++;
            this.globalMetrics.currentConnections--;
            
            return response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Essayer le failover si configuré
            if (this.config.failover.enabled && error.message.includes('Circuit breaker')) {
                try {
                    return await this.handleFailover(request, poolId, error);
                } catch (failoverError) {
                    this.globalMetrics.totalErrors++;
                    throw failoverError;
                }
            }
            
            this.globalMetrics.totalErrors++;
            throw error;
        }
    }
    
    /**
     * Sélection d'un serveur
     */
    async selectServer(pool, request) {
        const algorithm = this.algorithms.get(pool.algorithm);
        if (!algorithm) {
            throw new Error(`Algorithme ${pool.algorithm} non trouvé`);
        }
        
        // Gérer les sessions sticky
        if (this.config.session.stickyEnabled && request.sessionId) {
            const stickyServer = this.getStickyServer(request.sessionId, pool);
            if (stickyServer && stickyServer.state === this.serverStates.healthy) {
                return stickyServer;
            }
        }
        
        // Sélection normale
        const server = algorithm.selectServer(pool.servers, request);
        
        if (server) {
            // Enregistrer la session sticky si activée
            if (this.config.session.stickyEnabled && request.sessionId) {
                this.setStickyServer(request.sessionId, server.id);
            }
            
            server.activeConnections++;
            this.globalMetrics.currentConnections++;
        }
        
        return server;
    }
    
    /**
     * Gestion du failover
     */
    async handleFailover(request, poolId, originalError) {
        const maxRetries = this.config.failover.maxRetries;
        let retryCount = 0;
        let lastError = originalError;
        
        while (retryCount < maxRetries) {
            retryCount++;
            
            try {
                // Délai exponentiel avec jitter
                const baseDelay = this.config.failover.timeout * Math.pow(this.config.failover.backoffMultiplier, retryCount - 1);
                const jitter = baseDelay * this.config.failover.jitterRange * Math.random();
                const delay = baseDelay + jitter;
                
                await new Promise(resolve => setTimeout(resolve, Math.min(delay, 30000)));
                
                // Essayer un autre serveur
                const pool = this.pools.get(poolId);
                const server = await this.selectServer(pool, request);
                
                if (server) {
                    const response = await this.circuitBreakerManager.executeRequest(server, request);
                    
                    console.log(`🔄 Failover réussi après ${retryCount} tentative(s)`);
                    return response;
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Échec failover tentative ${retryCount}:`, error.message);
            }
        }
        
        throw new Error(`Failover échoué après ${maxRetries} tentatives: ${lastError.message}`);
    }
    
    /**
     * Démarrage du monitoring
     */
    startMonitoring() {
        if (!this.config.monitoring.enabled) {
            return;
        }
        
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
            this.checkAlerts();
        }, this.config.monitoring.interval);
        
        console.log('📊 Monitoring démarré');
    }
    
    /**
     * Collecte des métriques
     */
    collectMetrics() {
        // Métriques globales
        const totalRequests = this.globalMetrics.totalRequests + this.globalMetrics.totalErrors;
        this.globalMetrics.avgResponseTime = totalRequests > 0 ?
            Array.from(this.servers.values())
                .reduce((sum, s) => sum + (s.avgResponseTime * s.totalRequests), 0) / 
            Array.from(this.servers.values())
                .reduce((sum, s) => sum + s.totalRequests, 0) : 0;
        
        // Métriques par pool
        for (const [poolId, pool] of this.pools.entries()) {
            const poolMetrics = {
                totalRequests: pool.servers.reduce((sum, s) => sum + s.totalRequests, 0),
                totalResponses: pool.servers.reduce((sum, s) => sum + s.totalResponses, 0),
                totalErrors: pool.servers.reduce((sum, s) => sum + s.totalErrors, 0),
                avgResponseTime: pool.servers.length > 0 ?
                    pool.servers.reduce((sum, s) => sum + s.avgResponseTime, 0) / pool.servers.length : 0,
                availability: pool.servers.length > 0 ?
                    pool.servers.reduce((sum, s) => sum + s.availability, 0) / pool.servers.length : 0
            };
            
            pool.metrics = poolMetrics;
            this.metrics.set(poolId, {
                ...poolMetrics,
                timestamp: new Date()
            });
        }
        
        // Métriques par serveur
        for (const [serverId, server] of this.servers.entries()) {
            server.errorRate = server.totalRequests > 0 ?
                server.totalErrors / server.totalRequests : 0;
            
            // Simuler CPU et mémoire
            server.cpuUsage = Math.min(100, server.activeConnections * 2 + Math.random() * 10);
            server.memoryUsage = Math.min(100, server.activeConnections * 1.5 + Math.random() * 15);
        }
    }
    
    /**
     * Fonctions utilitaires
     */
    generateServerId() {
        return 'srv_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    }
    
    getStickyServer(sessionId, pool) {
        const serverId = this.sessions.get(sessionId);
        return serverId ? pool.servers.find(s => s.id === serverId) : null;
    }
    
    setStickyServer(sessionId, serverId) {
        this.sessions.set(sessionId, serverId);
        
        // Nettoyer les sessions expirées
        setTimeout(() => {
            this.sessions.delete(sessionId);
        }, this.config.session.ttl);
    }
    
    updateRequestMetrics(server, pool, request, response, startTime) {
        const responseTime = Date.now() - startTime;
        
        server.totalRequests++;
        server.totalResponses++;
        server.lastRequest = new Date();
        
        // Mettre à jour le temps de réponse moyen
        server.avgResponseTime = server.avgResponseTime === 0 ?
            responseTime :
            (server.avgResponseTime + responseTime) / 2;
        
        // Ajouter à l'historique
        server.requestHistory.push({
            timestamp: Date.now(),
            responseTime,
            status: response.status
        });
        
        // Limiter l'historique
        if (server.requestHistory.length > this.config.monitoring.historySize) {
            server.requestHistory = server.requestHistory.slice(-500);
        }
        
        pool.metrics.totalRequests++;
        pool.metrics.totalResponses++;
    }
    
    /**
     * API publique
     */
    getStatus() {
        return {
            pools: this.pools.size,
            servers: this.servers.size,
            algorithms: Array.from(this.algorithms.keys()),
            globalMetrics: this.globalMetrics,
            healthChecks: this.config.healthCheck.enabled,
            circuitBreakers: this.config.circuitBreaker.enabled
        };
    }
    
    getPoolStatus(poolId) {
        const pool = this.pools.get(poolId);
        if (!pool) {
            return null;
        }
        
        return {
            id: pool.id,
            name: pool.name,
            algorithm: pool.algorithm,
            servers: pool.servers.map(s => ({
                id: s.id,
                host: s.host,
                port: s.port,
                state: s.state,
                activeConnections: s.activeConnections,
                avgResponseTime: s.avgResponseTime,
                availability: s.availability,
                errorRate: s.errorRate
            })),
            metrics: pool.metrics
        };
    }
    
    getServerStatus(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            return null;
        }
        
        const breaker = this.circuitBreakerManager.breakers.get(serverId);
        
        return {
            ...server,
            circuitBreaker: breaker ? {
                state: breaker.state,
                failureCount: breaker.failureCount,
                successCount: breaker.successCount
            } : null
        };
    }
    
    removeServer(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            return false;
        }
        
        // Drainer les connexions
        server.state = this.serverStates.draining;
        
        // Attendre que les connexions se terminent
        setTimeout(() => {
            // Supprimer de tous les pools
            for (const pool of this.pools.values()) {
                pool.servers = pool.servers.filter(s => s.id !== serverId);
            }
            
            // Supprimer du registre global
            this.servers.delete(serverId);
            
            // Nettoyer le circuit breaker
            this.circuitBreakerManager.breakers.delete(serverId);
            
            console.log(`🗑️ Serveur ${serverId} supprimé`);
        }, 30000); // 30 secondes pour drainer
        
        return true;
    }
    
    setServerMaintenance(serverId, maintenance = true) {
        const server = this.servers.get(serverId);
        if (!server) {
            return false;
        }
        
        server.state = maintenance ? 
            this.serverStates.maintenance : 
            this.serverStates.unknown; // Sera mis à jour par le health check
        
        console.log(`🔧 Serveur ${serverId} ${maintenance ? 'en' : 'hors'} maintenance`);
        return true;
    }
    
    initializeDefaultPool() {
        // Créer le pool par défaut avec quelques serveurs de simulation
        const defaultPool = this.createPool('default', {
            name: 'Pool Principal FormEase',
            algorithm: 'weighted_round_robin'
        });
        
        // Ajouter des serveurs de simulation
        this.addServer('default', {
            host: 'formease-app-01.internal',
            port: 8080,
            weight: 3,
            location: { latitude: 48.8566, longitude: 2.3522 } // Paris
        });
        
        this.addServer('default', {
            host: 'formease-app-02.internal',
            port: 8080,
            weight: 2,
            location: { latitude: 51.5074, longitude: -0.1278 } // Londres
        });
        
        this.addServer('default', {
            host: 'formease-app-03.internal',
            port: 8080,
            weight: 1,
            location: { latitude: 40.7128, longitude: -74.0060 } // New York
        });
        
        console.log('🏊 Pool par défaut initialisé avec 3 serveurs');
    }
    
    async checkRateLimit(server, request) {
        // Implémentation simplifiée du rate limiting
        const now = Date.now();
        const windowStart = now - this.config.rateLimit.windowSize;
        
        // Compter les requêtes récentes
        const recentRequests = server.requestHistory.filter(r => r.timestamp > windowStart);
        
        if (recentRequests.length >= this.config.rateLimit.requestsPerSecond * (this.config.rateLimit.windowSize / 1000)) {
            throw new Error(`Rate limit dépassé pour le serveur ${server.id}`);
        }
    }
    
    analyzePerformance() {
        // Analyse simple des performances
        for (const [serverId, server] of this.servers.entries()) {
            const metrics = server;
            
            // Alertes basées sur les seuils
            if (metrics.errorRate > this.config.monitoring.alertThresholds.errorRate) {
                console.warn(`⚠️ Taux d'erreur élevé sur ${serverId}: ${(metrics.errorRate * 100).toFixed(2)}%`);
            }
            
            if (metrics.avgResponseTime > this.config.monitoring.alertThresholds.responseTime) {
                console.warn(`⚠️ Temps de réponse élevé sur ${serverId}: ${metrics.avgResponseTime.toFixed(0)}ms`);
            }
            
            if (metrics.availability < this.config.monitoring.alertThresholds.availability) {
                console.warn(`⚠️ Disponibilité faible sur ${serverId}: ${(metrics.availability * 100).toFixed(2)}%`);
            }
        }
    }
    
    checkAlerts() {
        // Vérifications d'alertes globales
        const globalErrorRate = this.globalMetrics.totalRequests > 0 ?
            this.globalMetrics.totalErrors / this.globalMetrics.totalRequests : 0;
        
        if (globalErrorRate > this.config.monitoring.alertThresholds.errorRate) {
            console.error(`🚨 ALERTE: Taux d'erreur global élevé: ${(globalErrorRate * 100).toFixed(2)}%`);
        }
    }
}

// Export pour compatibilité navigateur
window.LoadBalancer = LoadBalancer;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.loadBalancer) {
        window.loadBalancer = new LoadBalancer();
        console.log('⚡ LoadBalancer initialisé globalement');
    }
});
