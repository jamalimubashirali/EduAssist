import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attempt } from './schema/attempts.schema';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { Topic } from '../topics/schema/topics.schema';
import { User } from '../users/schema/user.schema';
import { Recommendation } from '../recommendations/schema/recommendations.schema';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<Recommendation>,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  async create(createAttemptDto: CreateAttemptDto): Promise<Attempt | null> {
    try {
      // Validate ObjectId formats
      if (!Types.ObjectId.isValid(createAttemptDto.userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!Types.ObjectId.isValid(createAttemptDto.quizId)) {
        throw new BadRequestException('Invalid quiz ID format');
      }
      if (!Types.ObjectId.isValid(createAttemptDto.topicId)) {
        throw new BadRequestException('Invalid topic ID format');
      }

      // Derive subjectId from topic if missing
      let resolvedSubject: Types.ObjectId | undefined = undefined;
      if (!createAttemptDto.subjectId && createAttemptDto.topicId) {
        try {
          const topicDoc: any = await this.topicModel
            .findById(createAttemptDto.topicId)
            .exec();
          if (topicDoc?.subjectId) {
            resolvedSubject = topicDoc.subjectId as Types.ObjectId;
          }
        } catch (e) {
          console.warn(
            '[AttemptsService] Failed to derive subjectId from topic:',
            e?.message || e,
          );
        }
      }

      const attemptData = {
        ...createAttemptDto,
        userId: new Types.ObjectId(createAttemptDto.userId),
        quizId: new Types.ObjectId(createAttemptDto.quizId),
        topicId: new Types.ObjectId(createAttemptDto.topicId),
        subjectId: createAttemptDto.subjectId
          ? new Types.ObjectId(createAttemptDto.subjectId)
          : resolvedSubject,
        startedAt: new Date(),
        answersRecorded: [],
        isCompleted: false,
      };

      const newAttempt = new this.attemptModel(attemptData);
      const savedAttempt = await newAttempt.save();

      return await this.attemptModel
        .findById(savedAttempt._id)
        .populate('userId', 'name email')
        .populate('quizId', 'title description')
        .populate('topicId', 'topicName')
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create attempt: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Attempt[]> {
    return await this.attemptModel
      .find()
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .populate('topicId', 'topicName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Attempt> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('quizId', 'title description')
      .populate('topicId', 'topicName')
      .populate(
        'answersRecorded.questionId',
        'questionText answerOptions correctAnswer',
      )
      .exec();

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  async findByUser(userId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return await this.attemptModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('quizId', 'title')
      .populate('topicId', 'topicName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByQuiz(quizId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('Invalid quiz ID format');
    }

    return await this.attemptModel
      .find({ quizId: new Types.ObjectId(quizId) })
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserAndTopic(
    userId: string,
    topicId: string,
  ): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid user ID or topic ID format');
    }

    return await this.attemptModel
      .find({
        userId: new Types.ObjectId(userId),
        topicId: new Types.ObjectId(topicId),
      })
      .populate('quizId', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async submitAnswer(
    attemptId: string,
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<Attempt | null> {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.isCompleted) {
      throw new BadRequestException(
        'Cannot submit answer to completed attempt',
      );
    }

    // Check if question already answered
    const existingAnswerIndex = attempt.answersRecorded.findIndex(
      (answer) => answer.questionId.toString() === submitAnswerDto.questionId,
    );

    const answerRecord = {
      questionId: new Types.ObjectId(submitAnswerDto.questionId),
      selectedAnswer: submitAnswerDto.selectedAnswer,
      isCorrect: submitAnswerDto.isCorrect,
      timeSpent: submitAnswerDto.timeSpent || 0,
      answeredAt: new Date(),
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      attempt.answersRecorded[existingAnswerIndex] = answerRecord;
    } else {
      // Add new answer
      attempt.answersRecorded.push(answerRecord);
    }

    // Recalculate stats
    const correctAnswers = attempt.answersRecorded.filter(
      (answer) => answer.isCorrect,
    ).length;
    const totalQuestions = attempt.answersRecorded.length;

    attempt.correctAnswers = correctAnswers;
    attempt.totalQuestions = totalQuestions;
    attempt.percentageScore =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
    attempt.score = attempt.percentageScore;

    const savedAttempt = await attempt.save();

    return await this.attemptModel
      .findById(savedAttempt._id)
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .populate('answersRecorded.questionId', 'questionText correctAnswer')
      .exec();
  }

  async completeAttempt(id: string): Promise<Attempt | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel.findById(id);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.isCompleted) {
      throw new BadRequestException('Attempt already completed');
    }

    const completedAt = new Date();
    const timeTaken = Math.round(
      (completedAt.getTime() - attempt.startedAt.getTime()) / 1000,
    );

    // Ensure subjectId present on attempt by deriving from topic if missing
    let subjectIdForUpdate: Types.ObjectId | undefined =
      attempt.subjectId as any;
    if (!subjectIdForUpdate && attempt.topicId) {
      try {
        const topicDoc: any = await this.topicModel
          .findById(attempt.topicId)
          .exec();
        if (topicDoc?.subjectId) {
          subjectIdForUpdate = topicDoc.subjectId as Types.ObjectId;
        }
      } catch (e) {
        console.warn(
          '[AttemptsService] (complete) Failed to derive subjectId from topic:',
          e?.message || e,
        );
      }
    }

    // Generate comprehensive quiz analysis and recommendations
    const comprehensiveAnalysis =
      this.generateComprehensiveQuizAnalysis(attempt);

    const updateDoc: any = {
      isCompleted: true,
      completedAt,
      timeTaken,
      performanceMetrics: this.calculateEnhancedPerformanceMetrics(attempt),
      comprehensiveAnalysis: comprehensiveAnalysis,
    };
    if (subjectIdForUpdate) updateDoc.subjectId = subjectIdForUpdate;

    const updatedAttempt = await this.attemptModel
      .findByIdAndUpdate(id, updateDoc, { new: true })
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .populate('topicId', 'topicName')
      .exec();

    // Update user streak when completing attempt
    if (updatedAttempt) {
      try {
        console.log(
          '[AttemptsService] Updating user streak for attempt completion',
        );
        await this.updateUserStreakOnCompletion(
          updatedAttempt.userId.toString(),
        );
      } catch (error) {
        console.warn('Failed to update user streak:', error.message);
      }

      // Auto-generate intelligent recommendations after completing attempt
      try {
        await this.generateIntelligentRecommendationsForAttempt(updatedAttempt);
      } catch (error) {
        console.warn(
          'Failed to generate intelligent recommendations:',
          error.message,
        );
      }
    }
    return updatedAttempt;
  }

  // Enhanced recommendation generation for completed attempts
  private async generateIntelligentRecommendationsForAttempt(
    attempt: Attempt,
  ): Promise<void> {
    try {
      // Helper to safely extract a 24-char id string from populated docs or ObjectIds
      const toId = (v: any): string | undefined => {
        if (!v) return undefined;
        if (typeof v === 'string') return v;
        if (v._id) return String(v._id);
        if (v instanceof Types.ObjectId) return v.toString();
        if (Types.ObjectId.isValid(v)) return String(v);
        return undefined;
      };

      const userId = toId(attempt.userId);
      const topicId = toId(attempt.topicId);
      const subjectId = toId(attempt.subjectId);
      const score = attempt.score || 0;

      console.log(
        '[AttemptsService] generateIntelligentRecommendationsForAttempt context:',
        {
          userId,
          attemptId: attempt._id.toString(),
          subjectId,
          topicId,
          score,
        },
      );

      // Calculate user's average score for comparison
      const recentAttempts = await this.attemptModel
        .find({
          userId: attempt.userId,
          isCompleted: true,
          _id: { $ne: attempt._id },
        })
        .sort({ completedAt: -1 })
        .limit(10)
        .exec();

      const averageScore =
        recentAttempts.length > 0
          ? recentAttempts.reduce((sum, att) => sum + (att.score || 0), 0) /
            recentAttempts.length
          : score;

      // Generate recommendations using the RecommendationsService
      if (topicId && subjectId && userId) {
        try {
          await this.recommendationsService.generateRecommendationFromAttempt(
            userId,
            attempt._id.toString(),
            subjectId,
            topicId,
            score,
            averageScore,
          );
        } catch (error) {
          console.error('Error generating recommendation:', error);
        }
      }
    } catch (error) {
      console.error(
        'Error generating intelligent recommendations for attempt:',
        error,
      );
      throw error;
    }
  }

  // Generate comprehensive quiz analysis for completed attempts
  private generateComprehensiveQuizAnalysis(attempt: Attempt): any {
    const score = attempt.score || 0;
    const totalQuestions = attempt.totalQuestions || 0;
    const correctAnswers = attempt.correctAnswers || 0;
    const timeTaken = attempt.timeTaken || 0;

    // Determine proficiency level
    let proficiency = 'BEGINNER';
    if (score >= 80) proficiency = 'ADVANCED';
    else if (score >= 60) proficiency = 'INTERMEDIATE';

    return {
      score: score,
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      timeTaken: timeTaken,
      averageTimePerQuestion:
        totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : 0,
      accuracyRate:
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0,
      proficiency: proficiency,
      comprehensiveRecommendations: {
        performance_insights: {
          overall_performance: this.getQuizPerformanceInsight(score),
          accuracy_rate:
            totalQuestions > 0
              ? Math.round((correctAnswers / totalQuestions) * 100)
              : 0,
          improvement_potential: Math.max(0, 100 - score),
          next_level_target: Math.min(100, score + 15),
        },
        learning_path: {
          current_level: proficiency,
          recommended_next_steps: this.getQuizNextSteps(score, proficiency),
          estimated_time_to_next_level: this.estimateQuizTimeToNextLevel(
            score,
            proficiency,
          ),
        },
        practice_recommendations: {
          focus_areas: this.getQuizFocusAreas(
            score,
            correctAnswers,
            totalQuestions,
          ),
          practice_strategy: this.getQuizPracticeStrategy(
            score,
            totalQuestions,
            correctAnswers,
          ),
          daily_practice_goal: this.calculateDailyPracticeGoal(
            score,
            proficiency,
          ),
        },
        study_strategy: {
          recommended_strategies: this.getQuizStudyStrategies(proficiency),
          motivation_tips: this.getQuizMotivationTips(score),
        },
        improvement_areas: {
          priority_focus: this.getQuizPriorityFocus(
            score,
            correctAnswers,
            totalQuestions,
          ),
          improvement_timeline: this.generateQuizImprovementTimeline(score),
        },
      },
    };
  }

  private getQuizPerformanceInsight(score: number): string {
    if (score >= 90)
      return 'Exceptional performance! You demonstrate mastery of this quiz content.';
    if (score >= 80)
      return 'Strong performance! You have a solid understanding of the material.';
    if (score >= 70)
      return 'Good performance! You understand most concepts but have room for improvement.';
    if (score >= 60)
      return 'Satisfactory performance! Focus on strengthening your foundation.';
    if (score >= 50)
      return 'Below average performance. Review fundamental concepts and practice regularly.';
    return 'Needs improvement. Start with basic concepts and build up gradually.';
  }

  private getQuizNextSteps(score: number, proficiency: string): string[] {
    const steps: string[] = [];

    if (score < 60) {
      steps.push(
        'Review fundamental concepts before attempting similar quizzes',
      );
      steps.push('Practice with easier questions to build confidence');
      steps.push('Focus on understanding core principles');
    } else if (score < 80) {
      steps.push('Strengthen your knowledge with medium-difficulty practice');
      steps.push('Review mistakes and understand why they were wrong');
      steps.push('Practice time management for better efficiency');
    } else {
      steps.push('Challenge yourself with more difficult quizzes');
      steps.push('Help others learn by explaining concepts');
      steps.push('Focus on speed and accuracy optimization');
    }

    return steps;
  }

  private estimateQuizTimeToNextLevel(
    score: number,
    proficiency: string,
  ): number {
    if (proficiency === 'BEGINNER')
      return Math.max(2, Math.ceil((70 - score) / 10));
    if (proficiency === 'INTERMEDIATE')
      return Math.max(3, Math.ceil((85 - score) / 8));
    return Math.max(4, Math.ceil((95 - score) / 5));
  }

  private getQuizFocusAreas(
    score: number,
    correctAnswers: number,
    totalQuestions: number,
  ): string[] {
    const areas: string[] = [];
    if (score < 60) {
      areas.push('Fundamental concepts');
      areas.push('Basic problem-solving techniques');
      areas.push('Core principles');
    } else if (score < 80) {
      areas.push('Advanced problem-solving');
      areas.push('Time management');
      areas.push('Complex scenarios');
    } else {
      areas.push('Speed optimization');
      areas.push('Advanced techniques');
      areas.push('Teaching others');
    }
    return areas;
  }

  private getQuizPracticeStrategy(
    score: number,
    totalQuestions: number,
    correctAnswers: number,
  ): string {
    const errorRate = (totalQuestions - correctAnswers) / totalQuestions;
    if (errorRate > 0.4) return 'Focus on fundamentals and basic concepts';
    if (errorRate > 0.2)
      return 'Practice medium-difficulty questions with targeted review';
    return 'Challenge yourself with advanced problems and speed practice';
  }

  private calculateDailyPracticeGoal(
    score: number,
    proficiency: string,
  ): number {
    if (proficiency === 'BEGINNER')
      return Math.max(5, Math.ceil(10 - score / 10));
    if (proficiency === 'INTERMEDIATE')
      return Math.max(8, Math.ceil(15 - score / 8));
    return Math.max(12, Math.ceil(20 - score / 5));
  }

  private getQuizStudyStrategies(proficiency: string): string[] {
    const strategies: { [key: string]: string[] } = {
      BEGINNER: [
        'Start with fundamental concepts',
        'Use visual learning aids',
        'Practice with simple examples',
        'Build confidence with easy questions',
      ],
      INTERMEDIATE: [
        'Mix easy and challenging questions',
        'Focus on problem-solving techniques',
        'Practice time management',
        'Review mistakes thoroughly',
      ],
      ADVANCED: [
        'Tackle complex problems',
        'Teach concepts to others',
        'Focus on speed and accuracy',
        'Challenge yourself with difficult questions',
      ],
    };
    return strategies[proficiency] || strategies.INTERMEDIATE;
  }

  private getQuizMotivationTips(score: number): string[] {
    if (score >= 80)
      return [
        'Maintain your excellent performance',
        'Help others learn',
        'Set new challenging goals',
      ];
    if (score >= 60)
      return [
        "You're making good progress",
        'Focus on consistent improvement',
        'Celebrate small wins',
      ];
    return [
      'Every expert was once a beginner',
      'Focus on progress, not perfection',
      'Small improvements add up over time',
    ];
  }

  private getQuizPriorityFocus(
    score: number,
    correctAnswers: number,
    totalQuestions: number,
  ): string[] {
    const priorities: string[] = [];
    if (score < 60) {
      priorities.push('Understanding basic concepts');
      priorities.push('Building confidence through practice');
      priorities.push('Reviewing fundamental principles');
    } else if (score < 80) {
      priorities.push('Strengthening weak areas');
      priorities.push('Improving time management');
      priorities.push('Practicing problem-solving techniques');
    } else {
      priorities.push('Speed optimization');
      priorities.push('Advanced problem-solving');
      priorities.push('Teaching and mentoring others');
    }
    return priorities;
  }

  private generateQuizImprovementTimeline(score: number): any {
    return {
      immediate_focus:
        score < 60
          ? 'Address fundamental understanding'
          : 'Maintain current performance',
      short_term: '2-3 weeks: Build strong foundation',
      medium_term: '1-2 months: Achieve consistent performance',
      long_term: '3-6 months: Master advanced concepts',
    };
  }

  async update(
    id: string,
    updateAttemptDto: UpdateAttemptDto,
  ): Promise<Attempt> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const updatedAttempt = await this.attemptModel
      .findByIdAndUpdate(id, updateAttemptDto, { new: true })
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .populate('topicId', 'topicName')
      .exec();

    if (!updatedAttempt) {
      throw new NotFoundException('Attempt not found');
    }

    return updatedAttempt;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const result = await this.attemptModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Attempt not found');
    }
  }

  async getUserAttemptAnalytics(
    userId: string,
    topicId?: string,
  ): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    totalTimeSpent: number;
    improvementTrend: string;
    recentPerformance: any[];
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const filter: any = {
      userId: new Types.ObjectId(userId),
      isCompleted: true,
    };
    if (topicId && Types.ObjectId.isValid(topicId)) {
      filter.topicId = new Types.ObjectId(topicId);
    }

    const attempts = await this.attemptModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const totalAttempts = attempts.length;
    const scores = attempts.map((a) => a.score || 0);
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const bestScore = Math.max(...scores, 0);
    const totalTimeSpent = attempts.reduce(
      (sum, a) => sum + (a.timeTaken || 0),
      0,
    );

    // Calculate improvement trend
    const recentScores = scores.slice(0, 5);
    const olderScores = scores.slice(5, 10);
    let improvementTrend = 'Steady';

    if (recentScores.length > 0 && olderScores.length > 0) {
      const recentAvg =
        recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg =
        olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

      if (recentAvg > olderAvg + 5) improvementTrend = 'Improving';
      else if (recentAvg < olderAvg - 5) improvementTrend = 'Declining';
    }

    const recentPerformance = attempts.slice(0, 10).map((attempt) => ({
      date: attempt._id.getTimestamp(),
      score: attempt.score,
      timeTaken: attempt.timeTaken,
      quizTitle: attempt.quizId?.toString(), // Would be populated in real scenario
    }));

    return {
      totalAttempts,
      averageScore: Math.round(averageScore),
      bestScore,
      totalTimeSpent,
      improvementTrend,
      recentPerformance,
    };
  }

  private calculatePerformanceMetrics(attempt: Attempt): any {
    const answers = attempt.answersRecorded || [];
    const totalTime = answers.reduce(
      (sum, answer) => sum + (answer.timeSpent || 0),
      0,
    );
    const averageTimePerQuestion =
      answers.length > 0 ? totalTime / answers.length : 0;

    // Calculate streak count
    let streakCount = 0;
    for (const answer of answers) {
      if (answer.isCorrect) {
        streakCount++;
      } else {
        break;
      }
    }

    const timings = answers.map((a) => a.timeSpent || 0).filter((t) => t > 0);
    const fastestQuestion = timings.length > 0 ? Math.min(...timings) : 0;
    const slowestQuestion = timings.length > 0 ? Math.max(...timings) : 0;

    return {
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      streakCount,
      fastestQuestion,
      slowestQuestion,
      difficultyBreakdown: {}, // Would calculate based on question difficulties
    };
  }

  // Enhanced performance metrics calculation with comprehensive analytics
  private calculateEnhancedPerformanceMetrics(attempt: Attempt): any {
    const answers = attempt.answersRecorded || [];
    const totalTime = answers.reduce(
      (sum, answer) => sum + (answer.timeSpent || 0),
      0,
    );
    const averageTimePerQuestion =
      answers.length > 0 ? totalTime / answers.length : 0;

    // Calculate various streak patterns
    const streakCount = this.calculateCorrectStreak(answers);
    const longestStreak = this.calculateLongestStreak(answers);

    // Time analysis
    const timings = answers.map((a) => a.timeSpent || 0).filter((t) => t > 0);
    const fastestQuestion = timings.length > 0 ? Math.min(...timings) : 0;
    const slowestQuestion = timings.length > 0 ? Math.max(...timings) : 0;
    const timeVariance = this.calculateTimeVariance(timings);

    // Response pattern analysis
    const responsePatterns = this.analyzeResponsePatterns(answers);

    // Accuracy progression
    const accuracyProgression = this.calculateAccuracyProgression(answers);

    // Confidence indicators
    const confidenceMetrics = this.calculateConfidenceMetrics(answers, timings);

    return {
      // Basic metrics
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      streakCount,
      longestStreak,
      fastestQuestion,
      slowestQuestion,

      // Enhanced metrics
      timeVariance: Math.round(timeVariance),
      responsePatterns,
      accuracyProgression,
      confidenceMetrics,

      // Performance indicators
      consistencyScore: this.calculateConsistencyScore(answers, timings),
      efficiencyScore: this.calculateEfficiencyScore(answers, timings),
      improvementPotential: this.calculateImprovementPotential(attempt),

      // Difficulty breakdown (simulated)
      difficultyBreakdown: this.simulateDifficultyBreakdown(answers),
    };
  }

  // Calculate correct answer streak from start
  private calculateCorrectStreak(answers: any[]): number {
    let streak = 0;
    for (const answer of answers) {
      if (answer.isCorrect) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Calculate longest correct streak in the attempt
  private calculateLongestStreak(answers: any[]): number {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const answer of answers) {
      if (answer.isCorrect) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  // Calculate variance in response times
  private calculateTimeVariance(timings: number[]): number {
    if (timings.length < 2) return 0;

    const mean = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const squaredDifferences = timings.map((time) => Math.pow(time - mean, 2));
    return (
      squaredDifferences.reduce((sum, diff) => sum + diff, 0) / timings.length
    );
  }

  // Analyze response patterns for insights
  private analyzeResponsePatterns(answers: any[]): any {
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;

    // Calculate patterns in first vs second half
    const firstHalf = answers.slice(0, Math.floor(totalAnswers / 2));
    const secondHalf = answers.slice(Math.floor(totalAnswers / 2));

    const firstHalfAccuracy =
      firstHalf.length > 0
        ? (firstHalf.filter((a) => a.isCorrect).length / firstHalf.length) * 100
        : 0;
    const secondHalfAccuracy =
      secondHalf.length > 0
        ? (secondHalf.filter((a) => a.isCorrect).length / secondHalf.length) *
          100
        : 0;

    return {
      overallAccuracy: Math.round((correctAnswers / totalAnswers) * 100),
      firstHalfAccuracy: Math.round(firstHalfAccuracy),
      secondHalfAccuracy: Math.round(secondHalfAccuracy),
      improvementTrend:
        secondHalfAccuracy > firstHalfAccuracy
          ? 'IMPROVING'
          : secondHalfAccuracy < firstHalfAccuracy
            ? 'DECLINING'
            : 'STABLE',
      consistentPerformance:
        Math.abs(secondHalfAccuracy - firstHalfAccuracy) < 10,
    };
  }

  // Calculate accuracy progression throughout the attempt
  private calculateAccuracyProgression(answers: any[]): number[] {
    const progression: number[] = [];
    let correctCount = 0;

    for (let i = 0; i < answers.length; i++) {
      if (answers[i].isCorrect) correctCount++;
      progression.push(Math.round((correctCount / (i + 1)) * 100));
    }

    return progression;
  }

  // Calculate confidence metrics based on time and accuracy
  private calculateConfidenceMetrics(answers: any[], timings: number[]): any {
    const avgTime =
      timings.length > 0
        ? timings.reduce((sum, t) => sum + t, 0) / timings.length
        : 0;
    const correctAnswers = answers.filter((a) => a.isCorrect);
    const incorrectAnswers = answers.filter((a) => !a.isCorrect);

    // Quick correct answers suggest confidence
    const quickCorrectAnswers = correctAnswers.filter(
      (a) => (a.timeSpent || 0) < avgTime,
    ).length;
    const slowIncorrectAnswers = incorrectAnswers.filter(
      (a) => (a.timeSpent || 0) > avgTime,
    ).length;

    return {
      confidenceIndicator:
        quickCorrectAnswers > slowIncorrectAnswers
          ? 'HIGH'
          : quickCorrectAnswers === slowIncorrectAnswers
            ? 'MEDIUM'
            : 'LOW',
      quickCorrectCount: quickCorrectAnswers,
      slowIncorrectCount: slowIncorrectAnswers,
      averageResponseTime: Math.round(avgTime),
    };
  }

  // Calculate consistency score based on performance variation
  private calculateConsistencyScore(answers: any[], timings: number[]): number {
    const accuracyProgression = this.calculateAccuracyProgression(answers);
    const timeVariance = this.calculateTimeVariance(timings);

    // Lower variance = higher consistency
    const accuracyConsistency =
      100 - this.calculateVariance(accuracyProgression) / 10;
    const timeConsistency =
      timeVariance < 100 ? 80 : timeVariance < 500 ? 60 : 40;

    return Math.round((accuracyConsistency + timeConsistency) / 2);
  }

  // Calculate efficiency score (accuracy vs time)
  private calculateEfficiencyScore(answers: any[], timings: number[]): number {
    const accuracy =
      (answers.filter((a) => a.isCorrect).length / answers.length) * 100;
    const avgTime =
      timings.length > 0
        ? timings.reduce((sum, t) => sum + t, 0) / timings.length
        : 60;

    // Optimal time range: 15-45 seconds per question
    const timeEfficiency =
      avgTime < 15
        ? 70 // Too fast, might be guessing
        : avgTime <= 45
          ? 100 // Optimal range
          : avgTime <= 90
            ? 80 // Acceptable
            : 60; // Too slow

    return Math.round((accuracy + timeEfficiency) / 2);
  }

  // Calculate improvement potential based on current performance
  private calculateImprovementPotential(attempt: Attempt): number {
    const score = attempt.score || 0;
    const totalQuestions = attempt.totalQuestions || 0;
    const correctAnswers = attempt.correctAnswers || 0;

    // Higher potential for lower scores, adjusted by question count
    const scorePotential = Math.max(0, 100 - score);
    const volumePotential =
      totalQuestions < 10 ? 20 : totalQuestions < 20 ? 10 : 0;

    return Math.min(100, scorePotential + volumePotential);
  }

  // Simulate difficulty breakdown (in real implementation, this would use actual question difficulties)
  private simulateDifficultyBreakdown(answers: any[]): any {
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;

    // Simulate distribution based on performance
    const accuracy = (correctAnswers / totalAnswers) * 100;

    return {
      easy: {
        attempted: Math.floor(totalAnswers * 0.4),
        correct: Math.floor(correctAnswers * (accuracy > 70 ? 0.9 : 0.7)),
        accuracy: accuracy > 70 ? 90 : 70,
      },
      medium: {
        attempted: Math.floor(totalAnswers * 0.4),
        correct: Math.floor(correctAnswers * (accuracy > 60 ? 0.6 : 0.4)),
        accuracy: accuracy > 60 ? 60 : 40,
      },
      hard: {
        attempted: Math.floor(totalAnswers * 0.2),
        correct: Math.floor(correctAnswers * (accuracy > 80 ? 0.4 : 0.2)),
        accuracy: accuracy > 80 ? 40 : 20,
      },
    };
  }

  // Helper method to calculate variance for any array of numbers
  private calculateVariance(numbers: number[]): number {
    if (numbers.length < 2) return 0;

    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map((num) => Math.pow(num - mean, 2));
    return (
      squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length
    );
  }

  // Gamification methods
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const leaderboardData = await this.attemptModel.aggregate([
        {
          $match: {
            isCompleted: true,
            score: { $exists: true },
          },
        },
        {
          $group: {
            _id: '$userId',
            totalScore: { $sum: '$score' },
            averageScore: { $avg: '$score' },
            totalQuizzes: { $sum: 1 },
            totalTimeSpent: { $sum: '$timeSpent' },
            bestScore: { $max: '$score' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: '$userDetails',
        },
        {
          $project: {
            userId: '$_id',
            userName: '$userDetails.name',
            avatar: '$userDetails.avatar',
            level: {
              $add: [
                {
                  $floor: {
                    $sqrt: { $divide: ['$userDetails.xp_points', 100] },
                  },
                },
                1,
              ],
            },
            totalXP: '$userDetails.xp_points',
            averageScore: { $round: ['$averageScore', 1] },
            currentStreak: '$userDetails.streakCount',
            completedQuizzes: '$totalQuizzes',
            bestScore: '$bestScore',
            totalTimeSpent: '$totalTimeSpent',
          },
        },
        {
          $sort: {
            totalXP: -1,
            averageScore: -1,
          },
        },
        {
          $limit: limit,
        },
      ]);

      return leaderboardData.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }
  }

  async getUserLeaderboardPosition(userId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Get all users sorted by XP
      const allUsersRanked = await this.attemptModel.aggregate([
        {
          $match: {
            isCompleted: true,
          },
        },
        {
          $group: {
            _id: '$userId',
            totalQuizzes: { $sum: 1 },
            averageScore: { $avg: '$score' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: '$userDetails',
        },
        {
          $project: {
            userId: '$_id',
            userName: '$userDetails.name',
            totalXP: '$userDetails.xp_points',
            level: {
              $add: [
                {
                  $floor: {
                    $sqrt: { $divide: ['$userDetails.xp_points', 100] },
                  },
                },
                1,
              ],
            },
            averageScore: { $round: ['$averageScore', 1] },
            currentStreak: '$userDetails.streakCount',
            completedQuizzes: '$totalQuizzes',
          },
        },
        {
          $sort: {
            totalXP: -1,
            averageScore: -1,
          },
        },
      ]);

      const userIndex = allUsersRanked.findIndex(
        (user) => user.userId.toString() === userId,
      );

      if (userIndex === -1) {
        throw new NotFoundException('User not found in leaderboard');
      }

      // Get nearby users (2 above, 2 below)
      const start = Math.max(0, userIndex - 2);
      const end = Math.min(allUsersRanked.length, userIndex + 3);
      const nearbyUsers = allUsersRanked
        .slice(start, end)
        .map((user, index) => ({
          ...user,
          rank: start + index + 1,
        }));

      return {
        position: userIndex + 1,
        totalUsers: allUsersRanked.length,
        percentile: Math.max(
          1,
          100 - Math.round(((userIndex + 1) / allUsersRanked.length) * 100),
        ),
        user: {
          ...allUsersRanked[userIndex],
          rank: userIndex + 1,
        },
        nearbyUsers,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to get user leaderboard position: ${error.message}`,
      );
    }
  }

  // Update user streak when completing an attempt
  private async updateUserStreakOnCompletion(userId: string): Promise<void> {
    try {
      // Get user data
      const user = await this.userModel.findById(userId);
      if (!user) {
        console.warn(`User ${userId} not found for streak update`);
        return;
      }

      const today = new Date();
      const lastQuizDate = user.lastQuizDate
        ? new Date(user.lastQuizDate)
        : null;

      let streakCount = user.streakCount || 0;
      let longestStreak = user.longestStreak || 0;
      let dailyQuizCount = user.dailyQuizCount || 0;
      let weeklyQuizCount = user.weeklyQuizCount || 0;

      // Streak logic
      if (!lastQuizDate) {
        // First quiz ever
        streakCount = 1;
      } else if (this.isYesterday(lastQuizDate)) {
        // Continue streak from yesterday
        streakCount += 1;
      } else if (this.isToday(lastQuizDate)) {
        // Already completed today, no streak change but increment daily count
        dailyQuizCount += 1;
      } else {
        // Streak broken, start new streak
        streakCount = 1;
      }

      // Update longest streak
      longestStreak = Math.max(longestStreak, streakCount);

      // Daily/Weekly quiz count logic
      if (!lastQuizDate || !this.isToday(lastQuizDate)) {
        dailyQuizCount = 1;
      } else {
        dailyQuizCount += 1;
      }

      if (!lastQuizDate || this.isNewWeek(lastQuizDate)) {
        weeklyQuizCount = 1;
      } else {
        weeklyQuizCount += 1;
      }

      // Update user with streak and activity data
      await this.userModel.findByIdAndUpdate(userId, {
        streakCount,
        longestStreak,
        lastQuizDate: today,
        dailyQuizCount,
        weeklyQuizCount,
        totalQuizzesAttempted: (user.totalQuizzesAttempted || 0) + 1,
      });

      console.log(
        `[Streak Update] Updated user ${userId}: streak=${streakCount}, longest=${longestStreak}, daily=${dailyQuizCount}, weekly=${weeklyQuizCount}`,
      );
    } catch (error) {
      console.error('Error updating user streak on completion:', error);
    }
  }

  // Helper methods for date calculations
  private isToday(date: Date): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  }

  private isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);
    return yesterday.toDateString() === checkDate.toDateString();
  }

  private isNewWeek(lastDate: Date): boolean {
    const now = new Date();
    const last = new Date(lastDate);

    // Calculate the start of current week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    return last < startOfThisWeek;
  }
}
