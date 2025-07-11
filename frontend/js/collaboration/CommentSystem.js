/**
 * 💬 CommentSystem.js - FormEase Sprint 4 Phase 4
 * 
 * Système de commentaires et annotations avancé
 * Gestion des commentaires collaboratifs pour FormEase
 * 
 * Fonctionnalités :
 * - Commentaires temps réel multi-utilisateurs
 * - Annotations contextuelles avancées
 * - Threading et réponses imbriquées
 * - Mentions et notifications intelligentes
 * - Historique et modération
 * - Résolution de commentaires
 * - Suggestions de modifications
 * - Collaboration asynchrone
 * 
 * @version 4.0.0
 * @author FormEase Collaboration Team
 * @since Sprint 4 Phase 4
 */

class CommentSystem {
    constructor() {
        this.comments = new Map();
        this.threads = new Map();
        this.annotations = new Map();
        this.mentions = new Map();
        this.suggestions = new Map();
        this.users = new Map();
        this.permissions = new Map();
        
        this.config = {
            features: {
                threading: true,
                mentions: true,
                annotations: true,
                suggestions: true,
                moderation: true,
                notifications: true,
                reactions: true,
                attachments: false
            },
            limits: {
                maxCommentLength: 10000,
                maxThreadDepth: 10,
                maxAttachmentSize: 10 * 1024 * 1024, // 10MB
                maxMentions: 20,
                historyRetention: 365 // jours
            },
            notifications: {
                realtime: true,
                email: false,
                desktop: true,
                sound: true,
                digest: false
            },
            moderation: {
                enabled: true,
                autoModeration: true,
                spamDetection: true,
                profanityFilter: true,
                reportSystem: true
            },
            permissions: {
                defaultRole: 'commenter',
                roles: {
                    owner: { create: true, edit: true, delete: true, moderate: true, resolve: true },
                    editor: { create: true, edit: true, delete: false, moderate: false, resolve: true },
                    reviewer: { create: true, edit: false, delete: false, moderate: false, resolve: false },
                    commenter: { create: true, edit: false, delete: false, moderate: false, resolve: false },
                    viewer: { create: false, edit: false, delete: false, moderate: false, resolve: false }
                }
            }
        };
        
        this.commentTypes = {
            general: 'general',
            suggestion: 'suggestion',
            question: 'question',
            issue: 'issue',
            approval: 'approval',
            annotation: 'annotation'
        };
        
        this.commentStates = {
            draft: 'draft',
            published: 'published',
            resolved: 'resolved',
            archived: 'archived',
            deleted: 'deleted',
            moderated: 'moderated'
        };
        
        this.annotationTypes = {
            highlight: 'highlight',
            note: 'note',
            correction: 'correction',
            suggestion: 'suggestion',
            question: 'question'
        };
        
        this.eventQueue = [];
        this.lastSync = null;
        
        this.init();
    }
    
    /**
     * Initialisation du système de commentaires
     */
    init() {
        this.setupEventHandlers();
        this.initializePermissions();
        this.setupMentionSystem();
        this.initializeAnnotations();
        this.setupModeration();
        this.startRealtimeSync();
        this.initializeNotifications();
        this.loadComments();
        console.log('💬 CommentSystem v4.0 initialisé - Mode ENTERPRISE');
    }
    
    /**
     * Configuration des gestionnaires d'événements
     */
    setupEventHandlers() {
        // Événements de collaboration
        document.addEventListener('collaborationOperation', (event) => {
            this.handleCollaborationEvent(event.detail);
        });
        
        // Événements de mentions
        document.addEventListener('mentionTriggered', (event) => {
            this.handleMention(event.detail);
        });
        
        // Événements de sélection
        document.addEventListener('selectionChanged', (event) => {
            this.handleSelectionChange(event.detail);
        });
        
        console.log('📡 Gestionnaires d\'événements configurés');
    }
    
    /**
     * Création d'un commentaire
     */
    async createComment(commentData) {
        try {
            // Validation des données
            const validationResult = this.validateComment(commentData);
            if (!validationResult.valid) {
                throw new Error(validationResult.errors.join(', '));
            }
            
            // Vérifier les permissions
            if (!this.checkPermission(commentData.authorId, 'create')) {
                throw new Error('Permissions insuffisantes pour créer un commentaire');
            }
            
            // Générer un ID unique
            const commentId = this.generateCommentId();
            
            // Créer l'objet commentaire
            const comment = {
                id: commentId,
                type: commentData.type || this.commentTypes.general,
                content: commentData.content,
                authorId: commentData.authorId,
                documentId: commentData.documentId,
                threadId: commentData.threadId || commentId, // Thread racine
                parentId: commentData.parentId || null,
                position: commentData.position || null,
                selection: commentData.selection || null,
                mentions: this.extractMentions(commentData.content),
                attachments: commentData.attachments || [],
                metadata: {
                    created: new Date(),
                    modified: new Date(),
                    state: this.commentStates.published,
                    resolved: false,
                    resolvedBy: null,
                    resolvedAt: null,
                    reactions: new Map(),
                    editHistory: []
                },
                settings: {
                    anonymous: commentData.anonymous || false,
                    private: commentData.private || false,
                    notification: commentData.notification !== false
                }
            };
            
            // Traitement spécial pour les suggestions
            if (comment.type === this.commentTypes.suggestion) {
                comment.suggestion = await this.processSuggestion(commentData);
            }
            
            // Sauvegarder le commentaire
            this.comments.set(commentId, comment);
            
            // Gérer le threading
            await this.handleThreading(comment);
            
            // Traiter les mentions
            await this.processMentions(comment);
            
            // Synchroniser en temps réel
            await this.syncComment(comment, 'created');
            
            // Envoyer les notifications
            await this.sendNotifications(comment, 'created');
            
            // Enregistrer l'activité
            this.logActivity('comment_created', {
                commentId: commentId,
                authorId: comment.authorId,
                documentId: comment.documentId
            });
            
            console.log('💬 Commentaire créé:', commentId);
            return comment;
            
        } catch (error) {
            console.error('Erreur création commentaire:', error);
            throw error;
        }
    }
    
    /**
     * Modification d'un commentaire
     */
    async editComment(commentId, updates, userId) {
        try {
            const comment = this.comments.get(commentId);
            if (!comment) {
                throw new Error('Commentaire introuvable');
            }
            
            // Vérifier les permissions
            if (!this.canEditComment(comment, userId)) {
                throw new Error('Permissions insuffisantes pour modifier ce commentaire');
            }
            
            // Sauvegarder l'historique
            const historyEntry = {
                timestamp: new Date(),
                content: comment.content,
                editedBy: userId,
                reason: updates.reason || 'Modification'
            };
            
            comment.metadata.editHistory.push(historyEntry);
            
            // Appliquer les modifications
            if (updates.content !== undefined) {
                comment.content = updates.content;
                comment.mentions = this.extractMentions(updates.content);
            }
            
            if (updates.type !== undefined) {
                comment.type = updates.type;
            }
            
            comment.metadata.modified = new Date();
            
            // Synchroniser
            await this.syncComment(comment, 'updated');
            
            // Notifications
            await this.sendNotifications(comment, 'updated');
            
            console.log('✏️ Commentaire modifié:', commentId);
            return comment;
            
        } catch (error) {
            console.error('Erreur modification commentaire:', error);
            throw error;
        }
    }
    
    /**
     * Suppression d'un commentaire
     */
    async deleteComment(commentId, userId, soft = true) {
        try {
            const comment = this.comments.get(commentId);
            if (!comment) {
                throw new Error('Commentaire introuvable');
            }
            
            // Vérifier les permissions
            if (!this.canDeleteComment(comment, userId)) {
                throw new Error('Permissions insuffisantes pour supprimer ce commentaire');
            }
            
            if (soft) {
                // Suppression douce
                comment.metadata.state = this.commentStates.deleted;
                comment.metadata.deletedBy = userId;
                comment.metadata.deletedAt = new Date();
                comment.content = '[Commentaire supprimé]';
            } else {
                // Suppression définitive
                this.comments.delete(commentId);
                
                // Supprimer des threads
                const thread = this.threads.get(comment.threadId);
                if (thread) {
                    thread.comments = thread.comments.filter(id => id !== commentId);
                    if (thread.comments.length === 0) {
                        this.threads.delete(comment.threadId);
                    }
                }
            }
            
            // Synchroniser
            await this.syncComment(comment, 'deleted');
            
            // Notifications
            await this.sendNotifications(comment, 'deleted');
            
            console.log('🗑️ Commentaire supprimé:', commentId);
            return true;
            
        } catch (error) {
            console.error('Erreur suppression commentaire:', error);
            throw error;
        }
    }
    
    /**
     * Résolution d'un commentaire
     */
    async resolveComment(commentId, userId, resolution) {
        try {
            const comment = this.comments.get(commentId);
            if (!comment) {
                throw new Error('Commentaire introuvable');
            }
            
            // Vérifier les permissions
            if (!this.checkPermission(userId, 'resolve')) {
                throw new Error('Permissions insuffisantes pour résoudre ce commentaire');
            }
            
            // Marquer comme résolu
            comment.metadata.resolved = true;
            comment.metadata.resolvedBy = userId;
            comment.metadata.resolvedAt = new Date();
            comment.metadata.state = this.commentStates.resolved;
            
            if (resolution) {
                comment.resolution = {
                    content: resolution.content,
                    action: resolution.action,
                    resolvedBy: userId,
                    timestamp: new Date()
                };
            }
            
            // Résoudre le thread entier si c'est le commentaire racine
            if (comment.threadId === comment.id) {
                await this.resolveThread(comment.threadId, userId);
            }
            
            // Synchroniser
            await this.syncComment(comment, 'resolved');
            
            // Notifications
            await this.sendNotifications(comment, 'resolved');
            
            console.log('✅ Commentaire résolu:', commentId);
            return comment;
            
        } catch (error) {
            console.error('Erreur résolution commentaire:', error);
            throw error;
        }
    }
    
    /**
     * Création d'une annotation
     */
    async createAnnotation(annotationData) {
        try {
            const annotationId = this.generateAnnotationId();
            
            const annotation = {
                id: annotationId,
                type: annotationData.type || this.annotationTypes.highlight,
                documentId: annotationData.documentId,
                authorId: annotationData.authorId,
                content: annotationData.content || '',
                selection: annotationData.selection,
                position: annotationData.position,
                style: annotationData.style || this.getDefaultAnnotationStyle(annotationData.type),
                metadata: {
                    created: new Date(),
                    modified: new Date(),
                    visible: true,
                    highlighted: true
                },
                comments: [] // Commentaires liés à cette annotation
            };
            
            // Sauvegarder l'annotation
            this.annotations.set(annotationId, annotation);
            
            // Créer un commentaire associé si fourni
            if (annotationData.comment) {
                const comment = await this.createComment({
                    ...annotationData.comment,
                    type: this.commentTypes.annotation,
                    annotationId: annotationId,
                    position: annotation.position,
                    selection: annotation.selection
                });
                
                annotation.comments.push(comment.id);
            }
            
            // Synchroniser
            await this.syncAnnotation(annotation, 'created');
            
            console.log('📌 Annotation créée:', annotationId);
            return annotation;
            
        } catch (error) {
            console.error('Erreur création annotation:', error);
            throw error;
        }
    }
    
    /**
     * Gestion du threading
     */
    async handleThreading(comment) {
        let thread;
        
        if (comment.parentId) {
            // Réponse à un commentaire existant
            const parentComment = this.comments.get(comment.parentId);
            if (!parentComment) {
                throw new Error('Commentaire parent introuvable');
            }
            
            // Utiliser le thread du parent
            comment.threadId = parentComment.threadId;
            thread = this.threads.get(comment.threadId);
            
        } else {
            // Nouveau thread
            thread = {
                id: comment.threadId,
                documentId: comment.documentId,
                rootCommentId: comment.id,
                comments: [],
                participants: new Set(),
                metadata: {
                    created: new Date(),
                    lastActivity: new Date(),
                    resolved: false,
                    messageCount: 0
                }
            };
            
            this.threads.set(comment.threadId, thread);
        }
        
        // Ajouter le commentaire au thread
        thread.comments.push(comment.id);
        thread.participants.add(comment.authorId);
        thread.metadata.lastActivity = new Date();
        thread.metadata.messageCount++;
        
        // Maintenir l'ordre chronologique
        thread.comments.sort((a, b) => {
            const commentA = this.comments.get(a);
            const commentB = this.comments.get(b);
            return commentA.metadata.created - commentB.metadata.created;
        });
        
        return thread;
    }
    
    /**
     * Traitement des mentions
     */
    async processMentions(comment) {
        if (!this.config.features.mentions || comment.mentions.length === 0) {
            return;
        }
        
        for (const mention of comment.mentions) {
            // Créer l'entrée de mention
            const mentionId = this.generateMentionId();
            
            const mentionData = {
                id: mentionId,
                commentId: comment.id,
                mentionedUserId: mention.userId,
                mentionedBy: comment.authorId,
                documentId: comment.documentId,
                context: mention.context,
                timestamp: new Date(),
                read: false,
                notified: false
            };
            
            this.mentions.set(mentionId, mentionData);
            
            // Envoyer notification immédiate
            await this.sendMentionNotification(mentionData);
            
            console.log(`@️⃣ Mention créée pour ${mention.userId}`);
        }
    }
    
    /**
     * Extraction des mentions depuis le contenu
     */
    extractMentions(content) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        
        while ((match = mentionRegex.exec(content)) !== null) {
            const username = match[1];
            const userId = this.getUserIdByUsername(username);
            
            if (userId) {
                mentions.push({
                    userId: userId,
                    username: username,
                    position: match.index,
                    length: match[0].length,
                    context: this.getContextAroundMention(content, match.index)
                });
            }
        }
        
        return mentions;
    }
    
    /**
     * Traitement des suggestions
     */
    async processSuggestion(commentData) {
        const suggestionId = this.generateSuggestionId();
        
        const suggestion = {
            id: suggestionId,
            type: commentData.suggestionType || 'edit',
            original: commentData.originalText,
            suggested: commentData.suggestedText,
            position: commentData.position,
            selection: commentData.selection,
            changes: this.calculateChanges(commentData.originalText, commentData.suggestedText),
            status: 'pending', // pending, accepted, rejected
            votes: {
                accept: new Set(),
                reject: new Set()
            },
            metadata: {
                created: new Date(),
                complexity: this.calculateSuggestionComplexity(commentData)
            }
        };
        
        this.suggestions.set(suggestionId, suggestion);
        
        return suggestion;
    }
    
    /**
     * Synchronisation temps réel
     */
    async syncComment(comment, action) {
        const syncData = {
            type: 'comment_sync',
            action: action,
            comment: this.sanitizeCommentForSync(comment),
            timestamp: Date.now()
        };
        
        // Envoyer via le moteur de collaboration
        if (window.collaborationEngine) {
            window.collaborationEngine.websocket.send(syncData);
        }
        
        // Ajouter à la file d'événements
        this.eventQueue.push(syncData);
    }
    
    /**
     * Démarrage de la synchronisation temps réel
     */
    startRealtimeSync() {
        // Traitement de la file d'événements
        setInterval(() => {
            this.processEventQueue();
        }, 1000); // Chaque seconde
        
        // Synchronisation périodique
        setInterval(() => {
            this.performPeriodicSync();
        }, 30000); // Chaque 30 secondes
        
        console.log('🔄 Synchronisation temps réel démarrée');
    }
    
    /**
     * Configuration du système de modération
     */
    setupModeration() {
        this.moderationSystem = {
            filters: new Map(),
            rules: new Map(),
            reports: new Map(),
            
            // Filtre de profanité
            profanityFilter: {
                enabled: this.config.moderation.profanityFilter,
                words: new Set([
                    // Liste des mots à filtrer
                    'spam', 'inappropriate', 'offensive'
                ]),
                
                check(content) {
                    if (!this.enabled) return { clean: true, filtered: content };
                    
                    let filtered = content;
                    let hasViolations = false;
                    
                    for (const word of this.words) {
                        if (content.toLowerCase().includes(word.toLowerCase())) {
                            filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
                            hasViolations = true;
                        }
                    }
                    
                    return {
                        clean: !hasViolations,
                        filtered: filtered,
                        violations: hasViolations ? Array.from(this.words).filter(word => 
                            content.toLowerCase().includes(word.toLowerCase())
                        ) : []
                    };
                }
            },
            
            // Détection de spam
            spamDetection: {
                enabled: this.config.moderation.spamDetection,
                thresholds: {
                    duplicateContent: 3,
                    rapidPosting: 5, // 5 commentaires en 1 minute
                    lengthRatio: 0.1, // 90% de contenu identique
                    mentionSpam: 10 // Plus de 10 mentions
                },
                
                check(comment, authorHistory) {
                    if (!this.enabled) return { isSpam: false, reasons: [] };
                    
                    const reasons = [];
                    
                    // Vérifier la duplication
                    const duplicates = authorHistory.filter(c => 
                        this.calculateSimilarity(c.content, comment.content) > 0.9
                    ).length;
                    
                    if (duplicates >= this.thresholds.duplicateContent) {
                        reasons.push('duplicate_content');
                    }
                    
                    // Vérifier le posting rapide
                    const recentComments = authorHistory.filter(c => 
                        Date.now() - c.metadata.created.getTime() < 60000
                    ).length;
                    
                    if (recentComments >= this.thresholds.rapidPosting) {
                        reasons.push('rapid_posting');
                    }
                    
                    // Vérifier le spam de mentions
                    if (comment.mentions.length > this.thresholds.mentionSpam) {
                        reasons.push('mention_spam');
                    }
                    
                    return {
                        isSpam: reasons.length > 0,
                        reasons: reasons,
                        confidence: Math.min(reasons.length / 3, 1)
                    };
                },
                
                calculateSimilarity(text1, text2) {
                    // Algorithme simple de similarité
                    const longer = text1.length > text2.length ? text1 : text2;
                    const shorter = text1.length > text2.length ? text2 : text1;
                    
                    if (longer.length === 0) return 1.0;
                    
                    const editDistance = this.levenshteinDistance(longer, shorter);
                    return (longer.length - editDistance) / longer.length;
                },
                
                levenshteinDistance(str1, str2) {
                    const matrix = [];
                    
                    for (let i = 0; i <= str2.length; i++) {
                        matrix[i] = [i];
                    }
                    
                    for (let j = 0; j <= str1.length; j++) {
                        matrix[0][j] = j;
                    }
                    
                    for (let i = 1; i <= str2.length; i++) {
                        for (let j = 1; j <= str1.length; j++) {
                            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                                matrix[i][j] = matrix[i - 1][j - 1];
                            } else {
                                matrix[i][j] = Math.min(
                                    matrix[i - 1][j - 1] + 1,
                                    matrix[i][j - 1] + 1,
                                    matrix[i - 1][j] + 1
                                );
                            }
                        }
                    }
                    
                    return matrix[str2.length][str1.length];
                }
            },
            
            // Modérer un commentaire
            async moderateComment(comment, moderatorId, action, reason) {
                const moderationAction = {
                    id: this.generateModerationId(),
                    commentId: comment.id,
                    moderatorId: moderatorId,
                    action: action, // approve, reject, edit, hide
                    reason: reason,
                    timestamp: new Date(),
                    originalState: comment.metadata.state
                };
                
                // Appliquer l'action
                switch (action) {
                    case 'approve':
                        comment.metadata.state = this.commentStates.published;
                        break;
                        
                    case 'reject':
                        comment.metadata.state = this.commentStates.moderated;
                        break;
                        
                    case 'hide':
                        comment.metadata.state = this.commentStates.archived;
                        break;
                        
                    case 'edit':
                        // Le modérateur peut éditer le contenu
                        if (moderationAction.editedContent) {
                            comment.content = moderationAction.editedContent;
                        }
                        break;
                }
                
                // Enregistrer l'action
                if (!comment.moderation) {
                    comment.moderation = [];
                }
                comment.moderation.push(moderationAction);
                
                // Notifier l'auteur
                await this.sendModerationNotification(comment, moderationAction);
                
                return moderationAction;
            },
            
            generateModerationId() {
                return `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            }
        };
        
        console.log('🛡️ Système de modération configuré');
    }
    
    /**
     * Validation d'un commentaire
     */
    validateComment(commentData) {
        const errors = [];
        
        // Contenu requis
        if (!commentData.content || commentData.content.trim().length === 0) {
            errors.push('Le contenu du commentaire est requis');
        }
        
        // Longueur maximale
        if (commentData.content && commentData.content.length > this.config.limits.maxCommentLength) {
            errors.push(`Le commentaire ne peut pas dépasser ${this.config.limits.maxCommentLength} caractères`);
        }
        
        // Auteur requis
        if (!commentData.authorId) {
            errors.push('L\'auteur du commentaire est requis');
        }
        
        // Document requis
        if (!commentData.documentId) {
            errors.push('Le document associé est requis');
        }
        
        // Validation des mentions
        if (commentData.content) {
            const mentions = this.extractMentions(commentData.content);
            if (mentions.length > this.config.limits.maxMentions) {
                errors.push(`Maximum ${this.config.limits.maxMentions} mentions autorisées`);
            }
        }
        
        // Validation du threading
        if (commentData.parentId) {
            const parentComment = this.comments.get(commentData.parentId);
            if (!parentComment) {
                errors.push('Commentaire parent introuvable');
            } else {
                // Vérifier la profondeur
                const depth = this.getThreadDepth(commentData.parentId);
                if (depth >= this.config.limits.maxThreadDepth) {
                    errors.push(`Profondeur de thread maximale atteinte (${this.config.limits.maxThreadDepth})`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * API publique
     */
    
    // Obtenir les commentaires d'un document
    getDocumentComments(documentId, filters = {}) {
        const documentComments = Array.from(this.comments.values())
            .filter(comment => comment.documentId === documentId);
        
        // Appliquer les filtres
        let filtered = documentComments;
        
        if (filters.state) {
            filtered = filtered.filter(comment => comment.metadata.state === filters.state);
        }
        
        if (filters.type) {
            filtered = filtered.filter(comment => comment.type === filters.type);
        }
        
        if (filters.authorId) {
            filtered = filtered.filter(comment => comment.authorId === filters.authorId);
        }
        
        if (filters.resolved !== undefined) {
            filtered = filtered.filter(comment => comment.metadata.resolved === filters.resolved);
        }
        
        if (filters.threadId) {
            filtered = filtered.filter(comment => comment.threadId === filters.threadId);
        }
        
        // Trier par date
        filtered.sort((a, b) => a.metadata.created - b.metadata.created);
        
        return filtered;
    }
    
    // Obtenir un thread complet
    getThread(threadId) {
        const thread = this.threads.get(threadId);
        if (!thread) {
            return null;
        }
        
        const comments = thread.comments
            .map(commentId => this.comments.get(commentId))
            .filter(comment => comment && comment.metadata.state !== this.commentStates.deleted);
        
        return {
            ...thread,
            comments: comments
        };
    }
    
    // Obtenir les mentions d'un utilisateur
    getUserMentions(userId, unreadOnly = false) {
        const userMentions = Array.from(this.mentions.values())
            .filter(mention => mention.mentionedUserId === userId);
        
        if (unreadOnly) {
            return userMentions.filter(mention => !mention.read);
        }
        
        return userMentions;
    }
    
    // Marquer une mention comme lue
    markMentionAsRead(mentionId) {
        const mention = this.mentions.get(mentionId);
        if (mention) {
            mention.read = true;
            mention.readAt = new Date();
            return true;
        }
        return false;
    }
    
    // Obtenir les annotations d'un document
    getDocumentAnnotations(documentId) {
        return Array.from(this.annotations.values())
            .filter(annotation => annotation.documentId === documentId)
            .filter(annotation => annotation.metadata.visible);
    }
    
    // Ajouter une réaction
    async addReaction(commentId, userId, reaction) {
        const comment = this.comments.get(commentId);
        if (!comment) {
            throw new Error('Commentaire introuvable');
        }
        
        if (!comment.metadata.reactions.has(reaction)) {
            comment.metadata.reactions.set(reaction, new Set());
        }
        
        comment.metadata.reactions.get(reaction).add(userId);
        
        // Synchroniser
        await this.syncComment(comment, 'reaction_added');
        
        return true;
    }
    
    // Supprimer une réaction
    async removeReaction(commentId, userId, reaction) {
        const comment = this.comments.get(commentId);
        if (!comment) {
            throw new Error('Commentaire introuvable');
        }
        
        if (comment.metadata.reactions.has(reaction)) {
            comment.metadata.reactions.get(reaction).delete(userId);
            
            // Supprimer la réaction si plus personne
            if (comment.metadata.reactions.get(reaction).size === 0) {
                comment.metadata.reactions.delete(reaction);
            }
        }
        
        // Synchroniser
        await this.syncComment(comment, 'reaction_removed');
        
        return true;
    }
    
    /**
     * Fonctions utilitaires
     */
    generateCommentId() {
        return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    
    generateAnnotationId() {
        return `annotation_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    generateMentionId() {
        return `mention_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    
    generateSuggestionId() {
        return `suggestion_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    checkPermission(userId, action) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        const role = user.role || this.config.permissions.defaultRole;
        const permissions = this.config.permissions.roles[role];
        
        return permissions && permissions[action] === true;
    }
    
    canEditComment(comment, userId) {
        // L'auteur peut toujours éditer son commentaire
        if (comment.authorId === userId) {
            return true;
        }
        
        // Vérifier les permissions de rôle
        return this.checkPermission(userId, 'edit');
    }
    
    canDeleteComment(comment, userId) {
        // L'auteur peut toujours supprimer son commentaire
        if (comment.authorId === userId) {
            return true;
        }
        
        // Vérifier les permissions de rôle
        return this.checkPermission(userId, 'delete');
    }
    
    getThreadDepth(commentId) {
        let depth = 0;
        let currentComment = this.comments.get(commentId);
        
        while (currentComment && currentComment.parentId) {
            depth++;
            currentComment = this.comments.get(currentComment.parentId);
        }
        
        return depth;
    }
    
    getUserIdByUsername(username) {
        // En production, rechercher dans la base de données
        for (const [userId, user] of this.users.entries()) {
            if (user.username === username) {
                return userId;
            }
        }
        return null;
    }
    
    getContextAroundMention(content, position, contextLength = 50) {
        const start = Math.max(0, position - contextLength);
        const end = Math.min(content.length, position + contextLength);
        return content.substring(start, end);
    }
    
    calculateChanges(original, suggested) {
        // Algorithme simple de diff
        return {
            type: 'text_change',
            additions: suggested.length - original.length,
            complexity: Math.abs(suggested.length - original.length) / original.length
        };
    }
    
    calculateSuggestionComplexity(suggestionData) {
        // Calculer la complexité de la suggestion
        if (!suggestionData.originalText || !suggestionData.suggestedText) {
            return 'low';
        }
        
        const lengthDiff = Math.abs(suggestionData.suggestedText.length - suggestionData.originalText.length);
        const lengthRatio = lengthDiff / suggestionData.originalText.length;
        
        if (lengthRatio > 0.5) return 'high';
        if (lengthRatio > 0.2) return 'medium';
        return 'low';
    }
    
    getDefaultAnnotationStyle(type) {
        const styles = {
            highlight: { backgroundColor: '#ffeb3b', borderColor: '#ffc107' },
            note: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
            correction: { backgroundColor: '#ffebee', borderColor: '#f44336' },
            suggestion: { backgroundColor: '#e8f5e8', borderColor: '#4caf50' },
            question: { backgroundColor: '#fff3e0', borderColor: '#ff9800' }
        };
        
        return styles[type] || styles.highlight;
    }
    
    sanitizeCommentForSync(comment) {
        // Nettoyer le commentaire pour la synchronisation
        return {
            id: comment.id,
            type: comment.type,
            content: comment.content,
            authorId: comment.authorId,
            documentId: comment.documentId,
            threadId: comment.threadId,
            parentId: comment.parentId,
            position: comment.position,
            mentions: comment.mentions,
            metadata: {
                created: comment.metadata.created,
                modified: comment.metadata.modified,
                state: comment.metadata.state,
                resolved: comment.metadata.resolved
            }
        };
    }
    
    /**
     * Gestionnaires d'événements
     */
    handleCollaborationEvent(event) {
        // Traiter les événements de collaboration
        if (event.type === 'comment_sync') {
            this.handleIncomingComment(event);
        }
    }
    
    handleIncomingComment(event) {
        const comment = event.comment;
        
        // Vérifier si le commentaire existe déjà
        if (this.comments.has(comment.id)) {
            // Mise à jour
            const existingComment = this.comments.get(comment.id);
            Object.assign(existingComment, comment);
        } else {
            // Nouveau commentaire
            this.comments.set(comment.id, comment);
        }
        
        // Émettre un événement pour l'interface
        const customEvent = new CustomEvent('commentReceived', {
            detail: { comment, action: event.action }
        });
        
        document.dispatchEvent(customEvent);
    }
    
    handleMention(mentionData) {
        // Traiter les mentions déclenchées
        console.log('Mention déclenchée:', mentionData);
    }
    
    handleSelectionChange(selectionData) {
        // Traiter les changements de sélection pour les annotations
        if (selectionData.text && selectionData.text.length > 0) {
            // Proposer de créer une annotation
            const event = new CustomEvent('annotationOpportunity', {
                detail: selectionData
            });
            
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Chargement et sauvegarde
     */
    async loadComments() {
        try {
            // En production, charger depuis la base de données
            console.log('📥 Chargement des commentaires...');
        } catch (error) {
            console.error('Erreur chargement commentaires:', error);
        }
    }
    
    async processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            try {
                await this.processEvent(event);
            } catch (error) {
                console.error('Erreur traitement événement:', error);
            }
        }
    }
    
    async processEvent(event) {
        // Traiter un événement de la file
        console.log('📤 Traitement événement:', event.type);
    }
    
    async performPeriodicSync() {
        // Synchronisation périodique
        console.log('🔄 Synchronisation périodique...');
        this.lastSync = new Date();
    }
    
    logActivity(action, details) {
        console.log(`📝 [ACTIVITY] ${action}:`, details);
    }
    
    /**
     * API de statut
     */
    getCommentSystemStatus() {
        return {
            comments: this.comments.size,
            threads: this.threads.size,
            annotations: this.annotations.size,
            mentions: this.mentions.size,
            unreadMentions: Array.from(this.mentions.values()).filter(m => !m.read).length,
            lastSync: this.lastSync
        };
    }
}

// Export pour compatibilité navigateur
window.CommentSystem = CommentSystem;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.commentSystem) {
        window.commentSystem = new CommentSystem();
        console.log('💬 CommentSystem initialisé globalement');
    }
});
