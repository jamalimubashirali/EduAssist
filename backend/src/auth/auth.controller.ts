import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/LoginDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

//   @Post('register')
//   register(@Body() dto: RegisterDto) {
//     return this.authService.register(dto);
//   }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }
}
