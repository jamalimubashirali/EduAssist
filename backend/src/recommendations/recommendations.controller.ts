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

  @Get('study-plan/:userId')
  @HttpCode(HttpStatus.OK)
  async getStudyPlan(@Param('userId') userId: string) {
    // For now, return null as study plans are not implemented yet
    // This prevents 404 errors and allows frontend to handle gracefully
    return null;
  }

  @Post('study-plan/:userId')
  @HttpCode(HttpStatus.CREATED)
  async createStudyPlan(@Param('userId') userId: string, @Body() preferences: any) {
    // For now, return a mock study plan structure
    // This prevents 404 errors and allows frontend to handle gracefully
    return {
      id: `study-plan-${userId}`,
      userId,
      title: 'Personalized Study Plan',
      description: 'AI-generated study plan based on your preferences',
      status: 'active',
      createdAt: new Date().toISOString(),
      ...preferences
    };
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '10'
  ) {
    try {
      const limitNumber = parseInt(limit, 10) || 10;
      console.log(`🎯 [REC-CONTROLLER] Getting enhanced recommendations for user: ${userId}, limit: ${limitNumber}`);

      // Get smart recommendations from the recommendation service
      const smartRecommendations = await this.recommendationsService.getSmartRecommendations(userId);
      
      if (!smartRecommendations || smartRecommendations.length === 0) {
        console.log(`⚠️ [REC-CONTROLLER] No smart recommendations found for user ${userId}`);
        return {
          recommendations: []
        };
      }

      // Transform recommendations to match the expected format for enhanced recommendations
      const enhancedRecommendations = smartRecommendations.slice(0, limitNumber).map(rec => ({
        title: rec.title || `Practice ${rec.topicId?.topicName || 'Quiz'}`,
        reason: rec.recommendationReason || rec.description || 'Recommended based on your performance',
        difficulty: this.mapDifficultyToBackend(rec.suggestedDifficulty || 'Medium'),
        priority: rec.priority || 50,
        factors: this.extractFactorsFromRecommendation(rec),
        goalContext: {
          targetScore: 80, // Default target score
          currentProgress: Math.max(0, Math.min(100, rec.priority || 50)),
          scoreGap: Math.max(0, 80 - (rec.priority || 50)),
          isWeakArea: (rec.priority || 50) < 60,
          hasRecentlyImproved: (rec.urgency || 30) > 60,
          weakAreasCount: rec.metadata?.weaknessScore ? Math.floor(rec.metadata.weaknessScore / 20) : 2,
          strongAreasCount: rec.metadata?.improvementPotential ? Math.floor((100 - rec.metadata.improvementPotential) / 25) : 3
        }
      }));

      console.log(`✅ [REC-CONTROLLER] Returning ${enhancedRecommendations.length} enhanced recommendations`);
      return {
        recommendations: enhancedRecommendations
      };
    } catch (error) {
      console.error('❌ [REC-CONTROLLER] Error getting enhanced recommendations:', error);
      return {
        recommendations: []
      };
    }
  }

  /**
   * Map frontend difficulty to backend format
   */
  private mapDifficultyToBackend(difficulty: string): 'EASY' | 'MEDIUM' | 'HARD' {
    const mapping = {
      'Easy': 'EASY',
      'Medium': 'MEDIUM',
      'Hard': 'HARD',
      'beginner': 'EASY',
      'intermediate': 'MEDIUM',
      'advanced': 'HARD'
    };
    return (mapping[difficulty] as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM';
  }

  /**
   * Extract factors from recommendation metadata
   */
  private extractFactorsFromRecommendation(rec: any): string[] {
    const factors: string[] = [];
    
    if (rec.priority >= 70) factors.push('high_priority');
    if (rec.urgency >= 70) factors.push('urgent');
    if (rec.metadata?.weaknessScore >= 60) factors.push('weak_area');
    if (rec.metadata?.improvementPotential >= 70) factors.push('improvement_potential');
    if (rec.estimatedCompletionTime <= 15) factors.push('quick_win');
    if (rec.confidence >= 0.8) factors.push('high_confidence');
    
    // Add default factors if none found
    if (factors.length === 0) {
      factors.push('personalized', 'performance_based');
    }
    
    return factors;
  }

  @Get('quizzes/:userId')
  @HttpCode(HttpStatus.OK)
  async getQuizRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '5'
  ) {
    try {
      const limitNumber = parseInt(limit, 10) || 5;
      console.log(`🎯 [REC-CONTROLLER] Getting quiz recommendations for user: ${userId}, limit: ${limitNumber}`);

      // Get smart recommendations from the recommendation service
      const smartRecommendations = await this.recommendationsService.getSmartRecommendations(userId);
      
      if (!smartRecommendations || smartRecommendations.length === 0) {
        console.log(`⚠️ [REC-CONTROLLER] No smart recommendations found for user ${userId}`);
        return [];
      }

      // Transform recommendations into quiz-focused format
      const quizRecommendations = smartRecommendations.slice(0, limitNumber).map(rec => ({
        id: rec._id || rec.id,
        title: rec.title || `Practice ${rec.topicId?.topicName || 'Quiz'}`,
        description: rec.description || rec.recommendationReason,
        difficulty: rec.suggestedDifficulty || 'Medium',
        priority: rec.priority || 50,
        urgency: rec.urgency || 50,
        estimatedTime: rec.estimatedCompletionTime || 20,
        topicId: rec.topicId?._id || rec.topicId,
        topicName: rec.topicId?.topicName || 'Unknown Topic',
        subjectId: rec.subjectId?._id || rec.subjectId,
        subjectName: rec.subjectId?.subjectName || 'Unknown Subject',
        recommendationReason: rec.recommendationReason,
        recommendedQuizzes: rec.recommendedQuizzes || [],
        metadata: {
          source: 'smart_recommendations',
          generatedBy: rec.metadata?.generatedBy || 'ai_system',
          confidence: rec.metadata?.confidence || 0.8,
          weaknessScore: rec.metadata?.weaknessScore || 0,
          improvementPotential: rec.metadata?.improvementPotential || 0
        }
      }));

      console.log(`✅ [REC-CONTROLLER] Returning ${quizRecommendations.length} quiz recommendations`);
      return quizRecommendations;
    } catch (error) {
      console.error('❌ [REC-CONTROLLER] Error getting quiz recommendations:', error);
      return [];
    }
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
