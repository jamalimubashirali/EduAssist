import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Store references for use in closures
    const logger = this.logger;
    const middlewareInstance = this;

    // Log incoming request
    logger.log(
      `🔵 INCOMING REQUEST: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent.substring(0, 50)}...`,
    );

    // Log request body for POST, PUT, PATCH requests (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      const sanitizedBody = middlewareInstance.sanitizeRequestBody(req.body);
      logger.debug(`📝 Request Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
    }

    // Override the response end method to log response
    const originalEnd = res.end;
    const originalSend = res.send;

    let responseBody: any;

    // Capture response body
    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.end = function (chunk?: any) {
      const duration = Date.now() - startTime;
      const { statusCode, statusMessage } = res;
      // Determine log level based on status code (304 Not Modified is normal)
      const logLevel = statusCode >= 400 ? 'error' :
        (statusCode >= 300 && statusCode !== 304) ? 'warn' : 'log';

      // Create status emoji
      const statusEmoji = statusCode >= 500 ? '🔴' :
        statusCode >= 400 ? '🟠' :
          statusCode >= 300 ? '🟡' : '🟢';      // Log response
      const statusMsg = statusMessage || (statusCode === 304 ? 'Not Modified' : '');
      const logMessage = `${statusEmoji} RESPONSE: ${method} ${originalUrl} - Status: ${statusCode} ${statusMsg} - Duration: ${duration}ms`;

      if (logLevel === 'error') {
        logger.error(logMessage);
      } else if (logLevel === 'warn') {
        logger.warn(logMessage);
      } else {
        logger.log(logMessage);
      }

      // Log response body for errors or debug mode
      if (statusCode >= 400 || process.env.LOG_LEVEL === 'debug') {
        try {
          const sanitizedResponse = middlewareInstance.sanitizeResponseBody(responseBody);
          logger.debug(`📤 Response Body: ${JSON.stringify(sanitizedResponse, null, 2)}`);
        } catch (error) {
          logger.debug(`📤 Response Body: ${responseBody}`);
        }
      }

      // Log performance warning for slow requests
      if (duration > 1000) {
        logger.warn(`⚠️ SLOW REQUEST: ${method} ${originalUrl} took ${duration}ms`);
      }

      return originalEnd.call(this, chunk);
    };

    next();
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'hashedRefreshToken', 'refreshToken', 'access_token', 'refresh_token'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private sanitizeResponseBody(body: any): any {
    if (!body) return body;

    try {
      const parsed = typeof body === 'string' ? JSON.parse(body) : body;

      if (typeof parsed !== 'object') return parsed;

      const sanitized = { ...parsed };
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
    } catch (error) {
      return body;
    }
  }
}
