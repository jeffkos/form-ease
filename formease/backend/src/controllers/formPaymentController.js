// Contrôleur pour la gestion des formulaires payants
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Activer/configurer le paiement pour un formulaire
exports.configureFormPayment = async (req, res) => {
  try {
    const { formId } = req.params;
    const { enabled, amount, currency = 'EUR', description, successUrl, cancelUrl } = req.body;

    // Vérifier que le formulaire appartient à l'utilisateur
    const form = await prisma.form.findFirst({
      where: { 
        id: parseInt(formId), 
        user_id: req.user.id 
      }
    });

    if (!form) {
      return res.status(404).json({ message: 'Formulaire non trouvé.' });
    }

    // Valider le montant
    if (enabled && (!amount || amount <= 0)) {
      return res.status(400).json({ message: 'Montant invalide pour un formulaire payant.' });
    }

    // Créer ou mettre à jour la configuration de paiement
    const formPayment = await prisma.formPayment.upsert({
      where: { form_id: parseInt(formId) },
      update: {
        enabled: enabled || false,
        amount: enabled ? parseFloat(amount) : 0,
        currency,
        description,
        success_url: successUrl,
        cancel_url: cancelUrl,
        updated_at: new Date()
      },
      create: {
        form_id: parseInt(formId),
        enabled: enabled || false,
        amount: enabled ? parseFloat(amount) : 0,
        currency,
        description,
        success_url: successUrl,
        cancel_url: cancelUrl
      }
    });

    res.json({ 
      message: enabled ? 'Paiement activé pour le formulaire' : 'Paiement désactivé',
      formPayment 
    });
  } catch (error) {
    console.error('Erreur configuration paiement formulaire:', error);
    res.status(500).json({ message: 'Erreur lors de la configuration du paiement.' });
  }
};

// Obtenir la configuration de paiement d'un formulaire
exports.getFormPaymentConfig = async (req, res) => {
  try {
    const { formId } = req.params;

    const formPayment = await prisma.formPayment.findUnique({
      where: { form_id: parseInt(formId) },
      include: {
        form: {
          select: { title: true, user_id: true }
        }
      }
    });

    if (!formPayment) {
      return res.json({ 
        enabled: false,
        message: 'Aucune configuration de paiement pour ce formulaire'
      });
    }

    // Masquer les détails si ce n'est pas le propriétaire
    const isOwner = req.user && req.user.id === formPayment.form.user_id;
    
    res.json({
      enabled: formPayment.enabled,
      amount: formPayment.amount,
      currency: formPayment.currency,
      description: formPayment.description,
      ...(isOwner && {
        success_url: formPayment.success_url,
        cancel_url: formPayment.cancel_url,
        created_at: formPayment.created_at,
        updated_at: formPayment.updated_at
      })
    });
  } catch (error) {
    console.error('Erreur récupération config paiement:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la configuration.' });
  }
};

// Lister les transactions d'un formulaire
exports.getFormTransactions = async (req, res) => {
  try {
    const { formId } = req.params;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;

    // Vérifier que le formulaire appartient à l'utilisateur
    const form = await prisma.form.findFirst({
      where: { 
        id: parseInt(formId), 
        user_id: req.user.id 
      }
    });

    if (!form) {
      return res.status(404).json({ message: 'Formulaire non trouvé.' });
    }

    const [transactions, total] = await Promise.all([
      prisma.formPaymentTransaction.findMany({
        where: {
          formPayment: {
            form_id: parseInt(formId)
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          submission: {
            select: { id: true, created_at: true }
          }
        }
      }),
      prisma.formPaymentTransaction.count({
        where: {
          formPayment: {
            form_id: parseInt(formId)
          }
        }
      })
    ]);

    res.json({ 
      transactions, 
      page, 
      limit, 
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions.' });
  }
};

// Statistiques des revenus par formulaire
exports.getFormRevenueStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(period));

    const stats = await prisma.formPaymentTransaction.groupBy({
      by: ['form_payment_id'],
      where: {
        status: 'completed',
        created_at: { gte: since },
        formPayment: {
          form: { user_id: req.user.id }
        }
      },
      _sum: { amount: true },
      _count: true
    });

    // Enrichir avec les titres des formulaires
    const enrichedStats = await Promise.all(
      stats.map(async (stat) => {
        const formPayment = await prisma.formPayment.findUnique({
          where: { id: stat.form_payment_id },
          include: {
            form: { select: { title: true, id: true } }
          }
        });
        
        return {
          formId: formPayment.form.id,
          formTitle: formPayment.form.title,
          revenue: stat._sum.amount || 0,
          transactionCount: stat._count,
          averageAmount: stat._count > 0 ? (stat._sum.amount || 0) / stat._count : 0
        };
      })
    );

    const totalRevenue = enrichedStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const totalTransactions = enrichedStats.reduce((sum, stat) => sum + stat.transactionCount, 0);

    res.json({
      period: `${period} jours`,
      totalRevenue,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      formStats: enrichedStats
    });
  } catch (error) {
    console.error('Erreur stats revenus formulaires:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
  }
};
