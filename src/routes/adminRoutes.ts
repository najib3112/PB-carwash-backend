import express from 'express';
import { getAllBookings, updateBookingStatus } from '../controllers/adminController';
import adminMiddleware from '../middleware/adminMiddleware';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

export default router;