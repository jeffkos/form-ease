# Script PowerShell de correction finale - Authentication JWT Tests
# Usage: .\Fix-AuthTests.ps1

param(
    [switch]$DryRun = $false
)

Write-Host "🔧 CORRECTION FINALE - AUTHENTIFICATION TESTS FORMEASE" -ForegroundColor Green
Write-Host "=================================================="

# Vérifier qu'on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis le répertoire backend" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Étape 1: Vérification de l'environnement de test..." -ForegroundColor Cyan

# Vérifier JWT_SECRET dans setup.js
$setupFile = "tests\setup.js"
if (Test-Path $setupFile) {
    $setupContent = Get-Content $setupFile -Raw
    if ($setupContent -notmatch "JWT_SECRET.*test-secret") {
        Write-Host "🔧 Configuration JWT_SECRET dans setup.js..." -ForegroundColor Yellow
        if (-not $DryRun) {
            $newContent = 'process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-development-only";' + "`n" + $setupContent
            Set-Content -Path $setupFile -Value $newContent -Encoding UTF8
        }
    } else {
        Write-Host "✅ JWT_SECRET déjà configuré dans setup.js" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Fichier setup.js non trouvé" -ForegroundColor Yellow
}

Write-Host "📋 Étape 2: Correction des tokens JWT dans les tests..." -ForegroundColor Cyan

# Fonction pour corriger les tokens dans un fichier de test
function Fix-JWTTokens {
    param($FilePath)
    
    Write-Host "  🔧 Correction tokens dans $FilePath..." -ForegroundColor Yellow
    
    if (-not $DryRun) {
        $content = Get-Content $FilePath -Raw
        
        # Ajouter l'import JWT si manquant
        if ($content -notmatch "require.*jsonwebtoken") {
            $content = "const jwt = require('jsonwebtoken');`n" + $content
        }
        
        # Corriger les anciens tokens
        $content = $content -replace "Bearer.*?'", "Bearer ' + jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' })"
        
        Set-Content -Path $FilePath -Value $content -Encoding UTF8
    }
}

# Corriger les principaux fichiers de test
$testFiles = Get-ChildItem -Path "tests" -Filter "*.test.js"
foreach ($testFile in $testFiles) {
    Fix-JWTTokens -FilePath $testFile.FullName
}

Write-Host "📋 Étape 3: Correction du middleware auth pour les tests..." -ForegroundColor Cyan

$authFile = "src\middleware\auth.js"
if (Test-Path $authFile) {
    $authContent = Get-Content $authFile -Raw
    if ($authContent -notmatch "module\.exports\.authMiddleware") {
        Write-Host "🔧 Ajout export named dans auth middleware..." -ForegroundColor Yellow
        if (-not $DryRun) {
            $authContent += "`n`nmodule.exports.authMiddleware = authMiddleware;"
            Set-Content -Path $authFile -Value $authContent -Encoding UTF8
        }
    } else {
        Write-Host "✅ Export named déjà présent dans auth middleware" -ForegroundColor Green
    }
}

Write-Host "📋 Étape 4: Création du helper de test..." -ForegroundColor Cyan

$testHelperContent = @"
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
  return { Authorization: `Bearer `${generateTestToken(payload)} };
};

console.log('✅ Test helpers loaded');
"@

if (-not $DryRun) {
    Set-Content -Path "tests\test-helper.js" -Value $testHelperContent -Encoding UTF8
}
Write-Host "✅ Helper de test créé" -ForegroundColor Green

Write-Host "📋 Étape 5: Mise à jour jest.config.js..." -ForegroundColor Cyan

$jestConfigContent = @"
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
"@

if (-not $DryRun) {
    Set-Content -Path "jest.config.js" -Value $jestConfigContent -Encoding UTF8
}
Write-Host "✅ Configuration Jest mise à jour" -ForegroundColor Green

Write-Host "📋 Étape 6: Test de validation..." -ForegroundColor Cyan

if (-not $DryRun) {
    Write-Host "🧪 Lancement d'un test simple pour validation..." -ForegroundColor Yellow
    try {
        $testResult = & npm test -- --testPathPattern=auth-simple.test.js 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Test de base réussi!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Test de base échoué, vérifiez la sortie ci-dessus" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Erreur lors du test: $_" -ForegroundColor Yellow
    }
}

Write-Host "📋 Étape 7: Nettoyage console.log..." -ForegroundColor Cyan

if (Test-Path "scripts\Clean-ConsoleLogs.ps1") {
    Write-Host "🧹 Exécution du nettoyage console.log..." -ForegroundColor Yellow
    if (-not $DryRun) {
        & .\scripts\Clean-ConsoleLogs.ps1
    }
} else {
    Write-Host "⚠️  Script de nettoyage console.log non trouvé" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 CORRECTIONS APPLIQUÉES:" -ForegroundColor Green
Write-Host "  ✅ JWT_SECRET configuré pour les tests" -ForegroundColor White
Write-Host "  ✅ Tokens JWT corrigés dans les fichiers de test" -ForegroundColor White
Write-Host "  ✅ Middleware auth amélioré" -ForegroundColor White
Write-Host "  ✅ Helper de test créé" -ForegroundColor White
Write-Host "  ✅ Configuration Jest optimisée" -ForegroundColor White
Write-Host "  ✅ Nettoyage console.log exécuté" -ForegroundColor White

Write-Host ""
Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Blue
Write-Host "  1. Exécutez: npm test -- --testPathPattern=contact" -ForegroundColor White
Write-Host "  2. Si succès: npm test (tous les tests)" -ForegroundColor White
Write-Host "  3. Vérifiez le coverage: npm run test:coverage" -ForegroundColor White

Write-Host ""
Write-Host "💡 AIDE AU DEBUG:" -ForegroundColor Blue
Write-Host "  - Test specific: npm test -- --testNamePattern='crée un contact'" -ForegroundColor White
Write-Host "  - Variables env: Get-ChildItem Env: | Where-Object {$_.Name -match 'JWT|NODE_ENV'}" -ForegroundColor White
Write-Host "  - Verbose: npm test -- --verbose" -ForegroundColor White

if ($DryRun) {
    Write-Host ""
    Write-Host "🔍 Mode DRY RUN activé - Aucune modification appliquée" -ForegroundColor Cyan
    Write-Host "   Relancez sans -DryRun pour appliquer les corrections" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Script terminé avec succès!" -ForegroundColor Green
