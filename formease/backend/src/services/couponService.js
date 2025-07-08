const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class CouponService {
  /**
   * Valider qu'un coupon peut être utilisé
   */
  static async validateCouponUsage(code, orderAmount, userId = null) {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!coupon) {
        return { valid: false, error: 'Coupon non trouvé' };
      }

      // Vérifications de validité
      const now = new Date();
      
      if (!coupon.isActive || coupon.status !== 'ACTIVE') {
        return { valid: false, error: 'Ce coupon n\'est plus actif' };
      }

      if (coupon.expiresAt && now > coupon.expiresAt) {
        return { valid: false, error: 'Ce coupon a expiré' };
      }

      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return { valid: false, error: 'Ce coupon a atteint sa limite d\'utilisation' };
      }

      if (coupon.minAmount && orderAmount < coupon.minAmount) {
        return { 
          valid: false, 
          error: `Montant minimum requis : ${coupon.minAmount}€` 
        };
      }

      // Calculer la réduction
      const discount = this.calculateDiscount(coupon, orderAmount);

      return {
        valid: true,
        coupon,
        discount
      };

    } catch (error) {
      logger.error('Erreur lors de la validation du coupon', { error: error.message, code });
      return { valid: false, error: 'Erreur lors de la validation' };
    }
  }

  /**
   * Calculer la réduction d'un coupon
   */
  static calculateDiscount(coupon, orderAmount) {
    let discountAmount = 0;
    
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * coupon.value) / 100;
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    return {
      amount: discountAmount,
      originalAmount: orderAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount),
      type: coupon.type,
      value: coupon.value
    };
  }

  /**
   * Appliquer un coupon et enregistrer son utilisation
   */
  static async applyCoupon(code, orderAmount, userId = null, orderId = null) {
    try {
      const validation = await this.validateCouponUsage(code, orderAmount, userId);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { coupon, discount } = validation;

      // Enregistrer l'utilisation dans une transaction
      const usage = await prisma.$transaction(async (tx) => {
        // Créer l'enregistrement d'utilisation
        const couponUsage = await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId: userId || null,
            orderId: orderId,
            amount: discount.amount
          }
        });

        // Incrémenter le compteur d'utilisations
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            currentUses: { increment: 1 }
          }
        });

        return couponUsage;
      });

      logger.info('Coupon appliqué avec succès', {
        couponId: coupon.id,
        code: coupon.code,
        userId,
        orderId,
        discountAmount: discount.amount,
        usageId: usage.id
      });

      return {
        success: true,
        usage,
        discount,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description
        }
      };

    } catch (error) {
      logger.error('Erreur lors de l\'application du coupon', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Générer un code coupon unique
   */
  static generateCouponCode(prefix = 'SAVE', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < length - prefix.length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Créer des coupons en lot
   */
  static async createBulkCoupons(couponsData, createdBy) {
    try {
      const coupons = [];
      
      for (const couponData of couponsData) {
        // Générer un code unique si non fourni
        if (!couponData.code) {
          let code;
          let isUnique = false;
          let attempts = 0;
          
          while (!isUnique && attempts < 10) {
            code = this.generateCouponCode();
            const existing = await prisma.coupon.findUnique({
              where: { code }
            });
            isUnique = !existing;
            attempts++;
          }
          
          if (!isUnique) {
            throw new Error('Impossible de générer un code unique');
          }
          
          couponData.code = code;
        }

        const coupon = await prisma.coupon.create({
          data: {
            ...couponData,
            code: couponData.code.toUpperCase(),
            createdBy
          }
        });

        coupons.push(coupon);
      }

      logger.info('Coupons créés en lot', {
        count: coupons.length,
        createdBy
      });

      return coupons;

    } catch (error) {
      logger.error('Erreur lors de la création en lot des coupons', { error: error.message });
      throw error;
    }
  }

  /**
   * Nettoyer les coupons expirés
   */
  static async cleanupExpiredCoupons() {
    try {
      const now = new Date();
      
      const updatedCount = await prisma.coupon.updateMany({
        where: {
          expiresAt: {
            lt: now
          },
          status: 'ACTIVE'
        },
        data: {
          status: 'EXPIRED',
          isActive: false,
          updated_at: now
        }
      });

      logger.info('Nettoyage des coupons expirés', {
        updatedCount: updatedCount.count
      });

      return updatedCount.count;

    } catch (error) {
      logger.error('Erreur lors du nettoyage des coupons expirés', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'utilisation d'un coupon
   */
  static async getCouponUsageStats(couponId) {
    try {
      const [coupon, usageStats, recentUsages] = await Promise.all([
        prisma.coupon.findUnique({
          where: { id: couponId },
          include: {
            _count: {
              select: { usages: true }
            }
          }
        }),
        
        prisma.couponUsage.aggregate({
          where: { couponId },
          _sum: { amount: true },
          _avg: { amount: true },
          _count: true
        }),
        
        prisma.couponUsage.findMany({
          where: { couponId },
          take: 10,
          orderBy: { usedAt: 'desc' },
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true, email: true }
            }
          }
        })
      ]);

      if (!coupon) {
        throw new Error('Coupon non trouvé');
      }

      return {
        coupon,
        stats: {
          totalUsages: usageStats._count,
          totalSavings: usageStats._sum.amount || 0,
          averageSavings: usageStats._avg.amount || 0,
          remainingUses: coupon.maxUses ? coupon.maxUses - coupon.currentUses : null
        },
        recentUsages
      };

    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques du coupon', { 
        error: error.message, 
        couponId 
      });
      throw error;
    }
  }

  /**
   * Vérifier l'intégrité des données des coupons
   */
  static async validateCouponIntegrity() {
    try {
      const issues = [];

      // Vérifier les incohérences dans les compteurs d'utilisation
      const couponsWithUsages = await prisma.coupon.findMany({
        include: {
          _count: {
            select: { usages: true }
          }
        }
      });

      for (const coupon of couponsWithUsages) {
        if (coupon.currentUses !== coupon._count.usages) {
          issues.push({
            type: 'USAGE_COUNT_MISMATCH',
            couponId: coupon.id,
            code: coupon.code,
            currentUses: coupon.currentUses,
            actualUsages: coupon._count.usages
          });

          // Corriger automatiquement
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { currentUses: coupon._count.usages }
          });
        }
      }

      logger.info('Vérification de l\'intégrité des coupons terminée', {
        issuesFound: issues.length
      });

      return { issues, corrected: issues.length };

    } catch (error) {
      logger.error('Erreur lors de la vérification de l\'intégrité des coupons', { 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = CouponService;
