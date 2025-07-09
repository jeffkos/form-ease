@echo off
echo ========================================
echo    FORMEASE FRONTEND V2.0 - TEST SUITE
echo ========================================
echo.

echo 📁 Verification de la structure...
if exist "frontend\pages\auth\login.html" (
    echo ✅ Login page found
) else (
    echo ❌ Login page missing
)

if exist "frontend\pages\auth\register.html" (
    echo ✅ Register page found
) else (
    echo ❌ Register page missing
)

if exist "frontend\pages\public\landing.html" (
    echo ✅ Landing page found
) else (
    echo ❌ Landing page missing
)

if exist "frontend\pages\dashboard\home.html" (
    echo ✅ Dashboard home found
) else (
    echo ❌ Dashboard home missing
)

if exist "frontend\styles\tremor-base.css" (
    echo ✅ Tremor CSS found
) else (
    echo ❌ Tremor CSS missing
)

if exist "frontend\scripts\core.js" (
    echo ✅ Core JS found
) else (
    echo ❌ Core JS missing
)

echo.
echo 🌐 Ouverture des pages dans le navigateur...
echo Appuyez sur une touche pour ouvrir chaque page...
pause

echo Ouverture de la landing page...
start "" "frontend\pages\public\landing.html"
timeout /t 2 >nul

echo Ouverture de la page de connexion...
start "" "frontend\pages\auth\login.html"
timeout /t 2 >nul

echo Ouverture de la page d'inscription...
start "" "frontend\pages\auth\register.html"
timeout /t 2 >nul

echo Ouverture du dashboard...
start "" "frontend\pages\dashboard\home.html"
timeout /t 2 >nul

echo.
echo ✅ Toutes les pages ont été ouvertes !
echo 📋 Vérifiez que :
echo    - Le design Tremor est cohérent
echo    - Les icônes Remixicon s'affichent
echo    - Les animations fonctionnent
echo    - Le responsive est correct
echo.
echo 🔗 Pages modèles conservées :
echo    - form-ai-generator.html
echo    - form-builder-fixed.html
echo.
pause
