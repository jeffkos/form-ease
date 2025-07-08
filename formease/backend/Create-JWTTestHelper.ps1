# Script PowerShell pour créer automatiquement le helper JWT
param(
    [string]$BackendPath = ".",
    [switch]$Force = $false
)

Write-Host "🚀 Création du JWT Test Helper pour FormEase..." -ForegroundColor Cyan

# Configuration
$testsDir = Join-Path $BackendPath "tests"
$helpersDir = Join-Path $testsDir "helpers"  
$setupDir = Join-Path $testsDir "setup"

# Créer les répertoires si nécessaire
@($testsDir, $helpersDir, $setupDir) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force
        Write-Host "📁 Créé: $_" -ForegroundColor Green
    }
}

# Contenu du JWT Test Helper
$jwtHelperContent = @'
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

  static getMockUser(overrides = {}) {
    return {
      id: 1,
      email: 'test@formease.com',
      role: 'USER',
      plan: 'free',
      plan_expiration: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static getMockAdminUser(overrides = {}) {
    return this.getMockUser({
      role: 'ADMIN',
      ...overrides
    });
  }
}

module.exports = JWTTestHelper;
'@

# Contenu du setup de tests
$setupTestsContent = @'
const jwt = require('jsonwebtoken');

// Configuration des variables de test
global.JWT_TEST_SECRET = 'test-secret-formease-2024';
process.env.JWT_SECRET = global.JWT_TEST_SECRET;
process.env.NODE_ENV = 'test';

// Mock du middleware d'authentification
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
  console.log('🧪 Configuration des tests JWT...');
});

afterAll(async () => {
  console.log('✅ Tests terminés');
});
'@

# Contenu du fichier .env.test
$envTestContent = @'
# Configuration de test FormEase
JWT_SECRET=test-secret-formease-2024
JWT_EXPIRES_IN=24h
NODE_ENV=test
DATABASE_URL="file:./test.db"

# Variables Stripe de test
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# Variables d'email de test
MAILERSEND_API_TOKEN=test_token
FROM_EMAIL=test@formease.com
'@

# Créer les fichiers
$files = @{
    (Join-Path $helpersDir "jwtTestHelper.js") = $jwtHelperContent
    (Join-Path $setupDir "setupTests.js") = $setupTestsContent
    (Join-Path $BackendPath ".env.test") = $envTestContent
}

foreach ($file in $files.Keys) {
    if ((Test-Path $file) -and !$Force) {
        Write-Host "⚠️  Existe déjà: $file (utilisez -Force pour écraser)" -ForegroundColor Yellow
    } else {
        Set-Content -Path $file -Value $files[$file] -Encoding UTF8
        Write-Host "✅ Créé: $file" -ForegroundColor Green
    }
}

# Mettre à jour le jest.config.js
$jestConfigPath = Join-Path $BackendPath "jest.config.js"
$jestConfig = @'
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**'
  ],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  // Timeout plus long pour les tests d'intégration
  testTimeout: 10000
};
'@

if (!(Test-Path $jestConfigPath) -or $Force) {
    Set-Content -Path $jestConfigPath -Value $jestConfig -Encoding UTF8
    Write-Host "✅ Créé: jest.config.js" -ForegroundColor Green
} else {
    Write-Host "⚠️  jest.config.js existe déjà" -ForegroundColor Yellow
}

# Créer un test de validation
$validationTestContent = @'
const JWTTestHelper = require('../helpers/jwtTestHelper');
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

  test('token expiré détecté', () => {
    const expiredToken = JWTTestHelper.generateExpiredToken();
    
    expect(() => {
      jwt.verify(expiredToken, process.env.JWT_SECRET);
    }).toThrow('jwt expired');
  });
});
'@

$validationTestPath = Join-Path $testsDir "jwt-validation.test.js"
if (!(Test-Path $validationTestPath) -or $Force) {
    Set-Content -Path $validationTestPath -Value $validationTestContent -Encoding UTF8
    Write-Host "✅ Créé: jwt-validation.test.js" -ForegroundColor Green
}

Write-Host "`n🎯 Configuration JWT Helper terminée!" -ForegroundColor Green
Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Exécuter: npm test -- tests/jwt-validation.test.js" -ForegroundColor White
Write-Host "2. Migrer les tests existants avec les nouveaux helpers" -ForegroundColor White  
Write-Host "3. Exécuter: npm test pour valider" -ForegroundColor White

Write-Host "`n📁 Fichiers créés:" -ForegroundColor Cyan
Write-Host "- tests/helpers/jwtTestHelper.js" -ForegroundColor White
Write-Host "- tests/setup/setupTests.js" -ForegroundColor White
Write-Host "- .env.test" -ForegroundColor White
Write-Host "- jest.config.js" -ForegroundColor White
Write-Host "- tests/jwt-validation.test.js" -ForegroundColor White

Write-Host "`n🚀 Le backend FormEase est maintenant configuré pour des tests JWT fiables!" -ForegroundColor Green
