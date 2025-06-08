import express from 'express';
import {
  changePassword,
  getProfile,
  login,
  register,
  updateProfile
} from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.Middleware';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter';
import { validateUserRegistration } from '../utils/validation';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter.middleware, validateUserRegistration, register);
router.post('/login', authLimiter.middleware, login);

// Protected routes
router.use(authMiddleware);
router.use(generalLimiter.middleware);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/change-password', changePassword);

export default router;
