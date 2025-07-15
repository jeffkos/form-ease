/**
 * 🔧 SCRIPT DE RÉINITIALISATION RATE LIMIT
 * Utilise l'API pour réinitialiser les compteurs de tentatives
 */

async function resetRateLimit() {
    try {
        console.log('🔄 Réinitialisation du rate limit en cours...');
        
        // Essayer de contacter l'endpoint de reset
        const response = await fetch('http://localhost:4000/api/admin/reset-rate-limit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': 'dev-reset-token' // Token temporaire pour le dev
            },
            body: JSON.stringify({
                action: 'reset_all'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Rate limit réinitialisé avec succès:', result);
            showNotification('Rate limit réinitialisé ! Vous pouvez maintenant vous connecter.', 'success');
        } else {
            throw new Error(`Erreur API: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ Endpoint de reset non disponible, utilisation de la méthode alternative...');
        
        // Méthode alternative : vider le localStorage et rafraîchir
        localStorage.clear();
        sessionStorage.clear();
        
        showNotification('Cache local vidé. Essayez de vous reconnecter.', 'info');
        
        // Attendre un peu puis rafraîchir
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 max-w-sm ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-start">
            <i class="ri-${type === 'success' ? 'check' : type === 'error' ? 'error-warning' : type === 'warning' ? 'alert' : 'information'}-line mr-2 mt-0.5"></i>
            <div>
                <p class="font-medium">${type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : type === 'warning' ? 'Attention' : 'Information'}</p>
                <p class="text-sm opacity-90">${message}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Export pour utilisation dans d'autres scripts
window.resetRateLimit = resetRateLimit;
