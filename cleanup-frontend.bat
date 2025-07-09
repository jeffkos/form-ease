@echo off
echo Suppression des anciennes interfaces frontend...
echo Conservation uniquement de form-ai-generator.html et form-builder-fixed.html

rem Supprimer tous les fichiers HTML sauf les deux modèles
del /q dashboard*.html 2>nul
del /q index*.html 2>nul
del /q login*.html 2>nul
del /q register.html 2>nul
del /q details.html 2>nul
del /q responses-manager.html 2>nul
del /q form-ai-generator-tremor-strict.html 2>nul

echo Suppression terminée. Fichiers conservés:
echo - form-ai-generator.html
echo - form-builder-fixed.html
echo.
echo Frontend prêt pour la refonte complète !
