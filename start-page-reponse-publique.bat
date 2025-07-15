@echo off
REM Script de démarrage rapide pour tester la page de réponse publique FormEase

echo 🚀 Démarrage Rapide - Page de Réponse Publique FormEase
echo ======================================================

REM Vérifier que nous sommes dans le bon répertoire
if not exist "frontend\pages\public\form-response.html" (
    echo ❌ Erreur: Fichier form-response.html non trouvé
    echo Assurez-vous d'être dans le répertoire racine de FormEase
    pause
    exit /b 1
)

echo ✅ Structure de fichiers vérifiée

REM Démarrer le backend
echo.
echo 📡 Démarrage du serveur backend...
if exist "backend\package.json" (
    cd backend
    
    REM Installer les dépendances si nécessaire
    if not exist "node_modules" (
        echo 📦 Installation des dépendances backend...
        call npm install
    )
    
    REM Démarrer le serveur en arrière-plan
    echo 🚀 Lancement du serveur backend sur le port 3001...
    start "FormEase Backend" cmd /k "npm start"
    cd ..
    
    REM Attendre que le serveur démarre
    timeout /t 5 /nobreak >nul
) else (
    echo ❌ Erreur: backend\package.json non trouvé
    pause
    exit /b 1
)

REM Démarrer le serveur frontend
echo.
echo 🌐 Démarrage du serveur frontend...
cd frontend

REM Vérifier Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 🐍 Utilisation de Python pour servir les fichiers frontend...
    start "FormEase Frontend" cmd /k "python -m http.server 3000"
) else (
    REM Essayer Node.js avec http-server
    where http-server >nul 2>&1
    if %errorlevel% == 0 (
        echo 📦 Utilisation de http-server (Node.js)...
        start "FormEase Frontend" cmd /k "http-server -p 3000"
    ) else (
        echo ⚠️ Python et http-server non trouvés
        echo Veuillez installer Python ou http-server pour servir les fichiers frontend
        echo Installation http-server: npm install -g http-server
        pause
        exit /b 1
    )
)

cd ..

REM Attendre que les serveurs démarrent
echo.
echo ⏳ Attente du démarrage des serveurs...
timeout /t 8 /nobreak >nul

REM Vérifier la connectivité
echo.
echo 🔍 Vérification de la connectivité...

REM Tester le backend
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend accessible sur http://localhost:3001
) else (
    echo ❌ Backend non accessible - Vérifiez les logs
)

REM Tester le frontend
curl -s http://localhost:3000/pages/public/form-response.html >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend accessible sur http://localhost:3000
) else (
    echo ❌ Frontend non accessible - Vérifiez le serveur
)

echo.
echo 🎉 Démarrage terminé !
echo.
echo 📍 URLs d'accès :
echo ▶️ Page de réponse publique: http://localhost:3000/pages/public/form-response.html?form=test
echo ▶️ API Backend: http://localhost:3001/health
echo ▶️ Documentation: DOCUMENTATION_PAGE_REPONSE_PUBLIQUE.md
echo.
echo 🧪 Pour tester avec un formulaire exemple :
echo    http://localhost:3000/pages/public/form-response.html?form=contact_form_123
echo.
echo 🛑 Pour arrêter les serveurs, fermez les fenêtres de commande ouvertes
echo.

REM Ouvrir automatiquement la page dans le navigateur
start http://localhost:3000/pages/public/form-response.html?form=test

echo ✨ Page ouverte dans le navigateur par défaut
echo.
pause
