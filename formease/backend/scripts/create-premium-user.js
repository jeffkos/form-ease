const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createPremiumUser() {
  try {
    // Données de l'utilisateur premium
    const userData = {
      firstName: 'Jeff',
      lastName: 'KOSI',
      email: 'jeff.kosi@formease.com',
      password: 'FormEase2025!',
      role: 'PREMIUM',
      plan: 'premium',
      language: 'FR'
    };

    console.log('🚀 Création de l\'utilisateur premium...');
    console.log('📧 Email:', userData.email);
    console.log('🔐 Mot de passe:', userData.password);
    console.log('👤 Rôle:', userData.role);
    console.log('💎 Plan:', userData.plan);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log('⚠️  L\'utilisateur existe déjà. Mise à jour...');
      
      // Mettre à jour l'utilisateur existant
      const updatedUser = await prisma.user.update({
        where: { email: userData.email },
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          password_hash: await bcrypt.hash(userData.password, 10),
          role: userData.role,
          plan: userData.plan,
          plan_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          language: userData.language,
          updated_at: new Date()
        }
      });

      console.log('✅ Utilisateur mis à jour avec succès !');
      console.log('🆔 ID utilisateur:', updatedUser.id);
      
    } else {
      // Créer un nouvel utilisateur
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          plan: userData.plan,
          plan_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          language: userData.language
        }
      });

      console.log('✅ Utilisateur premium créé avec succès !');
      console.log('🆔 ID utilisateur:', newUser.id);
    }

    // Créer quelques formulaires d'exemple
    console.log('\n📝 Création de formulaires d\'exemple...');
    
    const user = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    // Formulaire de contact
    const contactForm = await prisma.form.upsert({
      where: {
        id: 1 // Utiliser un ID fixe pour éviter les doublons
      },
      create: {
        user_id: user.id,
        title: 'Formulaire de Contact',
        description: 'Formulaire de contact pour le site web',
        config: {
          fields: [
            { type: 'text', label: 'Nom complet', required: true },
            { type: 'email', label: 'Email', required: true },
            { type: 'text', label: 'Sujet', required: true },
            { type: 'textarea', label: 'Message', required: true }
          ],
          styling: {
            theme: 'modern',
            primaryColor: '#0ea5e9'
          }
        },
        is_active: true
      },
      update: {
        user_id: user.id,
        title: 'Formulaire de Contact',
        description: 'Formulaire de contact pour le site web',
        updated_at: new Date()
      }
    });

    // Formulaire d'inscription événement
    const eventForm = await prisma.form.upsert({
      where: {
        id: 2
      },
      create: {
        user_id: user.id,
        title: 'Inscription Événement',
        description: 'Formulaire d\'inscription à notre événement annuel',
        config: {
          fields: [
            { type: 'text', label: 'Nom', required: true },
            { type: 'text', label: 'Prénom', required: true },
            { type: 'email', label: 'Email', required: true },
            { type: 'tel', label: 'Téléphone', required: false },
            { type: 'select', label: 'Type de participation', options: ['Présentiel', 'Virtuel'], required: true },
            { type: 'textarea', label: 'Allergies alimentaires', required: false }
          ],
          styling: {
            theme: 'glassmorphism',
            primaryColor: '#3b82f6'
          }
        },
        is_active: true
      },
      update: {
        user_id: user.id,
        title: 'Inscription Événement',
        description: 'Formulaire d\'inscription à notre événement annuel',
        updated_at: new Date()
      }
    });

    // Sondage de satisfaction
    const surveyForm = await prisma.form.upsert({
      where: {
        id: 3
      },
      create: {
        user_id: user.id,
        title: 'Sondage de Satisfaction',
        description: 'Évaluez votre expérience avec nos services',
        config: {
          fields: [
            { type: 'rating', label: 'Note globale', required: true, max: 5 },
            { type: 'select', label: 'Recommanderiez-vous nos services ?', options: ['Certainement', 'Probablement', 'Pas sûr', 'Probablement pas', 'Certainement pas'], required: true },
            { type: 'textarea', label: 'Commentaires', required: false },
            { type: 'email', label: 'Email (optionnel)', required: false }
          ],
          styling: {
            theme: 'minimal',
            primaryColor: '#10b981'
          }
        },
        is_active: true
      },
      update: {
        user_id: user.id,
        title: 'Sondage de Satisfaction',
        description: 'Évaluez votre expérience avec nos services',
        updated_at: new Date()
      }
    });

    console.log('✅ Formulaire de contact créé (ID:', contactForm.id, ')');
    console.log('✅ Formulaire d\'inscription créé (ID:', eventForm.id, ')');
    console.log('✅ Sondage de satisfaction créé (ID:', surveyForm.id, ')');

    // Créer quelques soumissions d'exemple
    console.log('\n📊 Création de soumissions d\'exemple...');
    
    const submissions = [
      {
        form_id: contactForm.id,
        data: {
          nom: 'Marie Dupont',
          email: 'marie.dupont@example.com',
          sujet: 'Question sur vos services',
          message: 'Bonjour, j\'aimerais en savoir plus sur vos tarifs premium.'
        },
        status: 'new'
      },
      {
        form_id: contactForm.id,
        data: {
          nom: 'Pierre Martin',
          email: 'pierre.martin@example.com',
          sujet: 'Demande de demo',
          message: 'Pouvez-vous me faire une démonstration de FormEase ?'
        },
        status: 'validated'
      },
      {
        form_id: eventForm.id,
        data: {
          nom: 'Dubois',
          prenom: 'Sophie',
          email: 'sophie.dubois@example.com',
          telephone: '0123456789',
          participation: 'Présentiel',
          allergies: 'Aucune'
        },
        status: 'new'
      }
    ];

    for (const submissionData of submissions) {
      await prisma.submission.create({
        data: submissionData
      });
    }

    console.log('✅', submissions.length, 'soumissions d\'exemple créées');

    console.log('\n🎉 Configuration terminée !');
    console.log('\n📋 INFORMATIONS DE CONNEXION :');
    console.log('=====================================');
    console.log('🌐 URL de connexion: http://localhost:3000 ou votre URL frontend');
    console.log('📧 Email: ' + userData.email);
    console.log('🔐 Mot de passe: ' + userData.password);
    console.log('👤 Rôle: ' + userData.role);
    console.log('💎 Plan: ' + userData.plan + ' (valide 1 an)');
    console.log('=====================================');
    console.log('\n✨ Fonctionnalités disponibles:');
    console.log('- Formulaires illimités');
    console.log('- Génération IA avancée');
    console.log('- Analytics complets');
    console.log('- Export des données');
    console.log('- Support prioritaire');
    console.log('\n🚀 Vous pouvez maintenant vous connecter !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createPremiumUser();
