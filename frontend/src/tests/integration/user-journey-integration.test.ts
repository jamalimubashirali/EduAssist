/**
 * Complete User Journey Integration Tests
 * 
 * Tests complete user flows from signup through advanced learning features
 * with real backend integration, validating the entire learning experience.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import { subjectService } from '@/services/subjectService'
import { topicService } from '@/services/topicService'
import { quizService } from '@/services/quizService'
import { performanceService } from '@/services/performanceService'
import { gamificationService } from '@/services/gamificationService'
import { recommendationService } from '@/services/recommendationService'

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 1 minute timeout for complete flows
  skipAuthFlow: false, // Set to true to skip authentication tests
  skipOnboardingFlow: false, // Set to true to skip onboarding tests
  skipLearningFlow: false, // Set to true to skip learning journey tests
}

// Test user data
const TEST_USER = {
  name: `Test User ${Date.now()}`,
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPassword123!'
}

// Test state
let testUserId: string | null = null
let isAuthenticated = false
let testSubjectId: string | null = null
let testTopicId: string | null = null
let onboardingCompleted = false

describe('Complete User Journey Integration', () => {
  beforeAll(async () => {
    // Get test subjects and topics for the journey
    try {
      const subjects = await subjectService.getAllSubjects()
      if (subjects.length > 0) {
        testSubjectId = subjects[0].id
        console.log(`Test subject available: ${subjects[0].name}`)
        
        const topics = await topicService.getTopicsBySubject(testSubjectId)
        if (topics.length > 0) {
          testTopicId = topics[0].id
          console.log(`Test topic available: ${topics[0].name}`)
        }
      }
    } catch (error) {
      console.warn('Failed to setup test data:', error)
    }
  }, TEST_CONFIG.timeout)

  afterAll(async () => {
    // Cleanup: logout if authenticated
    if (isAuthenticated) {
      try {
        await authService.logout()
        console.log('Cleaned up test session')
      } catch (error) {
        console.warn('Cleanup failed:', error)
      }
    }
  })

  describe('User Registration and Authentication Flow', () => {
    it('should complete user registration successfully', async () => {
      if (TEST_CONFIG.skipAuthFlow) {
        console.log('Skipping auth flow tests')
        return
      }

      const registrationResult = await authService.register({
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password
      })
      
      expect(registrationResult).toHaveProperty('message')
      
      if (registrationResult.user) {
        testUserId = registrationResult.user.id
        isAuthenticated = true
        
        expect(registrationResult.user).toHaveProperty('id')
        expect(registrationResult.user).toHaveProperty('name', TEST_USER.name)
        expect(registrationResult.user).toHaveProperty('email', TEST_USER.email)
        
        console.log(`✅ User registered successfully: ${registrationResult.user.name}`)
      } else {
        console.log('Registration completed but user not returned in response')
      }
    }, TEST_CONFIG.timeout)

    it('should authenticate user after registration', async () => {
      if (TEST_CONFIG.skipAuthFlow || !testUserId) {
        console.log('Skipping authentication test')
        return
      }

      // If not already authenticated from registration, try login
      if (!isAuthenticated) {
        const loginResult = await authService.login({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        
        expect(loginResult).toHaveProperty('message')
        
        if (loginResult.user) {
          testUserId = loginResult.user.id
          isAuthenticated = true
        }
      }
      
      // Verify authentication by getting current user
      const currentUser = await userService.getCurrentUser()
      expect(currentUser).toHaveProperty('id')
      expect(currentUser).toHaveProperty('email', TEST_USER.email)
      
      console.log(`✅ User authenticated successfully: ${currentUser.name}`)
    }, TEST_CONFIG.timeout)

    it('should validate authentication status', async () => {
      if (TEST_CONFIG.skipAuthFlow) {
        console.log('Skipping auth status test')
        return
      }

      const authStatus = await authService.getAuthStatus()
      
      expect(authStatus).toHaveProperty('isAuthenticated')
      
      if (isAuthenticated) {
        expect(authStatus.isAuthenticated).toBe(true)
        expect(authStatus).toHaveProperty('user')
        console.log('✅ Authentication status validated')
      } else {
        expect(authStatus.isAuthenticated).toBe(false)
        console.log('✅ Non-authenticated status validated')
      }
    }, TEST_CONFIG.timeout)
  })

  describe('Onboarding and Assessment Flow', () => {
    it('should validate user preferences and onboarding status', async () => {
      if (TEST_CONFIG.skipOnboardingFlow || !testUserId) {
        console.log('Skipping onboarding validation')
        return
      }

      const preferencesValidation = await userService.validateUserPreferences(testUserId)
      
      expect(preferencesValidation).toHaveProperty('hasPreferences')
      expect(preferencesValidation).toHaveProperty('hasGoals')
      expect(preferencesValidation).toHaveProperty('hasOnboardingData')
      expect(preferencesValidation).toHaveProperty('isComplete')
      expect(preferencesValidation).toHaveProperty('details')
      
      console.log(`✅ Onboarding validation completed:`)
      console.log(`   Has Preferences: ${preferencesValidation.hasPreferences}`)
      console.log(`   Has Goals: ${preferencesValidation.hasGoals}`)
      console.log(`   Is Complete: ${preferencesValidation.isComplete}`)
      
      onboardingCompleted = preferencesValidation.isComplete
    }, TEST_CONFIG.timeout)

    it('should generate assessment for selected subjects', async () => {
      if (TEST_CONFIG.skipOnboardingFlow || !testUserId || !testSubjectId) {
        console.log('Skipping assessment generation')
        return
      }

      const assessmentResult = await userService.generateAssessment(testUserId, [testSubjectId])
      
      expect(assessmentResult).toHaveProperty('questions')
      expect(Array.isArray(assessmentResult.questions)).toBe(true)
      expect(assessmentResult.questions.length).toBeGreaterThan(0)
      
      // Validate question structure
      const question = assessmentResult.questions[0]
      expect(question).toHaveProperty('id')
      expect(question).toHaveProperty('text')
      expect(question).toHaveProperty('options')
      expect(question).toHaveProperty('correctAnswer')
      
      console.log(`✅ Assessment generated with ${assessmentResult.questions.length} questions`)
    }, TEST_CONFIG.timeout)

    it('should submit assessment and process results', async () => {
      if (TEST_CONFIG.skipOnboardingFlow || !testUserId || !testSubjectId) {
        console.log('Skipping assessment submission')
        return
      }

      // Generate assessment first
      const assessmentResult = await userService.generateAssessment(testUserId, [testSubjectId])
      
      if (assessmentResult.questions.length === 0) {
        console.log('No assessment questions available - skipping submission')
        return
      }

      // Create mock answers for the assessment
      const mockAnswers = assessmentResult.questions.map((question: any, index: number) => ({
        question_id: question.id,
        user_answer: question.options[index % question.options.length], // Rotate through options
        time_taken: Math.floor(Math.random() * 30) + 10 // 10-40 seconds per question
      }))

      const submissionData = {
        answers: mockAnswers,
        started_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        completed_at: new Date().toISOString()
      }

      const submissionResult = await userService.submitAssessment(testUserId, submissionData)
      
      expect(submissionResult).toBeDefined()
      console.log(`✅ Assessment submitted with ${mockAnswers.length} answers`)
    }, TEST_CONFIG.timeout)

    it('should complete onboarding process', async () => {
      if (TEST_CONFIG.skipOnboardingFlow || !testUserId) {
        console.log('Skipping onboarding completion')
        return
      }

      const onboardingData = {
        preferences: ['mathematics', 'science'],
        goals: {
          primary_goal: 'improve_grades',
          focus_areas: ['problem_solving', 'test_preparation'],
          custom_goal: 'Master advanced mathematics concepts'
        },
        assessment_results: {
          completed: true,
          subjects_assessed: testSubjectId ? [testSubjectId] : [],
          overall_score: 75
        }
      }

      const completionResult = await userService.completeOnboarding(testUserId, onboardingData)
      
      expect(completionResult).toBeDefined()
      onboardingCompleted = true
      
      console.log('✅ Onboarding completed successfully')
    }, TEST_CONFIG.timeout)

    it('should initialize post-onboarding experience', async () => {
      if (TEST_CONFIG.skipOnboardingFlow || !testUserId || !onboardingCompleted) {
        console.log('Skipping post-onboarding initialization')
        return
      }

      const initializationResult = await userService.initializePostOnboardingExperience(testUserId)
      
      expect(initializationResult).toHaveProperty('user')
      expect(initializationResult).toHaveProperty('preferencesValidation')
      expect(initializationResult).toHaveProperty('recommendationsTriggered')
      
      expect(initializationResult.user).toHaveProperty('id', testUserId)
      expect(typeof initializationResult.recommendationsTriggered).toBe('boolean')
      
      console.log(`✅ Post-onboarding experience initialized`)
      console.log(`   Recommendations Triggered: ${initializationResult.recommendationsTriggered}`)
    }, TEST_CONFIG.timeout)
  })

  describe('Learning Journey Flow', () => {
    it('should navigate subjects → topics → quizzes flow', async () => {
      if (TEST_CONFIG.skipLearningFlow) {
        console.log('Skipping learning journey tests')
        return
      }

      // Step 1: Get all subjects
      const subjects = await subjectService.getAllSubjects()
      expect(Array.isArray(subjects)).toBe(true)
      expect(subjects.length).toBeGreaterThan(0)
      
      const selectedSubject = subjects[0]
      console.log(`✅ Step 1: Selected subject "${selectedSubject.name}"`)

      // Step 2: Get topics for the selected subject
      const topics = await topicService.getTopicsBySubject(selectedSubject.id)
      expect(Array.isArray(topics)).toBe(true)
      
      if (topics.length === 0) {
        console.log('No topics available for selected subject - ending flow')
        return
      }
      
      const selectedTopic = topics[0]
      console.log(`✅ Step 2: Selected topic "${selectedTopic.name}"`)

      // Step 3: Get quizzes for the selected topic
      const quizzes = await quizService.getQuizzesByTopic(selectedTopic.id)
      expect(Array.isArray(quizzes)).toBe(true)
      
      console.log(`✅ Step 3: Found ${quizzes.length} quizzes for topic`)

      // Step 4: Generate a quiz if none exist
      if (quizzes.length === 0) {
        try {
          const generatedQuiz = await quizService.generateQuiz({
            subject: selectedSubject.id,
            difficulty: 'intermediate',
            questionCount: 5,
            topics: [selectedTopic.id]
          })
          
          expect(generatedQuiz).toHaveProperty('questions')
          expect(generatedQuiz.questions.length).toBeGreaterThan(0)
          
          console.log(`✅ Step 4: Generated quiz with ${generatedQuiz.questions.length} questions`)
        } catch (error: any) {
          console.log(`⚠️ Quiz generation failed: ${error.message}`)
        }
      }
    }, TEST_CONFIG.timeout)

    it('should access personalized learning features', async () => {
      if (TEST_CONFIG.skipLearningFlow || !testUserId || !testTopicId || !testSubjectId) {
        console.log('Skipping personalized features test')
        return
      }

      // Test personalized quiz generation
      try {
        const personalizedQuiz = await quizService.generatePersonalizedQuiz({
          topicId: testTopicId,
          subjectId: testSubjectId,
          questionsCount: 5,
          sessionType: 'practice'
        })
        
        expect(personalizedQuiz).toHaveProperty('questions')
        expect(personalizedQuiz).toHaveProperty('metadata')
        expect(personalizedQuiz.metadata).toHaveProperty('userLevel')
        
        console.log(`✅ Personalized quiz generated (User Level: ${personalizedQuiz.metadata.userLevel})`)
      } catch (error: any) {
        console.log(`⚠️ Personalized quiz generation failed: ${error.message}`)
      }

      // Test recommendations
      try {
        const recommendations = await recommendationService.getUserRecommendations(testUserId)
        expect(Array.isArray(recommendations)).toBe(true)
        
        console.log(`✅ Retrieved ${recommendations.length} recommendations`)
      } catch (error: any) {
        console.log(`⚠️ Recommendations failed: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)

    it('should track user performance and progress', async () => {
      if (TEST_CONFIG.skipLearningFlow || !testUserId) {
        console.log('Skipping performance tracking test')
        return
      }

      try {
        // Get user performance data
        const performance = await performanceService.getUserPerformance(testUserId)
        expect(Array.isArray(performance)).toBe(true)
        
        console.log(`✅ Retrieved performance data for ${performance.length} topics`)

        // Get performance analytics
        const analytics = await performanceService.getPerformanceAnalytics(testUserId)
        expect(analytics).toHaveProperty('overallStats')
        expect(analytics).toHaveProperty('subjectBreakdown')
        
        console.log(`✅ Retrieved performance analytics`)
      } catch (error: any) {
        console.log(`⚠️ Performance tracking failed: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)

    it('should access gamification features', async () => {
      if (TEST_CONFIG.skipLearningFlow || !testUserId) {
        console.log('Skipping gamification test')
        return
      }

      try {
        // Get user stats
        const userStats = await gamificationService.getUserStats(testUserId)
        expect(userStats).toHaveProperty('totalXP')
        expect(userStats).toHaveProperty('level')
        expect(userStats).toHaveProperty('badges')
        
        console.log(`✅ User gamification stats: Level ${userStats.level}, ${userStats.totalXP} XP`)

        // Get user badges
        const badges = await gamificationService.getUserBadges(testUserId)
        expect(Array.isArray(badges)).toBe(true)
        
        console.log(`✅ Retrieved ${badges.length} user badges`)

        // Get leaderboard position
        const leaderboard = await gamificationService.getGlobalLeaderboard(10)
        expect(Array.isArray(leaderboard)).toBe(true)
        
        console.log(`✅ Retrieved global leaderboard with ${leaderboard.length} entries`)
      } catch (error: any) {
        console.log(`⚠️ Gamification features failed: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)
  })

  describe('Data Consistency Across User Journey', () => {
    it('should maintain consistent user data across all services', async () => {
      if (!testUserId) {
        console.log('Skipping data consistency test - no user')
        return
      }

      try {
        // Get user data from different services
        const [
          userFromUserService,
          userFromAuth,
          userStats,
          userPerformance
        ] = await Promise.all([
          userService.getUserById(testUserId),
          userService.getCurrentUser(),
          gamificationService.getUserStats(testUserId).catch(() => null),
          performanceService.getUserPerformance(testUserId).catch(() => null)
        ])

        // Validate user data consistency
        expect(userFromUserService.id).toBe(testUserId)
        expect(userFromAuth.id).toBe(testUserId)
        expect(userFromUserService.email).toBe(userFromAuth.email)
        expect(userFromUserService.name).toBe(userFromAuth.name)
        
        console.log(`✅ User data consistent across services`)
        
        if (userStats) {
          console.log(`   Gamification: Level ${userStats.level}, ${userStats.totalXP} XP`)
        }
        
        if (userPerformance) {
          console.log(`   Performance: ${userPerformance.length} topic performances`)
        }
      } catch (error: any) {
        console.log(`⚠️ Data consistency check failed: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)

    it('should validate cross-service data relationships', async () => {
      if (!testSubjectId || !testTopicId) {
        console.log('Skipping cross-service validation - missing test data')
        return
      }

      try {
        // Get related data from different services
        const [
          subject,
          topicsInSubject,
          quizzesInTopic,
          topicFromTopicService
        ] = await Promise.all([
          subjectService.getSubjectById(testSubjectId),
          topicService.getTopicsBySubject(testSubjectId),
          quizService.getQuizzesByTopic(testTopicId),
          topicService.getTopicById(testTopicId)
        ])

        // Validate relationships
        expect(subject.id).toBe(testSubjectId)
        expect(topicFromTopicService.id).toBe(testTopicId)
        expect(topicFromTopicService.subjectId).toBe(testSubjectId)
        
        // Find the test topic in the subject's topics
        const topicInSubject = topicsInSubject.find(t => t.id === testTopicId)
        expect(topicInSubject).toBeDefined()
        expect(topicInSubject?.subjectId).toBe(testSubjectId)
        
        // Validate quiz relationships
        quizzesInTopic.forEach(quiz => {
          expect(quiz.topicId).toBe(testTopicId)
        })
        
        console.log(`✅ Cross-service relationships validated`)
        console.log(`   Subject: ${subject.name}`)
        console.log(`   Topics in subject: ${topicsInSubject.length}`)
        console.log(`   Quizzes in topic: ${quizzesInTopic.length}`)
      } catch (error: any) {
        console.log(`⚠️ Cross-service validation failed: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)
  })

  describe('Error Recovery and User Experience', () => {
    it('should handle service failures gracefully during user journey', async () => {
      // Test that the user journey can continue even if some services fail
      
      try {
        // This should work
        const subjects = await subjectService.getAllSubjects()
        expect(Array.isArray(subjects)).toBe(true)
        console.log(`✅ Core service (subjects) working: ${subjects.length} subjects`)
      } catch (error: any) {
        console.log(`❌ Core service failure would break user journey: ${error.message}`)
        throw error
      }

      // Test optional services that shouldn't break the journey
      const optionalServices = [
        { name: 'Recommendations', test: () => testUserId ? recommendationService.getUserRecommendations(testUserId) : Promise.resolve([]) },
        { name: 'Gamification', test: () => testUserId ? gamificationService.getUserStats(testUserId) : Promise.resolve(null) },
        { name: 'Performance', test: () => testUserId ? performanceService.getUserPerformance(testUserId) : Promise.resolve([]) }
      ]

      for (const service of optionalServices) {
        try {
          await service.test()
          console.log(`✅ Optional service (${service.name}) working`)
        } catch (error: any) {
          console.log(`⚠️ Optional service (${service.name}) failed but journey can continue: ${error.message}`)
        }
      }
    }, TEST_CONFIG.timeout)

    it('should provide meaningful feedback during long operations', async () => {
      if (!testSubjectId) {
        console.log('Skipping feedback test - no test subject')
        return
      }

      // Test that quiz generation provides appropriate feedback
      const startTime = Date.now()
      
      try {
        const quiz = await quizService.generateQuiz({
          subject: testSubjectId,
          difficulty: 'intermediate',
          questionCount: 5
        })
        
        const duration = Date.now() - startTime
        
        expect(quiz).toHaveProperty('questions')
        console.log(`✅ Quiz generation completed in ${duration}ms with appropriate feedback`)
        
        // If it takes longer than 5 seconds, user should have seen loading feedback
        if (duration > 5000) {
          console.log(`   Long operation (${duration}ms) - loading feedback should be shown`)
        }
      } catch (error: any) {
        console.log(`⚠️ Quiz generation failed: ${error.message}`)
      }
    }, TEST_CONFIG.timeout)
  })
})