#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE CONFIGURATION D'ENVIRONNEMENT - FormEase
 *
 * Ce script configure automatiquement l'environnement de développement
 * en créant le fichier .env avec les valeurs par défaut
 *
 * Usage:
 *   node scripts/setup-environment.js [--force] [--prod]
 *
 * Options:
 *   --force : Écrase le fichier .env existant
 *   --prod  : Configuration pour la production
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

// Configuration
const CONFIG = {
  force: process.argv.includes("--force"),
  production: process.argv.includes("--prod"),
  verbose: process.argv.includes("--verbose"),
};

const ENV_FILE = path.join(__dirname, "..", ".env");
const ENV_EXAMPLE_FILE = path.join(__dirname, "..", "config.env.example");

/**
 * 🔐 Génération de clés sécurisées
 */
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * 📝 Génération du contenu .env
 */
function generateEnvContent() {
  const jwtSecret = generateSecureKey(32);
  const jwtRefreshSecret = generateSecureKey(32);
  const encryptionKey = generateSecureKey(16);

  const envContent = `# ======================================
# 🔧 CONFIGURATION FORMEASE - BACKEND
# ======================================
# Généré automatiquement le ${new Date().toISOString()}

# =====================================
# 🗄️ BASE DE DONNÉES
# =====================================
DATABASE_URL="postgresql://formease:formease123@localhost:5432/formease_db"

# =====================================
# 🔐 AUTHENTIFICATION & SÉCURITÉ
# =====================================
JWT_SECRET="${jwtSecret}"
JWT_REFRESH_SECRET="${jwtRefreshSecret}"

# =====================================
# 🌐 SERVEUR
# =====================================
NODE_ENV="${CONFIG.production ? "production" : "development"}"
PORT=4000
FRONTEND_URL="http://localhost:3000"

# =====================================
# 👤 SUPER ADMIN (À CHANGER EN PRODUCTION)
# =====================================
ADMIN_EMAIL="admin@formease.com"
ADMIN_PASSWORD="AdminFormEase2024!"

# =====================================
# 📧 CONFIGURATION EMAIL
# =====================================
EMAIL_PROVIDER="nodemailer"

# SMTP Configuration (O2switch par défaut)
SMTP_HOST="smtp1.o2switch.net"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="votre-email@votredomaine.com"
SMTP_PASS="votre-mot-de-passe-email"
SMTP_FROM="FormEase <noreply@formease.com>"

# SendGrid (optionnel)
# SENDGRID_API_KEY="SG.votre-cle-sendgrid"

# MailerSend (optionnel)
# MAILERSEND_API_KEY="votre-cle-mailersend"

# =====================================
# 💳 PAIEMENTS STRIPE
# =====================================
STRIPE_SECRET_KEY="sk_test_51234567890abcdef1234567890abcdef1234567890abcdef1234567890"
STRIPE_WEBHOOK_SECRET="whsec_test_votre_webhook_secret"
STRIPE_PREMIUM_PRICE_ID="price_test_premium_monthly"

# =====================================
# 🤖 INTELLIGENCE ARTIFICIELLE
# =====================================
OPENAI_API_KEY="sk-votre-cle-openai-api"

# =====================================
# 🗄️ CACHE REDIS (Optionnel)
# =====================================
# REDIS_URL="redis://localhost:6379"

# =====================================
# 📊 MONITORING & ALERTES
# =====================================
# Slack (pour les alertes)
# SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
# SLACK_BOT_TOKEN="xoxb-votre-slack-bot-token"

# =====================================
# 🔧 DÉVELOPPEMENT
# =====================================
LOG_LEVEL="info"
VERBOSE="false"
DRY_RUN="false"

# =====================================
# 🔒 SÉCURITÉ AVANCÉE
# =====================================
ENCRYPTION_KEY="${encryptionKey}"
HASH_SALT_ROUNDS=12

# =====================================
# 📈 MÉTRIQUES BUSINESS
# =====================================
DEFAULT_LANGUAGE="fr"
SUPPORTED_LANGUAGES="fr,en"

# =====================================
# 📁 STOCKAGE FICHIERS
# =====================================
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# =====================================
# ⚡ PERFORMANCE
# =====================================
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
CACHE_TTL=3600

# =====================================
# 🔄 CRON JOBS
# =====================================
QUOTA_CLEANUP_CRON="0 2 * * *"
MONITORING_ALERT_INTERVAL=30

# =====================================
# 📱 SMS (Optionnel)
# =====================================
# TWILIO_ACCOUNT_SID="votre-twilio-account-sid"
# TWILIO_AUTH_TOKEN="votre-twilio-auth-token"
# FREE_MOBILE_USER="votre-utilisateur-free"
# FREE_MOBILE_PASS="votre-mot-de-passe-free"

# =====================================
# 🚀 PRODUCTION (Décommentez si nécessaire)
# =====================================
# SENTRY_DSN="https://votre-sentry-dsn@sentry.io/project-id"
# WHITELISTED_IPS="192.168.1.1,10.0.0.1"
# VAPID_PUBLIC_KEY="votre-vapid-public-key"
# VAPID_PRIVATE_KEY="votre-vapid-private-key"
`;

  return envContent;
}

/**
 * 🔍 Vérification des prérequis
 */
function checkPrerequisites() {
  console.log("🔍 Vérification des prérequis...");

  // Vérifier si Node.js est installé
  try {
    const nodeVersion = execSync("node --version", { encoding: "utf8" }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
  } catch (error) {
    console.error("❌ Node.js n'est pas installé");
    process.exit(1);
  }

  // Vérifier si npm est installé
  try {
    const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
    console.log(`✅ npm: ${npmVersion}`);
  } catch (error) {
    console.error("❌ npm n'est pas installé");
    process.exit(1);
  }

  // Vérifier si PostgreSQL est disponible (optionnel)
  try {
    execSync("psql --version", { encoding: "utf8", stdio: "pipe" });
    console.log("✅ PostgreSQL est disponible");
  } catch (error) {
    console.warn(
      "⚠️ PostgreSQL n'est pas dans le PATH (normal si utilisation Docker)"
    );
  }
}

/**
 * 📦 Installation des dépendances
 */
function installDependencies() {
  console.log("📦 Installation des dépendances...");

  try {
    execSync("npm install", { stdio: "inherit" });
    console.log("✅ Dépendances installées");
  } catch (error) {
    console.error("❌ Erreur lors de l'installation des dépendances");
    process.exit(1);
  }
}

/**
 * 📝 Création du fichier .env
 */
function createEnvFile() {
  console.log("📝 Création du fichier .env...");

  // Vérifier si le fichier existe déjà
  if (fs.existsSync(ENV_FILE) && !CONFIG.force) {
    console.log("ℹ️ Le fichier .env existe déjà");
    console.log("💡 Utilisez --force pour l'écraser");
    return;
  }

  try {
    const envContent = generateEnvContent();
    fs.writeFileSync(ENV_FILE, envContent, "utf8");
    console.log("✅ Fichier .env créé");

    // Définir les permissions appropriées (lecture/écriture pour le propriétaire seulement)
    if (process.platform !== "win32") {
      fs.chmodSync(ENV_FILE, 0o600);
      console.log("✅ Permissions .env configurées (600)");
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création du fichier .env:",
      error.message
    );
    process.exit(1);
  }
}

/**
 * 📁 Création des répertoires nécessaires
 */
function createDirectories() {
  console.log("📁 Création des répertoires...");

  const directories = ["logs", "uploads", "temp", "backups"];

  directories.forEach((dir) => {
    const dirPath = path.join(__dirname, "..", dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Répertoire créé: ${dir}`);
    }
  });
}

/**
 * 🗄️ Configuration de la base de données
 */
function setupDatabase() {
  console.log("🗄️ Configuration de la base de données...");

  if (CONFIG.production) {
    console.log(
      "ℹ️ Mode production - configuration manuelle de la base de données requise"
    );
    return;
  }

  // Instructions pour PostgreSQL local
  console.log("📋 Instructions pour PostgreSQL local:");
  console.log("   1. Installez PostgreSQL si ce n'est pas fait");
  console.log("   2. Créez la base de données:");
  console.log("      createdb formease_db");
  console.log("   3. Créez l'utilisateur:");
  console.log(
    "      psql -c \"CREATE USER formease WITH PASSWORD 'formease123';\""
  );
  console.log("   4. Accordez les permissions:");
  console.log(
    '      psql -c "GRANT ALL PRIVILEGES ON DATABASE formease_db TO formease;"'
  );
  console.log("   5. Exécutez les migrations:");
  console.log("      npm run db:setup");
}

/**
 * 🔧 Configuration des outils de développement
 */
function setupDevTools() {
  console.log("🔧 Configuration des outils de développement...");

  // Créer le fichier .gitignore s'il n'existe pas
  const gitignorePath = path.join(__dirname, "..", ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Dépendances
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environnement
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Base de données
*.db
*.sqlite

# Uploads
uploads/*
!uploads/.gitkeep

# Temp
temp/
tmp/

# Cache
.cache/
.parcel-cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Backups
backups/

# Tests
coverage/
.nyc_output/

# Prisma
prisma/migrations/migration_lock.toml
`;

    fs.writeFileSync(gitignorePath, gitignoreContent, "utf8");
    console.log("✅ Fichier .gitignore créé");
  }
}

/**
 * 📋 Scripts package.json
 */
function updatePackageScripts() {
  console.log("📋 Mise à jour des scripts package.json...");

  const packagePath = path.join(__dirname, "..", "package.json");

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    // Ajouter des scripts utiles
    packageJson.scripts = {
      ...packageJson.scripts,
      "db:setup": "node scripts/setup-database.js --seed",
      "db:reset": "node scripts/setup-database.js --reset --seed",
      "db:migrate": "npx prisma migrate dev",
      "db:studio": "npx prisma studio",
      "env:setup": "node scripts/setup-environment.js",
      "dev:full": "npm run env:setup && npm run db:setup && npm start",
      "test:setup": "NODE_ENV=test npm run db:setup",
      "logs:clear": "rm -rf logs/* || rmdir /s logs 2>nul || true",
      maintenance: "node src/scripts/maintenanceQuotas.js",
      health: "curl -f http://localhost:4000/health || exit 1",
    };

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), "utf8");
    console.log("✅ Scripts package.json mis à jour");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour de package.json:",
      error.message
    );
  }
}

/**
 * 📈 Résumé de la configuration
 */
function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("🎉 CONFIGURATION TERMINÉE - FormEase Backend");
  console.log("=".repeat(60));

  console.log("\n🔧 Fichiers créés:");
  console.log("   ✅ .env (configuration d'environnement)");
  console.log("   ✅ .gitignore (fichiers à ignorer)");
  console.log("   ✅ Répertoires (logs, uploads, temp, backups)");

  console.log("\n📋 Scripts disponibles:");
  console.log("   npm run db:setup     - Initialiser la base de données");
  console.log("   npm run db:reset     - Réinitialiser la base de données");
  console.log("   npm run dev:full     - Configuration complète + démarrage");
  console.log("   npm start            - Démarrer le serveur");
  console.log("   npm test             - Lancer les tests");

  console.log("\n🚀 Prochaines étapes:");
  console.log("   1. Modifiez le fichier .env avec vos vraies valeurs");
  console.log("   2. Configurez PostgreSQL (voir instructions ci-dessus)");
  console.log("   3. Exécutez: npm run db:setup");
  console.log("   4. Démarrez le serveur: npm start");

  console.log("\n⚠️ Important:");
  console.log("   - Changez les mots de passe par défaut");
  console.log("   - Configurez vos clés API (Stripe, OpenAI, etc.)");
  console.log("   - Ne committez jamais le fichier .env");

  if (CONFIG.production) {
    console.log("\n🔒 Mode Production:");
    console.log("   - Utilisez des secrets sécurisés");
    console.log("   - Configurez HTTPS");
    console.log("   - Activez le monitoring");
    console.log("   - Configurez les sauvegardes");
  }
}

/**
 * 🚀 Fonction principale
 */
async function main() {
  console.log("🚀 Configuration de l'environnement FormEase...\n");

  try {
    checkPrerequisites();
    installDependencies();
    createEnvFile();
    createDirectories();
    setupDatabase();
    setupDevTools();
    updatePackageScripts();
    printSummary();
  } catch (error) {
    console.error("❌ Erreur fatale:", error.message);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  createEnvFile,
  createDirectories,
  setupDatabase,
};
