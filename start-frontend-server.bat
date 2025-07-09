@echo off
echo ==========================================
echo   FORMEASE FRONTEND SERVER LOCAL
echo ==========================================
echo.

echo 🚀 Demarrage du serveur frontend local...
echo.

rem Verifier si Python est installe
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installe
    echo 💡 Tentative avec Node.js...
    
    rem Essayer avec Node.js
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Node.js non plus... Utilisez les fichiers en file://
        echo 📂 Ouvrez manuellement : frontend\pages\auth\login.html
        pause
        exit /b 1
    ) else (
        echo ✅ Node.js detecte - Creation d'un serveur HTTP simple...
        
        cd /d "%~dp0"
        
        rem Creer un serveur HTTP simple avec Node.js
        echo const http = require('http'); > temp-server.js
        echo const fs = require('fs'); >> temp-server.js
        echo const path = require('path'); >> temp-server.js
        echo const port = 8080; >> temp-server.js
        echo. >> temp-server.js
        echo const server = http.createServer((req, res) =^> { >> temp-server.js
        echo   let filePath = '.' + req.url; >> temp-server.js
        echo   if (filePath === './') filePath = './frontend/pages/public/landing.html'; >> temp-server.js
        echo   const extname = path.extname(filePath); >> temp-server.js
        echo   let contentType = 'text/html'; >> temp-server.js
        echo   if (extname === '.js') contentType = 'text/javascript'; >> temp-server.js
        echo   if (extname === '.css') contentType = 'text/css'; >> temp-server.js
        echo   if (extname === '.json') contentType = 'application/json'; >> temp-server.js
        echo   res.setHeader('Access-Control-Allow-Origin', '*'); >> temp-server.js
        echo   fs.readFile(filePath, (err, content) =^> { >> temp-server.js
        echo     if (err) { res.writeHead(404); res.end('File not found'); } >> temp-server.js
        echo     else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content); } >> temp-server.js
        echo   }); >> temp-server.js
        echo }); >> temp-server.js
        echo. >> temp-server.js
        echo server.listen(port, () =^> console.log('Frontend server running on http://localhost:' + port)); >> temp-server.js
        
        echo 🌐 Serveur frontend demarre sur http://localhost:8080
        echo 📋 Pages disponibles :
        echo    - http://localhost:8080/frontend/pages/public/landing.html
        echo    - http://localhost:8080/frontend/pages/auth/login.html
        echo    - http://localhost:8080/frontend/pages/auth/register.html
        echo    - http://localhost:8080/frontend/pages/dashboard/home.html
        echo.
        echo ⚠️  Fermez avec Ctrl+C quand vous avez termine
        echo.
        
        start "" "http://localhost:8080/frontend/pages/auth/login.html"
        node temp-server.js
    )
) else (
    echo ✅ Python detecte - Demarrage serveur HTTP...
    
    cd /d "%~dp0"
    
    echo 🌐 Serveur frontend demarre sur http://localhost:8080
    echo 📋 Pages disponibles :
    echo    - http://localhost:8080/frontend/pages/public/landing.html
    echo    - http://localhost:8080/frontend/pages/auth/login.html
    echo    - http://localhost:8080/frontend/pages/auth/register.html
    echo    - http://localhost:8080/frontend/pages/dashboard/home.html
    echo.
    echo ⚠️  Fermez avec Ctrl+C quand vous avez termine
    echo.
    
    start "" "http://localhost:8080/frontend/pages/auth/login.html"
    python -m http.server 8080
)
