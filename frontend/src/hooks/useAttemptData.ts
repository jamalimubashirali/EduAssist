import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attemptService } from '@/services/attemptService'
import { quizService } from '@/services/quizService'
import { useUserStore } from '@/stores/useUserStore'
import { useUpdateUserXP, useUpdateUserStreak } from './useUserData'
import { useQuizCompletionRecommendationTrigger } from './useIntelligentRecommendations'
import { toast } from 'sonner'
import { Attempt, AttemptSubmission } from '@/types'

// Query keys
export const attemptKeys = {
  all: ['attempts'] as const,
  user: (userId: string) => [...attemptKeys.all, 'user', userId] as const,
  userStats: (userId: string) => [...attemptKeys.all, 'user', userId, 'stats'] as const,
  userRecent: (userId: string, limit: number) => [...attemptKeys.all, 'user', userId, 'recent', limit] as const,
  userBest: (userId: string, limit: number) => [...attemptKeys.all, 'user', userId, 'best', limit] as const,
  quiz: (quizId: string) => [...attemptKeys.all, 'quiz', quizId] as const,
  quizLeaderboard: (quizId: string, limit: number) => [...attemptKeys.all, 'quiz', quizId, 'leaderboard', limit] as const,
  globalLeaderboard: (limit: number) => [...attemptKeys.all, 'leaderboard', limit] as const,
  detail: (id: string) => [...attemptKeys.all, 'detail', id] as const,
}

// Get user attempts
export function useUserAttempts(userId: string, limit?: number, offset?: number) {
  return useQuery({
    queryKey: attemptKeys.user(userId),
    queryFn: () => attemptService.getUserAttempts(userId, limit, offset),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Get user attempt statistics
export function useUserAttemptStats(userId: string) {
  return useQuery({
    queryKey: attemptKeys.userStats(userId),
    queryFn: () => attemptService.getUserAttemptStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get user's recent attempts
export function useUserRecentAttempts(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: attemptKeys.userRecent(userId, limit),
    queryFn: () => attemptService.getRecentAttempts(userId, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}

// Get user's best attempts
export function useUserBestAttempts(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: attemptKeys.userBest(userId, limit),
    queryFn: () => attemptService.getBestAttempts(userId, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

// Get quiz leaderboard
export function useQuizLeaderboard(quizId: string, limit: number = 10) {
  return useQuery({
    queryKey: attemptKeys.quizLeaderboard(quizId, limit),
    queryFn: () => attemptService.getQuizLeaderboard(quizId, limit),
    enabled: !!quizId,
    staleTime: 1000 * 60 * 2,
  })
}

// Get global leaderboard
export function useGlobalLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: attemptKeys.globalLeaderboard(limit),
    queryFn: () => attemptService.getGlobalLeaderboard(limit),
    staleTime: 1000 * 60 * 2,
  })
}

// Get attempt by ID
export function useAttempt(id: string) {
  return useQuery({
    queryKey: attemptKeys.detail(id),
    queryFn: () => attemptService.getAttemptById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Submit quiz attempt mutation with intelligent recommendation integration
export function useSubmitAttempt() {
  const queryClient = useQueryClient()
  const updateUserXP = useUpdateUserXP()
  const updateUserStreak = useUpdateUserStreak()
  const { triggerRecommendationUpdate } = useQuizCompletionRecommendationTrigger()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (data: AttemptSubmission) => attemptService.submitAttempt(data),
    onSuccess: (result: Attempt) => {
      // Update cache
      queryClient.setQueryData(attemptKeys.detail(result.id), result)

      // Invalidate user-related queries
      if (result.userId) {
        queryClient.invalidateQueries({ queryKey: attemptKeys.user(result.userId) })
        queryClient.invalidateQueries({ queryKey: attemptKeys.userStats(result.userId) })
        queryClient.invalidateQueries({ queryKey: attemptKeys.userRecent(result.userId, 10) })
        queryClient.invalidateQueries({ queryKey: attemptKeys.userBest(result.userId, 10) })
      }

      // Invalidate quiz leaderboard
      if (result.quizId) {
        queryClient.invalidateQueries({ queryKey: attemptKeys.quizLeaderboard(result.quizId, 10) })
      }

      // Invalidate global leaderboard
      queryClient.invalidateQueries({ queryKey: attemptKeys.globalLeaderboard(10) })

      // Update user XP and streak
      if (user?.id && result.xpEarned > 0) {
        updateUserXP.mutate({ userId: user.id, xpGained: result.xpEarned })
        updateUserStreak.mutate({ userId: user.id, increment: true })
      }

      // Trigger intelligent recommendation updates based on performance
      if (result.id && result.subjectId && result.correctAnswers !== undefined && result.totalQuestions) {
        triggerRecommendationUpdate({
          attemptId: result.id,
          subjectId: result.subjectId,
          topicId: result.topicId,
          score: result.correctAnswers,
          totalQuestions: result.totalQuestions,
          difficulty: result.difficulty || 'medium',
        })
      }

      // Show success message
      const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100)
      toast.success(`Quiz completed! ${percentage}% score, +${result.xpEarned} XP! 🎉`)

      return result
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit quiz attempt')
    },
  })
}

// Start attempt mutation
export function useStartAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { quizId: string; topicId: string; subjectId?: string }) => attemptService.startAttempt(data),
    onSuccess: (result: Attempt) => {
      queryClient.setQueryData(attemptKeys.detail(result.id), result)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start attempt')
    },
  })
}

// Record answer mutation
export function useRecordAnswer() {
  return useMutation({
    mutationFn: ({ attemptId, questionId, selectedAnswer, isCorrect, timeSpent }: { attemptId: string; questionId: string; selectedAnswer: number; isCorrect: boolean; timeSpent?: number }) =>
      attemptService.recordAnswer(attemptId, { questionId, selectedAnswer, isCorrect, timeSpent }),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record answer')
    },
  })
}

// Complete attempt mutation with intelligent recommendation integration
export function useCompleteAttempt() {
  const queryClient = useQueryClient()
  const { triggerRecommendationUpdate } = useQuizCompletionRecommendationTrigger()

  return useMutation({
    mutationFn: (attemptId: string) => attemptService.completeAttempt(attemptId),
    onSuccess: (result: Attempt) => {
      queryClient.setQueryData(attemptKeys.detail(result.id), result)

      // Trigger intelligent recommendation updates based on completed attempt
      if (result.id && result.subjectId && result.correctAnswers !== undefined && result.totalQuestions) {
        triggerRecommendationUpdate({
          attemptId: result.id,
          subjectId: result.subjectId,
          topicId: result.topicId,
          score: result.correctAnswers,
          totalQuestions: result.totalQuestions,
          difficulty: result.difficulty || 'medium',
        })
      }

      toast.success('Quiz completed!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete quiz')
    },
  })
}


// Delete attempt mutation
export function useDeleteAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attemptService.deleteAttempt,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: attemptKeys.detail(deletedId) })

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: attemptKeys.all })

      toast.success('Attempt deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete attempt')
    },
  })
}

// Custom hook for attempt analytics
export function useAttemptAnalytics(userId: string) {
  const { data: stats } = useUserAttemptStats(userId)
  const { data: recentAttempts } = useUserRecentAttempts(userId, 5)
  const { data: bestAttempts } = useUserBestAttempts(userId, 5)

  return {
    stats: stats || {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      subjectBreakdown: []
    },
    recentAttempts: recentAttempts || [],
    bestAttempts: bestAttempts || [],
    isLoading: !stats || !recentAttempts || !bestAttempts,
  }
}

// Custom hook for quiz performance tracking
export function useQuizPerformanceTracker() {
  const { user } = useUserStore()
  const submitAttempt = useSubmitAttempt()

  const trackQuizCompletion = (
    quizId: string,
    answers: number[],
    timeSpent: number,
    onSuccess?: (result: Attempt) => void
  ) => {
    if (!user?.id) {
      toast.error('Please log in to save your progress')
      return
    }

    submitAttempt.mutate(
      {
        quizId,
        userId: user.id,
        answers,
        timeSpent,
      },
      {
        onSuccess: (result) => {
          onSuccess?.(result)
        },
      }
    )
  }

  return {
    trackQuizCompletion,
    isSubmitting: submitAttempt.isPending,
    error: submitAttempt.error,
  }
}
