@echo off
echo ========================================
echo    FORMEASE FRONTEND SETUP v2.0
echo ========================================
echo.

echo 🚀 Initialisation de la nouvelle architecture frontend...
echo.

echo 📁 Création de la structure des dossiers...
mkdir "frontend\assets" 2>nul
mkdir "frontend\assets\images" 2>nul
mkdir "frontend\assets\icons" 2>nul
mkdir "frontend\styles" 2>nul
mkdir "frontend\scripts" 2>nul
mkdir "frontend\pages\admin" 2>nul
mkdir "frontend\pages\utils" 2>nul

echo ✅ Structure des dossiers créée
echo.

echo 📄 Création des fichiers de base...

echo 🎨 Génération du CSS Tremor de base...
echo /* FORMEASE TREMOR CSS - Basé sur les modèles existants */ > "frontend\styles\tremor-base.css"
echo :root { >> "frontend\styles\tremor-base.css"
echo   --tremor-brand-faint: #f0f9ff; >> "frontend\styles\tremor-base.css"
echo   --tremor-brand-muted: #bae6fd; >> "frontend\styles\tremor-base.css"
echo   --tremor-brand-subtle: #38bdf8; >> "frontend\styles\tremor-base.css"
echo   --tremor-brand-default: #0ea5e9; >> "frontend\styles\tremor-base.css"
echo   --tremor-brand-emphasis: #0284c7; >> "frontend\styles\tremor-base.css"
echo   --tremor-brand-inverted: #ffffff; >> "frontend\styles\tremor-base.css"
echo   --tremor-background-default: #ffffff; >> "frontend\styles\tremor-base.css"
echo } >> "frontend\styles\tremor-base.css"
echo. >> "frontend\styles\tremor-base.css"
echo .tremor-Card { >> "frontend\styles\tremor-base.css"
echo   backdrop-filter: blur(12px); >> "frontend\styles\tremor-base.css"
echo   background: rgba(255, 255, 255, 0.9); >> "frontend\styles\tremor-base.css"
echo   border-radius: 0.5rem; >> "frontend\styles\tremor-base.css"
echo   border: 1px solid rgba(255, 255, 255, 0.2); >> "frontend\styles\tremor-base.css"
echo   box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); >> "frontend\styles\tremor-base.css"
echo   transition: all 0.3s ease; >> "frontend\styles\tremor-base.css"
echo } >> "frontend\styles\tremor-base.css"

echo ⚡ Génération du JavaScript de base...
echo // FORMEASE CORE UTILITIES > "frontend\scripts\core.js"
echo class FormEaseCore { >> "frontend\scripts\core.js"
echo   static init() { >> "frontend\scripts\core.js"
echo     console.log('FormEase Frontend v2.0 - Initialized'); >> "frontend\scripts\core.js"
echo   } >> "frontend\scripts\core.js"
echo } >> "frontend\scripts\core.js"
echo. >> "frontend\scripts\core.js"
echo document.addEventListener('DOMContentLoaded', FormEaseCore.init); >> "frontend\scripts\core.js"

echo 📋 Génération du template de base...
echo ^<!DOCTYPE html^> > "frontend\components\layouts\base-template.html"
echo ^<html lang="fr"^> >> "frontend\components\layouts\base-template.html"
echo ^<head^> >> "frontend\components\layouts\base-template.html"
echo     ^<meta charset="UTF-8"^> >> "frontend\components\layouts\base-template.html"
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> "frontend\components\layouts\base-template.html"
echo     ^<title^>FormEase - {{TITLE}}^</title^> >> "frontend\components\layouts\base-template.html"
echo     ^<script src="https://cdn.tailwindcss.com"^>^</script^> >> "frontend\components\layouts\base-template.html"
echo     ^<link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet"^> >> "frontend\components\layouts\base-template.html"
echo     ^<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"^> >> "frontend\components\layouts\base-template.html"
echo     ^<link rel="stylesheet" href="../../styles/tremor-base.css"^> >> "frontend\components\layouts\base-template.html"
echo ^</head^> >> "frontend\components\layouts\base-template.html"
echo ^<body class="bg-white font-sans"^> >> "frontend\components\layouts\base-template.html"
echo     ^<!-- CONTENT HERE --^> >> "frontend\components\layouts\base-template.html"
echo     ^<script src="../../scripts/core.js"^>^</script^> >> "frontend\components\layouts\base-template.html"
echo ^</body^> >> "frontend\components\layouts\base-template.html"
echo ^</html^> >> "frontend\components\layouts\base-template.html"

echo 📊 Génération de la liste des pages à développer...
echo # PAGES A DEVELOPPER - FORMEASE V2.0 > "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## 🔐 AUTHENTIFICATION >> "frontend\PAGES_TODO.md"
echo - [ ] auth/login.html >> "frontend\PAGES_TODO.md"
echo - [ ] auth/register.html >> "frontend\PAGES_TODO.md"
echo - [ ] auth/forgot-password.html >> "frontend\PAGES_TODO.md"
echo - [ ] auth/reset-password.html >> "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## 🏠 PAGES PUBLIQUES >> "frontend\PAGES_TODO.md"
echo - [ ] public/landing.html >> "frontend\PAGES_TODO.md"
echo - [ ] public/pricing.html >> "frontend\PAGES_TODO.md"
echo - [ ] public/about.html >> "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## 📊 DASHBOARD >> "frontend\PAGES_TODO.md"
echo - [ ] dashboard/home.html >> "frontend\PAGES_TODO.md"
echo - [ ] dashboard/profile.html >> "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## 📝 FORMULAIRES >> "frontend\PAGES_TODO.md"
echo - [ ] forms/list.html >> "frontend\PAGES_TODO.md"
echo - [x] forms/builder.html (MODELE EXISTANT) >> "frontend\PAGES_TODO.md"
echo - [x] forms/ai-generator.html (MODELE EXISTANT) >> "frontend\PAGES_TODO.md"
echo - [ ] forms/preview.html >> "frontend\PAGES_TODO.md"
echo - [ ] forms/settings.html >> "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## 📈 ANALYTICS >> "frontend\PAGES_TODO.md"
echo - [ ] analytics/dashboard.html >> "frontend\PAGES_TODO.md"
echo - [ ] responses/manager.html >> "frontend\PAGES_TODO.md"
echo - [ ] responses/detail.html >> "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## ⚙️ ADMINISTRATION >> "frontend\PAGES_TODO.md"
echo - [ ] admin/dashboard.html >> "frontend\PAGES_TODO.md"
echo - [ ] admin/users.html >> "frontend\PAGES_TODO.md"
echo - [ ] admin/system.html >> "frontend\PAGES_TODO.md"
echo. >> "frontend\PAGES_TODO.md"
echo ## 🛠️ UTILITAIRES >> "frontend\PAGES_TODO.md"
echo - [ ] utils/help.html >> "frontend\PAGES_TODO.md"
echo - [ ] utils/api-docs.html >> "frontend\PAGES_TODO.md"

echo.
echo ✅ Configuration terminée !
echo.
echo 📁 Structure créée dans : frontend/
echo 🎨 Styles Tremor : frontend/styles/tremor-base.css
echo ⚡ Scripts core : frontend/scripts/core.js
echo 📋 Template base : frontend/components/layouts/base-template.html
echo 📊 TODO List : frontend/PAGES_TODO.md
echo.
echo 🎯 MODELES CONSERVES (à ne pas toucher) :
echo    ✅ form-ai-generator.html
echo    ✅ form-builder-fixed.html
echo.
echo 🚀 Prêt à développer le nouveau frontend FormEase !
echo.
pause
