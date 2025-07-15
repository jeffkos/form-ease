@echo off
echo =================================
echo   DEMARRAGE SERVEURS FORMEASE
echo =================================
echo.

cd /d "c:\Users\Jeff KOSI\Desktop\FormEase"
echo Repertoire: %cd%
echo.

echo 1. Demarrage du serveur backend (port 4000)...
start "Backend FormEase" cmd /k "node server.js"
timeout /t 3 /nobreak > nul

echo 2. Demarrage du serveur frontend (port 3000)...
start "Frontend FormEase" cmd /k "node frontend-server.js"
timeout /t 2 /nobreak > nul

echo.
echo ================================= 
echo   SERVEURS DEMARRES
echo =================================
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Pages a tester:
echo - http://localhost:3000/test-api.html
echo - http://localhost:3000/pages/auth/login.html
echo - http://localhost:3000/pages/dashboard.html
echo - http://localhost:3000/pages/forms/management.html
echo.
echo Appuyez sur une touche pour verifier les ports...
pause > nul

echo Verification des ports...
netstat -ano | findstr ":3000"
netstat -ano | findstr ":4000"

echo.
echo Si les ports ne sont pas affiches, verifiez les fenetres cmd ouvertes.
echo.
pause
