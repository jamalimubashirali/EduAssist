import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  quizService, 
  QuizFilters, 
  GenerateQuizRequest, 
  CreateQuizData,
  PersonalizedQuizConfig,
  AdaptiveSessionConfig
} from '@/services/quizService'
import { toast } from 'sonner'
import { CACHE_TIMES } from '@/lib/queryClient'
import { useCacheInvalidation, usePrefetchStrategies } from '@/hooks/useCacheManager'

// Query keys with optimized structure
export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters: QuizFilters) => [...quizKeys.lists(), filters] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
  subject: (subject: string) => [...quizKeys.all, 'subject', subject] as const,
  topic: (topicId: string) => [...quizKeys.all, 'topic', topicId] as const,
  recommended: (userId: string) => [...quizKeys.all, 'recommended', userId] as const,
  search: (query: string, filters?: QuizFilters) => [...quizKeys.all, 'search', query, filters] as const,
  popular: (limit: number) => [...quizKeys.all, 'popular', limit] as const,
  recent: (limit: number) => [...quizKeys.all, 'recent', limit] as const,
  // Personalized quiz keys
  optimalParameters: (topicId: string) => [...quizKeys.all, 'optimal-parameters', topicId] as const,
  quizHistory: (topicId: string, limit: number) => [...quizKeys.all, 'history', topicId, limit] as const,
  // Analytics keys
  analytics: (topicId: string) => [...quizKeys.all, 'analytics', topicId] as const,
  performanceInsights: (userId: string) => [...quizKeys.all, 'performance-insights', userId] as const,
}

// Get all quizzes with filters - optimized caching
export function useQuizzes(filters?: QuizFilters) {
  return useQuery({
    queryKey: quizKeys.list(filters || {}),
    queryFn: () => quizService.getAllQuizzes(filters),
    staleTime: CACHE_TIMES.QUIZZES,
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
  })
}

// Get quiz by ID - longer cache for individual quizzes
export function useQuiz(id: string) {

  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: async () => {
      try {
        const result = await quizService.getQuizById(id)
        return result
      } catch (error) {
        console.error('❌ [USE_QUIZ] Error fetching quiz:', error)
        throw error
      }
    },
    enabled: !!id,
    staleTime: CACHE_TIMES.QUIZZES,
    gcTime: 1000 * 60 * 20, // Keep individual quizzes longer
    // Note: onSuccess and onError are not valid options for useQuery in React Query v4+
  })
}

// Get quizzes by subject - with prefetching
export function useQuizzesBySubject(subject: string) {
  const { prefetchOnSubjectView } = usePrefetchStrategies()
  
  const query = useQuery({
    queryKey: quizKeys.subject(subject),
    queryFn: () => quizService.getQuizzesBySubject(subject),
    enabled: !!subject,
    staleTime: CACHE_TIMES.QUIZZES,
  })

  // Prefetch related data when this query succeeds
  if (query.data && subject) {
    prefetchOnSubjectView(subject)
  }

  return query
}

// Get quizzes by topic - with intelligent prefetching
export function useQuizzesByTopic(topicId: string, userId?: string) {
  const { prefetchOnTopicView } = usePrefetchStrategies()
  
  const query = useQuery({
    queryKey: quizKeys.topic(topicId),
    queryFn: () => quizService.getQuizzesByTopic(topicId),
    enabled: !!topicId,
    staleTime: CACHE_TIMES.QUIZZES,
  })

  // Prefetch related data when viewing topic
  if (query.data && topicId) {
    prefetchOnTopicView(topicId, userId)
  }

  return query
}

// Get recommended quizzes - shorter cache for dynamic content
export function useRecommendedQuizzes(userId: string) {
  return useQuery({
    queryKey: quizKeys.recommended(userId),
    queryFn: () => quizService.getRecommendedQuizzes(userId),
    enabled: !!userId,
    staleTime: CACHE_TIMES.RECOMMENDATIONS,
    refetchOnWindowFocus: false, // Disable aggressive refetching
    retry: 1,
    retryDelay: 2000,
  })
}

// Search quizzes - optimized for search results
export function useSearchQuizzes(query: string, filters?: QuizFilters) {
  return useQuery({
    queryKey: quizKeys.search(query, filters),
    queryFn: () => quizService.searchQuizzes(query, filters),
    enabled: !!query && query.length > 2,
    staleTime: CACHE_TIMES.SEARCH_RESULTS,
    gcTime: 1000 * 60 * 10, // Don't keep search results too long
  })
}

// Get popular quizzes - longer cache for stable content
export function usePopularQuizzes(limit: number = 10) {
  return useQuery({
    queryKey: quizKeys.popular(limit),
    queryFn: () => quizService.getPopularQuizzes(limit),
    staleTime: CACHE_TIMES.ANALYTICS, // Popular quizzes change slowly
    gcTime: 1000 * 60 * 30, // Keep popular content longer
  })
}

// Get recent quizzes - moderate cache for semi-dynamic content
export function useRecentQuizzes(limit: number = 10) {
  return useQuery({
    queryKey: quizKeys.recent(limit),
    queryFn: () => quizService.getRecentQuizzes(limit),
    staleTime: CACHE_TIMES.QUIZZES,
  })
}

// Generate quiz mutation with optimistic updates
export function useGenerateQuiz() {
  const queryClient = useQueryClient()
  const { invalidateOnContentUpdate } = useCacheInvalidation()

  return useMutation({
    mutationFn: (request: GenerateQuizRequest) => quizService.generateQuiz(request),
    onSuccess: async (newQuiz) => {
      // Add to cache immediately
      queryClient.setQueryData(quizKeys.detail(newQuiz.id), newQuiz)
      
      // Intelligent cache invalidation
      await invalidateOnContentUpdate('quiz', newQuiz.id)
      
      toast.success('Quiz generated successfully! 🎯')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate quiz')
    },
  })
}

// Create quiz mutation
export function useCreateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: quizService.createQuiz,
    onSuccess: (newQuiz) => {
      // Add to cache
      queryClient.setQueryData(quizKeys.detail(newQuiz.id), newQuiz)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
      
      toast.success('Quiz created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create quiz')
    },
  })
}

// Update quiz mutation
export function useUpdateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateQuizData> }) => 
      quizService.updateQuiz(id, data),
    onSuccess: (updatedQuiz) => {
      // Update cache
      queryClient.setQueryData(quizKeys.detail(updatedQuiz.id), updatedQuiz)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
      
      toast.success('Quiz updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update quiz')
    },
  })
}

// Delete quiz mutation
export function useDeleteQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: quizService.deleteQuiz,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: quizKeys.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() })
      
      toast.success('Quiz deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete quiz')
    },
  })
}

// Custom hook for quiz statistics
export function useQuizStats() {
  const { data: popularQuizzes } = usePopularQuizzes(5)
  const { data: recentQuizzes } = useRecentQuizzes(5)

  return {
    popularQuizzes: popularQuizzes || [],
    recentQuizzes: recentQuizzes || [],
    isLoading: !popularQuizzes || !recentQuizzes,
  }
}

// Get optimal quiz parameters for intelligent recommendations
export function useOptimalQuizParameters(topicId: string) {
  return useQuery({
    queryKey: quizKeys.optimalParameters(topicId),
    queryFn: () => quizService.getOptimalQuizParameters(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get quiz history with analytics
export function useQuizHistory(topicId: string, limit: number = 10) {
  return useQuery({
    queryKey: quizKeys.quizHistory(topicId, limit),
    queryFn: () => quizService.getQuizHistory(topicId, limit),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Generate personalized quiz mutation with intelligent caching
export function useGeneratePersonalizedQuiz() {
  const queryClient = useQueryClient()
  const { prefetchOnQuizStart } = usePrefetchStrategies()

  return useMutation({
    mutationFn: (config: PersonalizedQuizConfig) => quizService.generatePersonalizedQuiz(config),
    onSuccess: async (result, variables) => {
      // Cache the generated quiz if it exists
      if (result.quiz) {
        queryClient.setQueryData(quizKeys.detail(result.quiz.id), result.quiz)
        
        // Prefetch data for quiz session
        if (variables.userId) {
          await prefetchOnQuizStart(variables.userId, variables.topicId)
        }
      }
      
      // Invalidate optimal parameters to refresh recommendations
      queryClient.invalidateQueries({ 
        queryKey: quizKeys.optimalParameters(variables.topicId) 
      })
      
      // Invalidate quiz history to include new session
      queryClient.invalidateQueries({ 
        queryKey: quizKeys.quizHistory(variables.topicId, 10) 
      })
      
      toast.success('Personalized quiz generated successfully! 🎯')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate personalized quiz')
    },
  })
}

// Start adaptive session mutation
export function useStartAdaptiveSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: AdaptiveSessionConfig) => quizService.startAdaptiveSession(config),
    onSuccess: (result, variables) => {
      // Cache the generated quiz if it exists
      if (result.quiz) {
        queryClient.setQueryData(quizKeys.detail(result.quiz.id), result.quiz)
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: quizKeys.optimalParameters(variables.topicId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: quizKeys.quizHistory(variables.topicId, 10) 
      })
      
      toast.success('Adaptive learning session started! 🚀')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start adaptive session')
    },
  })
}

// QUIZ ANALYTICS HOOKS - Connect to backend's performance tracking and analytics

// Get comprehensive quiz analytics for a topic
export function useQuizAnalytics(topicId: string) {
  return useQuery({
    queryKey: [...quizKeys.all, 'analytics', topicId],
    queryFn: () => quizService.getQuizAnalytics(topicId),
    enabled: !!topicId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  })
}

// Get quiz performance insights for dashboard
export function useQuizPerformanceInsights(userId: string) {
  return useQuery({
    queryKey: [...quizKeys.all, 'performance-insights', userId],
    queryFn: () => quizService.getQuizPerformanceInsights(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Combined hook for quiz dashboard data
export function useQuizDashboardData(userId: string, topicId?: string) {
  const performanceInsights = useQuizPerformanceInsights(userId)
  const topicAnalytics = useQuizAnalytics(topicId || '')
  const optimalParameters = useOptimalQuizParameters(topicId || '')

  return {
    performanceInsights: performanceInsights.data,
    topicAnalytics: topicAnalytics.data,
    optimalParameters: optimalParameters.data,
    isLoading: performanceInsights.isLoading ||
               (topicId && (topicAnalytics.isLoading || optimalParameters.isLoading)),
    error: performanceInsights.error || topicAnalytics.error || optimalParameters.error
  }
}

// Hook for getting or creating topic-based quiz with personalization
export function useGetOrCreateTopicQuiz() {
  const queryClient = useQueryClient()
  const { invalidateOnContentUpdate } = useCacheInvalidation()

  return useMutation({
    mutationFn: (request: {
      topicId: string
      subjectId: string
      difficulty?: 'beginner' | 'intermediate' | 'advanced'
      questionCount?: number
    }) => quizService.getOrCreateTopicQuiz(request),
    onSuccess: (quiz, variables) => {
      // Cache the quiz
      queryClient.setQueryData(quizKeys.detail(quiz.id), quiz)

      // Invalidate related caches using the correct method
      invalidateOnContentUpdate('quiz', quiz.id)

      // Also invalidate topic and subject related quiz caches
      queryClient.invalidateQueries({ queryKey: quizKeys.topic(variables.topicId) })
      queryClient.invalidateQueries({ queryKey: quizKeys.subject(variables.subjectId) })
      queryClient.invalidateQueries({ queryKey: quizKeys.all })

      toast.success('Quiz ready! 🎯')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to prepare quiz')
    },
  })
}
