import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create.user.dto';
import { User } from 'src/users/schema/user.schema';
import { TokenData, Tokens } from '../../common/types';
import { LoginDto } from './dto/LoginDto';
import * as bcrypt from 'bcrypt';

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

  private async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(pass , user?.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(loginDto : LoginDto): Promise<{
    tokens: Tokens;
    message: string;
  }> {
    const user = await this.validateUser(loginDto.email , loginDto.password);
    const newTokens : Tokens = await this.generateNewTokens({userId : user._id.toString() , email : user.email});
    user.token = newTokens.refresh_token;
    await this.usersService.updateUser(user._id.toString() , {
      token : newTokens.refresh_token
    });
    return {
      tokens : newTokens,
      message : "Login Successful"
    }
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

  async logout(_id: string): Promise<Boolean> {
    const user = await this.usersService.findById(_id);
    if(!user) {
      throw new NotFoundException("User NOt Found");
    }
    await this.usersService.updateUser(user._id.toString() , {
      token : ""
    });
    return true;
  }


  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findById(userId);
    
    // Verify refresh token matches stored token
    if (!user.token || user.token !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateNewTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    // Update refresh token in database
    await this.usersService.updateUser(user._id.toString(), {
      token: tokens.refresh_token,
    });

    return tokens;
  }
}

