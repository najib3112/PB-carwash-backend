import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        transaction: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('❌ Error getting all bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'processing', 'done'].includes(status)) {
    res.status(400).json({ error: 'Invalid status value' });
    return;
  }

  try {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(404).json({ error: 'Booking not found' });
  }
};