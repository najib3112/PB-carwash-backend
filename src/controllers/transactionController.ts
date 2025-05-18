import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const createTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { bookingId, amount, method } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const existingTx = await prisma.transaction.findUnique({
      where: { bookingId },
    });

    if (existingTx) {
      res.status(400).json({ error: 'Transaction already exists for this booking' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        bookingId,
        userId: req.user!.userId,
        amount,
        method,
        status: 'pending',
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
