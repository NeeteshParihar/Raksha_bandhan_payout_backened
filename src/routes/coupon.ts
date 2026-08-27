import { Router } from 'express';
import { createCoupon, getCoupon, getSisterCoupon, deleteCoupon, editCoupon, getCouponByCouponCode } from '../controllers/coupon.js';
import { validateUser } from '../middlewares/validateUser.js';

const router = Router();

// Create a bonus coupon (Brother action)
router.post('/', validateUser, createCoupon);

// Get all coupons for a brother
router.get('/', validateUser, getCoupon);

// Get all coupons for a specific sister (Brother action)
router.get('/sister/:sisterId', validateUser, getSisterCoupon);

// Delete a coupon
router.delete('/:couponId', validateUser, deleteCoupon);

// Edit a coupon
router.patch('/:couponId', validateUser, editCoupon);

// Apply a bonus coupon (Sister action)
router.post('/apply', (req, res) => {
  res.send('Apply Coupon API');
});

// Get a coupon by couponCode
router.get('/code/:couponCode', validateUser, getCouponByCouponCode);

export default router;


