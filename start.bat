@echo off
REM Script de démarrage complet pour FormEase (Windows)
REM Usage: start.bat

echo 🚀 Démarrage de FormEase...

REM Vérification des dépendances
echo 📦 Vérification des dépendances...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé
    exit /b 1
)

REM Installation des dépendances backend
echo 🔧 Installation des dépendances backend...
cd formease\backend
if not exist "node_modules" (
    npm install
)

REM Installation des dépendances frontend
echo 🎨 Installation des dépendances frontend...
cd ..\frontend
if not exist "node_modules" (
    npm install
)

REM Retour à la racine
cd ..\..

echo ✅ Installation terminée!
echo.
echo 📋 Instructions de démarrage:
echo 1. Configurez vos variables d'environnement (.env)
echo 2. Initialisez votre base de données PostgreSQL
echo 3. Lancez le backend: cd formease\backend ^&^& npm run dev
echo 4. Lancez le frontend: cd formease\frontend ^&^& npm run dev
echo.
echo 🌐 URLs par défaut:
echo    Backend:  http://localhost:4000
echo    Frontend: http://localhost:3000
echo.
echo 📚 Documentation: README.md
