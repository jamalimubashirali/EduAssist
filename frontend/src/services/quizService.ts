import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { Quiz, Question, QuizResult, BackendQuiz } from '@/types'
import { convertBackendQuiz, convertApiResponse, convertBackendQuestion } from '@/lib/typeConverters'
import { ServiceErrorHandler, EnhancedToast, RetryHandler } from '@/lib/errorHandling'

export interface CreateQuizData {
  title: string
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  timeLimit?: number
  questions: Omit<Question, 'id'>[]
}

export interface QuizFilters {
  subject?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  limit?: number
  offset?: number
}

export interface GenerateQuizRequest {
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questionCount: number
  topics?: string[]
}

export interface PersonalizedQuizConfig {
  userId : string
  topicId: string
  subjectId: string
  questionsCount: number
  sessionType: 'practice' | 'assessment' | 'adaptive'
  timeLimit?: number
}

export interface QuizGenerationResult {
  quiz: Quiz | null
  questions: Question[]
  metadata: {
    userLevel: number
    difficultyDistribution: Record<string, number>
    focusAreas: string[]
    sessionId: string
    isRepeatedSession: boolean
  }
}

export interface OptimalQuizParameters {
  recommendedQuestionCount: number
  recommendedTimeLimit: number
  recommendedDifficulty: string
  recommendedSessionType: string
  userInsights: {
    currentLevel: number
    masteryScore: number
    recommendationReason: string
  }
}

export interface AdaptiveSessionConfig {
  topicId: string
  subjectId: string
  targetDuration: number // minutes
  difficultyPreference?: 'adaptive' | 'easy' | 'medium' | 'hard'
}

export interface QuizHistoryAnalytics {
  quizzes: any[]
  analytics: {
    totalQuizzes: number
    averageScore: number
    improvementTrend: string
    strongestDifficulty: string
    weakestDifficulty: string
  }
}

class QuizService {
  // Get all quizzes
  async getAllQuizzes(filters?: QuizFilters): Promise<Quiz[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.subject) params.append('subject', filters.subject)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await api.get(`/quizzes?${params.toString()}`)
      console.log('📥 [QUIZ_SERVICE] Raw API response:', response);
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get quiz by ID
  async getQuizById(id: string): Promise<Quiz> {
    console.log('🌐 [QUIZ_SERVICE] getQuizById called with ID:', id)

    try {
      console.log('📡 [QUIZ_SERVICE] Making API request to:', `/quizzes/${id}`)
      const response = await api.get(`/quizzes/${id}`)
      console.log('📥 [QUIZ_SERVICE] Raw API response:', response)
      console.log('📊 [QUIZ_SERVICE] Response status:', response.status)
      console.log('📋 [QUIZ_SERVICE] Response data:', response.data)

      const backendQuiz = handleApiResponse(response) as BackendQuiz
      console.log('🔄 [QUIZ_SERVICE] Processed backend quiz:', backendQuiz)
      console.log('📝 [QUIZ_SERVICE] Backend quiz questions:', backendQuiz?.questions?.length || 0)

      if (backendQuiz?.questions) {
        console.log('🔍 [QUIZ_SERVICE] Sample backend question:', backendQuiz.questions[0])
      }

      const convertedQuiz = convertBackendQuiz(backendQuiz)
      console.log('✅ [QUIZ_SERVICE] Converted quiz:', convertedQuiz)
      console.log('📊 [QUIZ_SERVICE] Converted questions count:', convertedQuiz?.questions?.length || 0)

      if (convertedQuiz?.questions) {
        console.log('🔍 [QUIZ_SERVICE] Sample converted question:', convertedQuiz.questions[0])
      }

      return convertedQuiz
    } catch (error: any) {
      console.error('❌ [QUIZ_SERVICE] Error in getQuizById:', error)
      console.error('📋 [QUIZ_SERVICE] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      return handleApiError(error)
    }
  }

  // Create new quiz
  async createQuiz(data: CreateQuizData): Promise<Quiz> {
    try {
      const response = await api.post('/quizzes', data)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Update quiz
  async updateQuiz(id: string, data: Partial<CreateQuizData>): Promise<Quiz> {
    try {
      const response = await api.patch(`/quizzes/${id}`, data)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Delete quiz
  async deleteQuiz(id: string): Promise<void> {
    try {
      const response = await api.delete(`/quizzes/${id}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Generate quiz using AI
  async generateQuiz(request: GenerateQuizRequest): Promise<Quiz> {
    const loadingToast = EnhancedToast.loading('Generating your personalized quiz...', {
      description: 'This may take a few moments'
    })

    try {
      // Backend expects difficulty: 'easy' | 'medium' | 'hard'
      const difficultyMap = {
        beginner: 'easy',
        intermediate: 'medium',
        advanced: 'hard',
      } as const
      const payload = {
        ...request,
        difficulty: difficultyMap[request.difficulty],
      }
      
      const response = await RetryHandler.withRetry(
        () => api.post('/quizzes/generate', payload),
        { maxRetries: 2, retryDelay: 2000 }
      )
      
      const data = handleApiResponse(response) as any

      // The /quizzes/generate endpoint already returns a quiz-like object in FE shape (questions have id,text,options,correctAnswer,explanation,xpValue)
      const mapDifficulty = (d: string): 'beginner' | 'intermediate' | 'advanced' => {
        const dl = (d || '').toLowerCase()
        if (dl === 'easy') return 'beginner'
        if (dl === 'medium') return 'intermediate'
        if (dl === 'hard') return 'advanced'
        return 'beginner'
      }

      const quiz: Quiz = {
        id: data.id || data._id,
        title: data.title,
        subjectId: data.subject || (data.topicId ?? ''),
        topicId: data.topicId ?? '',
        difficulty: (data.difficulty || 'Easy').charAt(0).toUpperCase() + (data.difficulty || 'Easy').slice(1).toLowerCase(),
        type: data.type ?? 'standard',
        timeLimit: data.timeLimit ?? 0,
        questions: Array.isArray(data.questions) ? data.questions : [],
        xpReward: data.xpReward ?? 0,
        createdAt: data.createdAt ?? new Date().toISOString(),
        completions: data.completions ?? 0,
        rating: data.rating ?? 0,
        description: data.description ?? '',
      }

      EnhancedToast.updateLoading(loadingToast, 'Quiz generated successfully!', {
        type: 'success',
        description: `${quiz.questions.length} questions ready for you`
      })

      return quiz
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleQuizError(error, `generate (${request.subject}, ${request.difficulty})`)
      EnhancedToast.updateLoading(loadingToast, serviceError.message, {
        type: 'error',
        description: serviceError.suggestions?.[0]
      })
      throw error
    }
  }

  // Get quizzes by subject
  async getQuizzesBySubject(subject: string): Promise<Quiz[]> {
    try {
      const response = await api.get(`/quizzes/subject/${subject}`)
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get quizzes by topic
  async getQuizzesByTopic(topicId: string): Promise<Quiz[]> {
    try {
      const response = await api.get(`/quizzes/topic/${topicId}`)
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get recommended quizzes for user
  async getRecommendedQuizzes(userId: string): Promise<Quiz[]> {
    try {
      const response = await api.get(`/quizzes/recommended/${userId}`)
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Search quizzes
  async searchQuizzes(query: string, filters?: QuizFilters): Promise<Quiz[]> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      if (filters?.subject) params.append('subject', filters.subject)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await api.get(`/quizzes/search?${params.toString()}`)
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get popular quizzes
  async getPopularQuizzes(limit: number = 10): Promise<Quiz[]> {
    try {
      const response = await api.get(`/quizzes/popular?limit=${limit}`)
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get recent quizzes
  async getRecentQuizzes(limit: number = 10): Promise<Quiz[]> {
    try {
      const response = await api.get(`/quizzes/recent?limit=${limit}`)
      const backendQuizzes = handleApiResponse(response) as BackendQuiz[]
      return convertApiResponse(backendQuizzes, convertBackendQuiz) as Quiz[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async generateAssessment(user_id : string , selected_subjects : string[]){
    try {
      const response = await api.post(`/quizzes/assessments/generate`, {
        user_id,
        selected_subjects
      });
      // Backend returns { questions: [...] }
      const backendQuestions = handleApiResponse(response)?.questions || [];
      // Convert backend questions to frontend format
      return backendQuestions.map((q: any) => convertBackendQuestion(q));
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      return [];
    }
  }

  // Personalized Quiz Generation - connects to backend's sophisticated algorithms
  async generatePersonalizedQuiz(config: PersonalizedQuizConfig): Promise<QuizGenerationResult> {
    const loadingToast = EnhancedToast.loading('Creating your personalized learning session...', {
      description: 'Analyzing your performance and preferences'
    })

    try {
      const response = await RetryHandler.withRetry(
        () => api.post('/quizzes/generate-personalized', config),
        { maxRetries: 2, retryDelay: 3000 }
      )
      
      const result = handleApiResponse(response) as QuizGenerationResult
      
      // Convert backend questions to frontend format if needed
      if (result.questions) {
        result.questions = result.questions.map((q: any) => convertBackendQuestion(q))
      }
      
      // Convert quiz if present
      if (result.quiz) {
        result.quiz = convertBackendQuiz(result.quiz as any)
      }

      EnhancedToast.updateLoading(loadingToast, 'Personalized quiz ready!', {
        type: 'success',
        description: `${result.questions.length} questions tailored to your level`
      })
      
      return result
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleQuizError(error, `generate personalized (${config.topicId})`)
      EnhancedToast.updateLoading(loadingToast, serviceError.message, {
        type: 'error',
        description: serviceError.suggestions?.[0]
      })
      throw error
    }
  }

  // Get optimal quiz parameters for intelligent recommendations
  async getOptimalQuizParameters(topicId: string): Promise<OptimalQuizParameters> {
    try {
      const response = await api.get(`/quizzes/optimal-parameters/${topicId}`)
      return handleApiResponse(response) as OptimalQuizParameters
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Start adaptive learning session
  async startAdaptiveSession(config: AdaptiveSessionConfig): Promise<QuizGenerationResult> {
    try {
      const response = await api.post('/quizzes/adaptive-session', config)
      const result = handleApiResponse(response) as QuizGenerationResult
      
      // Convert backend questions to frontend format
      if (result.questions) {
        result.questions = result.questions.map((q: any) => convertBackendQuestion(q))
      }
      
      // Convert quiz if present
      if (result.quiz) {
        result.quiz = convertBackendQuiz(result.quiz as any)
      }
      
      return result
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get quiz history with analytics
  async getQuizHistory(topicId: string, limit: number = 10): Promise<QuizHistoryAnalytics> {
    try {
      const response = await api.get(`/quizzes/history/${topicId}?limit=${limit}`)
      return handleApiResponse(response) as QuizHistoryAnalytics
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get comprehensive quiz analytics for a user and topic
  async getQuizAnalytics(topicId: string): Promise<{
    quizHistory: QuizHistoryAnalytics
    performanceData: any
    optimalParameters: OptimalQuizParameters
    recommendations: {
      nextQuizType: string
      suggestedDifficulty: string
      focusAreas: string[]
      estimatedImprovement: number
    }
  }> {
    try {
      // Fetch all analytics data in parallel
      const [historyResponse, performanceResponse, parametersResponse] = await Promise.all([
        api.get(`/quizzes/history/${topicId}?limit=20`),
        api.get(`/performance/user/${topicId}`),
        api.get(`/quizzes/optimal-parameters/${topicId}`)
      ])

      const quizHistory = handleApiResponse(historyResponse) as QuizHistoryAnalytics
      const performanceData = handleApiResponse(performanceResponse)
      const optimalParameters = handleApiResponse(parametersResponse) as OptimalQuizParameters

      // Generate recommendations based on combined data
      const recommendations = this.generateQuizRecommendations(
        quizHistory,
        performanceData,
        optimalParameters
      )

      return {
        quizHistory,
        performanceData,
        optimalParameters,
        recommendations
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Generate intelligent quiz recommendations based on analytics
  private generateQuizRecommendations(
    history: QuizHistoryAnalytics,
    performance: any,
    parameters: OptimalQuizParameters
  ): {
    nextQuizType: string
    suggestedDifficulty: string
    focusAreas: string[]
    estimatedImprovement: number
  } {
    const { analytics } = history
    const { userInsights } = parameters

    // Determine next quiz type based on performance patterns
    let nextQuizType = 'practice'
    if (analytics.averageScore > 85) {
      nextQuizType = 'challenge'
    } else if (analytics.averageScore < 60) {
      nextQuizType = 'review'
    } else if (analytics.improvementTrend === 'Improving') {
      nextQuizType = 'adaptive'
    }

    // Suggest difficulty based on mastery and recent performance
    let suggestedDifficulty = parameters.recommendedDifficulty.toLowerCase()
    if (analytics.averageScore > 90 && analytics.totalQuizzes > 5) {
      suggestedDifficulty = 'hard'
    } else if (analytics.averageScore < 50) {
      suggestedDifficulty = 'easy'
    }

    // Identify focus areas based on weakest difficulty
    const focusAreas = [analytics.weakestDifficulty.toLowerCase()]
    if (analytics.improvementTrend === 'Declining') {
      focusAreas.push('fundamentals', 'review')
    }

    // Estimate potential improvement based on current trajectory
    const estimatedImprovement = Math.max(0, Math.min(25, 
      (100 - analytics.averageScore) * 0.3 + (userInsights.masteryScore < 50 ? 15 : 5)
    ))

    return {
      nextQuizType,
      suggestedDifficulty,
      focusAreas,
      estimatedImprovement: Math.round(estimatedImprovement)
    }
  }

  // Generate quiz based on recommendation engine suggestions
  async generateRecommendationBasedQuiz(recommendationId: string): Promise<QuizGenerationResult> {
    try {
      const response = await api.post(`/quizzes/generate-from-recommendation/${recommendationId}`)
      const result = handleApiResponse(response) as QuizGenerationResult
      
      // Convert backend questions to frontend format
      if (result.questions) {
        result.questions = result.questions.map((q: any) => convertBackendQuestion(q))
      }
      
      // Convert quiz if present
      if (result.quiz) {
        result.quiz = convertBackendQuiz(result.quiz as any)
      }
      
      return result
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get smart quiz suggestions based on recommendation engine
  async getSmartQuizSuggestions(userId: string): Promise<{
    urgentQuizzes: Array<{
      topicId: string
      topicName: string
      subjectName: string
      priority: number
      urgency: number
      estimatedTime: number
      reason: string
      suggestedDifficulty: string
    }>
    adaptiveQuizzes: Array<{
      topicId: string
      sessionType: string
      difficulty: string
      questionCount: number
      reason: string
    }>
    reviewQuizzes: Array<{
      topicId: string
      topicName: string
      weakAreas: string[]
      suggestedQuestionCount: number
      focusAreas: string[]
    }>
  }> {
    try {
      // Get smart recommendations and transform them into quiz suggestions
      const [recommendationsResponse, performanceResponse] = await Promise.all([
        api.get('/recommendations/smart-recommendations'),
        api.get(`/performance/user/${userId}/gamification-stats`)
      ])

      const recommendations = handleApiResponse(recommendationsResponse)
      const performanceData = handleApiResponse(performanceResponse)

      return this.transformRecommendationsToQuizSuggestions(recommendations, performanceData)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  private transformRecommendationsToQuizSuggestions(recommendations: any[], performanceData: any): any {
    // Transform recommendations into actionable quiz suggestions
    const urgentQuizzes = recommendations
      .filter(r => r.urgency >= 70)
      .slice(0, 3)
      .map(r => ({
        topicId: r.topicId || '',
        topicName: r.title || 'Topic',
        subjectName: r.subjectName || 'Subject',
        priority: r.priority || 50,
        urgency: r.urgency || 50,
        estimatedTime: r.estimatedTime || 20,
        reason: r.reason || 'Recommended based on your performance',
        suggestedDifficulty: r.suggestedDifficulty || 'medium'
      }))

    const adaptiveQuizzes = recommendations
      .filter(r => r.priority >= 60 && r.urgency < 70)
      .slice(0, 5)
      .map(r => ({
        topicId: r.topicId || '',
        sessionType: r.estimatedTime > 30 ? 'comprehensive' : 'focused',
        difficulty: r.suggestedDifficulty || 'medium',
        questionCount: Math.ceil(r.estimatedTime / 2) || 10,
        reason: r.reason || 'Adaptive learning opportunity'
      }))

    const reviewQuizzes = (performanceData?.weakAreas || [])
      .slice(0, 3)
      .map((area: any) => ({
        topicId: area.topicId || '',
        topicName: area.topic || 'Topic',
        weakAreas: [area.topic],
        suggestedQuestionCount: 15,
        focusAreas: ['fundamentals', 'practice']
      }))

    return {
      urgentQuizzes,
      adaptiveQuizzes,
      reviewQuizzes
    }
  }

  // Get quiz performance insights for dashboard
  async getQuizPerformanceInsights(userId: string): Promise<{
    recentPerformance: {
      averageScore: number
      quizzesCompleted: number
      improvementRate: number
      streakDays: number
    }
    topPerformingTopics: Array<{
      topicId: string
      topicName: string
      averageScore: number
      quizzesCompleted: number
    }>
    improvementOpportunities: Array<{
      topicId: string
      topicName: string
      currentScore: number
      potentialImprovement: number
      recommendedAction: string
    }>
    adaptiveRecommendations: Array<{
      topicId: string
      sessionType: string
      difficulty: string
      estimatedDuration: number
      reason: string
    }>
  }> {
    try {
      // This would typically call multiple backend endpoints
      // For now, we'll structure it to work with existing endpoints
      const [performanceResponse, gamificationResponse] = await Promise.all([
        api.get(`/performance/analytics/${userId}`),
        api.get(`/performance/user/${userId}/gamification-stats`)
      ])

      const performanceData = handleApiResponse(performanceResponse)
      const gamificationData = handleApiResponse(gamificationResponse)

      // Transform the data into insights format
      return this.transformPerformanceToInsights(performanceData, gamificationData, userId)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  private transformPerformanceToInsights(performanceData: any, gamificationData: any, userId: string): any {
    // Transform backend performance data into structured insights
    // This is a simplified implementation - in a real app, this would be more sophisticated
    
    const performances = Array.isArray(performanceData) ? performanceData : []
    
    const recentPerformance = {
      averageScore: performances.length > 0 
        ? performances.reduce((sum: number, p: any) => sum + (p.averageScore || 0), 0) / performances.length 
        : 0,
      quizzesCompleted: performances.reduce((sum: number, p: any) => sum + (p.totalAttempts || 0), 0),
      improvementRate: performances.length > 0 
        ? performances.reduce((sum: number, p: any) => sum + (p.learningVelocity || 0), 0) / performances.length 
        : 0,
      streakDays: gamificationData?.streakCount || 0
    }

    const topPerformingTopics = performances
      .filter((p: any) => p.averageScore > 75)
      .sort((a: any, b: any) => b.averageScore - a.averageScore)
      .slice(0, 5)
      .map((p: any) => ({
        topicId: p.topicId?._id || p.topicId,
        topicName: p.topicId?.topicName || 'Topic',
        averageScore: p.averageScore || 0,
        quizzesCompleted: p.totalAttempts || 0
      }))

    const improvementOpportunities = performances
      .filter((p: any) => p.averageScore < 70)
      .sort((a: any, b: any) => a.averageScore - b.averageScore)
      .slice(0, 3)
      .map((p: any) => ({
        topicId: p.topicId?._id || p.topicId,
        topicName: p.topicId?.topicName || 'Topic',
        currentScore: p.averageScore || 0,
        potentialImprovement: Math.min(30, 80 - (p.averageScore || 0)),
        recommendedAction: p.averageScore < 50 ? 'Review fundamentals' : 'Practice more challenging questions'
      }))

    const adaptiveRecommendations = performances
      .slice(0, 3)
      .map((p: any) => ({
        topicId: p.topicId?._id || p.topicId,
        sessionType: p.averageScore > 80 ? 'challenge' : p.averageScore < 60 ? 'review' : 'adaptive',
        difficulty: p.averageScore > 85 ? 'hard' : p.averageScore < 55 ? 'easy' : 'medium',
        estimatedDuration: p.averageScore > 80 ? 15 : 25,
        reason: p.averageScore > 80 
          ? 'Ready for advanced challenges' 
          : p.averageScore < 60 
            ? 'Focus on building fundamentals' 
            : 'Continue adaptive learning'
      }))

    return {
      recentPerformance,
      topPerformingTopics,
      improvementOpportunities,
      adaptiveRecommendations
    }
  }

  // Get or create topic-based quiz with personalization
  async getOrCreateTopicQuiz(request: {
    topicId: string
    subjectId: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    questionCount?: number
  }): Promise<Quiz> {
    try {
      const response = await api.post('/quizzes/topic-practice', request)
      const backendQuiz = handleApiResponse(response)

      // Debug logging to see what the backend returns
      console.log('Backend quiz response:', backendQuiz)

      const convertedQuiz = convertBackendQuiz(backendQuiz) as Quiz

      // Debug logging to see the converted quiz
      console.log('Converted quiz:', convertedQuiz)

      return convertedQuiz
    } catch (error: any) {
      console.error('Error in getOrCreateTopicQuiz:', error)
      return handleApiError(error)
    }
  }
}

export const quizService = new QuizService()
export default quizService
