#!/usr/bin/env node

/**
 * Script pour générer des clés JWT sécurisées et mettre à jour .env
 * Usage: node generate-jwt-secret.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateJWTSecret() {
  // Génère une clé de 64 caractères (512 bits)
  return crypto.randomBytes(32).toString('hex');
}

function generateSecurePassword() {
  // Génère un mot de passe sécurisé
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Lire le fichier .env existant
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Générer nouvelle clé JWT
    const newJWTSecret = generateJWTSecret();
    
    // Mettre à jour ou ajouter JWT_SECRET
    if (envContent.includes('JWT_SECRET=')) {
      envContent = envContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET="${newJWTSecret}"`
      );
      console.log('✅ JWT_SECRET mis à jour dans .env');
    } else {
      envContent += `\nJWT_SECRET="${newJWTSecret}"\n`;
      console.log('✅ JWT_SECRET ajouté à .env');
    }
    
    // Sauvegarder le fichier
    fs.writeFileSync(envPath, envContent);
    
    return newJWTSecret;
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du fichier .env:', error.message);
    return null;
  }
}

// Fonction principale
function main() {
  console.log('🔐 Générateur de Clés Sécurisées pour FormEase\n');
  
  // Mise à jour automatique du fichier .env
  const jwtSecret = updateEnvFile();
  
  if (jwtSecret) {
    console.log('� Nouvelle clé JWT générée et sauvegardée');
  } else {
    console.log('⚠️ Génération manuelle de clé JWT:');
    console.log(`JWT_SECRET="${generateJWTSecret()}"`);
  }
  
  console.log('\n📋 Autres valeurs utiles:\n');
  console.log('# Mot de passe sécurisé pour admin');
  console.log(`ADMIN_PASSWORD="${generateSecurePassword()}"`);
  
  console.log('\n# Clé de chiffrement pour cookies');
  console.log(`COOKIE_SECRET="${crypto.randomBytes(16).toString('hex')}"`);
  
  console.log('\n✅ Configuration de sécurité générée !');
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  generateJWTSecret,
  generateSecurePassword,
  updateEnvFile
};
console.log(`JWT_SECRET="${generateJWTSecret()}"`);
console.log('');

console.log('# Exemple de mot de passe sécurisé pour la base de données');
console.log(`# DB_PASSWORD="${generateSecurePassword()}"`);
console.log('');

console.log('# Exemple de mot de passe sécurisé pour SMTP');
console.log(`# SMTP_PASS="${generateSecurePassword()}"`);
console.log('');

console.log('⚠️  IMPORTANT:');
console.log('- Gardez ces clés secrètes et ne les partagez jamais');
console.log('- Utilisez des valeurs différentes pour chaque environnement');
console.log('- Stockez-les de manière sécurisée (gestionnaire de mots de passe)');
