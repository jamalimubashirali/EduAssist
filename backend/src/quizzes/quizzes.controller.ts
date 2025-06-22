import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, Query, BadRequestException } from '@nestjs/common';
import { QuizzesService, PersonalizedQuizConfig, QuizGenerationResult } from './quizzes.service';
import { Request } from 'express';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  /**
   * Generate personalized quiz using AI algorithm
   */
  @Post('generate-personalized')
  @HttpCode(HttpStatus.CREATED)
  async generatePersonalizedQuiz(
    @Body() config: Omit<PersonalizedQuizConfig, 'userId'>,
    @Req() req: Request
  ): Promise<QuizGenerationResult> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // Validate required fields
      if (!config.topicId || !config.subjectId) {
        throw new BadRequestException('topicId and subjectId are required');
      }

      if (!config.questionsCount || config.questionsCount < 1 || config.questionsCount > 50) {
        throw new BadRequestException('questionsCount must be between 1 and 50');
      }

      const fullConfig: PersonalizedQuizConfig = {
        ...config,
        userId,
        questionsCount: config.questionsCount || 10,
        sessionType: config.sessionType || 'practice',
        timeLimit: config.timeLimit || 30
      };

      const result = await this.quizzesService.generatePersonalizedQuiz(fullConfig);
      
      return result;
    } catch (error) {
      console.error('Error in generatePersonalizedQuiz:', error);
      throw error;
    }
  }

  /**
   * Get optimal quiz parameters for a user and topic
   */
  @Get('optimal-parameters/:topicId')
  @HttpCode(HttpStatus.OK)
  async getOptimalQuizParameters(
    @Param('topicId') topicId: string,
    @Req() req: Request
  ): Promise<{
    recommendedQuestionCount: number;
    recommendedTimeLimit: number;
    recommendedDifficulty: string;
    recommendedSessionType: string;
    userInsights: {
      currentLevel: number;
      masteryScore: number;
      recommendationReason: string;
    };
  }> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // This would typically call a separate method in the service
      // For now, we'll return recommended defaults based on user analysis
      const userAnalysis = await this.quizzesService['analyzeUserPerformance'](userId, topicId);
      
      let recommendedQuestionCount = 10;
      let recommendedTimeLimit = 30;
      let recommendedDifficulty = 'Medium';
      let recommendedSessionType = 'practice';
      let recommendationReason = 'Standard practice session';

      // Adjust recommendations based on user performance
      if (userAnalysis.masteryScore < 40) {
        recommendedQuestionCount = 15;
        recommendedTimeLimit = 45;
        recommendedDifficulty = 'Easy';
        recommendationReason = 'Extended practice recommended to build fundamentals';
      } else if (userAnalysis.masteryScore > 80) {
        recommendedQuestionCount = 8;
        recommendedTimeLimit = 20;
        recommendedDifficulty = 'Hard';
        recommendedSessionType = 'challenge';
        recommendationReason = 'Challenge mode to maintain expertise';
      }

      return {
        recommendedQuestionCount,
        recommendedTimeLimit,
        recommendedDifficulty,
        recommendedSessionType,
        userInsights: {
          currentLevel: userAnalysis.currentLevel,
          masteryScore: userAnalysis.masteryScore,
          recommendationReason
        }
      };
    } catch (error) {
      console.error('Error getting optimal parameters:', error);
      throw new BadRequestException('Failed to get optimal quiz parameters');
    }
  }

  /**
   * Start adaptive learning session
   */
  @Post('adaptive-session')
  @HttpCode(HttpStatus.CREATED)
  async startAdaptiveSession(
    @Body() sessionConfig: {
      topicId: string;
      subjectId: string;
      targetDuration: number; // minutes
      difficultyPreference?: 'adaptive' | 'easy' | 'medium' | 'hard';
    },
    @Req() req: Request
  ): Promise<QuizGenerationResult> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // Calculate question count based on target duration
      const questionsCount = Math.max(5, Math.min(25, Math.floor(sessionConfig.targetDuration / 2)));

      const config: PersonalizedQuizConfig = {
        userId,
        topicId: sessionConfig.topicId,
        subjectId: sessionConfig.subjectId,
        questionsCount,
        sessionType: 'adaptive',
        timeLimit: sessionConfig.targetDuration
      };

      return await this.quizzesService.generatePersonalizedQuiz(config);
    } catch (error) {
      console.error('Error starting adaptive session:', error);
      throw new BadRequestException('Failed to start adaptive session');
    }
  }

  /**
   * Get user's quiz history with analytics
   */
  @Get('history/:topicId')
  @HttpCode(HttpStatus.OK)
  async getQuizHistory(
    @Param('topicId') topicId: string,
    @Query('limit') limit: string = '10',
    @Req() req: Request
  ): Promise<{
    quizzes: any[];
    analytics: {
      totalQuizzes: number;
      averageScore: number;
      improvementTrend: string;
      strongestDifficulty: string;
      weakestDifficulty: string;
    };
  }> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // This would be implemented in the service
      // For now, return a basic structure
      return {
        quizzes: [],
        analytics: {
          totalQuizzes: 0,
          averageScore: 0,
          improvementTrend: 'Steady',
          strongestDifficulty: 'Medium',
          weakestDifficulty: 'Hard'
        }
      };
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw new BadRequestException('Failed to get quiz history');
    }
  }

  // ...rest of existing methods...
}
