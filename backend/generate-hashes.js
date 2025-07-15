const bcrypt = require('bcryptjs');

async function generateHashes() {
    try {
        const jeffHash = await bcrypt.hash('FormEase2025!', 10);
        const demoHash = await bcrypt.hash('demo123', 10);
        
        console.log('Hash pour jeff.kosi@formease.com (FormEase2025!):', jeffHash);
        console.log('Hash pour demo@formease.com (demo123):', demoHash);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

generateHashes();
