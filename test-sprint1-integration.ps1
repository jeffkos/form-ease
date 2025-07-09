#!/usr/bin/env pwsh
# Script PowerShell pour exécuter tous les tests d'intégration Sprint 1

Write-Host "🚀 LANCEMENT TESTS D'INTÉGRATION SPRINT 1" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# Variables
$BackendPath = "c:\Users\Jeff KOSI\Desktop\FormEase\formease\backend"
$TestResults = @()

# Fonction pour exécuter un test et capturer les résultats
function Run-Test {
    param(
        [string]$TestFile,
        [string]$Description
    )
    
    Write-Host "`n🧪 Test: $Description" -ForegroundColor Yellow
    Write-Host "Fichier: $TestFile" -ForegroundColor Gray
    
    try {
        $Result = & npm test $TestFile 2>&1
        $ExitCode = $LASTEXITCODE
        
        if ($ExitCode -eq 0) {
            Write-Host "✅ SUCCÈS" -ForegroundColor Green
            $TestResults += @{
                Test = $Description
                Status = "PASS"
                Details = "Tous les tests passent"
            }
        } else {
            Write-Host "❌ ÉCHEC" -ForegroundColor Red
            $TestResults += @{
                Test = $Description
                Status = "FAIL"
                Details = $Result | Select-String "failing|error" | Select-Object -First 3
            }
        }
    } catch {
        Write-Host "❌ ERREUR D'EXÉCUTION" -ForegroundColor Red
        $TestResults += @{
            Test = $Description
            Status = "ERROR"
            Details = $_.Exception.Message
        }
    }
}

# Changer vers le répertoire backend
Set-Location $BackendPath

Write-Host "`n📋 Vérification de l'environnement..." -ForegroundColor Cyan

# Vérifier que Jest est installé
if (-not (Test-Path "node_modules\.bin\jest.cmd")) {
    Write-Host "⚠️ Jest non trouvé, installation..." -ForegroundColor Yellow
    npm install --save-dev jest supertest
}

# Vérifier les variables d'environnement de test
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ Fichier .env manquant, création depuis .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "`n🎯 EXÉCUTION DES TESTS SPRINT 1" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Tests des quotas et limitations
Run-Test "tests/quota.integration.test.js" "Système de Quotas et Limitations"

# 2. Tests des paiements Stripe
Run-Test "tests/payment.integration.test.js" "Paiements et Abonnements Stripe"

# 3. Tests des formulaires payants
Run-Test "tests/form-payment.integration.test.js" "Formulaires Payants"

# 4. Suite complète d'intégration
Run-Test "tests/sprint1.integration.test.js" "Suite Complète Sprint 1"

# 5. Tests existants (pour non-régression)
Write-Host "`n🔄 Tests de Non-Régression" -ForegroundColor Cyan
Run-Test "tests/auth.test.js" "Authentification (Non-régression)"
Run-Test "tests/validation.test.js" "Validation (Non-régression)"

Write-Host "`n📊 RAPPORT FINAL DES TESTS" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Cyan

$PassCount = ($TestResults | Where-Object { $_.Status -eq "PASS" }).Count
$FailCount = ($TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
$ErrorCount = ($TestResults | Where-Object { $_.Status -eq "ERROR" }).Count
$TotalCount = $TestResults.Count

Write-Host "`nRésumé:" -ForegroundColor White
Write-Host "✅ Tests réussis: $PassCount" -ForegroundColor Green
Write-Host "❌ Tests échoués: $FailCount" -ForegroundColor Red
Write-Host "⚠️ Erreurs: $ErrorCount" -ForegroundColor Yellow
Write-Host "📋 Total: $TotalCount" -ForegroundColor Cyan

# Détails des échecs
if ($FailCount -gt 0 -or $ErrorCount -gt 0) {
    Write-Host "`n🔍 DÉTAILS DES ÉCHECS:" -ForegroundColor Red
    $TestResults | Where-Object { $_.Status -ne "PASS" } | ForEach-Object {
        Write-Host "`n• $($_.Test)" -ForegroundColor Yellow
        Write-Host "  Status: $($_.Status)" -ForegroundColor Red
        Write-Host "  Détails: $($_.Details)" -ForegroundColor Gray
    }
}

# Score final
$SuccessRate = [math]::Round(($PassCount / $TotalCount) * 100, 1)
Write-Host "`n🎯 TAUX DE RÉUSSITE: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -ge 80) { "Green" } elseif ($SuccessRate -ge 60) { "Yellow" } else { "Red" })

if ($SuccessRate -eq 100) {
    Write-Host "`n🎉 SPRINT 1 - TOUS LES TESTS PASSENT!" -ForegroundColor Green
    Write-Host "FormEase est prêt pour la production!" -ForegroundColor Cyan
} elseif ($SuccessRate -ge 80) {
    Write-Host "`n✅ SPRINT 1 - Tests majoritairement réussis" -ForegroundColor Yellow
    Write-Host "Quelques ajustements mineurs nécessaires" -ForegroundColor Gray
} else {
    Write-Host "`n⚠️ SPRINT 1 - Tests nécessitent attention" -ForegroundColor Red
    Write-Host "Corrections requises avant déploiement" -ForegroundColor Gray
}

Write-Host "`n📝 Tests d'intégration Sprint 1 terminés." -ForegroundColor Cyan
Write-Host "Logs détaillés disponibles dans le terminal ci-dessus." -ForegroundColor Gray

# Retourner au répertoire original
Set-Location $PSScriptRoot
