# 🚀 FormEase - Générateur de Formulaires Intelligent

[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-green)](https://www.prisma.io/)
[![Tremor UI](https://img.shields.io/badge/Tremor-UI-purple)](https://www.tremor.so/)
[![Licence MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**FormEase** est une plateforme moderne de création de formulaires avec intelligence artificielle, conçue pour simplifier la collecte de données et l'analyse des résultats.

![FormEase Dashboard](https://via.placeholder.com/800x400/2563eb/ffffff?text=FormEase+Dashboard)

## ✨ Fonctionnalités Principales

### 🤖 **Intelligence Artificielle**
- Génération automatique de formulaires via IA
- Suggestions intelligentes de champs
- Optimisation automatique de l'UX

### 📊 **Analytics Avancées**
- Dashboard en temps réel avec graphiques Tremor
- Statistiques de conversion et d'engagement
- Rapports d'export PDF/CSV

### 🔐 **Sécurité Renforcée**
- Authentification JWT sécurisée
- Rate limiting et protection CSRF
- Validation stricte des données (Joi)
- Headers de sécurité (Helmet)

### 💳 **Modèle Freemium**
- Plan gratuit : 1 formulaire, 100 soumissions
- Plan premium : formulaires illimités, analytics avancées
- Gestion automatique des quotas

### 👥 **Multi-Rôles**
- **Utilisateur** : Création et gestion de formulaires
- **SUPERADMIN** : Analytics globales, gestion utilisateurs

## 🏗️ Architecture

```
FormEase/
├── 🎨 frontend/          # Next.js 14 + TypeScript + Tremor UI
├── ⚙️ backend/           # Express.js + Prisma + PostgreSQL
├── 📊 docs/             # Documentation technique
└── 🧪 tests/            # Tests automatisés
```

### Stack Technique

#### Frontend
- **Next.js 14** (App Router) - Framework React
- **TypeScript** - Typage statique
- **Tremor UI** - Composants d'interface modernes
- **Tailwind CSS** - Styling utilitaire
- **React Context** - Gestion d'état

#### Backend
- **Express.js** - Serveur API REST
- **Prisma ORM** - Abstraction base de données
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification stateless
- **Winston** - Logging structuré

#### Sécurité
- **Joi** - Validation des schémas
- **Helmet** - Headers de sécurité
- **Rate Limiting** - Protection DDoS
- **bcrypt** - Hashage des mots de passe

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### ⚠️ IMPORTANT - Sécurité
**Avant de commencer, lisez ceci :**
- Ne jamais commiter le fichier `.env` avec de vraies données
- Générez vos propres clés JWT sécurisées
- Utilisez des mots de passe forts pour la base de données
- Configurez SMTP avec vos propres identifiants

### 1. Clone du Repository
```bash
git clone https://github.com/informagenie/FormEase.git
cd FormEase
```

### 2. Installation Backend
```bash
cd formease/backend
npm install

# Générer des clés sécurisées
node scripts/generate-jwt-secret.js

# Configurer l'environnement
cp .env.example .env
# ⚠️ ÉDITEZ .env avec VOS vraies valeurs sécurisées

npx prisma migrate dev
npm start
```

### 3. Installation Frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Accès à l'Application
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000
- **Documentation** : http://localhost:3000/docs

## 📖 Guide d'Utilisation

### Démarrage Utilisateur

1. **Inscription** sur `/login`
2. **Connexion** au dashboard
3. **Création** d'un formulaire (manuel ou IA)
4. **Partage** du lien de formulaire
5. **Analyse** des résultats en temps réel

### Administration

1. **Connexion SUPERADMIN**
2. **Gestion des utilisateurs** (`/admin/users`)
3. **Analytics globales** (`/admin/dashboard`)
4. **Rapports financiers** (`/admin/finances`)

## 🧪 Tests & Qualité

### Tests Backend
```bash
cd formease/backend
npm test                 # Tests unitaires Jest
npm run test:coverage    # Couverture de code
```

### Tests Frontend
```bash
cd formease/frontend
npm run lint            # ESLint + TypeScript
npm run build           # Test de build production
npm run test:e2e        # Tests E2E Playwright
```

### Métriques de Qualité
- ✅ **Tests Backend** : 15/19 passés (79%)
- ✅ **Build Frontend** : ✓ Réussi
- ✅ **TypeScript** : ✓ Strict mode
- ✅ **Sécurité** : ✓ Headers + JWT + Validation

## 📊 Statistiques du Projet

| Métrique | Frontend | Backend | Total |
|----------|----------|---------|-------|
| **Lignes de Code** | ~15,000 | ~8,000 | ~23,000 |
| **Fichiers** | 85+ | 45+ | 130+ |
| **Composants** | 30+ | - | 30+ |
| **API Routes** | 10 | 25+ | 35+ |
| **Tests** | 5 | 19 | 24 |

## 🚀 Déploiement

### Production avec Docker
```bash
# Build des images
docker-compose build

# Démarrage des services
docker-compose up -d

# Application disponible sur http://localhost
```

### Déploiement Vercel (Frontend)
```bash
cd formease/frontend
vercel --prod
```

### Variables d'Environnement
```env
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/formease"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📈 Roadmap

### Version 1.1 (Q3 2025)
- [ ] Templates de formulaires prédéfinis
- [ ] Intégrations Zapier/Webhook
- [ ] Mode hors-ligne (PWA)
- [ ] Thèmes personnalisables

### Version 1.2 (Q4 2025)  
- [ ] API publique avec clés d'accès
- [ ] Analytiques avancées (machine learning)
- [ ] Collaboration équipe
- [ ] Formulaires conditionnels avancés

## 🤝 Contribution

Nous accueillons toutes les contributions ! 

### Comment Contribuer
1. **Fork** le repository
2. **Créez** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Guidelines
- Respectez les conventions TypeScript/ESLint
- Ajoutez des tests pour les nouvelles fonctionnalités
- Documentez les changements dans le CHANGELOG
- Suivez le pattern de commit conventionnel

## 📜 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🏆 Crédits

### Équipe de Développement
- **InformaGenie** - Concept et développement principal
- **Contributeurs** - Voir [CONTRIBUTORS.md](CONTRIBUTORS.md)

### Technologies Utilisées
- [Next.js](https://nextjs.org/) - Framework React
- [Tremor](https://tremor.so/) - Bibliothèque de composants
- [Prisma](https://prisma.io/) - ORM TypeScript
- [Express.js](https://expressjs.com/) - Framework backend

## 📞 Support & Contact

### Support Technique
- 🐛 **Issues** : [GitHub Issues](https://github.com/informagenie/FormEase/issues)
- 📧 **Email** : support@informagenie.com
- 💬 **Discord** : [Serveur FormEase](https://discord.gg/formease)

### Documentation
- 📚 **Wiki** : [GitHub Wiki](https://github.com/informagenie/FormEase/wiki)
- 📖 **API Docs** : [Swagger UI](http://localhost:4000/api-docs)
- 🎥 **Tutoriels** : [YouTube Channel](https://youtube.com/@informagenie)

---

<div align="center">

**⭐ Si FormEase vous plaît, n'hésitez pas à lui donner une étoile ! ⭐**

Créé avec ❤️ par [InformaGenie](https://github.com/informagenie)

[🌐 Site Web](https://formease.app) • [📱 Demo](https://demo.formease.app) • [📧 Contact](mailto:hello@informagenie.com)

</div>
