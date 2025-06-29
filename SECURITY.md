# 🔒 Guide de Sécurité - FormEase

## ⚠️ AVERTISSEMENTS CRITIQUES

### 🚨 À FAIRE IMMÉDIATEMENT

1. **CHANGER TOUS LES MOTS DE PASSE PAR DÉFAUT**
2. **GÉNÉRER UNE NOUVELLE CLÉ JWT**
3. **CONFIGURER VOS PROPRES IDENTIFIANTS SMTP**
4. **VÉRIFIER QUE .env N'EST PAS DANS GIT**

### 🔐 Configuration Sécurisée

#### 1. Génération de Clé JWT Sécurisée
```bash
# Utiliser le script fourni
cd formease/backend
node scripts/generate-jwt-secret.js

# Ou générer manuellement
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Base de Données Sécurisée
```bash
# Créer un utilisateur dédié PostgreSQL
sudo -u postgres createuser --interactive formease_user
sudo -u postgres createdb formease_db --owner=formease_user

# Mot de passe fort requis
sudo -u postgres psql -c "ALTER USER formease_user PASSWORD 'VotreMotDePasseTresFort123!@#';"
```

#### 3. Configuration SMTP Sécurisée
```env
# Utiliser un service SMTP dédié (pas votre email personnel)
SMTP_HOST=smtp.mailgun.com  # ou smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=your-api-key-username
SMTP_PASS=your-api-key-password
```

### 📋 Checklist Sécurité

#### Variables d'Environnement
- [ ] ✅ `.env` est dans `.gitignore`
- [ ] ✅ JWT_SECRET généré aléatoirement (64+ caractères)
- [ ] ✅ DATABASE_URL avec mot de passe fort
- [ ] ✅ SMTP_PASS avec vraies credentials
- [ ] ✅ Pas de données de test/développement en production

#### Base de Données
- [ ] ✅ Utilisateur PostgreSQL dédié (non-superuser)
- [ ] ✅ Connexions limitées par IP
- [ ] ✅ Backups automatiques configurés
- [ ] ✅ SSL/TLS activé en production

#### Application
- [ ] ✅ HTTPS activé en production
- [ ] ✅ Headers de sécurité (Helmet.js)
- [ ] ✅ Rate limiting configuré
- [ ] ✅ Validation des entrées (Joi)
- [ ] ✅ Logs de sécurité activés

### 🚫 À NE JAMAIS FAIRE

❌ **Commiter des fichiers .env avec de vraies données**
❌ **Utiliser des mots de passe faibles ou par défaut**
❌ **Exposer les clés API dans le code source**
❌ **Utiliser 'admin/admin' ou '123456' comme mot de passe**
❌ **Désactiver HTTPS en production**
❌ **Oublier de changer les clés par défaut**

### 🔍 Audit de Sécurité

#### Commandes de Vérification
```bash
# Vérifier qu'aucun secret n'est commité
git log --all --full-history -- "**/.env*"

# Scanner les vulnérabilités npm
npm audit

# Vérifier les permissions PostgreSQL
psql -c "\\du" # Liste les utilisateurs et leurs privilèges
```

#### Outils Recommandés
- **git-secrets** - Prévention de commits de secrets
- **npm audit** - Scan des vulnérabilités
- **helmet.js** - Headers de sécurité
- **bcrypt** - Hashage des mots de passe

### 🛡️ Production Security

#### Variables d'Environnement Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@prod-host:5432/db?sslmode=require"
JWT_SECRET="votre-cle-super-securisee-de-production-64-caracteres-minimum"
SMTP_HOST=smtp.mailgun.com
# etc.
```

#### Headers de Sécurité
L'application utilise Helmet.js pour sécuriser les headers HTTP :
- Content Security Policy (CSP)
- X-Frame-Options
- X-XSS-Protection
- Strict Transport Security (HSTS)

### 📞 Support Sécurité

En cas de vulnérabilité découverte :
1. **NE PAS** créer d'issue publique
2. Contacter : security@formease.app
3. Fournir : description, impact, reproduction
4. Attendre confirmation avant divulgation

### 🏆 Bug Bounty

Nous récompensons la découverte responsable de vulnérabilités :
- **Critique** : 500€ - 1000€
- **Haute** : 200€ - 500€
- **Moyenne** : 50€ - 200€
- **Faible** : Reconnaissance publique

---

## ⚡ Actions Immédiates Requises

1. **Exécuter le générateur de clés :**
   ```bash
   cd formease/backend && node scripts/generate-jwt-secret.js
   ```

2. **Éditer votre .env avec les vraies valeurs**

3. **Vérifier que .env n'est pas dans Git :**
   ```bash
   git status  # .env ne doit PAS apparaître
   ```

4. **Tester la configuration :**
   ```bash
   npm start  # Backend doit démarrer sans erreurs
   ```

**🔒 La sécurité de FormEase dépend de VOTRE configuration !**
