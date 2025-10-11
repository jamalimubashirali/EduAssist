import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { CreateUserDto } from 'src/users/dto/create.user.dto';
import { Request, Response } from 'express';
import { RefreshTokenGuard } from 'common/guards/refresh-token.guard';
import { Public } from 'common/decorators/public_endpoint.decorators';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string; user: any }> {
    this.logger.log(
      `👤 Registration attempt for email: ${createUserDto.email}`,
    );
    try {
      const { tokens, message, user } =
        await this.authService.register(createUserDto);
      this.logger.log(
        `✅ Registration successful for email: ${createUserDto.email}`,
      );

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 15, // 15 minutes
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      return {
        message,
        user,
      };
    } catch (error) {
      this.logger.error(
        `❌ Registration failed for email: ${createUserDto.email} - ${error.message}`,
      );
      throw error;
    }
  }
  @Public()
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ): Promise<{ message: string; user: any }> {
    this.logger.log(`🔐 Login attempt for email: ${loginDto.email}`);
    try {
      const { tokens, message, user } = await this.authService.login(loginDto);

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 15, // 15 minutes
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      this.logger.log(
        `✅ Login successful for user: ${user.email} (ID: ${user.id})`,
      );
      return { message, user };
    } catch (error) {
      this.logger.error(
        `❌ Login failed for email: ${loginDto.email} - ${error.message}`,
      );
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedException('No user found to logout');
    }

    this.logger.log(`🚪 Logout attempt for user ID: ${userId}`);
    try {
      await this.authService.logout(userId);

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      this.logger.log(`✅ Logout successful for user ID: ${userId}`);
      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error(
        `❌ Logout failed for user ID: ${userId} - ${error.message}`,
      );
      throw error;
    }
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; tokens?: any }> {
    this.logger.log(`🔄 Token refresh attempt`);
    try {
      const refreshToken = req.user!['refreshToken'];
      this.logger.log(`🔍 Refresh token found: ${refreshToken ? 'Yes' : 'No'}`);

      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 1000 * 60 * 15, // 15 minutes
        path: '/', // Ensure cookie is available for all paths
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        path: '/', // Ensure cookie is available for all paths
      });

      this.logger.log(`✅ Token refresh successful`);
      return {
        message: 'Tokens refreshed successfully',
        tokens: process.env.NODE_ENV === 'development' ? tokens : undefined,
      };
    } catch (error) {
      this.logger.error(`❌ Token refresh failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async checkAuthStatus(
    @Req() req: Request,
  ): Promise<{ isAuthenticated: boolean; user?: any; needsRefresh?: boolean }> {
    this.logger.log(`🔍 Auth status check`);

    try {
      const accessToken = req.cookies?.access_token;
      const refreshToken = req.cookies?.refresh_token;

      // If no tokens at all, user is not authenticated
      if (!accessToken && !refreshToken) {
        this.logger.log(`❌ No tokens found - not authenticated`);
        return { isAuthenticated: false };
      }

      // Try to verify access token first
      if (accessToken) {
        try {
          const payload = this.authService.verifyToken(accessToken, 'access');
          const user = await this.authService.getUserById(payload.sub);
          this.logger.log(`✅ Valid access token - authenticated`);
          return {
            isAuthenticated: true,
            user: {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              preferences: user.preferences || [],
              totalQuizzesAttempted: user.totalQuizzesAttempted || 0,
              averageScore: user.averageScore || 0,
              streakCount: user.streakCount || 0,
              level: user.level || 1,
              xp_points: user.xp_points || 0,
              leaderboardScore: user.leaderboardScore || 0,
              onboarding: user.onboarding || {
                status: 'NOT_STARTED',
                step: 'WELCOME',
              },
            },
          };
        } catch (error) {
          this.logger.log(`⚠️ Access token invalid, checking refresh token`);
        }
      }

      // If access token is invalid/missing, check refresh token
      if (refreshToken) {
        try {
          const payload = this.authService.verifyToken(refreshToken, 'refresh');
          const user =
            await this.authService.getUserByRefreshToken(refreshToken);

          if (user) {
            this.logger.log(
              `✅ Valid refresh token - needs access token refresh`,
            );
            return {
              isAuthenticated: true,
              needsRefresh: true,
              user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                preferences: user.preferences || [],
                totalQuizzesAttempted: user.totalQuizzesAttempted || 0,
                averageScore: user.averageScore || 0,
                streakCount: user.streakCount || 0,
                level: user.level || 1,
                xp_points: user.xp_points || 0,
                leaderboardScore: user.leaderboardScore || 0,
                onboarding: user.onboarding || {
                  status: 'NOT_STARTED',
                  step: 'WELCOME',
                },
              },
            };
          }
        } catch (error) {
          this.logger.log(`❌ Refresh token invalid`);
        }
      }

      this.logger.log(`❌ All tokens invalid - not authenticated`);
      return { isAuthenticated: false };
    } catch (error) {
      this.logger.error(`❌ Auth status check failed: ${error.message}`);
      return { isAuthenticated: false };
    }
  }
}
