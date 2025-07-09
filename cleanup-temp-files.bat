@echo off
echo ========================================
echo    NETTOYAGE DES FICHIERS TEMPORAIRES
echo ========================================
echo.

echo 🧹 Suppression des fichiers de test temporaires...

REM Supprimer les fichiers de test HTML
if exist "backend-test-complete.html" (
    del "backend-test-complete.html"
    echo ✅ backend-test-complete.html supprimé
)

if exist "test-login.html" (
    del "test-login.html"
    echo ✅ test-login.html supprimé
)

if exist "test-backend-formease.html" (
    del "test-backend-formease.html"
    echo ✅ test-backend-formease.html supprimé
)

REM Supprimer les scripts de test temporaires
if exist "test-backend-complete.bat" (
    del "test-backend-complete.bat"
    echo ✅ test-backend-complete.bat supprimé
)

if exist "test-connexion-premium.bat" (
    del "test-connexion-premium.bat"
    echo ✅ test-connexion-premium.bat supprimé
)

echo.
echo ✅ Nettoyage terminé !
echo 📁 Fichiers conservés :
echo    - frontend/ (structure principale)
echo    - form-ai-generator.html (modèle)
echo    - form-builder-fixed.html (modèle)
echo    - test-frontend.bat (test permanent)
echo    - start-frontend-server.bat (utilitaire)
echo    - start-formease-complete.bat (utilitaire)
echo.
pause
