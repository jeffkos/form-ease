# 🚀 Guide d'Installation FormEase

## ⚠️ Prérequis

1. **Node.js** >= 18.0.0
2. **PostgreSQL** >= 12.0
3. **npm** ou **yarn**
4. **Git**

## 📦 Installation Étape par Étape

### 1. Cloner le Projet
```bash
git clone https://github.com/informagenie/FormEase.git
cd FormEase
```

### 2. Configuration Base de Données
```sql
-- Créer la base de données PostgreSQL
CREATE DATABASE formease_db;
CREATE USER formease_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE formease_db TO formease_user;
```

### 3. Configuration Backend
```bash
cd formease/backend

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs

# Générer le client Prisma et faire les migrations
npx prisma generate
npx prisma migrate dev --name init

# Optionnel: Créer un utilisateur admin
npm run create-admin
```

### 4. Configuration Frontend
```bash
cd ../frontend

# Installer les dépendances
npm install

# Créer le fichier d'environnement
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
```

### 5. Démarrage
```bash
# Terminal 1 - Backend
cd formease/backend
npm run dev

# Terminal 2 - Frontend  
cd formease/frontend
npm run dev
```

## 🌐 Accès
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Documentation API**: http://localhost:4000/docs (à venir)

## 🔧 Problèmes Courants

### Erreur Prisma "enableTracing"
```bash
# Solution
export PRISMA_ENABLE_TRACING=true
# Ou ajouter dans .env:
PRISMA_ENABLE_TRACING=true
```

### Base de données non connectée
```bash
# Vérifier la connexion
npx prisma db pull
npx prisma studio
```

### Port déjà utilisé
```bash
# Changer les ports dans:
# Backend: src/app.js (PORT=4001)
# Frontend: package.json (3001)
```

## ✅ Vérification Installation

```bash
# Tests backend
cd formease/backend && npm test

# Build frontend
cd formease/frontend && npm run build

# Vérifier les services
curl http://localhost:4000/health
curl http://localhost:3000/api/health
```

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs : `formease/backend/logs/`
2. Consultez les issues GitHub
3. Suivez le guide de troubleshooting

---
**FormEase** - Prêt à l'emploi après configuration ! 🎉
