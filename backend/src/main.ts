import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Starting EduAssist Backend...');
    
    const app = await NestFactory.create(AppModule, {
      bodyParser: true,
    });
    
    // Configure request timeout for long-running operations like assessment generation
    app.use((req, res, next) => {
      // Increase timeout for assessment generation endpoints
      if (req.url.includes('/assessments/generate') || req.url.includes('/generate-assessment')) {
        req.setTimeout(60000); // 60 seconds for assessment generation
        res.setTimeout(60000);
      } else {
        req.setTimeout(30000); // 30 seconds for other endpoints
        res.setTimeout(30000);
      }
      next();
    });

    // CORS configuration
    app.enableCors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001'  // Additional port for Next.js dev server
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });app.use(cookieParser());
    app.setGlobalPrefix('api/v1');

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Enhanced validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
      })
    );

    const port = process.env.PORT || 5000;
    await app.listen(port);
    
    logger.log(`🚀 EduAssist Backend running on port ${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
    logger.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    
    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      logger.warn('🛑 SIGTERM signal received: closing HTTP server');
      app.close();
    });

    process.on('SIGINT', () => {
      logger.warn('🛑 SIGINT signal received: closing HTTP server');
      app.close();
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
