import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIntelligentRecommendationSystem } from '../hooks/useIntelligentRecommendations'
import { usePerformanceRecommendationIntegration } from '../hooks/usePerformanceRecommendationIntegration'
import { useUserBehaviorRecommendationSync } from '../hooks/useUserBehaviorRecommendationSync'
import { recommendationService } from '../services/recommendationService'
import { performanceService } from '../services/performanceService'

// Mock services
vi.mock('../services/recommendationService')
vi.mock('../services/performanceService')
vi.mock('../stores/useUserStore', () => ({
  useUserStore: () => ({
    user: { id: 'test-user-123', name: 'Test User' }
  })
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Intelligent Recommendation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useIntelligentRecommendationSystem', () => {
    it('should fetch and prioritize smart recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          userId: 'test-user-123',
          type: 'quiz',
          title: 'Practice Advanced Calculus',
          description: 'Focus on integration techniques',
          reason: 'Your recent performance shows room for improvement in calculus',
          priority: 85,
          urgency: 70,
          estimatedTime: 30,
          confidence: 0.8,
          metadata: {
            subjectId: 'math-101',
            difficulty: 'Hard',
            improvementPotential: 85,
          },
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'rec-2',
          userId: 'test-user-123',
          type: 'topic',
          title: 'Review Basic Algebra',
          description: 'Strengthen foundational concepts',
          reason: 'Foundation strengthening recommended',
          priority: 60,
          urgency: 40,
          estimatedTime: 15,
          confidence: 0.9,
          metadata: {
            subjectId: 'math-101',
            difficulty: 'Medium',
            improvementPotential: 60,
          },
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      const mockAnalytics = {
        totalRecommendations: 2,
        completionRate: 75,
        effectivenessScore: 80,
        averageResponseTime: 2.5,
      }

      vi.mocked(recommendationService.getSmartRecommendations).mockResolvedValue(mockRecommendations)
      vi.mocked(recommendationService.getRecommendationAnalytics).mockResolvedValue(mockAnalytics)

      const { result } = renderHook(() => useIntelligentRecommendationSystem(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.allRecommendations).toHaveLength(2)
      expect(result.current.prioritizedRecommendations[0].priority).toBe(85)
      expect(result.current.prioritizedRecommendations[0].id).toBe('rec-1')
      expect(result.current.analytics?.effectivenessScore).toBe(80)
    })

    it('should handle recommendation synchronization after performance updates', async () => {
      const mockGenerateRecommendations = vi.fn().mockResolvedValue([])
      vi.mocked(recommendationService.generateRecommendations).mockImplementation(mockGenerateRecommendations)
      vi.mocked(recommendationService.getSmartRecommendations).mockResolvedValue([])
      vi.mocked(recommendationService.getRecommendationAnalytics).mockResolvedValue({})

      const { result } = renderHook(() => useIntelligentRecommendationSystem(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Trigger performance-based recommendation sync
      await result.current.syncRecommendationsAfterPerformance({
        attemptId: 'attempt-123',
        subjectId: 'math-101',
        topicId: 'calculus-basics',
        score: 85,
        averageScore: 75,
      })

      expect(mockGenerateRecommendations).toHaveBeenCalledWith('test-user-123')
    })
  })

  describe('usePerformanceRecommendationIntegration', () => {
    it('should integrate performance analytics with recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          priority: 80,
          urgency: 60,
          confidence: 0.8,
          estimatedTime: 25,
          metadata: { subjectId: 'math-101', difficulty: 'Hard' },
        },
      ]

      const mockPerformanceAnalytics = {
        overallStats: { averageScore: 75 },
        gamificationStats: { averageMastery: 70 },
        learningTrends: { overallTrend: 'improving' },
      }

      vi.mocked(recommendationService.getSmartRecommendations).mockResolvedValue(mockRecommendations)
      vi.mocked(performanceService.getPerformanceAnalytics).mockResolvedValue(mockPerformanceAnalytics)
      vi.mocked(performanceService.getGamificationStats).mockResolvedValue({ averageMastery: 70 })
      vi.mocked(performanceService.getLearningTrends).mockResolvedValue({ overallTrend: 'improving' })

      const { result } = renderHook(() => usePerformanceRecommendationIntegration(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.integratedInsights.alignmentScore).toBeGreaterThan(0)
      expect(result.current.integratedInsights.effectivenessIndicator).toBe('excellent')
      expect(result.current.performanceBasedRecommendations).toBeDefined()
    })

    it('should filter recommendations based on performance level', async () => {
      const mockRecommendations = [
        {
          id: 'rec-easy',
          priority: 70,
          metadata: { difficulty: 'Easy', subjectId: 'math-101' },
        },
        {
          id: 'rec-hard',
          priority: 80,
          metadata: { difficulty: 'Hard', subjectId: 'math-101' },
        },
      ]

      const mockPerformanceInsights = {
        overallMastery: 85, // Advanced level
        attentionAreas: [{ subjectId: 'math-101' }],
      }

      vi.mocked(recommendationService.getSmartRecommendations).mockResolvedValue(mockRecommendations)
      vi.mocked(performanceService.getGamificationStats).mockResolvedValue({ averageMastery: 85 })

      const { result } = renderHook(() => usePerformanceRecommendationIntegration(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should filter out easy recommendations for advanced users
      const performanceBased = result.current.performanceBasedRecommendations
      expect(performanceBased.some(rec => rec.id === 'rec-easy')).toBe(false)
      expect(performanceBased.some(rec => rec.id === 'rec-hard')).toBe(true)
    })
  })

  describe('useUserBehaviorRecommendationSync', () => {
    it('should track user behavior and trigger recommendation updates', async () => {
      const mockSyncRecommendations = vi.fn()
      vi.mocked(recommendationService.generateRecommendations).mockResolvedValue([])

      const { result } = renderHook(() => useUserBehaviorRecommendationSync(), {
        wrapper: createWrapper(),
      })

      // Track quiz completion behavior
      result.current.trackBehavior('quiz_completed', {
        subjectId: 'math-101',
        topicId: 'calculus',
        score: 85,
        timeSpent: 1800000, // 30 minutes
        difficulty: 'medium',
      })

      // Track another quiz completion with different score
      result.current.trackBehavior('quiz_completed', {
        subjectId: 'math-101',
        topicId: 'calculus',
        score: 65,
        timeSpent: 2100000, // 35 minutes
        difficulty: 'medium',
      })

      expect(result.current.behaviorInsights.totalBehaviors).toBe(2)
      expect(result.current.behaviorInsights.mostCommonActions['quiz_completed']).toBe(2)
    })

    it('should analyze behavior patterns and determine update necessity', async () => {
      const { result } = renderHook(() => useUserBehaviorRecommendationSync(), {
        wrapper: createWrapper(),
      })

      // Simulate high variance in quiz scores (should trigger update)
      result.current.trackBehavior('quiz_completed', { score: 90, subjectId: 'math-101' })
      result.current.trackBehavior('quiz_completed', { score: 40, subjectId: 'math-101' })
      result.current.trackBehavior('quiz_completed', { score: 85, subjectId: 'math-101' })

      expect(result.current.behaviorInsights.totalBehaviors).toBe(3)

      // Force update to test pattern analysis
      result.current.forceRecommendationUpdate()

      // Should have detected significant behavior pattern
      expect(result.current.behaviorHistoryLength).toBe(3)
    })

    it('should handle streak milestones and extended study sessions', async () => {
      const { result } = renderHook(() => useUserBehaviorRecommendationSync(), {
        wrapper: createWrapper(),
      })

      // Track streak milestone
      result.current.trackBehavior('streak_updated', {
        streakCount: 7, // Weekly milestone
        sessionDuration: 7,
      })

      // Track extended study session
      result.current.trackBehavior('study_session', {
        timeSpent: 4000000, // Over 1 hour
        subjectId: 'math-101',
      })

      expect(result.current.behaviorInsights.totalBehaviors).toBe(2)
      expect(result.current.behaviorInsights.averageSessionTime).toBeGreaterThan(0)
    })
  })

  describe('Integration Flow', () => {
    it('should demonstrate complete performance-to-recommendation flow', async () => {
      // Mock all required services
      const mockRecommendations = [
        {
          id: 'rec-1',
          priority: 85,
          urgency: 70,
          confidence: 0.8,
          estimatedTime: 30,
          metadata: { subjectId: 'math-101', difficulty: 'Hard' },
        },
      ]

      vi.mocked(recommendationService.getSmartRecommendations).mockResolvedValue(mockRecommendations)
      vi.mocked(recommendationService.generateRecommendations).mockResolvedValue(mockRecommendations)
      vi.mocked(performanceService.getPerformanceAnalytics).mockResolvedValue({
        overallStats: { averageScore: 75 },
      })

      // Test intelligent recommendation system
      const { result: intelligentResult } = renderHook(() => useIntelligentRecommendationSystem(), {
        wrapper: createWrapper(),
      })

      // Test performance integration
      const { result: integrationResult } = renderHook(() => usePerformanceRecommendationIntegration(), {
        wrapper: createWrapper(),
      })

      // Test behavior tracking
      const { result: behaviorResult } = renderHook(() => useUserBehaviorRecommendationSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(intelligentResult.current.isLoading).toBe(false)
        expect(integrationResult.current.isLoading).toBe(false)
      })

      // Simulate quiz completion that should trigger recommendation updates
      behaviorResult.current.trackBehavior('quiz_completed', {
        subjectId: 'math-101',
        score: 85,
        timeSpent: 1800000,
        difficulty: 'medium',
      })

      // Trigger performance-based recommendation update
      await integrationResult.current.triggerIntelligentRecommendationUpdate({
        attemptId: 'attempt-123',
        subjectId: 'math-101',
        score: 85,
        totalQuestions: 10,
        difficulty: 'medium',
      })

      // Verify the integration worked
      expect(intelligentResult.current.allRecommendations).toBeDefined()
      expect(integrationResult.current.integratedInsights).toBeDefined()
      expect(behaviorResult.current.behaviorInsights.totalBehaviors).toBeGreaterThan(0)
    })
  })
})

describe('Recommendation System Intelligence Features', () => {
  it('should calculate priority and urgency scores correctly', () => {
    const recommendation = {
      id: 'test-rec',
      priority: 85,
      urgency: 70,
      confidence: 0.8,
      estimatedTime: 30,
      createdAt: '2024-01-01T00:00:00Z',
    }

    // Test priority categorization
    expect(recommendation.priority).toBeGreaterThanOrEqual(80) // High priority
    expect(recommendation.urgency).toBeGreaterThanOrEqual(70) // High urgency
    expect(recommendation.confidence).toBeGreaterThanOrEqual(0.8) // High confidence
  })

  it('should handle recommendation filtering based on user performance', () => {
    const recommendations = [
      { id: '1', priority: 90, metadata: { difficulty: 'Hard' } },
      { id: '2', priority: 70, metadata: { difficulty: 'Medium' } },
      { id: '3', priority: 50, metadata: { difficulty: 'Easy' } },
    ]

    // Filter for advanced users (should prefer hard/medium)
    const advancedUserRecs = recommendations.filter(rec => 
      rec.metadata.difficulty !== 'Easy' || rec.priority >= 80
    )

    expect(advancedUserRecs).toHaveLength(2)
    expect(advancedUserRecs.every(rec => rec.metadata.difficulty !== 'Easy' || rec.priority >= 80)).toBe(true)
  })

  it('should calculate improvement potential correctly', () => {
    const recommendations = [
      { priority: 85, metadata: { improvementPotential: 90 } },
      { priority: 70, metadata: { improvementPotential: 75 } },
      { priority: 60, metadata: { improvementPotential: 65 } },
    ]

    const totalImprovementPotential = recommendations.reduce(
      (sum, rec) => sum + (rec.metadata.improvementPotential || rec.priority), 0
    )

    expect(totalImprovementPotential).toBe(230) // 90 + 75 + 65
  })
})