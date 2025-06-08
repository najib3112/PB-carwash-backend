import express from 'express';
import {
  activateService,
  createService,
  deleteService,
  getAllServices,
  getServiceById,
  updateService
} from '../controllers/service.controller';
import adminMiddleware from '../middleware/admin.Middleware';
import authMiddleware from '../middleware/auth.Middleware';

const router = express.Router();

// Public routes
router.get('/', getAllServices);
router.get('/:id', getServiceById);

// Admin only routes
router.use(authMiddleware, adminMiddleware);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.patch('/:id/activate', activateService);

export default router;
