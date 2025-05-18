import express from 'express';
import { createService, getAllServices } from '../controllers/serviceController';
import adminMiddleware from '../middleware/adminMiddleware';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getAllServices);
router.post('/', authMiddleware, adminMiddleware, createService); // hanya admin

export default router;
