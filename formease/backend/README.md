# 🔧 FormEase Backend

API REST robuste pour FormEase, construite avec Express.js, Prisma ORM et PostgreSQL.

## 🛠️ Technologies

- **Express.js** - Framework web rapide et minimaliste
- **Prisma ORM** - Interface de base de données type-safe
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification stateless
- **Winston** - Logging structuré
- **Joi** - Validation des schémas
- **Jest** - Framework de tests

## 🏗️ Architecture

```
backend/
├── src/
│   ├── controllers/       # Logique métier
│   ├── middleware/        # Middleware Express
│   ├── routes/           # Définition des routes
│   ├── services/         # Services métier
│   ├── utils/            # Utilitaires
│   └── app.js            # Point d'entrée
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── migrations/       # Migrations de DB
├── tests/                # Tests unitaires
└── logs/                 # Fichiers de logs
```

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Configuration
```bash
# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Editez .env avec vos paramètres

# Migration de la base de données
npx prisma migrate dev

# Génération du client Prisma
npx prisma generate

# Démarrage du serveur
npm start
```

### Variables d'Environnement
```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/formease"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Serveur
PORT=4000
NODE_ENV=development

# Logs
LOG_LEVEL=info
```

## 📡 API Endpoints

### Authentification
```
POST   /api/auth/register     # Inscription utilisateur
POST   /api/auth/login        # Connexion utilisateur
GET    /api/auth/profile      # Profil utilisateur (protégé)
POST   /api/auth/refresh      # Refresh token
```

### Formulaires
```
GET    /api/forms             # Liste des formulaires (protégé)
POST   /api/forms             # Créer un formulaire (protégé)
GET    /api/forms/:id         # Détails d'un formulaire
PUT    /api/forms/:id         # Modifier un formulaire (protégé)
DELETE /api/forms/:id         # Supprimer un formulaire (protégé)
```

### Soumissions
```
POST   /api/submissions/form/:formId    # Soumettre un formulaire (public)
GET    /api/submissions/form/:formId    # Liste des soumissions (protégé)
GET    /api/submissions/:id/export/csv  # Export CSV (protégé)
GET    /api/submissions/:id/export/pdf  # Export PDF (protégé)
```

### Administration (SUPERADMIN)
```
GET    /api/admin/users         # Gestion des utilisateurs
GET    /api/admin/stats         # Statistiques globales
GET    /api/admin/finances      # Données financières
```

## 🔐 Sécurité

### Middleware de Sécurité
- **Helmet** - Headers de sécurité HTTP
- **CORS** - Contrôle d'accès cross-origin
- **Rate Limiting** - Protection contre les attaques DDoS
- **JWT Verification** - Validation des tokens d'authentification

### Validation des Données
```javascript
// Exemple de validation Joi
const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  language: Joi.string().valid('FR', 'EN').required()
});
```

### Logging Sécurisé
```javascript
// Logs structurés avec Winston
logger.info('User login attempt', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.get('User-Agent')
});
```

## 📊 Gestion des Quotas

### Plans Utilisateur
```javascript
const QUOTAS = {
  free: {
    forms: 1,
    submissionsPerForm: 100,
    exportsPerDay: 5
  },
  premium: {
    forms: 100,
    submissionsPerForm: 10000,
    exportsPerDay: 100
  }
};
```

### Middleware de Quotas
- `checkFormQuota` - Vérifie le nombre de formulaires
- `checkSubmissionQuota` - Vérifie les soumissions par formulaire  
- `checkExportQuota` - Vérifie les exports quotidiens

## 🗄️ Base de Données

### Schéma Prisma
```prisma
model User {
  id            Int      @id @default(autoincrement())
  first_name    String
  last_name     String
  email         String   @unique
  password_hash String
  role          Role     @default(USER)
  plan          Plan     @default(free)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  forms         Form[]
}

model Form {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  fields      Json
  status      FormStatus @default(draft)
  user_id     Int
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  user        User @relation(fields: [user_id], references: [id])
  submissions FormSubmission[]
}
```

### Migrations
```bash
# Créer une nouvelle migration
npx prisma migrate dev --name add_new_feature

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base de données (développement)
npx prisma migrate reset
```

## 🧪 Tests

### Exécution des Tests
```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests spécifiques
npm test -- auth.test.js
```

### Structure des Tests
```
tests/
├── auth.test.js          # Tests d'authentification
├── validation.test.js    # Tests de validation
├── submission.test.js    # Tests de soumissions
└── setup.js             # Configuration Jest
```

### Exemple de Test
```javascript
describe('Authentication', () => {
  it('should register a new user', async () => {
    const userData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'Password123!',
      language: 'FR'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(userData.email);
  });
});
```

## 📈 Monitoring & Logs

### Logs Structurés
```javascript
// Configuration Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### Métriques de Performance
- Temps de réponse API
- Taux d'erreurs par endpoint
- Utilisation mémoire/CPU
- Connexions base de données actives

## 🚀 Déploiement

### Environnement de Production
```bash
# Build pour la production
npm run build

# Démarrage en production
npm start

# Avec PM2 (recommandé)
pm2 start src/app.js --name formease-backend
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### Variables d'Environnement Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@prod-db:5432/formease"
JWT_SECRET="super-secure-jwt-secret-for-production"
LOG_LEVEL=warn
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📞 Support

- 🐛 **Issues** : [GitHub Issues](https://github.com/informagenie/FormEase/issues)
- 📧 **Email** : backend@formease.app
- 📚 **API Docs** : http://localhost:4000/api-docs

---

**FormEase Backend** - Créé avec ❤️ par [InformaGenie](https://github.com/informagenie)
