import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/LoginDto';
import { CreateUserDto } from 'src/users/dto/create.user.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto : CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // @Post('login')
  // async login(
  //   @Body() dto: LoginDto,
  // ): Promise<{ access_token: string; refresh_token: string; message: string }> {
  //   const user = await this.authService.validateUser(dto.email, dto.password);
    
  // }
}
