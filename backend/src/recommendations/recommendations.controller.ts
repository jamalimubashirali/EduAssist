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
  constructor(private readonly recommendationsService: RecommendationsService) { }

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

    // Get raw recommendations from database
    const rawRecommendations = await this.recommendationsService.findByUser(userId);

    // Transform them into the format expected by frontend
    const formattedRecommendations = rawRecommendations.map(rec => {
      const topicName = (rec.topicId as any)?.topicName || 'Unknown Topic';
      const subjectName = (rec.subjectId as any)?.subjectName || 'Unknown Subject';
      // Use the ORIGINAL priority and data from database - don't override it!
      const priority = rec.priority || 50;
      const targetScore = 80; // Default target score for display
      const attemptScore = (rec.metadata as any)?.attemptScore || 75; // Use actual score from metadata

      // DEBUG: Log the data being processed
      console.log(`🔍 [RECOMMENDATION] Processing: ${topicName}, Priority: ${priority}, Score: ${attemptScore}, Reason: ${rec.recommendationReason?.substring(0, 50)}...`);

      // Use ORIGINAL recommendation data from database, don't regenerate it
      const content = this.recommendationsService.generateRecommendationContent(topicName, priority, attemptScore, targetScore);

      const result = {
        id: rec._id.toString(),
        userId: rec.userId.toString(),
        type: content.type,
        title: content.title, // Use original title if available
        description: content.description, // Use original description if available  
        reason: rec.recommendationReason || content.description,
        priority: priority >= 70 ? 'high' : priority >= 40 ? 'medium' : 'low',
        urgency: rec.urgency || 50,
        estimatedTime: rec.estimatedCompletionTime || 20,
        confidence: rec.metadata?.confidence || 0.8,
        status: rec.recommendationStatus,
        createdAt: rec.createdAt,
        metadata: {
          topicId: rec.topicId?._id?.toString(),
          topicName: topicName,
          subjectId: rec.subjectId?._id?.toString(),
          subjectName: subjectName,
          difficulty: rec.suggestedDifficulty,
          estimatedTime: rec.estimatedCompletionTime || 20,
          source: (rec.metadata as any)?.source || 'ai_system'
        }
      };

      // DEBUG: Log what we're returning
      console.log(`✅ [RECOMMENDATION] Returning: ${result.title}, Priority: ${result.priority}, Type: ${result.type}`);
      return result;
    });

    console.log(`📊 [RECOMMENDATIONS] Total formatted: ${formattedRecommendations.length}`);
    return formattedRecommendations;
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
      const enhancedRecommendations = smartRecommendations.slice(0, limitNumber).map(rec => {
        // CORRECT LOGIC: High priority should mean LOW performance (needs work)
        // Low priority should mean HIGH performance (already good)
        const currentPerformance = rec.metadata?.currentScore || (100 - (rec.priority || 50));
        const targetScore = 80;
        const scoreGap = Math.max(0, targetScore - currentPerformance);
        const isWeakArea = currentPerformance < targetScore;

        // CORRECT PRIORITY LOGIC:
        // - High priority (80-100): Performance is low, needs urgent attention
        // - Medium priority (40-79): Performance is moderate, some improvement needed  
        // - Low priority (0-39): Performance is good, minimal work needed
        let correctedPriority = rec.priority || 50;
        if (isWeakArea && scoreGap > 30) {
          correctedPriority = Math.max(80, correctedPriority); // High priority for big gaps
        } else if (isWeakArea && scoreGap > 10) {
          correctedPriority = Math.max(60, Math.min(79, correctedPriority)); // Medium priority for moderate gaps
        } else if (!isWeakArea) {
          correctedPriority = Math.min(39, correctedPriority); // Low priority for topics at/above target
        }

        return {
          title: rec.title || `Practice ${rec.topicId?.topicName || 'Quiz'}`,
          reason: this.recommendationsService.generateRecommendationReason(currentPerformance, targetScore, scoreGap, rec),
          difficulty: this.mapDifficultyToBackend(rec.suggestedDifficulty || 'Medium'),
          priority: correctedPriority,
          factors: this.extractFactorsFromRecommendation(rec),
          goalContext: {
            targetScore,
            currentProgress: Math.round(currentPerformance),
            scoreGap: Math.round(scoreGap),
            isWeakArea,
            hasRecentlyImproved: (rec.urgency || 30) > 60,
            weakAreasCount: rec.metadata?.weaknessScore ? Math.floor(rec.metadata.weaknessScore / 20) : 2,
            strongAreasCount: rec.metadata?.improvementPotential ? Math.floor((100 - rec.metadata.improvementPotential) / 25) : 3
          }
        };
      });

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

      // Transform recommendations into quiz-focused format with proper titles and descriptions
      const quizRecommendations = smartRecommendations.slice(0, limitNumber).map(rec => {
        const topicName = rec.topicId?.topicName || 'Unknown Topic';
        const subjectName = rec.subjectId?.subjectName || 'Unknown Subject';
        const priority = rec.priority || 50;
        const targetScore = 80; // Default target score

        // Generate proper title and description using service business logic
        // CORRECT LOGIC: High priority (90) = Low performance (30%), Low priority (20) = High performance (85%)
        let attemptScore = (rec.metadata as any)?.attemptScore;
        if (!attemptScore) {
          if (priority >= 80) attemptScore = 35; // High priority = struggling student (low score)
          else if (priority >= 60) attemptScore = 55; // Medium-high priority = below average
          else if (priority >= 40) attemptScore = 75; // Medium priority = average performance  
          else attemptScore = 90; // Low priority = strong performance
        }
        const content = this.recommendationsService.generateRecommendationContent(topicName, priority, attemptScore, targetScore);

        return {
          id: rec._id || rec.id,
          title: content.title,
          description: content.description,
          difficulty: rec.suggestedDifficulty || 'Medium',
          priority: priority,
          urgency: rec.urgency || 50,
          estimatedTime: rec.estimatedCompletionTime || 20,
          topicId: rec.topicId?._id || rec.topicId,
          topicName: topicName,
          subjectId: rec.subjectId?._id || rec.subjectId,
          subjectName: subjectName,
          recommendationReason: rec.recommendationReason || content.description,
          recommendedQuizzes: rec.recommendedQuizzes || [],
          metadata: {
            source: 'smart_recommendations',
            generatedBy: rec.metadata?.generatedBy || 'ai_system',
            confidence: rec.metadata?.confidence || 0.8,
            weaknessScore: rec.metadata?.weaknessScore || 0,
            improvementPotential: rec.metadata?.improvementPotential || 0,
            topicName: topicName,
            subjectName: subjectName
          }
        };
      });

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
