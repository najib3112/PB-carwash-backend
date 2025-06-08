import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import adminRoutes from './routes/admin.Routes';
import bookingRoutes from './routes/booking.Routes';
import reviewRoutes from './routes/review.Routes';
import serviceRoutes from './routes/services.Routes';
import transactionRoutes from './routes/transaction.Routes';
import userRoutes from './routes/user.Routes';
import vehicleRoutes from './routes/vehicle.Routes';
import { errorHandler, notFoundHandler } from './utils/errorHandler';
import { requestLogger } from './utils/logger';

dotenv.config();

const app = express();

// Initialize database connection (non-blocking)
async function initDatabase() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('🎉 Database ready for requests');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️ Starting without database connection');
    return false;
  }
}

initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Simple database check middleware
app.use('/api', async (req, res, next) => {
  // Skip database check for health endpoint
  if (req.path === '/health') {
    return next();
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      success: false,
      error: 'Database temporarily unavailable',
      message: 'Please try again later',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  const health = {
    status: 'OK',
    message: 'Carwash Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: 'unknown'
  };

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'DEGRADED';
  }

  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('Error disconnecting database:', error);
  }
});

export default app;
