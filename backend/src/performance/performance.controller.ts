import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { Request } from 'express';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post('update')
  @HttpCode(HttpStatus.OK)
  async updatePerformance(
    @Body() updateData: {
      topicId: string;
      subjectId: string;
      attemptData: any;
    },
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }

    return this.performanceService.updatePerformance(
      userId,
      updateData.topicId,
      updateData.subjectId,
      updateData.attemptData
    );
  }

  @Get('user/:topicId')
  @HttpCode(HttpStatus.OK)
  async getUserPerformance(
    @Param('topicId') topicId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }

    return this.performanceService.getUserPerformance(userId, topicId);
  }

  @Get('my-performance')
  @HttpCode(HttpStatus.OK)
  async getMyPerformances(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }

    return this.performanceService.getUserTopicPerformances(userId);
  }

  @Get('analytics/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserAnalytics(@Param('userId') userId: string) {
    return this.performanceService.getUserTopicPerformances(userId);
  }

  // Gamification analytics endpoints
  @Get('user/:userId/gamification-stats')
  @HttpCode(HttpStatus.OK)
  async getUserGamificationStats(@Param('userId') userId: string) {
    return this.performanceService.getUserGamificationStats(userId);
  }

  @Get('user/:userId/subject-mastery')
  @HttpCode(HttpStatus.OK)
  async getSubjectMastery(@Param('userId') userId: string) {
    return this.performanceService.getSubjectMastery(userId);
  }

  @Get('user/:userId/learning-trends')
  @HttpCode(HttpStatus.OK)
  async getLearningTrends(@Param('userId') userId: string) {
    return this.performanceService.getLearningTrends(userId);
  }

  @Get('user/:userId/goal-progress')
  @HttpCode(HttpStatus.OK)
  async getUserGoalProgress(@Param('userId') userId: string) {
    return this.performanceService.getUserGoalProgress(userId);
  }

  @Get('my-goal-progress')
  @HttpCode(HttpStatus.OK)
  async getMyGoalProgress(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }

    return this.performanceService.getUserGoalProgress(userId);
  }
}
