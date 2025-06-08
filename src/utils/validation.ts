import { Request, Response, NextFunction } from 'express';

// Validasi email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validasi nomor telepon Indonesia
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
  return phoneRegex.test(phone);
};

// Validasi plat nomor Indonesia
export const isValidPlateNumber = (plateNumber: string): boolean => {
  const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/;
  return plateRegex.test(plateNumber.toUpperCase());
};

// Validasi rating (1-5)
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Validasi status booking
export const isValidBookingStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'processing', 'done', 'cancelled'];
  return validStatuses.includes(status);
};

// Validasi status transaksi
export const isValidTransactionStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  return validStatuses.includes(status);
};

// Validasi metode pembayaran
export const isValidPaymentMethod = (method: string): boolean => {
  const validMethods = ['ewallet', 'transfer', 'cash'];
  return validMethods.includes(method);
};

// Validasi tipe kendaraan
export const isValidVehicleType = (type: string): boolean => {
  const validTypes = ['car', 'motorcycle'];
  return validTypes.includes(type);
};

// Validasi time slot (format HH:MM-HH:MM)
export const isValidTimeSlot = (timeSlot: string): boolean => {
  const timeSlotRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeSlotRegex.test(timeSlot);
};

// Middleware untuk validasi input umum
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];
    
    for (const field of fields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
      return;
    }
    
    next();
  };
};

// Middleware untuk validasi registrasi user
export const validateUserRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password, phone } = req.body;
  const errors: string[] = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone number format');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  next();
};

// Middleware untuk validasi booking
export const validateBooking = (req: Request, res: Response, next: NextFunction): void => {
  const { serviceId, date, timeSlot, location } = req.body;
  const errors: string[] = [];

  if (!serviceId || typeof serviceId !== 'string') {
    errors.push('Valid service ID is required');
  }

  if (!date || isNaN(Date.parse(date))) {
    errors.push('Valid date is required');
  }

  if (!timeSlot || !isValidTimeSlot(timeSlot)) {
    errors.push('Valid time slot is required (format: HH:MM-HH:MM)');
  }

  if (!location || location.trim().length < 5) {
    errors.push('Location must be at least 5 characters long');
  }

  // Validasi tanggal tidak boleh di masa lalu
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    errors.push('Booking date cannot be in the past');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  next();
};

// Middleware untuk validasi kendaraan
export const validateVehicle = (req: Request, res: Response, next: NextFunction): void => {
  const { brand, model, year, color, plateNumber, vehicleType } = req.body;
  const errors: string[] = [];

  if (!brand || brand.trim().length < 2) {
    errors.push('Brand must be at least 2 characters long');
  }

  if (!model || model.trim().length < 2) {
    errors.push('Model must be at least 2 characters long');
  }

  if (!year || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    errors.push('Valid year is required');
  }

  if (!color || color.trim().length < 2) {
    errors.push('Color must be at least 2 characters long');
  }

  if (!plateNumber || !isValidPlateNumber(plateNumber)) {
    errors.push('Valid Indonesian plate number is required');
  }

  if (!vehicleType || !isValidVehicleType(vehicleType)) {
    errors.push('Vehicle type must be either "car" or "motorcycle"');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  next();
};

// Middleware untuk validasi review
export const validateReview = (req: Request, res: Response, next: NextFunction): void => {
  const { rating, comment } = req.body;
  const errors: string[] = [];

  if (!rating || !isValidRating(rating)) {
    errors.push('Rating must be an integer between 1 and 5');
  }

  if (comment && comment.trim().length > 500) {
    errors.push('Comment must not exceed 500 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  next();
};
