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

      // Enhanced time tracking
      const totalTimeSpent = recentAttempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0);
      const averageTimePerQuestion = this.calculateAverageTimePerQuestion(recentAttempts);

      // Calculate difficulty-wise performance
      const difficultyPerformance = this.calculateDifficultyPerformance(recentAttempts);

      // Update performance document with enhanced metrics
      performance.totalAttempts = recentAttempts.length;
      performance.averageScore = averageScore;
      performance.bestScore = bestScore;
      performance.worstScore = worstScore;
      performance.totalTimeSpent = totalTimeSpent;
      performance.averageTimePerQuestion = averageTimePerQuestion;
      performance.progressTrend = progressTrend;
      performance.lastQuizAttempted = new Date();
      performance.recentScores = scores.slice(0, 10);
      performance.masteryLevel = this.calculateMasteryLevel(averageScore, recentAttempts.length);
      performance.learningVelocity = this.calculateLearningVelocity(scores);
      performance.difficultyPerformance = difficultyPerformance;
      performance.lastUpdated = new Date();

      // Calculate and update streak count
      performance.streakCount = this.calculateStreakCount(recentAttempts);

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

  // Calculate average time per question from attempts
  private calculateAverageTimePerQuestion(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    
    const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.totalQuestions || 0), 0);
    const totalTime = attempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0);
    
    return totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;
  }

  // Calculate performance breakdown by difficulty
  private calculateDifficultyPerformance(attempts: any[]): any {
    const difficultyStats = {
      Easy: { attempts: 0, averageScore: 0, totalScore: 0 },
      Medium: { attempts: 0, averageScore: 0, totalScore: 0 },
      Hard: { attempts: 0, averageScore: 0, totalScore: 0 }
    };

    // Note: In a real implementation, you would need difficulty information from the quiz/questions
    // For now, we'll simulate based on score ranges
    attempts.forEach(attempt => {
      const score = attempt.score || 0;
      let difficulty = 'Medium';
      
      // Simulate difficulty assignment based on performance patterns
      if (score >= 80) difficulty = 'Hard';
      else if (score <= 50) difficulty = 'Easy';
      
      difficultyStats[difficulty].attempts++;
      difficultyStats[difficulty].totalScore += score;
    });

    // Calculate averages
    Object.keys(difficultyStats).forEach(difficulty => {
      const stats = difficultyStats[difficulty];
      stats.averageScore = stats.attempts > 0 ? Math.round(stats.totalScore / stats.attempts) : 0;
      delete stats.totalScore; // Remove temporary field
    });

    return difficultyStats;
  }

  // Calculate streak count based on recent performance
  private calculateStreakCount(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    
    let streak = 0;
    const passingScore = 60; // Define what constitutes a "passing" score
    
    // Count consecutive passing scores from most recent attempts
    for (const attempt of attempts) {
      if ((attempt.score || 0) >= passingScore) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Gamification analytics methods
  async getUserGamificationStats(userId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const userObjectId = new Types.ObjectId(userId);

      // Get overall performance statistics
      const performances = await this.performanceModel
        .find({ userId: userObjectId })
        .populate('topicId', 'topicName')
        .populate('subjectId', 'subjectName')
        .exec();

      if (performances.length === 0) {
        return {
          totalTopics: 0,
          averageMastery: 0,
          strongAreas: [],
          weakAreas: [],
          recentProgress: [],
          subjectBreakdown: {}
        };
      }

      // Calculate statistics
      const totalTopics = performances.length;
      const averageMastery = performances.reduce((sum, p) => sum + p.masteryLevel, 0) / totalTopics;

      // Identify strong and weak areas
      const sortedByMastery = [...performances].sort((a, b) => b.masteryLevel - a.masteryLevel);
      const strongAreas = sortedByMastery.slice(0, 3).map(p => ({
        topic: (p.topicId as any)?.topicName || 'Unknown Topic',
        masteryLevel: p.masteryLevel,
        averageScore: p.averageScore
      }));

      const weakAreas = sortedByMastery.slice(-3).reverse().map(p => ({
        topic: (p.topicId as any)?.topicName || 'Unknown Topic',
        masteryLevel: p.masteryLevel,
        averageScore: p.averageScore
      }));

      // Recent progress (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentAttempts = await this.attemptModel
        .find({
          userId: userObjectId,
          createdAt: { $gte: sevenDaysAgo },
          isCompleted: true
        })
        .sort({ createdAt: 1 })
        .select('score createdAt')
        .exec();      const recentProgress = recentAttempts.map(attempt => ({
        date: (attempt as any).createdAt,
        score: attempt.score || 0
      }));

      // Subject breakdown
      const subjectBreakdown = performances.reduce((acc, p) => {
        const subjectName = (p.subjectId as any)?.subjectName || 'Unknown Subject';
        if (!acc[subjectName]) {
          acc[subjectName] = {
            topicCount: 0,
            averageMastery: 0,
            averageScore: 0
          };
        }
        acc[subjectName].topicCount++;
        acc[subjectName].averageMastery += p.masteryLevel;
        acc[subjectName].averageScore += p.averageScore;
        return acc;
      }, {} as any);

      // Calculate averages for subjects
      Object.keys(subjectBreakdown).forEach(subject => {
        const count = subjectBreakdown[subject].topicCount;
        subjectBreakdown[subject].averageMastery = Math.round(subjectBreakdown[subject].averageMastery / count);
        subjectBreakdown[subject].averageScore = Math.round(subjectBreakdown[subject].averageScore / count);
      });

      return {
        totalTopics,
        averageMastery: Math.round(averageMastery),
        strongAreas,
        weakAreas,
        recentProgress,
        subjectBreakdown
      };
    } catch (error) {
      throw new Error(`Failed to get gamification stats: ${error.message}`);
    }
  }

  async getSubjectMastery(userId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const userObjectId = new Types.ObjectId(userId);

      const subjectMastery = await this.performanceModel.aggregate([
        {
          $match: { userId: userObjectId }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $unwind: '$subject'
        },
        {
          $group: {
            _id: '$subjectId',
            subjectName: { $first: '$subject.subjectName' },
            averageMastery: { $avg: '$masteryLevel' },
            averageScore: { $avg: '$averageScore' },
            topicCount: { $sum: 1 },
            totalAttempts: { $sum: '$totalAttempts' }
          }
        },
        {
          $sort: { averageMastery: -1 }
        }
      ]);

      return subjectMastery.map(subject => ({
        subjectId: subject._id,
        subjectName: subject.subjectName,
        masteryLevel: Math.round(subject.averageMastery),
        averageScore: Math.round(subject.averageScore),
        topicCount: subject.topicCount,
        totalAttempts: subject.totalAttempts,
        masteryDescription: this.getMasteryDescription(subject.averageMastery)
      }));
    } catch (error) {
      throw new Error(`Failed to get subject mastery: ${error.message}`);
    }
  }

  async getLearningTrends(userId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const userObjectId = new Types.ObjectId(userId);

      // Get attempts from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAttempts = await this.attemptModel
        .find({
          userId: userObjectId,
          createdAt: { $gte: thirtyDaysAgo },
          isCompleted: true
        })
        .sort({ createdAt: 1 })
        .populate('topicId', 'topicName')
        .populate('subjectId', 'subjectName')
        .exec();      // Group by day
      const dailyStats = recentAttempts.reduce((acc, attempt) => {
        const date = new Date((attempt as any).createdAt);
        const dateKey = date.toISOString().split('T')[0];

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            quizCount: 0,
            totalScore: 0,
            averageScore: 0,
            subjects: new Set()
          };
        }

        acc[dateKey].quizCount++;
        acc[dateKey].totalScore += attempt.score || 0;
        if (attempt.subjectId) {
          acc[dateKey].subjects.add((attempt.subjectId as any)?.subjectName || 'Unknown');
        }

        return acc;
      }, {} as any);

      // Calculate averages and convert sets to arrays
      const trendData = Object.values(dailyStats).map((day: any) => ({
        date: day.date,
        quizCount: day.quizCount,
        averageScore: Math.round(day.totalScore / day.quizCount),
        subjectsStudied: Array.from(day.subjects).length
      }));

      // Calculate weekly averages
      const weeklyTrends = this.calculateWeeklyTrends(trendData);

      return {
        dailyTrends: trendData,
        weeklyTrends,
        totalDaysActive: trendData.length,
        averageDailyQuizzes: trendData.reduce((sum, day) => sum + day.quizCount, 0) / Math.max(trendData.length, 1),
        overallTrend: this.calculateOverallTrend(trendData)
      };
    } catch (error) {
      throw new Error(`Failed to get learning trends: ${error.message}`);
    }
  }

  private getMasteryDescription(masteryLevel: number): string {
    if (masteryLevel >= 90) return 'Master';
    if (masteryLevel >= 75) return 'Advanced';
    if (masteryLevel >= 60) return 'Intermediate';
    if (masteryLevel >= 40) return 'Beginner';
    return 'Novice';
  }

  private calculateWeeklyTrends(dailyData: any[]): any[] {
    // Group daily data into weeks
    const weeks = dailyData.reduce((acc, day) => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!acc[weekKey]) {
        acc[weekKey] = {
          weekStart: weekKey,
          days: [],
          totalQuizzes: 0,
          totalScore: 0
        };
      }

      acc[weekKey].days.push(day);
      acc[weekKey].totalQuizzes += day.quizCount;
      acc[weekKey].totalScore += day.averageScore * day.quizCount;

      return acc;
    }, {} as any);

    return Object.values(weeks).map((week: any) => ({
      weekStart: week.weekStart,
      daysActive: week.days.length,
      averageDailyQuizzes: Math.round(week.totalQuizzes / 7 * 100) / 100,
      averageScore: Math.round(week.totalScore / week.totalQuizzes),
      totalQuizzes: week.totalQuizzes
    }));
  }

  private calculateOverallTrend(trendData: any[]): string {
    if (trendData.length < 2) return 'insufficient_data';

    const recent = trendData.slice(-7); // Last 7 days
    const previous = trendData.slice(-14, -7); // Previous 7 days

    if (recent.length === 0) return 'no_recent_activity';
    if (previous.length === 0) return 'new_learner';

    const recentAvg = recent.reduce((sum, day) => sum + day.averageScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.averageScore, 0) / previous.length;

    const improvement = recentAvg - previousAvg;

    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  }
}
