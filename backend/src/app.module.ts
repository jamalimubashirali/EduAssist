import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from 'common/guards/access-token.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService , {
    provide : APP_GUARD,
    useClass : AccessTokenGuard
  }],
})
export class AppModule {}
