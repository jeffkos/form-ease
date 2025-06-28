#!/bin/bash
# Script de test manuel FormEase
# Usage: ./test-manual.sh

echo "🧪 DÉMARRAGE DES TESTS MANUELS FORMEASE"
echo "======================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "${BLUE}📋 1. TESTS BACKEND${NC}"
echo "===================="

# Test 1: Vérification du démarrage backend
echo "🔍 Test: Démarrage du serveur backend..."
cd formease/backend
npm start &
BACKEND_PID=$!
sleep 3

# Vérifier si le processus tourne
if kill -0 $BACKEND_PID 2>/dev/null; then
    test_result 0 "Backend démarre correctement"
else
    test_result 1 "Backend échoue au démarrage"
fi

# Test 2: API Health Check
echo "🔍 Test: API Health Check..."
curl -s http://localhost:4000/health > /dev/null
test_result $? "API Health Check"

# Test 3: Authentification API
echo "🔍 Test: Route d'authentification..."
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' > /dev/null
test_result $? "Route d'authentification répond"

echo -e "\n${BLUE}📋 2. TESTS FRONTEND${NC}"
echo "====================="

cd ../frontend

# Test 4: Build frontend
echo "🔍 Test: Build production frontend..."
npm run build > /dev/null 2>&1
test_result $? "Build frontend réussi"

# Test 5: Démarrage dev server
echo "🔍 Test: Démarrage serveur de développement..."
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 5

# Vérifier si le frontend répond
curl -s http://localhost:3000 > /dev/null || curl -s http://localhost:3001 > /dev/null || curl -s http://localhost:3002 > /dev/null
test_result $? "Frontend accessible"

echo -e "\n${BLUE}📋 3. TESTS FONCTIONNELS${NC}"
echo "=========================="

# Test 6: Pages principales
echo "🔍 Test: Pages principales accessibles..."
PAGES=("/" "/login" "/dashboard" "/docs" "/features")
ALL_PAGES_OK=0

for page in "${PAGES[@]}"; do
    curl -s "http://localhost:3002${page}" > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅${NC} Page ${page}"
    else
        echo -e "  ${RED}❌${NC} Page ${page}"
        ALL_PAGES_OK=1
    fi
done

test_result $ALL_PAGES_OK "Toutes les pages principales"

echo -e "\n${BLUE}📋 4. TESTS DE SÉCURITÉ${NC}"
echo "========================"

# Test 7: Headers de sécurité
echo "🔍 Test: Headers de sécurité..."
SECURITY_HEADERS=$(curl -s -I http://localhost:4000/api/auth/login | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)")
if [ ! -z "$SECURITY_HEADERS" ]; then
    test_result 0 "Headers de sécurité présents"
else
    test_result 1 "Headers de sécurité manquants"
fi

# Test 8: Rate limiting
echo "🔍 Test: Rate limiting..."
for i in {1..10}; do
    curl -s -X POST http://localhost:4000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"test"}' > /dev/null
done

# Le 11e appel devrait être rate limité
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' | grep -q "Too Many Requests"
test_result $? "Rate limiting actif"

echo -e "\n${BLUE}📋 5. NETTOYAGE${NC}"
echo "==============="

# Arrêter les processus
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "🧹 Processus arrêtés"

echo -e "\n${GREEN}🎉 TESTS MANUELS TERMINÉS${NC}"
echo "=========================="
echo "📊 Consultez le rapport détaillé dans RAPPORT_TESTS_COMPLETS.md"
echo "🔧 Pour les corrections, voir CORRECTIONS_IMPLEMENTEES.md"
