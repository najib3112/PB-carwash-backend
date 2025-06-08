import express from 'express';
import {
  cancelBooking,
  createBooking,
  getAvailableTimeSlots,
  getBookingById,
  getUserBookings
} from '../controllers/booking.controller';
import authMiddleware from '../middleware/auth.Middleware';
import { bookingLimiter, generalLimiter } from '../middleware/rateLimiter';
import { validateBooking } from '../utils/validation';

const router = express.Router();

// Public routes
router.get('/available-slots', getAvailableTimeSlots);

// Protected routes
router.use(authMiddleware);
router.use(generalLimiter.middleware);
router.post('/', bookingLimiter.middleware, validateBooking, createBooking);
router.get('/', getUserBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);

export default router;
