import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, errorResponse, successResponse } from '../utils/errorHandler';
import { isValidPaymentMethod, isValidTransactionStatus } from '../utils/validation';

const prisma = new PrismaClient();

// Membuat transaksi baru
export const createTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { bookingId, amount, method } = req.body;
  const userId = req.user!.userId;

  if (!bookingId || !amount || !method) {
    errorResponse(res, 'Booking ID, amount, and payment method are required', 400);
    return;
  }

  if (!isValidPaymentMethod(method)) {
    errorResponse(res, 'Invalid payment method', 400);
    return;
  }

  if (amount <= 0) {
    errorResponse(res, 'Amount must be positive', 400);
    return;
  }

  // Cek apakah booking ada dan milik user
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId }
  });

  if (!booking) {
    errorResponse(res, 'Booking not found or not owned by user', 404);
    return;
  }

  // Cek apakah sudah ada transaksi
  const existingTx = await prisma.transaction.findUnique({
    where: { bookingId }
  });

  if (existingTx) {
    errorResponse(res, 'Transaction already exists for this booking', 400);
    return;
  }

  const transaction = await prisma.transaction.create({
    data: {
      bookingId,
      userId,
      amount,
      method,
      status: 'pending'
    },
    include: {
      booking: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  successResponse(res, transaction, 'Transaction created successfully', 201);
});

// Mendapatkan transaksi user
export const getUserTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { status, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { userId };
  if (status && typeof status === 'string') {
    where.status = status;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.transaction.count({ where })
  ]);

  successResponse(res, {
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Konfirmasi pembayaran (update status ke paid)
export const confirmPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { booking: true }
  });

  if (!transaction) {
    errorResponse(res, 'Transaction not found', 404);
    return;
  }

  if (transaction.status !== 'pending') {
    errorResponse(res, 'Transaction is not in pending status', 400);
    return;
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data: {
      status: 'paid'
    },
    include: {
      booking: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  // Update booking status ke processing jika pembayaran berhasil
  await prisma.booking.update({
    where: { id: transaction.bookingId },
    data: { status: 'processing' }
  });

  successResponse(res, updatedTransaction, 'Payment confirmed successfully');
});

// Mendapatkan detail transaksi
export const getTransactionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      booking: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  if (!transaction) {
    errorResponse(res, 'Transaction not found', 404);
    return;
  }

  successResponse(res, transaction);
});

// Update status transaksi (admin only)
export const updateTransactionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidTransactionStatus(status)) {
    errorResponse(res, 'Invalid transaction status', 400);
    return;
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { booking: true }
  });

  if (!transaction) {
    errorResponse(res, 'Transaction not found', 404);
    return;
  }

  const updateData: any = { status };

  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data: updateData,
    include: {
      booking: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  // Update booking status berdasarkan status transaksi
  if (status === 'paid') {
    await prisma.booking.update({
      where: { id: transaction.bookingId },
      data: { status: 'processing' }
    });
  } else if (status === 'failed' || status === 'refunded') {
    await prisma.booking.update({
      where: { id: transaction.bookingId },
      data: { status: 'cancelled' }
    });
  }

  successResponse(res, updatedTransaction, 'Transaction status updated successfully');
});
