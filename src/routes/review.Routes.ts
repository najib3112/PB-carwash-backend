import express from 'express';
import {
  createReview,
  getUserReviews,
  getAllReviews,
  updateReview,
  deleteReview,
  getReviewStats,
  getReviewByBookingId
} from '../controllers/review.controller';
import authMiddleware from '../middleware/auth.Middleware';
import { validateReview } from '../utils/validation';

const router = express.Router();

// Public routes
router.get('/all', getAllReviews);
router.get('/stats', getReviewStats);

// Protected routes
router.use(authMiddleware);
router.post('/', validateReview, createReview);
router.get('/', getUserReviews);
router.get('/booking/:bookingId', getReviewByBookingId);
router.put('/:id', validateReview, updateReview);
router.delete('/:id', deleteReview);

export default router;
