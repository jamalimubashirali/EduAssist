import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schema/quizzes.schema';
import { Question } from '../questions/schema/questions.schema';
import { UserPerformance } from '../performance/schema/performance.schema';
import { Attempt } from '../attempts/schema/attempts.schema';
import { User } from '../users/schema/user.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { DifficultyLevel, QuizType, ProgressTrend } from 'common/enums';
import * as crypto from 'crypto';

export interface PersonalizedQuizConfig {
  userId: string;
  topicId: string;
  subjectId: string;
  questionsCount: number;
  sessionType: 'practice' | 'assessment' | 'adaptive';
  timeLimit?: number;
}

export interface QuizGenerationResult {
  quiz: Quiz | null;
  questions: Question[];
  metadata: {
    userLevel: number;
    difficultyDistribution: Record<DifficultyLevel, number>;
    focusAreas: string[];
    sessionId: string;
    isRepeatedSession: boolean;
  };
}

interface UserAnalysis {
  currentLevel: number;
  masteryScore: number;
  consistencyScore: number;
  progressTrend: ProgressTrend;
  weakAreas: DifficultyLevel[];
  strongAreas: DifficultyLevel[];
  totalAttempts: number;
  lastAttemptDate: Date;
  averageTimePerQuestion: number;
  streakCount: number;
}

interface QuestionSelectionStrategy {
  difficultyDistribution: Record<DifficultyLevel, number>;
  focusAreas: string[];
  questionTypes: string[];
  avoidRecentQuestions: boolean;
  adaptiveAdjustment: boolean;
  reinforcementTargets: string[];
  userId: string;
  topicId: string;
}

@Injectable()
export class QuizzesService {
  private quizCache = new Map<string, { quiz: Quiz | null; questions: Question[]; timestamp: number }>();

  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(UserPerformance.name) private performanceModel: Model<UserPerformance>,
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createQuizDto: CreateQuizDto): Promise<Quiz | null> {
    try {
      // Validate that all questionIds are valid ObjectIds
      const invalidIds = createQuizDto.questionIds.filter(id => !Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException('Invalid question IDs provided');
      }

      // Validate that topicId is a valid ObjectId
      if (!Types.ObjectId.isValid(createQuizDto.topicId)) {
        throw new BadRequestException('Invalid topic ID provided');
      }

      // Convert string IDs to ObjectId for MongoDB compatibility
      const quizData = {
        ...createQuizDto,
        topicId: new Types.ObjectId(createQuizDto.topicId),
        questionIds: createQuizDto.questionIds.map(id => new Types.ObjectId(id))
      };

      const newQuiz = new this.quizModel(quizData);
      const savedQuiz = await newQuiz.save();

      // Return the quiz with populated fields for consistency
      return await this.quizModel
        .findById(savedQuiz._id)
        .populate('topicId', 'topicName topicDescription')
        .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create quiz: ${error.message}`);
    }
  }

  async findAll(): Promise<Quiz[]> {
    return await this.quizModel
      .find()
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
  }

  async findById(id: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    const quiz = await this.quizModel
      .findById(id)
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
      
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  async findByTopic(topicId: string): Promise<Quiz[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    return await this.quizModel
      .find({ topicId })
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
  }

  async findByDifficulty(difficulty: string): Promise<Quiz[]> {
    return await this.quizModel
      .find({ quizDifficulty: difficulty })
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
  }

  async getQuizForAttempt(id: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    const quiz = await this.quizModel
      .findById(id)
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions') // Exclude correctAnswer for attempt
      .exec();
      
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

    async update(id: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid quiz ID format');
      }

      // Validate questionIds if provided
      if (updateQuizDto.questionIds) {
        const invalidIds = updateQuizDto.questionIds.filter(qid => !Types.ObjectId.isValid(qid));
        if (invalidIds.length > 0) {
          throw new BadRequestException('Invalid question IDs provided');
        }
      }

      const updatedQuiz = await this.quizModel
        .findByIdAndUpdate(id, updateQuizDto, { new: true })
        .populate('topicId', 'topicName topicDescription')
        .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
        .exec();

      if (!updatedQuiz) {
        throw new NotFoundException('Quiz not found');
      }
      return updatedQuiz;
    }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    const result = await this.quizModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Quiz not found');
    }
  }

  async addQuestionToQuiz(quizId: string, questionId: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException('Invalid quiz or question ID format');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.questionIds.includes(new Types.ObjectId(questionId))) {
      throw new BadRequestException('Question already exists in this quiz');
    }

    quiz.questionIds.push(new Types.ObjectId(questionId));
    return await quiz.save();
  }

  async removeQuestionFromQuiz(quizId: string, questionId: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException('Invalid quiz or question ID format');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    quiz.questionIds = quiz.questionIds.filter(id => !id.equals(new Types.ObjectId(questionId)));
    return await quiz.save();
  }

  /**
   * PERSONALIZED QUIZ GENERATION - Main Algorithm
   */
  async generatePersonalizedQuiz(config: PersonalizedQuizConfig): Promise<QuizGenerationResult> {
    try {
      // Step 1: Create deterministic session ID for consistency
      const sessionId = this.generateDeterministicSessionId(config);
      
      // Step 2: Check cache first
      const cached = this.quizCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return {
          quiz: cached.quiz,
          questions: cached.questions,
          metadata: {
            userLevel: 0, // Will be calculated
            difficultyDistribution: {} as Record<DifficultyLevel, number>,
            focusAreas: [],
            sessionId,
            isRepeatedSession: true
          }
        };
      }
      
      // Step 3: Analyze user performance
      const userAnalysis = await this.analyzeUserPerformance(config.userId, config.topicId);
      
      // Step 4: Generate question selection strategy
      const strategy = this.createQuestionSelectionStrategy(userAnalysis, config);
      
      // Step 5: Select questions using deterministic algorithm
      const selectedQuestions = await this.selectQuestionsWithStrategy(strategy, sessionId);
      
      if (selectedQuestions.length === 0) {
        throw new BadRequestException('No questions available for the specified criteria');
      }
      
      // Step 6: Create the quiz
      const quiz = await this.createPersonalizedQuiz(config, selectedQuestions, sessionId);
      
      // Step 7: Cache the result
      this.quizCache.set(sessionId, {
        quiz,
        questions: selectedQuestions,
        timestamp: Date.now()
      });
      
      return {
        quiz,
        questions: selectedQuestions,
        metadata: {
          userLevel: userAnalysis.currentLevel,
          difficultyDistribution: strategy.difficultyDistribution,
          focusAreas: strategy.focusAreas,
          sessionId,
          isRepeatedSession: false
        }
      };
    } catch (error) {
      console.error('Error generating personalized quiz:', error);
      throw new BadRequestException(`Failed to generate personalized quiz: ${error.message}`);
    }
  }

  /**
   * Generates deterministic session ID ensuring same quiz for same parameters
   */
  private generateDeterministicSessionId(config: PersonalizedQuizConfig): string {
    const normalizedConfig = {
      userId: config.userId,
      topicId: config.topicId,
      subjectId: config.subjectId,
      questionsCount: config.questionsCount,
      sessionType: config.sessionType,
      timeLimit: Math.round((config.timeLimit || 30) / 5) * 5
    };
    
    const configString = JSON.stringify(normalizedConfig, Object.keys(normalizedConfig).sort());
    return crypto.createHash('sha256').update(configString).digest('hex').substring(0, 16);
  }

  /**
   * Comprehensive user performance analysis
   */
  private async analyzeUserPerformance(userId: string, topicId: string): Promise<UserAnalysis> {
    try {
      const [topicPerformance, recentAttempts, user] = await Promise.all([
        this.performanceModel.findOne({ userId, topicId }).exec(),
        this.attemptModel.find({ userId, topicId })
          .sort({ createdAt: -1 })
          .limit(10)
          .exec(),
        this.userModel.findById(userId).exec()
      ]);

      const currentLevel = user?.level || 1;
      const masteryScore = topicPerformance?.averageScore || 0;
      const consistencyScore = this.calculateConsistency(recentAttempts);
      const weaknessAnalysis = await this.analyzeUserWeaknesses(userId, topicId);

      return {
        currentLevel,
        masteryScore,
        consistencyScore,
        progressTrend: topicPerformance?.progressTrend || ProgressTrend.STEADY,
        weakAreas: weaknessAnalysis.weakDifficulties,
        strongAreas: weaknessAnalysis.strongDifficulties,
        totalAttempts: topicPerformance?.totalAttempts || 0,
        lastAttemptDate: topicPerformance?.lastQuizAttempted || new Date(0),
        averageTimePerQuestion: this.calculateAverageTimePerQuestion(recentAttempts),
        streakCount: this.calculateStreakCount(recentAttempts)
      };
    } catch (error) {
      console.error('Error analyzing user performance:', error);
      // Return default analysis if error occurs
      return {
        currentLevel: 1,
        masteryScore: 0,
        consistencyScore: 0.5,
        progressTrend: ProgressTrend.STEADY,
        weakAreas: [],
        strongAreas: [],
        totalAttempts: 0,
        lastAttemptDate: new Date(0),
        averageTimePerQuestion: 60,
        streakCount: 0
      };
    }
  }

  /**
   * Calculate consistency score from recent attempts
   */
  private calculateConsistency(attempts: any[]): number {
    if (attempts.length < 2) return 0.5;
    
    const scores = attempts.map(a => a.score || 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalize consistency (lower deviation = higher consistency)
    return Math.max(0, 1 - (standardDeviation / 100));
  }

  /**
   * Analyze user's weak and strong areas
   */
  private async analyzeUserWeaknesses(userId: string, topicId: string): Promise<{
    weakDifficulties: DifficultyLevel[];
    strongDifficulties: DifficultyLevel[];
  }> {
    try {
      const attempts = await this.attemptModel
        .find({ userId, topicId })
        .populate('answersRecorded.questionId')
        .limit(50)
        .exec();

      const difficultyScores: Record<DifficultyLevel, number[]> = {
        [DifficultyLevel.EASY]: [],
        [DifficultyLevel.MEDIUM]: [],
        [DifficultyLevel.HARD]: []
      };

      // Aggregate performance by difficulty
      attempts.forEach(attempt => {
        attempt.answersRecorded?.forEach(answer => {
          if (answer.questionId && typeof answer.questionId === 'object') {
            const question = answer.questionId as any;
            const difficulty = question.questionDifficulty;
            const score = answer.isCorrect ? 100 : 0;
            
            if (difficultyScores[difficulty]) {
              difficultyScores[difficulty].push(score);
            }
          }
        });
      });

      const weakDifficulties: DifficultyLevel[] = [];
      const strongDifficulties: DifficultyLevel[] = [];

      Object.entries(difficultyScores).forEach(([difficulty, scores]) => {
        if (scores.length > 0) {
          const average = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (average < 60) {
            weakDifficulties.push(difficulty as DifficultyLevel);
          } else if (average > 80) {
            strongDifficulties.push(difficulty as DifficultyLevel);
          }
        }
      });

      return { weakDifficulties, strongDifficulties };
    } catch (error) {
      console.error('Error analyzing weaknesses:', error);
      return { weakDifficulties: [], strongDifficulties: [] };
    }
  }

  /**
   * Calculate average time per question
   */
  private calculateAverageTimePerQuestion(attempts: any[]): number {
    if (attempts.length === 0) return 60; // default 60 seconds
    
    const totalTime = attempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.answersRecorded?.length || 0), 0);
    
    return totalQuestions > 0 ? totalTime / totalQuestions : 60;
  }

  /**
   * Calculate streak count
   */
  private calculateStreakCount(attempts: any[]): number {
    let streak = 0;
    for (const attempt of attempts) {
      if (attempt.score >= 70) { // Consider 70+ as success
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Creates intelligent question selection strategy
   */
  private createQuestionSelectionStrategy(
    analysis: UserAnalysis, 
    config: PersonalizedQuizConfig
  ): QuestionSelectionStrategy {
    const difficultyDistribution = this.calculateDifficultyDistribution(analysis, config.questionsCount);
    const focusAreas = this.determineFocusAreas(analysis);

    return {
      difficultyDistribution,
      focusAreas,
      questionTypes: ['Multiple Choice'], // Can be expanded
      avoidRecentQuestions: true,
      adaptiveAdjustment: config.sessionType === 'adaptive',
      reinforcementTargets: analysis.weakAreas.map(w => w.toString()),
      userId: config.userId,
      topicId: config.topicId
    };
  }

  /**
   * Calculate optimal difficulty distribution
   */
  private calculateDifficultyDistribution(analysis: UserAnalysis, totalQuestions: number): Record<DifficultyLevel, number> {
    let easy = 0, medium = 0, hard = 0;

    if (analysis.masteryScore < 40 || analysis.consistencyScore < 0.6) {
      // Struggling user - focus on fundamentals
      easy = Math.ceil(totalQuestions * 0.7);
      medium = Math.ceil(totalQuestions * 0.25);
      hard = Math.max(1, totalQuestions - easy - medium);
    } else if (analysis.masteryScore < 70) {
      // Average user - balanced approach
      easy = Math.ceil(totalQuestions * 0.4);
      medium = Math.ceil(totalQuestions * 0.5);
      hard = Math.max(1, totalQuestions - easy - medium);
    } else if (analysis.masteryScore >= 85 && analysis.consistencyScore > 0.8) {
      // Advanced user - challenge focused
      easy = Math.ceil(totalQuestions * 0.1);
      medium = Math.ceil(totalQuestions * 0.4);
      hard = Math.max(1, totalQuestions - easy - medium);
    } else {
      // Good user - progressive approach
      easy = Math.ceil(totalQuestions * 0.25);
      medium = Math.ceil(totalQuestions * 0.6);
      hard = Math.max(1, totalQuestions - easy - medium);
    }

    // Ensure total matches requested count
    const total = easy + medium + hard;
    if (total !== totalQuestions) {
      const diff = totalQuestions - total;
      medium += diff; // Adjust medium difficulty
    }

    return {
      [DifficultyLevel.EASY]: Math.max(0, easy),
      [DifficultyLevel.MEDIUM]: Math.max(0, medium),
      [DifficultyLevel.HARD]: Math.max(0, hard)
    };
  }

  /**
   * Determine focus areas based on analysis
   */
  private determineFocusAreas(analysis: UserAnalysis): string[] {
    const areas: string[] = [];
    
    if (analysis.weakAreas.length > 0) {
      areas.push('weakness_reinforcement');
    }
    
    if (analysis.consistencyScore < 0.7) {
      areas.push('consistency_building');
    }
    
    if (analysis.streakCount > 5) {
      areas.push('challenge_progression');
    }
    
    return areas.length > 0 ? areas : ['general_practice'];
  }

  /**
   * Select questions using deterministic algorithm
   */
  private async selectQuestionsWithStrategy(
    strategy: QuestionSelectionStrategy,
    sessionId: string
  ): Promise<Question[]> {
    const seed = this.generateSeedFromSessionId(sessionId);
    const rng = this.createSeededRNG(seed);
    
    const selectedQuestions: Question[] = [];
    
    // Get recent question IDs to avoid
    const recentQuestionIds = strategy.avoidRecentQuestions 
      ? await this.getRecentQuestionIds(strategy.userId, strategy.topicId, 20)
      : [];

    // Select questions for each difficulty level
    for (const [difficulty, count] of Object.entries(strategy.difficultyDistribution)) {
      if (count > 0) {
        const questions = await this.getQuestionsForDifficulty(
          strategy.topicId,
          difficulty as DifficultyLevel,
          count * 3, // Get more than needed for selection
          recentQuestionIds
        );
        
        if (questions.length > 0) {
          const selected = this.selectQuestionsWithSeededRandom(questions, count, rng);
          selectedQuestions.push(...selected);
        }
      }
    }

    return this.shuffleWithSeed(selectedQuestions, rng);
  }

  /**
   * Get recent question IDs to avoid repetition
   */
  private async getRecentQuestionIds(userId: string, topicId: string, limit: number): Promise<string[]> {
    try {
      const recentAttempts = await this.attemptModel
        .find({ userId, topicId })
        .sort({ createdAt: -1 })
        .limit(5)
        .exec();

      const questionIds: string[] = [];
      recentAttempts.forEach(attempt => {
        attempt.answersRecorded?.forEach(answer => {
          if (answer.questionId) {
            questionIds.push(answer.questionId.toString());
          }
        });
      });

      return [...new Set(questionIds)].slice(0, limit);
    } catch (error) {
      console.error('Error getting recent question IDs:', error);
      return [];
    }
  }

  /**
   * Get questions for specific difficulty
   */
  private async getQuestionsForDifficulty(
    topicId: string,
    difficulty: DifficultyLevel,
    limit: number,
    excludeIds: string[]
  ): Promise<Question[]> {
    try {
      const filter: any = {
        topicId: new Types.ObjectId(topicId),
        questionDifficulty: difficulty
      };

      if (excludeIds.length > 0) {
        filter._id = { $nin: excludeIds.map(id => new Types.ObjectId(id)) };
      }

      return await this.questionModel
        .find(filter)
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error getting questions for difficulty:', error);
      return [];
    }
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRNG(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }

  /**
   * Generate seed from session ID
   */
  private generateSeedFromSessionId(sessionId: string): number {
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Select questions with seeded randomization
   */
  private selectQuestionsWithSeededRandom<T>(array: T[], count: number, rng: () => number): T[] {
    if (array.length <= count) return [...array];
    
    const shuffled = this.shuffleWithSeed([...array], rng);
    return shuffled.slice(0, count);
  }

  /**
   * Deterministic shuffle using seeded random
   */
  private shuffleWithSeed<T>(array: T[], rng: () => number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Create personalized quiz
   */
  private async createPersonalizedQuiz(
    config: PersonalizedQuizConfig,
    questions: Question[],
    sessionId: string
  ): Promise<Quiz | null> {
    try {
      const createQuizDto: CreateQuizDto = {
        topicId: config.topicId,
        questionIds: questions.map(q => q._id.toString()),
        quizDifficulty: this.calculateOverallDifficulty(questions),
        quizType: this.mapSessionTypeToQuizType(config.sessionType),
        title: `Personalized ${config.sessionType} - ${sessionId.substring(0, 8)}`,
        description: `AI-generated personalized quiz based on your performance`,
        timeLimit: config.timeLimit || 30
      };

      return await this.create(createQuizDto);
    } catch (error) {
      console.error('Error creating personalized quiz:', error);
      throw new BadRequestException('Failed to create personalized quiz');
    }
  }

  /**
   * Calculate overall difficulty from questions
   */
  private calculateOverallDifficulty(questions: Question[]): DifficultyLevel {
    const difficultyCounts = {
      [DifficultyLevel.EASY]: 0,
      [DifficultyLevel.MEDIUM]: 0,
      [DifficultyLevel.HARD]: 0
    };

    questions.forEach(q => {
      difficultyCounts[q.questionDifficulty]++;
    });

    // Return the difficulty with highest count
    const maxCount = Math.max(...Object.values(difficultyCounts));
    const predominantDifficulty = Object.keys(difficultyCounts).find(
      diff => difficultyCounts[diff as DifficultyLevel] === maxCount
    ) as DifficultyLevel;

    return predominantDifficulty || DifficultyLevel.MEDIUM;
  }

  /**
   * Map session type to quiz type
   */
  private mapSessionTypeToQuizType(sessionType: string): QuizType {
    switch (sessionType) {
      case 'practice': return QuizType.PRACTICE;
      case 'assessment': return QuizType.ASSESSMENT;
      case 'adaptive': return QuizType.CHALLENGE;
      default: return QuizType.PRACTICE;
    }
  }
}
