import { PrismaClient } from '@prisma/client';
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

// Initialize Prisma Client
const prisma = new PrismaClient();

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Don't exit, let the app start anyway for Railway deployment
  }
}

testDatabaseConnection();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Carwash Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: {
        users: '/api/users',
        services: '/api/services',
        bookings: '/api/bookings',
        transactions: '/api/transactions',
        vehicles: '/api/vehicles',
        reviews: '/api/reviews',
        admin: '/api/admin'
      }
    },
    authors: [
      'Muhammad Najib Saragih (12350111357)',
      'Rendy Rizqika Maulana (12350111267)',
      'M. Hafiz Akbar (12350114518)',
      'Muhammad Agil (12350111158)'
    ]
  });
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
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'DEGRADED';
  }

  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Documentation endpoint
app.get('/api', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Carwash Backend API Documentation',
    version: '1.0.0',
    baseUrl: '/api',
    endpoints: {
      authentication: {
        register: 'POST /api/users/register',
        login: 'POST /api/users/login',
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
        changePassword: 'PATCH /api/users/change-password'
      },
      services: {
        getAll: 'GET /api/services',
        getById: 'GET /api/services/:id',
        create: 'POST /api/services (admin)',
        update: 'PUT /api/services/:id (admin)',
        delete: 'DELETE /api/services/:id (admin)'
      },
      bookings: {
        create: 'POST /api/bookings',
        getUser: 'GET /api/bookings',
        getById: 'GET /api/bookings/:id',
        cancel: 'PATCH /api/bookings/:id/cancel',
        availableSlots: 'GET /api/bookings/available-slots'
      },
      vehicles: {
        getUser: 'GET /api/vehicles',
        create: 'POST /api/vehicles',
        getById: 'GET /api/vehicles/:id',
        update: 'PUT /api/vehicles/:id',
        delete: 'DELETE /api/vehicles/:id'
      },
      transactions: {
        create: 'POST /api/transactions',
        getUser: 'GET /api/transactions',
        getById: 'GET /api/transactions/:id',
        confirm: 'PATCH /api/transactions/:id/confirm'
      },
      reviews: {
        create: 'POST /api/reviews',
        getUser: 'GET /api/reviews',
        getAll: 'GET /api/reviews/all',
        stats: 'GET /api/reviews/stats',
        update: 'PUT /api/reviews/:id',
        delete: 'DELETE /api/reviews/:id'
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        bookings: 'GET /api/admin/bookings',
        updateBookingStatus: 'PATCH /api/admin/bookings/:id/status',
        financialReport: 'GET /api/admin/financial-report',
        users: 'GET /api/admin/users'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Get token from /api/users/login'
    }
  });
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
  await prisma.$disconnect();
});

export default app;
