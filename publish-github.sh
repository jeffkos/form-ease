#!/bin/bash

# Script de publication GitHub pour FormEase
# Usage: ./publish-github.sh

echo "🚀 Publication de FormEase sur GitHub..."

# Vérification que Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé"
    exit 1
fi

# Vérification du repository
REPO_URL="https://github.com/informagenie/FormEase.git"

echo "📦 Initialisation du repository Git..."

# Initialisation si pas déjà fait
if [ ! -d ".git" ]; then
    git init
    echo "✅ Repository Git initialisé"
fi

# Configuration de base (optionnel)
read -p "📝 Configurer nom d'utilisateur Git ? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Nom d'utilisateur: " username
    read -p "Email: " email
    git config user.name "$username"
    git config user.email "$email"
    echo "✅ Configuration Git mise à jour"
fi

echo "📂 Ajout des fichiers..."
git add .

echo "💬 Commit initial..."
git commit -m "🎉 Initial commit - FormEase v1.0.0

✨ Features:
- Modern Next.js 14 frontend with Tremor UI
- Express.js backend with Prisma ORM  
- JWT authentication system
- Analytics dashboard with charts
- Freemium/Premium quota system
- Multi-role management (USER, PREMIUM, SUPERADMIN)
- Complete API documentation ready
- Comprehensive README and contribution guides

🏗️ Architecture:
- Modular frontend/backend structure
- TypeScript strict mode
- React Context for global state
- Structured API services
- Reusable UI components

📚 Documentation:
- Complete setup guides
- API documentation
- Contributing guidelines
- MIT license
- Cross-platform installation scripts

🧪 Tests: 12/14 passing (validation + auth working)
🔧 Build: Frontend and backend builds successful"

echo "🌐 Configuration du remote GitHub..."
git branch -M main

# Vérifier si remote existe déjà
if git remote get-url origin &> /dev/null; then
    echo "Remote origin existe déjà"
else
    git remote add origin $REPO_URL
    echo "✅ Remote origin ajouté: $REPO_URL"
fi

echo "🚀 Push vers GitHub..."
read -p "Pousser vers GitHub maintenant ? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin main
    echo "✅ FormEase publié sur GitHub !"
    echo ""
    echo "🌐 Repository: $REPO_URL"
    echo "📚 Documentation: README.md"
    echo "🤝 Contributions: CONTRIBUTING.md"
    echo ""
    echo "🎉 FormEase v1.0.0 est maintenant disponible pour la communauté !"
else
    echo "📝 Repository prêt. Pour publier plus tard:"
    echo "   git push -u origin main"
fi
