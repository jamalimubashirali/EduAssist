import { Controller, Post, Body, Res, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { CreateUserDto } from 'src/users/dto/create.user.dto';
import { Request, Response } from 'express';
import { RefreshTokenGuard } from 'common/guards/refresh-token.guard';
import { Public } from 'common/decorators/public_endpoint.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ): Promise<{ message: string }> {
    const { tokens, message } = await this.authService.login(loginDto);

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

    return { message };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const isLoggedOut = await this.authService.logout(req.user!['sub']);
    if (isLoggedOut) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
    }
    return { message: 'Logout successful' };
  }

  @Public() 
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; tokens?: any }> {
    try {
      const userId = req.user!['sub'];
      const refreshToken = req.user!['refreshToken'];

      console.log('Refresh attempt for user:', userId); // Debug log

      const tokens = await this.authService.refreshTokens(userId, refreshToken);

      // Setting new cookies
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

      return { 
        message: 'Tokens refreshed successfully',
        tokens: process.env.NODE_ENV === 'development' ? tokens : undefined // Only return tokens in dev for debugging
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
}
