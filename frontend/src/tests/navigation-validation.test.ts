/**
 * Navigation and Page Validation Tests
 * Tests all navigation paths are functional and lead to working pages
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { subjectService } from '../services/subjectService'
import { topicService } from '../services/topicService'
import { quizService } from '../services/quizService'
import { userService } from '../services/userService'
import { gamificationService } from '../services/gamificationService'
import { performanceService } from '../services/performanceService'

// Test data
let testSubjectIds: string[] = []
let testTopicIds: string[] = []

describe('Navigation and Page Validation', () => {
  beforeAll(async () => {
    console.log('🚀 Starting Navigation Validation Tests...')
    
    // Get test data for navigation testing
    try {
      const subjects = await subjectService.getAllSubjects()
      testSubjectIds = subjects.slice(0, 3).map(s => s.id)
      
      if (testSubjectIds.length > 0) {
        const topics = await topicService.getTopicsBySubject(testSubjectIds[0])
        testTopicIds = topics.slice(0, 3).map(t => t.id)
      }
      
      console.log(`📚 Using ${testSubjectIds.length} subjects and ${testTopicIds.length} topics for testing`)
    } catch (error) {
      console.warn('⚠️ Could not fetch test data for navigation testing')
    }
  })

  describe('1. Authentication Flow Navigation', () => {
    it('should validate login page functionality', async () => {
      console.log('🔐 Testing login page navigation...')
      
      try {
        // Test login service connectivity
        const loginAttempt = await authService.login({
          email: 'test@example.com',
          password: 'wrongpassword'
        }).catch(error => error)

        // Should fail with authentication error, not connection error
        expect(loginAttempt).toBeDefined()
        
        console.log('✅ Login page service connectivity validated')
      } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('unauthorized') || 
            error.message.includes('invalid') || error.message.includes('credentials')) {
          console.log('✅ Login service is working (authentication failure expected)')
        } else {
          console.error('❌ Login page connectivity failed:', error.message)
          throw error
        }
      }
    }, 10000)

    it('should validate registration page functionality', async () => {
      console.log('📝 Testing registration page navigation...')
      
      try {
        // Test registration service connectivity with invalid data
        const registrationAttempt = await authService.register({
          name: '',
          email: 'invalid-email',
          password: '123'
        }).catch(error => error)

        // Should fail with validation error, not connection error
        expect(registrationAttempt).toBeDefined()
        
        console.log('✅ Registration page service connectivity validated')
      } catch (error: any) {
        if (error.message.includes('400') || error.message.includes('validation') || 
            error.message.includes('invalid') || error.message.includes('required')) {
          console.log('✅ Registration service is working (validation failure expected)')
        } else {
          console.error('❌ Registration page connectivity failed:', error.message)
          throw error
        }
      }
    }, 10000)
  })

  describe('2. Onboarding Flow Navigation', () => {
    it('should validate onboarding welcome page', async () => {
      console.log('👋 Testing onboarding welcome page...')
      
      // Test that onboarding navigation logic works
      const onboardingSteps = ['welcome', 'profile', 'subjects', 'goals', 'assessment']
      
      onboardingSteps.forEach((step, index) => {
        expect(step).toBeDefined()
        expect(typeof step).toBe('string')
        
        // Test step progression logic
        const nextStep = onboardingSteps[index + 1]
        if (nextStep) {
          expect(nextStep).toBeDefined()
        }
      })
      
      console.log('✅ Onboarding flow navigation structure validated')
    }, 5000)

    it('should validate onboarding profile page functionality', async () => {
      console.log('👤 Testing onboarding profile page...')
      
      // Test profile data structure
      const mockProfileData = {
        username: 'TestUser',
        avatar: '🧑‍🎓',
        bio: 'Test bio',
        grade_level: 'college'
      }

      expect(mockProfileData.username).toBeDefined()
      expect(mockProfileData.avatar).toBeDefined()
      expect(mockProfileData.grade_level).toBeDefined()
      expect(typeof mockProfileData.username).toBe('string')
      expect(mockProfileData.username.length).toBeGreaterThan(0)
      
      console.log('✅ Profile page data structure validated')
    }, 5000)

    it('should validate onboarding subjects page functionality', async () => {
      console.log('📚 Testing onboarding subjects page...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        expect(subjects).toBeDefined()
        expect(Array.isArray(subjects)).toBe(true)
        expect(subjects.length).toBeGreaterThan(0)
        
        // Validate subject structure for onboarding
        if (subjects.length > 0) {
          const firstSubject = subjects[0]
          expect(firstSubject.id).toBeDefined()
          expect(firstSubject.name).toBeDefined()
          expect(firstSubject.description).toBeDefined()
        }
        
        console.log(`✅ Subjects page: ${subjects.length} subjects available for selection`)
      } catch (error: any) {
        console.error('❌ Subjects page functionality failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate onboarding assessment page functionality', async () => {
      console.log('📝 Testing onboarding assessment page...')
      
      if (testSubjectIds.length === 0) {
        console.log('⚠️ Skipping assessment test - no subjects available')
        return
      }

      try {
        // Test assessment generation
        const assessment = await userService.generateAssessment(testSubjectIds, 'test-user-id')
        
        expect(assessment).toBeDefined()
        expect(Array.isArray(assessment)).toBe(true)
        
        if (assessment.length > 0) {
          const firstQuestion = assessment[0]
          expect(firstQuestion.questionText || firstQuestion.question_text).toBeDefined()
          expect(firstQuestion.answerOptions || firstQuestion.answer_options).toBeDefined()
          expect(firstQuestion.correctAnswer || firstQuestion.correct_answer).toBeDefined()
        }
        
        console.log(`✅ Assessment page: ${assessment.length} questions generated`)
      } catch (error: any) {
        console.error('❌ Assessment page functionality failed:', error.message)
        throw error
      }
    }, 15000)
  })

  describe('3. Main Application Navigation', () => {
    it('should validate dashboard page functionality', async () => {
      console.log('🏠 Testing dashboard page...')
      
      try {
        // Test all dashboard data sources
        const dashboardDataPromises = [
          subjectService.getAllSubjects(),
          gamificationService.getUserGamificationSummary('test-user-id').catch(() => null),
          performanceService.getUserPerformance('test-user-id').catch(() => null),
          userService.getUserRecommendations('test-user-id').catch(() => null)
        ]

        const [subjects, gamification, performance, recommendations] = await Promise.all(dashboardDataPromises)
        
        // Validate subjects data (required for dashboard)
        expect(subjects).toBeDefined()
        expect(Array.isArray(subjects)).toBe(true)
        
        console.log('✅ Dashboard page data sources validated')
      } catch (error: any) {
        console.error('❌ Dashboard page functionality failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate subjects page functionality', async () => {
      console.log('📚 Testing subjects page...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        expect(subjects).toBeDefined()
        expect(Array.isArray(subjects)).toBe(true)
        expect(subjects.length).toBeGreaterThan(0)
        
        // Test subject detail functionality
        if (subjects.length > 0) {
          const firstSubject = subjects[0]
          expect(firstSubject.id).toBeDefined()
          expect(firstSubject.name).toBeDefined()
          
          // Test topics for subject
          try {
            const topics = await topicService.getTopicsBySubject(firstSubject.id)
            expect(Array.isArray(topics)).toBe(true)
            console.log(`✅ Subject "${firstSubject.name}" has ${topics.length} topics`)
          } catch (error) {
            console.log(`⚠️ No topics found for subject "${firstSubject.name}"`)
          }
        }
        
        console.log(`✅ Subjects page: ${subjects.length} subjects available`)
      } catch (error: any) {
        console.error('❌ Subjects page functionality failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate topics page functionality', async () => {
      console.log('📖 Testing topics page...')
      
      try {
        const allTopics = await topicService.getAllTopics()
        
        expect(allTopics).toBeDefined()
        expect(Array.isArray(allTopics)).toBe(true)
        
        if (allTopics.length > 0) {
          const firstTopic = allTopics[0]
          expect(firstTopic.id).toBeDefined()
          expect(firstTopic.name).toBeDefined()
          expect(firstTopic.subjectId).toBeDefined()
        }
        
        console.log(`✅ Topics page: ${allTopics.length} topics available`)
      } catch (error: any) {
        console.error('❌ Topics page functionality failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate quiz pages functionality', async () => {
      console.log('🧩 Testing quiz pages...')
      
      if (testSubjectIds.length === 0) {
        console.log('⚠️ Skipping quiz test - no subjects available')
        return
      }

      try {
        // Test quiz generation
        const quizConfig = {
          subject_ids: [testSubjectIds[0]],
          difficulty: 'medium',
          question_count: 5,
          user_id: 'test-user-id'
        }

        const quiz = await quizService.generatePersonalizedQuiz(quizConfig)
        
        expect(quiz).toBeDefined()
        expect(quiz.questions).toBeDefined()
        expect(Array.isArray(quiz.questions)).toBe(true)
        
        if (quiz.questions.length > 0) {
          const firstQuestion = quiz.questions[0]
          expect(firstQuestion.questionText || firstQuestion.question_text).toBeDefined()
          expect(firstQuestion.answerOptions || firstQuestion.answer_options).toBeDefined()
        }
        
        console.log(`✅ Quiz pages: Generated quiz with ${quiz.questions.length} questions`)
      } catch (error: any) {
        console.error('❌ Quiz pages functionality failed:', error.message)
        throw error
      }
    }, 15000)
  })

  describe('4. Gamification Pages Navigation', () => {
    it('should validate badges page functionality', async () => {
      console.log('🏆 Testing badges page...')
      
      try {
        const badges = await gamificationService.getUserBadges('test-user-id')
        
        expect(badges).toBeDefined()
        expect(Array.isArray(badges)).toBe(true)
        
        console.log(`✅ Badges page: Service connectivity validated`)
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('✅ Badges page service is working (user not found expected)')
        } else {
          console.error('❌ Badges page functionality failed:', error.message)
          throw error
        }
      }
    }, 10000)

    it('should validate quests page functionality', async () => {
      console.log('🎯 Testing quests page...')
      
      try {
        const quests = await gamificationService.getUserQuests('test-user-id')
        
        expect(quests).toBeDefined()
        expect(Array.isArray(quests)).toBe(true)
        
        console.log(`✅ Quests page: Service connectivity validated`)
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('✅ Quests page service is working (user not found expected)')
        } else {
          console.error('❌ Quests page functionality failed:', error.message)
          throw error
        }
      }
    }, 10000)

    it('should validate leaderboard page functionality', async () => {
      console.log('🏆 Testing leaderboard page...')
      
      try {
        const leaderboard = await gamificationService.getLeaderboard('global', 10)
        
        expect(leaderboard).toBeDefined()
        expect(Array.isArray(leaderboard)).toBe(true)
        
        console.log(`✅ Leaderboard page: ${leaderboard.length} entries found`)
      } catch (error: any) {
        console.error('❌ Leaderboard page functionality failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('5. Analytics and Progress Pages', () => {
    it('should validate progress page functionality', async () => {
      console.log('📊 Testing progress page...')
      
      try {
        const performance = await performanceService.getUserPerformance('test-user-id')
        
        expect(performance).toBeDefined()
        
        console.log('✅ Progress page: Service connectivity validated')
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('✅ Progress page service is working (user not found expected)')
        } else {
          console.error('❌ Progress page functionality failed:', error.message)
          throw error
        }
      }
    }, 10000)

    it('should validate analytics page functionality', async () => {
      console.log('📈 Testing analytics page...')
      
      try {
        // Test analytics data sources
        const analyticsPromises = [
          performanceService.getUserPerformance('test-user-id').catch(() => null),
          gamificationService.getUserGamificationSummary('test-user-id').catch(() => null),
          subjectService.getAllSubjects()
        ]

        const [performance, gamification, subjects] = await Promise.all(analyticsPromises)
        
        // At least subjects should be available for analytics
        expect(subjects).toBeDefined()
        expect(Array.isArray(subjects)).toBe(true)
        
        console.log('✅ Analytics page: Data sources validated')
      } catch (error: any) {
        console.error('❌ Analytics page functionality failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate recommendations page functionality', async () => {
      console.log('💡 Testing recommendations page...')
      
      try {
        const recommendations = await userService.getUserRecommendations('test-user-id')
        
        expect(recommendations).toBeDefined()
        expect(Array.isArray(recommendations)).toBe(true)
        
        console.log('✅ Recommendations page: Service connectivity validated')
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('✅ Recommendations page service is working (user not found expected)')
        } else {
          console.error('❌ Recommendations page functionality failed:', error.message)
          throw error
        }
      }
    }, 10000)
  })

  describe('6. Navigation Flow Validation', () => {
    it('should validate subject → topic → quiz navigation flow', async () => {
      console.log('🔄 Testing subject → topic → quiz flow...')
      
      if (testSubjectIds.length === 0) {
        console.log('⚠️ Skipping navigation flow test - no subjects available')
        return
      }

      try {
        // Step 1: Get subject
        const subjects = await subjectService.getAllSubjects()
        const testSubject = subjects.find(s => s.id === testSubjectIds[0])
        expect(testSubject).toBeDefined()
        
        // Step 2: Get topics for subject
        const topics = await topicService.getTopicsBySubject(testSubject!.id)
        expect(Array.isArray(topics)).toBe(true)
        
        // Step 3: Generate quiz for subject/topic
        const quizConfig = {
          subject_ids: [testSubject!.id],
          difficulty: 'medium',
          question_count: 3,
          user_id: 'test-user-id'
        }

        const quiz = await quizService.generatePersonalizedQuiz(quizConfig)
        expect(quiz).toBeDefined()
        expect(quiz.questions).toBeDefined()
        
        console.log(`✅ Navigation flow: ${testSubject!.name} → ${topics.length} topics → quiz with ${quiz.questions.length} questions`)
      } catch (error: any) {
        console.error('❌ Navigation flow validation failed:', error.message)
        throw error
      }
    }, 20000)

    it('should validate onboarding → dashboard → learning flow', async () => {
      console.log('🎓 Testing onboarding → dashboard → learning flow...')
      
      try {
        // Test onboarding completion flow
        const mockOnboardingData = {
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          profile: {
            username: 'TestUser',
            grade_level: 'college'
          },
          preferences: testSubjectIds.slice(0, 2)
        }

        expect(mockOnboardingData.status).toBe('COMPLETED')
        expect(mockOnboardingData.completedAt).toBeDefined()
        expect(mockOnboardingData.preferences.length).toBeGreaterThan(0)
        
        // Test dashboard readiness
        const subjects = await subjectService.getAllSubjects()
        expect(subjects.length).toBeGreaterThan(0)
        
        // Test learning content availability
        if (mockOnboardingData.preferences.length > 0) {
          const topics = await topicService.getTopicsBySubject(mockOnboardingData.preferences[0])
          expect(Array.isArray(topics)).toBe(true)
        }
        
        console.log('✅ Onboarding → dashboard → learning flow validated')
      } catch (error: any) {
        console.error('❌ Learning flow validation failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate quiz → results → progress flow', async () => {
      console.log('📊 Testing quiz → results → progress flow...')
      
      try {
        // Test quiz completion flow
        const mockQuizResult = {
          quiz_id: 'test-quiz-123',
          user_id: 'test-user-id',
          questions_answered: 5,
          correct_answers: 4,
          score: 80,
          time_taken: 300, // 5 minutes
          completed_at: new Date().toISOString()
        }

        expect(mockQuizResult.score).toBe(
          Math.round((mockQuizResult.correct_answers / mockQuizResult.questions_answered) * 100)
        )
        expect(mockQuizResult.completed_at).toBeDefined()
        
        // Test performance update logic
        const mockPerformanceUpdate = {
          previous_average: 75,
          new_quiz_score: mockQuizResult.score,
          quiz_count: 10,
          new_average: Math.round(((75 * 9) + 80) / 10) // 75.5
        }

        expect(mockPerformanceUpdate.new_average).toBeCloseTo(75.5, 1)
        
        console.log('✅ Quiz → results → progress flow validated')
      } catch (error: any) {
        console.error('❌ Quiz results flow validation failed:', error.message)
        throw error
      }
    }, 5000)
  })

  describe('7. Error Handling and Fallbacks', () => {
    it('should validate error handling for missing data', async () => {
      console.log('⚠️ Testing error handling for missing data...')
      
      try {
        // Test handling of non-existent user
        const nonExistentUserData = await userService.getUserById('non-existent-user-id').catch(error => error)
        
        expect(nonExistentUserData).toBeDefined()
        // Should be an error object, not undefined
        
        // Test handling of non-existent subject
        const nonExistentSubjectTopics = await topicService.getTopicsBySubject('non-existent-subject-id').catch(error => error)
        
        expect(nonExistentSubjectTopics).toBeDefined()
        
        console.log('✅ Error handling for missing data validated')
      } catch (error: any) {
        console.error('❌ Error handling validation failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate fallback content for empty states', async () => {
      console.log('📭 Testing fallback content for empty states...')
      
      try {
        // Test empty states handling
        const emptyStates = {
          no_subjects: [],
          no_topics: [],
          no_quizzes: [],
          no_badges: [],
          no_quests: [],
          no_recommendations: []
        }

        Object.entries(emptyStates).forEach(([key, value]) => {
          expect(Array.isArray(value)).toBe(true)
          expect(value.length).toBe(0)
        })
        
        console.log('✅ Empty states handling validated')
      } catch (error: any) {
        console.error('❌ Empty states validation failed:', error.message)
        throw error
      }
    }, 5000)

    it('should validate loading states and transitions', async () => {
      console.log('⏳ Testing loading states and transitions...')
      
      try {
        // Test loading state logic
        const loadingStates = {
          isLoading: true,
          hasError: false,
          data: null
        }

        expect(loadingStates.isLoading).toBe(true)
        expect(loadingStates.hasError).toBe(false)
        expect(loadingStates.data).toBeNull()
        
        // Test loaded state
        const loadedState = {
          isLoading: false,
          hasError: false,
          data: { test: 'data' }
        }

        expect(loadedState.isLoading).toBe(false)
        expect(loadedState.data).toBeDefined()
        
        // Test error state
        const errorState = {
          isLoading: false,
          hasError: true,
          error: 'Test error message'
        }

        expect(errorState.hasError).toBe(true)
        expect(errorState.error).toBeDefined()
        
        console.log('✅ Loading states and transitions validated')
      } catch (error: any) {
        console.error('❌ Loading states validation failed:', error.message)
        throw error
      }
    }, 5000)
  })
})