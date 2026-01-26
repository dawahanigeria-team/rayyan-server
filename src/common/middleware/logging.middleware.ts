import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Override res.end to log response details
    const originalEnd = res.end.bind(res);
    res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      
      // Log response details
      const logger = new Logger(LoggingMiddleware.name);
      logger.log(
        `${method} ${originalUrl} - ${statusCode} - ${responseTime}ms`,
      );

      // Call original end method with proper return
      return originalEnd(chunk, encoding, cb);
    };

    next();
  }
}