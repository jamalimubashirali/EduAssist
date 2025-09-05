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
import { User, OnboardingStatus } from 'src/users/schema/user.schema';
import { TokenData, Tokens } from '../../common/types';
import { LoginDto } from './dto/LoginDto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async register(createUserDto: CreateUserDto): Promise<{ message: string; user: any , tokens : Tokens }> {
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
    const newTokens: Tokens = await this.generateNewTokens({
      userId: newUser._id.toString(),
      email: newUser.email
    });
    
    await this.usersService.updateRefreshToken(newUser._id.toString(), newTokens.refresh_token);
    return {
      message: 'User Created Successfully',
      tokens : newTokens,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        preferences: newUser.preferences || [],
        totalQuizzesAttempted: newUser.totalQuizzesAttempted || 0,
        averageScore: newUser.averageScore || 0,
        streakCount: newUser.streakCount || 0,
        level: newUser.level || 1,
        xp_points: newUser.xp_points || 0,
        leaderboardScore: newUser.leaderboardScore || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }
    };
  }

  private async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid Email');
    const isMatch = await bcrypt.compare(pass , user?.password);
    if (!isMatch) throw new UnauthorizedException('Invalid Password');
    return user;
  }
  async login(loginDto: LoginDto): Promise<{
    tokens: Tokens;
    message: string;
    user: any;
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (user.onboarding && user.onboarding.status === OnboardingStatus.IN_PROGRESS) {
      const payload = {
        sub: user._id.toString(),
        username: user.name,
        onboardingStep: user.onboarding.step,
      };
      const tokens = await this.generateNewTokens({ userId: user._id.toString(), email: user.email });
      await this.usersService.updateRefreshToken(user._id.toString(), tokens.refresh_token);
      
      return {
        tokens,
        message: 'Onboarding in progress. Please resume.',
        user: this.getOnboardingDataForStep(user, user.onboarding.step),
      };
    }

    const newTokens: Tokens = await this.generateNewTokens({
      userId: user._id.toString(),
      email: user.email
    });
    
    await this.usersService.updateRefreshToken(user._id.toString(), newTokens.refresh_token);
    
    return {
      tokens: newTokens,
      message: "Login Successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        onboarding: user.onboarding,
        preferences: user.preferences || [],
        totalQuizzesAttempted: user.totalQuizzesAttempted || 0,
        averageScore: user.averageScore || 0,
        streakCount: user.streakCount || 0,
        level: user.level || 1,
        xp_points: user.xp_points || 0,
        leaderboardScore: user.leaderboardScore || 0,
        isActive: true,
        createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    // To "logout", we clear the stored refresh token.
    await this.usersService.updateRefreshToken(userId, "");
    return { message: 'Logged out successfully' };
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

  private getOnboardingDataForStep(user: User, step: string) {
    const essentialData: any = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      onboarding: {
        status: user.onboarding.status,
        step: user.onboarding.step,
      },
    };

    if (step === 'subjects') {
      essentialData.onboarding.profile = user.onboarding.profile;
    } else if (step === 'goals') {
      essentialData.onboarding.profile = user.onboarding.profile;
      essentialData.onboarding.subjects = user.onboarding.subjects;
    }
    // Add more steps as needed

    return essentialData;
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findByRefreshToken(refreshToken);

    if(!user){
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    const tokens = await this.generateNewTokens({
      userId: user!._id.toString(),
      email: user!.email,
    });

    await this.usersService.updateRefreshToken(user!._id.toString(), tokens.refresh_token);

    return tokens;
  }

  verifyToken(token: string, type: 'access' | 'refresh'): any {
    const secret = type === 'access' 
      ? process.env.JWT_ACCESS_TOKEN_SECRET 
      : process.env.JWT_REFRESH_TOKEN_SECRET;
    
    return this.jwtService.verify(token, { secret });
  }

  async getUserById(userId: string): Promise<any> {
    return await this.usersService.findById(userId);
  }

  async getUserByRefreshToken(refreshToken: string): Promise<any> {
    return await this.usersService.findByRefreshToken(refreshToken);
  }
}

