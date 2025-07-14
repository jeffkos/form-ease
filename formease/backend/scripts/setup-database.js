#!/usr/bin/env node

/**
 * 🗄️ SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES - FormEase
 *
 * Ce script configure et initialise la base de données PostgreSQL
 * avec les données de base nécessaires pour FormEase
 *
 * Usage:
 *   node scripts/setup-database.js [--reset] [--seed] [--prod]
 *
 * Options:
 *   --reset : Réinitialise complètement la base de données
 *   --seed  : Insère les données de test
 *   --prod  : Mode production (pas de données de test)
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const logger = require("../src/utils/logger");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  reset: process.argv.includes("--reset"),
  seed: process.argv.includes("--seed"),
  production: process.argv.includes("--prod"),
  verbose: process.argv.includes("--verbose"),
};

const prisma = new PrismaClient();

/**
 * 🔧 Vérification des prérequis
 */
async function checkPrerequisites() {
  console.log("🔍 Vérification des prérequis...");

  // Vérifier les variables d'environnement critiques
  const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Variables d'environnement manquantes:", missingVars);
    console.error(
      "💡 Copiez config.env.example vers .env et configurez les variables"
    );
    process.exit(1);
  }

  // Vérifier la connexion à la base de données
  try {
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie");
  } catch (error) {
    console.error(
      "❌ Impossible de se connecter à la base de données:",
      error.message
    );
    console.error(
      "💡 Vérifiez que PostgreSQL est démarré et DATABASE_URL est correcte"
    );
    process.exit(1);
  }
}

/**
 * 🗄️ Réinitialisation de la base de données
 */
async function resetDatabase() {
  if (!CONFIG.reset) return;

  console.log("🔄 Réinitialisation de la base de données...");

  try {
    // Supprimer et recréer la base de données avec Prisma
    execSync("npx prisma migrate reset --force", { stdio: "inherit" });
    console.log("✅ Base de données réinitialisée");
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error.message);
    process.exit(1);
  }
}

/**
 * 📋 Migration de la base de données
 */
async function migrateDatabase() {
  console.log("📋 Application des migrations...");

  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations appliquées");
  } catch (error) {
    console.error("❌ Erreur lors des migrations:", error.message);
    process.exit(1);
  }
}

/**
 * 🌱 Génération du client Prisma
 */
async function generatePrismaClient() {
  console.log("🔧 Génération du client Prisma...");

  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✅ Client Prisma généré");
  } catch (error) {
    console.error("❌ Erreur lors de la génération du client:", error.message);
    process.exit(1);
  }
}

/**
 * 👤 Création de l'utilisateur super admin
 */
async function createSuperAdmin() {
  console.log("👤 Création de l'utilisateur super admin...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@formease.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminFormEase2024!";

  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("ℹ️ Utilisateur super admin existe déjà");
      return;
    }

    // Créer l'utilisateur super admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        first_name: "Super",
        last_name: "Admin",
        email: adminEmail,
        password_hash: hashedPassword,
        role: "SUPERADMIN",
        plan: "premium",
        language: "FR",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("✅ Super admin créé:", {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    if (!CONFIG.production) {
      console.log("🔑 Identifiants de connexion:");
      console.log("   Email:", adminEmail);
      console.log("   Mot de passe:", adminPassword);
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création du super admin:",
      error.message
    );
  }
}

/**
 * 📝 Création des catégories de base de connaissances
 */
async function createKnowledgeBaseCategories() {
  console.log("📝 Création des catégories de base de connaissances...");

  const categories = [
    {
      name: "Premiers pas",
      description: "Guide pour débuter avec FormEase",
      icon: "play-circle",
      color: "blue",
    },
    {
      name: "Formulaires",
      description: "Création et gestion des formulaires",
      icon: "document-text",
      color: "green",
    },
    {
      name: "Paiements",
      description: "Configuration des paiements Stripe",
      icon: "credit-card",
      color: "purple",
    },
    {
      name: "Analytics",
      description: "Analyse des performances",
      icon: "chart-bar",
      color: "orange",
    },
    {
      name: "Intégrations",
      description: "Connexions avec des services externes",
      icon: "link",
      color: "teal",
    },
    {
      name: "Dépannage",
      description: "Solutions aux problèmes courants",
      icon: "exclamation-triangle",
      color: "red",
    },
    {
      name: "Compte",
      description: "Gestion du compte et abonnements",
      icon: "user-circle",
      color: "indigo",
    },
    {
      name: "API",
      description: "Documentation technique de l'API",
      icon: "code",
      color: "gray",
    },
  ];

  try {
    for (const category of categories) {
      // Vérifier si la catégorie existe déjà
      const existingCategory = await prisma.knowledgeBaseCategory.findFirst({
        where: { name: category.name },
      });

      if (!existingCategory) {
        await prisma.knowledgeBaseCategory.create({
          data: category,
        });
        console.log(`✅ Catégorie créée: ${category.name}`);
      }
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création des catégories:",
      error.message
    );
  }
}

/**
 * 🎯 Insertion des données de test
 */
async function seedTestData() {
  if (!CONFIG.seed || CONFIG.production) return;

  console.log("🌱 Insertion des données de test...");

  try {
    // Créer des utilisateurs de test
    const testUsers = [
      {
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@test.com",
        password_hash: await bcrypt.hash("password123", 12),
        role: "USER",
        plan: "free",
        language: "FR",
      },
      {
        first_name: "Marie",
        last_name: "Martin",
        email: "marie.martin@test.com",
        password_hash: await bcrypt.hash("password123", 12),
        role: "PREMIUM",
        plan: "premium",
        language: "FR",
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        await prisma.user.create({ data: userData });
        console.log(`✅ Utilisateur de test créé: ${userData.email}`);
      }
    }

    // Créer des formulaires de test
    const adminUser = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL || "admin@formease.com" },
    });

    if (adminUser) {
      const testForms = [
        {
          title: "Formulaire de Contact",
          description: "Un formulaire de contact simple pour tester",
          fields: JSON.stringify([
            { type: "text", label: "Nom", required: true },
            { type: "email", label: "Email", required: true },
            { type: "textarea", label: "Message", required: true },
          ]),
          user_id: adminUser.id,
          status: "active",
        },
        {
          title: "Enquête de Satisfaction",
          description: "Formulaire pour mesurer la satisfaction client",
          fields: JSON.stringify([
            { type: "rating", label: "Note globale", required: true },
            {
              type: "radio",
              label: "Recommanderiez-vous notre service?",
              options: ["Oui", "Non", "Peut-être"],
            },
            { type: "textarea", label: "Commentaires", required: false },
          ]),
          user_id: adminUser.id,
          status: "active",
        },
      ];

      for (const formData of testForms) {
        const existingForm = await prisma.form.findFirst({
          where: { title: formData.title, user_id: adminUser.id },
        });

        if (!existingForm) {
          await prisma.form.create({ data: formData });
          console.log(`✅ Formulaire de test créé: ${formData.title}`);
        }
      }
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'insertion des données de test:",
      error.message
    );
  }
}

/**
 * 📊 Création des index de performance
 */
async function createPerformanceIndexes() {
  console.log("📊 Création des index de performance...");

  try {
    // Les index sont définis dans le schema Prisma
    // Cette fonction peut être étendue pour des index personnalisés
    console.log("✅ Index de performance configurés");
  } catch (error) {
    console.error("❌ Erreur lors de la création des index:", error.message);
  }
}

/**
 * 🔐 Configuration de la sécurité
 */
async function setupSecurity() {
  console.log("🔐 Configuration de la sécurité...");

  try {
    // Vérifier la longueur du JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.warn("⚠️ JWT_SECRET devrait faire au moins 32 caractères");
    }

    // Autres vérifications de sécurité
    console.log("✅ Configuration de sécurité vérifiée");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la configuration de sécurité:",
      error.message
    );
  }
}

/**
 * 📈 Résumé de l'installation
 */
async function printSummary() {
  console.log("\n" + "=".repeat(50));
  console.log("🎉 INSTALLATION TERMINÉE - FormEase Backend");
  console.log("=".repeat(50));

  try {
    // Statistiques de la base de données
    const userCount = await prisma.user.count();
    const formCount = await prisma.form.count();

    console.log(`👥 Utilisateurs: ${userCount}`);
    console.log(`📝 Formulaires: ${formCount}`);

    if (!CONFIG.production) {
      console.log("\n🔑 Identifiants Super Admin:");
      console.log(
        `   Email: ${process.env.ADMIN_EMAIL || "admin@formease.com"}`
      );
      console.log(
        `   Mot de passe: ${process.env.ADMIN_PASSWORD || "AdminFormEase2024!"}`
      );
    }

    console.log("\n🚀 Prochaines étapes:");
    console.log("   1. Démarrez le serveur: npm start");
    console.log(
      "   2. Accédez à l'interface admin: http://localhost:4000/admin"
    );
    console.log("   3. Configurez vos services externes (Stripe, Email, etc.)");
  } catch (error) {
    console.error("❌ Erreur lors du résumé:", error.message);
  }
}

/**
 * 🚀 Fonction principale
 */
async function main() {
  console.log("🚀 Initialisation de FormEase Backend...\n");

  try {
    await checkPrerequisites();
    await resetDatabase();
    await migrateDatabase();
    await generatePrismaClient();
    await createSuperAdmin();
    await createKnowledgeBaseCategories();
    await seedTestData();
    await createPerformanceIndexes();
    await setupSecurity();
    await printSummary();
  } catch (error) {
    console.error("❌ Erreur fatale:", error.message);
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
  checkPrerequisites,
  resetDatabase,
  migrateDatabase,
  createSuperAdmin,
  seedTestData,
};
