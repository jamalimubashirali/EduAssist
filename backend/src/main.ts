import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

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
  
  console.log(`🚀 EduAssist Backend running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
