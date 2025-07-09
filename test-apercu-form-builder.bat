@echo off
echo ==========================================
echo   TEST APERCU FORM BUILDER
echo ==========================================

REM Ouvrir le form builder avec des données de test
echo 🚀 Ouverture du Form Builder...
start "" "http://localhost:8080/frontend/pages/forms/builder.html"

REM Attendre un peu puis ouvrir un aperçu de test
timeout /t 3 /nobreak > nul
echo 🔍 Test de l'aperçu avec données d'exemple...

REM Construire une URL d'aperçu avec des données de test
set "title=Formulaire de Test"
set "description=Ceci est un formulaire de test pour vérifier l'aperçu"
set "fields=[{\"id\":\"1\",\"type\":\"text\",\"label\":\"Nom complet\",\"placeholder\":\"Entrez votre nom\",\"required\":true},{\"id\":\"2\",\"type\":\"email\",\"label\":\"Email\",\"placeholder\":\"votre@email.com\",\"required\":true},{\"id\":\"3\",\"type\":\"select\",\"label\":\"Service\",\"options\":[\"Support\",\"Ventes\",\"Technique\"],\"required\":false}]"

REM Encoder l'URL (simplification pour les tests)
start "" "http://localhost:8080/frontend/pages/forms/preview.html?title=%s&description=%s&fields=%s" %title% %description% %fields%

echo ✅ Test d'aperçu lancé !
echo 💡 Instructions :
echo    1. Dans le Form Builder, ajoutez quelques champs
echo    2. Cliquez sur "Aperçu" pour tester
echo    3. Vérifiez que l'aperçu s'ouvre dans un nouvel onglet
echo.
pause
