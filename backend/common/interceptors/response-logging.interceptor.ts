import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ResponseInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful responses
          this.logger.log(
            `✅ SUCCESS: ${method} ${url} - ${statusCode} - ${duration}ms`
          );

          // Log response data for debug mode
          if (process.env.LOG_LEVEL === 'debug') {
            this.logger.debug(`Response data: ${JSON.stringify(this.sanitizeResponseData(data), null, 2)}`);
          }

          // Log performance metrics for analytics
          if (duration > 500) {
            this.logger.warn(`⚠️ PERFORMANCE: ${method} ${url} responded in ${duration}ms`);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `❌ ERROR: ${method} ${url} - Error after ${duration}ms: ${error.message}`
          );
        }
      })
    );
  }

  private sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = ['access_token', 'refresh_token', 'password', 'token'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    // Sanitize nested objects
    if (sanitized.tokens) {
      sanitized.tokens = {
        access_token: '***REDACTED***',
        refresh_token: '***REDACTED***'
      };
    }

    return sanitized;
  }
}
