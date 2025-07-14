const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function simpleSeed() {
  console.log("🌱 Début du seeding simple...");

  try {
    // Créer des utilisateurs de test
    const user1 = await prisma.user.create({
      data: {
        email: "jeff@formease.com",
        password_hash: "hashed_password_123",
        first_name: "Jeff",
        last_name: "KOSI",
        role: "SUPERADMIN",
        plan: "premium",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: "admin@formease.com",
        password_hash: "hashed_password_456",
        first_name: "Admin",
        last_name: "FormEase",
        role: "PREMIUM",
        plan: "premium",
      },
    });

    console.log("✅ Utilisateurs créés");

    // Créer des formulaires de test
    const form1 = await prisma.form.create({
      data: {
        title: "Formulaire de Contact",
        description: "Formulaire pour contacter notre équipe",
        user_id: user1.id,
        is_active: true,
        config:
          '{"fields":[{"type":"text","name":"nom","label":"Nom","required":true}]}',
      },
    });

    const form2 = await prisma.form.create({
      data: {
        title: "Enquête de Satisfaction",
        description: "Enquête pour évaluer la satisfaction client",
        user_id: user1.id,
        is_active: true,
        config:
          '{"fields":[{"type":"radio","name":"satisfaction","label":"Satisfaction","required":true}]}',
      },
    });

    const form3 = await prisma.form.create({
      data: {
        title: "Inscription Newsletter",
        description: "Formulaire d'inscription à la newsletter",
        user_id: user2.id,
        is_active: true,
        config:
          '{"fields":[{"type":"email","name":"email","label":"Email","required":true}]}',
      },
    });

    const form4 = await prisma.form.create({
      data: {
        title: "Demande de Devis",
        description: "Formulaire pour demander un devis",
        user_id: user1.id,
        is_active: false,
        config:
          '{"fields":[{"type":"text","name":"entreprise","label":"Entreprise","required":true}]}',
      },
    });

    console.log("✅ Formulaires créés");

    // Créer des soumissions de test
    const submissions = [];
    for (let i = 0; i < 15; i++) {
      const randomForm = [form1, form2, form3][Math.floor(Math.random() * 3)];
      const randomDate = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      );

      const submission = await prisma.submission.create({
        data: {
          form_id: randomForm.id,
          data: JSON.stringify({
            test: `Réponse test ${i + 1}`,
            timestamp: randomDate.toISOString(),
            email: `test${i + 1}@example.com`,
          }),
          created_at: randomDate,
        },
      });
      submissions.push(submission);
    }

    console.log("✅ Soumissions créées:", submissions.length);

    console.log("🎉 Seeding simple terminé avec succès !");
    console.log(`
📊 Résumé :
- 2 utilisateurs
- 4 formulaires  
- ${submissions.length} soumissions
    `);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
simpleSeed();
