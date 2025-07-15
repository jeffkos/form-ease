@echo off
echo Demarrage du serveur frontend FormEase...
cd /d "c:\Users\Jeff KOSI\Desktop\FormEase\frontend"
echo Repertoire courant: %cd%
echo.
echo Verification de Python...
python --version
echo.
echo Demarrage du serveur HTTP Python sur le port 3000...
python -m http.server 3000
pause
