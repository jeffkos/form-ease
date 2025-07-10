@echo off
echo ==========================================
echo   FORMEASE FRONTEND SERVER (MEMORY BOOST)
echo ==========================================
echo.

echo 🚀 Demarrage du serveur frontend avec memoire augmentee...
echo.

rem Verifier si Python est installe
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installe
    echo 💡 Demarrage serveur Node.js avec memoire augmentee...
    
    cd /d "%~dp0"
    
    echo // Serveur HTTP simple avec limitation de memoire augmentee > temp-server-boost.js
    echo const http = require('http'); >> temp-server-boost.js
    echo const fs = require('fs'); >> temp-server-boost.js
    echo const path = require('path'); >> temp-server-boost.js
    echo const port = 8080; >> temp-server-boost.js
    echo. >> temp-server-boost.js
    echo const server = http.createServer((req, res) => { >> temp-server-boost.js
    echo   let filePath = '.' + req.url; >> temp-server-boost.js
    echo   if (filePath === './') filePath = './frontend/pages/public/landing.html'; >> temp-server-boost.js
    echo   const extname = path.extname(filePath); >> temp-server-boost.js
    echo   let contentType = 'text/html'; >> temp-server-boost.js
    echo   if (extname === '.js') contentType = 'text/javascript'; >> temp-server-boost.js
    echo   if (extname === '.css') contentType = 'text/css'; >> temp-server-boost.js
    echo   if (extname === '.json') contentType = 'application/json'; >> temp-server-boost.js
    echo   res.setHeader('Access-Control-Allow-Origin', '*'); >> temp-server-boost.js
    echo   fs.readFile(filePath, (err, content) => { >> temp-server-boost.js
    echo     if (err) { >> temp-server-boost.js
    echo       res.writeHead(404); >> temp-server-boost.js
    echo       res.end('File not found'); >> temp-server-boost.js
    echo     } else { >> temp-server-boost.js
    echo       res.writeHead(200, { 'Content-Type': contentType }); >> temp-server-boost.js
    echo       res.end(content); >> temp-server-boost.js
    echo     } >> temp-server-boost.js
    echo   }); >> temp-server-boost.js
    echo }); >> temp-server-boost.js
    echo. >> temp-server-boost.js
    echo server.listen(port, () => console.log('🌐 Serveur frontend demarre sur http://localhost:' + port)); >> temp-server-boost.js
    
    echo.
    node --max-old-space-size=4096 temp-server-boost.js
) else (
    echo ✓ Python detecte - Demarrage serveur HTTP...
    
    cd /d "%~dp0"
    
    start /B python -m http.server 8080
    
    echo 🌐 Serveur frontend demarre sur http://localhost:8080
    echo 📑 Pages disponibles :
    echo    - http://localhost:8080/frontend/pages/public/landing.html
    echo    - http://localhost:8080/frontend/pages/auth/login.html
    echo    - http://localhost:8080/frontend/pages/auth/register.html
    echo    - http://localhost:8080/frontend/pages/dashboard/home.html
    echo.
    echo ✋ Fermez avec Ctrl+C quand vous avez termine
)
