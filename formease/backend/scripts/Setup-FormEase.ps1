# ======================================
# 🚀 SCRIPT D'INSTALLATION FORMEASE - WINDOWS
# ======================================

param(
    [switch]$Reset,
    [switch]$Seed,
    [switch]$Production,
    [switch]$CheckOnly,
    [switch]$Verbose
)

# Configuration des couleurs
$Host.UI.RawUI.WindowTitle = "FormEase - Installation"

# Fonctions utilitaires
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Cyan
}

function Write-Title {
    param([string]$Title)
    Write-Host "`n" + "="*60 -ForegroundColor Magenta
    Write-Host "🎯 $Title" -ForegroundColor Magenta
    Write-Host "="*60 -ForegroundColor Magenta
}

# Vérification des prérequis
function Test-Prerequisites {
    Write-Title "VÉRIFICATION DES PRÉREQUIS"
    
    $hasErrors = $false
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    }
    catch {
        Write-Error "Node.js n'est pas installé"
        Write-Info "Téléchargez depuis: https://nodejs.org"
        $hasErrors = $true
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm --version
        Write-Success "npm: v$npmVersion"
    }
    catch {
        Write-Error "npm n'est pas installé"
        $hasErrors = $true
    }
    
    # Vérifier PostgreSQL (optionnel)
    try {
        $pgVersion = psql --version
        Write-Success "PostgreSQL: $pgVersion"
    }
    catch {
        Write-Warning "PostgreSQL non trouvé dans PATH"
        Write-Info "Installez PostgreSQL ou utilisez Docker"
    }
    
    # Vérifier Git
    try {
        $gitVersion = git --version
        Write-Success "Git: $gitVersion"
    }
    catch {
        Write-Warning "Git n'est pas installé"
    }
    
    if ($hasErrors) {
        Write-Error "Prérequis manquants. Installation interrompue."
        exit 1
    }
    
    Write-Success "Tous les prérequis sont satisfaits"
}

# Installation des dépendances
function Install-Dependencies {
    Write-Title "INSTALLATION DES DÉPENDANCES"
    
    try {
        Write-Info "Installation des packages npm..."
        npm install
        Write-Success "Dépendances installées avec succès"
    }
    catch {
        Write-Error "Erreur lors de l'installation des dépendances"
        Write-Error $_.Exception.Message
        exit 1
    }
}

# Configuration de l'environnement
function Set-Environment {
    Write-Title "CONFIGURATION DE L'ENVIRONNEMENT"
    
    $envFile = ".env"
    $envExample = "config.env.example"
    
    if ((Test-Path $envFile) -and -not $Reset) {
        Write-Info "Le fichier .env existe déjà"
        Write-Info "Utilisez -Reset pour le recréer"
        return
    }
    
    if (-not (Test-Path $envExample)) {
        Write-Error "Fichier config.env.example manquant"
        exit 1
    }
    
    try {
        Write-Info "Génération des secrets sécurisés..."
        
        # Générer des secrets aléatoires
        $jwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
        $jwtRefreshSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
        $encryptionKey = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString().Substring(0, 32)))
        
        # Lire le template
        $envContent = Get-Content $envExample -Raw
        
        # Remplacer les valeurs
        $envContent = $envContent -replace 'your-super-secret-jwt-key-minimum-32-characters-long', $jwtSecret
        $envContent = $envContent -replace 'your-super-secret-refresh-jwt-key-minimum-32-characters-long', $jwtRefreshSecret
        $envContent = $envContent -replace 'your-32-character-encryption-key', $encryptionKey
        
        # Mode production
        if ($Production) {
            $envContent = $envContent -replace 'NODE_ENV="development"', 'NODE_ENV="production"'
        }
        
        # Écrire le fichier .env
        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Success "Fichier .env créé avec des secrets sécurisés"
        
    }
    catch {
        Write-Error "Erreur lors de la création du fichier .env"
        Write-Error $_.Exception.Message
        exit 1
    }
}

# Création des répertoires
function New-Directories {
    Write-Title "CRÉATION DES RÉPERTOIRES"
    
    $directories = @("logs", "uploads", "temp", "backups")
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Répertoire créé: $dir"
        }
        else {
            Write-Info "Répertoire existant: $dir"
        }
    }
}

# Configuration de la base de données
function Set-Database {
    Write-Title "CONFIGURATION DE LA BASE DE DONNÉES"
    
    if ($Production) {
        Write-Info "Mode production - configuration manuelle requise"
        Write-Info "Consultez le guide d'installation pour les détails"
        return
    }
    
    Write-Info "Instructions pour PostgreSQL local:"
    Write-Host "   1. Installez PostgreSQL depuis: https://www.postgresql.org/download/windows/"
    Write-Host "   2. Ouvrez pgAdmin ou psql"
    Write-Host "   3. Créez la base de données:"
    Write-Host "      CREATE DATABASE formease_db;"
    Write-Host "   4. Créez l'utilisateur:"
    Write-Host "      CREATE USER formease WITH PASSWORD 'formease123';"
    Write-Host "   5. Accordez les permissions:"
    Write-Host "      GRANT ALL PRIVILEGES ON DATABASE formease_db TO formease;"
    Write-Host ""
    Write-Info "Ou utilisez Docker:"
    Write-Host "   docker run --name formease-postgres -e POSTGRES_DB=formease_db -e POSTGRES_USER=formease -e POSTGRES_PASSWORD=formease123 -p 5432:5432 -d postgres:15"
}

# Initialisation de la base de données
function Initialize-Database {
    Write-Title "INITIALISATION DE LA BASE DE DONNÉES"
    
    try {
        $args = @()
        if ($Reset) { $args += "--reset" }
        if ($Seed) { $args += "--seed" }
        if ($Production) { $args += "--prod" }
        if ($Verbose) { $args += "--verbose" }
        
        Write-Info "Exécution du script d'initialisation..."
        node scripts/setup-database.js @args
        Write-Success "Base de données initialisée"
    }
    catch {
        Write-Error "Erreur lors de l'initialisation de la base de données"
        Write-Error $_.Exception.Message
        Write-Info "Vérifiez que PostgreSQL est démarré et configuré"
        exit 1
    }
}

# Vérification de l'installation
function Test-Installation {
    Write-Title "VÉRIFICATION DE L'INSTALLATION"
    
    try {
        Write-Info "Test des composants..."
        node scripts/start-formease.js --check-only
        Write-Success "Tous les composants sont opérationnels"
    }
    catch {
        Write-Error "Erreur lors de la vérification"
        Write-Error $_.Exception.Message
        exit 1
    }
}

# Résumé final
function Show-Summary {
    Write-Title "INSTALLATION TERMINÉE"
    
    Write-Host ""
    Write-Success "FormEase Backend installé avec succès!"
    Write-Host ""
    
    Write-Host "📋 Fichiers créés:" -ForegroundColor Yellow
    Write-Host "   ✅ .env (configuration)"
    Write-Host "   ✅ Répertoires (logs, uploads, temp, backups)"
    Write-Host ""
    
    Write-Host "🚀 Commandes disponibles:" -ForegroundColor Yellow
    Write-Host "   npm start              - Démarrer le serveur"
    Write-Host "   npm run dev            - Mode développement"
    Write-Host "   npm run db:setup       - Configurer la base"
    Write-Host "   npm run db:studio      - Interface Prisma"
    Write-Host "   npm test               - Lancer les tests"
    Write-Host ""
    
    Write-Host "🔧 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "   1. Modifiez .env avec vos vraies valeurs"
    Write-Host "   2. Configurez PostgreSQL (voir instructions)"
    Write-Host "   3. Exécutez: npm run db:setup"
    Write-Host "   4. Démarrez: npm start"
    Write-Host ""
    
    Write-Host "⚠️ Important:" -ForegroundColor Red
    Write-Host "   - Changez les mots de passe par défaut"
    Write-Host "   - Configurez vos clés API (Stripe, OpenAI, etc.)"
    Write-Host "   - Ne committez jamais le fichier .env"
    Write-Host ""
    
    if (-not $Production) {
        Write-Host "🔑 Identifiants Super Admin par défaut:" -ForegroundColor Green
        Write-Host "   Email: admin@formease.com"
        Write-Host "   Mot de passe: AdminFormEase2024!"
        Write-Host "   (À changer après la première connexion)"
    }
}

# Fonction principale
function Main {
    Write-Host "🚀 Installation de FormEase Backend" -ForegroundColor Magenta
    Write-Host "Version: 1.0.0 | Plateforme: Windows" -ForegroundColor Gray
    Write-Host ""
    
    if ($CheckOnly) {
        Test-Prerequisites
        Test-Installation
        return
    }
    
    try {
        Test-Prerequisites
        Install-Dependencies
        Set-Environment
        New-Directories
        Set-Database
        
        if (-not $Production) {
            $response = Read-Host "Voulez-vous initialiser la base de données maintenant? (y/N)"
            if ($response -eq "y" -or $response -eq "Y") {
                Initialize-Database
            }
        }
        
        Test-Installation
        Show-Summary
        
    }
    catch {
        Write-Error "Erreur fatale lors de l'installation"
        Write-Error $_.Exception.Message
        exit 1
    }
}

# Gestion des erreurs globales
trap {
    Write-Error "Erreur inattendue: $_"
    exit 1
}

# Exécution
Main 