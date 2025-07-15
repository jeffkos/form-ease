/**
 * 🔧 ENDPOINT DE DÉVELOPPEMENT - RESET RATE LIMIT
 * 
 * Script temporaire pour réinitialiser le rate limiting en développement
 */

// Fonction pour réinitialiser le store global en mémoire
function resetInMemoryRateLimit() {
    try {
        // Vider le store global utilisé par le rate limiting
        if (global.__rateLimitStore) {
            console.log('🔄 Réinitialisation du store rate limit en mémoire...');
            global.__rateLimitStore = {};
            console.log('✅ Store rate limit vidé');
            return { success: true, message: 'Rate limit store réinitialisé' };
        } else {
            console.log('ℹ️ Aucun store rate limit trouvé');
            return { success: true, message: 'Aucun rate limit actif' };
        }
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
        return { success: false, error: error.message };
    }
}

// Route temporaire pour le développement
function setupResetRoute(app) {
    app.post('/api/admin/reset-rate-limit', (req, res) => {
        try {
            console.log('🔧 Demande de réinitialisation du rate limit reçue');
            
            // Vérifier si c'est en mode développement
            if (process.env.NODE_ENV !== 'development') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'Cette fonctionnalité n\'est disponible qu\'en développement'
                });
            }
            
            // Réinitialiser le store
            const result = resetInMemoryRateLimit();
            
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    error: 'RESET_FAILED',
                    message: result.error
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur endpoint reset:', error);
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Erreur interne du serveur'
            });
        }
    });
    
    console.log('🔧 Route de reset rate limit configurée: POST /api/admin/reset-rate-limit');
}

module.exports = {
    resetInMemoryRateLimit,
    setupResetRoute
};
