import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schema/quizzes.schema';
import { Question } from '../questions/schema/questions.schema';
import { UserPerformance } from '../performance/schema/performance.schema';
import { Attempt } from '../attempts/schema/attempts.schema';
import { User } from '../users/schema/user.schema';
import { Topic } from '../topics/schema/topics.schema';
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
  recommendedDifficulty?: 'beginner' | 'intermediate' | 'advanced';
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
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
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

      // Deduplicate question IDs
      const uniqueQIds = Array.from(new Set(createQuizDto.questionIds.map(String)));

      // Convert string IDs to ObjectId for MongoDB compatibility
      const quizData: any = {
        ...createQuizDto,
        topicId: new Types.ObjectId(createQuizDto.topicId),
        questionIds: uniqueQIds.map(id => new Types.ObjectId(id))
      };
      if ((createQuizDto as any).createdBy && Types.ObjectId.isValid((createQuizDto as any).createdBy)) {
        quizData.createdBy = new Types.ObjectId((createQuizDto as any).createdBy)
      }

      const newQuiz = new this.quizModel(quizData);
      try {
        const savedQuiz = await newQuiz.save();
        return await this.quizModel
          .findById(savedQuiz._id)
          .populate('topicId', 'topicName topicDescription')
          .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
          .exec();
      } catch (e: any) {
        // Handle unique sessionId conflict by returning existing
        if (e?.code === 11000 && createQuizDto.sessionId) {
          const existing = await this.quizModel
            .findOne({ sessionId: createQuizDto.sessionId })
            .populate('topicId', 'topicName topicDescription')
            .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
            .exec();
          if (existing) return existing as any;
        }
        throw e;
      }
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

  async getQuizzesBySubject(subjectId: string, limit: number = 10): Promise<Quiz[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    try {
      // Step 1: Find all topics that belong to the given subject
      const topics = await this.topicModel
        .find({ subjectId: new Types.ObjectId(subjectId) })
        .select('_id')
        .exec();

      if (topics.length === 0) {
        return []; // No topics found for this subject
      }

      // Step 2: Extract topic IDs
      const topicIds = topics.map(topic => topic._id);      // Step 3: Find quizzes that belong to any of these topics
      const quizzes = await this.quizModel
        .find({ topicId: { $in: topicIds } })
        .populate({
          path: 'topicId',
          select: 'topicName topicDescription subjectId',
          populate: {
            path: 'subjectId',
            select: 'subjectName subjectDescription'
          }
        })
        .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
        .limit(limit)
        .sort({ createdAt: -1 }) // Sort by newest first
        .exec();

      return quizzes;
    } catch (error) {
      console.error('Error getting quizzes by subject:', error);
      throw new BadRequestException(`Failed to get quizzes by subject: ${error.message}`);
    }
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

    if (quiz.questionIds.some(id => id.equals(new Types.ObjectId(questionId)))) {
      throw new BadRequestException('Question already exists in this quiz');
    }

    quiz.questionIds.push(new Types.ObjectId(questionId));
    quiz.questionIds = quiz.questionIds.filter((id, idx, arr) => arr.findIndex(x => x.equals(id)) === idx)
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
    console.log('🎯 [QUIZ GENERATION] Starting personalized quiz generation');
    console.log('📋 [CONFIG]', JSON.stringify(config, null, 2));

    try {
      // Step 1: Analyze user performance (we'll derive a difficulty key from this)
      console.log('📊 [ANALYSIS] Analyzing user performance for userId:', config.userId, 'topicId:', config.topicId);
      const userAnalysis = await this.analyzeUserPerformance(config.userId, config.topicId);
      console.log('📈 [ANALYSIS] User analysis result:', JSON.stringify(userAnalysis, null, 2));

      // Step 2: Create deterministic session ID including a difficulty key so same params reuse the same quiz
      const recommended = (userAnalysis.recommendedDifficulty || 'intermediate');
      const difficultyKey = recommended === 'beginner' ? 'Easy' : recommended === 'advanced' ? 'Hard' : 'Medium';
      const sessionId = this.generateDeterministicSessionId(config, difficultyKey);
      console.log('🔑 [SESSION] Generated session ID:', sessionId);

      // Step 3: Check cache first
      const cached = this.quizCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        console.log('💾 [CACHE] Found cached quiz, returning cached result');
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

      console.log('🔍 [CACHE] No cached quiz found, generating new quiz');

      // Step 4: Generate question selection strategy
      console.log('🎲 [STRATEGY] Creating question selection strategy');
      const strategy = this.createQuestionSelectionStrategy(userAnalysis, config);
      console.log('🎯 [STRATEGY] Strategy created:', JSON.stringify(strategy, null, 2));

      // Step 5: Select questions using deterministic algorithm
      console.log('🔍 [SELECTION] Selecting questions with strategy');
      let selectedQuestions = await this.selectQuestionsWithStrategy(strategy, sessionId, config.sessionType, config.subjectId);
      console.log(`📝 [SELECTION] Selected ${selectedQuestions.length} questions using strategy`);

      // Fallback: If no questions found, try to fetch any active questions for topic
      if (selectedQuestions.length === 0) {
        console.warn(`⚠️ [FALLBACK] No questions found by strategy for topic ${config.topicId}. Trying fallback: any active questions for topic.`);
        selectedQuestions = await this.questionModel.find({
          topicId: new Types.ObjectId(config.topicId),
          isActive: true
        }).limit(config.questionsCount).exec();
        console.log(`📝 [FALLBACK] Found ${selectedQuestions.length} questions for topic ${config.topicId}`);
      }
      // Fallback: If still none, try any active questions for subject
      if (selectedQuestions.length === 0 && config.subjectId) {
        console.warn(`⚠️ [FALLBACK] No questions found for topic. Trying fallback: any active questions for subject ${config.subjectId}.`);
        // Find all topics for subject
        const topics = await this.topicModel.find({ subjectId: new Types.ObjectId(config.subjectId) }).select('_id').exec();
        console.log(`📚 [FALLBACK] Found ${topics.length} topics for subject ${config.subjectId}`);
        const topicIds = topics.map(t => t._id);
        if (topicIds.length > 0) {
          selectedQuestions = await this.questionModel.find({
            topicId: { $in: topicIds },
            isActive: true
          }).limit(config.questionsCount).exec();
          console.log(`📝 [FALLBACK] Found ${selectedQuestions.length} questions across all topics in subject`);
        }
      }

      console.log(`🎯 [FINAL] Total questions selected: ${selectedQuestions.length}`);

      if (selectedQuestions.length === 0) {
        console.error('❌ [ERROR] No questions available for the specified criteria (including fallback)');
        console.log('🔍 [DEBUG] Search criteria used:');
        console.log('   - Topic ID:', config.topicId);
        console.log('   - Subject ID:', config.subjectId);
        console.log('   - Questions requested:', config.questionsCount);

        // Let's check what questions exist in the database
        const totalQuestions = await this.questionModel.countDocuments({ isActive: true });
        console.log(`📊 [DEBUG] Total active questions in database: ${totalQuestions}`);

        const questionsForTopic = await this.questionModel.countDocuments({
          topicId: new Types.ObjectId(config.topicId),
          isActive: true
        });
        console.log(`📊 [DEBUG] Active questions for topic ${config.topicId}: ${questionsForTopic}`);

        if (config.subjectId) {
          const questionsForSubject = await this.questionModel.countDocuments({
            subjectId: new Types.ObjectId(config.subjectId),
            isActive: true
          });
          console.log(`📊 [DEBUG] Active questions for subject ${config.subjectId}: ${questionsForSubject}`);
        }

        throw new BadRequestException('No questions available for the specified criteria (including fallback)');
      }

      // Step 6: Before creating, check for existing quiz for same user/topic/session signature
      // We key on sessionId (deterministic hash) to prevent duplicates for same parameters
      const existingQuiz = await this.quizModel.findOne({ sessionId }).exec();
      if (existingQuiz) {
        console.log('♻️ [QUIZ] Returning existing quiz for sessionId:', sessionId)
        return {
          quiz: existingQuiz,
          questions: selectedQuestions,
          metadata: {
            userLevel: 0,
            difficultyDistribution: {} as Record<DifficultyLevel, number>,
            focusAreas: [],
            sessionId,
            isRepeatedSession: true
          }
        }
      }

      // Step 7: Create the quiz
      console.log('🏗️ [QUIZ] Creating personalized quiz');
      const quiz = await this.createPersonalizedQuiz(config, selectedQuestions, sessionId);
      console.log('✅ [QUIZ] Quiz created successfully:', quiz ? 'Yes' : 'No');

      // Step 7: Cache the result
      console.log('💾 [CACHE] Caching quiz result');
      this.quizCache.set(sessionId, {
        quiz,
        questions: selectedQuestions,
        timestamp: Date.now()
      });

      console.log('🎉 [SUCCESS] Personalized quiz generation completed');
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
  private generateDeterministicSessionId(config: PersonalizedQuizConfig, difficultyKey?: string): string {
    const normalizedConfig = {
      userId: config.userId,
      topicId: config.topicId,
      subjectId: config.subjectId,
      questionsCount: config.questionsCount,
      sessionType: config.sessionType,
      timeLimit: Math.round((config.timeLimit || 30) / 5) * 5,
      difficultyKey: difficultyKey || 'default'
    };

    const configString = JSON.stringify(normalizedConfig, Object.keys(normalizedConfig).sort());
    return crypto.createHash('sha256').update(configString).digest('hex').substring(0, 16);
  }

  /**
   * Comprehensive user performance analysis
   */
  async analyzeUserPerformance(userId: string, topicId: string): Promise<UserAnalysis> {
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

      // Add recommended difficulty based on performance (using backend enum values)
      let recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
      if (masteryScore < 40 || consistencyScore < 0.5) {
        recommendedDifficulty = 'beginner';
      } else if (masteryScore > 80 && consistencyScore > 0.8) {
        recommendedDifficulty = 'advanced';
      }

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
        streakCount: this.calculateStreakCount(recentAttempts),
        recommendedDifficulty
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
        streakCount: 0,
        recommendedDifficulty: 'intermediate'
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
    sessionId: string,
    sessionType?: string,
    subjectId?: string
  ): Promise<Question[]> {
    console.log('🎲 [STRATEGY] Starting question selection with strategy');
    console.log('🔑 [STRATEGY] Session ID:', sessionId);
    console.log('📊 [STRATEGY] Difficulty distribution:', strategy.difficultyDistribution);

    const seed = this.generateSeedFromSessionId(sessionId);
    const rng = this.createSeededRNG(seed);
    const selectedQuestions: Question[] = [];

    // Get recent question IDs to avoid
    let recentQuestionIds: string[] = [];
    // For onboarding/assessment, do NOT avoid recent questions (new users have no history)
    if (sessionType !== 'assessment') {
      recentQuestionIds = strategy.avoidRecentQuestions
        ? await this.getRecentQuestionIds(strategy.userId, strategy.topicId, 20)
        : [];
    }
    console.log(`🚫 [STRATEGY] Avoiding ${recentQuestionIds.length} recent questions`);

    // Select questions for each difficulty level
    for (const [difficulty, count] of Object.entries(strategy.difficultyDistribution)) {
      if (count > 0) {
        console.log(`🔍 [STRATEGY] Looking for ${count} questions of difficulty: ${difficulty}`);
        const questions = await this.getQuestionsForDifficulty(
          strategy.topicId,
          difficulty as DifficultyLevel,
          count * 3, // Get more than needed for selection
          recentQuestionIds
        );
        console.log(`📝 [STRATEGY] Topic ${strategy.topicId}, Difficulty ${difficulty}: Found ${questions.length} questions (excluding recent: ${recentQuestionIds.length})`);
        if (questions.length > 0) {
          const selected = this.selectQuestionsWithSeededRandom(questions, count, rng);
          console.log(`✅ [STRATEGY] Selected ${selected.length} questions for difficulty ${difficulty}`);
          selectedQuestions.push(...selected);
        } else {
          console.warn(`⚠️ [STRATEGY] No questions found for difficulty ${difficulty}`);
        }
      }
    }

    console.log(`📊 [STRATEGY] Total questions selected so far: ${selectedQuestions.length}`);

    // If not enough questions, fill with any active questions for topic
    const totalNeeded = Object.values(strategy.difficultyDistribution).reduce((a, b) => a + b, 0);
    console.log(`🎯 [FALLBACK] Total questions needed: ${totalNeeded}, Currently have: ${selectedQuestions.length}`);

    if (selectedQuestions.length < totalNeeded) {
      const needed = totalNeeded - selectedQuestions.length;
      console.log(`🔄 [FALLBACK] Need ${needed} more questions, searching for any active questions for topic...`);

      const fallbackQuestions = await this.questionModel.find({
        topicId: new Types.ObjectId(strategy.topicId),
        isActive: true
      }).limit(needed).exec();

      console.log(`📝 [FALLBACK] Found ${fallbackQuestions.length} fallback questions for topic`);
      console.log(`🔍 [FALLBACK] Fallback questions details:`, fallbackQuestions.map(q => ({
        id: q._id,
        difficulty: q.questionDifficulty,
        text: q.questionText?.substring(0, 50) + '...'
      })));

      selectedQuestions.push(...fallbackQuestions);
      console.log(`📊 [FALLBACK] Total questions after topic fallback: ${selectedQuestions.length}`);
    }

    // If still not enough, fill with any active questions for subject
    if (selectedQuestions.length < totalNeeded && subjectId) {
      const needed = totalNeeded - selectedQuestions.length;
      console.log(`🔄 [SUBJECT-FALLBACK] Still need ${needed} more questions, searching across entire subject...`);

      const topics = await this.topicModel.find({ subjectId: new Types.ObjectId(subjectId) }).select('_id').exec();
      const topicIds = topics.map(t => t._id);
      console.log(`📚 [SUBJECT-FALLBACK] Found ${topics.length} topics in subject ${subjectId}`);

      if (topicIds.length > 0) {
        const subjectFallbackQuestions = await this.questionModel.find({
          topicId: { $in: topicIds },
          isActive: true
        }).limit(needed).exec();

        console.log(`📝 [SUBJECT-FALLBACK] Found ${subjectFallbackQuestions.length} questions across subject`);
        selectedQuestions.push(...subjectFallbackQuestions);
        console.log(`📊 [SUBJECT-FALLBACK] Total questions after subject fallback: ${selectedQuestions.length}`);
      }
    }

    // Final result
    console.log(`🎯 [FINAL-SELECTION] Final question count: ${selectedQuestions.length}`);
    console.log(`📋 [FINAL-SELECTION] Final questions summary:`, selectedQuestions.map(q => ({
      id: q._id,
      difficulty: q.questionDifficulty,
      text: q.questionText?.substring(0, 30) + '...'
    })));

    // Shuffle and return
    const shuffledQuestions = this.shuffleWithSeed(selectedQuestions, rng);
    console.log(`🔀 [SHUFFLE] Questions shuffled, returning ${shuffledQuestions.length} questions`);
    return shuffledQuestions;
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
    console.log(`🔍 [DIFFICULTY] Searching for questions:`);
    console.log(`   - Topic ID: ${topicId}`);
    console.log(`   - Difficulty: ${difficulty}`);
    console.log(`   - Limit: ${limit}`);
    console.log(`   - Excluding: ${excludeIds.length} questions`);

    try {
      const filter: any = {
        topicId: new Types.ObjectId(topicId),
        questionDifficulty: difficulty
      };

      if (excludeIds.length > 0) {
        filter._id = { $nin: excludeIds.map(id => new Types.ObjectId(id)) };
      }

      console.log(`🔎 [DIFFICULTY] MongoDB filter:`, JSON.stringify(filter, null, 2));

      const questions = await this.questionModel
        .find(filter)
        .limit(limit)
        .exec();

      console.log(`📝 [DIFFICULTY] Found ${questions.length} questions for difficulty ${difficulty}`);

      // Let's also check what questions exist without the difficulty filter
      const allQuestionsForTopic = await this.questionModel.countDocuments({
        topicId: new Types.ObjectId(topicId)
      });
      console.log(`📊 [DIFFICULTY] Total questions for topic ${topicId}: ${allQuestionsForTopic}`);

      // Let's see what difficulty values actually exist in the database
      const existingQuestions = await this.questionModel.find({
        topicId: new Types.ObjectId(topicId)
      }).select('questionDifficulty questionText').limit(5).exec();

      console.log(`🔍 [DIFFICULTY] Sample questions in database:`, existingQuestions.map(q => ({
        difficulty: q.questionDifficulty,
        text: q.questionText?.substring(0, 50) + '...'
      })));

      return questions;
    } catch (error) {
      console.error('❌ [DIFFICULTY] Error getting questions for difficulty:', error);
      return [];
    }
  }

  /**
   * Get questions by subject and difficulty for quiz generation
   */
  async getQuestionsBySubjectAndDifficulty(
    subjectId: string,
    difficulty: string,
    questionCount: number,
    topics?: string[]
  ): Promise<Question[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid subject ID format');
    }

    try {
      // Convert frontend difficulty to backend difficulty
      const backendDifficulty = difficulty.toUpperCase() as DifficultyLevel;
      
      // Step 1: Find topics that belong to the subject
      let topicFilter: any = { subjectId: new Types.ObjectId(subjectId) };
      
      // If specific topics are requested, filter by them
      if (topics && topics.length > 0) {
        const validTopicIds = topics.filter(id => Types.ObjectId.isValid(id));
        if (validTopicIds.length > 0) {
          topicFilter._id = { $in: validTopicIds.map(id => new Types.ObjectId(id)) };
        }
      }

      const topicsInSubject = await this.topicModel
        .find(topicFilter)
        .select('_id')
        .exec();

      if (topicsInSubject.length === 0) {
        console.log(`No topics found for subject ${subjectId}`);
        return [];
      }

      const topicIds = topicsInSubject.map(topic => topic._id);

      // Step 2: Find questions from these topics with the specified difficulty
      const questions = await this.questionModel
        .find({
          topicId: { $in: topicIds },
          questionDifficulty: backendDifficulty,
          isActive: true
        })
        .limit(questionCount * 2) // Get more than needed for randomization
        .exec();

      // Step 3: Randomly select the requested number of questions
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
      return shuffledQuestions.slice(0, questionCount);

    } catch (error) {
      console.error('Error getting questions by subject and difficulty:', error);
      throw new BadRequestException(`Failed to get questions: ${error.message}`);
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
      // Dedupe questions
      const uniqueQuestions = Array.from(new Set(questions.map(q => q._id.toString())))
        .map(id => questions.find(q => q._id.toString() === id)!)

      const createQuizDto: CreateQuizDto = {
        topicId: config.topicId,
        questionIds: uniqueQuestions.map(q => q._id.toString()),
        quizDifficulty: this.calculateOverallDifficulty(uniqueQuestions),
        quizType: this.mapSessionTypeToQuizType(config.sessionType),
        title: `Personalized ${config.sessionType} - ${sessionId.substring(0, 8)}`,
        description: `AI-generated personalized quiz based on your performance`,
        timeLimit: config.timeLimit || 30,
        sessionId,
        isPersonalized: true,
        personalizationMetadata: {
          userId: config.userId,
          generatedAt: new Date(),
          difficultyDistribution: {},
          focusAreas: []
        }
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

  /**
   * Count total questions available for a topic
   */
  async countQuestionsForTopic(topicId: string): Promise<number> {
    try {
      return await this.questionModel.countDocuments({
        topicId: new Types.ObjectId(topicId),
        isActive: true
      });
    } catch (error) {
      console.error('Error counting questions for topic:', error);
      return 0;
    }
  }

  /**
   * Get topics that have questions available for practice
   */
  async getTopicsWithQuestions(subjectId: string): Promise<any[]> {
    try {
      // Get all topics for the subject
      const topics = await this.topicModel.find({
        subjectId: new Types.ObjectId(subjectId)
      }).exec();

      // Check which topics have questions
      const topicsWithQuestions: any[] = [];
      for (const topic of topics) {
        const questionCount = await this.questionModel.countDocuments({
          topicId: topic._id,
          isActive: true
        });

        if (questionCount > 0) {
          topicsWithQuestions.push({
            id: topic._id.toString(),
            name: topic.topicName,
            description: topic.topicDescription,
            questionCount,
            difficulty: (topic as any).difficulty || 'Medium'
          });
        }
      }

      return topicsWithQuestions;
    } catch (error) {
      console.error('Error getting topics with questions:', error);
      return [];
    }
  }

  /**
   * Find existing quiz for topic and difficulty
   */
  async findTopicQuiz(topicId: string, subjectId: string, difficulty: string): Promise<any> {
    try {
      return await this.quizModel.findOne({
        topicId: new Types.ObjectId(topicId),
        subjectId: new Types.ObjectId(subjectId),
        quizDifficulty: difficulty,
        isActive: true
      }).exec();
    } catch (error) {
      console.error('Error finding topic quiz:', error);
      return null;
    }
  }

  /**
   * Save generated quiz to database
   */
  async saveGeneratedQuiz(quizData: {
    title: string;
    topicId: string;
    subjectId: string;
    difficulty: string;
    questions: any[];
    timeLimit: number;
    xpReward: number;
    createdBy: string;
  }): Promise<any> {
    try {
      const quiz = new this.quizModel({
        title: quizData.title,
        topicId: new Types.ObjectId(quizData.topicId),
        subjectId: new Types.ObjectId(quizData.subjectId),
        quizDifficulty: quizData.difficulty,
        questions: quizData.questions,
        timeLimit: quizData.timeLimit,
        xpReward: quizData.xpReward,
        createdBy: new Types.ObjectId(quizData.createdBy),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return await quiz.save();
    } catch (error) {
      console.error('Error saving generated quiz:', error);
      throw error;
    }
  }

  /**
   * Generate assessment questions using optimized aggregation pipeline
   */
  async generateAssessmentWithAggregation(subjectIds: string[], count: number = 15): Promise<any[]> {
    try {
      console.log(`[generateAssessmentWithAggregation] Starting optimized assessment generation for ${subjectIds.length} subjects`);
      const startTime = Date.now();
      
      const validSubjectIds = subjectIds
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));

      if (validSubjectIds.length === 0) {
        throw new BadRequestException('No valid subject IDs provided.');
      }

      // Simplified and reliable aggregation pipeline for assessment generation
      const questions = await this.questionModel.aggregate([
        // Match active questions from selected subjects
        { 
          $match: { 
            subjectId: { $in: validSubjectIds }, 
            isActive: true 
          } 
        },
        // Add random field for shuffling
        {
          $addFields: {
            randomField: { $rand: {} }
          }
        },
        // Sort by random field for shuffling
        { $sort: { randomField: 1 } },
        // Group by subject for balanced distribution
        {
          $group: {
            _id: '$subjectId',
            questions: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        // Take proportional questions from each subject
        {
          $project: {
            _id: 1,
            questions: {
              $slice: [
                '$questions',
                { $ceil: { $divide: [count, validSubjectIds.length] } }
              ]
            }
          }
        },
        { $unwind: '$questions' },
        { $replaceRoot: { newRoot: '$questions' } },
        // Remove the random field
        { $unset: ['randomField'] },
        // Populate related data efficiently
        {
          $lookup: {
            from: 'topics',
            localField: 'topicId',
            foreignField: '_id',
            as: 'topicData',
            pipeline: [{ $project: { topicName: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subjectData',
            pipeline: [{ $project: { subjectName: 1 } }]
          }
        },
        // Transform to expected format
        {
          $addFields: {
            'topicId.topicName': { $arrayElemAt: ['$topicData.topicName', 0] },
            'subjectId.subjectName': { $arrayElemAt: ['$subjectData.subjectName', 0] }
          }
        },
        { $unset: ['topicData', 'subjectData'] },
        // Final random selection using sample
        { $sample: { size: Math.min(count, 50) } } // Limit to prevent errors
      ]).exec();

      console.log(`[generateAssessmentWithAggregation] Completed in ${Date.now() - startTime}ms, returning ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('Error in generateAssessmentWithAggregation:', error);
      
      // Fallback to simple query if aggregation fails
      try {
        console.log('[generateAssessmentWithAggregation] Falling back to simple query');
        const fallbackQuestions = await this.questionModel
          .find({ 
            subjectId: { $in: subjectIds }, 
            isActive: true 
          })
          .populate('topicId', 'topicName')
          .populate('subjectId', 'subjectName')
          .limit(count * 2)
          .exec();
        
        // Shuffle and limit the results
        const shuffled = fallbackQuestions.sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, count);
        
        console.log(`[generateAssessmentWithAggregation] Fallback completed, returning ${result.length} questions`);
        return result;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new BadRequestException(`Failed to generate assessment: ${error.message}`);
      }
    }
  }
}
