import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, successResponse, errorResponse } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Membuat review untuk booking
export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { bookingId, rating, comment } = req.body;
  const userId = req.user!.userId;

  // Cek apakah booking ada dan milik user
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { review: true }
  });

  if (!booking) {
    errorResponse(res, 'Booking not found', 404);
    return;
  }

  // Cek apakah booking sudah selesai
  if (booking.status !== 'done') {
    errorResponse(res, 'Can only review completed bookings', 400);
    return;
  }

  // Cek apakah sudah ada review
  if (booking.review) {
    errorResponse(res, 'Review already exists for this booking', 400);
    return;
  }

  const review = await prisma.review.create({
    data: {
      userId,
      bookingId,
      rating,
      comment: comment || null
    },
    include: {
      user: {
        select: { id: true, name: true }
      },
      booking: {
        include: {
          service: true
        }
      }
    }
  });

  successResponse(res, review, 'Review created successfully', 201);
});

// Mendapatkan review user
export const getUserReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        booking: {
          include: {
            service: true,
            vehicle: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.review.count({ where: { userId } })
  ]);

  successResponse(res, {
    reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Mendapatkan semua review (untuk admin atau public)
export const getAllReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, rating, serviceId } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = {};
  if (rating) {
    where.rating = Number(rating);
  }
  if (serviceId) {
    where.booking = { serviceId };
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true }
        },
        booking: {
          include: {
            service: true,
            vehicle: {
              select: { brand: true, model: true, vehicleType: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.review.count({ where })
  ]);

  successResponse(res, {
    reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Update review
export const updateReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user!.userId;

  const existingReview = await prisma.review.findFirst({
    where: { id, userId }
  });

  if (!existingReview) {
    errorResponse(res, 'Review not found', 404);
    return;
  }

  const updateData: any = {};
  if (rating !== undefined) updateData.rating = rating;
  if (comment !== undefined) updateData.comment = comment || null;

  const review = await prisma.review.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: { id: true, name: true }
      },
      booking: {
        include: {
          service: true,
          vehicle: {
            select: { brand: true, model: true, vehicleType: true }
          }
        }
      }
    }
  });

  successResponse(res, review, 'Review updated successfully');
});

// Hapus review
export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const review = await prisma.review.findFirst({
    where: { id, userId }
  });

  if (!review) {
    errorResponse(res, 'Review not found', 404);
    return;
  }

  await prisma.review.delete({
    where: { id }
  });

  successResponse(res, null, 'Review deleted successfully');
});

// Mendapatkan statistik review
export const getReviewStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { serviceId } = req.query;

  const where: any = {};
  if (serviceId) {
    where.booking = { serviceId };
  }

  const [totalReviews, avgRating, ratingDistribution] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true }
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
      orderBy: { rating: 'asc' }
    })
  ]);

  const stats = {
    totalReviews,
    averageRating: avgRating._avg.rating || 0,
    ratingDistribution: ratingDistribution.map(item => ({
      rating: item.rating,
      count: item._count.rating
    }))
  };

  successResponse(res, stats);
});

// Mendapatkan review berdasarkan booking ID
export const getReviewByBookingId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const userId = req.user!.userId;

  // Cek apakah booking milik user
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId }
  });

  if (!booking) {
    errorResponse(res, 'Booking not found', 404);
    return;
  }

  const review = await prisma.review.findUnique({
    where: { bookingId },
    include: {
      user: {
        select: { id: true, name: true }
      },
      booking: {
        include: {
          service: true,
          vehicle: {
            select: { brand: true, model: true, vehicleType: true }
          }
        }
      }
    }
  });

  if (!review) {
    errorResponse(res, 'Review not found for this booking', 404);
    return;
  }

  successResponse(res, review);
});
