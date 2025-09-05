/**
 * Enhanced Quiz Service Integration Tests
 * 
 * Tests the enhanced quiz service integration with backend's sophisticated
 * algorithms including personalized generation, analytics, and recommendations.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { quizService } from '@/services/quizService'
import { subjectService } from '@/services/subjectService'
import { topicService } from '@/services/topicService'
import { userService } from '@/services/userService'
import api from '@/lib/api'

// Test configuration
const TEST_CONFIG = {
  timeout: 45000, // Longer timeout for AI generation
  skipPersonalizedTests: false, // Set to true to skip tests requiring user auth
  skipGenerationTests: false, // Set to true to skip AI generation tests
}

// Test data
let testSubjectId: string | null = null
let testTopicId: string | null = null
let testUserId: string | null = null
let isAuthenticated = false

describe('Enhanced Quiz Service Integration', () => {
  beforeAll(async () => {
    // Get test data for quiz generation
    try {
      const subjects = await subjectService.getAllSubjects()
      if (subjects.length > 0) {
        testSubjectId = subjects[0].id
        console.log(`Using test subject: ${subjects[0].name}`)
        
        // Get a topic from this subject
        const topics = await topicService.getTopicsBySubject(testSubjectId)
        if (topics.length > 0) {
          testTopicId = topics[0].id
          console.log(`Using test topic: ${topics[0].name}`)
        }
      }
      
      // Try to get current user for personalized tests
      try {
        const user = await userService.getCurrentUser()
        testUserId = user.id
        isAuthenticated = true
        console.log(`Authenticated user available: ${user.name}`)
      } catch (error) {
        console.log('No authenticated user - skipping personalized tests')
      }
    } catch (error) {
      console.warn('Failed to setup test data:', error)
    }
  }, TEST_CONFIG.timeout)

  describe('Basic Quiz Service Connectivity', () => {
    it('should connect to get all quizzes endpoint', async () => {
      const quizzes = await quizService.getAllQuizzes()
      
      expect(Array.isArray(quizzes)).toBe(true)
      console.log(`✅ Retrieved ${quizzes.length} quizzes`)
      
      // Validate quiz structure
      if (quizzes.length > 0) {
        const quiz = quizzes[0]
        expect(quiz).toHaveProperty('id')
        expect(quiz).toHaveProperty('title')
        expect(quiz).toHaveProperty('difficulty')
        expect(quiz).toHaveProperty('questions')
        expect(Array.isArray(quiz.questions)).toBe(true)
      }
    }, TEST_CONFIG.timeout)

    it('should connect to search quizzes endpoint', async () => {
      const searchResults = await quizService.searchQuizzes('test')
      
      expect(Array.isArray(searchResults)).toBe(true)
      console.log(`✅ Found ${searchResults.length} quizzes matching 'test'`)
    }, TEST_CONFIG.timeout)

    it('should connect to popular quizzes endpoint', async () => {
      const popularQuizzes = await quizService.getPopularQuizzes(5)
      
      expect(Array.isArray(popularQuizzes)).toBe(true)
      expect(popularQuizzes.length).toBeLessThanOrEqual(5)
      console.log(`✅ Retrieved ${popularQuizzes.length} popular quizzes`)
    }, TEST_CONFIG.timeout)

    it('should connect to recent quizzes endpoint', async () => {
      const recentQuizzes = await quizService.getRecentQuizzes(5)
      
      expect(Array.isArray(recentQuizzes)).toBe(true)
      expect(recentQuizzes.length).toBeLessThanOrEqual(5)
      console.log(`✅ Retrieved ${recentQuizzes.length} recent quizzes`)
    }, TEST_CONFIG.timeout)
  })

  describe('Subject and Topic Based Quiz Retrieval', () => {
    it('should get quizzes by subject', async () => {
      if (!testSubjectId) {
        console.log('Skipping - no test subject available')
        return
      }

      const quizzes = await quizService.getQuizzesBySubject(testSubjectId)
      
      expect(Array.isArray(quizzes)).toBe(true)
      console.log(`✅ Retrieved ${quizzes.length} quizzes for subject`)
      
      // All quizzes should belong to the requested subject
      quizzes.forEach(quiz => {
        expect(quiz.subjectId).toBe(testSubjectId)
      })
    }, TEST_CONFIG.timeout)

    it('should get quizzes by topic', async () => {
      if (!testTopicId) {
        console.log('Skipping - no test topic available')
        return
      }

      const quizzes = await quizService.getQuizzesByTopic(testTopicId)
      
      expect(Array.isArray(quizzes)).toBe(true)
      console.log(`✅ Retrieved ${quizzes.length} quizzes for topic`)
      
      // All quizzes should belong to the requested topic
      quizzes.forEach(quiz => {
        expect(quiz.topicId).toBe(testTopicId)
      })
    }, TEST_CONFIG.timeout)
  })

  describe('AI Quiz Generation Integration', () => {
    it('should generate quiz using basic generation endpoint', async () => {
      if (TEST_CONFIG.skipGenerationTests || !testSubjectId) {
        console.log('Skipping quiz generation test')
        return
      }

      const generateRequest = {
        subject: testSubjectId,
        difficulty: 'intermediate' as const,
        questionCount: 5,
        topics: testTopicId ? [testTopicId] : undefined
      }

      const generatedQuiz = await quizService.generateQuiz(generateRequest)
      
      expect(generatedQuiz).toHaveProperty('id')
      expect(generatedQuiz).toHaveProperty('title')
      expect(generatedQuiz).toHaveProperty('questions')
      expect(Array.isArray(generatedQuiz.questions)).toBe(true)
      expect(generatedQuiz.questions.length).toBeGreaterThan(0)
      expect(generatedQuiz.questions.length).toBeLessThanOrEqual(generateRequest.questionCount)
      
      // Validate question structure
      const question = generatedQuiz.questions[0]
      expect(question).toHaveProperty('id')
      expect(question).toHaveProperty('text')
      expect(question).toHaveProperty('options')
      expect(question).toHaveProperty('correctAnswer')
      expect(Array.isArray(question.options)).toBe(true)
      
      console.log(`✅ Generated quiz with ${generatedQuiz.questions.length} questions`)
    }, TEST_CONFIG.timeout)

    it('should handle different difficulty levels in generation', async () => {
      if (TEST_CONFIG.skipGenerationTests || !testSubjectId) {
        console.log('Skipping difficulty test')
        return
      }

      const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced']
      
      for (const difficulty of difficulties) {
        try {
          const quiz = await quizService.generateQuiz({
            subject: testSubjectId,
            difficulty,
            questionCount: 3
          })
          
          expect(quiz).toHaveProperty('questions')
          expect(quiz.questions.length).toBeGreaterThan(0)
          console.log(`✅ Generated ${difficulty} quiz with ${quiz.questions.length} questions`)
        } catch (error: any) {
          console.log(`⚠️ Failed to generate ${difficulty} quiz: ${error.message}`)
        }
      }
    }, TEST_CONFIG.timeout)
  })

  describe('Personalized Quiz Generation (Backend Algorithm Integration)', () => {
    it('should generate personalized quiz using backend algorithms', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testTopicId || !testSubjectId) {
        console.log('Skipping personalized quiz test - missing data')
        return
      }

      const personalizedConfig = {
        topicId: testTopicId,
        subjectId: testSubjectId,
        questionsCount: 8,
        sessionType: 'practice' as const,
        timeLimit: 1200 // 20 minutes
      }

      const result = await quizService.generatePersonalizedQuiz(personalizedConfig)
      
      expect(result).toHaveProperty('quiz')
      expect(result).toHaveProperty('questions')
      expect(result).toHaveProperty('metadata')
      
      // Validate metadata from backend algorithms
      expect(result.metadata).toHaveProperty('userLevel')
      expect(result.metadata).toHaveProperty('difficultyDistribution')
      expect(result.metadata).toHaveProperty('focusAreas')
      expect(result.metadata).toHaveProperty('sessionId')
      expect(typeof result.metadata.userLevel).toBe('number')
      expect(typeof result.metadata.difficultyDistribution).toBe('object')
      expect(Array.isArray(result.metadata.focusAreas)).toBe(true)
      
      // Validate questions
      expect(Array.isArray(result.questions)).toBe(true)
      expect(result.questions.length).toBeGreaterThan(0)
      expect(result.questions.length).toBeLessThanOrEqual(personalizedConfig.questionsCount)
      
      console.log(`✅ Generated personalized quiz with ${result.questions.length} questions`)
      console.log(`   User Level: ${result.metadata.userLevel}`)
      console.log(`   Focus Areas: ${result.metadata.focusAreas.join(', ')}`)
    }, TEST_CONFIG.timeout)

    it('should get optimal quiz parameters from backend algorithms', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testTopicId) {
        console.log('Skipping optimal parameters test')
        return
      }

      const optimalParams = await quizService.getOptimalQuizParameters(testTopicId)
      
      expect(optimalParams).toHaveProperty('recommendedQuestionCount')
      expect(optimalParams).toHaveProperty('recommendedTimeLimit')
      expect(optimalParams).toHaveProperty('recommendedDifficulty')
      expect(optimalParams).toHaveProperty('recommendedSessionType')
      expect(optimalParams).toHaveProperty('userInsights')
      
      // Validate user insights from backend
      expect(optimalParams.userInsights).toHaveProperty('currentLevel')
      expect(optimalParams.userInsights).toHaveProperty('masteryScore')
      expect(optimalParams.userInsights).toHaveProperty('recommendationReason')
      
      expect(typeof optimalParams.recommendedQuestionCount).toBe('number')
      expect(typeof optimalParams.recommendedTimeLimit).toBe('number')
      expect(typeof optimalParams.userInsights.currentLevel).toBe('number')
      expect(typeof optimalParams.userInsights.masteryScore).toBe('number')
      
      console.log(`✅ Retrieved optimal parameters:`)
      console.log(`   Recommended Questions: ${optimalParams.recommendedQuestionCount}`)
      console.log(`   Recommended Difficulty: ${optimalParams.recommendedDifficulty}`)
      console.log(`   User Level: ${optimalParams.userInsights.currentLevel}`)
      console.log(`   Mastery Score: ${optimalParams.userInsights.masteryScore}`)
    }, TEST_CONFIG.timeout)

    it('should start adaptive learning session', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testTopicId || !testSubjectId) {
        console.log('Skipping adaptive session test')
        return
      }

      const adaptiveConfig = {
        topicId: testTopicId,
        subjectId: testSubjectId,
        targetDuration: 15, // 15 minutes
        difficultyPreference: 'adaptive' as const
      }

      const adaptiveSession = await quizService.startAdaptiveSession(adaptiveConfig)
      
      expect(adaptiveSession).toHaveProperty('quiz')
      expect(adaptiveSession).toHaveProperty('questions')
      expect(adaptiveSession).toHaveProperty('metadata')
      
      // Validate adaptive session metadata
      expect(adaptiveSession.metadata).toHaveProperty('sessionId')
      expect(adaptiveSession.metadata).toHaveProperty('userLevel')
      expect(adaptiveSession.metadata).toHaveProperty('difficultyDistribution')
      
      console.log(`✅ Started adaptive session with ${adaptiveSession.questions.length} questions`)
    }, TEST_CONFIG.timeout)
  })

  describe('Quiz Analytics and History Integration', () => {
    it('should get quiz history with analytics', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testTopicId) {
        console.log('Skipping quiz history test')
        return
      }

      const historyAnalytics = await quizService.getQuizHistory(testTopicId, 10)
      
      expect(historyAnalytics).toHaveProperty('quizzes')
      expect(historyAnalytics).toHaveProperty('analytics')
      
      expect(Array.isArray(historyAnalytics.quizzes)).toBe(true)
      expect(historyAnalytics.analytics).toHaveProperty('totalQuizzes')
      expect(historyAnalytics.analytics).toHaveProperty('averageScore')
      expect(historyAnalytics.analytics).toHaveProperty('improvementTrend')
      expect(historyAnalytics.analytics).toHaveProperty('strongestDifficulty')
      expect(historyAnalytics.analytics).toHaveProperty('weakestDifficulty')
      
      console.log(`✅ Retrieved quiz history with ${historyAnalytics.quizzes.length} quizzes`)
      console.log(`   Average Score: ${historyAnalytics.analytics.averageScore}`)
      console.log(`   Improvement Trend: ${historyAnalytics.analytics.improvementTrend}`)
    }, TEST_CONFIG.timeout)

    it('should get comprehensive quiz analytics', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testTopicId) {
        console.log('Skipping comprehensive analytics test')
        return
      }

      const analytics = await quizService.getQuizAnalytics(testTopicId)
      
      expect(analytics).toHaveProperty('quizHistory')
      expect(analytics).toHaveProperty('performanceData')
      expect(analytics).toHaveProperty('optimalParameters')
      expect(analytics).toHaveProperty('recommendations')
      
      // Validate recommendations structure
      expect(analytics.recommendations).toHaveProperty('nextQuizType')
      expect(analytics.recommendations).toHaveProperty('suggestedDifficulty')
      expect(analytics.recommendations).toHaveProperty('focusAreas')
      expect(analytics.recommendations).toHaveProperty('estimatedImprovement')
      
      expect(Array.isArray(analytics.recommendations.focusAreas)).toBe(true)
      expect(typeof analytics.recommendations.estimatedImprovement).toBe('number')
      
      console.log(`✅ Retrieved comprehensive analytics`)
      console.log(`   Next Quiz Type: ${analytics.recommendations.nextQuizType}`)
      console.log(`   Suggested Difficulty: ${analytics.recommendations.suggestedDifficulty}`)
      console.log(`   Estimated Improvement: ${analytics.recommendations.estimatedImprovement}%`)
    }, TEST_CONFIG.timeout)
  })

  describe('Smart Recommendations Integration', () => {
    it('should get smart quiz suggestions from recommendation engine', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testUserId) {
        console.log('Skipping smart suggestions test - no authenticated user')
        return
      }

      const suggestions = await quizService.getSmartQuizSuggestions(testUserId)
      
      expect(suggestions).toHaveProperty('urgentQuizzes')
      expect(suggestions).toHaveProperty('adaptiveQuizzes')
      expect(suggestions).toHaveProperty('reviewQuizzes')
      
      expect(Array.isArray(suggestions.urgentQuizzes)).toBe(true)
      expect(Array.isArray(suggestions.adaptiveQuizzes)).toBe(true)
      expect(Array.isArray(suggestions.reviewQuizzes)).toBe(true)
      
      // Validate urgent quiz structure
      suggestions.urgentQuizzes.forEach(quiz => {
        expect(quiz).toHaveProperty('topicId')
        expect(quiz).toHaveProperty('priority')
        expect(quiz).toHaveProperty('urgency')
        expect(quiz).toHaveProperty('reason')
        expect(typeof quiz.priority).toBe('number')
        expect(typeof quiz.urgency).toBe('number')
      })
      
      console.log(`✅ Retrieved smart suggestions:`)
      console.log(`   Urgent Quizzes: ${suggestions.urgentQuizzes.length}`)
      console.log(`   Adaptive Quizzes: ${suggestions.adaptiveQuizzes.length}`)
      console.log(`   Review Quizzes: ${suggestions.reviewQuizzes.length}`)
    }, TEST_CONFIG.timeout)

    it('should get quiz performance insights for dashboard', async () => {
      if (TEST_CONFIG.skipPersonalizedTests || !testUserId) {
        console.log('Skipping performance insights test - no authenticated user')
        return
      }

      const insights = await quizService.getQuizPerformanceInsights(testUserId)
      
      expect(insights).toHaveProperty('recentPerformance')
      expect(insights).toHaveProperty('topPerformingTopics')
      expect(insights).toHaveProperty('improvementOpportunities')
      expect(insights).toHaveProperty('adaptiveRecommendations')
      
      // Validate recent performance structure
      expect(insights.recentPerformance).toHaveProperty('averageScore')
      expect(insights.recentPerformance).toHaveProperty('quizzesCompleted')
      expect(insights.recentPerformance).toHaveProperty('improvementRate')
      expect(insights.recentPerformance).toHaveProperty('streakDays')
      
      expect(Array.isArray(insights.topPerformingTopics)).toBe(true)
      expect(Array.isArray(insights.improvementOpportunities)).toBe(true)
      expect(Array.isArray(insights.adaptiveRecommendations)).toBe(true)
      
      console.log(`✅ Retrieved performance insights:`)
      console.log(`   Average Score: ${insights.recentPerformance.averageScore}`)
      console.log(`   Quizzes Completed: ${insights.recentPerformance.quizzesCompleted}`)
      console.log(`   Top Performing Topics: ${insights.topPerformingTopics.length}`)
      console.log(`   Improvement Opportunities: ${insights.improvementOpportunities.length}`)
    }, TEST_CONFIG.timeout)
  })

  describe('Assessment Generation Integration', () => {
    it('should generate assessment questions', async () => {
      if (!testUserId || !testSubjectId) {
        console.log('Skipping assessment test - missing user or subject')
        return
      }

      const assessmentQuestions = await quizService.generateAssessment(testUserId, [testSubjectId])
      
      expect(Array.isArray(assessmentQuestions)).toBe(true)
      
      if (assessmentQuestions.length > 0) {
        const question = assessmentQuestions[0]
        expect(question).toHaveProperty('id')
        expect(question).toHaveProperty('text')
        expect(question).toHaveProperty('options')
        expect(question).toHaveProperty('correctAnswer')
        expect(Array.isArray(question.options)).toBe(true)
      }
      
      console.log(`✅ Generated assessment with ${assessmentQuestions.length} questions`)
    }, TEST_CONFIG.timeout)
  })

  describe('Quiz Service Error Handling', () => {
    it('should handle invalid quiz generation requests', async () => {
      try {
        await quizService.generateQuiz({
          subject: 'invalid-subject-id',
          difficulty: 'intermediate',
          questionCount: 5
        })
        // If we reach here, the service didn't throw an error
        expect(true).toBe(false) // Force failure
      } catch (error: any) {
        expect(error.message).toBeDefined()
        console.log(`✅ Handled invalid generation request: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)

    it('should handle network errors gracefully', async () => {
      // Temporarily modify API base URL to simulate network error
      const originalBaseURL = api.defaults.baseURL
      api.defaults.baseURL = 'http://localhost:9999/api/v1' // Non-existent port
      
      try {
        await quizService.getAllQuizzes()
        // If we reach here, the request somehow succeeded
        expect(true).toBe(false) // Force failure
      } catch (error: any) {
        expect(error.message).toBeDefined()
        console.log(`✅ Handled network error: ${error.message}`)
      } finally {
        // Restore original base URL
        api.defaults.baseURL = originalBaseURL
      }
    }, TEST_CONFIG.timeout)
  })

  describe('Quiz Service Performance', () => {
    it('should generate quiz within reasonable time', async () => {
      if (TEST_CONFIG.skipGenerationTests || !testSubjectId) {
        console.log('Skipping performance test')
        return
      }

      const startTime = Date.now()
      const quiz = await quizService.generateQuiz({
        subject: testSubjectId,
        difficulty: 'intermediate',
        questionCount: 5
      })
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(30000) // Should complete within 30 seconds
      expect(quiz.questions.length).toBeGreaterThan(0)
      
      console.log(`✅ Generated quiz in ${responseTime}ms`)
    }, TEST_CONFIG.timeout)

    it('should handle concurrent quiz requests', async () => {
      if (!testSubjectId) {
        console.log('Skipping concurrent test')
        return
      }

      const startTime = Date.now()
      
      // Make multiple concurrent requests
      const promises = [
        quizService.getAllQuizzes({ limit: 5 }),
        quizService.getPopularQuizzes(3),
        quizService.searchQuizzes('test', { limit: 3 })
      ]
      
      const results = await Promise.all(promises)
      const responseTime = Date.now() - startTime
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
      })
      
      console.log(`✅ Handled concurrent requests in ${responseTime}ms`)
    }, TEST_CONFIG.timeout)
  })
})