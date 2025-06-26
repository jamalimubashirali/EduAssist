import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, Query, BadRequestException } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';
import { Request } from 'express';
import { RecommendationStatus } from 'common/enums';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRecommendationDto: CreateRecommendationDto) {
    return this.recommendationsService.create(createRecommendationDto);
  }

  @Post('generate-from-attempt')
  @HttpCode(HttpStatus.CREATED)
  async generateFromAttempt(@Body() generateDto: GenerateRecommendationDto) {
    return this.recommendationsService.generateRecommendationFromAttempt(
      generateDto.userId,
      generateDto.attemptId,
      generateDto.subjectId,
      generateDto.topicId,
      generateDto.attemptScore,
      generateDto.averageScore
    );
  }

  @Post('auto-generate/:attemptId')
  @HttpCode(HttpStatus.CREATED)
  async autoGenerateRecommendation(@Param('attemptId') attemptId: string) {
    return this.recommendationsService.autoGenerateRecommendation(attemptId);
  }

  @Get('all-recommendations')
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.recommendationsService.findAll();
  }

  @Get('my-recommendations')
  @HttpCode(HttpStatus.OK)
  async getMyRecommendations(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    return this.recommendationsService.findByUser(userId);
  }

  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async getPendingRecommendations(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    return this.recommendationsService.findPendingRecommendations(userId);
  }

  @Get('by-status')
  @HttpCode(HttpStatus.OK)
  async getByStatus(
    @Query('status') status: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    if (!Object.values(RecommendationStatus).includes(status as RecommendationStatus)) {
      throw new BadRequestException('Invalid status provided');
    }

    return this.recommendationsService.findByUserAndStatus(userId, status);
  }

  @Get('subject/:subjectId')
  @HttpCode(HttpStatus.OK)
  async getBySubject(@Param('subjectId') subjectId: string) {
    return this.recommendationsService.findBySubject(subjectId);
  }

  @Get('topic/:topicId')
  @HttpCode(HttpStatus.OK)
  async getByTopic(@Param('topicId') topicId: string) {
    return this.recommendationsService.findByTopic(topicId);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getMyStats(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    return this.recommendationsService.getRecommendationStats(userId);
  }

  @Get('analytics/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserAnalytics(@Param('userId') userId: string) {
    return this.recommendationsService.getUserRecommendationAnalytics(userId);
  }

  @Get('smart-recommendations')
  @HttpCode(HttpStatus.OK)
  async getSmartRecommendations(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new BadRequestException('User authentication required');
    }
    return this.recommendationsService.getSmartRecommendations(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.recommendationsService.findById(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.recommendationsService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateRecommendationDto: UpdateRecommendationDto) {
    return this.recommendationsService.update(id, updateRecommendationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.recommendationsService.remove(id);
  }

  @Delete('attempt/:attemptId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByAttempt(@Param('attemptId') attemptId: string) {
    await this.recommendationsService.removeByAttempt(attemptId);
  }

  @Post('batch-update-status')
  @HttpCode(HttpStatus.OK)
  async batchUpdateStatus(
    @Body() batchUpdate: { recommendationIds: string[]; status: string }
  ) {
    return this.recommendationsService.batchUpdateStatus(batchUpdate.recommendationIds, batchUpdate.status);
  }

  @Post('mark-completed/:id')
  @HttpCode(HttpStatus.OK)
  async markCompleted(@Param('id') id: string) {
    return this.recommendationsService.markAsCompleted(id);
  }
}
