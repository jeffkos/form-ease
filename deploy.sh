#!/bin/bash

# FormEase Deployment Script
# Run this script after creating the repository on GitHub

echo "🚀 FormEase Deployment Script"
echo "============================="

# Configure repository
echo "📋 Configuring repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/informagenie/FormEase1.git

# Add and commit any final changes
echo "📝 Adding final changes..."
git add .
git commit -m "🚀 FINAL DEPLOYMENT: FormEase WeTransfer-style complete" || echo "No changes to commit"

# Push to GitHub
echo "🌐 Pushing to GitHub..."
git push -u origin main

echo "✅ Deployment complete!"
echo "🔗 Repository: https://github.com/informagenie/FormEase1"
echo "🎨 Landing page: WeTransfer-style with AI form generation"
echo "📱 Features: Next.js + Tremor + Framer Motion + RemixIcon"
