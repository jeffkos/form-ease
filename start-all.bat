@echo off
setlocal

echo Vérification de l'installation des dépendances...

cd /d %~dp0\formease\frontend
if not exist node_modules (
    echo Installation des dépendances frontend...
    call npm install
)

cd /d %~dp0\formease\backend
if not exist node_modules (
    echo Installation des dépendances backend...
    call npm install
)

REM Vérification des ports
powershell -Command "$frontendPort = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue; $backendPort = Test-NetConnection -ComputerName localhost -Port 4000 -WarningAction SilentlyContinue; if ($frontendPort.TcpTestSucceeded -or $backendPort.TcpTestSucceeded) { exit 1 } else { exit 0 }"
if %ERRORLEVEL% EQU 1 (
    echo Les ports 3000 ou 4000 sont déjà utilisés. Veuillez fermer les applications qui les utilisent.
    pause
    exit /b 1
)

echo Démarrage des services...

start "Backend" cmd /k "cd /d %~dp0\formease\backend && echo Démarrage du backend... && npm run dev"

REM Attente que le backend soit prêt (5 secondes)
timeout /t 5 /nobreak > nul

start "Frontend" cmd /k "cd /d %~dp0\formease\frontend && echo Démarrage du frontend... && npm run dev"

echo Services démarrés avec succès !
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000/api

endlocal
