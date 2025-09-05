import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizService, PersonalizedQuizConfig, AdaptiveSessionConfig, OptimalQuizParameters } from '@/services/quizService'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'
import { recommendationKeys } from './useRecommendationData'
import { performanceKeys } from './usePerformanceData'

// Query keys for intelligent quiz features
export const intelligentQuizKeys = {
  all: ['intelligent-quiz'] as const,
  personalizedGeneration: (config: PersonalizedQuizConfig) => [...intelligentQuizKeys.all, 'personalized', config] as const,
  optimalParameters: (topicId: string) => [...intelligentQuizKeys.all, 'optimal-parameters', topicId] as const,
  adaptiveSession: (config: AdaptiveSessionConfig) => [...intelligentQuizKeys.all, 'adaptive-session', config] as const,
  quizHistory: (topicId: string) => [...intelligentQuizKeys.all, 'history', topicId] as const,
  quizAnalytics: (topicId: string) => [...intelligentQuizKeys.all, 'analytics', topicId] as const,
  performanceInsights: (userId: string) => [...intelligentQuizKeys.all, 'performance-insights', userId] as const,
  smartSuggestions: (userId: string) => [...intelligentQuizKeys.all, 'smart-suggestions', userId] as const,
  recommendationBasedQuiz: (recommendationId: string) => [...intelligentQuizKeys.all, 'recommendation-based', recommendationId] as const,
}

// Generate personalized quiz using backend algorithms
export function usePersonalizedQuizGeneration() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (config: PersonalizedQuizConfig) => quizService.generatePersonalizedQuiz(config),
    onSuccess: (result, config) => {
      // Cache the generated quiz
      queryClient.setQueryData(
        intelligentQuizKeys.personalizedGeneration(config),
        result
      )

      // Invalidate related performance data since this will likely be followed by quiz completion
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: performanceKeys.userAnalytics(user.id) 
        })
      }

      toast.success(`Generated personalized quiz with ${result.questions.length} questions!`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate personalized quiz')
    },
  })
}

// Get optimal quiz parameters for intelligent recommendations
export function useOptimalQuizParameters(topicId: string) {
  return useQuery({
    queryKey: intelligentQuizKeys.optimalParameters(topicId),
    queryFn: () => quizService.getOptimalQuizParameters(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

// Start adaptive learning session
export function useAdaptiveSession() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (config: AdaptiveSessionConfig) => quizService.startAdaptiveSession(config),
    onSuccess: (result, config) => {
      // Cache the adaptive session
      queryClient.setQueryData(
        intelligentQuizKeys.adaptiveSession(config),
        result
      )

      // Invalidate performance data
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: performanceKeys.learningTrends(user.id) 
        })
      }

      toast.success(`Started adaptive session with ${result.questions.length} questions!`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start adaptive session')
    },
  })
}

// Get quiz history with analytics
export function useQuizHistory(topicId: string, limit: number = 10) {
  return useQuery({
    queryKey: intelligentQuizKeys.quizHistory(topicId),
    queryFn: () => quizService.getQuizHistory(topicId, limit),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get comprehensive quiz analytics
export function useQuizAnalytics(topicId: string) {
  return useQuery({
    queryKey: intelligentQuizKeys.quizAnalytics(topicId),
    queryFn: () => quizService.getQuizAnalytics(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get quiz performance insights for dashboard
export function useQuizPerformanceInsights(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: intelligentQuizKeys.performanceInsights(targetUserId || ''),
    queryFn: () => quizService.getQuizPerformanceInsights(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get smart quiz suggestions based on recommendation engine
export function useSmartQuizSuggestions(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: intelligentQuizKeys.smartSuggestions(targetUserId || ''),
    queryFn: () => quizService.getSmartQuizSuggestions(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Generate quiz based on recommendation
export function useRecommendationBasedQuizGeneration() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (recommendationId: string) => quizService.generateRecommendationBasedQuiz(recommendationId),
    onSuccess: (result, recommendationId) => {
      // Cache the generated quiz
      queryClient.setQueryData(
        intelligentQuizKeys.recommendationBasedQuiz(recommendationId),
        result
      )

      // Invalidate recommendation data since this recommendation was acted upon
      if (user?.id) {
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.smartRecommendations(user.id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.user(user.id) 
        })
      }

      toast.success(`Generated quiz based on your recommendation!`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate quiz from recommendation')
    },
  })
}

// Combined hook for intelligent quiz dashboard
export function useIntelligentQuizDashboard(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: performanceInsights, isLoading: insightsLoading } = useQuizPerformanceInsights(targetUserId)
  const { data: smartSuggestions, isLoading: suggestionsLoading } = useSmartQuizSuggestions(targetUserId)

  return {
    performanceInsights,
    smartSuggestions,
    isLoading: insightsLoading || suggestionsLoading,
    
    // Enhanced insights combining performance and recommendations
    insights: {
      // Urgent learning areas that need immediate attention
      urgentAreas: smartSuggestions?.urgentQuizzes?.slice(0, 3) || [],
      
      // Best performing topics where user can be challenged
      strengthAreas: performanceInsights?.topPerformingTopics?.slice(0, 3) || [],
      
      // Areas with highest improvement potential
      growthOpportunities: performanceInsights?.improvementOpportunities?.slice(0, 3) || [],
      
      // Adaptive learning recommendations
      adaptiveSuggestions: smartSuggestions?.adaptiveQuizzes?.slice(0, 5) || [],
      
      // Overall learning trajectory
      learningTrajectory: {
        averageScore: performanceInsights?.recentPerformance?.averageScore || 0,
        improvementRate: performanceInsights?.recentPerformance?.improvementRate || 0,
        consistency: performanceInsights?.recentPerformance?.streakDays || 0,
        totalQuizzes: performanceInsights?.recentPerformance?.quizzesCompleted || 0,
      },
      
      // Next recommended actions
      nextActions: [
        ...(smartSuggestions?.urgentQuizzes?.slice(0, 2) || []).map(quiz => ({
          type: 'urgent_quiz',
          title: `Review ${quiz.topicName}`,
          reason: quiz.reason,
          priority: quiz.priority,
          estimatedTime: quiz.estimatedTime
        })),
        ...(smartSuggestions?.adaptiveQuizzes?.slice(0, 1) || []).map(quiz => ({
          type: 'adaptive_quiz',
          title: `Adaptive practice session`,
          reason: quiz.reason,
          priority: 60,
          estimatedTime: quiz.questionCount * 2
        }))
      ].sort((a, b) => b.priority - a.priority).slice(0, 3)
    }
  }
}

// Hook for quiz recommendation integration
export function useQuizRecommendationIntegration() {
  const generatePersonalized = usePersonalizedQuizGeneration()
  const generateFromRecommendation = useRecommendationBasedQuizGeneration()
  const startAdaptive = useAdaptiveSession()
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  // Generate quiz based on recommendation priority and type
  const generateIntelligentQuiz = async (recommendation: {
    id: string
    type: string
    priority: number
    urgency: number
    topicId?: string
    subjectId?: string
    suggestedDifficulty?: string
    estimatedTime?: number
  }) => {
    try {
      if (recommendation.type === 'adaptive' && recommendation.topicId && recommendation.subjectId) {
        // Use adaptive session for adaptive recommendations
        return await startAdaptive.mutateAsync({
          topicId: recommendation.topicId,
          subjectId: recommendation.subjectId,
          targetDuration: recommendation.estimatedTime || 20,
          difficultyPreference: 'adaptive'
        })
      } else if (recommendation.topicId && recommendation.subjectId) {
        // Use personalized generation for other recommendations
        return await generatePersonalized.mutateAsync({
          topicId: recommendation.topicId,
          subjectId: recommendation.subjectId,
          questionsCount: Math.ceil((recommendation.estimatedTime || 20) / 2),
          sessionType: recommendation.urgency > 70 ? 'assessment' : 'practice'
        })
      } else {
        // Fallback to recommendation-based generation
        return await generateFromRecommendation.mutateAsync(recommendation.id)
      }
    } catch (error) {
      console.error('Failed to generate intelligent quiz:', error)
      throw error
    }
  }

  // Batch generate quizzes for multiple recommendations
  const batchGenerateQuizzes = async (recommendations: any[]) => {
    const results = []
    
    for (const rec of recommendations.slice(0, 3)) { // Limit to 3 to avoid overwhelming
      try {
        const result = await generateIntelligentQuiz(rec)
        results.push({ recommendation: rec, quiz: result, success: true })
      } catch (error) {
        results.push({ recommendation: rec, error, success: false })
      }
    }

    // Invalidate relevant queries after batch generation
    if (user?.id) {
      queryClient.invalidateQueries({ 
        queryKey: recommendationKeys.smartRecommendations(user.id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: intelligentQuizKeys.smartSuggestions(user.id) 
      })
    }

    const successCount = results.filter(r => r.success).length
    toast.success(`Generated ${successCount} intelligent quizzes based on your recommendations!`)

    return results
  }

  return {
    generateIntelligentQuiz,
    batchGenerateQuizzes,
    isGenerating: generatePersonalized.isPending || 
                  generateFromRecommendation.isPending || 
                  startAdaptive.isPending,
  }
}