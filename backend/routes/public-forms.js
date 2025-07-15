/**
 * FormEase - Routes API pour les formulaires publics
 * Gestion des formulaires partagés et des réponses publiques
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Configuration multer pour les uploads de fichiers
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/responses');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10 // Maximum 10 fichiers
    },
    fileFilter: (req, file, cb) => {
        // Filtres de sécurité pour les types de fichiers
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
        }
    }
});

// Rate limiting pour les soumissions
const submitRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 soumissions max par IP
    message: {
        success: false,
        error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.'
    }
});

const viewRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 vues max par minute par IP
    message: {
        success: false,
        error: 'Trop de requêtes. Veuillez ralentir.'
    }
});

/**
 * GET /api/public/forms/:id
 * Récupérer un formulaire public pour affichage
 */
router.get('/forms/:id', 
    viewRateLimit,
    param('id').isMongoId().withMessage('ID de formulaire invalide'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Paramètres invalides',
                    details: errors.array()
                });
            }

            const formId = req.params.id;
            const token = req.query.token;

            // Récupérer le formulaire depuis la base de données
            // TODO: Remplacer par votre logique de base de données
            const form = await getFormById(formId);

            if (!form) {
                return res.status(404).json({
                    success: false,
                    error: 'Formulaire non trouvé'
                });
            }

            // Vérifier si le formulaire est publié
            if (!form.isPublished) {
                return res.status(403).json({
                    success: false,
                    error: 'Ce formulaire n\'est pas publié'
                });
            }

            // Vérifier si le formulaire a expiré
            if (form.expirationDate && new Date(form.expirationDate) < new Date()) {
                return res.status(410).json({
                    success: false,
                    error: 'Ce formulaire a expiré'
                });
            }

            // Vérifier le token de sécurité si nécessaire
            if (form.requiresToken && (!token || token !== form.accessToken)) {
                return res.status(403).json({
                    success: false,
                    error: 'Token d\'accès requis ou invalide'
                });
            }

            // Préparer les données pour le frontend (sans informations sensibles)
            const publicFormData = {
                id: form._id,
                title: form.title,
                description: form.description,
                fields: form.fields,
                settings: {
                    allowMultipleSubmissions: form.settings?.allowMultipleSubmissions || false,
                    showProgressBar: form.settings?.showProgressBar !== false,
                    customCss: form.settings?.customCss || '',
                    logo: form.settings?.logo || null
                },
                branding: {
                    showFormEaseLogo: form.branding?.showFormEaseLogo !== false,
                    customFooter: form.branding?.customFooter || ''
                }
            };

            // Incrémenter le compteur de vues
            await incrementFormViews(formId, req.ip);

            res.json({
                success: true,
                data: publicFormData
            });

        } catch (error) {
            console.error('Erreur récupération formulaire public:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur serveur lors du chargement du formulaire'
            });
        }
    }
);

/**
 * POST /api/public/forms/:id/submit
 * Soumettre une réponse à un formulaire public
 */
router.post('/forms/:id/submit',
    submitRateLimit,
    upload.any(), // Accepter tous les fichiers
    param('id').isMongoId().withMessage('ID de formulaire invalide'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Paramètres invalides',
                    details: errors.array()
                });
            }

            const formId = req.params.id;
            const submissionData = JSON.parse(req.body.data || '{}');
            const files = req.files || [];

            // Validation de base
            if (!submissionData.responses) {
                return res.status(400).json({
                    success: false,
                    error: 'Données de réponse manquantes'
                });
            }

            // Récupérer le formulaire pour validation
            const form = await getFormById(formId);
            if (!form) {
                return res.status(404).json({
                    success: false,
                    error: 'Formulaire non trouvé'
                });
            }

            if (!form.isPublished) {
                return res.status(403).json({
                    success: false,
                    error: 'Ce formulaire n\'est plus accessible'
                });
            }

            // Vérifier les limites de soumission
            const submissionCount = await getSubmissionCount(formId, req.ip);
            if (!form.settings?.allowMultipleSubmissions && submissionCount > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Vous avez déjà soumis ce formulaire'
                });
            }

            // Valider les réponses selon les règles du formulaire
            const validationErrors = await validateSubmissionData(form, submissionData.responses);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Erreurs de validation',
                    details: validationErrors
                });
            }

            // Traiter les fichiers uploadés
            const processedFiles = await processUploadedFiles(files, formId);

            // Préparer la réponse pour sauvegarde
            const responseRecord = {
                formId: formId,
                responses: submissionData.responses,
                files: processedFiles,
                metadata: {
                    submittedAt: new Date(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    referrer: req.get('Referer'),
                    completionTime: submissionData.metadata?.completionTime || null,
                    fingerprint: generateFingerprint(req)
                }
            };

            // Sauvegarder en base de données
            const savedResponse = await saveFormResponse(responseRecord);

            // Traiter les actions post-soumission
            await handlePostSubmissionActions(form, savedResponse);

            // Réponse de succès
            res.json({
                success: true,
                data: {
                    responseId: savedResponse._id,
                    message: form.settings?.successMessage || 'Votre formulaire a été envoyé avec succès !',
                    redirectUrl: form.settings?.redirectUrl || null
                }
            });

        } catch (error) {
            console.error('Erreur soumission formulaire:', error);
            
            // Nettoyer les fichiers en cas d'erreur
            if (req.files) {
                req.files.forEach(file => {
                    fs.unlink(file.path).catch(console.error);
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'enregistrement de votre réponse'
            });
        }
    }
);

/**
 * POST /api/analytics/forms/:id/view
 * Enregistrer une vue de formulaire pour analytics
 */
router.post('/analytics/forms/:id/view',
    viewRateLimit,
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const formId = req.params.id;
            
            await recordFormView({
                formId: formId,
                timestamp: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                referrer: req.get('Referer')
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Erreur enregistrement vue:', error);
            res.status(500).json({ success: false });
        }
    }
);

/**
 * POST /api/analytics/forms/:id/page-view
 * Enregistrer la navigation entre pages
 */
router.post('/analytics/forms/:id/page-view',
    viewRateLimit,
    param('id').isMongoId(),
    body('page').isInt({ min: 1 }),
    async (req, res) => {
        try {
            const formId = req.params.id;
            const { page, timeOnPreviousPage } = req.body;
            
            await recordPageNavigation({
                formId: formId,
                page: page,
                timeOnPreviousPage: timeOnPreviousPage,
                timestamp: new Date(),
                ipAddress: req.ip
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Erreur enregistrement navigation:', error);
            res.status(500).json({ success: false });
        }
    }
);

/**
 * POST /api/analytics/forms/:id/submit
 * Enregistrer une soumission réussie pour analytics
 */
router.post('/analytics/forms/:id/submit',
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const formId = req.params.id;
            const { completionTime } = req.body;
            
            await recordFormSubmission({
                formId: formId,
                completionTime: completionTime,
                timestamp: new Date(),
                ipAddress: req.ip
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Erreur enregistrement soumission:', error);
            res.status(500).json({ success: false });
        }
    }
);

// === FONCTIONS UTILITAIRES ===

/**
 * Récupérer un formulaire par ID
 */
async function getFormById(formId) {
    // TODO: Implémenter avec votre base de données
    // Exemple avec MongoDB:
    /*
    const { ObjectId } = require('mongodb');
    const db = require('../config/database');
    
    return await db.collection('forms').findOne({
        _id: new ObjectId(formId)
    });
    */
    
    // Simulation pour l'exemple
    return {
        _id: formId,
        title: 'Formulaire de Contact',
        description: 'Contactez-nous pour plus d\'informations',
        isPublished: true,
        fields: [
            {
                id: 'name',
                type: 'text',
                label: 'Nom complet',
                required: true
            },
            {
                id: 'email',
                type: 'email',
                label: 'Email',
                required: true
            },
            {
                id: 'message',
                type: 'textarea',
                label: 'Message',
                required: true
            }
        ],
        settings: {
            allowMultipleSubmissions: false,
            showProgressBar: true,
            successMessage: 'Merci pour votre message !'
        }
    };
}

/**
 * Incrémenter le compteur de vues
 */
async function incrementFormViews(formId, ipAddress) {
    // TODO: Implémenter l'incrémentation des vues
    console.log(`Vue formulaire ${formId} depuis ${ipAddress}`);
}

/**
 * Obtenir le nombre de soumissions par IP
 */
async function getSubmissionCount(formId, ipAddress) {
    // TODO: Implémenter le comptage des soumissions
    return 0;
}

/**
 * Valider les données de soumission
 */
async function validateSubmissionData(form, responses) {
    const errors = [];
    
    // Valider chaque champ requis
    form.fields.forEach(field => {
        if (field.required) {
            const value = responses[field.id];
            
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push({
                    field: field.id,
                    message: `Le champ "${field.label}" est obligatoire`
                });
            }
        }
        
        // Validations spécifiques par type
        if (responses[field.id]) {
            const value = responses[field.id];
            
            switch (field.type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errors.push({
                            field: field.id,
                            message: 'Email invalide'
                        });
                    }
                    break;
                    
                case 'website':
                    const urlRegex = /^https?:\/\/.+/;
                    if (!urlRegex.test(value)) {
                        errors.push({
                            field: field.id,
                            message: 'URL invalide'
                        });
                    }
                    break;
                    
                case 'number_only':
                    if (isNaN(parseFloat(value))) {
                        errors.push({
                            field: field.id,
                            message: 'Nombre invalide'
                        });
                    }
                    break;
            }
        }
    });
    
    return errors;
}

/**
 * Traiter les fichiers uploadés
 */
async function processUploadedFiles(files, formId) {
    const processedFiles = {};
    
    for (const file of files) {
        const fieldName = file.fieldname.replace(/_file_\d+$/, '');
        
        if (!processedFiles[fieldName]) {
            processedFiles[fieldName] = [];
        }
        
        processedFiles[fieldName].push({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date()
        });
    }
    
    return processedFiles;
}

/**
 * Sauvegarder une réponse de formulaire
 */
async function saveFormResponse(responseData) {
    // TODO: Implémenter la sauvegarde en base
    const savedResponse = {
        _id: 'response_' + Date.now(),
        ...responseData
    };
    
    console.log('Réponse sauvegardée:', savedResponse);
    return savedResponse;
}

/**
 * Gérer les actions post-soumission
 */
async function handlePostSubmissionActions(form, response) {
    try {
        // Envoi d'emails de notification
        if (form.notifications?.email?.enabled) {
            await sendNotificationEmail(form, response);
        }
        
        // Intégrations webhook
        if (form.integrations?.webhook?.url) {
            await sendWebhook(form.integrations.webhook, response);
        }
        
        // Autres intégrations (CRM, etc.)
        await processIntegrations(form, response);
        
    } catch (error) {
        console.error('Erreur actions post-soumission:', error);
    }
}

/**
 * Envoyer un email de notification
 */
async function sendNotificationEmail(form, response) {
    // TODO: Implémenter l'envoi d'email
    console.log('Email de notification envoyé pour le formulaire:', form.title);
}

/**
 * Envoyer un webhook
 */
async function sendWebhook(webhookConfig, response) {
    // TODO: Implémenter l'envoi de webhook
    console.log('Webhook envoyé:', webhookConfig.url);
}

/**
 * Traiter les intégrations
 */
async function processIntegrations(form, response) {
    // TODO: Implémenter les intégrations (Zapier, CRM, etc.)
    console.log('Intégrations traitées pour:', form.title);
}

/**
 * Générer une empreinte unique
 */
function generateFingerprint(req) {
    const crypto = require('crypto');
    const fingerprint = req.ip + req.get('User-Agent') + Date.now();
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Enregistrer une vue de formulaire
 */
async function recordFormView(viewData) {
    // TODO: Implémenter l'enregistrement des vues
    console.log('Vue enregistrée:', viewData);
}

/**
 * Enregistrer une navigation de page
 */
async function recordPageNavigation(navigationData) {
    // TODO: Implémenter l'enregistrement des navigations
    console.log('Navigation enregistrée:', navigationData);
}

/**
 * Enregistrer une soumission réussie
 */
async function recordFormSubmission(submissionData) {
    // TODO: Implémenter l'enregistrement des soumissions
    console.log('Soumission enregistrée:', submissionData);
}

module.exports = router;
