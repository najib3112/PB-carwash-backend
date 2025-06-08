import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, successResponse, errorResponse } from '../utils/errorHandler';
import { isValidBookingStatus } from '../utils/validation';

const prisma = new PrismaClient();

// Dashboard statistik
export const getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period = 'today' } = req.query;
  
  let startDate: Date;
  const endDate = new Date();
  
  switch (period) {
    case 'today':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
  }

  const [
    totalBookings,
    pendingBookings,
    processingBookings,
    completedBookings,
    cancelledBookings,
    totalRevenue,
    totalUsers,
    totalServices,
    recentBookings
  ] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    }),
    prisma.booking.count({
      where: { 
        status: 'pending',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.booking.count({
      where: { 
        status: 'processing',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.booking.count({
      where: { 
        status: 'done',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.booking.count({
      where: { 
        status: 'cancelled',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.transaction.aggregate({
      where: {
        status: 'paid',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    }),
    prisma.user.count({
      where: { 
        role: 'user',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.service.count(),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        transaction: true
      }
    })
  ]);

  const stats = {
    period,
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      processing: processingBookings,
      completed: completedBookings,
      cancelled: cancelledBookings
    },
    revenue: {
      total: totalRevenue._sum.amount || 0
    },
    users: {
      total: totalUsers
    },
    services: {
      total: totalServices
    },
    recentBookings
  };

  successResponse(res, stats);
});

// Mendapatkan semua booking dengan filter
export const getAllBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, page = 1, limit = 10, startDate, endDate } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = {};
  if (status && typeof status === 'string') {
    where.status = status;
  }
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        transaction: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.booking.count({ where })
  ]);

  successResponse(res, {
    bookings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Update status booking
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidBookingStatus(status)) {
    errorResponse(res, 'Invalid status value', 400);
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { transaction: true }
  });

  if (!booking) {
    errorResponse(res, 'Booking not found', 404);
    return;
  }

  // Update booking status
  const updated = await prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      transaction: true
    }
  });

  successResponse(res, updated, 'Booking status updated successfully');
});

// Mendapatkan laporan keuangan
export const getFinancialReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  let start = new Date();
  let end = new Date();

  if (startDate && endDate) {
    start = new Date(startDate as string);
    end = new Date(endDate as string);
  } else {
    // Default: 30 hari terakhir
    start.setDate(start.getDate() - 30);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'paid',
      createdAt: { gte: start, lte: end }
    },
    include: {
      booking: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group by day/week/month
  const groupedData: { [key: string]: { revenue: number; count: number } } = {};
  
  transactions.forEach(transaction => {
    let key: string;
    const date = new Date(transaction.createdAt);
    
    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!groupedData[key]) {
      groupedData[key] = { revenue: 0, count: 0 };
    }
    
    groupedData[key].revenue += transaction.amount;
    groupedData[key].count += 1;
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = transactions.length;

  successResponse(res, {
    period: { start, end },
    summary: {
      totalRevenue,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    },
    chartData: Object.entries(groupedData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count
    }))
  });
});

// Mendapatkan semua user
export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, role } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = {};
  if (role && typeof role === 'string') {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.user.count({ where })
  ]);

  successResponse(res, {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});
