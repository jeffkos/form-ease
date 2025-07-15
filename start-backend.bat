@echo off
echo Demarrage du serveur backend FormEase...
cd /d "c:\Users\Jeff KOSI\Desktop\FormEase"
echo Repertoire courant: %cd%
echo.
echo Verification de Node.js...
node --version
echo.
echo Verification de npm...
npm --version
echo.
echo Installation des dependances si necessaire...
npm install
echo.
echo Demarrage du serveur...
npm start
pause
