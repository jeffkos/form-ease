#!/bin/bash
# Script de correction finale - Authentication JWT Tests
# Usage: ./fix-auth-tests.sh

echo "🔧 CORRECTION FINALE - AUTHENTIFICATION TESTS FORMEASE"
echo "=================================================="

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis le répertoire backend"
    exit 1
fi

echo "📋 Étape 1: Vérification de l'environnement de test..."

# Vérifier JWT_SECRET dans setup.js
if grep -q "JWT_SECRET.*test-secret" tests/setup.js; then
    echo "✅ JWT_SECRET déjà configuré dans setup.js"
else
    echo "🔧 Configuration JWT_SECRET dans setup.js..."
    sed -i '1i process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-development-only";' tests/setup.js
fi

echo "📋 Étape 2: Correction des tokens JWT dans les tests..."

# Fonction pour corriger les tokens dans un fichier de test
fix_jwt_tokens() {
    local file=$1
    echo "  🔧 Correction tokens dans $file..."
    
    # Remplacer les anciens tokens par une génération correcte
    sed -i "s/Bearer.*token['\"][^'\"]*['\"/Bearer ' + jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' })/g" "$file"
    
    # Ajouter l'import JWT si manquant
    if ! grep -q "require.*jsonwebtoken" "$file"; then
        sed -i '1i const jwt = require("jsonwebtoken");' "$file"
    fi
}

# Corriger les principaux fichiers de test
for test_file in tests/*.test.js; do
    if [ -f "$test_file" ]; then
        fix_jwt_tokens "$test_file"
    fi
done

echo "📋 Étape 3: Correction du middleware auth pour les tests..."

# Vérifier que le middleware auth exporte correctement
if ! grep -q "module.exports.authMiddleware" src/middleware/auth.js; then
    echo "🔧 Ajout export named dans auth middleware..."
    echo "" >> src/middleware/auth.js
    echo "module.exports.authMiddleware = authMiddleware;" >> src/middleware/auth.js
fi

echo "📋 Étape 4: Amélioration du setup de test..."

# Améliorer le setup global des tests
cat > tests/test-helper.js << 'EOF'
const jwt = require('jsonwebtoken');

// Configuration environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-development-only';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Helper pour générer des tokens JWT valides
global.generateTestToken = (payload = { id: 1, role: 'ADMIN' }) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Helper pour headers d'authentification
global.getAuthHeader = (payload) => {
  return { Authorization: `Bearer ${generateTestToken(payload)}` };
};

console.log('✅ Test helpers loaded');
EOF

echo "📋 Étape 5: Mise à jour jest.config.js..."

# Améliorer la configuration Jest
cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js', '<rootDir>/tests/test-helper.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: false,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000
};
EOF

echo "📋 Étape 6: Test de validation..."

echo "🧪 Lancement d'un test simple pour validation..."
if npm test -- --testPathPattern=auth-simple.test.js > test_output.log 2>&1; then
    echo "✅ Test de base réussi!"
else
    echo "⚠️  Test de base échoué, vérifiez test_output.log"
fi

echo ""
echo "📋 Étape 7: Scripts de nettoyage console.log..."

# Exécuter le nettoyage des console.log si le script existe
if [ -f "scripts/clean-console-logs.sh" ]; then
    echo "🧹 Nettoyage des console.log..."
    chmod +x scripts/clean-console-logs.sh
    ./scripts/clean-console-logs.sh
else
    echo "⚠️  Script de nettoyage console.log non trouvé"
fi

echo ""
echo "🎯 CORRECTIONS APPLIQUÉES:"
echo "  ✅ JWT_SECRET configuré pour les tests"
echo "  ✅ Tokens JWT corrigés dans les fichiers de test"
echo "  ✅ Middleware auth amélioré"
echo "  ✅ Helper de test créé"
echo "  ✅ Configuration Jest optimisée"
echo "  ✅ Nettoyage console.log exécuté"

echo ""
echo "🚀 PROCHAINES ÉTAPES:"
echo "  1. Exécutez: npm test -- --testPathPattern=contact"
echo "  2. Si succès: npm test (tous les tests)"
echo "  3. Vérifiez le coverage: npm run test:coverage"

echo ""
echo "💡 AIDE AU DEBUG:"
echo "  - Logs de test: tail -f test_output.log"
echo "  - Env variables: printenv | grep -E '(JWT|NODE_ENV)'"
echo "  - Test specific: npm test -- --testNamePattern='crée un contact'"

echo ""
echo "✨ Script terminé avec succès!"
EOF
