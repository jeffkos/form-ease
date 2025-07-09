@echo off
echo ==========================================
echo   FORMEASE - CREATION UTILISATEUR PREMIUM
echo ==========================================
echo.

cd /d "%~dp0"
cd formease\backend

echo 🚀 Demarrage de la creation de l'utilisateur premium...
echo.

rem Verifier si Node.js est installe
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installe ou non accessible
    echo Veuillez installer Node.js et reessayer
    pause
    exit /b 1
)

rem Verifier si les dependances sont installees
if not exist "node_modules" (
    echo 📦 Installation des dependances...
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dependances
        pause
        exit /b 1
    )
)

rem Verifier si Prisma est genere
echo 🔄 Generation du client Prisma...
npx prisma generate
if errorlevel 1 (
    echo ❌ Erreur lors de la generation Prisma
    pause
    exit /b 1
)

rem Executer le script de creation
echo 👤 Creation de l'utilisateur premium...
node scripts\create-premium-user.js

if errorlevel 1 (
    echo ❌ Erreur lors de la creation de l'utilisateur
) else (
    echo.
    echo ✅ Utilisateur premium cree avec succes !
    echo.
    echo 📋 INFORMATIONS DE CONNEXION :
    echo =====================================
    echo Email: jeff.kosi@formease.com
    echo Mot de passe: FormEase2025!
    echo Role: PREMIUM
    echo Plan: Premium (1 an)
    echo =====================================
    echo.
    echo 🌐 Connectez-vous via :
    echo - Frontend: frontend\pages\auth\login.html
    echo - API: http://localhost:3000/api/auth/login
    echo.
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul
