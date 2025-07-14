# Script de démarrage complet FormEase
Write-Host "🚀 FormEase - Démarrage Complet" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

# Fonction pour tuer les processus sur un port
function Kill-ProcessOnPort {
    param($Port)
    
    $processes = netstat -ano | findstr ":$Port"
    if ($processes) {
        Write-Host "🧹 Nettoyage du port $Port..." -ForegroundColor Yellow
        
        $pids = netstat -ano | findstr ":$Port" | ForEach-Object {
            $line = $_.Trim() -split '\s+'
            if ($line.Length -ge 5) { $line[4] }
        } | Sort-Object -Unique
        
        foreach ($processId in $pids) {
            if ($processId -and $processId -ne "0") {
                taskkill /PID $processId /F 2>$null
                Write-Host "✅ Port $Port libéré" -ForegroundColor Green
            }
        }
    }
}

# Nettoyer les ports
Kill-ProcessOnPort 3000
Kill-ProcessOnPort 3001

Write-Host "⏳ Attente de libération des ports..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Démarrer le backend
Write-Host "🔧 Démarrage du backend (port 3000)..." -ForegroundColor Blue
Start-Process PowerShell.exe -ArgumentList "-NoExit", "-Command", "cd '$PWD\formease\backend'; node simple-backend.js"

Start-Sleep -Seconds 3

# Démarrer le frontend  
Write-Host "🎨 Démarrage du frontend (port 3001)..." -ForegroundColor Magenta
Start-Process PowerShell.exe -ArgumentList "-NoExit", "-Command", "cd '$PWD\formease\frontend'; npm run dev"

Start-Sleep -Seconds 5

Write-Host "🎉 FormEase est en cours de démarrage !" -ForegroundColor Green
Write-Host "🔗 Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Dashboard: http://localhost:3001/dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur une touche pour ouvrir le dashboard..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Ouvrir automatiquement le navigateur
Start-Process "http://localhost:3001/dashboard"

Write-Host "✅ FormEase est prêt ! Dashboard ouvert dans le navigateur." -ForegroundColor Green 