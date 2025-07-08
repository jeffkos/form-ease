const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

const prisma = new PrismaClient();

// Schémas de validation
const createCouponSchema = Joi.object({
  code: Joi.string().alphanum().min(3).max(20).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').required(),
  value: Joi.number().positive().required(),
  minAmount: Joi.number().positive().optional(),
  maxUses: Joi.number().integer().positive().optional(),
  expiresAt: Joi.date().iso().min('now').optional()
});

const updateCouponSchema = Joi.object({
  description: Joi.string().max(500).optional(),
  value: Joi.number().positive().optional(),
  minAmount: Joi.number().positive().optional(),
  maxUses: Joi.number().integer().positive().optional(),
  expiresAt: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional()
});

const validateCouponSchema = Joi.object({
  code: Joi.string().alphanum().min(3).max(20).required(),
  orderAmount: Joi.number().positive().required()
});

/**
 * Créer un nouveau coupon (Admin uniquement)
 */
const createCoupon = async (req, res) => {
  try {
    const { error, value } = createCouponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { code, description, type, value: couponValue, minAmount, maxUses, expiresAt } = value;

    // Vérifier si le code existe déjà
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: 'Un coupon avec ce code existe déjà'
      });
    }

    // Créer le coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value: couponValue,
        minAmount,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user.id
      },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        _count: {
          select: { usages: true }
        }
      }
    });

    logger.info('Coupon créé', {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Coupon créé avec succès',
      data: coupon
    });

  } catch (error) {
    logger.error('Erreur lors de la création du coupon', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Lister tous les coupons (Admin uniquement)
 */
const getCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 'ACTIVE', 'INACTIVE', 'EXPIRED'
    const type = req.query.type; // 'PERCENTAGE', 'FIXED_AMOUNT'
    const search = req.query.search;

    const skip = (page - 1) * limit;

    // Construire les filtres
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          creator: {
            select: { id: true, first_name: true, last_name: true, email: true }
          },
          _count: {
            select: { usages: true }
          }
        }
      }),
      prisma.coupon.count({ where })
    ]);

    // Marquer les coupons expirés
    const couponsWithStatus = coupons.map(coupon => ({
      ...coupon,
      isExpired: coupon.expiresAt && new Date() > coupon.expiresAt,
      isMaxUsesReached: coupon.maxUses && coupon.currentUses >= coupon.maxUses
    }));

    res.json({
      success: true,
      data: {
        coupons: couponsWithStatus,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des coupons', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer un coupon par ID (Admin uniquement)
 */
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        usages: {
          take: 10,
          orderBy: { usedAt: 'desc' },
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true, email: true }
            }
          }
        },
        _count: {
          select: { usages: true }
        }
      }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon non trouvé'
      });
    }

    // Ajouter des informations de statut
    const couponWithStatus = {
      ...coupon,
      isExpired: coupon.expiresAt && new Date() > coupon.expiresAt,
      isMaxUsesReached: coupon.maxUses && coupon.currentUses >= coupon.maxUses,
      remainingUses: coupon.maxUses ? coupon.maxUses - coupon.currentUses : null
    };

    res.json({
      success: true,
      data: couponWithStatus
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du coupon', { error: error.message, couponId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Mettre à jour un coupon (Admin uniquement)
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateCouponSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.details.map(detail => detail.message)
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon non trouvé'
      });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: {
        ...value,
        expiresAt: value.expiresAt ? new Date(value.expiresAt) : undefined,
        updated_at: new Date()
      },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, email: true }
        },
        _count: {
          select: { usages: true }
        }
      }
    });

    logger.info('Coupon mis à jour', {
      couponId: updatedCoupon.id,
      code: updatedCoupon.code,
      updatedBy: req.user.id,
      changes: value
    });

    res.json({
      success: true,
      message: 'Coupon mis à jour avec succès',
      data: updatedCoupon
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour du coupon', { error: error.message, couponId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Désactiver un coupon (Admin uniquement)
 */
const disableCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon non trouvé'
      });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        status: 'INACTIVE',
        updated_at: new Date()
      }
    });

    logger.info('Coupon désactivé', {
      couponId: updatedCoupon.id,
      code: updatedCoupon.code,
      disabledBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Coupon désactivé avec succès',
      data: updatedCoupon
    });

  } catch (error) {
    logger.error('Erreur lors de la désactivation du coupon', { error: error.message, couponId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Supprimer un coupon (Admin uniquement)
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon non trouvé'
      });
    }

    // Empêcher la suppression si le coupon a été utilisé
    if (coupon._count.usages > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un coupon qui a été utilisé. Veuillez le désactiver à la place.'
      });
    }

    await prisma.coupon.delete({
      where: { id: parseInt(id) }
    });

    logger.info('Coupon supprimé', {
      couponId: coupon.id,
      code: coupon.code,
      deletedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Coupon supprimé avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression du coupon', { error: error.message, couponId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Valider un coupon (Public)
 */
const validateCoupon = async (req, res) => {
  try {
    const { error, value } = validateCouponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { code, orderAmount } = value;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon non trouvé'
      });
    }

    // Vérifications de validité
    const now = new Date();
    
    if (!coupon.isActive || coupon.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Ce coupon n\'est plus actif'
      });
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Ce coupon a expiré'
      });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Ce coupon a atteint sa limite d\'utilisation'
      });
    }

    if (coupon.minAmount && orderAmount < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Montant minimum requis : ${coupon.minAmount}€`
      });
    }

    // Calculer la réduction
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * coupon.value) / 100;
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    res.json({
      success: true,
      message: 'Coupon valide',
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value
        },
        discount: {
          amount: discountAmount,
          originalAmount: orderAmount,
          finalAmount: finalAmount,
          savings: discountAmount
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la validation du coupon', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Appliquer un coupon lors d'un paiement
 */
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, userId, orderId, orderAmount } = req.body;

    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() }
    });

    if (!coupon || !coupon.isActive) {
      throw new Error('Coupon invalide');
    }

    // Calculer la réduction
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * coupon.value) / 100;
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    // Enregistrer l'utilisation du coupon
    await prisma.$transaction(async (tx) => {
      // Créer l'enregistrement d'utilisation
      await tx.couponUsage.create({
        data: {
          couponId: coupon.id,
          userId: userId || null,
          orderId: orderId,
          amount: discountAmount
        }
      });

      // Incrémenter le compteur d'utilisations
      await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          currentUses: { increment: 1 }
        }
      });
    });

    logger.info('Coupon appliqué', {
      couponId: coupon.id,
      code: coupon.code,
      userId: userId,
      orderId: orderId,
      discountAmount: discountAmount
    });

    res.json({
      success: true,
      message: 'Coupon appliqué avec succès',
      data: {
        discountAmount: discountAmount,
        finalAmount: orderAmount - discountAmount
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'application du coupon', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'application du coupon'
    });
  }
};

/**
 * Statistiques des coupons (Admin uniquement)
 */
const getCouponStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Définir les dates par défaut (30 derniers jours)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsages,
      totalSavings,
      topCoupons,
      usagesByDay
    ] = await Promise.all([
      // Total des coupons
      prisma.coupon.count(),
      
      // Coupons actifs
      prisma.coupon.count({
        where: {
          isActive: true,
          status: 'ACTIVE',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      
      // Coupons expirés
      prisma.coupon.count({
        where: {
          expiresAt: { lt: new Date() }
        }
      }),
      
      // Total des utilisations
      prisma.couponUsage.count({
        where: {
          usedAt: {
            gte: start,
            lte: end
          }
        }
      }),
      
      // Total des économies
      prisma.couponUsage.aggregate({
        where: {
          usedAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Top 5 des coupons les plus utilisés
      prisma.coupon.findMany({
        take: 5,
        orderBy: {
          currentUses: 'desc'
        },
        include: {
          _count: {
            select: { usages: true }
          }
        }
      }),
      
      // Utilisations par jour
      prisma.$queryRaw`
        SELECT 
          DATE(used_at) as date,
          COUNT(*) as usage_count,
          SUM(amount) as total_savings
        FROM coupon_usages 
        WHERE used_at >= ${start} AND used_at <= ${end}
        GROUP BY DATE(used_at)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCoupons,
          activeCoupons,
          expiredCoupons,
          totalUsages,
          totalSavings: totalSavings._sum.amount || 0
        },
        topCoupons,
        usagesByDay,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques des coupons', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  disableCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getCouponStats
};
