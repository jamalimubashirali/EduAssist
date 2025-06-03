import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create.user.dto';
import { User } from 'src/users/schema/user.schema';
import { TokenData, Tokens } from '../../common/types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const presentUser: User | null = await this.usersService.findByEmail(
      createUserDto?.email,
    );
    if (presentUser) {
      throw new ForbiddenException('User already Exists');
    }
    const newUser = await this.usersService.createUser(createUserDto);
    if (!newUser) {
      throw new InternalServerErrorException('Error Creating New User');
    }
    return {
      message: 'User Created Successfully',
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any): Promise<{
    tokens: Tokens;
    message: string;
  }> {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      tokens: {
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      },
      message: 'Login successful',
    };
  }

  private async generateNewTokens(tokenData : TokenData) : Promise<Tokens> {
    const [access_token , refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub : tokenData?.userId,
          email : tokenData?.email
        }, 
        {
          secret : process.env.JWT_ACCESS_TOKEN_SECRET,
          expiresIn : 60 * 15
        },
      ),
      this.jwtService.signAsync(
        {
          sub : tokenData?.userId,
          email : tokenData?.email,
        }, 
        {
          secret : process.env.JWT_REFRESH_TOKEN_SECRET,
          expiresIn : 60 * 60 * 24 * 7
        }
      )
    ]);

    return {
      access_token : access_token,
      refresh_token : refresh_token
    } 
  }
}
