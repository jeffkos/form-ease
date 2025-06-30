# Script PowerShell pour remplacer toutes les couleurs emerald par les couleurs par défaut de Tremor
$frontendPath = "formease\frontend"

# Couleurs de remplacement stratégiques selon le contexte
$replacements = @{
    'color="emerald"' = 'color="blue"'
    'colors=\["emerald"\]' = 'colors=["blue"]'
    'colors=\["emerald", "yellow"' = 'colors=["blue", "amber"'
    'colors=\["emerald", "blue"' = 'colors=["blue", "indigo"'
    'colors=\["blue", "emerald"' = 'colors=["blue", "indigo"'
    'decorationColor="emerald"' = 'decorationColor="blue"'
    'className=".*text-emerald-\d+' = { $_ -replace 'text-emerald-(\d+)', 'text-blue-$1' }
    'className=".*bg-emerald-\d+' = { $_ -replace 'bg-emerald-(\d+)', 'bg-blue-$1' }
    'className=".*border-emerald-\d+' = { $_ -replace 'border-emerald-(\d+)', 'border-blue-$1' }
}

Write-Host "Mise à jour des couleurs FormEase vers les couleurs par défaut de Tremor..." -ForegroundColor Green

# Trouver tous les fichiers TSX dans le frontend
$files = Get-ChildItem -Path $frontendPath -Recurse -Include "*.tsx", "*.ts" -Exclude "node_modules"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Appliquer les remplacements
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        if ($replacement -is [ScriptBlock]) {
            $content = $content -replace $pattern, $replacement
        } else {
            $content = $content -replace $pattern, $replacement
        }
    }
    
    # Sauvegarder si des changements ont été faits
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Mis à jour: $($file.FullName)" -ForegroundColor Yellow
    }
}

Write-Host "Mise à jour terminée !" -ForegroundColor Green
Write-Host "Reconstruisez le projet avec 'npm run build' pour appliquer les changements." -ForegroundColor Cyan
