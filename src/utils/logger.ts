// Simple logging utility for the carwash backend

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  ip?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, userId, ip } = entry;
    
    let logString = `[${timestamp}] ${level}: ${message}`;
    
    if (userId) {
      logString += ` | User: ${userId}`;
    }
    
    if (ip) {
      logString += ` | IP: ${ip}`;
    }
    
    if (data && this.isDevelopment) {
      logString += ` | Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    return logString;
  }

  private log(level: LogLevel, message: string, data?: any, userId?: string, ip?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId,
      ip
    };

    const logString = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(logString);
        }
        break;
    }
  }

  error(message: string, data?: any, userId?: string, ip?: string): void {
    this.log(LogLevel.ERROR, message, data, userId, ip);
  }

  warn(message: string, data?: any, userId?: string, ip?: string): void {
    this.log(LogLevel.WARN, message, data, userId, ip);
  }

  info(message: string, data?: any, userId?: string, ip?: string): void {
    this.log(LogLevel.INFO, message, data, userId, ip);
  }

  debug(message: string, data?: any, userId?: string, ip?: string): void {
    this.log(LogLevel.DEBUG, message, data, userId, ip);
  }

  // Specific logging methods for common operations
  userAction(action: string, userId: string, data?: any, ip?: string): void {
    this.info(`User Action: ${action}`, data, userId, ip);
  }

  adminAction(action: string, adminId: string, data?: any, ip?: string): void {
    this.warn(`Admin Action: ${action}`, data, adminId, ip);
  }

  apiRequest(method: string, path: string, userId?: string, ip?: string): void {
    this.debug(`API Request: ${method} ${path}`, undefined, userId, ip);
  }

  apiResponse(method: string, path: string, statusCode: number, userId?: string, ip?: string): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, `API Response: ${method} ${path} - ${statusCode}`, undefined, userId, ip);
  }

  databaseQuery(query: string, duration?: number, userId?: string): void {
    this.debug(`Database Query: ${query}${duration ? ` (${duration}ms)` : ''}`, undefined, userId);
  }

  authEvent(event: string, userId?: string, ip?: string, success: boolean = true): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `Auth Event: ${event}`, { success }, userId, ip);
  }

  businessLogic(operation: string, data?: any, userId?: string): void {
    this.info(`Business Logic: ${operation}`, data, userId);
  }

  systemEvent(event: string, data?: any): void {
    this.info(`System Event: ${event}`, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export middleware for Express
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const userId = req.user?.userId;
  const ip = req.ip || req.connection.remoteAddress;

  logger.apiRequest(req.method, req.path, userId, ip);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - start;
    logger.apiResponse(req.method, req.path, res.statusCode, userId, ip);
    logger.debug(`Request completed in ${duration}ms`);
    originalEnd.call(this, chunk, encoding);
  };

  next();
};
