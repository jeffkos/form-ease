@echo off
REM Script d'initialisation complète de FormEase pour Windows
REM Usage: init-project.bat

echo 🚀 Initialisation complète de FormEase...

REM Vérification des prérequis
echo 📦 Vérification des prérequis...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js détecté

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé
    pause
    exit /b 1
)
echo ✅ npm détecté

where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ PostgreSQL non détecté. Veuillez l'installer et configurer manuellement
) else (
    echo ✅ PostgreSQL détecté
)

REM Installation des dépendances
echo.
echo 📦 Installation des dépendances...

echo ℹ️ Installation dépendances backend...
cd formease\backend
npm install
if %errorlevel% neq 0 (
    echo ❌ Échec installation backend
    pause
    exit /b 1
)
echo ✅ Dépendances backend installées

echo ℹ️ Installation dépendances frontend...
cd ..\frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Échec installation frontend
    pause
    exit /b 1
)
echo ✅ Dépendances frontend installées

cd ..\..

REM Configuration des variables d'environnement
echo.
echo 🔧 Configuration des variables d'environnement...

if not exist "formease\backend\.env" (
    copy "formease\backend\.env.example" "formease\backend\.env"
    echo ✅ Fichier .env backend créé à partir de l'exemple
    echo ⚠️ IMPORTANT: Éditez formease\backend\.env avec vos vraies valeurs
) else (
    echo ℹ️ Fichier .env backend existe déjà
)

if not exist "formease\frontend\.env.local" (
    echo NEXT_PUBLIC_API_URL=http://localhost:4000> formease\frontend\.env.local
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000>> formease\frontend\.env.local
    echo ✅ Fichier .env.local frontend créé
) else (
    echo ℹ️ Fichier .env.local frontend existe déjà
)

REM Génération de clé JWT
echo.
echo 🔐 Génération de clé JWT sécurisée...
cd formease\backend
npm run generate-jwt-secret
if %errorlevel% neq 0 (
    echo ⚠️ Impossible de générer automatiquement la clé JWT
) else (
    echo ✅ Clé JWT générée et mise à jour dans .env
)

REM Configuration base de données
echo.
echo 💾 Configuration de la base de données...

where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ PostgreSQL non accessible - configuration manuelle requise
    echo   1. Installez PostgreSQL
    echo   2. Créez la base: createdb formease_db
    echo   3. Lancez: cd formease\backend ^&^& npx prisma migrate dev
) else (
    echo ℹ️ Tentative de création de la base de données...
    
    psql -U postgres -c "CREATE DATABASE formease_db;" 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️ Base de données 'formease_db' existe déjà ou erreur de connexion
    ) else (
        echo ✅ Base de données 'formease_db' créée
    )
    
    echo ℹ️ Génération du client Prisma...
    npx prisma generate
    if %errorlevel% neq 0 (
        echo ❌ Échec génération client Prisma
    ) else (
        echo ✅ Client Prisma généré
    )
    
    echo ℹ️ Exécution des migrations Prisma...
    npx prisma migrate dev --name init
    if %errorlevel% neq 0 (
        echo ⚠️ Échec migrations Prisma - vérifiez la connexion DB
    ) else (
        echo ✅ Migrations Prisma exécutées
    )
)

REM Tests de validation
echo.
echo 🧪 Tests de validation...

echo ℹ️ Test build frontend...
cd ..\frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Échec build frontend
) else (
    echo ✅ Build frontend réussi
)

echo ℹ️ Test syntaxe backend...
cd ..\backend
node -c src\app.js
if %errorlevel% neq 0 (
    echo ❌ Erreurs syntaxe backend
) else (
    echo ✅ Syntaxe backend validée
)

cd ..\..

REM Résumé final
echo.
echo 🎉 Initialisation terminée !
echo.
echo 📋 PROCHAINES ÉTAPES:
echo.
echo 1. 🔧 Configurez vos variables d'environnement:
echo    - Éditez: formease\backend\.env
echo    - Configurez: DATABASE_URL, SMTP_*, JWT_SECRET
echo.
echo 2. 🚀 Démarrez les services:
echo    - Backend:  cd formease\backend ^&^& npm run dev
echo    - Frontend: cd formease\frontend ^&^& npm run dev
echo.
echo 3. 🌐 Accédez à l'application:
echo    - Frontend: http://localhost:3000
echo    - Backend:  http://localhost:4000
echo.
echo 4. 📚 Consultez la documentation:
echo    - README.md pour vue d'ensemble
echo    - INSTALLATION.md pour détails
echo    - CONTRIBUTING.md pour contribuer
echo.
echo ✅ FormEase est prêt à être utilisé !
pause
