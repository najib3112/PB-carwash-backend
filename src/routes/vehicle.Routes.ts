import express from 'express';
import {
  getUserVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  activateVehicle,
  getVehicleStats
} from '../controllers/vehicle.controller';
import authMiddleware from '../middleware/auth.Middleware';
import { validateVehicle } from '../utils/validation';

const router = express.Router();

// Semua routes memerlukan autentikasi
router.use(authMiddleware);

router.get('/', getUserVehicles);
router.post('/', validateVehicle, createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.patch('/:id/activate', activateVehicle);
router.get('/:id/stats', getVehicleStats);

export default router;
