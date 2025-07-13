// Contrôleur de gestion des abonnements pour FormEase
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const prisma = new PrismaClient();

// Configuration des plans d'abonnement
const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "FREE",
    price: 0,
    maxForms: 1,
    maxSubmissions: 100,
    validityDays: 7, // 7 jours pour FREE
    maxEmailsPerMonth: 50,
    features: ["basic_forms", "csv_export", "email_notifications"],
  },
  PREMIUM: {
    name: "PREMIUM",
    price: 12, // €/mois
    maxForms: 100,
    maxSubmissions: 10000,
    validityDays: 30, // 30 jours (1 mois) pour PREMIUM
    maxEmailsPerMonth: 5000,
    features: [
      "all_forms",
      "payment_forms",
      "advanced_analytics",
      "ai_generator",
      "campaigns",
      "pdf_export",
      "webhooks",
    ],
  },
};

// Récupérer les informations d'abonnement
exports.getSubscriptionInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan: true,
        plan_expiration: true,
        stripe_customer_id: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const currentPlan = user.plan || "free";
    const planExpiration = user.plan_expiration;

    // Vérifier si le plan premium est expiré
    if (
      currentPlan === "premium" &&
      planExpiration &&
      new Date() > planExpiration
    ) {
      // Rétrograder automatiquement vers FREE
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "free", plan_expiration: null },
      });
      user.plan = "free";
      user.plan_expiration = null;
    }

    const planInfo =
      SUBSCRIPTION_PLANS[currentPlan.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;

    // Récupérer les informations Stripe si disponibles
    let stripeSubscription = null;
    if (user.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(
          user.stripe_customer_id
        );
        if (customer.subscriptions && customer.subscriptions.data.length > 0) {
          stripeSubscription = customer.subscriptions.data[0];
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données Stripe:",
          error
        );
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan || "free",
      },
      subscription: {
        plan: user.plan || "free",
        planName: planInfo.name,
        price: planInfo.price,
        currency: "eur",
        interval: "month",
        expiration: planExpiration,
        isActive:
          currentPlan === "premium" &&
          (!planExpiration || new Date() < planExpiration),
        features: planInfo.features,
        limits: {
          forms: planInfo.maxForms,
          submissions: planInfo.maxSubmissions,
          validityDays: planInfo.validityDays,
          emails: planInfo.maxEmailsPerMonth,
          exports: currentPlan === "premium" ? 100 : 5,
        },
        stripeSubscriptionId: stripeSubscription?.id || null,
        nextBillingDate: stripeSubscription?.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000)
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des informations d'abonnement:",
      error
    );
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

/**
 * Obtenir l'historique des paiements
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { user_id: req.user.id } }),
    ]);

    // Enrichir avec les informations Stripe si disponibles
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        let stripeDetails = null;
        if (
          payment.provider === "stripe" &&
          payment.transaction_ref &&
          stripe
        ) {
          try {
            // Essayer de récupérer les détails du payment intent ou de la session
            if (payment.transaction_ref.startsWith("pi_")) {
              stripeDetails = await stripe.paymentIntents.retrieve(
                payment.transaction_ref
              );
            } else if (payment.transaction_ref.startsWith("cs_")) {
              stripeDetails = await stripe.checkout.sessions.retrieve(
                payment.transaction_ref
              );
            }
          } catch (error) {
            logger.warn(
              `Erreur récupération détails Stripe pour ${payment.transaction_ref}:`,
              error.message
            );
          }
        }

        return {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          provider: payment.provider,
          transaction_ref: payment.transaction_ref,
          created_at: payment.created_at,
          stripeDetails: stripeDetails
            ? {
                paymentMethod:
                  stripeDetails.payment_method_types ||
                  stripeDetails.payment_method?.type,
                description: stripeDetails.description,
                receiptUrl: stripeDetails.charges?.data[0]?.receipt_url,
              }
            : null,
        };
      })
    );

    res.json({
      payments: enrichedPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération historique paiements:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'historique des paiements",
    });
  }
};

// Créer un abonnement
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;

    if (!planType || !SUBSCRIPTION_PLANS[planType.toUpperCase()]) {
      return res.status(400).json({ message: "Type de plan invalide" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan: true,
        plan_expiration: true,
        stripe_customer_id: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà un abonnement premium actif
    if (
      user.plan === "premium" &&
      user.plan_expiration &&
      new Date() < user.plan_expiration
    ) {
      return res
        .status(400)
        .json({ message: "Vous avez déjà un abonnement premium actif" });
    }

    const plan = SUBSCRIPTION_PLANS[planType.toUpperCase()];
    let customerId = user.stripe_customer_id;

    // Créer un client Stripe si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripe_customer_id: customerId },
      });
    }

    // Créer une session de checkout Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: userId.toString(),
        planType: planType,
      },
    });

    // Enregistrer la tentative de paiement
    await prisma.payment.create({
      data: {
        user_id: userId,
        provider: "stripe",
        amount: plan.price * 100, // Convertir en centimes
        currency: "eur",
        status: "pending",
        transaction_ref: session.id,
        metadata: {
          planType: planType,
          sessionId: session.id,
        },
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      planType: planType,
      planName: plan.name,
      price: plan.price,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'abonnement:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

/**
 * Annuler un abonnement (downgrade vers free)
 */
exports.cancelSubscription = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        message: "Service de paiement temporairement indisponible",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ message: "Aucun abonnement trouvé" });
    }

    // Récupérer l'abonnement actif
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: "Aucun abonnement actif trouvé" });
    }

    const subscription = subscriptions.data[0];

    // Annuler l'abonnement à la fin de la période de facturation
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: true,
      }
    );

    logger.info(`Abonnement annulé pour l'utilisateur ${user.id}`, {
      subscriptionId: subscription.id,
      cancelAt: new Date(canceledSubscription.cancel_at * 1000),
    });

    res.json({
      message: "Abonnement annulé avec succès",
      cancelAt: new Date(canceledSubscription.cancel_at * 1000),
      remainingDays: Math.ceil(
        (canceledSubscription.cancel_at * 1000 - Date.now()) /
          (1000 * 60 * 60 * 24)
      ),
    });
  } catch (error) {
    logger.error("Erreur annulation abonnement:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'annulation de l'abonnement" });
  }
};

/**
 * Réactiver un abonnement annulé
 */
exports.reactivateSubscription = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        message: "Service de paiement temporairement indisponible",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ message: "Aucun abonnement trouvé" });
    }

    // Récupérer l'abonnement
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: "Aucun abonnement trouvé" });
    }

    const subscription = subscriptions.data[0];

    if (!subscription.cancel_at_period_end) {
      return res
        .status(400)
        .json({ message: "L'abonnement n'est pas programmé pour annulation" });
    }

    // Réactiver l'abonnement
    const reactivatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: false,
      }
    );

    logger.info(`Abonnement réactivé pour l'utilisateur ${user.id}`, {
      subscriptionId: subscription.id,
    });

    res.json({
      message: "Abonnement réactivé avec succès",
      nextBillingDate: new Date(
        reactivatedSubscription.current_period_end * 1000
      ),
    });
  } catch (error) {
    logger.error("Erreur réactivation abonnement:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la réactivation de l'abonnement" });
  }
};

/**
 * Obtenir les méthodes de paiement de l'utilisateur
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        message: "Service de paiement temporairement indisponible",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.stripe_customer_id) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: "card",
    });

    const formattedMethods = paymentMethods.data.map((method) => ({
      id: method.id,
      type: method.type,
      card: {
        brand: method.card.brand,
        last4: method.card.last4,
        expMonth: method.card.exp_month,
        expYear: method.card.exp_year,
        country: method.card.country,
      },
      created: new Date(method.created * 1000),
    }));

    res.json({ paymentMethods: formattedMethods });
  } catch (error) {
    logger.error("Erreur récupération méthodes de paiement:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des méthodes de paiement",
    });
  }
};

/**
 * Supprimer une méthode de paiement
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        message: "Service de paiement temporairement indisponible",
      });
    }

    const { paymentMethodId } = req.params;

    // Vérifier que la méthode de paiement appartient à l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== user.stripe_customer_id) {
      return res
        .status(403)
        .json({ message: "Méthode de paiement non autorisée" });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    logger.info(`Méthode de paiement supprimée pour l'utilisateur ${user.id}`, {
      paymentMethodId,
    });

    res.json({ message: "Méthode de paiement supprimée avec succès" });
  } catch (error) {
    logger.error("Erreur suppression méthode de paiement:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression de la méthode de paiement",
    });
  }
};

/**
 * Créer une session pour ajouter une méthode de paiement
 */
exports.createSetupSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        message: "Service de paiement temporairement indisponible",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    let customerId = user.stripe_customer_id;

    // Créer un client Stripe si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: {
          userId: user.id.toString(),
        },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      });
    }

    // Créer une session de setup
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?setup=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?setup=canceled`,
    });

    res.json({
      message: "Session de configuration créée",
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error("Erreur création session setup:", error);
    res.status(500).json({
      message: "Erreur lors de la création de la session de configuration",
    });
  }
};

/**
 * Obtenir les statistiques d'utilisation
 */
exports.getUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Récupérer le plan de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, plan_expiration: true },
    });

    const currentPlan = user?.plan || "free";
    const planLimits =
      SUBSCRIPTION_PLANS[currentPlan.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;

    // Compter les utilisations
    const [
      formsCount,
      submissionsCount,
      exportsToday,
      emailsThisMonth,
      oldestForm,
    ] = await Promise.all([
      // Nombre de formulaires
      prisma.form.count({
        where: { user_id: userId, archived: false },
      }),
      // Nombre total de soumissions
      prisma.submission.count({
        where: { form: { user_id: userId } },
      }),
      // Exports aujourd'hui
      prisma.exportLog.count({
        where: {
          user_id: userId,
          created_at: { gte: startOfDay },
        },
      }),
      // Emails ce mois
      prisma.emailLog.count({
        where: {
          user_id: userId,
          sent_at: { gte: startOfMonth },
        },
      }),
      // Formulaire le plus ancien (pour calculer la validité)
      prisma.form.findFirst({
        where: { user_id: userId, archived: false },
        orderBy: { created_at: "asc" },
        select: { created_at: true },
      }),
    ]);

    // Calculer les jours restants pour le formulaire le plus ancien
    let formValidityDays = null;
    if (oldestForm) {
      const formAge = Math.floor(
        (now - oldestForm.created_at) / (1000 * 60 * 60 * 24)
      );
      formValidityDays = Math.max(0, planLimits.validityDays - formAge);
    }

    res.json({
      plan: currentPlan,
      limits: planLimits,
      usage: {
        forms: {
          used: formsCount,
          limit: planLimits.maxForms,
          percentage: Math.round((formsCount / planLimits.maxForms) * 100),
        },
        submissions: {
          used: submissionsCount,
          limit: planLimits.maxSubmissions,
          percentage: Math.round(
            (submissionsCount / planLimits.maxSubmissions) * 100
          ),
        },
        exports: {
          used: exportsToday,
          limit: currentPlan === "premium" ? 100 : 5,
          percentage: Math.round(
            (exportsToday / (currentPlan === "premium" ? 100 : 5)) * 100
          ),
          period: "daily",
        },
        emails: {
          used: emailsThisMonth,
          limit: planLimits.maxEmailsPerMonth,
          percentage: Math.round(
            (emailsThisMonth / planLimits.maxEmailsPerMonth) * 100
          ),
          period: "monthly",
        },
        formValidity: {
          remainingDays: formValidityDays,
          totalDays: planLimits.validityDays,
        },
      },
    });
  } catch (error) {
    logger.error("Erreur récupération statistiques d'utilisation:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques d'utilisation",
    });
  }
};

/**
 * Obtenir les plans disponibles
 */
exports.getAvailablePlans = async (req, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      currency: "eur", // Stripe uses EUR for all plans
      interval: "month", // Stripe uses month for all plans
      features: plan.features,
      limits: {
        forms: plan.maxForms,
        submissions: plan.maxSubmissions,
        validityDays: plan.validityDays,
        emails: plan.maxEmailsPerMonth,
        exports: key === "PREMIUM" ? 100 : 5,
      },
      recommended: key === "PREMIUM",
    }));

    res.json({ plans });
  } catch (error) {
    logger.error("Erreur récupération plans:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des plans" });
  }
};
