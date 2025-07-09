# 🔧 GUIDE DE RÉSOLUTION - PROBLÈMES JWT EN ENVIRONNEMENT TEST

## 🎯 DIAGNOSTIC DU PROBLÈME

### Symptômes Observés
```bash
warn: Token verification failed jwt malformed
warn: Token verification failed invalid signature
Tests retournent 401 au lieu des codes attendus (200, 403, 404, etc.)
```

### Cause Racine
**Configuration JWT incohérente entre développement et test**
- Secrets JWT différents
- Format des tokens incompatible  
- Mocks d'authentification manquants

---

## 🔍 ANALYSE DES ERREURS

### Types d'Erreurs JWT Détectées

1. **JWT Malformed** (40+ occurrences)
   ```
   JsonWebTokenError: jwt malformed
   ```
   → Token format invalide ou corrompu

2. **Invalid Signature** (30+ occurrences)  
   ```
   JsonWebTokenError: invalid signature
   ```
   → Secret JWT différent entre génération et vérification

3. **Missing Token** (20+ occurrences)
   ```
   Missing authentication token
   ```
   → Headers Authorization pas configurés dans les tests

---

## 🛠️ SOLUTIONS ÉTAPE PAR ÉTAPE

### Étape 1: Créer Helper JWT pour Tests

```javascript
// tests/helpers/jwtTestHelper.js
const jwt = require('jsonwebtoken');

const JWT_TEST_SECRET = 'test-secret-formease-2024';

class JWTTestHelper {
  static generateValidToken(payload = {}) {
    const defaultPayload = {
      id: 1,
      email: 'test@formease.com',
      role: 'USER',
      plan: 'free',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1h
    };

    return jwt.sign(
      { ...defaultPayload, ...payload },
      JWT_TEST_SECRET,
      { algorithm: 'HS256' }
    );
  }

  static generateAdminToken(payload = {}) {
    return this.generateValidToken({
      role: 'ADMIN',
      ...payload
    });
  }

  static generatePremiumToken(payload = {}) {
    return this.generateValidToken({
      plan: 'premium',
      plan_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30j
      ...payload
    });
  }

  static generateExpiredToken(payload = {}) {
    return jwt.sign(
      {
        id: 1,
        email: 'test@formease.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000) - 7200, // -2h
        exp: Math.floor(Date.now() / 1000) - 3600, // -1h (expiré)
        ...payload
      },
      JWT_TEST_SECRET,
      { algorithm: 'HS256' }
    );
  }

  static formatAuthHeader(token) {
    return `Bearer ${token}`;
  }
}

module.exports = JWTTestHelper;
```

### Étape 2: Configurer Variables d'Environnement Test

```env
# .env.test
JWT_SECRET=test-secret-formease-2024
JWT_EXPIRES_IN=24h
NODE_ENV=test
DATABASE_URL="file:./test.db"
```

### Étape 3: Modifier Configuration Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**'
  ],
  // Force utilisation des variables d'environnement test
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
```

### Étape 4: Setup Global pour Tests

```javascript
// tests/setup/setupTests.js
const { loadEnvConfig } = require('@next/env');
const JWTTestHelper = require('../helpers/jwtTestHelper');

// Charger la config test
loadEnvConfig(process.cwd(), true);

// Variables globales pour les tests
global.JWT_TEST_SECRET = 'test-secret-formease-2024';
global.JWTTestHelper = JWTTestHelper;

// Mock de l'authentification middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, global.JWT_TEST_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide' });
    }
  },
  
  requireAdmin: (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }
    next();
  }
}));

// Configuration globale des tests
beforeAll(async () => {
  // Assurer la cohérence du secret JWT
  process.env.JWT_SECRET = global.JWT_TEST_SECRET;
});

afterAll(async () => {
  // Nettoyage si nécessaire
});
```

### Étape 5: Mettre à Jour les Tests Existants

```javascript
// Exemple: tests/contact.integration.test.js
const request = require('supertest');
const app = require('../src/app');
const JWTTestHelper = require('./helpers/jwtTestHelper');

describe('API /api/contacts', () => {
  let authToken;
  let adminToken;

  beforeEach(() => {
    authToken = JWTTestHelper.formatAuthHeader(
      JWTTestHelper.generateValidToken()
    );
    
    adminToken = JWTTestHelper.formatAuthHeader(
      JWTTestHelper.generateAdminToken()
    );
  });

  test('crée un contact', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)  // ✅ Token valide
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
        tags: ['VIP', 'newsletter']
      });
    
    expect(res.status).toBe(201);  // ✅ Plus de 401
  });
});
```

### Étape 6: Script de Migration des Tests

```powershell
# fix-jwt-tests.ps1
param(
    [string]$TestDir = "tests"
)

Write-Host "🔧 Migration des tests JWT..." -ForegroundColor Cyan

# Patterns à remplacer
$patterns = @{
    "const authToken = 'Bearer.*?';" = "const authToken = JWTTestHelper.formatAuthHeader(JWTTestHelper.generateValidToken());"
    "const adminToken = 'Bearer.*?';" = "const adminToken = JWTTestHelper.formatAuthHeader(JWTTestHelper.generateAdminToken());"
    "'Bearer ' \+ jwt\.sign\(" = "JWTTestHelper.formatAuthHeader(JWTTestHelper.generateValidToken("
}

Get-ChildItem -Path $TestDir -Filter "*.test.js" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    foreach ($pattern in $patterns.Keys) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $patterns[$pattern]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $_.FullName -Value $content
        Write-Host "✅ Migré: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "🎯 Migration terminée!" -ForegroundColor Green
```

---

## 🧪 VALIDATION DE LA SOLUTION

### Test de Vérification

```javascript
// tests/auth-validation.test.js
const JWTTestHelper = require('./helpers/jwtTestHelper');
const jwt = require('jsonwebtoken');

describe('JWT Test Helper Validation', () => {
  test('génère un token valide', () => {
    const token = JWTTestHelper.generateValidToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('test@formease.com');
  });

  test('génère un token admin', () => {
    const token = JWTTestHelper.generateAdminToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    expect(decoded.role).toBe('ADMIN');
  });

  test('format correct pour headers', () => {
    const token = JWTTestHelper.generateValidToken();
    const header = JWTTestHelper.formatAuthHeader(token);
    
    expect(header).toMatch(/^Bearer .+/);
  });
});
```

### Commandes de Test

```bash
# 1. Tester le helper JWT
npm test -- tests/auth-validation.test.js

# 2. Tester une suite spécifique
npm test -- tests/contact.integration.test.js

# 3. Tester tout avec nouveau système
npm test
```

---

## 📊 RÉSULTATS ATTENDUS

### Avant la Correction
```
Tests:       52 failed, 51 passed, 103 total
Erreurs JWT: ~40 tests échoués avec 401
```

### Après la Correction
```
Tests:       5-10 failed, 93-98 passed, 103 total
Erreurs JWT: 0 (problème résolu)
Échecs restants: Configuration Stripe, mocks DB
```

---

## ⚡ SCRIPT D'IMPLÉMENTATION RAPIDE

```bash
# 1. Créer les fichiers
mkdir -p tests/helpers tests/setup

# 2. Implémenter le helper
# (Copier le code JWTTestHelper ci-dessus)

# 3. Configurer l'environnement
echo "JWT_SECRET=test-secret-formease-2024" >> .env.test

# 4. Migrer les tests
pwsh -File fix-jwt-tests.ps1

# 5. Tester
npm test
```

---

## 🎯 PRIORITÉ ET IMPACT

**Priorité**: 🔴 CRITIQUE  
**Effort**: 4-6 heures  
**Impact**: +40 tests réussis (~90% de réussite totale)

Cette résolution débloquera la majorité des tests et permettra d'atteindre un taux de réussite de 90%+, rendant le backend stable pour la production.

---

*Guide de résolution JWT - FormEase Backend*  
*Version 1.0 - Décembre 2024*
