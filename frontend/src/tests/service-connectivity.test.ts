/**
 * Service Connectivity Test
 * Tests all existing frontend services against backend endpoints
 * Validates authentication, user management, and gamification features
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import authService from '@/services/authService'
import userService from '@/services/userService'
import quizService from '@/services/quizService'
import subjectService from '@/services/subjectService'
import performanceService from '@/services/performanceService'
import gamificationService from '@/services/gamificationService'
import recommendationService from '@/services/recommendationService'
import attemptService from '@/services/attemptService'

// Test configuration
const TEST_USER = {
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!'
}

let testUserId: string
let testSubjectId: string
let testQuizId: string

describe('Service Connectivity Tests', () => {
  beforeAll(async () => {
    // Register a test user for connectivity tests
    try {
      const registerResponse = await authService.register(TEST_USER)
      console.log('Test user registered:', registerResponse.message)
      
      // Login to get authenticated session
      const loginResponse = await authService.login({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
      console.log('Test user logged in:', loginResponse.message)
      
      // Get current user to extract ID
      const currentUser = await userService.getCurrentUser()
      testUserId = currentUser.id
      console.log('Test user ID:', testUserId)
    } catch (error) {
      console.error('Setup failed:', error)
      throw error
    }
  })

  afterAll(async () => {
    // Cleanup: logout and optionally delete test user
    try {
      await authService.logout()
      console.log('Test user logged out')
    } catch (error) {
      console.warn('Cleanup warning:', error)
    }
  })

  describe('Authentication Service', () => {
    it('should check auth status', async () => {
      const status = await authService.getAuthStatus()
      expect(status.isAuthenticated).toBe(true)
      expect(status.user).toBeDefined()
    })

    it('should get current user', async () => {
      const user = await authService.getCurrentUser()
      expect(user).toBeDefined()
      expect(user.email).toBe(TEST_USER.email)
    })

    it('should refresh session', async () => {
      const result = await authService.refreshSession()
      expect(result).toBeDefined()
    })
  })

  describe('User Service', () => {
    it('should get current user', async () => {
      const user = await userService.getCurrentUser()
      expect(user).toBeDefined()
      expect(user.id).toBe(testUserId)
    })

    it('should get user by ID', async () => {
      const user = await userService.getUserById(testUserId)
      expect(user).toBeDefined()
      expect(user.id).toBe(testUserId)
    })

    it('should get user stats', async () => {
      const stats = await userService.getUserStats(testUserId)
      expect(stats).toBeDefined()
      expect(typeof stats.totalQuizzesAttempted).toBe('number')
    })

    it('should update user profile basics', async () => {
      const updatedUser = await userService.updateProfileBasics(testUserId, {
        theme: 'dark',
        goals: ['improve_math', 'learn_science']
      })
      expect(updatedUser).toBeDefined()
    })
  })

  describe('Subject Service', () => {
    it('should get all subjects', async () => {
      const subjects = await subjectService.getAllSubjects()
      expect(Array.isArray(subjects)).toBe(true)
      
      if (subjects.length > 0) {
        testSubjectId = subjects[0].id
        expect(subjects[0]).toHaveProperty('id')
        expect(subjects[0]).toHaveProperty('name')
      }
    })

    it('should get subjects with stats', async () => {
      const subjectsWithStats = await subjectService.getSubjectsWithStats()
      expect(Array.isArray(subjectsWithStats)).toBe(true)
      
      if (subjectsWithStats.length > 0) {
        expect(subjectsWithStats[0]).toHaveProperty('topicCount')
        expect(subjectsWithStats[0]).toHaveProperty('quizCount')
      }
    })

    it('should get topics by subject', async () => {
      if (testSubjectId) {
        const topics = await subjectService.getTopicsBySubject(testSubjectId)
        expect(Array.isArray(topics)).toBe(true)
      }
    })

    it('should search subjects', async () => {
      const results = await subjectService.searchSubjects('math')
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Quiz Service', () => {
    it('should get all quizzes', async () => {
      const quizzes = await quizService.getAllQuizzes()
      expect(Array.isArray(quizzes)).toBe(true)
      
      if (quizzes.length > 0) {
        testQuizId = quizzes[0].id
      }
    })

    it('should get quizzes by subject', async () => {
      if (testSubjectId) {
        const quizzes = await quizService.getQuizzesBySubject(testSubjectId)
        expect(Array.isArray(quizzes)).toBe(true)
      }
    })

    it('should generate assessment', async () => {
      if (testSubjectId) {
        const questions = await quizService.generateAssessment(testUserId, [testSubjectId])
        expect(Array.isArray(questions)).toBe(true)
      }
    })

    it('should search quizzes', async () => {
      const results = await quizService.searchQuizzes('test')
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Performance Service', () => {
    it('should get user performance', async () => {
      const performance = await performanceService.getUserPerformance(testUserId)
      expect(Array.isArray(performance)).toBe(true)
    })

    it('should get performance analytics', async () => {
      const analytics = await performanceService.getPerformanceAnalytics(testUserId)
      expect(analytics).toBeDefined()
      expect(analytics).toHaveProperty('overallStats')
      expect(analytics).toHaveProperty('subjectBreakdown')
    })

    it('should get weak areas', async () => {
      const weakAreas = await performanceService.getWeakAreas(testUserId)
      expect(weakAreas).toBeDefined()
      expect(weakAreas).toHaveProperty('subjects')
      expect(weakAreas).toHaveProperty('topics')
    })
  })

  describe('Gamification Service', () => {
    it('should get user stats', async () => {
      const stats = await gamificationService.getUserStats(testUserId)
      expect(stats).toBeDefined()
      expect(typeof stats.totalXP).toBe('number')
      expect(typeof stats.level).toBe('number')
    })

    it('should get user badges', async () => {
      const badges = await gamificationService.getUserBadges(testUserId)
      expect(Array.isArray(badges)).toBe(true)
    })

    it('should get user quests', async () => {
      const quests = await gamificationService.getUserQuests(testUserId)
      expect(Array.isArray(quests)).toBe(true)
    })

    it('should get global leaderboard', async () => {
      const leaderboard = await gamificationService.getGlobalLeaderboard(5)
      expect(Array.isArray(leaderboard)).toBe(true)
    })

    it('should update user streak', async () => {
      const streak = await gamificationService.updateStreak(testUserId)
      expect(streak).toBeDefined()
      expect(typeof streak.current).toBe('number')
    })
  })

  describe('Recommendation Service', () => {
    it('should get user recommendations', async () => {
      const recommendations = await recommendationService.getUserRecommendations(testUserId)
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should generate recommendations', async () => {
      const recommendations = await recommendationService.generateRecommendations(testUserId)
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should get quiz recommendations', async () => {
      const quizRecs = await recommendationService.getQuizRecommendations(testUserId, 3)
      expect(Array.isArray(quizRecs)).toBe(true)
    })
  })

  describe('Attempt Service', () => {
    it('should get user attempts', async () => {
      const attempts = await attemptService.getUserAttempts(testUserId)
      expect(Array.isArray(attempts)).toBe(true)
    })

    it('should get user attempt stats', async () => {
      const stats = await attemptService.getUserAttemptStats(testUserId)
      expect(stats).toBeDefined()
    })

    it('should get recent attempts', async () => {
      const recent = await attemptService.getRecentAttempts(testUserId, 5)
      expect(Array.isArray(recent)).toBe(true)
    })

    it('should get global leaderboard', async () => {
      const leaderboard = await attemptService.getGlobalLeaderboard(5)
      expect(Array.isArray(leaderboard)).toBe(true)
    })
  })

  describe('Cross-Service Integration', () => {
    it('should handle onboarding flow', async () => {
      if (testSubjectId) {
        // Test assessment generation
        const assessment = await userService.generateAssessment(testUserId, [testSubjectId])
        expect(assessment).toBeDefined()

        // Test onboarding progress tracking
        const progress = await userService.getOnboardingProgress(testUserId)
        expect(progress).toBeDefined()
      }
    })

    it('should handle user data consistency', async () => {
      // Get user from different services and verify consistency
      const userFromAuth = await authService.getCurrentUser()
      const userFromService = await userService.getCurrentUser()
      
      expect(userFromAuth.id).toBe(userFromService.id)
      expect(userFromAuth.email).toBe(userFromService.email)
    })
  })
})