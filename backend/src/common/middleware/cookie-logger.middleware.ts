import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CookieLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only log for auth and quiz-related endpoints
    const shouldLog = req.path.includes('/auth/') || 
                     req.path.includes('/quizzes/') || 
                     req.path.includes('/attempts/');

    if (shouldLog && process.env.NODE_ENV === 'development') {
      console.log(`🍪 [${req.method}] ${req.path}`);
      console.log('📋 Cookies:', Object.keys(req.cookies || {}).length > 0 ? req.cookies : 'None');
      
      if (req.headers.authorization) {
        console.log('🔑 Auth Header:', req.headers.authorization.substring(0, 20) + '...');
      }
    }
    
    next();
  }
}