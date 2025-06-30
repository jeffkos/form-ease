#!/bin/bash

# Script d'initialisation complète de FormEase
# Usage: ./init-project.sh

echo "🚀 Initialisation complète de FormEase..."

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage coloré
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Vérification des prérequis
echo "📦 Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi
print_status "Node.js $(node --version) détecté"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi
print_status "npm $(npm --version) détecté"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL non détecté. Veuillez l'installer et configurer manuellement"
else
    print_status "PostgreSQL détecté"
fi

# Installation des dépendances
echo ""
echo "📦 Installation des dépendances..."

# Backend
print_info "Installation dépendances backend..."
cd formease/backend
if npm install; then
    print_status "Dépendances backend installées"
else
    print_error "Échec installation backend"
    exit 1
fi

# Frontend
print_info "Installation dépendances frontend..."
cd ../frontend
if npm install; then
    print_status "Dépendances frontend installées"
else
    print_error "Échec installation frontend"
    exit 1
fi

# Retour à la racine
cd ../..

# Configuration des variables d'environnement
echo ""
echo "🔧 Configuration des variables d'environnement..."

# Backend .env
if [ ! -f "formease/backend/.env" ]; then
    cp formease/backend/.env.example formease/backend/.env
    print_status "Fichier .env backend créé à partir de l'exemple"
    print_warning "IMPORTANT: Éditez formease/backend/.env avec vos vraies valeurs"
else
    print_info "Fichier .env backend existe déjà"
fi

# Frontend .env.local
if [ ! -f "formease/frontend/.env.local" ]; then
    cat > formease/frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOL
    print_status "Fichier .env.local frontend créé"
else
    print_info "Fichier .env.local frontend existe déjà"
fi

# Génération de clé JWT
echo ""
echo "🔐 Génération de clé JWT sécurisée..."
cd formease/backend
if npm run generate-jwt-secret; then
    print_status "Clé JWT générée et mise à jour dans .env"
else
    print_warning "Impossible de générer automatiquement la clé JWT"
fi

# Configuration base de données
echo ""
echo "💾 Configuration de la base de données..."

# Vérifier si PostgreSQL est accessible
if command -v psql &> /dev/null; then
    print_info "Tentative de création de la base de données..."
    
    # Essayer de créer la base de données
    if psql -U postgres -c "CREATE DATABASE formease_db;" 2>/dev/null; then
        print_status "Base de données 'formease_db' créée"
    else
        print_warning "Base de données 'formease_db' existe déjà ou erreur de connexion"
    fi
    
    # Générer le client Prisma
    print_info "Génération du client Prisma..."
    if npx prisma generate; then
        print_status "Client Prisma généré"
    else
        print_error "Échec génération client Prisma"
    fi
    
    # Exécuter les migrations
    print_info "Exécution des migrations Prisma..."
    if npx prisma migrate dev --name init; then
        print_status "Migrations Prisma exécutées"
    else
        print_warning "Échec migrations Prisma - vérifiez la connexion DB"
    fi
    
else
    print_warning "PostgreSQL non accessible - configuration manuelle requise"
    echo "  1. Installez PostgreSQL"
    echo "  2. Créez la base: createdb formease_db"
    echo "  3. Lancez: cd formease/backend && npx prisma migrate dev"
fi

# Tests de validation
echo ""
echo "🧪 Tests de validation..."

# Test build frontend
print_info "Test build frontend..."
cd ../frontend
if npm run build; then
    print_status "Build frontend réussi"
else
    print_error "Échec build frontend"
fi

# Test backend (sans Prisma pour éviter erreurs DB)
print_info "Test syntaxe backend..."
cd ../backend
if node -c src/app.js; then
    print_status "Syntaxe backend validée"
else
    print_error "Erreurs syntaxe backend"
fi

# Retour à la racine
cd ../..

# Résumé final
echo ""
echo "🎉 Initialisation terminée !"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo ""
echo "1. 🔧 Configurez vos variables d'environnement:"
echo "   - Éditez: formease/backend/.env"
echo "   - Configurez: DATABASE_URL, SMTP_*, JWT_SECRET"
echo ""
echo "2. 🚀 Démarrez les services:"
echo "   - Backend:  cd formease/backend && npm run dev"
echo "   - Frontend: cd formease/frontend && npm run dev"
echo ""
echo "3. 🌐 Accédez à l'application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:4000"
echo ""
echo "4. 📚 Consultez la documentation:"
echo "   - README.md pour vue d'ensemble"
echo "   - INSTALLATION.md pour détails"
echo "   - CONTRIBUTING.md pour contribuer"
echo ""
print_status "FormEase est prêt à être utilisé !"
