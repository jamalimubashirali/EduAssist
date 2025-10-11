import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Request } from 'express';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAttemptDto: CreateAttemptDto) {
    return this.attemptsService.create(createAttemptDto);
  }

  @Post('start-quiz')
  @HttpCode(HttpStatus.CREATED)
  async startQuiz(
    @Body()
    startQuizDto: { quizId: string; topicId: string; subjectId?: string },
    @Req() req: Request,
  ) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }

    const createAttemptDto: CreateAttemptDto = {
      userId,
      quizId: startQuizDto.quizId,
      topicId: startQuizDto.topicId,
      subjectId: startQuizDto.subjectId,
    };

    return this.attemptsService.create(createAttemptDto);
  }

  @Post(':id/submit-answer')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('id') attemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.attemptsService.submitAnswer(attemptId, submitAnswerDto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeAttempt(@Param('id') id: string) {
    return this.attemptsService.completeAttempt(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.attemptsService.findAll();
  }

  @Get('my-attempts')
  @HttpCode(HttpStatus.OK)
  async getMyAttempts(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }
    return this.attemptsService.findByUser(userId);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getUserAnalyticsAll(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }
    return this.attemptsService.getUserAttemptAnalytics(userId);
  }

  @Get('analytics/:topicId')
  @HttpCode(HttpStatus.OK)
  async getUserAnalytics(
    @Param('topicId') topicId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }
    return this.attemptsService.getUserAttemptAnalytics(userId, topicId);
  }

  @Get('quiz/:quizId')
  @HttpCode(HttpStatus.OK)
  async findByQuiz(@Param('quizId') quizId: string) {
    return this.attemptsService.findByQuiz(quizId);
  }

  @Get('user/:userId/topic/:topicId')
  @HttpCode(HttpStatus.OK)
  async findByUserAndTopic(
    @Param('userId') userId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.attemptsService.findByUserAndTopic(userId, topicId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.attemptsService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateAttemptDto: UpdateAttemptDto,
  ) {
    return this.attemptsService.update(id, updateAttemptDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.attemptsService.remove(id);
  }

  // Gamification endpoints
  @Get('leaderboard/:limit')
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(@Param('limit') limit: string = '10') {
    return this.attemptsService.getLeaderboard(parseInt(limit));
  }

  @Get('my-leaderboard-position')
  @HttpCode(HttpStatus.OK)
  async getMyLeaderboardPosition(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User authentication required');
    }
    return this.attemptsService.getUserLeaderboardPosition(userId);
  }
}
