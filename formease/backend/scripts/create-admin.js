// Script Node.js pour créer un compte admin dans la base Prisma
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@formease.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password.length < 8) {
      throw new Error('Le mot de passe doit faire au moins 8 caractères');
    }
    
    const hash = await bcrypt.hash(password, 10);

    // Vérifie si l'admin existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          role: 'SUPERADMIN',
          password_hash: hash,
          updated_at: new Date()
        }
      });
      console.log('Admin mis à jour avec succès.');
    } else {
      await prisma.user.create({
        data: {
          email,
          password_hash: hash,
          first_name: 'Admin',
          last_name: 'User',
          role: 'SUPERADMIN',
          language: 'FR',
          plan: 'premium'
        },
      });
      console.log('Admin créé avec succès.');
    }
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de l\'admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
