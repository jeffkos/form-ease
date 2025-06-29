#!/bin/bash

# Script de démarrage complet pour FormEase
# Usage: ./start.sh

echo "🚀 Démarrage de FormEase..."

# Vérification des dépendances
echo "📦 Vérification des dépendances..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Installation des dépendances backend
echo "🔧 Installation des dépendances backend..."
cd formease/backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Installation des dépendances frontend
echo "🎨 Installation des dépendances frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Retour à la racine
cd ../..

echo "✅ Installation terminée!"
echo ""
echo "📋 Instructions de démarrage:"
echo "1. Configurez vos variables d'environnement (.env)"
echo "2. Initialisez votre base de données PostgreSQL"
echo "3. Lancez le backend: cd formease/backend && npm run dev"
echo "4. Lancez le frontend: cd formease/frontend && npm run dev"
echo ""
echo "🌐 URLs par défaut:"
echo "   Backend:  http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📚 Documentation: README.md"
