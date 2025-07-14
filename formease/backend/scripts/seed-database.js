const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedDatabase() {
  console.log("🌱 Début du seeding de la base de données...");

  try {
    // Créer des utilisateurs de test
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: "jeff@formease.com",
          password_hash: "hashed_password_123",
          first_name: "Jeff",
          last_name: "KOSI",
          role: "ADMIN",
          plan: "premium",
        },
      }),
      prisma.user.create({
        data: {
          email: "admin@formease.com",
          password_hash: "hashed_password_456",
          first_name: "Admin",
          last_name: "FormEase",
          role: "ADMIN",
          plan: "premium",
        },
      }),
      prisma.user.create({
        data: {
          email: "user@formease.com",
          password_hash: "hashed_password_789",
          first_name: "Utilisateur",
          last_name: "Test",
          role: "USER",
          plan: "free",
        },
      }),
    ]);

    console.log("✅ Utilisateurs créés:", users.length);

    // Créer des formulaires de test
    const forms = await Promise.all([
      prisma.form.create({
        data: {
          title: "Formulaire de Contact",
          description: "Formulaire pour contacter notre équipe",
          status: "ACTIVE",
          userId: users[0].id,
          config: JSON.stringify({
            fields: [
              { type: "text", name: "nom", label: "Nom", required: true },
              { type: "email", name: "email", label: "Email", required: true },
              {
                type: "textarea",
                name: "message",
                label: "Message",
                required: true,
              },
            ],
          }),
        },
      }),
      prisma.form.create({
        data: {
          title: "Enquête de Satisfaction",
          description: "Enquête pour évaluer la satisfaction client",
          status: "ACTIVE",
          userId: users[0].id,
          config: JSON.stringify({
            fields: [
              {
                type: "radio",
                name: "satisfaction",
                label: "Satisfaction",
                required: true,
              },
              { type: "textarea", name: "commentaires", label: "Commentaires" },
            ],
          }),
        },
      }),
      prisma.form.create({
        data: {
          title: "Inscription Newsletter",
          description: "Formulaire d'inscription à la newsletter",
          status: "ACTIVE",
          userId: users[1].id,
          config: JSON.stringify({
            fields: [
              { type: "email", name: "email", label: "Email", required: true },
              {
                type: "checkbox",
                name: "consent",
                label: "J'accepte les conditions",
                required: true,
              },
            ],
          }),
        },
      }),
      prisma.form.create({
        data: {
          title: "Demande de Devis",
          description: "Formulaire pour demander un devis",
          status: "DRAFT",
          userId: users[0].id,
          config: JSON.stringify({
            fields: [
              {
                type: "text",
                name: "entreprise",
                label: "Entreprise",
                required: true,
              },
              {
                type: "text",
                name: "projet",
                label: "Description du projet",
                required: true,
              },
            ],
          }),
        },
      }),
      prisma.form.create({
        data: {
          title: "Feedback Produit",
          description: "Collecte de feedback sur nos produits",
          status: "ARCHIVED",
          userId: users[1].id,
          config: JSON.stringify({
            fields: [
              {
                type: "text",
                name: "produit",
                label: "Produit",
                required: true,
              },
              {
                type: "number",
                name: "note",
                label: "Note /10",
                required: true,
              },
            ],
          }),
        },
      }),
    ]);

    console.log("✅ Formulaires créés:", forms.length);

    // Créer des réponses de test
    const responses = [];
    const responseData = [
      {
        formId: forms[0].id,
        data: JSON.stringify({
          nom: "Jean Dupont",
          email: "jean@example.com",
          message: "Bonjour, j'ai une question",
        }),
      },
      {
        formId: forms[0].id,
        data: JSON.stringify({
          nom: "Marie Martin",
          email: "marie@example.com",
          message: "Demande d'information",
        }),
      },
      {
        formId: forms[0].id,
        data: JSON.stringify({
          nom: "Pierre Durand",
          email: "pierre@example.com",
          message: "Problème technique",
        }),
      },
      {
        formId: forms[1].id,
        data: JSON.stringify({
          satisfaction: "Très satisfait",
          commentaires: "Excellent service",
        }),
      },
      {
        formId: forms[1].id,
        data: JSON.stringify({
          satisfaction: "Satisfait",
          commentaires: "Bon travail",
        }),
      },
      {
        formId: forms[2].id,
        data: JSON.stringify({
          email: "newsletter@example.com",
          consent: true,
        }),
      },
      {
        formId: forms[2].id,
        data: JSON.stringify({ email: "test@example.com", consent: true }),
      },
    ];

    for (let i = 0; i < responseData.length; i++) {
      const response = await prisma.response.create({
        data: {
          formId: responseData[i].formId,
          data: responseData[i].data,
          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Réponses dans les 7 derniers jours
        },
      });
      responses.push(response);
    }

    // Ajouter plus de réponses pour les statistiques
    for (let i = 0; i < 20; i++) {
      const randomForm = forms[Math.floor(Math.random() * forms.length)];
      const randomDate = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ); // 30 derniers jours

      await prisma.response.create({
        data: {
          formId: randomForm.id,
          data: JSON.stringify({
            test: `Réponse test ${i + 1}`,
            timestamp: randomDate.toISOString(),
          }),
          createdAt: randomDate,
        },
      });
    }

    console.log("✅ Réponses créées:", responses.length + 20);

    // Créer des notifications de test
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          userId: users[0].id,
          title: "Nouvelle réponse reçue",
          message:
            'Vous avez reçu une nouvelle réponse sur votre formulaire "Contact"',
          type: "FORM_RESPONSE",
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: users[0].id,
          title: "Limite de plan atteinte",
          message: "Vous approchez de la limite de votre plan gratuit",
          type: "PLAN_LIMIT",
          isRead: true,
        },
      }),
    ]);

    console.log("✅ Notifications créées:", notifications.length);

    console.log("🎉 Seeding terminé avec succès !");
    console.log(`
📊 Résumé :
- ${users.length} utilisateurs
- ${forms.length} formulaires  
- ${responses.length + 20} réponses
- ${notifications.length} notifications
    `);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding si le script est appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
