import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getAllServices = async (_req: Request, res: Response) => {
  const services = await prisma.service.findMany();
  res.json(services);
};

export const createService = async (req: Request, res: Response) => {
  const { name, description, price } = req.body;
  const service = await prisma.service.create({
    data: { name, description, price },
  });
  res.status(201).json(service);
};
