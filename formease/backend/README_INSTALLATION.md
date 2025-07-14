# 🚀 GUIDE D'INSTALLATION - FormEase Backend

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Rapide](#installation-rapide)
3. [Configuration](#configuration)
4. [Base de Données](#base-de-données)
5. [Services Externes](#services-externes)
6. [Démarrage](#démarrage)
7. [Vérifications](#vérifications)
8. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### Logiciels Requis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 13.0
- **Git** (pour le développement)

### Vérification des Prérequis

```bash
# Vérifier Node.js
node --version

# Vérifier npm
npm --version

# Vérifier PostgreSQL
psql --version
```

---

## ⚡ Installation Rapide

### 1. Cloner le Projet

```bash
git clone https://github.com/votre-org/formease.git
cd formease/backend
```

### 2. Configuration Automatique

```bash
# Installation complète avec configuration
npm run dev:full
```

Cette commande va :

- Installer toutes les dépendances
- Créer le fichier `.env` avec les valeurs par défaut
- Configurer la base de données
- Créer le super admin
- Démarrer le serveur

---

## 🔧 Configuration Manuelle

### 1. Installation des Dépendances

```bash
npm install
```

### 2. Configuration de l'Environnement

```bash
# Créer le fichier .env
npm run env:setup

# Ou copier manuellement
cp config.env.example .env
```

### 3. Personnaliser le Fichier .env

Éditez le fichier `.env` avec vos valeurs :

```env
# Base de données
DATABASE_URL="postgresql://formease:motdepasse@localhost:5432/formease_db"

# JWT Secrets (générés automatiquement)
JWT_SECRET="votre-secret-jwt-32-caracteres-minimum"

# Email (O2switch par défaut)
SMTP_HOST="smtp1.o2switch.net"
SMTP_USER="votre-email@votredomaine.com"
SMTP_PASS="votre-mot-de-passe-email"

# Stripe
STRIPE_SECRET_KEY="sk_test_votre-cle-stripe"
STRIPE_WEBHOOK_SECRET="whsec_votre-webhook-secret"

# OpenAI
OPENAI_API_KEY="sk-votre-cle-openai"
```

---

## 🗄️ Base de Données

### Configuration PostgreSQL

#### Option 1 : Installation Locale

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (avec Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Télécharger depuis https://www.postgresql.org/download/windows/
```

#### Option 2 : Docker

```bash
# Démarrer PostgreSQL avec Docker
docker run --name formease-postgres \
  -e POSTGRES_DB=formease_db \
  -e POSTGRES_USER=formease \
  -e POSTGRES_PASSWORD=formease123 \
  -p 5432:5432 \
  -d postgres:15
```

### Création de la Base de Données

```bash
# Créer la base de données
createdb formease_db

# Créer l'utilisateur
psql -c "CREATE USER formease WITH PASSWORD 'formease123';"

# Accorder les permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE formease_db TO formease;"
```

### Initialisation de la Base de Données

```bash
# Configuration complète avec données de test
npm run db:setup

# Réinitialisation complète
npm run db:reset

# Migrations seulement
npm run db:migrate
```

---

## 🔌 Services Externes

### Stripe (Paiements)

1. Créer un compte sur [Stripe](https://stripe.com)
2. Obtenir vos clés API dans le dashboard
3. Configurer les webhooks :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `payment_intent.succeeded`, `customer.subscription.updated`

### OpenAI (IA)

1. Créer un compte sur [OpenAI](https://openai.com)
2. Obtenir votre clé API
3. Configurer les limites de coût

### Email (O2switch)

1. Configurer votre compte email O2switch
2. Activer SMTP dans le panneau de contrôle
3. Utiliser les paramètres fournis

---

## 🚀 Démarrage

### Mode Développement

```bash
# Démarrage avec vérifications complètes
npm run dev:full

# Démarrage simple
npm start

# Démarrage avec hot reload
npm run dev
```

### Mode Production

```bash
# Démarrage production
NODE_ENV=production npm start

# Ou avec le script complet
npm run start:prod
```

---

## ✅ Vérifications

### Vérification Complète

```bash
# Vérifier tous les composants
node scripts/start-formease.js --check-only
```

### Vérifications Individuelles

```bash
# Vérifier la base de données
npm run db:check

# Vérifier les services externes
npm run services:check

# Vérifier la configuration
npm run config:check
```

### Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests d'intégration
npm run test:integration
```

---

## 🔍 Dépannage

### Problèmes Courants

#### 1. Erreur de Connexion à la Base de Données

```
❌ Impossible de se connecter à la base de données
```

**Solutions :**

- Vérifier que PostgreSQL est démarré
- Vérifier la `DATABASE_URL` dans `.env`
- Vérifier les permissions utilisateur

```bash
# Vérifier le statut PostgreSQL
sudo systemctl status postgresql

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

#### 2. Variables d'Environnement Manquantes

```
❌ Variables d'environnement manquantes: JWT_SECRET
```

**Solutions :**

- Exécuter `npm run env:setup`
- Vérifier que le fichier `.env` existe
- Copier `config.env.example` vers `.env`

#### 3. Erreur de Permissions

```
❌ Permissions .env trop ouvertes
```

**Solutions :**

```bash
# Corriger les permissions
chmod 600 .env
```

#### 4. Port Déjà Utilisé

```
❌ Port 4000 already in use
```

**Solutions :**

- Changer le port dans `.env` : `PORT=4001`
- Tuer le processus : `pkill -f "node.*app.js"`

#### 5. Dépendances Manquantes

```
❌ Dépendance manquante: express
```

**Solutions :**

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Logs et Debugging

```bash
# Voir les logs en temps réel
tail -f logs/combined.log

# Voir les erreurs
tail -f logs/error.log

# Mode verbose
VERBOSE=true npm start
```

---

## 📊 Monitoring

### Health Check

```bash
# Vérifier la santé du serveur
curl http://localhost:4000/health
```

### Métriques

```bash
# Voir les métriques Prometheus
curl http://localhost:4000/metrics
```

### Alertes

Le système d'alertes surveille automatiquement :

- Performance de l'API
- Santé de la base de données
- Métriques business
- Quotas utilisateurs

---

## 🔒 Sécurité

### Recommandations

1. **Changez tous les mots de passe par défaut**
2. **Utilisez des secrets JWT de 32+ caractères**
3. **Configurez HTTPS en production**
4. **Limitez les accès réseau**
5. **Activez les logs d'audit**

### Audit de Sécurité

```bash
# Vérifier la sécurité
npm audit

# Corriger les vulnérabilités
npm audit fix
```

---

## 📚 Scripts Disponibles

| Script                | Description                |
| --------------------- | -------------------------- |
| `npm start`           | Démarrage normal           |
| `npm run dev`         | Mode développement         |
| `npm run dev:full`    | Configuration + démarrage  |
| `npm run db:setup`    | Initialiser la base        |
| `npm run db:reset`    | Réinitialiser la base      |
| `npm run db:migrate`  | Appliquer les migrations   |
| `npm run db:studio`   | Interface Prisma Studio    |
| `npm run env:setup`   | Configurer l'environnement |
| `npm test`            | Lancer les tests           |
| `npm run logs:clear`  | Vider les logs             |
| `npm run maintenance` | Maintenance des quotas     |

---

## 🆘 Support

### Ressources

- **Documentation** : `/docs`
- **API Reference** : `http://localhost:4000/api-docs`
- **Issues** : GitHub Issues
- **Wiki** : GitHub Wiki

### Contact

- **Email** : support@formease.com
- **Discord** : [Serveur FormEase](https://discord.gg/formease)
- **Documentation** : [docs.formease.com](https://docs.formease.com)

---

## 📈 Prochaines Étapes

Après l'installation réussie :

1. **Accéder au Dashboard Admin** : `http://localhost:4000/admin`
2. **Configurer les Services** (Stripe, Email, etc.)
3. **Créer votre Premier Formulaire**
4. **Tester les Paiements** en mode sandbox
5. **Configurer le Monitoring**

---

**🎉 Félicitations ! FormEase est maintenant installé et prêt à l'emploi.**

Pour toute question, consultez la documentation ou contactez le support.
