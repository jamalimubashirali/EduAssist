import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserPerformance } from './schema/performance.schema';
import { Attempt } from '../attempts/schema/attempts.schema';
import { User } from '../users/schema/user.schema';
import { ProgressTrend } from 'common/enums';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(UserPerformance.name) private performanceModel: Model<UserPerformance>,
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

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

      const savedPerformance = await performance.save();

      // Update user's goal progress and weak areas based on current performance
      await this.updateUserGoalProgressAndWeakAreas(userId);

      return savedPerformance;
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
        .exec(); const recentProgress = recentAttempts.map(attempt => ({
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

  /**
   * Update user's goal progress and weak areas using aggregation pipeline
   */
  async updateUserGoalProgressAndWeakAreas(userId: string): Promise<void> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      // Enhanced aggregation pipeline with historical performance tracking
      const userAnalysis = await this.performanceModel.aggregate([
        // Match user's performances
        { $match: { userId: userObjectId } },

        // Lookup user data to get goals and current weak areas
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },

        // Lookup topic and subject data
        {
          $lookup: {
            from: 'topics',
            localField: 'topicId',
            foreignField: '_id',
            as: 'topic'
          }
        },
        { $unwind: '$topic' },

        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        { $unwind: '$subject' },

        // Get recent attempts for trend analysis
        {
          $lookup: {
            from: 'attempts',
            let: { userId: '$userId', topicId: '$topicId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$topicId', '$$topicId'] }
                    ]
                  }
                }
              },
              { $sort: { createdAt: -1 } },
              { $limit: 10 }, // Last 10 attempts for trend analysis
              {
                $project: {
                  score: 1,
                  createdAt: 1
                }
              }
            ],
            as: 'recentAttempts'
          }
        },

        // Group by user to analyze overall performance with enhanced metrics
        {
          $group: {
            _id: '$userId',
            user: { $first: '$user' },
            performances: {
              $push: {
                topicId: '$topicId',
                topicName: '$topic.topicName',
                subjectId: '$subjectId',
                subjectName: '$subject.subjectName',
                averageScore: '$averageScore',
                bestScore: '$bestScore',
                masteryLevel: '$masteryLevel',
                progressTrend: '$progressTrend',
                learningVelocity: '$learningVelocity',
                totalAttempts: '$totalAttempts',
                recentAttempts: '$recentAttempts'
              }
            },
            overallAverageScore: { $avg: '$averageScore' },
            totalTopicsStudied: { $sum: 1 },
            totalAttempts: { $sum: '$totalAttempts' }
          }
        }
      ]);

      if (userAnalysis.length === 0) return;

      const analysis = userAnalysis[0];
      const user = analysis.user;
      const performances = analysis.performances;

      // Get user's goals and current weak areas for comparison
      const targetScore = user.onboarding?.learningPreferences?.targetScore || 75;
      const focusAreas = user.onboarding?.learningPreferences?.focusAreas || [];
      const weeklyGoal = user.onboarding?.learningPreferences?.weeklyGoal || 5;
      const currentWeakAreas = user.onboarding?.assessmentData?.weakAreas || [];

      // Enhanced thresholds for dynamic weak area management
      const WEAK_THRESHOLD = targetScore; // Below target = weak
      const IMPROVEMENT_BUFFER = 5; // 5% above target to remove from weak areas
      const STRONG_THRESHOLD = targetScore + 10; // 10% above target = strong
      const TREND_THRESHOLD = 7; // 7% improvement/decline to be considered trending

      // Calculate weighted scores and improvement trends for each topic
      const enhancedPerformances = performances.map(perf => {
        const recentAttempts = perf.recentAttempts || [];

        // Calculate weighted score (recent attempts have more weight)
        let weightedScore = perf.averageScore;
        if (recentAttempts.length >= 3) {
          const recentScores = recentAttempts.slice(0, 3).map(a => a.score);
          const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
          // 70% recent, 30% historical
          weightedScore = (recentAvg * 0.7) + (perf.averageScore * 0.3);
        }

        // Calculate improvement trend
        let improvementTrend = 0;
        if (recentAttempts.length >= 4) {
          const recent = recentAttempts.slice(0, 2).map(a => a.score);
          const older = recentAttempts.slice(2, 4).map(a => a.score);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          improvementTrend = recentAvg - olderAvg;
        }

        return {
          ...perf,
          weightedScore,
          improvementTrend,
          wasWeak: currentWeakAreas.includes(perf.topicName)
        };
      });

      // Dynamic weak area management with sophisticated logic
      const newWeakAreas: string[] = [];
      const newStrongAreas: string[] = [];
      const improvingTopics: string[] = [];
      const decliningTopics: string[] = [];
      const recentlyImprovedAreas: string[] = [];
      const newlyWeakAreas: string[] = [];

      let totalWeightedScore = 0;
      let weakAreaTotalScore = 0;
      let strongAreaTotalScore = 0;
      let weakAreaCount = 0;
      let strongAreaCount = 0;
      let topicsAtTarget = 0;

      enhancedPerformances.forEach(perf => {
        const { weightedScore, improvementTrend, wasWeak, topicName } = perf;
        totalWeightedScore += weightedScore;

        // Dynamic weak area classification
        if (weightedScore >= (targetScore + IMPROVEMENT_BUFFER) && wasWeak) {
          // Topic significantly improved - remove from weak areas
          recentlyImprovedAreas.push(topicName);
          newStrongAreas.push(topicName);
          strongAreaTotalScore += weightedScore;
          strongAreaCount++;
          topicsAtTarget++;
        } else if (weightedScore < WEAK_THRESHOLD) {
          // Topic is below target - add/keep in weak areas
          newWeakAreas.push(topicName);
          weakAreaTotalScore += weightedScore;
          weakAreaCount++;
          if (!wasWeak) {
            newlyWeakAreas.push(topicName);
          }
        } else if (weightedScore >= targetScore) {
          // Topic is at/above target
          newStrongAreas.push(topicName);
          strongAreaTotalScore += weightedScore;
          strongAreaCount++;
          topicsAtTarget++;
        }

        // Track improvement/decline trends
        if (improvementTrend >= TREND_THRESHOLD) {
          improvingTopics.push(topicName);
        } else if (improvementTrend <= -TREND_THRESHOLD) {
          decliningTopics.push(topicName);
        }
      });

      // Enhanced overall goal progress calculation with weighted approach
      const currentAverageScore = totalWeightedScore / performances.length;

      // Calculate progress with emphasis on weak area improvement
      let adjustedProgressScore = currentAverageScore;

      if (weakAreaCount > 0 && strongAreaCount > 0) {
        const weakAreaAvg = weakAreaTotalScore / weakAreaCount;
        const strongAreaAvg = strongAreaTotalScore / strongAreaCount;

        // Weight calculation: more weak areas = more emphasis on weak area improvement
        const weakAreaWeight = Math.min(0.8, 0.4 + (weakAreaCount / performances.length) * 0.4);
        const strongAreaWeight = 1 - weakAreaWeight;

        adjustedProgressScore = (weakAreaAvg * weakAreaWeight) + (strongAreaAvg * strongAreaWeight);
      }

      // Calculate improvement rate considering weak area corrections
      const improvementBonus = recentlyImprovedAreas.length * 5; // 5% bonus per improved weak area
      const declinesPenalty = newlyWeakAreas.length * 3; // 3% penalty per new weak area

      const baseImprovementRate = (topicsAtTarget / performances.length) * 100;
      const adjustedImprovementRate = Math.max(0, Math.min(100,
        baseImprovementRate + improvementBonus - declinesPenalty
      ));

      // Enhanced goal progress metrics
      const goalProgress = {
        targetScore: targetScore,
        currentAverageScore: Math.round(currentAverageScore),
        adjustedProgressScore: Math.round(adjustedProgressScore),
        scoreGap: Math.max(0, targetScore - adjustedProgressScore),
        progressPercentage: Math.min(100, Math.round((adjustedProgressScore / targetScore) * 100)),
        topicsAtTarget,
        totalTopics: performances.length,
        weakAreasCount: newWeakAreas.length,
        strongAreasCount: newStrongAreas.length,
        recentlyImprovedCount: recentlyImprovedAreas.length,
        newlyWeakCount: newlyWeakAreas.length,
        weeklyGoalProgress: await this.calculateWeeklyGoalProgress(userId, weeklyGoal)
      };

      // Enhanced focus area progress with trend analysis
      const focusAreaProgress = focusAreas.map(area => {
        const areaPerformances = enhancedPerformances.filter(p =>
          p.topicName.toLowerCase().includes(area.toLowerCase()) ||
          p.subjectName.toLowerCase().includes(area.toLowerCase())
        );

        if (areaPerformances.length === 0) return null;

        const areaWeightedScore = areaPerformances.reduce((sum, p) => sum + p.weightedScore, 0) / areaPerformances.length;
        const areaImprovementTrend = areaPerformances.reduce((sum, p) => sum + p.improvementTrend, 0) / areaPerformances.length;

        return {
          area: area,
          currentScore: Math.round(areaWeightedScore),
          targetScore: targetScore,
          isOnTrack: areaWeightedScore >= targetScore,
          improvement: areaImprovementTrend > TREND_THRESHOLD,
          trend: areaImprovementTrend > TREND_THRESHOLD ? 'improving' :
            areaImprovementTrend < -TREND_THRESHOLD ? 'declining' : 'stable',
          topicsInArea: areaPerformances.length,
          weakTopicsInArea: areaPerformances.filter(p => newWeakAreas.includes(p.topicName)).length
        };
      }).filter(Boolean);

      // Sort weak areas by priority (lowest scores first)
      const prioritizedWeakAreas = newWeakAreas
        .map(topicName => {
          const perf = enhancedPerformances.find(p => p.topicName === topicName);
          return { topicName, score: perf?.weightedScore || 0 };
        })
        .sort((a, b) => a.score - b.score)
        .map(item => item.topicName);

      // Update user document with enhanced goal progress and dynamic weak areas
      const updates = {
        'onboarding.assessmentData.weakAreas': prioritizedWeakAreas,
        'onboarding.assessmentData.strongAreas': newStrongAreas.slice(0, 10), // Top 10 strong areas
        'onboarding.assessmentData.recentlyImprovedAreas': recentlyImprovedAreas,
        'onboarding.assessmentData.newlyWeakAreas': newlyWeakAreas,
        'onboarding.progressMetrics.averageAccuracy': Math.round(currentAverageScore),
        'onboarding.progressMetrics.adjustedAccuracy': Math.round(adjustedProgressScore),
        'onboarding.progressMetrics.improvementRate': Math.round(adjustedImprovementRate),
        'onboarding.progressMetrics.questionsAnswered': analysis.totalAttempts,
        'onboarding.progressMetrics.engagementLevel': this.calculateEngagementLevel(analysis.totalAttempts, weeklyGoal),
        'onboarding.goalProgress': goalProgress,
        'onboarding.focusAreaProgress': focusAreaProgress,
        'onboarding.improvingTopics': improvingTopics,
        'onboarding.decliningTopics': decliningTopics,
        'onboarding.lastUpdatedAt': new Date()
      };

      // Update user document
      await this.userModel.updateOne(
        { _id: userObjectId },
        { $set: updates }
      );

      // Log significant changes for monitoring
      const significantChanges = {
        recentlyImproved: recentlyImprovedAreas,
        newlyWeak: newlyWeakAreas,
        progressChange: Math.round(goalProgress.progressPercentage),
        weakAreasChange: newWeakAreas.length - currentWeakAreas.length
      };

      if (recentlyImprovedAreas.length > 0 || newlyWeakAreas.length > 0) {
        console.log(`Significant goal progress changes for user ${userId}:`, significantChanges);
      }

      console.log(`Updated enhanced goal progress for user ${userId}:`, {
        targetScore,
        currentScore: Math.round(currentAverageScore),
        adjustedScore: Math.round(adjustedProgressScore),
        progressPercentage: goalProgress.progressPercentage,
        weakAreas: newWeakAreas.length,
        strongAreas: newStrongAreas.length,
        improvementRate: Math.round(adjustedImprovementRate)
      });

    } catch (error) {
      console.error('Error updating user goal progress:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly goal progress
   */
  private async calculateWeeklyGoalProgress(userId: string, weeklyGoal: number): Promise<any> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyAttempts = await this.attemptModel.countDocuments({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: oneWeekAgo },
      isCompleted: true
    });

    return {
      target: weeklyGoal,
      completed: weeklyAttempts,
      percentage: Math.min(100, Math.round((weeklyAttempts / weeklyGoal) * 100)),
      isOnTrack: weeklyAttempts >= weeklyGoal
    };
  }

  /**
   * Calculate improvement rate based on target score
   */
  private calculateImprovementRate(performances: any[], targetScore: number): number {
    const totalTopics = performances.length;
    const topicsAtTarget = performances.filter(p => p.averageScore >= targetScore).length;
    return totalTopics > 0 ? Math.round((topicsAtTarget / totalTopics) * 100) : 0;
  }

  /**
   * Calculate engagement level based on activity
   */
  private calculateEngagementLevel(totalAttempts: number, weeklyGoal: number): string {
    const expectedAttempts = weeklyGoal * 4; // Monthly expectation
    if (totalAttempts >= expectedAttempts * 1.5) return 'HIGH';
    if (totalAttempts >= expectedAttempts) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get comprehensive goal progress analysis
   */
  async getUserGoalProgress(userId: string): Promise<any> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      // Use aggregation to get user with goal progress - flattened structure
      const aggregationResult = await this.userModel.aggregate([
        { $match: { _id: userObjectId } },
        {
          $project: {
            // Flatten goalProgress fields to top level
            targetScore: { $ifNull: ['$onboarding.goalProgress.targetScore', '$onboarding.learningPreferences.targetScore', 75] },
            currentAverageScore: { $ifNull: ['$onboarding.goalProgress.currentAverageScore', 0] },
            adjustedProgressScore: { $ifNull: ['$onboarding.goalProgress.adjustedProgressScore', '$onboarding.goalProgress.currentAverageScore', 0] },
            progressPercentage: { $ifNull: ['$onboarding.goalProgress.progressPercentage', 0] },
            scoreGap: { $ifNull: ['$onboarding.goalProgress.scoreGap', 0] },
            topicsAtTarget: { $ifNull: ['$onboarding.goalProgress.topicsAtTarget', 0] },
            totalTopics: { $ifNull: ['$onboarding.goalProgress.totalTopics', 0] },
            weakAreasCount: { $ifNull: ['$onboarding.goalProgress.weakAreasCount', 0] },
            strongAreasCount: { $ifNull: ['$onboarding.goalProgress.strongAreasCount', 0] },
            recentlyImprovedCount: { $ifNull: ['$onboarding.goalProgress.recentlyImprovedCount', 0] },
            newlyWeakCount: { $ifNull: ['$onboarding.goalProgress.newlyWeakCount', 0] },
            weeklyGoalProgress: { $ifNull: ['$onboarding.goalProgress.weeklyGoalProgress', { target: 5, completed: 0, isOnTrack: false }] },
            improvementRate: { $ifNull: ['$onboarding.goalProgress.improvementRate', '$onboarding.progressMetrics.improvementRate', 0] },

            // Arrays
            focusAreaProgress: { $ifNull: ['$onboarding.focusAreaProgress', []] },
            weakAreas: { $ifNull: ['$onboarding.assessmentData.weakAreas', []] },
            strongAreas: { $ifNull: ['$onboarding.assessmentData.strongAreas', []] },
            improvingTopics: { $ifNull: ['$onboarding.improvingTopics', []] },
            decliningTopics: { $ifNull: ['$onboarding.decliningTopics', []] },
            recentlyImprovedAreas: { $ifNull: ['$onboarding.assessmentData.recentlyImprovedAreas', []] },
            newlyWeakAreas: { $ifNull: ['$onboarding.assessmentData.newlyWeakAreas', []] },

            // Additional fields
            focusAreas: { $ifNull: ['$onboarding.learningPreferences.focusAreas', []] },
            weeklyGoal: { $ifNull: ['$onboarding.learningPreferences.weeklyGoal', 5] }
          }
        }
      ]);

      const goalProgressData = aggregationResult[0] || {};

      // Debug logging
      console.log(`[getUserGoalProgress] User ${userId} goal progress data:`, {
        targetScore: goalProgressData.targetScore,
        currentAverageScore: goalProgressData.currentAverageScore,
        progressPercentage: goalProgressData.progressPercentage,
        totalTopics: goalProgressData.totalTopics,
        weakAreasCount: goalProgressData.weakAreasCount
      });

      // Ensure all required fields exist with defaults
      const finalResult = {
        targetScore: goalProgressData.targetScore || 75,
        currentAverageScore: goalProgressData.currentAverageScore || 0,
        adjustedProgressScore: goalProgressData.adjustedProgressScore || goalProgressData.currentAverageScore || 0,
        progressPercentage: goalProgressData.progressPercentage || 0,
        scoreGap: goalProgressData.scoreGap || 0,
        topicsAtTarget: goalProgressData.topicsAtTarget || 0,
        totalTopics: goalProgressData.totalTopics || 0,
        weakAreasCount: goalProgressData.weakAreasCount || (goalProgressData.weakAreas?.length || 0),
        strongAreasCount: goalProgressData.strongAreasCount || (goalProgressData.strongAreas?.length || 0),
        recentlyImprovedCount: goalProgressData.recentlyImprovedCount || 0,
        newlyWeakCount: goalProgressData.newlyWeakCount || 0,
        weeklyGoalProgress: goalProgressData.weeklyGoalProgress || { target: 5, completed: 0, isOnTrack: false },
        focusAreaProgress: goalProgressData.focusAreaProgress || [],
        weakAreas: goalProgressData.weakAreas || [],
        strongAreas: goalProgressData.strongAreas || [],
        improvingTopics: goalProgressData.improvingTopics || [],
        decliningTopics: goalProgressData.decliningTopics || [],
        recentlyImprovedAreas: goalProgressData.recentlyImprovedAreas || [],
        newlyWeakAreas: goalProgressData.newlyWeakAreas || [],
        improvementRate: goalProgressData.improvementRate || 0
      };

      console.log(`[getUserGoalProgress] Returning result for user ${userId}:`, finalResult);
      return finalResult;
    } catch (error) {
      console.error('Error getting user goal progress:', error);
      return {};
    }
  }
}
