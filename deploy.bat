@echo off
REM FormEase Deployment Script for Windows
REM Run this script after creating the repository on GitHub

echo 🚀 FormEase Deployment Script
echo =============================

REM Configure repository
echo 📋 Configuring repository...
git remote remove origin 2>nul
git remote add origin https://github.com/informagenie/FormEase1.git

REM Add and commit any final changes
echo 📝 Adding final changes...
git add .
git commit -m "🚀 FINAL DEPLOYMENT: FormEase WeTransfer-style complete" 2>nul || echo No changes to commit

REM Push to GitHub
echo 🌐 Pushing to GitHub...
git push -u origin main

echo ✅ Deployment complete!
echo 🔗 Repository: https://github.com/informagenie/FormEase1
echo 🎨 Landing page: WeTransfer-style with AI form generation
echo 📱 Features: Next.js + Tremor + Framer Motion + RemixIcon

pause
