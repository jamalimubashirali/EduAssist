import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/stores/useUserStore'
import { useIntelligentRecommendationSystem } from './useIntelligentRecommendations'
import { useAdvancedDashboardAnalytics } from './usePerformanceData'
import { performanceKeys } from './usePerformanceData'
import { intelligentRecommendationKeys } from './useIntelligentRecommendations'
import { toast } from 'sonner'

// Interface for performance-based recommendation triggers
export interface PerformanceRecommendationTrigger {
  attemptId?: string
  subjectId: string
  topicId?: string
  score: number
  totalQuestions?: number
  difficulty: string
  timeSpent?: number
  previousScore?: number
  improvementRate?: number
}

// Hook for integrating performance tracking with intelligent recommendations
export function usePerformanceRecommendationIntegration(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id
  const queryClient = useQueryClient()

  const {
    allRecommendations,
    prioritizedRecommendations,
    analytics,
    syncRecommendationsAfterPerformance,
    provideFeedback,
    batchUpdateStatus,
    intelligentInsights,
    isLoading: recommendationsLoading,
    isRegenerating,
  } = useIntelligentRecommendationSystem(targetUserId)

  const {
    analytics: performanceAnalytics,
    gamificationStats,
    subjectMastery,
    learningTrends,
    insights: performanceInsights,
    isLoading: performanceLoading,
  } = useAdvancedDashboardAnalytics(targetUserId)

  // Enhanced performance-based recommendation trigger
  const triggerIntelligentRecommendationUpdate = useCallback(async (trigger: PerformanceRecommendationTrigger) => {
    if (!targetUserId) return

    try {
      // Calculate performance metrics for intelligent recommendation generation
      const scorePercentage = trigger.totalQuestions 
        ? (trigger.score / trigger.totalQuestions) * 100 
        : trigger.score

      // Determine performance trend
      const performanceTrend = trigger.previousScore 
        ? scorePercentage > trigger.previousScore ? 'improving' : 
          scorePercentage < trigger.previousScore ? 'declining' : 'stable'
        : 'unknown'

      // Sync recommendations with enhanced performance context
      await syncRecommendationsAfterPerformance({
        attemptId: trigger.attemptId,
        subjectId: trigger.subjectId,
        topicId: trigger.topicId,
        score: scorePercentage,
        averageScore: performanceAnalytics?.overallStats?.averageScore || 0,
      })

      // Invalidate performance-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: performanceKeys.user(targetUserId) })
      queryClient.invalidateQueries({ queryKey: performanceKeys.userAnalytics(targetUserId) })
      queryClient.invalidateQueries({ queryKey: performanceKeys.gamificationStats(targetUserId) })
      queryClient.invalidateQueries({ queryKey: performanceKeys.subjectMastery(targetUserId) })

      // Show contextual feedback based on performance
      if (scorePercentage >= 85) {
        toast.success('Excellent performance! 🌟 Check your recommendations for advanced challenges.')
      } else if (scorePercentage >= 70) {
        toast.success('Good job! 👍 New recommendations available to help you improve further.')
      } else if (scorePercentage >= 50) {
        toast.info('Keep practicing! 📚 Updated recommendations will help strengthen your knowledge.')
      } else {
        toast.info('Don\'t give up! 💪 Personalized recommendations are ready to help you improve.')
      }

    } catch (error) {
      console.error('Failed to trigger intelligent recommendation update:', error)
      toast.error('Failed to update personalized recommendations')
    }
  }, [targetUserId, syncRecommendationsAfterPerformance, performanceAnalytics, queryClient])

  // Auto-update recommendations based on performance patterns
  useEffect(() => {
    if (!performanceAnalytics || !learningTrends || recommendationsLoading || performanceLoading) return

    // Check if user's performance has significantly changed
    const recentTrend = learningTrends.overallTrend
    const hasSignificantChange = recentTrend === 'improving' || recentTrend === 'declining'

    // Check if recommendations are stale (older than 1 hour)
    const lastRecommendationTime = allRecommendations[0]?.createdAt
    const isStale = lastRecommendationTime 
      ? Date.now() - new Date(lastRecommendationTime).getTime() > 60 * 60 * 1000
      : true

    // Trigger update if performance has changed significantly or recommendations are stale
    if (hasSignificantChange || isStale) {
      const mostRecentSubject = subjectMastery?.[0]?.subjectId
      if (mostRecentSubject) {
        triggerIntelligentRecommendationUpdate({
          subjectId: mostRecentSubject,
          score: performanceAnalytics.overallStats?.averageScore || 0,
          difficulty: 'medium',
          improvementRate: learningTrends.weeklyTrends?.[0]?.averageScore || 0,
        })
      }
    }
  }, [
    performanceAnalytics,
    learningTrends,
    subjectMastery,
    allRecommendations,
    recommendationsLoading,
    performanceLoading,
    triggerIntelligentRecommendationUpdate
  ])

  // Smart recommendation filtering based on performance insights
  const getPerformanceBasedRecommendations = useCallback(() => {
    if (!prioritizedRecommendations || !performanceInsights) return []

    return prioritizedRecommendations.filter(rec => {
      // Filter based on user's current performance level
      const userLevel = performanceInsights.overallMastery >= 80 ? 'advanced' :
                       performanceInsights.overallMastery >= 60 ? 'intermediate' : 'beginner'

      // Match recommendation difficulty to user level
      const recDifficulty = rec.metadata?.difficulty?.toLowerCase()
      
      if (userLevel === 'advanced' && recDifficulty === 'easy') return false
      if (userLevel === 'beginner' && recDifficulty === 'hard') return false

      // Prioritize recommendations for weak areas
      const isWeakArea = performanceInsights.attentionAreas?.some(area => 
        area.subjectId === rec.metadata?.subjectId
      )

      return isWeakArea || rec.priority >= 60
    })
  }, [prioritizedRecommendations, performanceInsights])

  // Get recommendations that align with learning trajectory
  const getTrajectoryAlignedRecommendations = useCallback(() => {
    if (!prioritizedRecommendations || !performanceInsights) return []

    const trajectory = performanceInsights.performanceTrajectory

    return prioritizedRecommendations.filter(rec => {
      if (trajectory === 'improving') {
        // For improving users, suggest challenging content
        return rec.priority >= 70 || rec.metadata?.difficulty === 'Hard'
      } else if (trajectory === 'declining') {
        // For declining users, suggest reinforcement content
        return rec.urgency >= 60 || rec.metadata?.difficulty === 'Easy'
      } else {
        // For stable users, maintain current level
        return rec.priority >= 50
      }
    }).slice(0, 5)
  }, [prioritizedRecommendations, performanceInsights])

  // Batch accept recommendations based on performance insights
  const acceptRecommendationsForWeakAreas = useCallback(async () => {
    if (!prioritizedRecommendations || !performanceInsights) return

    const weakAreaRecommendations = prioritizedRecommendations.filter(rec => 
      performanceInsights.attentionAreas?.some(area => 
        area.subjectId === rec.metadata?.subjectId
      ) && rec.status === 'pending'
    ).slice(0, 3) // Limit to top 3

    if (weakAreaRecommendations.length > 0) {
      const recommendationIds = weakAreaRecommendations.map(rec => rec.id)
      await batchUpdateStatus.mutateAsync({ recommendationIds, status: 'accepted' })
      
      toast.success(`Accepted ${weakAreaRecommendations.length} recommendations for your focus areas! 🎯`)
    }
  }, [prioritizedRecommendations, performanceInsights, batchUpdateStatus])

  // Provide automatic feedback based on performance correlation
  const providePerformanceBasedFeedback = useCallback(async (recommendationId: string, wasHelpful: boolean) => {
    // Calculate feedback rating based on performance improvement
    const rating = wasHelpful ? 
      (performanceInsights?.performanceTrajectory === 'improving' ? 5 : 4) : 
      (performanceInsights?.performanceTrajectory === 'declining' ? 1 : 2)

    await provideFeedback.mutateAsync({
      recommendationId,
      feedback: {
        helpful: wasHelpful,
        rating,
        comment: wasHelpful 
          ? 'This recommendation aligned well with my learning needs and performance level.'
          : 'This recommendation didn\'t match my current performance level or learning goals.'
      }
    })
  }, [performanceInsights, provideFeedback])

  return {
    // Core data
    recommendations: allRecommendations,
    prioritizedRecommendations,
    analytics,
    performanceAnalytics,
    
    // Enhanced recommendation lists
    performanceBasedRecommendations: getPerformanceBasedRecommendations(),
    trajectoryAlignedRecommendations: getTrajectoryAlignedRecommendations(),
    
    // Loading states
    isLoading: recommendationsLoading || performanceLoading,
    isRegenerating,
    
    // Actions
    triggerIntelligentRecommendationUpdate,
    acceptRecommendationsForWeakAreas,
    providePerformanceBasedFeedback,
    
    // Enhanced insights combining performance and recommendations
    integratedInsights: {
      // Performance-recommendation alignment score
      alignmentScore: intelligentInsights?.personalizationQuality?.relevanceScore || 0,
      
      // Recommendation effectiveness based on performance trends
      effectivenessIndicator: performanceInsights?.performanceTrajectory === 'improving' && 
                             intelligentInsights?.systemHealth?.userEngagement === 'high' 
                             ? 'excellent' : 'good',
      
      // Areas where recommendations are most needed
      criticalFocusAreas: performanceInsights?.attentionAreas?.slice(0, 3) || [],
      
      // Recommendations that match user's learning velocity
      velocityMatchedRecommendations: prioritizedRecommendations?.filter(rec => 
        rec.estimatedTime <= (performanceInsights?.activityConsistency || 0) * 2
      ).length || 0,
      
      // Performance improvement potential from current recommendations
      improvementPotential: prioritizedRecommendations?.reduce((sum, rec) => 
        sum + (rec.metadata?.improvementPotential || rec.priority), 0
      ) || 0,
      
      // User engagement quality with recommendation system
      engagementQuality: {
        completionRate: analytics?.completionRate || 0,
        feedbackRate: analytics?.averageResponseTime ? 
          Math.min(100, (1 / analytics.averageResponseTime) * 100) : 0,
        adaptationRate: intelligentInsights?.personalizationQuality?.confidence || 0,
      }
    }
  }
}

// Hook for real-time performance-recommendation synchronization
export function useRealTimePerformanceRecommendationSync(userId?: string) {
  const { triggerIntelligentRecommendationUpdate } = usePerformanceRecommendationIntegration(userId)

  // Listen for performance events and trigger recommendation updates
  useEffect(() => {
    const handlePerformanceEvent = (event: CustomEvent<PerformanceRecommendationTrigger>) => {
      triggerIntelligentRecommendationUpdate(event.detail)
    }

    // Listen for various performance-related events
    window.addEventListener('quiz-completed', handlePerformanceEvent as EventListener)
    window.addEventListener('assessment-completed', handlePerformanceEvent as EventListener)
    window.addEventListener('performance-milestone', handlePerformanceEvent as EventListener)
    window.addEventListener('learning-streak-updated', handlePerformanceEvent as EventListener)

    return () => {
      window.removeEventListener('quiz-completed', handlePerformanceEvent as EventListener)
      window.removeEventListener('assessment-completed', handlePerformanceEvent as EventListener)
      window.removeEventListener('performance-milestone', handlePerformanceEvent as EventListener)
      window.removeEventListener('learning-streak-updated', handlePerformanceEvent as EventListener)
    }
  }, [triggerIntelligentRecommendationUpdate])

  return {
    triggerIntelligentRecommendationUpdate,
  }
}