#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE DÉMARRAGE COMPLET - FormEase
 *
 * Ce script vérifie tous les prérequis et lance FormEase
 * avec toutes les vérifications nécessaires
 *
 * Usage:
 *   node scripts/start-formease.js [--dev] [--prod] [--check-only]
 *
 * Options:
 *   --dev       : Mode développement avec hot reload
 *   --prod      : Mode production
 *   --check-only: Vérifications seulement, pas de démarrage
 */

const { PrismaClient } = require("@prisma/client");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const logger = require("../src/utils/logger");

// Configuration
const CONFIG = {
  dev: process.argv.includes("--dev"),
  production: process.argv.includes("--prod"),
  checkOnly: process.argv.includes("--check-only"),
  verbose: process.argv.includes("--verbose"),
};

const prisma = new PrismaClient();

/**
 * 🔍 Vérification des variables d'environnement
 */
function checkEnvironmentVariables() {
  console.log("🔍 Vérification des variables d'environnement...");

  const requiredVars = ["DATABASE_URL", "JWT_SECRET", "PORT", "FRONTEND_URL"];

  const recommendedVars = [
    "STRIPE_SECRET_KEY",
    "OPENAI_API_KEY",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
  ];

  let hasErrors = false;

  // Variables critiques
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.error(`❌ Variable manquante: ${varName}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: configuré`);
    }
  });

  // Variables recommandées
  recommendedVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.warn(`⚠️ Variable recommandée manquante: ${varName}`);
    } else {
      console.log(`✅ ${varName}: configuré`);
    }
  });

  if (hasErrors) {
    console.error("\n❌ Variables d'environnement manquantes");
    console.error("💡 Exécutez: npm run env:setup");
    process.exit(1);
  }

  console.log("✅ Variables d'environnement OK");
}

/**
 * 🗄️ Vérification de la base de données
 */
async function checkDatabase() {
  console.log("🗄️ Vérification de la base de données...");

  try {
    // Test de connexion
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie");

    // Vérifier les tables principales
    const userCount = await prisma.user.count();
    const formCount = await prisma.form.count();

    console.log(`📊 Utilisateurs: ${userCount}`);
    console.log(`📝 Formulaires: ${formCount}`);

    // Vérifier si le super admin existe
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPERADMIN" },
    });

    if (!superAdmin) {
      console.warn("⚠️ Aucun super admin trouvé");
      console.warn("💡 Exécutez: npm run db:setup");
    } else {
      console.log("✅ Super admin configuré");
    }
  } catch (error) {
    console.error("❌ Erreur de base de données:", error.message);
    console.error("💡 Exécutez: npm run db:setup");
    process.exit(1);
  }
}

/**
 * 📦 Vérification des dépendances
 */
function checkDependencies() {
  console.log("📦 Vérification des dépendances...");

  const packagePath = path.join(__dirname, "..", "package.json");
  const nodeModulesPath = path.join(__dirname, "..", "node_modules");

  if (!fs.existsSync(nodeModulesPath)) {
    console.error("❌ node_modules manquant");
    console.error("💡 Exécutez: npm install");
    process.exit(1);
  }

  // Vérifier les dépendances critiques
  const criticalDeps = [
    "express",
    "prisma",
    "@prisma/client",
    "jsonwebtoken",
    "bcrypt",
    "stripe",
    "nodemailer",
  ];

  criticalDeps.forEach((dep) => {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      console.error(`❌ Dépendance manquante: ${dep}`);
      process.exit(1);
    }
  });

  console.log("✅ Dépendances OK");
}

/**
 * 🔧 Vérification des services externes
 */
async function checkExternalServices() {
  console.log("🔧 Vérification des services externes...");

  // Test Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      await stripe.balance.retrieve();
      console.log("✅ Stripe: connecté");
    } catch (error) {
      console.warn("⚠️ Stripe: erreur de connexion");
    }
  }

  // Test OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Test basique (pas d'appel réel pour éviter les coûts)
      console.log("✅ OpenAI: clé configurée");
    } catch (error) {
      console.warn("⚠️ OpenAI: erreur de configuration");
    }
  }

  // Test Redis (optionnel)
  if (process.env.REDIS_URL) {
    try {
      const { createClient } = require("redis");
      const client = createClient({ url: process.env.REDIS_URL });
      await client.connect();
      await client.ping();
      await client.quit();
      console.log("✅ Redis: connecté");
    } catch (error) {
      console.warn("⚠️ Redis: non disponible (fallback mémoire)");
    }
  }
}

/**
 * 📁 Vérification des répertoires
 */
function checkDirectories() {
  console.log("📁 Vérification des répertoires...");

  const requiredDirs = ["logs", "uploads", "temp"];

  requiredDirs.forEach((dir) => {
    const dirPath = path.join(__dirname, "..", dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Répertoire créé: ${dir}`);
    } else {
      console.log(`✅ Répertoire existant: ${dir}`);
    }
  });
}

/**
 * 🔒 Vérification de la sécurité
 */
function checkSecurity() {
  console.log("🔒 Vérification de la sécurité...");

  // Vérifier la longueur du JWT secret
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error("❌ JWT_SECRET trop court (minimum 32 caractères)");
    process.exit(1);
  }

  // Vérifier les mots de passe par défaut en production
  if (CONFIG.production) {
    const defaultPasswords = ["AdminFormEase2024!", "password123", "admin123"];

    if (
      process.env.ADMIN_PASSWORD &&
      defaultPasswords.includes(process.env.ADMIN_PASSWORD)
    ) {
      console.error("❌ Mot de passe admin par défaut détecté en production");
      process.exit(1);
    }
  }

  // Vérifier les permissions du fichier .env
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const stats = fs.statSync(envPath);
    if (process.platform !== "win32" && (stats.mode & 0o077) !== 0) {
      console.warn("⚠️ Permissions .env trop ouvertes");
      console.warn("💡 Exécutez: chmod 600 .env");
    }
  }

  console.log("✅ Sécurité OK");
}

/**
 * 🚀 Démarrage du serveur
 */
function startServer() {
  if (CONFIG.checkOnly) {
    console.log("✅ Toutes les vérifications sont passées");
    return;
  }

  console.log("\n🚀 Démarrage du serveur FormEase...");

  const serverScript = path.join(__dirname, "..", "src", "app.js");

  let nodeArgs = [];
  let scriptArgs = [];

  if (CONFIG.dev) {
    // Mode développement avec nodemon
    try {
      execSync("which nodemon", { stdio: "pipe" });
      console.log("🔄 Mode développement (nodemon)");

      const nodemon = spawn(
        "nodemon",
        [
          "--watch",
          "src",
          "--ext",
          "js,json",
          "--ignore",
          "logs/",
          "--ignore",
          "uploads/",
          "--ignore",
          "temp/",
          serverScript,
        ],
        {
          stdio: "inherit",
          env: { ...process.env, NODE_ENV: "development" },
        }
      );

      nodemon.on("close", (code) => {
        console.log(`\n🛑 Serveur arrêté (code: ${code})`);
        process.exit(code);
      });
    } catch (error) {
      console.warn("⚠️ nodemon non trouvé, démarrage normal");
      startNormalServer();
    }
  } else {
    startNormalServer();
  }
}

/**
 * 🔧 Démarrage normal du serveur
 */
function startNormalServer() {
  const serverScript = path.join(__dirname, "..", "src", "app.js");

  const env = {
    ...process.env,
    NODE_ENV: CONFIG.production ? "production" : "development",
  };

  console.log(`📊 Mode: ${env.NODE_ENV}`);
  console.log(`🌐 Port: ${process.env.PORT || 4000}`);
  console.log(
    `🔗 Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );

  const server = spawn("node", [serverScript], {
    stdio: "inherit",
    env,
  });

  server.on("close", (code) => {
    console.log(`\n🛑 Serveur arrêté (code: ${code})`);
    process.exit(code);
  });

  // Gestion des signaux
  process.on("SIGINT", () => {
    console.log("\n🛑 Arrêt du serveur...");
    server.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Arrêt du serveur...");
    server.kill("SIGTERM");
  });
}

/**
 * 📊 Affichage des informations système
 */
function displaySystemInfo() {
  console.log("\n📊 Informations système:");
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Plateforme: ${process.platform} ${process.arch}`);
  console.log(
    `   Mémoire: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`
  );
  console.log(`   Processus: ${process.pid}`);
  console.log(`   Répertoire: ${process.cwd()}`);
}

/**
 * 🚀 Fonction principale
 */
async function main() {
  console.log("🚀 Démarrage de FormEase Backend...\n");

  try {
    displaySystemInfo();
    checkEnvironmentVariables();
    checkDependencies();
    checkDirectories();
    checkSecurity();
    await checkDatabase();
    await checkExternalServices();

    console.log("\n✅ Toutes les vérifications sont passées\n");

    startServer();
  } catch (error) {
    console.error("❌ Erreur fatale:", error.message);
    if (CONFIG.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkDatabase,
  checkDependencies,
  checkSecurity,
};
