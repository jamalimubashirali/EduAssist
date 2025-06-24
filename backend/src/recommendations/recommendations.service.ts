import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recommendation } from './schema/recommendations.schema';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { RecommendationStatus, DifficultyLevel } from 'common/enums';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name) private recommendationModel: Model<Recommendation>
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
    }

    return await this.recommendationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
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
    topicId: string,
    attemptScore: number,
    averageScore: number
  ): Promise<Recommendation | null> {
    let recommendationReason = '';
    let suggestedDifficulty: DifficultyLevel = DifficultyLevel.MEDIUM;

    // Enhanced recommendation logic based on performance analysis
    if (attemptScore < 40) {
      recommendationReason = 'Based on your recent quiz performance, we recommend reviewing the fundamental concepts and practicing with easier questions to build a strong foundation.';
      suggestedDifficulty = DifficultyLevel.EASY;
    } else if (attemptScore < 60) {
      recommendationReason = 'Your performance shows you understand the basics but need more practice. Focus on medium-difficulty questions to strengthen your knowledge.';
      suggestedDifficulty = DifficultyLevel.MEDIUM;
    } else if (attemptScore < 80) {
      recommendationReason = 'Good performance! Continue practicing at the current level and gradually introduce more challenging questions.';
      suggestedDifficulty = DifficultyLevel.MEDIUM;
    } else if (attemptScore >= 85) {
      recommendationReason = 'Excellent performance! You\'re ready to challenge yourself with more difficult questions in this topic.';
      suggestedDifficulty = DifficultyLevel.HARD;
    } else {
      recommendationReason = 'Good work! Keep practicing to maintain and improve your understanding.';
      suggestedDifficulty = DifficultyLevel.MEDIUM;
    }

    // Adjust based on performance trend
    if (attemptScore > averageScore + 15) {
      recommendationReason += ' Your performance is significantly improving - excellent progress!';
      if (suggestedDifficulty === DifficultyLevel.EASY) {
        suggestedDifficulty = DifficultyLevel.MEDIUM;
      } else if (suggestedDifficulty === DifficultyLevel.MEDIUM) {
        suggestedDifficulty = DifficultyLevel.HARD;
      }
    } else if (attemptScore < averageScore - 15) {
      recommendationReason += ' Consider reviewing previous materials and taking practice quizzes before attempting new topics.';
      if (suggestedDifficulty === DifficultyLevel.HARD) {
        suggestedDifficulty = DifficultyLevel.MEDIUM;
      } else if (suggestedDifficulty === DifficultyLevel.MEDIUM) {
        suggestedDifficulty = DifficultyLevel.EASY;
      }
    }

    const newRecommendation = new this.recommendationModel({
      userId: new Types.ObjectId(userId),
      subjectId: new Types.ObjectId(subjectId),
      topicId: new Types.ObjectId(topicId),
      attemptId: new Types.ObjectId(attemptId),
      recommendationReason,
      suggestedDifficulty,
      recommendationStatus: RecommendationStatus.PENDING
    });

    const savedRecommendation = await newRecommendation.save();
    
    return await this.recommendationModel
      .findById(savedRecommendation._id)
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .exec();
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

  // Helper methods
  private calculateRecommendationPriority(recommendation: Recommendation): number {
    let priority = 50; // Base priority

    // Higher priority for struggling students (easy difficulty suggestions)
    if (recommendation.suggestedDifficulty === DifficultyLevel.EASY) {
      priority += 30;
    } else if (recommendation.suggestedDifficulty === DifficultyLevel.HARD) {
      priority += 10;
    }

    // Increase priority for older recommendations
    const daysSinceCreated = Math.floor((Date.now() - recommendation.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    priority += Math.min(daysSinceCreated * 2, 20);

    return Math.min(priority, 100);
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
}
