// Script d'archivage automatique des données pour les utilisateurs Freemium
// Usage : node scripts/archiveOldData.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function archiveOldData() {
  const TWO_MONTHS_AGO = new Date();
  TWO_MONTHS_AGO.setMonth(TWO_MONTHS_AGO.getMonth() - 2);

  try {
    // 1. Trouver les utilisateurs standard (non premium)
    const freeUsers = await prisma.user.findMany({
      where: { role: 'USER' }
    });
    const freeUserIds = freeUsers.map(u => u.id);

    console.log(`Found ${freeUsers.length} standard users`);

    // 2. Trouver les formulaires de ces utilisateurs créés il y a plus de 2 mois
    const oldForms = await prisma.form.findMany({
      where: {
        userId: { in: freeUserIds },
        createdAt: { lt: TWO_MONTHS_AGO },
        archived: false
      }
    });
    const oldFormIds = oldForms.map(f => f.id);

    console.log(`Found ${oldForms.length} forms to archive`);

  // 3. Archiver les formulaires et leurs inscriptions
    if (oldFormIds.length > 0) {
      // 3. Archiver les formulaires
      await prisma.form.updateMany({
        where: { id: { in: oldFormIds } },
        data: { archived: true }
      });

      // 4. Archiver les soumissions associées
      const archivedSubmissions = await prisma.submission.updateMany({
        where: { formId: { in: oldFormIds } },
        data: { archived: true }
      });

      console.log(`Archived ${oldForms.length} forms and their submissions`);
    } else {
      console.log('No forms to archive');
    }
  } catch (error) {
    console.error('Error during archiving:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
archiveOldData()
    where: { form_id: { in: oldFormIds } },
    data: { archived: true }
  });

  console.log(`Archivé ${oldForms.length} formulaires et leurs inscriptions pour les utilisateurs Freemium.`);
}

archiveOldData()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
