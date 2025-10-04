import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, Query, BadRequestException } from '@nestjs/common';
import { QuizzesService, PersonalizedQuizConfig, QuizGenerationResult } from './quizzes.service';
import { TopicsService } from '../topics/topics.service';
import { Request } from 'express';
import { Public } from 'common/decorators/public_endpoint.decorators';

@Controller('quizzes')
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly topicsService: TopicsService
  ) { }

  /**
   * Generate personalized quiz using AI algorithm
   */
  @Post('generate-personalized')
  @HttpCode(HttpStatus.CREATED)
  async generatePersonalizedQuiz(
    @Body() config: Omit<PersonalizedQuizConfig, 'userId'>,
    @Req() req: Request
  ): Promise<QuizGenerationResult> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // Validate required fields
      if (!config.topicId || !config.subjectId) {
        throw new BadRequestException('topicId and subjectId are required');
      }

      if (!config.questionsCount || config.questionsCount < 1 || config.questionsCount > 50) {
        throw new BadRequestException('questionsCount must be between 1 and 50');
      }

      const fullConfig: PersonalizedQuizConfig = {
        ...config,
        userId,
        questionsCount: config.questionsCount || 10,
        sessionType: config.sessionType || 'practice',
        timeLimit: config.timeLimit || 30
      };

      const result = await this.quizzesService.generatePersonalizedQuiz(fullConfig);

      return result;
    } catch (error) {
      console.error('Error in generatePersonalizedQuiz:', error);
      throw error;
    }
  }

  /**
   * Get optimal quiz parameters for a user and topic
   */
  @Get('optimal-parameters/:topicId')
  @HttpCode(HttpStatus.OK)
  async getOptimalQuizParameters(
    @Param('topicId') topicId: string,
    @Req() req: Request
  ): Promise<{
    recommendedQuestionCount: number;
    recommendedTimeLimit: number;
    recommendedDifficulty: string;
    recommendedSessionType: string;
    userInsights: {
      currentLevel: number;
      masteryScore: number;
      recommendationReason: string;
    };
  }> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // This would typically call a separate method in the service
      // For now, we'll return recommended defaults based on user analysis
      const userAnalysis = await this.quizzesService['analyzeUserPerformance'](userId, topicId);

      let recommendedQuestionCount = 10;
      let recommendedTimeLimit = 30;
      let recommendedDifficulty = 'Medium';
      let recommendedSessionType = 'practice';
      let recommendationReason = 'Standard practice session';

      // Adjust recommendations based on user performance
      if (userAnalysis.masteryScore < 40) {
        recommendedQuestionCount = 15;
        recommendedTimeLimit = 45;
        recommendedDifficulty = 'Easy';
        recommendationReason = 'Extended practice recommended to build fundamentals';
      } else if (userAnalysis.masteryScore > 80) {
        recommendedQuestionCount = 8;
        recommendedTimeLimit = 20;
        recommendedDifficulty = 'Hard';
        recommendedSessionType = 'challenge';
        recommendationReason = 'Challenge mode to maintain expertise';
      }

      return {
        recommendedQuestionCount,
        recommendedTimeLimit,
        recommendedDifficulty,
        recommendedSessionType,
        userInsights: {
          currentLevel: userAnalysis.currentLevel,
          masteryScore: userAnalysis.masteryScore,
          recommendationReason
        }
      };
    } catch (error) {
      console.error('Error getting optimal parameters:', error);
      throw new BadRequestException('Failed to get optimal quiz parameters');
    }
  }

  /**
   * Start adaptive learning session
   */
  @Post('adaptive-session')
  @HttpCode(HttpStatus.CREATED)
  async startAdaptiveSession(
    @Body() sessionConfig: {
      topicId: string;
      subjectId: string;
      targetDuration: number; // minutes
      difficultyPreference?: 'adaptive' | 'easy' | 'medium' | 'hard';
    },
    @Req() req: Request
  ): Promise<QuizGenerationResult> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // Calculate question count based on target duration
      const questionsCount = Math.max(5, Math.min(25, Math.floor(sessionConfig.targetDuration / 2)));

      const config: PersonalizedQuizConfig = {
        userId,
        topicId: sessionConfig.topicId,
        subjectId: sessionConfig.subjectId,
        questionsCount,
        sessionType: 'adaptive',
        timeLimit: sessionConfig.targetDuration
      };

      return await this.quizzesService.generatePersonalizedQuiz(config);
    } catch (error) {
      console.error('Error starting adaptive session:', error);
      throw new BadRequestException('Failed to start adaptive session');
    }
  }

  /**
   * Get user's quiz history with analytics
   */
  @Get('history/:topicId')
  @HttpCode(HttpStatus.OK)
  async getQuizHistory(
    @Param('topicId') topicId: string,
    @Query('limit') limit: string = '10',
    @Req() req: Request
  ): Promise<{
    quizzes: any[];
    analytics: {
      totalQuizzes: number;
      averageScore: number;
      improvementTrend: string;
      strongestDifficulty: string;
      weakestDifficulty: string;
    };
  }> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      // This would be implemented in the service
      // For now, return a basic structure
      return {
        quizzes: [],
        analytics: {
          totalQuizzes: 0,
          averageScore: 0,
          improvementTrend: 'Steady',
          strongestDifficulty: 'Medium',
          weakestDifficulty: 'Hard'
        }
      };
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw new BadRequestException('Failed to get quiz history');
    }
  }  /**
   * Get quizzes by subject
   */
  @Public()
  @Get('subject/:subjectId')
  @HttpCode(HttpStatus.OK)
  async getQuizzesBySubject(
    @Param('subjectId') subjectId: string,
    @Query('limit') limit: string = '10'
  ): Promise<any[]> {
    try {
      if (!subjectId) {
        throw new BadRequestException('Subject ID is required');
      }

      const limitNumber = parseInt(limit, 10) || 10;

      // Call service method to get quizzes by subject
      const quizzes = await this.quizzesService.getQuizzesBySubject(subjectId, limitNumber);

      return quizzes;
    } catch (error) {
      console.error('Error getting quizzes by subject:', error);
      throw new BadRequestException('Failed to get quizzes by subject');
    }
  }

  /**
   * Get all quizzes
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllQuizzes(
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0'
  ): Promise<any[]> {
    try {
      const limitNumber = parseInt(limit, 10) || 10;
      const offsetNumber = parseInt(offset, 10) || 0;

      // Get all quizzes with optional filters
      const quizzes = await this.quizzesService.findAll();

      // Apply filters if provided
      let filteredQuizzes = quizzes;
      if (subject) {
        // Filter by subject - this would need to be implemented based on your schema
        filteredQuizzes = filteredQuizzes.filter(quiz =>
          quiz.topicId && typeof quiz.topicId === 'object' &&
          'subjectId' in quiz.topicId
        );
      }
      if (difficulty) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.quizDifficulty === difficulty);
      }

      // Apply pagination
      const startIndex = offsetNumber;
      const endIndex = startIndex + limitNumber;

      return filteredQuizzes.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Error getting quizzes:', error);
      throw new BadRequestException('Failed to get quizzes');
    }
  }  /**
   * Generate quiz (simple generation endpoint)
   */
  @Public()
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateQuiz(
    @Body() request: {
      subject: string;
      difficulty: string;
      questionCount: number;
      topics?: string[];
    }
  ): Promise<any> {
    try {
      // Validate input
      if (!request.subject || !request.difficulty || !request.questionCount) {
        throw new BadRequestException('Subject, difficulty, and questionCount are required');
      }

      if (request.questionCount < 1 || request.questionCount > 50) {
        throw new BadRequestException('Question count must be between 1 and 50');
      }

      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(request.difficulty.toLowerCase())) {
        throw new BadRequestException('Difficulty must be easy, medium, or hard');
      }

      // Try to get real questions from the database
      console.log(`Generating quiz for subject: ${request.subject}, difficulty: ${request.difficulty}, count: ${request.questionCount}`);

      const realQuestions = await this.quizzesService.getQuestionsBySubjectAndDifficulty(
        request.subject,
        request.difficulty,
        request.questionCount,
        request.topics
      );

      let questions: any[] = [];

      if (realQuestions && realQuestions.length > 0) {
        // Convert real questions to frontend format
        questions = realQuestions.map((q, index) => ({
          id: q._id.toString(),
          text: q.questionText,
          options: q.answerOptions,
          correctAnswer: parseInt(q.correctAnswer),
          explanation: q.explanation || `This is the correct answer for question ${index + 1}.`,
          xpValue: this.calculateQuestionXP(q.questionDifficulty)
        }));

        console.log(`Found ${realQuestions.length} real questions from database`);
      } else {
        // Fallback to sample questions if no real questions found
        console.log('No real questions found, using sample questions as fallback');
        questions = this.generateSampleQuestions(request.subject, request.difficulty, request.questionCount);
      }

      // Return the quiz object directly (not wrapped in success/quiz structure)
      return {
        id: 'generated_' + Date.now(),
        title: `${request.subject.charAt(0).toUpperCase() + request.subject.slice(1)} Practice Quiz`,
        subject: request.subject,
        difficulty: request.difficulty,
        timeLimit: request.questionCount * 2, // 2 minutes per question
        questionCount: request.questionCount,
        questions,
        xpReward: this.calculateXpReward(request.difficulty, request.questionCount),
        metadata: {
          generatedAt: new Date().toISOString(),
          type: realQuestions.length > 0 ? 'database' : 'generated',
          topics: request.topics || [],
          questionsFromDatabase: realQuestions.length,
          totalQuestionsRequested: request.questionCount
        }
      };
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new BadRequestException('Failed to generate quiz');
    }
  }
  private calculateQuestionXP(difficulty: string): number {
    switch (difficulty.toUpperCase()) {
      case 'EASY':
        return 10;
      case 'MEDIUM':
        return 20;
      case 'HARD':
        return 30;
      default:
        return 10;
    }
  }
  private generateSampleQuestions(subject: string, difficulty: string, count: number): any[] {
    const questions: any[] = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `q_${Date.now()}_${i}`,
        text: `Sample ${subject} question ${i + 1} (${difficulty} level)`,
        options: [
          'Option A',
          'Option B',
          'Option C',
          'Option D'
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `This is a sample explanation for question ${i + 1}.`,
        xpValue: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      });
    }
    return questions;
  }

  private calculateXpReward(difficulty: string, questionCount: number): number {
    const baseXp = 10;
    const difficultyMultiplier = {
      'Easy': 1.0,
      'Medium': 1.5,
      'Hard': 2.0,
      'easy': 1.0,
      'medium': 1.5,
      'hard': 2.0
    };

    const multiplier = difficultyMultiplier[difficulty] || 1.0;
    return Math.round(baseXp * questionCount * multiplier);
  }

  /**
   * Get popular quizzes
   */
  @Public()
  @Get('popular')
  @HttpCode(HttpStatus.OK)
  async getPopularQuizzes(@Query('limit') limit: string = '10'): Promise<any[]> {
    try {
      const limitNumber = parseInt(limit, 10) || 10;

      // Get all quizzes and return the first few as "popular"
      const allQuizzes = await this.quizzesService.findAll();
      return allQuizzes.slice(0, limitNumber);
    } catch (error) {
      console.error('Error getting popular quizzes:', error);
      throw new BadRequestException('Failed to get popular quizzes');
    }
  }

  /**
   * Search quizzes
   */
  @Public()
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchQuizzes(
    @Query('q') query: string,
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit: string = '10'
  ): Promise<any[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const limitNumber = parseInt(limit, 10) || 10;

      // Get all quizzes and filter by search query
      const allQuizzes = await this.quizzesService.findAll();
      const filteredQuizzes = allQuizzes.filter(quiz =>
        quiz.title && quiz.title.toLowerCase().includes(query.toLowerCase())
      );

      // Apply additional filters
      let finalQuizzes = filteredQuizzes;
      if (subject) {
        finalQuizzes = finalQuizzes.filter(quiz =>
          quiz.topicId && typeof quiz.topicId === 'object'
        );
      }
      if (difficulty) {
        finalQuizzes = finalQuizzes.filter(quiz => quiz.quizDifficulty === difficulty);
      }

      return finalQuizzes.slice(0, limitNumber);
    } catch (error) {
      console.error('Error searching quizzes:', error);
      throw new BadRequestException('Failed to search quizzes');
    }
  }

  /**
   * Get recent quizzes
   */
  @Public()
  @Get('recent')
  @HttpCode(HttpStatus.OK)
  async getRecentQuizzes(@Query('limit') limit: string = '10'): Promise<any[]> {
    try {
      const limitNumber = parseInt(limit, 10) || 10;

      // Get all quizzes and return the most recent ones
      const allQuizzes = await this.quizzesService.findAll();

      // Sort by creation date (assuming there's a createdAt field)
      const sortedQuizzes = allQuizzes.sort((a, b) => {
        const dateA = (a as any).createdAt || new Date(0);
        const dateB = (b as any).createdAt || new Date(0);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return sortedQuizzes.slice(0, limitNumber);
    } catch (error) {
      console.error('Error getting recent quizzes:', error);
      throw new BadRequestException('Failed to get recent quizzes');
    }
  }

  /**
   * Get intelligent recommended quizzes for a user based on performance and weak areas
   */
  @Get('recommended/:userId')
  @HttpCode(HttpStatus.OK)
  async getRecommendedQuizzes(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '10'
  ): Promise<any[]> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const limitNumber = parseInt(limit, 10) || 10;
      console.log(`🎯 [QUIZ-REC] Getting intelligent quiz recommendations for user: ${userId}, limit: ${limitNumber}`);

      // Step 1: Get user's smart recommendations from the recommendation service
      const smartRecommendations = await this.quizzesService.getSmartQuizRecommendationsForUser(userId, limitNumber);

      if (smartRecommendations && smartRecommendations.length > 0) {
        console.log(`✅ [QUIZ-REC] Found ${smartRecommendations.length} smart recommendations`);
        return this.formatQuizzesForFrontend(smartRecommendations);
      }

      console.log(`⚠️ [QUIZ-REC] No smart recommendations found, falling back to performance-based selection`);

      // Step 2: Fallback - Get user performance data and generate recommendations
      const userPerformanceData = await this.quizzesService.getUserPerformanceBasedRecommendations(userId, limitNumber);

      if (userPerformanceData && userPerformanceData.length > 0) {
        console.log(`✅ [QUIZ-REC] Found ${userPerformanceData.length} performance-based recommendations`);
        return this.formatQuizzesForFrontend(userPerformanceData);
      }

      console.log(`⚠️ [QUIZ-REC] No performance data available, using intelligent fallback`);

      // Step 3: Final fallback - Get diverse quizzes across subjects with preference for variety
      const allQuizzes = await this.quizzesService.findAll();

      if (!allQuizzes || allQuizzes.length === 0) {
        console.log(`❌ [QUIZ-REC] No quizzes available in database`);
        return [];
      }

      // Intelligent fallback: prioritize variety across subjects and difficulties
      const diverseQuizzes = this.selectDiverseQuizzes(allQuizzes, limitNumber);
      console.log(`✅ [QUIZ-REC] Selected ${diverseQuizzes.length} diverse quizzes as fallback`);

      return this.formatQuizzesForFrontend(diverseQuizzes);
    } catch (error) {
      console.error('❌ [QUIZ-REC] Error getting recommended quizzes:', error);
      throw new BadRequestException('Failed to get recommended quizzes');
    }
  }

  /**
   * Select diverse quizzes across subjects and difficulties for better user experience
   */
  private selectDiverseQuizzes(allQuizzes: any[], limit: number): any[] {
    // Group quizzes by subject and difficulty
    const quizGroups: { [key: string]: any[] } = {};

    allQuizzes.forEach(quiz => {
      const subjectId = quiz.topicId?.subjectId || quiz.subjectId || 'unknown';
      const difficulty = quiz.quizDifficulty || 'Medium';
      const key = `${subjectId}-${difficulty}`;

      if (!quizGroups[key]) {
        quizGroups[key] = [];
      }
      quizGroups[key].push(quiz);
    });

    // Select one quiz from each group to ensure diversity
    const selectedQuizzes: any[] = [];
    const groupKeys = Object.keys(quizGroups);

    // Round-robin selection to ensure variety
    let currentIndex = 0;
    while (selectedQuizzes.length < limit && currentIndex < groupKeys.length * 3) {
      const groupKey = groupKeys[currentIndex % groupKeys.length];
      const group = quizGroups[groupKey];

      if (group && group.length > 0) {
        // Remove and add quiz to avoid duplicates
        const quiz = group.shift();
        if (quiz && !selectedQuizzes.find(q => q._id?.toString() === quiz._id?.toString())) {
          selectedQuizzes.push(quiz);
        }
      }

      currentIndex++;
    }

    // If we still need more quizzes, add remaining ones
    if (selectedQuizzes.length < limit) {
      const remainingQuizzes = allQuizzes
        .filter(quiz => !selectedQuizzes.find(q => q._id?.toString() === quiz._id?.toString()))
        .slice(0, limit - selectedQuizzes.length);

      selectedQuizzes.push(...remainingQuizzes);
    }

    return selectedQuizzes.slice(0, limit);
  }

  /**
   * Format quizzes for frontend consumption
   */
  private formatQuizzesForFrontend(quizzes: any[]): any[] {
    return quizzes.map(quiz => {
      // Handle both direct quiz objects and recommendation objects with quiz data
      const quizData = quiz._id ? quiz : (quiz.quiz || quiz);
      
      return {
        id: quizData._id?.toString() || quizData.id,
        title: quizData.title || 'Practice Quiz',
        subjectId: quizData.subjectId?.toString() || quiz.metadata?.subjectId || '',
        topicId: quizData.topicId?.toString() || quiz.metadata?.topicId || '',
        questions: quizData.questions || quizData.questionIds || [],
        timeLimit: quizData.timeLimit || 30,
        difficulty: this.mapDifficultyToFrontend(quizData.quizDifficulty || quizData.difficulty || 'MEDIUM'),
        type: 'standard',
        createdAt: quizData.createdAt || new Date().toISOString(),
        xpReward: quizData.xpReward || this.calculateXpReward(quizData.quizDifficulty || 'MEDIUM', 10),
        description: quiz.recommendationReason || quizData.description || 'Practice quiz to improve your skills',
        completions: quizData.attemptCount || 0,
        rating: 4.5, // Default rating
        // Add recommendation metadata if available
        ...(quiz.metadata && {
          recommendationReason: quiz.recommendationReason,
          priority: quiz.priority,
          source: quiz.metadata.source
        })
      };
    });
  }

  /**
   * Map backend difficulty to frontend format
   */
  private mapDifficultyToFrontend(backendDifficulty: string): string {
    const mapping = {
      'EASY': 'Easy',
      'MEDIUM': 'Medium', 
      'HARD': 'Hard',
      'Easy': 'Easy',
      'Medium': 'Medium',
      'Hard': 'Hard'
    };
    return mapping[backendDifficulty] || 'Medium';
  }
  /**
   * Get or create topic-based quiz with user personalization
   */
  @Post('topic-practice')
  @HttpCode(HttpStatus.OK)
  async getOrCreateTopicQuiz(
    @Body() request: {
      topicId: string;
      subjectId: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      questionCount?: number;
    },
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = req.user?.['sub'];
      if (!userId) {
        throw new BadRequestException('User authentication required');
      }

      console.log('🎯 [CONTROLLER] Topic practice request received');
      console.log('📋 [REQUEST]', JSON.stringify(request, null, 2));
      console.log(`👤 [USER] Authenticated user ID: ${userId}`);

      // Step 1: Get user's suggested difficulty if not provided
      let suggestedDifficulty = request.difficulty;
      console.log(`🎲 [DIFFICULTY] Initial difficulty from request: ${suggestedDifficulty}`);

      if (!suggestedDifficulty) {
        console.log('🔍 [ANALYSIS] No difficulty provided, analyzing user performance...');
        try {
          const userAnalysis = await this.quizzesService.analyzeUserPerformance(userId, request.topicId);
          suggestedDifficulty = userAnalysis.recommendedDifficulty || 'intermediate';
          console.log(`📊 [ANALYSIS] Suggested difficulty for user: ${suggestedDifficulty}`);
        } catch (error) {
          console.log('⚠️ [ANALYSIS] Could not analyze user performance, defaulting to intermediate');
          suggestedDifficulty = 'intermediate';
        }
      }

      // Map frontend difficulty to backend enum values
      const mapDifficultyToBackend = (difficulty: string): string => {
        switch (difficulty.toLowerCase()) {
          case 'beginner':
          case 'easy':
            return 'Easy';
          case 'intermediate':
          case 'medium':
            return 'Medium';
          case 'advanced':
          case 'hard':
            return 'Hard';
          default:
            return 'Medium';
        }
      };

      const backendDifficulty = mapDifficultyToBackend(suggestedDifficulty);
      console.log(`🔄 [MAPPING] Frontend difficulty '${suggestedDifficulty}' mapped to backend '${backendDifficulty}'`);

      // Step 1.5: Check if any questions exist for this topic
      console.log('🔍 [VALIDATION] Checking if questions exist for topic...');
      const availableQuestionCount = await this.quizzesService.countQuestionsForTopic(request.topicId);
      console.log(`📊 [VALIDATION] Found ${availableQuestionCount} total questions for topic ${request.topicId}`);

      if (availableQuestionCount === 0) {
        console.error(`❌ [VALIDATION] No questions available for topic ${request.topicId}`);
        throw new BadRequestException(`No questions available for this topic. Please try a different topic or contact support to add questions.`);
      }

      // Step 2: Check if suitable quiz already exists for this topic and difficulty
      console.log('🔍 [EXISTING] Checking for existing quiz...');
      const existingQuiz = await this.quizzesService.findTopicQuiz(
        request.topicId,
        request.subjectId,
        backendDifficulty
      );

      if (existingQuiz) {
        console.log(`✅ [EXISTING] Found existing quiz: ${existingQuiz._id}`);
        console.log(`📊 [EXISTING] Quiz details: Questions=${existingQuiz.questions?.length || 0}, Difficulty=${existingQuiz.quizDifficulty}`);
        return {
          id: existingQuiz._id.toString(),
          title: existingQuiz.title,
          subject: existingQuiz.subjectId,
          topicId: existingQuiz.topicId,
          difficulty: existingQuiz.quizDifficulty,
          timeLimit: existingQuiz.timeLimit,
          questionCount: existingQuiz.questions?.length || request.questionCount || 10,
          questions: existingQuiz.questions,
          xpReward: existingQuiz.xpReward,
          metadata: {
            type: 'existing',
            suggestedDifficulty,
            fromDatabase: true
          }
        };
      }

      console.log('❌ [EXISTING] No existing quiz found, will generate new one');

      // Step 3: Create new personalized quiz using the advanced algorithm
      console.log('🏗️ [GENERATION] Creating new personalized quiz...');
      const requestedQuestionCount = request.questionCount || 10;
      const config = {
        userId,
        topicId: request.topicId,
        subjectId: request.subjectId,
        questionsCount: requestedQuestionCount,
        sessionType: 'practice' as const,
        timeLimit: requestedQuestionCount * 2 // 2 minutes per question
      };
      console.log('⚙️ [GENERATION] Quiz config:', JSON.stringify(config, null, 2));

      const quizResult = await this.quizzesService.generatePersonalizedQuiz(config);
      console.log(`📊 [GENERATION] Quiz generation result: ${quizResult.questions?.length || 0} questions generated`);

      if (!quizResult.questions || quizResult.questions.length === 0) {
        console.error('❌ [GENERATION] No questions generated by personalized quiz algorithm');
        throw new BadRequestException(`No questions available for topic. Please try a different topic or contact support.`);
      }

      // Step 4: Save the generated quiz to database for future use
      console.log('💾 [SAVE] Saving generated quiz to database...');
      const xpReward = this.calculateXpReward(backendDifficulty, requestedQuestionCount);
      console.log(`🏆 [SAVE] Calculated XP reward: ${xpReward} for difficulty ${backendDifficulty} and ${requestedQuestionCount} questions`);

      const savedQuiz = await this.quizzesService.saveGeneratedQuiz({
        title: `${request.topicId} Practice Quiz`,
        topicId: request.topicId,
        subjectId: request.subjectId,
        difficulty: backendDifficulty,
        questions: quizResult.questions,
        timeLimit: config.timeLimit,
        xpReward,
        createdBy: userId
      });
      console.log(`✅ [SAVE] Quiz saved successfully with ID: ${savedQuiz._id}`);

      console.log(`✅ [SUCCESS] Created and saved new quiz: ${savedQuiz._id}`);

      const response = {
        id: savedQuiz._id.toString(),
        title: savedQuiz.title,
        subject: savedQuiz.subjectId,
        topicId: savedQuiz.topicId,
        difficulty: savedQuiz.quizDifficulty,
        timeLimit: savedQuiz.timeLimit,
        questionCount: savedQuiz.questions?.length || requestedQuestionCount,
        questions: savedQuiz.questions,
        xpReward: savedQuiz.xpReward,
        metadata: {
          type: 'created',
          suggestedDifficulty,
          fromDatabase: false,
          personalizedForUser: userId
        }
      };

      console.log('📤 [RESPONSE] Sending response:', JSON.stringify({
        id: response.id,
        title: response.title,
        questionCount: response.questionCount,
        difficulty: response.difficulty,
        xpReward: response.xpReward
      }, null, 2));

      return response;

    } catch (error) {
      console.error('❌ [ERROR] Error in topic practice:', error);
      console.error('📋 [ERROR] Request details:', JSON.stringify(request, null, 2));
      throw new BadRequestException('Failed to get or create topic quiz');
    }
  }

  /**
   * Get topics with available questions for practice
   */
  @Get('topics-with-questions/:subjectId')
  @HttpCode(HttpStatus.OK)
  async getTopicsWithQuestions(@Param('subjectId') subjectId: string): Promise<any> {
    try {
      return await this.quizzesService.getTopicsWithQuestions(subjectId);
    } catch (error) {
      console.error('Error getting topics with questions:', error);
      throw new BadRequestException('Failed to get topics with questions');
    }
  }

  /**
   * Get quiz by ID
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getQuizById(@Param('id') id: string): Promise<any> {
    try {
      // Check if this is a generated quiz ID
      if (id.startsWith('generated_')) {
        // For generated quizzes, we need to regenerate them or return an error
        // Since generated quizzes are temporary, we'll return a helpful message
        throw new BadRequestException('Generated quizzes are temporary and cannot be retrieved by ID. Please generate a new quiz.');
      }

      return await this.quizzesService.findById(id);
    } catch (error) {
      console.error('Error getting quiz by ID:', error);

      // Provide more specific error messages
      if (error.message?.includes('Generated quizzes are temporary')) {
        throw error; // Re-throw our custom message
      }
      throw new BadRequestException('Failed to get quiz');
    }
  }

  /**
   * Generate assessment quiz for onboarding
   */
  @Post('assessments/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateAssessment(
    @Body() body: { user_id: string; selected_subjects: string[] },
    @Req() req: Request
  ): Promise<{ questions: any[] }> {
    try {
      if (!body.user_id || !body.selected_subjects || body.selected_subjects.length === 0) {
        throw new BadRequestException('user_id and selected_subjects are required');
      }

      console.log('Assessment request received:', {
        user_id: body.user_id,
        selected_subjects: body.selected_subjects,
      });

      // Use optimized aggregation pipeline with timeout handling
      const questions: any = await Promise.race([
        this.quizzesService.generateAssessmentWithAggregation(body.selected_subjects, 15),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Assessment generation timeout')), 25000)
        )
      ]);

      console.log('Total questions generated for assessment:', questions.length);

      if (questions.length === 0) {
        throw new BadRequestException('No questions could be generated for the selected subjects');
      }

      // Randomly shuffle and select final questions
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
      const finalQuestions = shuffledQuestions.slice(0, 15);

      console.log('Returning final assessment questions:', finalQuestions.length);
      return {
        questions: finalQuestions
      };
    } catch (error) {
      console.error('Error generating assessment:', error);
      if (error.message.includes('timeout')) {
        throw new BadRequestException('Assessment generation is taking too long. Please try again.');
      }
      throw error;
    }
  }
}
