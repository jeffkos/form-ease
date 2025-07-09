@echo off
echo ==========================================
echo   FORMEASE - DEMARRAGE COMPLET
echo ==========================================
echo.

echo 🔧 Verification des prerequis...

rem Verifier si nous sommes dans le bon repertoire
if not exist "formease\backend" (
    echo ❌ Dossier backend non trouve
    echo 💡 Verifiez que vous etes dans le bon repertoire
    pause
    exit /b 1
)

rem Verifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non installe
    echo 💡 Installez Node.js et reessayez
    pause
    exit /b 1
)

echo ✅ Prerequis OK

echo.
echo 🚀 Demarrage du backend FormEase...
cd formease\backend

rem Installer les dependances si necessaire
if not exist "node_modules" (
    echo 📦 Installation des dependances...
    call npm install
)

rem Generer Prisma
echo 🔄 Generation du client Prisma...
call npx prisma generate

echo.
echo 🌐 Ouverture de la page de test...
cd ..\..
start "" "backend-test-complete.html"

echo.
echo 📊 Demarrage du serveur backend (port 4000)...
echo ⚠️  Laissez cette fenetre ouverte pendant vos tests
echo 🛑 Appuyez sur Ctrl+C pour arreter le serveur
echo.

cd formease\backend
call npm run dev
