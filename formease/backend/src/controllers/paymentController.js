// Contrôleur de paiement pour FormEase
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulation d'initiation de paiement (à adapter pour Stripe/Paypal/Proxypay)
exports.initiatePayment = async (req, res) => {
  try {
    const { provider, amount, currency } = req.body;
    if (!provider || !amount || !currency) {
      return res.status(400).json({ message: 'Données de paiement incomplètes.' });
    }
    // Création d'un enregistrement de paiement en attente
    const payment = await prisma.payment.create({
      data: {
        user_id: req.user.id,
        provider,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        transaction_ref: 'to_be_filled',
      },
    });
    // Ici, tu devrais intégrer l'appel à l'API du prestataire de paiement
    res.status(201).json({ message: 'Paiement initié', payment });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Validation du paiement et mise à jour du plan utilisateur
exports.validatePayment = async (req, res) => {
  try {
    const { paymentId, transaction_ref } = req.body;
    // Vérifier le paiement
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'validated', transaction_ref }
    });
    // Mise à jour du plan utilisateur
    await prisma.user.update({
      where: { id: payment.user_id },
      data: {
        plan: 'premium',
        plan_expiration: new Date(new Date().setMonth(new Date().getMonth() + 1))
      }
    });
    res.json({ message: 'Paiement validé, abonnement premium activé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Lister les paiements de l'utilisateur avec pagination
exports.listPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where: { user_id: req.user.id } })
    ]);
    res.json({ payments, page, limit, total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
