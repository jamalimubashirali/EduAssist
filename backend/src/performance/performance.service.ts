import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserPerformance } from './schema/performance.schema';
import { Attempt } from '../attempts/schema/attempts.schema';
import { ProgressTrend } from 'common/enums';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(UserPerformance.name) private performanceModel: Model<UserPerformance>,
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
  ) {}

  async updatePerformance(userId: string, topicId: string, subjectId: string, attemptData: any): Promise<UserPerformance> {
    try {
      const performance = await this.performanceModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), topicId: new Types.ObjectId(topicId) },
        {},
        { upsert: true, new: true }
      );

      // Calculate updated metrics
      const recentAttempts = await this.attemptModel
        .find({ userId: new Types.ObjectId(userId), topicId: new Types.ObjectId(topicId) })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();

      const scores = recentAttempts.map(a => a.score || 0);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const bestScore = Math.max(...scores, 0);
      const worstScore = Math.min(...scores, 100);

      // Calculate progress trend
      const progressTrend = this.calculateProgressTrend(scores);

      // Update performance document
      performance.totalAttempts = recentAttempts.length;
      performance.averageScore = averageScore;
      performance.bestScore = bestScore;
      performance.worstScore = worstScore;
      performance.progressTrend = progressTrend;
      performance.lastQuizAttempted = new Date();
      performance.recentScores = scores.slice(0, 10);
      performance.masteryLevel = this.calculateMasteryLevel(averageScore, recentAttempts.length);
      performance.learningVelocity = this.calculateLearningVelocity(scores);
      performance.lastUpdated = new Date();

      if (!performance.subjectId) {
        performance.subjectId = new Types.ObjectId(subjectId);
      }

      return await performance.save();
    } catch (error) {
      console.error('Error updating performance:', error);
      throw error;
    }
  }

  async getUserPerformance(userId: string, topicId: string): Promise<UserPerformance | null> {
    return await this.performanceModel
      .findOne({ 
        userId: new Types.ObjectId(userId), 
        topicId: new Types.ObjectId(topicId) 
      })
      .exec();
  }

  async getUserTopicPerformances(userId: string): Promise<UserPerformance[]> {
    return await this.performanceModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('topicId', 'name')
      .populate('subjectId', 'name')
      .sort({ lastUpdated: -1 })
      .exec();
  }

  private calculateProgressTrend(scores: number[]): ProgressTrend {
    if (scores.length < 3) return ProgressTrend.STEADY;

    const recent = scores.slice(0, 3);
    const older = scores.slice(3, 6);

    if (older.length === 0) return ProgressTrend.STEADY;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 5) return ProgressTrend.IMPROVING;
    if (difference < -5) return ProgressTrend.DECLINING;
    return ProgressTrend.STEADY;
  }

  private calculateMasteryLevel(averageScore: number, totalAttempts: number): number {
    // Base mastery on average score with attempt count multiplier
    const baseScore = Math.min(averageScore, 100);
    const attemptMultiplier = Math.min(totalAttempts / 10, 1); // Max multiplier at 10 attempts
    return Math.floor(baseScore * attemptMultiplier);
  }

  private calculateLearningVelocity(scores: number[]): number {
    if (scores.length < 2) return 0;

    // Calculate rate of improvement over recent attempts
    const recentScores = scores.slice(0, 5);
    if (recentScores.length < 2) return 0;

    const firstScore = recentScores[recentScores.length - 1];
    const lastScore = recentScores[0];

    return (lastScore - firstScore) / recentScores.length;
  }
}
