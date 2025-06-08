import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, errorResponse, successResponse } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Membuat booking baru
export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { serviceId, vehicleId, date, timeSlot, location, notes } = req.body;
  const userId = req.user!.userId;

  // Cek apakah service ada dan aktif
  const service = await prisma.service.findFirst({
    where: { id: serviceId, isActive: true }
  });

  if (!service) {
    errorResponse(res, 'Service not found or inactive', 404);
    return;
  }

  // Cek apakah vehicle milik user (jika ada)
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, isActive: true }
    });

    if (!vehicle) {
      errorResponse(res, 'Vehicle not found or not owned by user', 404);
      return;
    }
  }

  // Cek ketersediaan slot waktu
  const bookingDate = new Date(date);
  const existingBooking = await prisma.booking.findFirst({
    where: {
      date: bookingDate,
      timeSlot,
      status: { in: ['pending', 'processing'] }
    }
  });

  if (existingBooking) {
    errorResponse(res, 'Time slot is already booked', 400);
    return;
  }

  // Buat booking
  const booking = await prisma.booking.create({
    data: {
      userId,
      serviceId,
      vehicleId: vehicleId || null,
      date: bookingDate,
      timeSlot,
      location,
      notes: notes || null
    },
    include: {
      service: true,
      vehicle: true,
      user: {
        select: { id: true, name: true, email: true, phone: true }
      }
    }
  });

  // Buat history status
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      status: 'pending',
      notes: 'Booking created'
    }
  });

  successResponse(res, booking, 'Booking created successfully', 201);
});

// Mendapatkan booking user
export const getUserBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { status, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { userId };
  if (status && typeof status === 'string') {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: true,
        vehicle: true,
        transaction: true,
        review: true
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

// Mendapatkan detail booking
export const getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    include: {
      service: true,
      vehicle: true,
      transaction: true,
      review: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      },
      user: {
        select: { id: true, name: true, email: true, phone: true }
      }
    }
  });

  if (!booking) {
    errorResponse(res, 'Booking not found', 404);
    return;
  }

  successResponse(res, booking);
});

// Membatalkan booking
export const cancelBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user!.userId;

  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    include: { transaction: true }
  });

  if (!booking) {
    errorResponse(res, 'Booking not found', 404);
    return;
  }

  if (booking.status === 'cancelled') {
    errorResponse(res, 'Booking is already cancelled', 400);
    return;
  }

  if (booking.status === 'done') {
    errorResponse(res, 'Cannot cancel completed booking', 400);
    return;
  }

  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status: 'cancelled' },
    include: {
      service: true,
      vehicle: true,
      transaction: true
    }
  });

  // Buat history status
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: id,
      status: 'cancelled',
      notes: reason || 'Cancelled by user'
    }
  });

  // Jika ada transaksi yang sudah dibayar, ubah status ke refunded
  if (booking.transaction && booking.transaction.status === 'paid') {
    await prisma.transaction.update({
      where: { id: booking.transaction.id },
      data: { status: 'refunded' }
    });
  }

  successResponse(res, updatedBooking, 'Booking cancelled successfully');
});

// Mendapatkan slot waktu yang tersedia
export const getAvailableTimeSlots = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query;

  if (!date || isNaN(Date.parse(date as string))) {
    errorResponse(res, 'Valid date is required', 400);
    return;
  }

  const bookingDate = new Date(date as string);

  // Slot waktu yang tersedia (bisa dikonfigurasi)
  const allTimeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  // Cari slot yang sudah dibooking
  const bookedSlots = await prisma.booking.findMany({
    where: {
      date: bookingDate,
      status: { in: ['pending', 'processing'] }
    },
    select: { timeSlot: true }
  });

  const bookedTimeSlots = bookedSlots.map(booking => booking.timeSlot);
  const availableSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));

  successResponse(res, { availableSlots, bookedSlots: bookedTimeSlots });
});
