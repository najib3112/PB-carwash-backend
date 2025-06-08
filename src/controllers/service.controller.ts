import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, errorResponse, successResponse } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Mendapatkan semua layanan
export const getAllServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { isActive } = req.query;

  const where: any = {};
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const services = await prisma.service.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, services);
});

// Mendapatkan detail layanan
export const getServiceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { status: 'done' },
        include: {
          review: true
        }
      }
    }
  });

  if (!service) {
    errorResponse(res, 'Service not found', 404);
    return;
  }

  // Hitung rating rata-rata
  const reviews = service.bookings
    .map(booking => booking.review)
    .filter(review => review !== null);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review!.rating, 0) / reviews.length
    : 0;

  const serviceWithStats = {
    ...service,
    totalBookings: service.bookings.length,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length
  };

  successResponse(res, serviceWithStats);
});

// Membuat layanan baru (admin only)
export const createService = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, duration } = req.body;

  if (!name || !description || !price || !duration) {
    errorResponse(res, 'Name, description, price, and duration are required', 400);
    return;
  }

  if (price <= 0 || duration <= 0) {
    errorResponse(res, 'Price and duration must be positive numbers', 400);
    return;
  }

  const service = await prisma.service.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      price,
      duration
    }
  });

  successResponse(res, service, 'Service created successfully', 201);
});

// Update layanan (admin only)
export const updateService = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, price, duration, isActive } = req.body;

  const existingService = await prisma.service.findUnique({
    where: { id }
  });

  if (!existingService) {
    errorResponse(res, 'Service not found', 404);
    return;
  }

  const updateData: any = {};
  if (name) updateData.name = name.trim();
  if (description) updateData.description = description.trim();
  if (price !== undefined) {
    if (price <= 0) {
      errorResponse(res, 'Price must be a positive number', 400);
      return;
    }
    updateData.price = price;
  }
  if (duration !== undefined) {
    if (duration <= 0) {
      errorResponse(res, 'Duration must be a positive number', 400);
      return;
    }
    updateData.duration = duration;
  }
  if (isActive !== undefined) updateData.isActive = isActive;

  const service = await prisma.service.update({
    where: { id },
    data: updateData
  });

  successResponse(res, service, 'Service updated successfully');
});

// Soft delete layanan (admin only)
export const deleteService = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id }
  });

  if (!service) {
    errorResponse(res, 'Service not found', 404);
    return;
  }

  // Cek apakah ada booking aktif dengan layanan ini
  const activeBookings = await prisma.booking.findFirst({
    where: {
      serviceId: id,
      status: { in: ['pending', 'processing'] }
    }
  });

  if (activeBookings) {
    errorResponse(res, 'Cannot delete service with active bookings', 400);
    return;
  }

  const updatedService = await prisma.service.update({
    where: { id },
    data: { isActive: false }
  });

  successResponse(res, updatedService, 'Service deleted successfully');
});

// Mengaktifkan kembali layanan (admin only)
export const activateService = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id }
  });

  if (!service) {
    errorResponse(res, 'Service not found', 404);
    return;
  }

  const updatedService = await prisma.service.update({
    where: { id },
    data: { isActive: true }
  });

  successResponse(res, updatedService, 'Service activated successfully');
});
