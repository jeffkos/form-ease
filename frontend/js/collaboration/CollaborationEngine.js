/**
 * 🤝 CollaborationEngine.js - FormEase Sprint 4 Phase 4
 * 
 * Moteur de collaboration temps réel et avancé
 * Système de collaboration enterprise-grade pour FormEase
 * 
 * Fonctionnalités :
 * - Collaboration temps réel multi-utilisateurs
 * - Synchronisation de données en temps réel
 * - Gestion des conflits intelligente
 * - Présence utilisateur avancée
 * - Cursors et sélections collaboratives
 * - Historique des modifications
 * - Commentaires et annotations
 * - Notifications push intelligentes
 * 
 * @version 4.0.0
 * @author FormEase Collaboration Team
 * @since Sprint 4 Phase 4
 */

class CollaborationEngine {
    constructor() {
        this.connections = new Map();
        this.rooms = new Map();
        this.documents = new Map();
        this.users = new Map();
        this.conflicts = new Map();
        this.operations = new Map();
        this.presence = new Map();
        
        this.config = {
            websocket: {
                enabled: true,
                url: 'wss://collaboration.formease.com',
                reconnectAttempts: 5,
                reconnectDelay: 1000,
                heartbeatInterval: 30000, // 30 secondes
                timeout: 60000 // 1 minute
            },
            collaboration: {
                maxUsers: 50,
                operationTimeout: 30000, // 30 secondes
                conflictResolution: 'last_writer_wins',
                autosaveInterval: 10000, // 10 secondes
                presenceUpdateInterval: 5000, // 5 secondes
                historyDepth: 1000
            },
            realtime: {
                enabled: true,
                throttleDelay: 100, // 100ms
                batchSize: 10,
                maxQueueSize: 100,
                priority: 'balanced'
            },
            notifications: {
                enabled: true,
                types: ['join', 'leave', 'edit', 'comment', 'mention'],
                sound: true,
                desktop: true,
                email: false
            },
            permissions: {
                defaultRole: 'editor',
                roles: {
                    owner: { read: true, write: true, admin: true, share: true },
                    editor: { read: true, write: true, admin: false, share: false },
                    reviewer: { read: true, write: false, admin: false, share: false },
                    viewer: { read: true, write: false, admin: false, share: false }
                }
            }
        };
        
        this.operationTypes = {
            insert: 'insert',
            delete: 'delete',
            update: 'update',
            move: 'move',
            format: 'format',
            comment: 'comment',
            cursor: 'cursor',
            selection: 'selection'
        };
        
        this.conflictStrategies = {
            lastWriterWins: 'last_writer_wins',
            firstWriterWins: 'first_writer_wins',
            merge: 'operational_transform',
            manual: 'manual_resolution',
            priority: 'user_priority'
        };
        
        this.presenceStates = {
            online: 'online',
            away: 'away',
            busy: 'busy',
            offline: 'offline'
        };
        
        this.documentStates = {
            loading: 'loading',
            ready: 'ready',
            syncing: 'syncing',
            error: 'error',
            offline: 'offline'
        };
        
        this.eventQueue = [];
        this.operationQueue = [];
        this.transformationLog = [];
        this.lastSync = null;
        
        this.init();
    }
    
    /**
     * Initialisation du moteur de collaboration
     */
    init() {
        this.initializeWebSocket();
        this.setupOperationalTransform();
        this.initializePresenceTracking();
        this.setupConflictResolution();
        this.initializeNotifications();
        this.setupAutosave();
        this.startRealtimeSync();
        this.initializePermissions();
        console.log('🤝 CollaborationEngine v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Initialisation WebSocket
     */
    initializeWebSocket() {
        this.websocket = {
            connection: null,
            isConnected: false,
            reconnectAttempts: 0,
            heartbeatTimer: null,
            
            connect() {
                try {
                    if (this.config.websocket.enabled) {
                        this.connection = new WebSocket(this.config.websocket.url);
                        this.setupEventHandlers();
                        console.log('🔌 Connexion WebSocket initialisée');
                    } else {
                        this.setupPolling();
                        console.log('📡 Mode polling activé');
                    }
                } catch (error) {
                    console.error('Erreur connexion WebSocket:', error);
                    this.handleConnectionError(error);
                }
            },
            
            setupEventHandlers() {
                if (!this.connection) return;
                
                this.connection.onopen = (event) => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.onConnected(event);
                    console.log('✅ WebSocket connecté');
                };
                
                this.connection.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.connection.onclose = (event) => {
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.handleDisconnection(event);
                };
                
                this.connection.onerror = (error) => {
                    console.error('Erreur WebSocket:', error);
                    this.handleConnectionError(error);
                };
            },
            
            send(data) {
                if (this.isConnected && this.connection.readyState === WebSocket.OPEN) {
                    this.connection.send(JSON.stringify(data));
                    return true;
                } else {
                    // Mettre en file d'attente si non connecté
                    this.queueMessage(data);
                    return false;
                }
            },
            
            startHeartbeat() {
                this.heartbeatTimer = setInterval(() => {
                    if (this.isConnected) {
                        this.send({ type: 'heartbeat', timestamp: Date.now() });
                    }
                }, this.config.websocket.heartbeatInterval);
            },
            
            stopHeartbeat() {
                if (this.heartbeatTimer) {
                    clearInterval(this.heartbeatTimer);
                    this.heartbeatTimer = null;
                }
            },
            
            reconnect() {
                if (this.reconnectAttempts < this.config.websocket.reconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = this.config.websocket.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                    
                    setTimeout(() => {
                        console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.config.websocket.reconnectAttempts}`);
                        this.connect();
                    }, delay);
                } else {
                    console.error('🚫 Échec de reconnexion après', this.config.websocket.reconnectAttempts, 'tentatives');
                    this.setupPolling(); // Fallback vers polling
                }
            },
            
            setupPolling() {
                // Fallback vers polling HTTP
                setInterval(() => {
                    this.pollForUpdates();
                }, 2000); // Poll toutes les 2 secondes
                
                console.log('📡 Mode polling activé');
            },
            
            async pollForUpdates() {
                try {
                    // Simuler un appel HTTP pour récupérer les mises à jour
                    const updates = await this.fetchUpdates();
                    if (updates && updates.length > 0) {
                        updates.forEach(update => this.handleMessage({ data: JSON.stringify(update) }));
                    }
                } catch (error) {
                    console.error('Erreur polling:', error);
                }
            },
            
            async fetchUpdates() {
                // Simulation - en production, faire un appel HTTP réel
                return [];
            },
            
            queueMessage(data) {
                this.eventQueue.push({
                    data,
                    timestamp: Date.now(),
                    attempts: 0
                });
                
                // Limiter la taille de la file
                if (this.eventQueue.length > this.config.realtime.maxQueueSize) {
                    this.eventQueue.shift();
                }
            },
            
            processQueue() {
                while (this.eventQueue.length > 0 && this.isConnected) {
                    const message = this.eventQueue.shift();
                    this.send(message.data);
                }
            },
            
            handleMessage(event) {
                try {
                    const data = JSON.parse(event.data);
                    this.processIncomingMessage(data);
                } catch (error) {
                    console.error('Erreur traitement message:', error);
                }
            },
            
            processIncomingMessage(data) {
                switch (data.type) {
                    case 'operation':
                        this.handleRemoteOperation(data);
                        break;
                        
                    case 'presence':
                        this.handlePresenceUpdate(data);
                        break;
                        
                    case 'join':
                        this.handleUserJoin(data);
                        break;
                        
                    case 'leave':
                        this.handleUserLeave(data);
                        break;
                        
                    case 'conflict':
                        this.handleConflict(data);
                        break;
                        
                    case 'sync':
                        this.handleSync(data);
                        break;
                        
                    case 'notification':
                        this.handleNotification(data);
                        break;
                        
                    case 'heartbeat':
                        // Répondre au heartbeat
                        this.send({ type: 'heartbeat_response', timestamp: Date.now() });
                        break;
                        
                    default:
                        console.warn('Type de message inconnu:', data.type);
                }
            },
            
            onConnected(event) {
                // Traiter la file d'attente
                this.processQueue();
                
                // Synchroniser l'état
                this.requestFullSync();
                
                // Annoncer la présence
                this.announcePresence();
            },
            
            handleDisconnection(event) {
                console.warn('🔌 WebSocket déconnecté:', event.reason);
                
                if (!event.wasClean) {
                    this.reconnect();
                }
            },
            
            handleConnectionError(error) {
                console.error('🚫 Erreur de connexion:', error);
                this.isConnected = false;
                
                // Essayer de reconnecter
                setTimeout(() => {
                    this.reconnect();
                }, this.config.websocket.reconnectDelay);
            }
        };
        
        this.websocket.connect();
    }
    
    /**
     * Configuration de la transformation opérationnelle
     */
    setupOperationalTransform() {
        this.operationalTransform = {
            localOperations: [],
            remoteOperations: [],
            transformationMatrix: new Map(),
            
            // Appliquer une opération locale
            applyLocalOperation(operation) {
                try {
                    // Ajouter un timestamp et un ID unique
                    operation.id = this.generateOperationId();
                    operation.timestamp = Date.now();
                    operation.authorId = this.getCurrentUserId();
                    
                    // Appliquer localement
                    const result = this.executeOperation(operation);
                    
                    if (result.success) {
                        // Ajouter aux opérations locales
                        this.localOperations.push(operation);
                        
                        // Envoyer aux autres clients
                        this.broadcastOperation(operation);
                        
                        // Enregistrer dans l'historique
                        this.recordOperation(operation);
                        
                        console.log('📝 Opération locale appliquée:', operation.type);
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error('Erreur application opération locale:', error);
                    return { success: false, error: error.message };
                }
            },
            
            // Traiter une opération distante
            handleRemoteOperation(operation) {
                try {
                    // Transformer l'opération contre les opérations locales non confirmées
                    const transformedOperation = this.transformOperation(operation, this.localOperations);
                    
                    if (transformedOperation) {
                        // Appliquer l'opération transformée
                        const result = this.executeOperation(transformedOperation);
                        
                        if (result.success) {
                            // Ajouter aux opérations distantes
                            this.remoteOperations.push(transformedOperation);
                            
                            // Enregistrer dans l'historique
                            this.recordOperation(transformedOperation);
                            
                            // Notifier l'interface
                            this.notifyOperationApplied(transformedOperation);
                            
                            console.log('🌐 Opération distante appliquée:', transformedOperation.type);
                        }
                        
                        return result;
                    }
                    
                } catch (error) {
                    console.error('Erreur traitement opération distante:', error);
                    return { success: false, error: error.message };
                }
            },
            
            // Transformer une opération contre une liste d'opérations
            transformOperation(operation, againstOperations) {
                let transformed = { ...operation };
                
                for (const againstOp of againstOperations) {
                    if (againstOp.timestamp <= operation.timestamp && againstOp.id !== operation.id) {
                        transformed = this.transformSingleOperation(transformed, againstOp);
                    }
                }
                
                return transformed;
            },
            
            // Transformer une opération contre une autre
            transformSingleOperation(op1, op2) {
                const transformKey = `${op1.type}_vs_${op2.type}`;
                const transformer = this.transformationMatrix.get(transformKey);
                
                if (transformer) {
                    return transformer(op1, op2);
                } else {
                    // Transformation par défaut
                    return this.defaultTransform(op1, op2);
                }
            },
            
            // Transformation par défaut
            defaultTransform(op1, op2) {
                // Gestion simple basée sur les positions
                if (op1.position !== undefined && op2.position !== undefined) {
                    if (op2.type === 'insert' && op2.position <= op1.position) {
                        return {
                            ...op1,
                            position: op1.position + (op2.length || 1)
                        };
                    } else if (op2.type === 'delete' && op2.position < op1.position) {
                        return {
                            ...op1,
                            position: Math.max(op2.position, op1.position - (op2.length || 1))
                        };
                    }
                }
                
                return op1;
            },
            
            // Exécuter une opération sur le document
            executeOperation(operation) {
                const documentId = operation.documentId;
                const document = this.documents.get(documentId);
                
                if (!document) {
                    return { success: false, error: 'Document non trouvé' };
                }
                
                try {
                    switch (operation.type) {
                        case this.operationTypes.insert:
                            return this.executeInsert(document, operation);
                            
                        case this.operationTypes.delete:
                            return this.executeDelete(document, operation);
                            
                        case this.operationTypes.update:
                            return this.executeUpdate(document, operation);
                            
                        case this.operationTypes.move:
                            return this.executeMove(document, operation);
                            
                        case this.operationTypes.format:
                            return this.executeFormat(document, operation);
                            
                        case this.operationTypes.comment:
                            return this.executeComment(document, operation);
                            
                        default:
                            return { success: false, error: 'Type d\'opération non supporté' };
                    }
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            
            executeInsert(document, operation) {
                const { position, content } = operation;
                
                if (position < 0 || position > document.content.length) {
                    return { success: false, error: 'Position invalide' };
                }
                
                document.content = document.content.slice(0, position) + 
                                 content + 
                                 document.content.slice(position);
                
                document.lastModified = new Date();
                document.version++;
                
                return { success: true, newVersion: document.version };
            },
            
            executeDelete(document, operation) {
                const { position, length } = operation;
                
                if (position < 0 || position + length > document.content.length) {
                    return { success: false, error: 'Position ou longueur invalide' };
                }
                
                document.content = document.content.slice(0, position) + 
                                 document.content.slice(position + length);
                
                document.lastModified = new Date();
                document.version++;
                
                return { success: true, newVersion: document.version };
            },
            
            executeUpdate(document, operation) {
                const { path, value } = operation;
                
                try {
                    this.setNestedProperty(document, path, value);
                    document.lastModified = new Date();
                    document.version++;
                    
                    return { success: true, newVersion: document.version };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            
            setNestedProperty(obj, path, value) {
                const keys = path.split('.');
                let current = obj;
                
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!(keys[i] in current)) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                
                current[keys[keys.length - 1]] = value;
            },
            
            // Diffuser une opération
            broadcastOperation(operation) {
                const message = {
                    type: 'operation',
                    operation: operation,
                    roomId: operation.roomId,
                    timestamp: Date.now()
                };
                
                this.websocket.send(message);
            },
            
            // Générer un ID d'opération unique
            generateOperationId() {
                return `op_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            },
            
            // Obtenir l'ID utilisateur actuel
            getCurrentUserId() {
                return window.currentUser?.id || 'anonymous';
            },
            
            // Enregistrer une opération
            recordOperation(operation) {
                this.transformationLog.push({
                    ...operation,
                    recorded: new Date()
                });
                
                // Limiter la taille du log
                if (this.transformationLog.length > this.config.collaboration.historyDepth) {
                    this.transformationLog = this.transformationLog.slice(-500);
                }
            },
            
            // Notifier l'application d'une opération
            notifyOperationApplied(operation) {
                const event = new CustomEvent('collaborationOperation', {
                    detail: operation
                });
                
                document.dispatchEvent(event);
            }
        };
        
        // Initialiser la matrice de transformation
        this.initializeTransformationMatrix();
        
        console.log('🔄 Transformation opérationnelle configurée');
    }
    
    /**
     * Initialisation de la matrice de transformation
     */
    initializeTransformationMatrix() {
        const matrix = this.operationalTransform.transformationMatrix;
        
        // Insert vs Insert
        matrix.set('insert_vs_insert', (op1, op2) => {
            if (op2.position <= op1.position) {
                return {
                    ...op1,
                    position: op1.position + op2.content.length
                };
            }
            return op1;
        });
        
        // Insert vs Delete
        matrix.set('insert_vs_delete', (op1, op2) => {
            if (op2.position < op1.position) {
                return {
                    ...op1,
                    position: Math.max(op2.position, op1.position - op2.length)
                };
            }
            return op1;
        });
        
        // Delete vs Insert
        matrix.set('delete_vs_insert', (op1, op2) => {
            if (op2.position <= op1.position) {
                return {
                    ...op1,
                    position: op1.position + op2.content.length
                };
            } else if (op2.position < op1.position + op1.length) {
                return {
                    ...op1,
                    length: op1.length + op2.content.length
                };
            }
            return op1;
        });
        
        // Delete vs Delete
        matrix.set('delete_vs_delete', (op1, op2) => {
            if (op2.position + op2.length <= op1.position) {
                return {
                    ...op1,
                    position: op1.position - op2.length
                };
            } else if (op2.position < op1.position + op1.length) {
                const overlap = Math.min(op1.position + op1.length, op2.position + op2.length) - 
                               Math.max(op1.position, op2.position);
                return {
                    ...op1,
                    position: Math.min(op1.position, op2.position),
                    length: op1.length - overlap
                };
            }
            return op1;
        });
        
        console.log('🧮 Matrice de transformation initialisée');
    }
    
    /**
     * Initialisation du suivi de présence
     */
    initializePresenceTracking() {
        this.presenceManager = {
            userPresence: new Map(),
            cursors: new Map(),
            selections: new Map(),
            
            updatePresence(userId, presence) {
                const previousPresence = this.userPresence.get(userId);
                
                this.userPresence.set(userId, {
                    ...presence,
                    lastUpdate: new Date(),
                    online: presence.state !== this.presenceStates.offline
                });
                
                // Diffuser la mise à jour
                this.broadcastPresence(userId, presence);
                
                // Notifier l'interface
                this.notifyPresenceChange(userId, presence, previousPresence);
                
                console.log(`👤 Présence mise à jour pour ${userId}:`, presence.state);
            },
            
            updateCursor(userId, cursor) {
                this.cursors.set(userId, {
                    ...cursor,
                    timestamp: Date.now()
                });
                
                // Diffuser la position du curseur
                this.broadcastCursor(userId, cursor);
                
                // Notifier l'interface
                this.notifyCursorUpdate(userId, cursor);
            },
            
            updateSelection(userId, selection) {
                this.selections.set(userId, {
                    ...selection,
                    timestamp: Date.now()
                });
                
                // Diffuser la sélection
                this.broadcastSelection(userId, selection);
                
                // Notifier l'interface
                this.notifySelectionUpdate(userId, selection);
            },
            
            broadcastPresence(userId, presence) {
                const message = {
                    type: 'presence',
                    userId: userId,
                    presence: presence,
                    timestamp: Date.now()
                };
                
                this.websocket.send(message);
            },
            
            broadcastCursor(userId, cursor) {
                const message = {
                    type: 'cursor',
                    userId: userId,
                    cursor: cursor,
                    timestamp: Date.now()
                };
                
                this.websocket.send(message);
            },
            
            broadcastSelection(userId, selection) {
                const message = {
                    type: 'selection',
                    userId: userId,
                    selection: selection,
                    timestamp: Date.now()
                };
                
                this.websocket.send(message);
            },
            
            getActiveUsers() {
                const now = Date.now();
                const activeUsers = [];
                
                for (const [userId, presence] of this.userPresence.entries()) {
                    if (presence.online && now - presence.lastUpdate.getTime() < 60000) { // 1 minute
                        activeUsers.push({
                            userId,
                            ...presence
                        });
                    }
                }
                
                return activeUsers;
            },
            
            getUserPresence(userId) {
                return this.userPresence.get(userId);
            },
            
            getUserCursor(userId) {
                return this.cursors.get(userId);
            },
            
            getUserSelection(userId) {
                return this.selections.get(userId);
            },
            
            notifyPresenceChange(userId, presence, previousPresence) {
                const event = new CustomEvent('presenceChanged', {
                    detail: { userId, presence, previousPresence }
                });
                
                document.dispatchEvent(event);
            },
            
            notifyCursorUpdate(userId, cursor) {
                const event = new CustomEvent('cursorUpdated', {
                    detail: { userId, cursor }
                });
                
                document.dispatchEvent(event);
            },
            
            notifySelectionUpdate(userId, selection) {
                const event = new CustomEvent('selectionUpdated', {
                    detail: { userId, selection }
                });
                
                document.dispatchEvent(event);
            },
            
            cleanupInactiveUsers() {
                const now = Date.now();
                const timeout = 5 * 60 * 1000; // 5 minutes
                
                for (const [userId, presence] of this.userPresence.entries()) {
                    if (now - presence.lastUpdate.getTime() > timeout) {
                        this.userPresence.delete(userId);
                        this.cursors.delete(userId);
                        this.selections.delete(userId);
                        
                        console.log(`🚪 Utilisateur ${userId} marqué comme inactif`);
                    }
                }
            }
        };
        
        // Nettoyage périodique des utilisateurs inactifs
        setInterval(() => {
            this.presenceManager.cleanupInactiveUsers();
        }, 60000); // Chaque minute
        
        console.log('👥 Suivi de présence initialisé');
    }
    
    /**
     * Configuration de la résolution de conflits
     */
    setupConflictResolution() {
        this.conflictResolver = {
            activeConflicts: new Map(),
            resolutionStrategies: new Map(),
            
            detectConflict(operation1, operation2) {
                // Vérifier si deux opérations entrent en conflit
                if (operation1.documentId !== operation2.documentId) {
                    return false;
                }
                
                // Conflits temporels
                const timeDiff = Math.abs(operation1.timestamp - operation2.timestamp);
                if (timeDiff < 100) { // Moins de 100ms
                    return this.checkSpatialConflict(operation1, operation2);
                }
                
                return false;
            },
            
            checkSpatialConflict(op1, op2) {
                // Vérifier si les opérations affectent la même zone
                if (op1.position !== undefined && op2.position !== undefined) {
                    const op1End = op1.position + (op1.length || 1);
                    const op2End = op2.position + (op2.length || 1);
                    
                    // Chevauchement des plages
                    return !(op1End <= op2.position || op2End <= op1.position);
                }
                
                // Pour d'autres types d'opérations
                return op1.target === op2.target;
            },
            
            resolveConflict(conflict) {
                const strategy = this.config.collaboration.conflictResolution;
                const resolver = this.resolutionStrategies.get(strategy);
                
                if (resolver) {
                    return resolver(conflict);
                } else {
                    return this.defaultResolution(conflict);
                }
            },
            
            defaultResolution(conflict) {
                // Last writer wins par défaut
                return conflict.operations.sort((a, b) => b.timestamp - a.timestamp)[0];
            },
            
            createConflict(operations) {
                const conflictId = this.generateConflictId();
                
                const conflict = {
                    id: conflictId,
                    operations: operations,
                    created: new Date(),
                    status: 'pending',
                    documentId: operations[0].documentId,
                    affectedUsers: operations.map(op => op.authorId)
                };
                
                this.activeConflicts.set(conflictId, conflict);
                
                // Notifier les utilisateurs concernés
                this.notifyConflict(conflict);
                
                return conflict;
            },
            
            generateConflictId() {
                return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            },
            
            notifyConflict(conflict) {
                const message = {
                    type: 'conflict',
                    conflict: conflict,
                    timestamp: Date.now()
                };
                
                // Envoyer aux utilisateurs concernés
                conflict.affectedUsers.forEach(userId => {
                    this.sendToUser(userId, message);
                });
                
                console.warn('⚠️ Conflit détecté:', conflict.id);
            },
            
            sendToUser(userId, message) {
                // En production, utiliser le système de routage des messages
                this.websocket.send({
                    ...message,
                    targetUser: userId
                });
            }
        };
        
        // Initialiser les stratégies de résolution
        this.initializeResolutionStrategies();
        
        console.log('⚔️ Résolution de conflits configurée');
    }
    
    /**
     * Initialisation des stratégies de résolution
     */
    initializeResolutionStrategies() {
        const strategies = this.conflictResolver.resolutionStrategies;
        
        // Last Writer Wins
        strategies.set('last_writer_wins', (conflict) => {
            return conflict.operations.sort((a, b) => b.timestamp - a.timestamp)[0];
        });
        
        // First Writer Wins
        strategies.set('first_writer_wins', (conflict) => {
            return conflict.operations.sort((a, b) => a.timestamp - b.timestamp)[0];
        });
        
        // Merge (Operational Transform)
        strategies.set('operational_transform', (conflict) => {
            // Appliquer toutes les opérations en utilisant la transformation opérationnelle
            let result = null;
            
            for (const operation of conflict.operations) {
                if (result) {
                    result = this.operationalTransform.transformSingleOperation(operation, result);
                } else {
                    result = operation;
                }
            }
            
            return result;
        });
        
        // Priority-based (selon le rôle utilisateur)
        strategies.set('user_priority', (conflict) => {
            const operationsWithPriority = conflict.operations.map(op => ({
                ...op,
                priority: this.getUserPriority(op.authorId)
            }));
            
            return operationsWithPriority.sort((a, b) => b.priority - a.priority)[0];
        });
        
        console.log('🔧 Stratégies de résolution initialisées');
    }
    
    /**
     * Démarrage de la synchronisation temps réel
     */
    startRealtimeSync() {
        this.realtimeSync = {
            syncInterval: null,
            lastSyncTime: Date.now(),
            pendingOperations: [],
            
            start() {
                if (this.config.realtime.enabled) {
                    this.syncInterval = setInterval(() => {
                        this.performSync();
                    }, this.config.collaboration.autosaveInterval);
                    
                    console.log('🔄 Synchronisation temps réel démarrée');
                }
            },
            
            stop() {
                if (this.syncInterval) {
                    clearInterval(this.syncInterval);
                    this.syncInterval = null;
                    console.log('⏹️ Synchronisation temps réel arrêtée');
                }
            },
            
            async performSync() {
                try {
                    // Synchroniser les documents modifiés
                    for (const [documentId, document] of this.documents.entries()) {
                        if (document.lastModified > this.lastSyncTime) {
                            await this.syncDocument(document);
                        }
                    }
                    
                    // Traiter les opérations en attente
                    await this.processPendingOperations();
                    
                    this.lastSyncTime = Date.now();
                    
                } catch (error) {
                    console.error('Erreur synchronisation:', error);
                }
            },
            
            async syncDocument(document) {
                const syncData = {
                    type: 'sync',
                    documentId: document.id,
                    version: document.version,
                    content: document.content,
                    lastModified: document.lastModified,
                    checksum: this.calculateChecksum(document.content)
                };
                
                this.websocket.send(syncData);
                
                console.log(`📄 Document ${document.id} synchronisé`);
            },
            
            async processPendingOperations() {
                const batch = this.pendingOperations.splice(0, this.config.realtime.batchSize);
                
                for (const operation of batch) {
                    try {
                        await this.operationalTransform.applyLocalOperation(operation);
                    } catch (error) {
                        console.error('Erreur traitement opération:', error);
                    }
                }
            },
            
            calculateChecksum(content) {
                // Checksum simple pour la vérification d'intégrité
                let hash = 0;
                for (let i = 0; i < content.length; i++) {
                    const char = content.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convertir en 32bit
                }
                return hash.toString(16);
            }
        };
        
        this.realtimeSync.start();
    }
    
    /**
     * API publique pour la collaboration
     */
    
    // Rejoindre une salle de collaboration
    async joinRoom(roomId, userId) {
        try {
            if (!this.rooms.has(roomId)) {
                this.rooms.set(roomId, {
                    id: roomId,
                    users: new Map(),
                    documents: new Map(),
                    created: new Date(),
                    lastActivity: new Date()
                });
            }
            
            const room = this.rooms.get(roomId);
            const user = this.users.get(userId) || await this.getUser(userId);
            
            room.users.set(userId, {
                ...user,
                joinedAt: new Date(),
                role: user.role || this.config.permissions.defaultRole
            });
            
            // Annoncer l'arrivée
            this.websocket.send({
                type: 'join',
                roomId: roomId,
                userId: userId,
                user: user,
                timestamp: Date.now()
            });
            
            // Mettre à jour la présence
            this.presenceManager.updatePresence(userId, {
                state: this.presenceStates.online,
                roomId: roomId
            });
            
            console.log(`🚪 Utilisateur ${userId} a rejoint la salle ${roomId}`);
            return room;
            
        } catch (error) {
            console.error('Erreur jointure salle:', error);
            throw error;
        }
    }
    
    // Quitter une salle
    async leaveRoom(roomId, userId) {
        try {
            const room = this.rooms.get(roomId);
            if (!room) {
                return false;
            }
            
            room.users.delete(userId);
            
            // Annoncer le départ
            this.websocket.send({
                type: 'leave',
                roomId: roomId,
                userId: userId,
                timestamp: Date.now()
            });
            
            // Mettre à jour la présence
            this.presenceManager.updatePresence(userId, {
                state: this.presenceStates.offline
            });
            
            // Supprimer la salle si vide
            if (room.users.size === 0) {
                this.rooms.delete(roomId);
                console.log(`🗑️ Salle ${roomId} supprimée (vide)`);
            }
            
            console.log(`🚪 Utilisateur ${userId} a quitté la salle ${roomId}`);
            return true;
            
        } catch (error) {
            console.error('Erreur quitter salle:', error);
            return false;
        }
    }
    
    // Appliquer une opération
    async applyOperation(operation) {
        return await this.operationalTransform.applyLocalOperation(operation);
    }
    
    // Mettre à jour la présence
    updateUserPresence(userId, presence) {
        this.presenceManager.updatePresence(userId, presence);
    }
    
    // Mettre à jour le curseur
    updateUserCursor(userId, cursor) {
        this.presenceManager.updateCursor(userId, cursor);
    }
    
    // Mettre à jour la sélection
    updateUserSelection(userId, selection) {
        this.presenceManager.updateSelection(userId, selection);
    }
    
    // Obtenir les utilisateurs actifs
    getActiveUsers() {
        return this.presenceManager.getActiveUsers();
    }
    
    // Obtenir l'état d'une salle
    getRoomState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }
        
        return {
            id: room.id,
            users: Array.from(room.users.values()),
            documents: Array.from(room.documents.keys()),
            activeUsers: this.presenceManager.getActiveUsers()
                .filter(user => user.roomId === roomId)
        };
    }
    
    // Obtenir l'historique des opérations
    getOperationHistory(documentId, limit = 100) {
        return this.operationalTransform.transformationLog
            .filter(op => op.documentId === documentId)
            .slice(-limit);
    }
    
    /**
     * Fonctions utilitaires
     */
    async getUser(userId) {
        // En production, récupérer depuis la base de données
        return {
            id: userId,
            name: `User ${userId}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            role: 'editor',
            permissions: this.config.permissions.roles.editor
        };
    }
    
    getUserPriority(userId) {
        const user = this.users.get(userId);
        if (!user) return 0;
        
        const rolePriority = {
            owner: 4,
            editor: 3,
            reviewer: 2,
            viewer: 1
        };
        
        return rolePriority[user.role] || 0;
    }
    
    generateOperationId() {
        return this.operationalTransform.generateOperationId();
    }
    
    /**
     * Gestionnaires d'événements WebSocket
     */
    handleRemoteOperation(data) {
        this.operationalTransform.handleRemoteOperation(data.operation);
    }
    
    handlePresenceUpdate(data) {
        this.presenceManager.updatePresence(data.userId, data.presence);
    }
    
    handleUserJoin(data) {
        const event = new CustomEvent('userJoined', {
            detail: data
        });
        
        document.dispatchEvent(event);
        console.log(`👋 ${data.user.name} a rejoint la collaboration`);
    }
    
    handleUserLeave(data) {
        const event = new CustomEvent('userLeft', {
            detail: data
        });
        
        document.dispatchEvent(event);
        console.log(`👋 Utilisateur ${data.userId} a quitté la collaboration`);
    }
    
    handleConflict(data) {
        const conflict = this.conflictResolver.resolveConflict(data.conflict);
        
        const event = new CustomEvent('conflictResolved', {
            detail: { conflict: data.conflict, resolution: conflict }
        });
        
        document.dispatchEvent(event);
    }
    
    handleSync(data) {
        // Synchroniser l'état du document
        const document = this.documents.get(data.documentId);
        if (document && document.version < data.version) {
            document.content = data.content;
            document.version = data.version;
            document.lastModified = new Date(data.lastModified);
            
            const event = new CustomEvent('documentSynced', {
                detail: data
            });
            
            document.dispatchEvent(event);
        }
    }
    
    handleNotification(data) {
        this.notificationSystem.handleIncomingNotification(data);
    }
    
    /**
     * API de statut
     */
    getCollaborationStatus() {
        return {
            connected: this.websocket.isConnected,
            rooms: this.rooms.size,
            activeUsers: this.presenceManager.getActiveUsers().length,
            operations: this.operationalTransform.transformationLog.length,
            conflicts: this.conflictResolver.activeConflicts.size,
            lastSync: this.lastSync
        };
    }
    
    getConnectionStats() {
        return {
            websocket: {
                connected: this.websocket.isConnected,
                reconnectAttempts: this.websocket.reconnectAttempts,
                queueSize: this.eventQueue.length
            },
            sync: {
                lastSync: this.realtimeSync.lastSyncTime,
                pendingOperations: this.realtimeSync.pendingOperations.length
            }
        };
    }
}

// Export pour compatibilité navigateur
window.CollaborationEngine = CollaborationEngine;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.collaborationEngine) {
        window.collaborationEngine = new CollaborationEngine();
        console.log('🤝 CollaborationEngine initialisé globalement');
    }
});
