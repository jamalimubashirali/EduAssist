import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessTokenStrategy, RefreshTokenStrategy } from 'common/strategies';
import { AccessTokenGuard } from 'common/guards/access-token.guard';
import { RefreshTokenGuard } from 'common/guards/refresh-token.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy , AccessTokenGuard , RefreshTokenGuard],
  controllers: [AuthController],
})
export class AuthModule {}
