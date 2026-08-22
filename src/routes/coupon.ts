import { Router } from 'express';
import { createCoupon, getCoupon, getSisterCoupon, deleteCoupon } from '../controllers/coupon.js';
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

// Apply a bonus coupon (Sister action)
router.post('/apply', (req, res) => {
  res.send('Apply Coupon API');
});

export default router;



