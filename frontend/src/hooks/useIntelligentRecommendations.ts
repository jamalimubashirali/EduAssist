import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recommendationService } from '@/services/recommendationService'
import { performanceService } from '@/services/performanceService'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'
import { useEffect, useCallback } from 'react'
import { recommendationKeys } from './useRecommendationData'
import { performanceKeys } from './usePerformanceData'

// Enhanced recommendation interface matching backend's intelligent system
export interface IntelligentRecommendation {
  id: string
  userId: string
  type: string
  title: string
  description: string
  reason: string
  priority: number // Backend's priority scoring (0-100)
  urgency: number // Backend's urgency calculation (0-100)
  estimatedTime: number // Backend's time estimation in minutes
  confidence: number // Backend's confidence score (0-1)
  metadata: {
    quizId?: string
    topicId?: string
    subjectId?: string
    difficulty?: 'Easy' | 'Medium' | 'Hard'
    estimatedTime?: number
    weaknessScore?: number
    improvementPotential?: number
  }
  status: string
  createdAt: string
}

// Enhanced analytics interface from backend
export interface RecommendationAnalytics {
  totalRecommendations: number
  recentRecommendations: IntelligentRecommendation[]
  subjectDistribution: Record<string, number>
  difficultyTrend: Array<{
    date: string
    difficulty: string
    count: number
  }>
  completionRate: number
  averageResponseTime: number
  effectivenessScore: number
  priorityDistribution: {
    high: number
    medium: number
    low: number
  }
  urgencyMetrics: {
    urgent: number
    moderate: number
    low: number
  }
}

// Query keys for intelligent recommendations
export const intelligentRecommendationKeys = {
  all: ['intelligent-recommendations'] as const,
  smart: (userId: string) => [...intelligentRecommendationKeys.all, 'smart', userId] as const,
  analytics: (userId: string) => [...intelligentRecommendationKeys.all, 'analytics', userId] as const,
  prioritized: (userId: string) => [...intelligentRecommendationKeys.all, 'prioritized', userId] as const,
  personalized: (userId: string) => [...intelligentRecommendationKeys.all, 'personalized', userId] as const,
  adaptive: (userId: string) => [...intelligentRecommendationKeys.all, 'adaptive', userId] as const,
}

// Hook for intelligent recommendations with priority scoring
export function useIntelligentRecommendations(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: intelligentRecommendationKeys.smart(targetUserId || ''),
    queryFn: async () => {
      const recommendations = await recommendationService.getSmartRecommendations(targetUserId)
      return recommendations as IntelligentRecommendation[]
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 3, // 3 minutes - more frequent updates for intelligent system
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

// Hook for recommendation analytics with backend intelligence
export function useRecommendationAnalytics(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: intelligentRecommendationKeys.analytics(targetUserId || ''),
    queryFn: async () => {
      const analytics = await recommendationService.getRecommendationAnalytics(targetUserId!)
      return analytics as RecommendationAnalytics
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Hook for prioritized recommendations based on backend algorithms
export function usePrioritizedRecommendations(userId?: string, limit: number = 5) {
  const { data: smartRecommendations, isLoading } = useIntelligentRecommendations(userId)

  const prioritizedRecommendations = smartRecommendations
    ?.sort((a, b) => {
      // Primary sort by priority (higher is better)
      if (a.priority !== b.priority) return b.priority - a.priority
      // Secondary sort by urgency (higher is better)
      if (a.urgency !== b.urgency) return b.urgency - a.urgency
      // Tertiary sort by confidence (higher is better)
      return b.confidence - a.confidence
    })
    .slice(0, limit) || []

  return {
    recommendations: prioritizedRecommendations,
    isLoading,
    // Enhanced insights from backend priority scoring
    insights: {
      highPriorityCount: smartRecommendations?.filter(r => r.priority >= 70).length || 0,
      urgentCount: smartRecommendations?.filter(r => r.urgency >= 70).length || 0,
      averagePriority: smartRecommendations?.length 
        ? smartRecommendations.reduce((sum, r) => sum + r.priority, 0) / smartRecommendations.length 
        : 0,
      averageUrgency: smartRecommendations?.length
        ? smartRecommendations.reduce((sum, r) => sum + r.urgency, 0) / smartRecommendations.length
        : 0,
      totalEstimatedTime: prioritizedRecommendations.reduce((sum, r) => sum + r.estimatedTime, 0),
    }
  }
}

// Hook for performance-based recommendation updates
export function usePerformanceRecommendationSync(userId?: string) {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  // Mutation to trigger recommendation regeneration based on performance
  const regenerateRecommendations = useMutation({
    mutationFn: async (performanceData?: {
      attemptId?: string
      subjectId?: string
      topicId?: string
      score?: number
      averageScore?: number
    }) => {
      if (performanceData?.attemptId) {
        // Use backend's auto-generation for specific attempts
        return await recommendationService.autoGenerateForAttempt(performanceData.attemptId)
      } else {
        // Generate general recommendations
        return await recommendationService.generateRecommendations(targetUserId!)
      }
    },
    onSuccess: (newRecommendations) => {
      // Invalidate all recommendation caches to fetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: intelligentRecommendationKeys.smart(targetUserId!) 
      })
      queryClient.invalidateQueries({ 
        queryKey: recommendationKeys.user(targetUserId!) 
      })
      queryClient.invalidateQueries({ 
        queryKey: intelligentRecommendationKeys.analytics(targetUserId!) 
      })
      
      if (newRecommendations.length > 0) {
        toast.success(`Generated ${newRecommendations.length} personalized recommendations based on your performance! 🎯`)
      }
    },
    onError: (error: any) => {
      console.error('Failed to regenerate recommendations:', error)
      toast.error('Failed to update recommendations based on performance')
    },
  })

  // Function to sync recommendations after performance updates
  const syncRecommendationsAfterPerformance = useCallback((performanceData: {
    attemptId?: string
    subjectId?: string
    topicId?: string
    score?: number
    averageScore?: number
  }) => {
    // Trigger recommendation regeneration with performance context
    regenerateRecommendations.mutate(performanceData)
  }, [regenerateRecommendations])

  return {
    syncRecommendationsAfterPerformance,
    isRegenerating: regenerateRecommendations.isPending,
  }
}

// Hook for adaptive recommendations that respond to user behavior
export function useAdaptiveRecommendations(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id
  const queryClient = useQueryClient()

  const { data: smartRecommendations } = useIntelligentRecommendations(targetUserId)
  const { data: analytics } = useRecommendationAnalytics(targetUserId)

  // Mutation for providing feedback that improves recommendation quality
  const provideFeedback = useMutation({
    mutationFn: async ({ recommendationId, feedback }: {
      recommendationId: string
      feedback: {
        helpful: boolean
        rating: number // 1-5
        comment?: string
      }
    }) => {
      await recommendationService.provideFeedback(recommendationId, feedback)
      return feedback
    },
    onSuccess: (feedback, variables) => {
      // Invalidate recommendations to trigger re-prioritization
      queryClient.invalidateQueries({ 
        queryKey: intelligentRecommendationKeys.smart(targetUserId!) 
      })
      
      toast.success('Thank you! Your feedback helps improve recommendations 🎯')
    },
    onError: (error: any) => {
      toast.error('Failed to submit feedback')
    },
  })

  // Batch update recommendations with intelligent status management
  const batchUpdateStatus = useMutation({
    mutationFn: async ({ recommendationIds, status }: { 
      recommendationIds: string[]
      status: string 
    }) => {
      return await recommendationService.batchUpdateRecommendationStatus(recommendationIds, status)
    },
    onSuccess: (result, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ 
        queryKey: intelligentRecommendationKeys.smart(targetUserId!) 
      })
      queryClient.invalidateQueries({ 
        queryKey: intelligentRecommendationKeys.analytics(targetUserId!) 
      })
      
      toast.success(`Updated ${result.modifiedCount} recommendations`)
    },
    onError: (error: any) => {
      toast.error('Failed to update recommendations')
    },
  })

  return {
    recommendations: smartRecommendations || [],
    analytics,
    provideFeedback,
    batchUpdateStatus,
    isProvidingFeedback: provideFeedback.isPending,
    isBatchUpdating: batchUpdateStatus.isPending,
    
    // Adaptive insights based on user behavior patterns
    adaptiveInsights: {
      // Recommendations that need immediate attention
      urgentRecommendations: smartRecommendations?.filter(r => r.urgency >= 70) || [],
      
      // High-confidence recommendations likely to be helpful
      highConfidenceRecommendations: smartRecommendations?.filter(r => r.confidence >= 0.8) || [],
      
      // Quick wins (high priority, low time commitment)
      quickWins: smartRecommendations?.filter(r => r.priority >= 60 && r.estimatedTime <= 20) || [],
      
      // Long-term improvement opportunities
      longTermOpportunities: smartRecommendations?.filter(r => r.estimatedTime > 30) || [],
      
      // Effectiveness score from backend analytics
      systemEffectiveness: analytics?.effectivenessScore || 0,
      
      // User engagement with recommendations
      engagementRate: analytics?.completionRate || 0,
    }
  }
}

// Comprehensive hook that combines all intelligent recommendation features
export function useIntelligentRecommendationSystem(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { recommendations, isLoading: smartLoading } = useIntelligentRecommendations(targetUserId)
  const { recommendations: prioritized, insights: priorityInsights, isLoading: priorityLoading } = usePrioritizedRecommendations(targetUserId, 10)
  const { analytics, isLoading: analyticsLoading } = useRecommendationAnalytics(targetUserId)
  const { syncRecommendationsAfterPerformance, isRegenerating } = usePerformanceRecommendationSync(targetUserId)
  const { 
    provideFeedback, 
    batchUpdateStatus, 
    adaptiveInsights,
    isProvidingFeedback,
    isBatchUpdating 
  } = useAdaptiveRecommendations(targetUserId)

  // Auto-sync recommendations when performance data changes
  useEffect(() => {
    const handlePerformanceUpdate = (event: CustomEvent) => {
      const { attemptId, subjectId, topicId, score, averageScore } = event.detail
      syncRecommendationsAfterPerformance({
        attemptId,
        subjectId,
        topicId,
        score,
        averageScore
      })
    }

    // Listen for performance update events
    window.addEventListener('performance-updated', handlePerformanceUpdate as EventListener)
    
    return () => {
      window.removeEventListener('performance-updated', handlePerformanceUpdate as EventListener)
    }
  }, [syncRecommendationsAfterPerformance])

  return {
    // Core data
    allRecommendations: recommendations || [],
    prioritizedRecommendations: prioritized,
    analytics,
    
    // Loading states
    isLoading: smartLoading || priorityLoading || analyticsLoading,
    isRegenerating,
    isProvidingFeedback,
    isBatchUpdating,
    
    // Actions
    syncRecommendationsAfterPerformance,
    provideFeedback,
    batchUpdateStatus,
    
    // Enhanced insights combining all backend intelligence
    intelligentInsights: {
      // Priority-based insights
      ...priorityInsights,
      
      // Adaptive behavior insights
      ...adaptiveInsights,
      
      // Overall system intelligence metrics
      totalRecommendations: recommendations?.length || 0,
      systemHealth: {
        dataFreshness: analytics?.totalRecommendations ? 'good' : 'needs-update',
        algorithmPerformance: analytics?.effectivenessScore >= 70 ? 'excellent' : 
                             analytics?.effectivenessScore >= 50 ? 'good' : 'needs-improvement',
        userEngagement: analytics?.completionRate >= 60 ? 'high' : 
                       analytics?.completionRate >= 30 ? 'moderate' : 'low',
      },
      
      // Personalization quality indicators
      personalizationQuality: {
        diversityScore: analytics?.subjectDistribution ? 
          Object.keys(analytics.subjectDistribution).length : 0,
        relevanceScore: priorityInsights.averagePriority,
        timeliness: priorityInsights.averageUrgency,
        confidence: recommendations?.length ? 
          recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length : 0,
      }
    }
  }
}

// Hook for triggering recommendation updates after quiz completion
export function useQuizCompletionRecommendationTrigger() {
  const { syncRecommendationsAfterPerformance } = usePerformanceRecommendationSync()

  const triggerRecommendationUpdate = useCallback((attemptData: {
    attemptId: string
    subjectId: string
    topicId?: string
    score: number
    totalQuestions: number
    difficulty: string
  }) => {
    // Calculate performance metrics
    const scorePercentage = (attemptData.score / attemptData.totalQuestions) * 100
    
    // Trigger recommendation sync with performance context
    syncRecommendationsAfterPerformance({
      attemptId: attemptData.attemptId,
      subjectId: attemptData.subjectId,
      topicId: attemptData.topicId,
      score: scorePercentage,
      // Note: averageScore would need to be calculated from user's historical performance
    })

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('performance-updated', {
      detail: {
        attemptId: attemptData.attemptId,
        subjectId: attemptData.subjectId,
        topicId: attemptData.topicId,
        score: scorePercentage,
      }
    }))
  }, [syncRecommendationsAfterPerformance])

  return {
    triggerRecommendationUpdate,
  }
}