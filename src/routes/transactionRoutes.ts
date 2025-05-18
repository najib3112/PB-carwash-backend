import express from 'express';
import { createTransaction } from '../controllers/transactionController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, createTransaction);

export default router;
