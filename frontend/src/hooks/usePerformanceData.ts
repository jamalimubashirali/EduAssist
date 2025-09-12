import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  performanceService,
  PerformanceData,
  PerformanceStats,
  LearningProgress
} from '@/services/performanceService'
import { topicService } from '@/services/topicService'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'

// Query keys
export const performanceKeys = {
  all: ['performance'] as const,
  user: (userId: string) => [...performanceKeys.all, 'user', userId] as const,
  userStats: (userId: string) => [...performanceKeys.all, 'user', userId, 'stats'] as const,
  userAnalytics: (userId: string) => [...performanceKeys.all, 'user', userId, 'analytics'] as const,
  userProgress: (userId: string) => [...performanceKeys.all, 'user', userId, 'progress'] as const,
  weakAreas: (userId: string) => [...performanceKeys.all, 'user', userId, 'weak-areas'] as const,
  strongAreas: (userId: string) => [...performanceKeys.all, 'user', userId, 'strong-areas'] as const,
  comparison: (userId: string) => [...performanceKeys.all, 'user', userId, 'comparison'] as const,
  recommendations: (userId: string) => [...performanceKeys.all, 'user', userId, 'recommendations'] as const,
  trends: (userId: string, period: string) => [...performanceKeys.all, 'user', userId, 'trends', period] as const,
  gamificationStats: (userId: string) => [...performanceKeys.all, 'user', userId, 'gamification-stats'] as const,
  subjectMastery: (userId: string) => [...performanceKeys.all, 'user', userId, 'subject-mastery'] as const,
  learningTrends: (userId: string) => [...performanceKeys.all, 'user', userId, 'learning-trends'] as const,
}

// Get user performance data
export function useUserPerformance(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.user(targetUserId || ''),
    queryFn: () => performanceService.getUserPerformance(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get subject-specific performance
export function useSubjectPerformance(subjectId: string, userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: [...performanceKeys.user(targetUserId || ''), 'subject', subjectId],
    queryFn: () => performanceService.getSubjectPerformance(targetUserId!, subjectId),
    enabled: !!targetUserId && !!subjectId,
    staleTime: 1000 * 60 * 5,
  })
}

// Get performance analytics
export function usePerformanceAnalytics(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.userAnalytics(targetUserId || ''),
    queryFn: () => performanceService.getPerformanceAnalytics(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get learning progress
export function useLearningProgress(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.userProgress(targetUserId || ''),
    queryFn: () => performanceService.getLearningProgress(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  })
}

// Get weak areas
export function useWeakAreas(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.weakAreas(targetUserId || ''),
    queryFn: () => performanceService.getWeakAreas(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10,
  })
}

// Get strong areas
export function useStrongAreas(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.strongAreas(targetUserId || ''),
    queryFn: () => performanceService.getStrongAreas(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10,
  })
}

// Get performance comparison
export function usePerformanceComparison(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.comparison(targetUserId || ''),
    queryFn: () => performanceService.getPerformanceComparison(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

// Get study recommendations
export function useStudyRecommendations(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.recommendations(targetUserId || ''),
    queryFn: () => performanceService.getStudyRecommendations(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Get performance trends
export function usePerformanceTrends(period: 'week' | 'month' | 'year' = 'month', userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.trends(targetUserId || '', period),
    queryFn: () => performanceService.getPerformanceTrends(targetUserId!, period),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10,
  })
}

// Record performance mutation
export function useRecordPerformance() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (data: PerformanceData) => performanceService.recordPerformance(data),
    onSuccess: () => {
      const currentUserId = user?.id
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: performanceKeys.user(currentUserId) })
        queryClient.invalidateQueries({ queryKey: performanceKeys.userAnalytics(currentUserId) })
        queryClient.invalidateQueries({ queryKey: performanceKeys.userProgress(currentUserId) })
        queryClient.invalidateQueries({ queryKey: performanceKeys.trends(currentUserId, 'week') })
        queryClient.invalidateQueries({ queryKey: performanceKeys.trends(currentUserId, 'month') })
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record performance data')
    },
  })
}

// Combined hook for dashboard analytics
export function useDashboardAnalytics(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: analytics, isLoading: analyticsLoading } = usePerformanceAnalytics(targetUserId)
  const { data: progress, isLoading: progressLoading } = useLearningProgress(targetUserId)
  const { data: weakAreas, isLoading: weakLoading } = useWeakAreas(targetUserId)
  const { data: strongAreas, isLoading: strongLoading } = useStrongAreas(targetUserId)
  const { data: trends, isLoading: trendsLoading } = usePerformanceTrends('month', targetUserId)

  return {
    analytics,
    progress,
    weakAreas,
    strongAreas,
    trends,
    isLoading: analyticsLoading || progressLoading || weakLoading || strongLoading || trendsLoading,
  }
}

// Hook for performance tracking during quiz
export function usePerformanceTracker() {
  const recordPerformance = useRecordPerformance()
  const { user } = useUserStore()

  const trackQuizPerformance = async (
    subjectId: string | undefined,
    topicId: string | undefined,
    score: number,
    timeSpent: number,
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  ) => {
    if (!user?.id) return

    let resolvedSubjectId = subjectId
    const resolvedTopicId = topicId

    // If subjectId is missing but topicId exists, fetch topic to resolve subjectId
    if (!resolvedSubjectId && resolvedTopicId) {
      try {
        const topic = await topicService.getTopicById(resolvedTopicId)
        resolvedSubjectId = (topic as any)?.subjectId?._id || (topic as any)?.subjectId || undefined
      } catch (e) {
        console.warn('Could not resolve subjectId from topicId', e)
      }
    }

    if (!resolvedSubjectId || !resolvedTopicId) return

    recordPerformance.mutate({
      subjectId: resolvedSubjectId,
      topicId: resolvedTopicId,
      attemptData: {
        score,
        timeSpent,
        difficulty: difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
        date: new Date().toISOString(),
      }
    })
  }

  return {
    trackQuizPerformance,
    isRecording: recordPerformance.isPending,
  }
}

// Get advanced gamification statistics
export function useGamificationStats(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.gamificationStats(targetUserId || ''),
    queryFn: () => performanceService.getGamificationStats(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 2000,
  })
}

// Get subject mastery levels
export function useSubjectMastery(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.subjectMastery(targetUserId || ''),
    queryFn: () => performanceService.getSubjectMastery(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

// Get learning velocity and trend analysis
export function useLearningTrends(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: performanceKeys.learningTrends(targetUserId || ''),
    queryFn: () => performanceService.getLearningTrends(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Enhanced dashboard analytics with advanced backend features
export function useAdvancedDashboardAnalytics(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: analytics, isLoading: analyticsLoading } = usePerformanceAnalytics(targetUserId)
  const { data: progress, isLoading: progressLoading } = useLearningProgress(targetUserId)
  const { data: gamificationStats, isLoading: gamificationLoading } = useGamificationStats(targetUserId)
  const { data: subjectMastery, isLoading: masteryLoading } = useSubjectMastery(targetUserId)
  const { data: learningTrends, isLoading: trendsLoading } = useLearningTrends(targetUserId)
  const { data: weakAreas, isLoading: weakLoading } = useWeakAreas(targetUserId)
  const { data: strongAreas, isLoading: strongLoading } = useStrongAreas(targetUserId)

  return {
    analytics,
    progress,
    gamificationStats,
    subjectMastery,
    learningTrends,
    weakAreas,
    strongAreas,
    isLoading: analyticsLoading || progressLoading || gamificationLoading || masteryLoading || trendsLoading || weakLoading || strongLoading,
    
    // Enhanced insights based on backend algorithms
    insights: {
      // Overall mastery level from backend calculations
      overallMastery: gamificationStats?.averageMastery || 0,
      
      // Learning velocity from backend trend analysis
      learningVelocity: learningTrends?.overallTrend || 'insufficient_data',
      
      // Activity consistency from backend daily trends
      activityConsistency: learningTrends?.totalDaysActive || 0,
      
      // Subject expertise areas from backend mastery calculations
      expertiseAreas: subjectMastery?.filter(s => s.masteryLevel >= 80).slice(0, 3) || [],
      
      // Areas needing attention from backend weak area identification
      attentionAreas: gamificationStats?.weakAreas?.slice(0, 3) || [],
      
      // Performance trajectory from backend trend analysis
      performanceTrajectory: learningTrends?.weeklyTrends?.length >= 2 
        ? learningTrends.weeklyTrends[learningTrends.weeklyTrends.length - 1].averageScore > 
          learningTrends.weeklyTrends[learningTrends.weeklyTrends.length - 2].averageScore
          ? 'improving' 
          : 'declining'
        : 'stable',
    }
  }
}

// Hook for performance insights
export function usePerformanceInsights(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: analytics } = usePerformanceAnalytics(targetUserId)
  const { data: comparison } = usePerformanceComparison(targetUserId)
  const { data: recommendations } = useStudyRecommendations(targetUserId)

  // Calculate insights
  const insights = {
    // Overall performance level
    performanceLevel: analytics?.overallStats?.averageScore 
      ? analytics.overallStats.averageScore >= 80 
        ? 'excellent' 
        : analytics.overallStats.averageScore >= 60 
          ? 'good' 
          : 'needs-improvement'
      : 'unknown',
    
    // Improvement trend
    improvementTrend: analytics?.weeklyTrend && analytics.weeklyTrend.length >= 2
      ? analytics.weeklyTrend[analytics.weeklyTrend.length - 1].averageScore > 
        analytics.weeklyTrend[analytics.weeklyTrend.length - 2].averageScore
        ? 'improving'
        : 'declining'
      : 'stable',
    
    // Ranking position
    rankingPercentile: comparison?.percentile || 0,
    
    // Study focus areas
    focusAreas: recommendations?.recommendedTopics?.slice(0, 3) || [],
    
    // Consistency score (based on streak and regular activity)
    consistencyScore: analytics?.overallStats ? 
      Math.min(100, (analytics.overallStats.averageScore * 0.7) + 
                   (Math.min(30, analytics.weeklyTrend?.length || 0) * 1)) : 0,
  }

  return {
    insights,
    analytics,
    comparison,
    recommendations,
  }
}
