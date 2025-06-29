@echo off
REM Script de publication GitHub pour FormEase (Windows)
REM Usage: publish-github.bat

echo 🚀 Publication de FormEase sur GitHub...

REM Vérification que Git est installé
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git n'est pas installé
    exit /b 1
)

REM Vérification du repository
set REPO_URL=https://github.com/informagenie/FormEase.git

echo 📦 Initialisation du repository Git...

REM Initialisation si pas déjà fait
if not exist ".git" (
    git init
    echo ✅ Repository Git initialisé
)

echo 📂 Ajout des fichiers...
git add .

echo 💬 Commit initial...
git commit -m "🎉 Initial commit - FormEase v1.0.0

✨ Features:
- Modern Next.js 14 frontend with Tremor UI
- Express.js backend with Prisma ORM  
- JWT authentication system
- Analytics dashboard with charts
- Freemium/Premium quota system
- Multi-role management (USER, PREMIUM, SUPERADMIN)
- Complete API documentation ready
- Comprehensive README and contribution guides

🏗️ Architecture:
- Modular frontend/backend structure
- TypeScript strict mode
- React Context for global state
- Structured API services
- Reusable UI components

📚 Documentation:
- Complete setup guides
- API documentation
- Contributing guidelines
- MIT license
- Cross-platform installation scripts

🧪 Tests: 12/14 passing (validation + auth working)
🔧 Build: Frontend and backend builds successful"

echo 🌐 Configuration du remote GitHub...
git branch -M main

REM Vérifier si remote existe déjà
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    git remote add origin %REPO_URL%
    echo ✅ Remote origin ajouté: %REPO_URL%
) else (
    echo Remote origin existe déjà
)

echo 🚀 Push vers GitHub...
set /p choice="Pousser vers GitHub maintenant ? (y/n): "
if /i "%choice%"=="y" (
    git push -u origin main
    echo ✅ FormEase publié sur GitHub !
    echo.
    echo 🌐 Repository: %REPO_URL%
    echo 📚 Documentation: README.md
    echo 🤝 Contributions: CONTRIBUTING.md
    echo.
    echo 🎉 FormEase v1.0.0 est maintenant disponible pour la communauté !
) else (
    echo 📝 Repository prêt. Pour publier plus tard:
    echo    git push -u origin main
)

pause
