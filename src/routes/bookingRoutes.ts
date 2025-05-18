import express from 'express';
import { createBooking, getUserBookings } from '../controllers/bookingController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();
router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, getUserBookings);

export default router;
