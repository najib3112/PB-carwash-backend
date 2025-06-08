import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    // Use IP address as the key, but could be enhanced with user ID
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.userId;
    return userId ? `${ip}:${userId}` : ip;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();

    // Initialize or reset if window has passed
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.options.windowMs
      };
    }

    // Increment request count
    this.store[key].count++;

    // Check if limit exceeded
    if (this.store[key].count > this.options.maxRequests) {
      res.status(429).json({
        error: this.options.message,
        retryAfter: Math.ceil((this.store[key].resetTime - now) / 1000)
      });
      return;
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': this.options.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.options.maxRequests - this.store[key].count).toString(),
      'X-RateLimit-Reset': new Date(this.store[key].resetTime).toISOString()
    });

    next();
  };
}

// Pre-configured rate limiters for different endpoints

// General API rate limiter - 100 requests per 15 minutes
export const generalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Auth rate limiter - 5 login attempts per 15 minutes
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.'
});

// Booking rate limiter - 10 bookings per hour
export const bookingLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many booking attempts, please try again later.'
});

// Admin rate limiter - 200 requests per 15 minutes
export const adminLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  message: 'Too many admin requests, please try again later.'
});

// Create custom rate limiter
export const createRateLimiter = (options: RateLimitOptions) => {
  return new RateLimiter(options);
};
