# Script PowerShell de nettoyage des console.log
# Usage: .\scripts\Clean-ConsoleLogs.ps1

param(
    [switch]$DryRun = $false,
    [switch]$Backup = $true
)

Write-Host "🧹 Début du nettoyage des console.log dans le backend FormEase..." -ForegroundColor Green

# Vérifier si nous sommes dans le bon répertoire
if (-not (Test-Path "src")) {
    Write-Host "❌ Erreur: Le répertoire 'src' n'existe pas. Exécutez ce script depuis le répertoire backend." -ForegroundColor Red
    exit 1
}

# Créer une sauvegarde si demandé
if ($Backup) {
    $backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "📦 Création d'une sauvegarde dans: $backupDir" -ForegroundColor Blue
    Copy-Item -Path "src" -Destination $backupDir -Recurse
}

# Compter les occurrences avant nettoyage
$consoleCountBefore = (Select-String -Path "src\*.js" -Pattern "console\." -Recurse).Count
Write-Host "📊 Console.log détectés avant nettoyage: $consoleCountBefore" -ForegroundColor Yellow

# Fonction pour ajouter l'import logger
function Add-LoggerImport {
    param($FilePath)
    
    $content = Get-Content $FilePath
    $hasLogger = $content | Where-Object { $_ -match "require.*logger|import.*logger" }
    
    if (-not $hasLogger) {
        # Déterminer le chemin relatif
        $depth = ($FilePath -split "\\").Count - ($PWD.Path -split "\\").Count - 1
        $relativePath = switch ($depth) {
            1 { "./utils/logger" }
            2 { "../utils/logger" }
            3 { "../../utils/logger" }
            default { "../utils/logger" }
        }
        
        # Ajouter l'import en première ligne
        $newContent = @("const logger = require('$relativePath');") + $content
        
        if (-not $DryRun) {
            Set-Content -Path $FilePath -Value $newContent -Encoding UTF8
        }
        Write-Host "  ✅ Import logger ajouté dans: $FilePath" -ForegroundColor Green
    }
}

# Fonction pour remplacer les console.*
function Replace-ConsoleLogs {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $changed = $false
    
    # Remplacements avec patterns regex améliorés
    $replacements = @{
        'console\.log\(([^)]*)\);' = 'logger.info($1, { timestamp: new Date().toISOString() });'
        'console\.error\(([^)]*)\);' = 'logger.error($1, { timestamp: new Date().toISOString() });'
        'console\.warn\(([^)]*)\);' = 'logger.warn($1, { timestamp: new Date().toISOString() });'
        'console\.info\(([^)]*)\);' = 'logger.info($1, { timestamp: new Date().toISOString() });'
        'console\.debug\(([^)]*)\);' = 'logger.debug($1, { timestamp: new Date().toISOString() });'
    }
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $changed = $true
        }
    }
    
    # Patterns spéciaux pour template literals
    if ($content -match 'console\.log\(`([^`]*)`\);') {
        $content = $content -replace 'console\.log\(`([^`]*)`\);', 'logger.info(`$1`, { timestamp: new Date().toISOString() });'
        $changed = $true
    }
    
    if ($changed -and -not $DryRun) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  ✅ Console.* remplacés dans: $FilePath" -ForegroundColor Green
    } elseif ($changed) {
        Write-Host "  🔍 [DRY RUN] Console.* détectés dans: $FilePath" -ForegroundColor Yellow
    }
    
    return $changed
}

# Traitement des fichiers JavaScript
$jsFiles = Get-ChildItem -Path "src" -Filter "*.js" -Recurse
$modifiedFiles = @()

foreach ($file in $jsFiles) {
    Write-Host "🔍 Traitement de: $($file.FullName)" -ForegroundColor Cyan
    
    # Vérifier si le fichier contient des console.*
    $hasConsole = Select-String -Path $file.FullName -Pattern "console\." -Quiet
    
    if ($hasConsole) {
        Write-Host "  📝 Console.* détecté dans $($file.Name)" -ForegroundColor Yellow
        
        # Ajouter l'import logger
        Add-LoggerImport -FilePath $file.FullName
        
        # Remplacer les console.*
        $wasModified = Replace-ConsoleLogs -FilePath $file.FullName
        
        if ($wasModified) {
            $modifiedFiles += $file.FullName
        }
    }
}

# Compter les occurrences après nettoyage
$consoleCountAfter = (Select-String -Path "src\*.js" -Pattern "console\." -Recurse).Count
$cleanedCount = $consoleCountBefore - $consoleCountAfter

# Statistiques finales
Write-Host ""
Write-Host "📈 RÉSULTATS DU NETTOYAGE:" -ForegroundColor Green
Write-Host "  🔄 Console.* traités: $cleanedCount" -ForegroundColor Yellow
Write-Host "  ⚠️  Console.* restants: $consoleCountAfter" -ForegroundColor $(if ($consoleCountAfter -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "  📁 Fichiers modifiés: $($modifiedFiles.Count)" -ForegroundColor Blue

if ($Backup) {
    Write-Host "  📦 Sauvegarde créée dans: $backupDir" -ForegroundColor Blue
}

# Vérifications post-nettoyage
Write-Host ""
Write-Host "🔍 VÉRIFICATIONS POST-NETTOYAGE:" -ForegroundColor Green

# Vérifier les imports logger
$filesWithLogger = Select-String -Path "src\*.js" -Pattern "logger\." -Recurse | Select-Object -ExpandProperty Path -Unique
$filesWithoutImport = @()

foreach ($file in $filesWithLogger) {
    $hasImport = Select-String -Path $file -Pattern "require.*logger|import.*logger" -Quiet
    if (-not $hasImport) {
        $filesWithoutImport += $file
    }
}

if ($filesWithoutImport.Count -gt 0) {
    Write-Host "  ⚠️  $($filesWithoutImport.Count) fichiers utilisent logger sans l'importer" -ForegroundColor Yellow
    $filesWithoutImport | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
} else {
    Write-Host "  ✅ Tous les imports logger sont corrects" -ForegroundColor Green
}

# Vérification de la syntaxe JavaScript (si Node.js est disponible)
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  🔍 Vérification de la syntaxe JavaScript..." -ForegroundColor Cyan
    $syntaxErrors = 0
    
    foreach ($file in $jsFiles) {
        try {
            $result = & node -c $file.FullName 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "    ❌ Erreur de syntaxe dans: $($file.Name)" -ForegroundColor Red
                $syntaxErrors++
            }
        }
        catch {
            Write-Host "    ❌ Erreur lors de la vérification de: $($file.Name)" -ForegroundColor Red
            $syntaxErrors++
        }
    }
    
    if ($syntaxErrors -eq 0) {
        Write-Host "  ✅ Aucune erreur de syntaxe détectée" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $syntaxErrors erreurs de syntaxe détectées" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🏁 Nettoyage terminé!" -ForegroundColor Green

if (-not $DryRun) {
    Write-Host "💡 Prochaines étapes:" -ForegroundColor Blue
    Write-Host "   1. Vérifiez les changements: git diff" -ForegroundColor White
    Write-Host "   2. Testez l'application: npm test" -ForegroundColor White
    Write-Host "   3. Commitez si tout fonctionne: git add . && git commit -m 'Clean console.log and add proper logging'" -ForegroundColor White
} else {
    Write-Host "💡 Ceci était un aperçu (DRY RUN). Relancez sans -DryRun pour appliquer les changements." -ForegroundColor Blue
}

# Afficher les fichiers modifiés
if ($modifiedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "📁 FICHIERS MODIFIÉS:" -ForegroundColor Blue
    $modifiedFiles | Select-Object -First 10 | ForEach-Object { 
        Write-Host "   - $(Split-Path $_ -Leaf)" -ForegroundColor White 
    }
    if ($modifiedFiles.Count -gt 10) {
        Write-Host "   ... et $($modifiedFiles.Count - 10) autres fichiers" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✨ Script terminé avec succès!" -ForegroundColor Green
