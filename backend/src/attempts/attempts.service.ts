import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attempt } from './schema/attempts.schema';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
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

      const attemptData = {
        ...createAttemptDto,
        userId: new Types.ObjectId(createAttemptDto.userId),
        quizId: new Types.ObjectId(createAttemptDto.quizId),
        topicId: new Types.ObjectId(createAttemptDto.topicId),
        subjectId: createAttemptDto.subjectId ? new Types.ObjectId(createAttemptDto.subjectId) : undefined,
        startedAt: new Date(),
        answersRecorded: [],
        isCompleted: false
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
      throw new BadRequestException(`Failed to create attempt: ${error.message}`);
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
      .populate('answersRecorded.questionId', 'questionText answerOptions correctAnswer')
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

  async findByUserAndTopic(userId: string, topicId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid user ID or topic ID format');
    }

    return await this.attemptModel
      .find({ 
        userId: new Types.ObjectId(userId),
        topicId: new Types.ObjectId(topicId)
      })
      .populate('quizId', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async submitAnswer(attemptId: string, submitAnswerDto: SubmitAnswerDto): Promise<Attempt | null> {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.isCompleted) {
      throw new BadRequestException('Cannot submit answer to completed attempt');
    }

    // Check if question already answered
    const existingAnswerIndex = attempt.answersRecorded.findIndex(
      answer => answer.questionId.toString() === submitAnswerDto.questionId
    );

    const answerRecord = {
      questionId: new Types.ObjectId(submitAnswerDto.questionId),
      selectedAnswer: submitAnswerDto.selectedAnswer,
      isCorrect: submitAnswerDto.isCorrect,
      timeSpent: submitAnswerDto.timeSpent || 0,
      answeredAt: new Date()
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      attempt.answersRecorded[existingAnswerIndex] = answerRecord;
    } else {
      // Add new answer
      attempt.answersRecorded.push(answerRecord);
    }

    // Recalculate stats
    const correctAnswers = attempt.answersRecorded.filter(answer => answer.isCorrect).length;
    const totalQuestions = attempt.answersRecorded.length;
    
    attempt.correctAnswers = correctAnswers;
    attempt.totalQuestions = totalQuestions;
    attempt.percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
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
    const timeTaken = Math.round((completedAt.getTime() - attempt.startedAt.getTime()) / 1000);

    const updatedAttempt = await this.attemptModel
      .findByIdAndUpdate(
        id,
        {
          isCompleted: true,
          completedAt,
          timeTaken,
          performanceMetrics: this.calculatePerformanceMetrics(attempt)
        },
        { new: true }
      )
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .populate('topicId', 'topicName')
      .exec();

    // Auto-generate recommendation after completing attempt
    if (updatedAttempt) {
      try {
        await this.generateRecommendationForAttempt(updatedAttempt);
      } catch (error) {
        console.warn('Failed to generate recommendation:', error.message);
      }
    }

    return updatedAttempt;
  }

  private async generateRecommendationForAttempt(attempt: Attempt): Promise<void> {
    // This would integrate with RecommendationsService
    // For now, we'll simulate the integration
    const recommendationData = {
      userId: attempt.userId.toString(),
      attemptId: attempt._id.toString(),
      subjectId: attempt.subjectId?.toString() || '',
      topicId: attempt.topicId.toString(),
      attemptScore: attempt.score || 0,
      averageScore: 65 // This would be calculated from user's performance
    };

    // In a real implementation, you would inject RecommendationsService
    // and call: await this.recommendationsService.generateRecommendationFromAttempt(...)
  }

  async update(id: string, updateAttemptDto: UpdateAttemptDto): Promise<Attempt> {
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

  async getUserAttemptAnalytics(userId: string, topicId?: string): Promise<{
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

    const filter: any = { userId: new Types.ObjectId(userId), isCompleted: true };
    if (topicId && Types.ObjectId.isValid(topicId)) {
      filter.topicId = new Types.ObjectId(topicId);
    }

    const attempts = await this.attemptModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const totalAttempts = attempts.length;
    const scores = attempts.map(a => a.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const bestScore = Math.max(...scores, 0);
    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);

    // Calculate improvement trend
    const recentScores = scores.slice(0, 5);
    const olderScores = scores.slice(5, 10);
    let improvementTrend = 'Steady';
    
    if (recentScores.length > 0 && olderScores.length > 0) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
      
      if (recentAvg > olderAvg + 5) improvementTrend = 'Improving';
      else if (recentAvg < olderAvg - 5) improvementTrend = 'Declining';
    }

    const recentPerformance = attempts.slice(0, 10).map(attempt => ({
      date: attempt._id.getTimestamp(),
      score: attempt.score,
      timeTaken: attempt.timeTaken,
      quizTitle: attempt.quizId?.toString() // Would be populated in real scenario
    }));

    return {
      totalAttempts,
      averageScore: Math.round(averageScore),
      bestScore,
      totalTimeSpent,
      improvementTrend,
      recentPerformance
    };
  }

  private calculatePerformanceMetrics(attempt: Attempt): any {
    const answers = attempt.answersRecorded || [];
    const totalTime = answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
    const averageTimePerQuestion = answers.length > 0 ? totalTime / answers.length : 0;

    // Calculate streak count
    let streakCount = 0;
    for (const answer of answers) {
      if (answer.isCorrect) {
        streakCount++;
      } else {
        break;
      }
    }

    const timings = answers.map(a => a.timeSpent || 0).filter(t => t > 0);
    const fastestQuestion = timings.length > 0 ? Math.min(...timings) : 0;
    const slowestQuestion = timings.length > 0 ? Math.max(...timings) : 0;

    return {
      averageTimePerQuestion: Math.round(averageTimePerQuestion),
      streakCount,
      fastestQuestion,
      slowestQuestion,
      difficultyBreakdown: {} // Would calculate based on question difficulties
    };
  }
}
