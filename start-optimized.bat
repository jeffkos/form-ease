@echo off
echo ========================================
echo   FORMEASE - SERVEUR AVEC MEMOIRE BOOST
echo ========================================
echo.

echo 🚀 Demarrage du serveur optimise avec 4GB de memoire...
echo.

node --max-old-space-size=4096 optimized-server.js

echo.
echo 🛑 Serveur arrete
