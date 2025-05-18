import { NextFunction, Request, Response } from 'express';

export default function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Admin only' });
    return;
  }

  next();
}
