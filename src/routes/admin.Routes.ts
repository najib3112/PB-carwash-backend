import express from 'express';
import {
  getAllBookings,
  getAllUsers,
  getDashboardStats,
  getFinancialReport,
  updateBookingStatus
} from '../controllers/admin.controller';
import adminMiddleware from '../middleware/admin.Middleware';
import authMiddleware from '../middleware/auth.Middleware';

const router = express.Router();

// Semua routes memerlukan autentikasi admin
router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);
router.get('/financial-report', getFinancialReport);
router.get('/users', getAllUsers);

export default router;