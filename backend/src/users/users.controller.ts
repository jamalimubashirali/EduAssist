import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  HttpStatus,
  HttpCode,
  Patch,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { User } from './schema/user.schema';
import { UpdateOnboardingDto, UpdateProfileBasicsDto } from './dto/update.onboarding.dto'

import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.createUser(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Req() req: Request): Promise<User | null> {
    const userId = req.user!['sub']; // JWT payload uses 'sub' for userId
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException("User Not Found");
    }
    return user;
  }

  // Get user preferences
  @Get('/preferences')
  @HttpCode(HttpStatus.OK)
  async getUserPreferences(@Req() req: Request) {
    const userId = req.user!['sub'];
    return this.userService.getUserPreferences(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: string): Promise<User> {
    return await this.userService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return await this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }

  // Onboarding endpoints
  @Patch(':id/onboarding')
  @HttpCode(HttpStatus.OK)
  async updateOnboarding(
    @Req() req: Request,
    @Body() body: UpdateOnboardingDto
  ) {
    const userId = req.user!['sub'];
    return this.userService.updateOnboarding(userId, body)
  }

  @Patch(':id/profile-basics')
  @HttpCode(HttpStatus.OK)
  async updateProfileBasics(
    @Param('id') id: string,
    @Body() body: UpdateProfileBasicsDto
  ) {
    return this.userService.updateProfileBasics(id, body)
  }

  // Assessment submission endpoint
  @Post('assessments/submit')
  @HttpCode(HttpStatus.OK)
  async submitAssessment(
    @Body() body: {
      user_id: string;
      answers: Array<{
        question_id: string;
        user_answer: string;
        time_taken: number;
      }>;
      started_at: string;
      completed_at: string;
    }
  ) {
    return this.userService.submitAssessment(body)
  }

  // Get onboarding progress
  @Get(':id/onboarding-progress')
  @HttpCode(HttpStatus.OK)
  async getOnboardingProgress(@Param('id') id: string) {
    return this.userService.getOnboardingProgress(id)
  }

  // Save onboarding progress
  @Post(':id/save-onboarding-progress')
  @HttpCode(HttpStatus.OK)
  async saveOnboardingProgress(
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.userService.saveOnboardingProgress(id, body)
  }

  // Complete onboarding
  @Post(':id/complete-onboarding')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.userService.completeOnboarding(id, body)
  }

  // Gamification endpoints
  @Get(':id/stats')
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('id') id: string) {
    return this.userService.getUserStats(id);
  }

  @Get(':id/quests')
  @HttpCode(HttpStatus.OK)
  async getUserQuests(@Param('id') id: string) {
    return this.userService.getUserQuests(id);
  }

  @Post(':id/quests/:questId/complete')
  @HttpCode(HttpStatus.OK)
  async completeQuest(
    @Param('id') id: string,
    @Param('questId') questId: string
  ) {
    return this.userService.completeQuest(id, questId);
  }

  @Get(':id/badges')
  @HttpCode(HttpStatus.OK)
  async getUserBadges(@Param('id') id: string) {
    return this.userService.getUserBadges(id);
  }

  @Post(':id/badges/:badgeId/unlock')
  @HttpCode(HttpStatus.OK)
  async unlockBadge(
    @Param('id') id: string,
    @Param('badgeId') badgeId: string
  ) {
    return this.userService.unlockBadge(id, badgeId);
  }

  @Patch(':id/streak')
  @HttpCode(HttpStatus.OK)
  async updateStreak(@Param('id') id: string) {
    return this.userService.updateStreak(id);
  }

  @Get(':id/achievements')
  @HttpCode(HttpStatus.OK)
  async getUserAchievements(@Param('id') id: string) {
    return this.userService.getUserAchievements(id);
  }

  @Get(':id/leaderboard-position')
  @HttpCode(HttpStatus.OK)
  async getUserLeaderboardPosition(@Param('id') id: string) {
    return this.userService.getUserLeaderboardPosition(id);
  }
}
