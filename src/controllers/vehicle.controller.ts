import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { asyncHandler, successResponse, errorResponse } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Mendapatkan semua kendaraan user
export const getUserVehicles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { isActive } = req.query;

  const where: any = { userId };
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, vehicles);
});

// Mendapatkan detail kendaraan
export const getVehicleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId },
    include: {
      bookings: {
        include: {
          service: true,
          transaction: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5 // 5 booking terakhir
      }
    }
  });

  if (!vehicle) {
    errorResponse(res, 'Vehicle not found', 404);
    return;
  }

  successResponse(res, vehicle);
});

// Menambah kendaraan baru
export const createVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { brand, model, year, color, plateNumber, vehicleType } = req.body;
  const userId = req.user!.userId;

  // Cek apakah plat nomor sudah ada
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { plateNumber: plateNumber.toUpperCase() }
  });

  if (existingVehicle) {
    errorResponse(res, 'Vehicle with this plate number already exists', 400);
    return;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId,
      brand: brand.trim(),
      model: model.trim(),
      year,
      color: color.trim(),
      plateNumber: plateNumber.toUpperCase(),
      vehicleType
    }
  });

  successResponse(res, vehicle, 'Vehicle added successfully', 201);
});

// Update kendaraan
export const updateVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { brand, model, year, color, plateNumber, vehicleType } = req.body;
  const userId = req.user!.userId;

  // Cek apakah kendaraan milik user
  const existingVehicle = await prisma.vehicle.findFirst({
    where: { id, userId }
  });

  if (!existingVehicle) {
    errorResponse(res, 'Vehicle not found', 404);
    return;
  }

  // Cek apakah plat nomor sudah digunakan kendaraan lain
  if (plateNumber && plateNumber.toUpperCase() !== existingVehicle.plateNumber) {
    const duplicatePlate = await prisma.vehicle.findUnique({
      where: { plateNumber: plateNumber.toUpperCase() }
    });

    if (duplicatePlate) {
      errorResponse(res, 'Vehicle with this plate number already exists', 400);
      return;
    }
  }

  const updateData: any = {};
  if (brand) updateData.brand = brand.trim();
  if (model) updateData.model = model.trim();
  if (year) updateData.year = year;
  if (color) updateData.color = color.trim();
  if (plateNumber) updateData.plateNumber = plateNumber.toUpperCase();
  if (vehicleType) updateData.vehicleType = vehicleType;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: updateData
  });

  successResponse(res, vehicle, 'Vehicle updated successfully');
});

// Soft delete kendaraan (set isActive = false)
export const deleteVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId }
  });

  if (!vehicle) {
    errorResponse(res, 'Vehicle not found', 404);
    return;
  }

  // Cek apakah ada booking aktif dengan kendaraan ini
  const activeBookings = await prisma.booking.findFirst({
    where: {
      vehicleId: id,
      status: { in: ['pending', 'processing'] }
    }
  });

  if (activeBookings) {
    errorResponse(res, 'Cannot delete vehicle with active bookings', 400);
    return;
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: { isActive: false }
  });

  successResponse(res, updatedVehicle, 'Vehicle deleted successfully');
});

// Mengaktifkan kembali kendaraan
export const activateVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId }
  });

  if (!vehicle) {
    errorResponse(res, 'Vehicle not found', 404);
    return;
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: { isActive: true }
  });

  successResponse(res, updatedVehicle, 'Vehicle activated successfully');
});

// Mendapatkan statistik kendaraan
export const getVehicleStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId }
  });

  if (!vehicle) {
    errorResponse(res, 'Vehicle not found', 404);
    return;
  }

  const [totalBookings, completedBookings, totalSpent] = await Promise.all([
    prisma.booking.count({
      where: { vehicleId: id }
    }),
    prisma.booking.count({
      where: { vehicleId: id, status: 'done' }
    }),
    prisma.transaction.aggregate({
      where: {
        booking: { vehicleId: id },
        status: 'paid'
      },
      _sum: { amount: true }
    })
  ]);

  const stats = {
    totalBookings,
    completedBookings,
    totalSpent: totalSpent._sum.amount || 0,
    vehicle
  };

  successResponse(res, stats);
});
