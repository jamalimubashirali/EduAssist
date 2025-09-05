/**
 * End-to-End User Journey Validation Tests
 * Tests the complete flow from signup → onboarding → assessment → personalized dashboard
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { subjectService } from '../services/subjectService'
import { quizService } from '../services/quizService'
import { performanceService } from '../services/performanceService'
import { gamificationService } from '../services/gamificationService'
import { topicService } from '../services/topicService'

// Mock user data for testing
const testUser = {
  name: 'Test User Journey',
  email: `test-journey-${Date.now()}@eduassist.com`,
  password: 'TestPassword123!'
}

let createdUserId: string | null = null
let authToken: string | null = null

describe('Complete User Journey Validation', () => {
  beforeAll(async () => {
    console.log('🚀 Starting Complete User Journey Tests...')
  })

  afterAll(async () => {
    // Cleanup: Delete test user if created
    if (createdUserId) {
      try {
        console.log('🧹 Cleaning up test user...')
        // Note: Add cleanup endpoint if available in backend
      } catch (error) {
        console.warn('⚠️ Could not cleanup test user:', error)
      }
    }
  })

  describe('1. User Registration and Authentication Flow', () => {
    it('should successfully register a new user', async () => {
      console.log('📝 Testing user registration...')
      
      try {
        const response = await authService.register({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password
        })

        expect(response).toBeDefined()
        expect(response.user).toBeDefined()
        expect(response.user.email).toBe(testUser.email)
        expect(response.user.name).toBe(testUser.name)
        expect(response.user.id).toBeDefined()

        createdUserId = response.user.id
        console.log('✅ User registration successful')
      } catch (error: any) {
        console.error('❌ Registration failed:', error.message)
        throw error
      }
    }, 10000)

    it('should successfully login with created user', async () => {
      console.log('🔐 Testing user login...')
      
      try {
        const response = await authService.login({
          email: testUser.email,
          password: testUser.password
        })

        expect(response).toBeDefined()
        expect(response.user).toBeDefined()
        expect(response.user.email).toBe(testUser.email)
        expect(response.user.id).toBe(createdUserId)

        console.log('✅ User login successful')
      } catch (error: any) {
        console.error('❌ Login failed:', error.message)
        throw error
      }
    }, 10000)

    it('should initialize onboarding status after registration', async () => {
      console.log('🎯 Testing onboarding initialization...')
      
      if (!createdUserId) {
        throw new Error('User ID not available from registration')
      }

      try {
        // Update onboarding status to IN_PROGRESS
        await userService.updateOnboarding(createdUserId, {
          status: 'IN_PROGRESS',
          step: 'WELCOME',
          startedAt: new Date().toISOString()
        })

        // Verify onboarding status
        const user = await userService.getUserById(createdUserId)
        expect(user.onboarding?.status).toBe('IN_PROGRESS')
        expect(user.onboarding?.step).toBe('WELCOME')

        console.log('✅ Onboarding initialization successful')
      } catch (error: any) {
        console.error('❌ Onboarding initialization failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('2. Onboarding Flow Validation', () => {
    it('should progress through onboarding steps correctly', async () => {
      console.log('📋 Testing onboarding step progression...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Step 1: Welcome → Profile
        await userService.updateOnboarding(createdUserId, {
          status: 'IN_PROGRESS',
          step: 'PROFILE',
          profile: {
            username: 'TestJourneyUser',
            avatar: '🧑‍🎓',
            bio: 'Testing user journey flow',
            grade_level: 'college'
          }
        })

        let user = await userService.getUserById(createdUserId)
        expect(user.onboarding?.step).toBe('PROFILE')
        expect(user.onboarding?.profile?.display_name).toBe('TestJourneyUser')

        // Step 2: Profile → Subjects
        await userService.updateOnboarding(createdUserId, {
          status: 'IN_PROGRESS',
          step: 'SUBJECTS'
        })

        user = await userService.getUserById(createdUserId)
        expect(user.onboarding?.step).toBe('SUBJECTS')

        console.log('✅ Onboarding step progression successful')
      } catch (error: any) {
        console.error('❌ Onboarding step progression failed:', error.message)
        throw error
      }
    }, 15000)

    it('should handle subject selection and preferences', async () => {
      console.log('📚 Testing subject selection...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Get available subjects
        const subjects = await subjectService.getAllSubjects()
        expect(subjects).toBeDefined()
        expect(subjects.length).toBeGreaterThan(0)

        // Select first 3 subjects for testing
        const selectedSubjects = subjects.slice(0, 3).map(s => s.id)
        
        // Update user preferences
        await userService.updateOnboarding(createdUserId, {
          status: 'IN_PROGRESS',
          step: 'GOALS',
          preferences: selectedSubjects
        })

        const user = await userService.getUserById(createdUserId)
        expect(user.preferences).toBeDefined()
        expect(Array.isArray(user.preferences)).toBe(true)
        expect(user.preferences.length).toBeGreaterThan(0)

        console.log('✅ Subject selection successful')
      } catch (error: any) {
        console.error('❌ Subject selection failed:', error.message)
        throw error
      }
    }, 15000)

    it('should handle goals and learning preferences', async () => {
      console.log('🎯 Testing goals and learning preferences...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        await userService.updateOnboarding(createdUserId, {
          status: 'IN_PROGRESS',
          step: 'ASSESSMENT',
          goals: {
            primary_goal: 'improve_grades',
            study_time_per_week: 10,
            difficulty_preference: 'medium',
            learning_style: 'visual'
          }
        })

        const user = await userService.getUserById(createdUserId)
        expect(user.onboarding?.step).toBe('ASSESSMENT')
        expect(user.onboarding?.goals).toBeDefined()
        expect(user.onboarding?.goals?.primary_goal).toBe('improve_grades')

        console.log('✅ Goals and preferences setup successful')
      } catch (error: any) {
        console.error('❌ Goals setup failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('3. Assessment Flow Validation', () => {
    it('should generate assessment questions based on user preferences', async () => {
      console.log('📝 Testing assessment generation...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        const user = await userService.getUserById(createdUserId)
        const userPreferences = user.preferences || []
        
        if (userPreferences.length === 0) {
          throw new Error('User preferences not set')
        }

        // Generate assessment
        const assessment = await userService.generateAssessment(userPreferences, createdUserId)
        
        expect(assessment).toBeDefined()
        expect(Array.isArray(assessment)).toBe(true)
        expect(assessment.length).toBeGreaterThan(0)
        
        // Validate question structure
        const firstQuestion = assessment[0]
        expect(firstQuestion.questionText).toBeDefined()
        expect(firstQuestion.answerOptions).toBeDefined()
        expect(Array.isArray(firstQuestion.answerOptions)).toBe(true)
        expect(firstQuestion.correctAnswer).toBeDefined()

        console.log(`✅ Assessment generated with ${assessment.length} questions`)
      } catch (error: any) {
        console.error('❌ Assessment generation failed:', error.message)
        throw error
      }
    }, 15000)

    it('should submit assessment and process results', async () => {
      console.log('📊 Testing assessment submission and results processing...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        const user = await userService.getUserById(createdUserId)
        const userPreferences = user.preferences || []
        
        // Generate assessment questions
        const assessment = await userService.generateAssessment(userPreferences, createdUserId)
        
        // Create mock answers (50% correct for realistic results)
        const mockAnswers = assessment.map((question: any, index: number) => ({
          question_id: question._id,
          user_answer: index % 2 === 0 ? question.correctAnswer : question.answerOptions[0],
          time_taken: Math.floor(Math.random() * 30) + 10 // 10-40 seconds
        }))

        // Submit assessment
        const results = await userService.submitAssessment(createdUserId, {
          answers: mockAnswers,
          started_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          completed_at: new Date().toISOString()
        })

        expect(results).toBeDefined()
        expect(results.overall_score).toBeDefined()
        expect(results.subject_scores).toBeDefined()
        expect(Array.isArray(results.subject_scores)).toBe(true)

        console.log(`✅ Assessment submitted with overall score: ${results.overall_score}%`)
      } catch (error: any) {
        console.error('❌ Assessment submission failed:', error.message)
        throw error
      }
    }, 20000)

    it('should complete onboarding and initialize user profile', async () => {
      console.log('🎉 Testing onboarding completion...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Complete onboarding
        await userService.completeOnboarding(createdUserId)

        // Verify onboarding completion
        const user = await userService.getUserById(createdUserId)
        expect(user.onboarding?.status).toBe('COMPLETED')
        expect(user.onboarding?.completedAt).toBeDefined()

        console.log('✅ Onboarding completion successful')
      } catch (error: any) {
        console.error('❌ Onboarding completion failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('4. Post-Onboarding Data Initialization', () => {
    it('should initialize performance tracking after onboarding', async () => {
      console.log('📈 Testing performance tracking initialization...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Get user performance data
        const performance = await performanceService.getUserPerformance(createdUserId)
        
        expect(performance).toBeDefined()
        expect(performance.user_id).toBe(createdUserId)
        expect(performance.overall_stats).toBeDefined()

        console.log('✅ Performance tracking initialized')
      } catch (error: any) {
        console.error('❌ Performance tracking initialization failed:', error.message)
        throw error
      }
    }, 10000)

    it('should initialize gamification system after onboarding', async () => {
      console.log('🎮 Testing gamification system initialization...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Get user gamification data
        const gamificationData = await gamificationService.getUserGamificationSummary(createdUserId)
        
        expect(gamificationData).toBeDefined()
        expect(gamificationData.user_id).toBe(createdUserId)
        expect(gamificationData.level).toBeDefined()
        expect(gamificationData.xp).toBeDefined()

        console.log(`✅ Gamification initialized - Level: ${gamificationData.level}, XP: ${gamificationData.xp}`)
      } catch (error: any) {
        console.error('❌ Gamification initialization failed:', error.message)
        throw error
      }
    }, 10000)

    it('should generate initial recommendations after assessment', async () => {
      console.log('💡 Testing initial recommendations generation...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Get user recommendations
        const recommendations = await userService.getUserRecommendations(createdUserId)
        
        expect(recommendations).toBeDefined()
        expect(Array.isArray(recommendations)).toBe(true)
        
        if (recommendations.length > 0) {
          const firstRec = recommendations[0]
          expect(firstRec.title).toBeDefined()
          expect(firstRec.description).toBeDefined()
          expect(firstRec.priority).toBeDefined()
        }

        console.log(`✅ Generated ${recommendations.length} initial recommendations`)
      } catch (error: any) {
        console.error('❌ Recommendations generation failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('5. Dashboard and Navigation Validation', () => {
    it('should load personalized dashboard content', async () => {
      console.log('🏠 Testing personalized dashboard loading...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Test all dashboard data sources
        const [user, performance, gamification, subjects] = await Promise.all([
          userService.getUserById(createdUserId),
          performanceService.getUserPerformance(createdUserId),
          gamificationService.getUserGamificationSummary(createdUserId),
          subjectService.getAllSubjects()
        ])

        // Validate user data
        expect(user).toBeDefined()
        expect(user.onboarding?.status).toBe('COMPLETED')

        // Validate performance data
        expect(performance).toBeDefined()
        expect(performance.user_id).toBe(createdUserId)

        // Validate gamification data
        expect(gamification).toBeDefined()
        expect(gamification.user_id).toBe(createdUserId)

        // Validate subjects data
        expect(subjects).toBeDefined()
        expect(subjects.length).toBeGreaterThan(0)

        console.log('✅ Dashboard data loading successful')
      } catch (error: any) {
        console.error('❌ Dashboard data loading failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate topic service integration', async () => {
      console.log('📖 Testing topic service integration...')
      
      try {
        // Test topic service endpoints
        const topics = await topicService.getAllTopics()
        expect(topics).toBeDefined()
        expect(Array.isArray(topics)).toBe(true)

        if (topics.length > 0) {
          const firstTopic = topics[0]
          expect(firstTopic.id).toBeDefined()
          expect(firstTopic.name).toBeDefined()
          expect(firstTopic.subjectId).toBeDefined()
        }

        console.log(`✅ Topic service working - ${topics.length} topics available`)
      } catch (error: any) {
        console.error('❌ Topic service integration failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate quiz service integration for personalized content', async () => {
      console.log('🧩 Testing quiz service integration...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        const user = await userService.getUserById(createdUserId)
        const userPreferences = user.preferences || []
        
        if (userPreferences.length > 0) {
          // Test personalized quiz generation
          const quizConfig = {
            subject_ids: userPreferences.slice(0, 1), // Use first subject
            difficulty: 'medium',
            question_count: 5,
            user_id: createdUserId
          }

          const personalizedQuiz = await quizService.generatePersonalizedQuiz(quizConfig)
          
          expect(personalizedQuiz).toBeDefined()
          expect(personalizedQuiz.questions).toBeDefined()
          expect(Array.isArray(personalizedQuiz.questions)).toBe(true)
          expect(personalizedQuiz.questions.length).toBeGreaterThan(0)

          console.log(`✅ Personalized quiz generated with ${personalizedQuiz.questions.length} questions`)
        } else {
          console.log('⚠️ No user preferences available for quiz generation')
        }
      } catch (error: any) {
        console.error('❌ Quiz service integration failed:', error.message)
        throw error
      }
    }, 15000)
  })

  describe('6. Data Consistency Validation', () => {
    it('should maintain data consistency across all services', async () => {
      console.log('🔄 Testing data consistency across services...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        // Get data from all services
        const [user, performance, gamification] = await Promise.all([
          userService.getUserById(createdUserId),
          performanceService.getUserPerformance(createdUserId),
          gamificationService.getUserGamificationSummary(createdUserId)
        ])

        // Validate user ID consistency
        expect(user.id).toBe(createdUserId)
        expect(performance.user_id).toBe(createdUserId)
        expect(gamification.user_id).toBe(createdUserId)

        // Validate onboarding completion consistency
        expect(user.onboarding?.status).toBe('COMPLETED')
        expect(user.onboarding?.completedAt).toBeDefined()

        // Validate preferences consistency
        expect(user.preferences).toBeDefined()
        expect(Array.isArray(user.preferences)).toBe(true)

        console.log('✅ Data consistency validation successful')
      } catch (error: any) {
        console.error('❌ Data consistency validation failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate smooth transition from onboarding to active learning', async () => {
      console.log('🎓 Testing transition from onboarding to active learning...')
      
      if (!createdUserId) {
        throw new Error('User ID not available')
      }

      try {
        const user = await userService.getUserById(createdUserId)
        
        // Validate user is ready for active learning
        expect(user.onboarding?.status).toBe('COMPLETED')
        expect(user.preferences).toBeDefined()
        expect(user.preferences.length).toBeGreaterThan(0)

        // Validate performance baseline is established
        const performance = await performanceService.getUserPerformance(createdUserId)
        expect(performance.overall_stats).toBeDefined()

        // Validate gamification is active
        const gamification = await gamificationService.getUserGamificationSummary(createdUserId)
        expect(gamification.level).toBeGreaterThanOrEqual(1)
        expect(gamification.xp).toBeGreaterThanOrEqual(0)

        console.log('✅ Smooth transition to active learning validated')
      } catch (error: any) {
        console.error('❌ Transition validation failed:', error.message)
        throw error
      }
    }, 10000)
  })
})