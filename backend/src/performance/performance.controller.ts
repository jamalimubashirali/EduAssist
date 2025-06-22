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
}
