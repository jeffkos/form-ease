#!/usr/bin/env node

/**
 * Script pour générer des clés JWT sécurisées
 * Usage: node generate-jwt-secret.js
 */

const crypto = require('crypto');

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

console.log('🔐 Générateur de Clés Sécurisées pour FormEase\n');

console.log('📋 Ajoutez ces valeurs à votre fichier .env:\n');

console.log('# Clé JWT (copiez-collez dans .env)');
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
