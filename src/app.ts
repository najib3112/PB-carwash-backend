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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Carwash Backend API is running',
    timestamp: new Date().toISOString()
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

export default app;
