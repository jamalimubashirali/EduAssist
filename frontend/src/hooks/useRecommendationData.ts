import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '@/services/recommendationService';
import { Recommendation } from '@/services/recommendationService';
import { StudyPlan } from '@/types';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';

// Query keys
export const recommendationKeys = {
  all: ['recommendations'] as const,
  user: (userId: string) => [...recommendationKeys.all, 'user', userId] as const,
  userByType: (userId: string, type: string) => [...recommendationKeys.all, 'user', userId, 'type', type] as const,
  detail: (id: string) => [...recommendationKeys.all, 'detail', id] as const,
  studyPlan: (userId: string) => [...recommendationKeys.all, 'study-plan', userId] as const,
  quizRecommendations: (userId: string) => [...recommendationKeys.all, 'quizzes', userId] as const,
  topicRecommendations: (userId: string) => [...recommendationKeys.all, 'topics', userId] as const,
  adaptiveDifficulty: (userId: string, subjectId: string) => [...recommendationKeys.all, 'difficulty', userId, subjectId] as const,
  smartRecommendations: (userId: string) => [...recommendationKeys.all, 'smart', userId] as const,
  analytics: (userId: string) => [...recommendationKeys.all, 'analytics', userId] as const,
  stats: (userId: string) => [...recommendationKeys.all, 'stats', userId] as const,
  byStatus: (status: string) => [...recommendationKeys.all, 'status', status] as const,
}

// Get user recommendations
export function useUserRecommendations(type?: string, limit?: number, userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: type
      ? recommendationKeys.userByType(targetUserId || '', type)
      : recommendationKeys.user(targetUserId || ''),
    queryFn: () => recommendationService.getUserRecommendations(targetUserId!, type, limit),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Disable aggressive refetching
    retry: 1,
    retryDelay: 2000,
  })
}

// Get recommendation by ID
export function useRecommendation(id: string) {
  return useQuery({
    queryKey: recommendationKeys.detail(id),
    queryFn: () => recommendationService.getRecommendationById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  })
}

// Get study plan
export function useStudyPlan(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.studyPlan(targetUserId || ''),
    queryFn: () => recommendationService.getStudyPlan(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10,
  })
}

// Get quiz recommendations
export function useQuizRecommendations(limit: number = 5, userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.quizRecommendations(targetUserId || ''),
    queryFn: () => recommendationService.getQuizRecommendations(targetUserId!, limit),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  })
}

// Get topic recommendations
export function useTopicRecommendations(limit: number = 5, userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.topicRecommendations(targetUserId || ''),
    queryFn: () => recommendationService.getTopicRecommendations(targetUserId!, limit),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  })
}

// Get adaptive difficulty recommendation
export function useAdaptiveDifficulty(subjectId: string, userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.adaptiveDifficulty(targetUserId || '', subjectId),
    queryFn: () => recommendationService.getAdaptiveDifficulty(targetUserId!, subjectId),
    enabled: !!targetUserId && !!subjectId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

// Accept recommendation mutation
export function useAcceptRecommendation() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (id: string) => recommendationService.acceptRecommendation(id),
    onSuccess: (updatedRecommendation) => {
      // Update cache
      queryClient.setQueryData(
        recommendationKeys.detail(updatedRecommendation.id), 
        updatedRecommendation
      )
      
      // Invalidate user recommendations
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.user(user.id) 
        })
      }
      
      toast.success('Recommendation accepted! 🎯')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept recommendation')
    },
  })
}

// Dismiss recommendation mutation
export function useDismissRecommendation() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      recommendationService.dismissRecommendation(id, reason),
    onSuccess: (updatedRecommendation) => {
      // Update cache
      queryClient.setQueryData(
        recommendationKeys.detail(updatedRecommendation.id), 
        updatedRecommendation
      )
      
      // Invalidate user recommendations
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.user(user.id) 
        })
      }
      
      toast.success('Recommendation dismissed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to dismiss recommendation')
    },
  })
}

// Complete recommendation mutation
export function useCompleteRecommendation() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (id: string) => recommendationService.completeRecommendation(id),
    onSuccess: (updatedRecommendation) => {
      // Update cache
      queryClient.setQueryData(
        recommendationKeys.detail(updatedRecommendation.id), 
        updatedRecommendation
      )
      
      // Invalidate user recommendations
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.user(user.id) 
        })
      }
      
      toast.success('Great job completing this recommendation! 🎉')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete recommendation')
    },
  })
}

// Generate recommendations mutation
export function useGenerateRecommendations() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (userId?: string) => 
      recommendationService.generateRecommendations(userId || user?.id!),
    onSuccess: (newRecommendations, userId) => {
      const targetUserId = userId || user?.id
      if (targetUserId) {
        // Invalidate user recommendations to fetch fresh data
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.user(targetUserId) 
        })
      }
      
      toast.success(`Generated ${newRecommendations.length} new recommendations!`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate recommendations')
    },
  })
}

// Create study plan mutation
export function useCreateStudyPlan() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (preferences: {
      subjects: string[]
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      dailyTimeCommitment: number
      duration: number
      goals: string[]
    }) => recommendationService.createStudyPlan(user?.id!, preferences),
    onSuccess: (newStudyPlan) => {
      // Update cache
      queryClient.setQueryData(
        recommendationKeys.studyPlan(user?.id!), 
        newStudyPlan
      )
      
      toast.success('Study plan created successfully! 📚')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create study plan')
    },
  })
}

// Update study plan progress mutation
export function useUpdateStudyPlanProgress() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: ({ planId, progress }: { 
      planId: string
      progress: {
        currentDay?: number
        completedMilestones?: number
        totalXPEarned?: number
      }
    }) => recommendationService.updateStudyPlanProgress(planId, progress),
    onSuccess: (updatedPlan) => {
      // Update cache
      queryClient.setQueryData(
        recommendationKeys.studyPlan(user?.id!), 
        updatedPlan
      )
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update study plan progress')
    },
  })
}

// Provide feedback mutation
export function useProvideFeedback() {
  return useMutation({
    mutationFn: ({ recommendationId, feedback }: {
      recommendationId: string
      feedback: {
        helpful: boolean
        rating: number
        comment?: string
      }
    }) => recommendationService.provideFeedback(recommendationId, feedback),
    onSuccess: () => {
      toast.success('Thank you for your feedback!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit feedback')
    },
  })
}

// Get intelligent recommendations with priority scoring
export function useSmartRecommendations(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.smartRecommendations(targetUserId || ''),
    queryFn: () => recommendationService.getSmartRecommendations(targetUserId),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get recommendation analytics
export function useRecommendationAnalytics(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.analytics(targetUserId || ''),
    queryFn: () => recommendationService.getRecommendationAnalytics(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get recommendation statistics
export function useRecommendationStats(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: recommendationKeys.stats(targetUserId || ''),
    queryFn: () => recommendationService.getRecommendationStats(targetUserId),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get recommendations by status
export function useRecommendationsByStatus(status: 'pending' | 'accepted' | 'rejected' | 'completed') {
  return useQuery({
    queryKey: recommendationKeys.byStatus(status),
    queryFn: () => recommendationService.getRecommendationsByStatus(status),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Batch update recommendation status mutation
export function useBatchUpdateRecommendationStatus() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: ({ recommendationIds, status }: { recommendationIds: string[]; status: string }) =>
      recommendationService.batchUpdateRecommendationStatus(recommendationIds, status),
    onSuccess: (result, variables) => {
      // Invalidate relevant queries
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: recommendationKeys.user(user.id) })
        queryClient.invalidateQueries({ queryKey: recommendationKeys.smartRecommendations(user.id) })
        queryClient.invalidateQueries({ queryKey: recommendationKeys.stats(user.id) })
        queryClient.invalidateQueries({ queryKey: recommendationKeys.byStatus(variables.status) })
      }
      
      toast.success(`${result.message}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update recommendations')
    },
  })
}

// Enhanced recommendation dashboard with intelligent features
export function useIntelligentRecommendationDashboard(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: allRecommendations, isLoading: allLoading } = useUserRecommendations(undefined, 10, targetUserId)
  const { data: smartRecommendations, isLoading: smartLoading } = useSmartRecommendations(targetUserId)
  const { data: analytics, isLoading: analyticsLoading } = useRecommendationAnalytics(targetUserId)
  const { data: stats, isLoading: statsLoading } = useRecommendationStats(targetUserId)
  const { data: studyPlan, isLoading: planLoading } = useStudyPlan(targetUserId)

  // Filter recommendations by status
  const pendingRecommendations = allRecommendations?.filter(r => r.status === 'pending') || []
  const acceptedRecommendations = allRecommendations?.filter(r => r.status === 'accepted') || []
  const completedRecommendations = allRecommendations?.filter(r => r.status === 'completed') || []

  // Prioritize smart recommendations
  const prioritizedRecommendations = smartRecommendations?.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    return b.urgency - a.urgency
  }) || []

  return {
    allRecommendations: allRecommendations || [],
    smartRecommendations: prioritizedRecommendations,
    pendingRecommendations,
    acceptedRecommendations,
    completedRecommendations,
    analytics,
    stats,
    studyPlan,
    isLoading: allLoading || smartLoading || analyticsLoading || statsLoading || planLoading,
    
    // Enhanced insights from backend algorithms
    insights: {
      // High priority recommendations needing immediate attention
      urgentRecommendations: prioritizedRecommendations.filter(r => r.urgency >= 70).slice(0, 3),
      
      // Completion rate from backend analytics
      completionRate: analytics?.completionRate || 0,
      
      // Subject focus areas from backend distribution analysis
      focusSubjects: Object.entries(analytics?.subjectDistribution || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([subject]) => subject),
      
      // Recommendation effectiveness score
      effectivenessScore: stats ? 
        Math.round((stats.statusBreakdown.completed / Math.max(stats.statusBreakdown.total, 1)) * 100) : 0,
      
      // Average time to complete recommendations
      averageCompletionTime: prioritizedRecommendations.length > 0 ?
        prioritizedRecommendations.reduce((sum, r) => sum + r.estimatedTime, 0) / prioritizedRecommendations.length : 0,
    }
  }
}

// Combined hook for recommendation dashboard (legacy support)
export function useRecommendationDashboard(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: allRecommendations, isLoading: allLoading } = useUserRecommendations(undefined, 10, targetUserId)
  const { data: quizRecommendations, isLoading: quizLoading } = useQuizRecommendations(5, targetUserId)
  const { data: topicRecommendations, isLoading: topicLoading } = useTopicRecommendations(5, targetUserId)
  const { data: studyPlan, isLoading: planLoading } = useStudyPlan(targetUserId)

  // Filter recommendations by status
  const pendingRecommendations = allRecommendations?.filter(r => r.status === 'pending') || []
  const acceptedRecommendations = allRecommendations?.filter(r => r.status === 'accepted') || []
  const completedRecommendations = allRecommendations?.filter(r => r.status === 'completed') || []

  return {
    allRecommendations: allRecommendations || [],
    pendingRecommendations,
    acceptedRecommendations,
    completedRecommendations,
    quizRecommendations: quizRecommendations || [],
    topicRecommendations: topicRecommendations || [],
    studyPlan,
    isLoading: allLoading || quizLoading || topicLoading || planLoading,
    
    // Summary stats
    stats: {
      total: allRecommendations?.length || 0,
      pending: pendingRecommendations.length,
      accepted: acceptedRecommendations.length,
      completed: completedRecommendations.length,
      hasStudyPlan: !!studyPlan,
    }
  }
}
