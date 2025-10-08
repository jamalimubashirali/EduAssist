import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recommendation } from './schema/recommendations.schema';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { RecommendationStatus, DifficultyLevel } from 'common/enums';
import { Quiz } from '../quizzes/schema/quizzes.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name) private recommendationModel: Model<Recommendation>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createRecommendationDto: CreateRecommendationDto): Promise<Recommendation | null> {
    try {
      // Validate ObjectId formats
      if (!Types.ObjectId.isValid(createRecommendationDto.userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!Types.ObjectId.isValid(createRecommendationDto.subjectId)) {
        throw new BadRequestException('Invalid subject ID format');
      }
      if (!Types.ObjectId.isValid(createRecommendationDto.topicId)) {
        throw new BadRequestException('Invalid topic ID format');
      }
      if (!Types.ObjectId.isValid(createRecommendationDto.attemptId)) {
        throw new BadRequestException('Invalid attempt ID format');
      }

      const recommendationData = {
        ...createRecommendationDto,
        userId: new Types.ObjectId(createRecommendationDto.userId),
        subjectId: new Types.ObjectId(createRecommendationDto.subjectId),
        topicId: new Types.ObjectId(createRecommendationDto.topicId),
        attemptId: new Types.ObjectId(createRecommendationDto.attemptId),
      };

      const newRecommendation = new this.recommendationModel(recommendationData);
      const savedRecommendation = await newRecommendation.save();

      return await this.recommendationModel
        .findById(savedRecommendation._id)
        .populate('userId', 'name email')
        .populate('subjectId', 'subjectName')
        .populate('topicId', 'topicName')
        .populate('attemptId', 'score timeTaken')
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create recommendation: ${error.message}`);
    }
  }

  async findAll(): Promise<Recommendation[]> {
    return await this.recommendationModel
      .find()
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Recommendation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const recommendation = await this.recommendationModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .exec();
      
    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }
    return recommendation;
  }

  async findByUser(userId: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }    return await this.recommendationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .populate('recommendedQuizzes') // Populate the new field
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserAndStatus(userId: string, status: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    return await this.recommendationModel
      .find({ 
        userId: new Types.ObjectId(userId), 
        recommendationStatus: status 
      })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPendingRecommendations(userId: string): Promise<Recommendation[]> {
    return await this.findByUserAndStatus(userId, RecommendationStatus.PENDING);
  }

  async findBySubject(subjectId: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    return await this.recommendationModel
      .find({ subjectId: new Types.ObjectId(subjectId) })
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByTopic(topicId: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    return await this.recommendationModel
      .find({ topicId: new Types.ObjectId(topicId) })
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async generateRecommendationFromAttempt(
    userId: string,
    attemptId: string,
    subjectId: string,
    topicId: string | null,
    attemptScore: number,
    averageScore: number
  ): Promise<Recommendation | null> {
    try {
      // Get user's onboarding data for personalized recommendations
      const userOnboardingData = await this.getUserOnboardingData(userId);
      
      let recommendationReason = '';
      let recommendationTitle = '';
      let suggestedDifficulty: DifficultyLevel = DifficultyLevel.MEDIUM;
      let priority = this.calculateAttemptPriority({ attemptScore, averageScore });
      let urgency = this.calculateUrgency({ createdAt: new Date() } as any);

      // Enhanced recommendation logic based on performance analysis and onboarding data
      const personalizedRecommendation = this.generatePersonalizedRecommendation(
        attemptScore,
        averageScore,
        userOnboardingData
      );

      recommendationTitle = personalizedRecommendation.title;
      recommendationReason = personalizedRecommendation.reason;
      suggestedDifficulty = personalizedRecommendation.difficulty;
      priority = personalizedRecommendation.priority;

      // Adjust based on performance trend
      const performanceTrend = attemptScore - averageScore;
      if (performanceTrend > 15) {
        recommendationReason += ' Your performance is significantly improving - excellent progress!';
        if (suggestedDifficulty === DifficultyLevel.EASY) {
          suggestedDifficulty = DifficultyLevel.MEDIUM;
        } else if (suggestedDifficulty === DifficultyLevel.MEDIUM) {
          suggestedDifficulty = DifficultyLevel.HARD;
        }
      } else if (performanceTrend < -15) {
        recommendationReason += ' Consider reviewing previous materials and taking practice quizzes before attempting new topics.';
        if (suggestedDifficulty === DifficultyLevel.HARD) {
          suggestedDifficulty = DifficultyLevel.MEDIUM;
        } else if (suggestedDifficulty === DifficultyLevel.MEDIUM) {
          suggestedDifficulty = DifficultyLevel.EASY;
        }
        priority = Math.min(priority + 25, 100);
      }

      // Create enhanced recommendation with metadata
      const recommendationData = {
        userId: new Types.ObjectId(userId),
        subjectId: new Types.ObjectId(subjectId),
        topicId: topicId ? new Types.ObjectId(topicId) : null,
        attemptId: new Types.ObjectId(attemptId),
        title: recommendationTitle,
        description: recommendationReason.split('.')[0] + '.',
        recommendationReason,
        suggestedDifficulty,
        recommendationStatus: RecommendationStatus.PENDING,
        priority,
        urgency,
        estimatedCompletionTime: this.estimateCompletionTime({ suggestedDifficulty } as any),
        metadata: {
          generatedBy: 'enhanced_ai_system',
          algorithmVersion: '2.0',
          confidence: this.calculateConfidence(attemptScore, averageScore),
          relatedRecommendations: [],
          attemptScore,
          averageScore,
          performanceTrend,
          improvementPotential: Math.max(0, 85 - attemptScore),
          weaknessScore: Math.max(0, 70 - attemptScore),
          source: 'attempt_analysis_enhanced',
          generatedAt: new Date(),
          learningStyle: userOnboardingData?.learningStyle || 'BALANCED',
          personalizedFactors: personalizedRecommendation.factors
        }
      };      const newRecommendation = new this.recommendationModel(recommendationData);
      const savedRecommendation = await newRecommendation.save();

      // New: After saving, find and attach recommended existing quizzes using aggregation pipeline
      const matchingQuizzes = await this.quizModel.aggregate([
        {
          $match: {
            subjectId: new Types.ObjectId(subjectId),
            topicId: topicId ? new Types.ObjectId(topicId) : { $exists: true }, // Match topic if provided
            difficulty: recommendationData.suggestedDifficulty, // Match suggested difficulty
            isPublished: true, // Only published quizzes
          },
        },
        { $sample: { size: 5 } }, // Randomly sample up to 5 matching quizzes for variety
        { $project: { _id: 1 } }, // Only return IDs
      ]);

      const quizIds = matchingQuizzes.map((q) => q._id);

      // Update the saved recommendation with recommended quiz IDs
      await this.recommendationModel.updateOne(
        { _id: savedRecommendation._id },
        { $set: { recommendedQuizzes: quizIds } }
      );

      return await this.recommendationModel
        .findById(savedRecommendation._id)
        .populate('subjectId', 'subjectName')
        .populate('topicId', 'topicName')
        .populate('attemptId', 'score timeTaken')
        .populate('recommendedQuizzes') // Populate the new field
        .exec();
    } catch (error) {
      console.error('Error saving recommendation:', error);
      return null;
    }
  }

  // Calculate confidence score based on performance data
  private calculateConfidence(attemptScore: number, averageScore: number): number {
    const baseConfidence = 0.5;
    const scoreReliability = Math.min(attemptScore / 100, 1);
    const trendReliability = Math.abs(attemptScore - averageScore) < 20 ? 0.8 : 0.6;
    
    return Math.min(baseConfidence + (scoreReliability * 0.3) + (trendReliability * 0.2), 1);
  }

  // FIXED: Priority calculation - Higher priority for WEAK areas (low scores)
  private calculateAttemptPriority(data: { attemptScore: number; averageScore: number }): number {
    let priority = 30; // Base priority
    const targetScore = 80; // Default target score

    // CORRECT LOGIC: Higher priority for scores BELOW target (weak areas that need help)
    if (data.attemptScore < 50) {
      priority = 95; // URGENT: Very weak performance
    } else if (data.attemptScore < 65) {
      priority = 85; // HIGH: Below average performance
    } else if (data.attemptScore < targetScore) {
      priority = 70; // MEDIUM-HIGH: Below target but improving
    } else if (data.attemptScore < 90) {
      priority = 40; // LOW-MEDIUM: At target, maintenance mode
    } else {
      priority = 20; // LOW: Strong performance, challenge mode
    }

    // Adjust based on performance trend
    const trend = data.attemptScore - data.averageScore;
    if (trend < -15) {
      priority += 20; // Declining performance needs urgent attention
    } else if (trend < -5) {
      priority += 10; // Slight decline needs attention
    } else if (trend > 15 && data.attemptScore < targetScore) {
      priority += 5; // Improving but still weak
    } else if (trend > 15 && data.attemptScore >= targetScore) {
      priority -= 10; // Improving and strong, lower priority
    }

    return Math.max(15, Math.min(priority, 100)); // Ensure priority stays between 15-100
  }

  async autoGenerateRecommendation(attemptId: string): Promise<Recommendation | null> {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new BadRequestException('Invalid attempt ID format');
    }

    // This would typically fetch attempt data and user performance
    // For now, we'll simulate the data
    const mockAttemptData = {
      userId: '507f1f77bcf86cd799439011', // Mock user ID
      subjectId: '507f1f77bcf86cd799439012', // Mock subject ID
      topicId: '507f1f77bcf86cd799439013', // Mock topic ID
      score: 75,
      averageScore: 68
    };

    return this.generateRecommendationFromAttempt(
      mockAttemptData.userId,
      attemptId,
      mockAttemptData.subjectId,
      mockAttemptData.topicId,
      mockAttemptData.score,
      mockAttemptData.averageScore
    );
  }

  async updateStatus(id: string, status: string): Promise<Recommendation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const validStatuses = Object.values(RecommendationStatus);
    if (!validStatuses.includes(status as RecommendationStatus)) {
      throw new BadRequestException('Invalid status provided');
    }

    const updatedRecommendation = await this.recommendationModel
      .findByIdAndUpdate(
        id, 
        { recommendationStatus: status }, 
        { new: true }
      )
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .exec();

    if (!updatedRecommendation) {
      throw new NotFoundException('Recommendation not found');
    }
    return updatedRecommendation;
  }

  async getRecommendationStats(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const stats = await this.recommendationModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$recommendationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const difficultyStats = await this.recommendationModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$suggestedDifficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      statusBreakdown: {
        pending: 0,
        accepted: 0,
        rejected: 0,
        completed: 0,
        total: 0
      },
      difficultyBreakdown: {
        Easy: 0,
        Medium: 0,
        Hard: 0
      },
      totalRecommendations: 0
    };

    stats.forEach(stat => {
      const status = stat._id.toLowerCase();
      if (result.statusBreakdown.hasOwnProperty(status)) {
        result.statusBreakdown[status] = stat.count;
      }
      result.statusBreakdown.total += stat.count;
    });

    difficultyStats.forEach(stat => {
      if (result.difficultyBreakdown.hasOwnProperty(stat._id)) {
        result.difficultyBreakdown[stat._id] = stat.count;
      }
      result.totalRecommendations += stat.count;
    });

    return result;
  }

  async getUserRecommendationAnalytics(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const recommendations = await this.recommendationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const analytics = {
      totalRecommendations: recommendations.length,
      recentRecommendations: recommendations.slice(0, 5),
      subjectDistribution: {},
      difficultyTrend: [],
      completionRate: 0,
      averageResponseTime: 0
    };

    // Calculate subject distribution
    recommendations.forEach(rec => {
      const subjectName = (rec.subjectId as any)?.subjectName || 'Unknown';
      analytics.subjectDistribution[subjectName] = (analytics.subjectDistribution[subjectName] || 0) + 1;
    });

    // Calculate completion rate
    const completedCount = recommendations.filter(r => r.recommendationStatus === RecommendationStatus.COMPLETED).length;
    analytics.completionRate = recommendations.length > 0 ? Math.round((completedCount / recommendations.length) * 100) : 0;

    return analytics;
  }

  async getSmartRecommendations(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    // Get pending recommendations with enhanced logic
    const pendingRecommendations = await this.findPendingRecommendations(userId);
    
    // Prioritize recommendations based on various factors
    const prioritizedRecommendations = pendingRecommendations.map(rec => ({
      ...JSON.parse(JSON.stringify(rec)),
      priority: this.calculateRecommendationPriority(rec),
      urgency: this.calculateUrgency(rec),
      estimatedTime: this.estimateCompletionTime(rec)
    }));

    // Sort by priority and urgency
    prioritizedRecommendations.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.urgency - a.urgency;
    });

    return prioritizedRecommendations.slice(0, 10); // Return top 10
  }

  async update(id: string, updateRecommendationDto: UpdateRecommendationDto): Promise<Recommendation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const updatedRecommendation = await this.recommendationModel
      .findByIdAndUpdate(id, updateRecommendationDto, { new: true })
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .exec();

    if (!updatedRecommendation) {
      throw new NotFoundException('Recommendation not found');
    }
    return updatedRecommendation;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const result = await this.recommendationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Recommendation not found');
    }
  }

  async removeByAttempt(attemptId: string): Promise<void> {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    await this.recommendationModel.deleteMany({ 
      attemptId: new Types.ObjectId(attemptId) 
    }).exec();
  }

  async batchUpdateStatus(recommendationIds: string[], status: string): Promise<any> {
    const validStatuses = Object.values(RecommendationStatus);
    if (!validStatuses.includes(status as RecommendationStatus)) {
      throw new BadRequestException('Invalid status provided');
    }

    const validIds = recommendationIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new BadRequestException('No valid recommendation IDs provided');
    }

    const result = await this.recommendationModel.updateMany(
      { _id: { $in: validIds.map(id => new Types.ObjectId(id)) } },
      { recommendationStatus: status }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount} recommendations`
    };
  }

  async markAsCompleted(id: string): Promise<Recommendation> {
    return this.updateStatus(id, RecommendationStatus.COMPLETED);
  }

  // FIXED: Priority calculation - Easy difficulty = weak areas = HIGH priority
  private calculateRecommendationPriority(recommendation: Recommendation): number {
    let priority = 40; // Base priority

    // CORRECT LOGIC: Easy difficulty means weak area = HIGH priority
    if (recommendation.suggestedDifficulty === DifficultyLevel.EASY) {
      priority = 85; // HIGH priority - student struggling, needs help
    } else if (recommendation.suggestedDifficulty === DifficultyLevel.MEDIUM) {
      priority = 60; // MEDIUM priority - moderate performance
    } else if (recommendation.suggestedDifficulty === DifficultyLevel.HARD) {
      priority = 30; // LOW priority - strong performance, challenge mode
    }

    // Increase priority for older recommendations (urgent attention needed)
    const daysSinceCreated = Math.floor((Date.now() - recommendation.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 7) priority += 15; // Very old recommendations need attention
    else if (daysSinceCreated > 3) priority += 10;
    else if (daysSinceCreated > 1) priority += 5;

    return Math.max(20, Math.min(priority, 100)); // Ensure priority stays between 20-100
  }

  /**
   * FIXED: Generate recommendation reason focusing on WEAK areas for improvement
   */
  generateRecommendationReason(currentPerformance: number, targetScore: number, scoreGap: number, rec: any): string {
    const topicName = rec.metadata?.topicName || rec.topicId?.topicName || 'this topic';
    const progressToTarget = Math.min(100, (currentPerformance / targetScore) * 100);

    // CORRECT LOGIC: Focus on weak areas that need improvement
    if (currentPerformance < 50) {
      // Very weak performance - URGENT
      return `🚨 URGENT: ${topicName} needs immediate attention! Your ${currentPerformance}% score is significantly below target. This weak area requires intensive practice to improve your overall performance.`;
    } else if (currentPerformance < 65) {
      // Below average - HIGH PRIORITY
      return `⚠️ ${topicName} is a weak area requiring focus. Your ${currentPerformance}% score needs improvement to reach your ${targetScore}% target. Strengthening this area will boost your overall progress.`;
    } else if (currentPerformance < targetScore) {
      // Below target - MEDIUM PRIORITY  
      return `📈 ${topicName} needs practice to reach your ${targetScore}% target. You're ${Math.round(scoreGap)}% away from your goal. Focus on this area to accelerate your progress.`;
    } else if (currentPerformance < 90) {
      // At/above target - LOW PRIORITY
      return `✅ ${topicName} is performing well at ${currentPerformance}%. Consider occasional review to maintain this level while focusing on weaker areas.`;
    } else {
      // Strong performance - VERY LOW PRIORITY
      return `🌟 Excellent work in ${topicName}! Your ${currentPerformance}% score shows mastery. Focus your energy on weaker topics that need more attention.`;
    }
  }

  /**
   * FIXED: Generate recommendation content focusing on WEAK areas that need help
   */
  generateRecommendationContent(topicName: string, priority: number, currentScore: number = 0, targetScore: number = 80): { title: string; description: string; type: string } {
    if (priority >= 80) {
      // High priority - WEAK area needing urgent help
      return {
        title: `🚨 Focus on ${topicName}`,
        description: `This is a weak area requiring immediate attention. Your performance is below expectations and needs intensive practice to improve.`,
        type: 'weak'
      };
    } else if (priority >= 60) {
      // Medium-high priority - Below target area
      return {
        title: `📈 Improve ${topicName}`,
        description: `This area needs practice to reach your ${targetScore}% target. Focus here to boost your overall performance.`,
        type: 'weak'
      };
    } else if (priority >= 40) {
      // Medium priority - Moderate performance
      return {
        title: `🔄 Practice ${topicName}`,
        description: `You're making progress but could benefit from additional practice to solidify your understanding.`,
        type: 'practice'
      };
    } else {
      // Low priority - Strong area (maintenance only)
      return {
        title: `✅ Maintain ${topicName}`,
        description: `You're performing well in this area. Occasional review will help maintain your strong performance.`,
        type: 'advanced'
      };
    }
  }

  private calculateUrgency(recommendation: Recommendation): number {
    const daysSinceCreated = Math.floor((Date.now() - recommendation.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreated > 7) return 90;
    if (daysSinceCreated > 3) return 60;
    if (daysSinceCreated > 1) return 30;
    return 10;
  }

  private estimateCompletionTime(recommendation: Recommendation): number {
    // Estimate time in minutes based on difficulty
    switch (recommendation.suggestedDifficulty) {
      case DifficultyLevel.EASY: return 15;
      case DifficultyLevel.MEDIUM: return 25;
      case DifficultyLevel.HARD: return 40;
      default: return 20;
    }
  }

  // Get user's onboarding data for personalized recommendations
  private async getUserOnboardingData(userId: string): Promise<any> {
    try {
      // Fetch actual user data with enhanced goal progress
      const user = await this.userModel.findById(userId).select('onboarding').exec();
      
      if (!user?.onboarding) {
        return {
          learningStyle: 'BALANCED',
          proficiencyLevel: 'INTERMEDIATE',
          weakAreas: [],
          strongAreas: [],
          preferredDifficulty: 'MEDIUM',
          studyTimePerDay: 30,
          targetScore: 75
        };
      }

      const onboarding = user.onboarding;
      
      return {
        learningStyle: onboarding.learningPreferences?.learningStyle || 'BALANCED',
        proficiencyLevel: onboarding.learningPreferences?.proficiencyLevel || 'INTERMEDIATE',
        weakAreas: onboarding.assessmentData?.weakAreas || [],
        strongAreas: onboarding.assessmentData?.strongAreas || [],
        recentlyImprovedAreas: onboarding.assessmentData?.recentlyImprovedAreas || [],
        newlyWeakAreas: onboarding.assessmentData?.newlyWeakAreas || [],
        preferredDifficulty: onboarding.learningPreferences?.preferredDifficulty || 'MEDIUM',
        studyTimePerDay: onboarding.learningPreferences?.studyTimePerDay || 30,
        targetScore: onboarding.learningPreferences?.targetScore || 75,
        focusAreas: onboarding.learningPreferences?.focusAreas || [],
        goalProgress: onboarding.goalProgress || {},
        focusAreaProgress: onboarding.focusAreaProgress || []
      };
    } catch (error) {
      console.error('Error fetching user onboarding data:', error);
      return null;
    }
  }

  // FIXED: Generate personalized recommendation focusing on WEAK areas that need help
  private generatePersonalizedRecommendation(
    attemptScore: number,
    averageScore: number,
    onboardingData: any
  ): any {
    const learningStyle = onboardingData?.learningStyle || 'BALANCED';
    const proficiencyLevel = onboardingData?.proficiencyLevel || 'INTERMEDIATE';
    const targetScore = onboardingData?.targetScore || 80;
    const weakAreas = onboardingData?.weakAreas || [];
    const strongAreas = onboardingData?.strongAreas || [];
    
    let title = '';
    let reason = '';
    let difficulty = DifficultyLevel.MEDIUM;
    let priority = 50;
    const factors: string[] = [];

    // CORRECT LOGIC: Focus on weak areas (low scores) with high priority
    if (attemptScore < 50) {
      // Very weak performance - URGENT PRIORITY
      title = '🚨 Urgent Practice Needed';
      reason = `Your ${attemptScore}% score indicates this is a critical weak area requiring immediate attention. Intensive practice is needed to improve your understanding.`;
      difficulty = DifficultyLevel.EASY;
      priority = 95;
      factors.push('critical_weak_area', 'urgent_attention');
    } else if (attemptScore < 65) {
      // Below average - HIGH PRIORITY
      title = '⚠️ Focus Area Required';
      reason = `Your ${attemptScore}% score shows this topic needs significant improvement. This weak area should be prioritized in your study plan.`;
      difficulty = DifficultyLevel.EASY;
      priority = 85;
      factors.push('weak_area', 'high_priority');
    } else if (attemptScore < targetScore) {
      // Below target - MEDIUM PRIORITY
      title = '📈 Improvement Needed';
      reason = `Your ${attemptScore}% score is below your ${targetScore}% target. Focus on this area to reach your goal.`;
      difficulty = DifficultyLevel.MEDIUM;
      priority = 70;
      factors.push('below_target', 'needs_improvement');
    } else if (attemptScore < 90) {
      // At/above target - LOW PRIORITY
      title = '✅ Maintenance Practice';
      reason = `Your ${attemptScore}% score meets your target. Occasional practice will help maintain this level while you focus on weaker areas.`;
      difficulty = DifficultyLevel.MEDIUM;
      priority = 35;
      factors.push('target_achieved', 'maintenance');
    } else {
      // Strong performance - VERY LOW PRIORITY
      title = '🌟 Optional Challenge';
      reason = `Excellent ${attemptScore}% score! This is a strong area. Focus your energy on topics that need more attention.`;
      difficulty = DifficultyLevel.HARD;
      priority = 20;
      factors.push('strong_area', 'optional_challenge');
    }

    // Adjust based on performance trend
    const trend = attemptScore - averageScore;
    if (trend < -15) {
      reason += ' Your declining performance in this area needs urgent attention.';
      priority += 20;
      factors.push('declining_performance');
    } else if (trend > 15 && attemptScore < targetScore) {
      reason += ' Your improving trend is encouraging - keep focusing on this weak area!';
      priority += 5;
      factors.push('improving_weak_area');
    }

    // Adjust based on learning style
    if (learningStyle === 'NEEDS_SUPPORT' && priority >= 70) {
      reason += ' We recommend starting with guided examples and visual aids to build confidence.';
      if (difficulty === DifficultyLevel.MEDIUM) difficulty = DifficultyLevel.EASY;
      priority += 10;
      factors.push('needs_support');
    }

    // Adjust based on proficiency level
    if (proficiencyLevel === 'BEGINNER' && priority >= 70) {
      reason += ' As a beginner, focus on building strong fundamentals in this weak area.';
      if (difficulty === DifficultyLevel.MEDIUM) difficulty = DifficultyLevel.EASY;
      factors.push('beginner_weak_area');
    }

    return {
      title,
      reason: reason.trim(),
      difficulty,
      priority: Math.max(15, Math.min(priority, 100)),
      factors
    };
  }
}
