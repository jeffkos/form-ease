#!/bin/bash
# Script d'automatisation pour tester Prisma sous WSL2/Linux
# À placer dans le dossier backend et à exécuter avec : bash test_prisma_wsl.sh

set -e

# Installation Node.js si besoin (décommenter si nécessaire)
# sudo apt update
# sudo apt install -y nodejs npm

# Nettoyage
rm -rf node_modules .prisma

# Installation des dépendances
npm ci

# Génération Prisma avec le schéma minimal
npx prisma generate --schema=prisma/schema_test.prisma

echo "\nVérifie maintenant dans node_modules/@prisma/client/index.d.ts si le modèle Contact est bien généré."
