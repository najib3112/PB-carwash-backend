import express from 'express';
import {
  confirmPayment,
  createTransaction,
  getTransactionById,
  getUserTransactions,
  updateTransactionStatus
} from '../controllers/transaction.controller';
import adminMiddleware from '../middleware/admin.Middleware';
import authMiddleware from '../middleware/auth.Middleware';

const router = express.Router();

// Protected routes
router.use(authMiddleware);
router.post('/', createTransaction);
router.get('/', getUserTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id/confirm', confirmPayment);

// Admin only routes
router.patch('/:id/status', adminMiddleware, updateTransactionStatus);

export default router;
