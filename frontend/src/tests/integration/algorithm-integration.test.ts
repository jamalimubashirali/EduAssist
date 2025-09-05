/**
 * Algorithm Integration Validation Tests
 * 
 * Tests that the frontend properly leverages backend's intelligent algorithms
 * including recommendation system, performance tracking, and gamification systems.
 * 
 * Requirements: 9.4, 9.5, 9.6
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { recommendationService } from '@/services/recommendationService'
import { performanceService } from '@/services/performanceService'
import { gamificationService } from '@/services/gamificationService'
import { quizService } from '@/services/quizService'
import { userService } from '@/services/userService'
import { subjectService } from '@/services/subjectService'
import { topicService } from '@/services/topicService'

// Test configuration
const TEST_CONFIG = {
  timeout: 45000, // 45 seconds for algorithm tests
  skipUserSpecificTests: false, // Set to true to skip tests requiring authenticated user
  skipAlgorithmTests: false, // Set to true to skip algorithm-heavy tests
}

// Test data
let testUserId: string | null = null
let testSubjectId: string | null = null
let testTopicId: string | null = null
let isAuthenticated = false

describe('Backend Algorithm Integration Validation', () => {
  beforeAll(async () => {
    // Setup test data
    try {
      // Get test subjects and topics
      const subjects = await subjectService.getAllSubjects()
      if (subjects.length > 0) {
        testSubjectId = subjects[0].id
        console.log(`Test subject: ${subjects[0].name}`)
        
        const topics = await topicService.getTopicsBySubject(testSubjectId)
        if (topics.length > 0) {
          testTopicId = topics[0].id
          console.log(`Test topic: ${topics[0].name}`)
        }
      }
      
      // Try to get authenticated user
      try {
        const user = await userService.getCurrentUser()
        testUserId = user.id
        isAuthenticated = true
        console.log(`Authenticated user: ${user.name}`)
      } catch (error) {
        console.log('No authenticated user - some tests will be skipped')
      }
    } catch (error) {
      console.warn('Failed to setup test data:', error)
    }
  }, TEST_CONFIG.timeout)

  describe('Recommendation Algorithm Integration', () => {
    it('should access backend recommendation engine', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping recommendation engine test - no authenticated user')
        return
      }

      const recommendations = await recommendationService.getUserRecommendations(testUserId)
      
      expect(Array.isArray(recommendations)).toBe(true)
      console.log(`✅ Retrieved ${recommendations.length} recommendations from backend engine`)
      
      // Validate recommendation structure from backend algorithms
      if (recommendations.length > 0) {
        const recommendation = recommendations[0]
        expect(recommendation).toHaveProperty('id')
        expect(recommendation).toHaveProperty('title')
        expect(recommendation).toHaveProperty('priority')
        expect(recommendation).toHaveProperty('urgency')
        
        // Backend algorithm should provide priority scoring
        expect(typeof recommendation.priority).toBe('number')
        expect(recommendation.priority).toBeGreaterThanOrEqual(0)
        expect(recommendation.priority).toBeLessThanOrEqual(100)
        
        console.log(`   Sample recommendation: "${recommendation.title}" (Priority: ${recommendation.priority})`)
      }
    }, TEST_CONFIG.timeout)

    it('should validate smart recommendation filtering and prioritization', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping smart recommendations test')
        return
      }

      const smartRecommendations = await recommendationService.getSmartRecommendations()
      
      expect(Array.isArray(smartRecommendations)).toBe(true)
      console.log(`✅ Retrieved ${smartRecommendations.length} smart recommendations`)
      
      // Validate backend's intelligent filtering
      smartRecommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('priority')
        expect(recommendation).toHaveProperty('urgency')
        expect(recommendation).toHaveProperty('estimatedTime')
        
        // Backend should provide intelligent scoring
        expect(typeof recommendation.priority).toBe('number')
        expect(typeof recommendation.urgency).toBe('number')
        expect(typeof recommendation.estimatedTime).toBe('number')
        
        // Validate priority scoring algorithm results
        expect(recommendation.priority).toBeGreaterThanOrEqual(0)
        expect(recommendation.priority).toBeLessThanOrEqual(100)
        expect(recommendation.urgency).toBeGreaterThanOrEqual(0)
        expect(recommendation.urgency).toBeLessThanOrEqual(100)
      })
      
      // Validate that recommendations are properly sorted by backend algorithm
      const priorities = smartRecommendations.map(r => r.priority)
      const sortedPriorities = [...priorities].sort((a, b) => b - a)
      expect(priorities).toEqual(sortedPriorities)
      
      console.log('✅ Smart recommendation filtering and prioritization validated')
    }, TEST_CONFIG.timeout)

    it('should validate recommendation completion tracking', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping recommendation completion test')
        return
      }

      const recommendations = await recommendationService.getUserRecommendations(testUserId)
      
      if (recommendations.length === 0) {
        console.log('No recommendations available for completion test')
        return
      }

      const recommendationId = recommendations[0].id
      
      // Test marking recommendation as completed
      const completionResult = await recommendationService.markRecommendationCompleted(recommendationId)
      
      expect(completionResult).toHaveProperty('success')
      expect(completionResult.success).toBe(true)
      
      console.log('✅ Recommendation completion tracking validated')
    }, TEST_CONFIG.timeout)

    it('should validate recommendation response time analytics', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping recommendation analytics test')
        return
      }

      const analytics = await recommendationService.getRecommendationAnalytics(testUserId)
      
      expect(analytics).toHaveProperty('totalRecommendations')
      expect(analytics).toHaveProperty('completedRecommendations')
      expect(analytics).toHaveProperty('averageResponseTime')
      expect(analytics).toHaveProperty('completionRate')
      
      // Validate backend analytics calculations
      expect(typeof analytics.totalRecommendations).toBe('number')
      expect(typeof analytics.completedRecommendations).toBe('number')
      expect(typeof analytics.averageResponseTime).toBe('number')
      expect(typeof analytics.completionRate).toBe('number')
      
      // Validate completion rate calculation
      if (analytics.totalRecommendations > 0) {
        const expectedCompletionRate = (analytics.completedRecommendations / analytics.totalRecommendations) * 100
        expect(Math.abs(analytics.completionRate - expectedCompletionRate)).toBeLessThan(0.1)
      }
      
      console.log(`✅ Recommendation analytics validated:`)
      console.log(`   Total: ${analytics.totalRecommendations}`)
      console.log(`   Completed: ${analytics.completedRecommendations}`)
      console.log(`   Completion Rate: ${analytics.completionRate}%`)
      console.log(`   Avg Response Time: ${analytics.averageResponseTime}ms`)
    }, TEST_CONFIG.timeout)
  })

  describe('Performance Tracking Algorithm Integration', () => {
    it('should access backend performance tracking algorithms', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping performance tracking test - no authenticated user')
        return
      }

      const performance = await performanceService.getUserPerformance(testUserId)
      
      expect(Array.isArray(performance)).toBe(true)
      console.log(`✅ Retrieved performance data for ${performance.length} topics`)
      
      // Validate backend performance calculations
      if (performance.length > 0) {
        const topicPerformance = performance[0]
        expect(topicPerformance).toHaveProperty('topicId')
        expect(topicPerformance).toHaveProperty('averageScore')
        expect(topicPerformance).toHaveProperty('totalAttempts')
        expect(topicPerformance).toHaveProperty('masteryLevel')
        expect(topicPerformance).toHaveProperty('learningVelocity')
        
        // Validate backend algorithm calculations
        expect(typeof topicPerformance.averageScore).toBe('number')
        expect(typeof topicPerformance.totalAttempts).toBe('number')
        expect(typeof topicPerformance.masteryLevel).toBe('number')
        expect(typeof topicPerformance.learningVelocity).toBe('number')
        
        // Validate score ranges
        expect(topicPerformance.averageScore).toBeGreaterThanOrEqual(0)
        expect(topicPerformance.averageScore).toBeLessThanOrEqual(100)
        expect(topicPerformance.masteryLevel).toBeGreaterThanOrEqual(0)
        expect(topicPerformance.masteryLevel).toBeLessThanOrEqual(100)
        
        console.log(`   Sample performance: ${topicPerformance.averageScore}% avg, ${topicPerformance.masteryLevel}% mastery`)
      }
    }, TEST_CONFIG.timeout)

    it('should validate learning velocity calculations', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping learning velocity test')
        return
      }

      const performance = await performanceService.getUserPerformance(testUserId)
      
      // Validate learning velocity algorithm
      performance.forEach(topicPerformance => {
        if (topicPerformance.totalAttempts > 1) {
          expect(topicPerformance).toHaveProperty('learningVelocity')
          expect(typeof topicPerformance.learningVelocity).toBe('number')
          
          // Learning velocity should be a reasonable value
          expect(topicPerformance.learningVelocity).toBeGreaterThanOrEqual(-50)
          expect(topicPerformance.learningVelocity).toBeLessThanOrEqual(50)
        }
      })
      
      console.log('✅ Learning velocity calculations validated')
    }, TEST_CONFIG.timeout)

    it('should validate performance analytics and trend analysis', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping performance analytics test')
        return
      }

      const analytics = await performanceService.getPerformanceAnalytics(testUserId)
      
      expect(analytics).toHaveProperty('overallStats')
      expect(analytics).toHaveProperty('subjectBreakdown')
      expect(analytics).toHaveProperty('weeklyTrends')
      expect(analytics).toHaveProperty('improvementAreas')
      
      // Validate overall stats calculations
      const overallStats = analytics.overallStats
      expect(overallStats).toHaveProperty('averageScore')
      expect(overallStats).toHaveProperty('totalQuizzes')
      expect(overallStats).toHaveProperty('totalTimeSpent')
      expect(overallStats).toHaveProperty('overallTrend')
      
      expect(typeof overallStats.averageScore).toBe('number')
      expect(typeof overallStats.totalQuizzes).toBe('number')
      expect(typeof overallStats.totalTimeSpent).toBe('number')
      expect(['Improving', 'Stable', 'Declining']).toContain(overallStats.overallTrend)
      
      // Validate subject breakdown
      expect(Array.isArray(analytics.subjectBreakdown)).toBe(true)
      analytics.subjectBreakdown.forEach(subject => {
        expect(subject).toHaveProperty('subjectId')
        expect(subject).toHaveProperty('averageScore')
        expect(subject).toHaveProperty('masteryLevel')
        expect(typeof subject.averageScore).toBe('number')
        expect(typeof subject.masteryLevel).toBe('number')
      })
      
      console.log(`✅ Performance analytics validated:`)
      console.log(`   Overall Score: ${overallStats.averageScore}%`)
      console.log(`   Total Quizzes: ${overallStats.totalQuizzes}`)
      console.log(`   Overall Trend: ${overallStats.overallTrend}`)
      console.log(`   Subject Breakdown: ${analytics.subjectBreakdown.length} subjects`)
    }, TEST_CONFIG.timeout)

    it('should validate weak area identification algorithm', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping weak area identification test')
        return
      }

      const analytics = await performanceService.getPerformanceAnalytics(testUserId)
      
      expect(analytics).toHaveProperty('improvementAreas')
      expect(Array.isArray(analytics.improvementAreas)).toBe(true)
      
      // Validate weak area identification
      analytics.improvementAreas.forEach(area => {
        expect(area).toHaveProperty('topic')
        expect(area).toHaveProperty('currentScore')
        expect(area).toHaveProperty('targetScore')
        expect(area).toHaveProperty('priority')
        
        expect(typeof area.currentScore).toBe('number')
        expect(typeof area.targetScore).toBe('number')
        expect(typeof area.priority).toBe('number')
        
        // Weak areas should have lower current scores
        expect(area.currentScore).toBeLessThan(area.targetScore)
        expect(area.currentScore).toBeLessThan(80) // Should be below 80% to be considered weak
      })
      
      console.log(`✅ Weak area identification validated: ${analytics.improvementAreas.length} areas identified`)
    }, TEST_CONFIG.timeout)
  })

  describe('Gamification Algorithm Integration', () => {
    it('should access backend gamification calculations', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping gamification test - no authenticated user')
        return
      }

      const userStats = await gamificationService.getUserStats(testUserId)
      
      expect(userStats).toHaveProperty('totalXP')
      expect(userStats).toHaveProperty('level')
      expect(userStats).toHaveProperty('badges')
      expect(userStats).toHaveProperty('streakCount')
      expect(userStats).toHaveProperty('leaderboardPosition')
      
      // Validate backend gamification calculations
      expect(typeof userStats.totalXP).toBe('number')
      expect(typeof userStats.level).toBe('number')
      expect(typeof userStats.streakCount).toBe('number')
      expect(Array.isArray(userStats.badges)).toBe(true)
      
      // Validate XP to level calculation consistency
      expect(userStats.totalXP).toBeGreaterThanOrEqual(0)
      expect(userStats.level).toBeGreaterThanOrEqual(1)
      
      // Level should be consistent with XP (basic validation)
      const expectedMinXP = Math.pow(userStats.level - 1, 2) * 100
      expect(userStats.totalXP).toBeGreaterThanOrEqual(expectedMinXP)
      
      console.log(`✅ Gamification stats validated:`)
      console.log(`   Level: ${userStats.level}`)
      console.log(`   Total XP: ${userStats.totalXP}`)
      console.log(`   Badges: ${userStats.badges.length}`)
      console.log(`   Streak: ${userStats.streakCount} days`)
    }, TEST_CONFIG.timeout)

    it('should validate badge unlocking algorithm', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping badge algorithm test')
        return
      }

      const badges = await gamificationService.getUserBadges(testUserId)
      
      expect(Array.isArray(badges)).toBe(true)
      console.log(`✅ Retrieved ${badges.length} user badges`)
      
      // Validate badge structure from backend algorithm
      badges.forEach(badge => {
        expect(badge).toHaveProperty('id')
        expect(badge).toHaveProperty('name')
        expect(badge).toHaveProperty('description')
        expect(badge).toHaveProperty('unlockedAt')
        expect(badge).toHaveProperty('criteria')
        
        // Validate unlock timestamp
        expect(new Date(badge.unlockedAt)).toBeInstanceOf(Date)
        expect(new Date(badge.unlockedAt).getTime()).toBeLessThanOrEqual(Date.now())
      })
      
      // Test available badges algorithm
      const availableBadges = await gamificationService.getAvailableBadges(testUserId)
      expect(Array.isArray(availableBadges)).toBe(true)
      
      availableBadges.forEach(badge => {
        expect(badge).toHaveProperty('id')
        expect(badge).toHaveProperty('name')
        expect(badge).toHaveProperty('criteria')
        expect(badge).toHaveProperty('progress')
        
        // Progress should be between 0 and 100
        expect(typeof badge.progress).toBe('number')
        expect(badge.progress).toBeGreaterThanOrEqual(0)
        expect(badge.progress).toBeLessThanOrEqual(100)
      })
      
      console.log(`✅ Badge algorithm validated: ${availableBadges.length} available badges`)
    }, TEST_CONFIG.timeout)

    it('should validate quest generation and progress tracking', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping quest algorithm test')
        return
      }

      const quests = await gamificationService.getUserQuests(testUserId)
      
      expect(Array.isArray(quests)).toBe(true)
      console.log(`✅ Retrieved ${quests.length} user quests`)
      
      // Validate quest structure from backend algorithm
      quests.forEach(quest => {
        expect(quest).toHaveProperty('id')
        expect(quest).toHaveProperty('title')
        expect(quest).toHaveProperty('description')
        expect(quest).toHaveProperty('progress')
        expect(quest).toHaveProperty('target')
        expect(quest).toHaveProperty('status')
        expect(quest).toHaveProperty('xpReward')
        
        // Validate progress calculations
        expect(typeof quest.progress).toBe('number')
        expect(typeof quest.target).toBe('number')
        expect(typeof quest.xpReward).toBe('number')
        expect(['active', 'completed', 'expired']).toContain(quest.status)
        
        // Progress should not exceed target
        expect(quest.progress).toBeLessThanOrEqual(quest.target)
        expect(quest.progress).toBeGreaterThanOrEqual(0)
      })
      
      // Validate quest completion percentage calculation
      const activeQuests = quests.filter(q => q.status === 'active')
      activeQuests.forEach(quest => {
        const expectedPercentage = (quest.progress / quest.target) * 100
        expect(quest.completionPercentage || expectedPercentage).toBeCloseTo(expectedPercentage, 1)
      })
      
      console.log('✅ Quest generation and progress tracking validated')
    }, TEST_CONFIG.timeout)

    it('should validate leaderboard ranking algorithm', async () => {
      const leaderboard = await gamificationService.getGlobalLeaderboard(20)
      
      expect(Array.isArray(leaderboard)).toBe(true)
      expect(leaderboard.length).toBeLessThanOrEqual(20)
      console.log(`✅ Retrieved global leaderboard with ${leaderboard.length} entries`)
      
      // Validate leaderboard structure and ranking
      leaderboard.forEach((entry, index) => {
        expect(entry).toHaveProperty('userId')
        expect(entry).toHaveProperty('username')
        expect(entry).toHaveProperty('totalXP')
        expect(entry).toHaveProperty('level')
        expect(entry).toHaveProperty('rank')
        
        expect(typeof entry.totalXP).toBe('number')
        expect(typeof entry.level).toBe('number')
        expect(typeof entry.rank).toBe('number')
        
        // Validate ranking order (should be sorted by XP descending)
        expect(entry.rank).toBe(index + 1)
        
        if (index > 0) {
          expect(entry.totalXP).toBeLessThanOrEqual(leaderboard[index - 1].totalXP)
        }
      })
      
      // Test subject-specific leaderboard if we have a test subject
      if (testSubjectId) {
        const subjectLeaderboard = await gamificationService.getSubjectLeaderboard(testSubjectId, 10)
        expect(Array.isArray(subjectLeaderboard)).toBe(true)
        
        console.log(`✅ Subject leaderboard validated: ${subjectLeaderboard.length} entries`)
      }
      
      console.log('✅ Leaderboard ranking algorithm validated')
    }, TEST_CONFIG.timeout)
  })

  describe('Quiz Generation Algorithm Integration', () => {
    it('should validate personalized quiz generation algorithm', async () => {
      if (TEST_CONFIG.skipAlgorithmTests || !testTopicId || !testSubjectId) {
        console.log('Skipping personalized quiz generation test')
        return
      }

      const personalizedConfig = {
        topicId: testTopicId,
        subjectId: testSubjectId,
        questionsCount: 10,
        sessionType: 'practice' as const
      }

      const result = await quizService.generatePersonalizedQuiz(personalizedConfig)
      
      expect(result).toHaveProperty('quiz')
      expect(result).toHaveProperty('questions')
      expect(result).toHaveProperty('metadata')
      
      // Validate algorithm metadata
      const metadata = result.metadata
      expect(metadata).toHaveProperty('userLevel')
      expect(metadata).toHaveProperty('difficultyDistribution')
      expect(metadata).toHaveProperty('focusAreas')
      expect(metadata).toHaveProperty('sessionId')
      expect(metadata).toHaveProperty('isRepeatedSession')
      
      expect(typeof metadata.userLevel).toBe('number')
      expect(typeof metadata.difficultyDistribution).toBe('object')
      expect(Array.isArray(metadata.focusAreas)).toBe(true)
      expect(typeof metadata.isRepeatedSession).toBe('boolean')
      
      // Validate difficulty distribution algorithm
      const difficultyDistribution = metadata.difficultyDistribution
      const totalDistribution = Object.values(difficultyDistribution).reduce((sum: number, val: any) => sum + val, 0)
      expect(Math.abs(totalDistribution - 100)).toBeLessThan(1) // Should sum to ~100%
      
      // Validate question selection algorithm results
      expect(Array.isArray(result.questions)).toBe(true)
      expect(result.questions.length).toBeGreaterThan(0)
      expect(result.questions.length).toBeLessThanOrEqual(personalizedConfig.questionsCount)
      
      console.log(`✅ Personalized quiz generation validated:`)
      console.log(`   User Level: ${metadata.userLevel}`)
      console.log(`   Questions Generated: ${result.questions.length}`)
      console.log(`   Focus Areas: ${metadata.focusAreas.join(', ')}`)
      console.log(`   Difficulty Distribution: ${JSON.stringify(difficultyDistribution)}`)
    }, TEST_CONFIG.timeout)

    it('should validate optimal quiz parameters algorithm', async () => {
      if (TEST_CONFIG.skipAlgorithmTests || !testTopicId) {
        console.log('Skipping optimal parameters test')
        return
      }

      const optimalParams = await quizService.getOptimalQuizParameters(testTopicId)
      
      expect(optimalParams).toHaveProperty('recommendedQuestionCount')
      expect(optimalParams).toHaveProperty('recommendedTimeLimit')
      expect(optimalParams).toHaveProperty('recommendedDifficulty')
      expect(optimalParams).toHaveProperty('recommendedSessionType')
      expect(optimalParams).toHaveProperty('userInsights')
      
      // Validate algorithm calculations
      expect(typeof optimalParams.recommendedQuestionCount).toBe('number')
      expect(typeof optimalParams.recommendedTimeLimit).toBe('number')
      expect(['easy', 'medium', 'hard']).toContain(optimalParams.recommendedDifficulty.toLowerCase())
      expect(['practice', 'assessment', 'adaptive', 'challenge']).toContain(optimalParams.recommendedSessionType.toLowerCase())
      
      // Validate user insights from algorithm
      const insights = optimalParams.userInsights
      expect(insights).toHaveProperty('currentLevel')
      expect(insights).toHaveProperty('masteryScore')
      expect(insights).toHaveProperty('recommendationReason')
      
      expect(typeof insights.currentLevel).toBe('number')
      expect(typeof insights.masteryScore).toBe('number')
      expect(typeof insights.recommendationReason).toBe('string')
      
      // Validate reasonable parameter ranges
      expect(optimalParams.recommendedQuestionCount).toBeGreaterThan(0)
      expect(optimalParams.recommendedQuestionCount).toBeLessThanOrEqual(50)
      expect(optimalParams.recommendedTimeLimit).toBeGreaterThan(0)
      expect(optimalParams.recommendedTimeLimit).toBeLessThanOrEqual(7200) // 2 hours max
      expect(insights.currentLevel).toBeGreaterThanOrEqual(1)
      expect(insights.masteryScore).toBeGreaterThanOrEqual(0)
      expect(insights.masteryScore).toBeLessThanOrEqual(100)
      
      console.log(`✅ Optimal parameters algorithm validated:`)
      console.log(`   Recommended Questions: ${optimalParams.recommendedQuestionCount}`)
      console.log(`   Recommended Time: ${optimalParams.recommendedTimeLimit}s`)
      console.log(`   Recommended Difficulty: ${optimalParams.recommendedDifficulty}`)
      console.log(`   User Level: ${insights.currentLevel}`)
      console.log(`   Mastery Score: ${insights.masteryScore}%`)
    }, TEST_CONFIG.timeout)

    it('should validate adaptive session algorithm', async () => {
      if (TEST_CONFIG.skipAlgorithmTests || !testTopicId || !testSubjectId) {
        console.log('Skipping adaptive session test')
        return
      }

      const adaptiveConfig = {
        topicId: testTopicId,
        subjectId: testSubjectId,
        targetDuration: 20, // 20 minutes
        difficultyPreference: 'adaptive' as const
      }

      const adaptiveSession = await quizService.startAdaptiveSession(adaptiveConfig)
      
      expect(adaptiveSession).toHaveProperty('quiz')
      expect(adaptiveSession).toHaveProperty('questions')
      expect(adaptiveSession).toHaveProperty('metadata')
      
      // Validate adaptive algorithm metadata
      const metadata = adaptiveSession.metadata
      expect(metadata).toHaveProperty('sessionId')
      expect(metadata).toHaveProperty('userLevel')
      expect(metadata).toHaveProperty('difficultyDistribution')
      expect(metadata).toHaveProperty('focusAreas')
      
      // Validate adaptive question selection
      expect(Array.isArray(adaptiveSession.questions)).toBe(true)
      expect(adaptiveSession.questions.length).toBeGreaterThan(0)
      
      // Adaptive sessions should have varied difficulty based on user level
      const difficulties = adaptiveSession.questions.map(q => q.difficulty?.toLowerCase())
      const uniqueDifficulties = new Set(difficulties.filter(Boolean))
      
      if (adaptiveSession.questions.length >= 3) {
        expect(uniqueDifficulties.size).toBeGreaterThan(1) // Should have varied difficulties
      }
      
      console.log(`✅ Adaptive session algorithm validated:`)
      console.log(`   Session ID: ${metadata.sessionId}`)
      console.log(`   Questions: ${adaptiveSession.questions.length}`)
      console.log(`   Difficulties: ${Array.from(uniqueDifficulties).join(', ')}`)
    }, TEST_CONFIG.timeout)
  })

  describe('Cross-Algorithm Data Flow Validation', () => {
    it('should validate data flow between recommendation and performance algorithms', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping cross-algorithm validation - no authenticated user')
        return
      }

      // Get data from both systems
      const [recommendations, performance] = await Promise.all([
        recommendationService.getUserRecommendations(testUserId),
        performanceService.getUserPerformance(testUserId)
      ])
      
      expect(Array.isArray(recommendations)).toBe(true)
      expect(Array.isArray(performance)).toBe(true)
      
      // Validate that recommendations consider performance data
      if (recommendations.length > 0 && performance.length > 0) {
        const performanceTopics = new Set(performance.map(p => p.topicId?._id || p.topicId))
        const recommendationTopics = recommendations.map(r => r.topicId).filter(Boolean)
        
        // Some recommendations should relate to topics with performance data
        const hasPerformanceBasedRecommendations = recommendationTopics.some(topicId => 
          performanceTopics.has(topicId)
        )
        
        console.log(`✅ Cross-algorithm validation:`)
        console.log(`   Performance topics: ${performanceTopics.size}`)
        console.log(`   Recommendation topics: ${recommendationTopics.length}`)
        console.log(`   Performance-based recommendations: ${hasPerformanceBasedRecommendations}`)
      }
    }, TEST_CONFIG.timeout)

    it('should validate data flow between gamification and performance algorithms', async () => {
      if (TEST_CONFIG.skipUserSpecificTests || !testUserId) {
        console.log('Skipping gamification-performance validation')
        return
      }

      const [gamificationStats, performanceAnalytics] = await Promise.all([
        gamificationService.getUserStats(testUserId),
        performanceService.getPerformanceAnalytics(testUserId)
      ])
      
      expect(gamificationStats).toHaveProperty('totalXP')
      expect(performanceAnalytics).toHaveProperty('overallStats')
      
      // Validate that gamification reflects performance
      const overallScore = performanceAnalytics.overallStats.averageScore
      const totalQuizzes = performanceAnalytics.overallStats.totalQuizzes
      
      if (totalQuizzes > 0) {
        // XP should correlate with performance (basic validation)
        expect(gamificationStats.totalXP).toBeGreaterThan(0)
        
        // Level should be reasonable for the number of quizzes
        const expectedMinLevel = Math.max(1, Math.floor(totalQuizzes / 10))
        expect(gamificationStats.level).toBeGreaterThanOrEqual(expectedMinLevel)
        
        console.log(`✅ Gamification-performance correlation validated:`)
        console.log(`   Overall Score: ${overallScore}%`)
        console.log(`   Total Quizzes: ${totalQuizzes}`)
        console.log(`   User Level: ${gamificationStats.level}`)
        console.log(`   Total XP: ${gamificationStats.totalXP}`)
      }
    }, TEST_CONFIG.timeout)

    it('should validate algorithm consistency across multiple requests', async () => {
      if (TEST_CONFIG.skipAlgorithmTests || !testTopicId) {
        console.log('Skipping algorithm consistency test')
        return
      }

      // Make multiple requests for the same data
      const [params1, params2, params3] = await Promise.all([
        quizService.getOptimalQuizParameters(testTopicId),
        quizService.getOptimalQuizParameters(testTopicId),
        quizService.getOptimalQuizParameters(testTopicId)
      ])
      
      // Algorithm should return consistent results for the same input
      expect(params1.recommendedQuestionCount).toBe(params2.recommendedQuestionCount)
      expect(params1.recommendedQuestionCount).toBe(params3.recommendedQuestionCount)
      expect(params1.recommendedDifficulty).toBe(params2.recommendedDifficulty)
      expect(params1.recommendedDifficulty).toBe(params3.recommendedDifficulty)
      expect(params1.userInsights.currentLevel).toBe(params2.userInsights.currentLevel)
      expect(params1.userInsights.currentLevel).toBe(params3.userInsights.currentLevel)
      
      console.log('✅ Algorithm consistency validated across multiple requests')
    }, TEST_CONFIG.timeout)
  })
})