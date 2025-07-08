// Contrôleur de paiement pour FormEase avec Stripe
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

// Configuration des plans
const PLANS = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    amount: 1200, // 12€ en centimes
    currency: 'eur',
    interval: 'month'
  }
};

// Créer une session de paiement Stripe
exports.createCheckoutSession = async (req, res) => {
  try {
    const { planType = 'premium' } = req.body;
    const plan = PLANS[planType];
    
    if (!plan) {
      return res.status(400).json({ message: 'Plan invalide.' });
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{
        price: plan.priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: req.user.id.toString(),
        planType: planType
      }
    });

    // Enregistrer l'intention de paiement
    await prisma.payment.create({
      data: {
        user_id: req.user.id,
        provider: 'stripe',
        amount: plan.amount / 100, // Convertir centimes en euros
        currency: plan.currency,
        status: 'pending',
        transaction_ref: session.id,
      },
    });

    res.json({ 
      message: 'Session de paiement créée',
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la session de paiement.' });
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

// Webhook Stripe pour traiter les événements de paiement
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Erreur vérification webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleSuccessfulPayment(session);
        break;
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
};

// Gérer un paiement réussi
async function handleSuccessfulPayment(session) {
  const userId = parseInt(session.metadata.userId);
  const planType = session.metadata.planType;
  
  // Mettre à jour le paiement
  await prisma.payment.updateMany({
    where: { 
      transaction_ref: session.id,
      status: 'pending' 
    },
    data: { 
      status: 'completed',
      transaction_ref: session.payment_intent || session.id
    }
  });

  // Mettre à jour le plan utilisateur
  const planExpiration = new Date();
  planExpiration.setMonth(planExpiration.getMonth() + 1);
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planType,
      plan_expiration: planExpiration
    }
  });

  logger.info(`Abonnement ${planType} activé pour l'utilisateur ${userId}`, {
    userId,
    planType,
    planExpiration: planExpiration?.toISOString()
  });
}

// Gérer les changements d'abonnement
async function handleSubscriptionChange(subscription) {
  // Trouver l'utilisateur par customer_id Stripe
  const customer = await stripe.customers.retrieve(subscription.customer);
  const user = await prisma.user.findUnique({
    where: { email: customer.email }
  });

  if (!user) return;

  if (subscription.status === 'active') {
    const planExpiration = new Date(subscription.current_period_end * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'premium',
        plan_expiration: planExpiration
      }
    });
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'free',
        plan_expiration: null
      }
    });
  }
}

// Gérer les paiements pour formulaires payants
exports.handleFormPayment = async (req, res) => {
  try {
    const { formId } = req.params;
    const { payerEmail, amount, successUrl, cancelUrl } = req.body;

    // Vérifier que le formulaire a le paiement activé
    const formPayment = await prisma.formPayment.findUnique({
      where: { form_id: parseInt(formId) },
      include: { form: true }
    });

    if (!formPayment || !formPayment.enabled) {
      return res.status(400).json({ message: 'Paiement non activé pour ce formulaire.' });
    }

    // Créer une session de paiement Stripe pour le formulaire
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: payerEmail,
      line_items: [{
        price_data: {
          currency: formPayment.currency.toLowerCase(),
          product_data: {
            name: `Formulaire: ${formPayment.form.title}`,
            description: formPayment.description || 'Paiement pour accéder au formulaire'
          },
          unit_amount: Math.round(formPayment.amount * 100), // Convertir en centimes
        },
        quantity: 1,
      }],
      success_url: successUrl || formPayment.success_url || `${process.env.FRONTEND_URL}/form/${formId}?payment=success`,
      cancel_url: cancelUrl || formPayment.cancel_url || `${process.env.FRONTEND_URL}/form/${formId}?payment=cancelled`,
      metadata: {
        formId: formId,
        payerEmail: payerEmail,
        type: 'form_payment'
      }
    });

    // Enregistrer la transaction
    await prisma.formPaymentTransaction.create({
      data: {
        form_payment_id: formPayment.id,
        payer_email: payerEmail,
        amount: formPayment.amount,
        currency: formPayment.currency,
        status: 'pending',
        provider: 'stripe',
        transaction_ref: session.id,
      },
    });

    res.json({ 
      sessionId: session.id,
      url: session.url,
      amount: formPayment.amount,
      currency: formPayment.currency
    });
  } catch (error) {
    console.error('Erreur paiement formulaire:', error);
    res.status(500).json({ message: 'Erreur lors de la création du paiement.' });
  }
};

// Obtenir les statistiques de revenus (admin/user)
exports.getRevenueStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // jours
    const userId = req.user.role === 'SUPERADMIN' ? null : req.user.id;
    
    const since = new Date();
    since.setDate(since.getDate() - parseInt(period));
    
    // Filtrer par utilisateur si pas admin
    const whereClause = userId ? { user_id: userId } : {};
    whereClause.created_at = { gte: since };
    whereClause.status = 'completed';

    const [subscriptionRevenue, formPaymentRevenue, totalTransactions] = await Promise.all([
      // Revenus abonnements
      prisma.payment.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: true
      }),
      // Revenus formulaires payants (approximation via les forms du user)
      prisma.formPaymentTransaction.aggregate({
        where: {
          status: 'completed',
          created_at: { gte: since },
          ...(userId && {
            formPayment: {
              form: { user_id: userId }
            }
          })
        },
        _sum: { amount: true },
        _count: true
      }),
      // Nombre total de transactions
      prisma.payment.count({ where: whereClause })
    ]);

    res.json({
      period: `${period} jours`,
      subscriptions: {
        revenue: subscriptionRevenue._sum.amount || 0,
        count: subscriptionRevenue._count || 0
      },
      formPayments: {
        revenue: formPaymentRevenue._sum.amount || 0,
        count: formPaymentRevenue._count || 0
      },
      total: {
        revenue: (subscriptionRevenue._sum.amount || 0) + (formPaymentRevenue._sum.amount || 0),
        transactions: totalTransactions + (formPaymentRevenue._count || 0)
      }
    });
  } catch (error) {
    console.error('Erreur stats revenus:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
  }
};
