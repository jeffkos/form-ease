const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  disableCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getCouponStats
} = require('../controllers/couponController');

// Routes publiques
/**
 * @route POST /api/coupons/validate
 * @desc Valider un coupon
 * @access Public
 */
router.post('/validate', validateCoupon);

/**
 * @route POST /api/coupons/apply
 * @desc Appliquer un coupon (utilisé par le système de paiement)
 * @access Internal/Webhook
 */
router.post('/apply', applyCoupon);

// Routes admin uniquement
/**
 * @route POST /api/admin/coupons
 * @desc Créer un nouveau coupon
 * @access Admin
 */
router.post('/admin/coupons', auth, requireRole('SUPERADMIN'), createCoupon);

/**
 * @route GET /api/admin/coupons
 * @desc Lister tous les coupons
 * @access Admin
 */
router.get('/admin/coupons', auth, requireRole('SUPERADMIN'), getCoupons);

/**
 * @route GET /api/admin/coupons/stats
 * @desc Statistiques des coupons
 * @access Admin
 */
router.get('/admin/coupons/stats', auth, requireRole('SUPERADMIN'), getCouponStats);

/**
 * @route GET /api/admin/coupons/:id
 * @desc Récupérer un coupon par ID
 * @access Admin
 */
router.get('/admin/coupons/:id', auth, requireRole('SUPERADMIN'), getCouponById);

/**
 * @route PUT /api/admin/coupons/:id
 * @desc Mettre à jour un coupon
 * @access Admin
 */
router.put('/admin/coupons/:id', auth, requireRole('SUPERADMIN'), updateCoupon);

/**
 * @route POST /api/admin/coupons/:id/disable
 * @desc Désactiver un coupon
 * @access Admin
 */
router.post('/admin/coupons/:id/disable', auth, requireRole('SUPERADMIN'), disableCoupon);

/**
 * @route DELETE /api/admin/coupons/:id
 * @desc Supprimer un coupon (seulement si non utilisé)
 * @access Admin
 */
router.delete('/admin/coupons/:id', auth, requireRole('SUPERADMIN'), deleteCoupon);

module.exports = router;
