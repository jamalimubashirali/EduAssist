import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from 'common/guards/access-token.guard';
import { QuizzesModule } from './quizzes/quizzes.module';
import { QuestionsModule } from './questions/questions.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';
import { AttemptsModule } from './attempts/attempts.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { PerformanceModule } from './performance/performance.module';
import { CookieLoggerMiddleware } from '../common/middleware/cookie-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!, {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('✅ Database connected successfully');
        });
        connection.on('error', (error) => {
          console.error('❌ Database connection error:', error);
        });
        return connection;
      },
    }),
    AuthModule,
    UsersModule,
    QuizzesModule,
    QuestionsModule,
    SubjectsModule,
    TopicsModule,
    AttemptsModule,
    RecommendationsModule,
    PerformanceModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: AccessTokenGuard,
  }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieLoggerMiddleware).forRoutes('*');
  }
}
