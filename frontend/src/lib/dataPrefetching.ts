import { QueryClient } from '@tanstack/react-query'
import { CACHE_TIMES, createQueryKey } from './queryClient'
import { userService } from '@/services/userService'
import { subjectService } from '@/services/subjectService'
import { topicService } from '@/services/topicService'
import { quizService } from '@/services/quizService'
import { performanceService } from '@/services/performanceService'
import { gamificationService } from '@/services/gamificationService'
import { useUserStore } from '@/stores/useUserStore'

export class DataPrefetcher {
  constructor(private queryClient: QueryClient) {}

  // Helper method to check if user has completed onboarding
  private isOnboardingComplete(): boolean {
    try {
      const { user, isInitialized } = useUserStore.getState()
      return isInitialized && user?.onboarding?.status === 'COMPLETED'
    } catch (error) {
      console.warn('Failed to check onboarding status:', error)
      return false
    }
  }

  // Prefetch data based on user navigation patterns
  async prefetchForRoute(route: string, userId?: string, params?: Record<string, string>) {
    switch (route) {
      case '/dashboard':
        await this.prefetchDashboardData(userId!)
        break
      case '/subjects':
        await this.prefetchSubjectsData()
        break
      case '/subjects/[id]':
        if (params?.id) {
          await this.prefetchSubjectDetailData(params.id, userId)
        }
        break
      case '/topics/[id]':
        if (params?.id) {
          await this.prefetchTopicDetailData(params.id, userId)
        }
        break
      case '/quiz/[id]':
        if (params?.id && userId) {
          await this.prefetchQuizData(params.id, userId)
        }
        break
      case '/profile':
        if (userId) {
          await this.prefetchProfileData(userId)
        }
        break
      case '/analytics':
        if (userId) {
          await this.prefetchAnalyticsData(userId)
        }
        break
    }
  }

  // Dashboard data prefetching
  private async prefetchDashboardData(userId: string) {
    const prefetchPromises = [
      // Essential user data
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.currentUser(),
        queryFn: userService.getCurrentUser,
        staleTime: CACHE_TIMES.USER_PROFILE,
      }),

      // User stats for dashboard widgets
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.userStats(userId),
        queryFn: () => userService.getUserStats(userId),
        staleTime: CACHE_TIMES.USER_STATS,
      }),

      // Gamification data for progress display
      this.queryClient.prefetchQuery({
        queryKey: ['gamification', userId],
        queryFn: () => gamificationService.getUserStats(userId),
        staleTime: CACHE_TIMES.GAMIFICATION,
      }),

      // Recent performance for trends
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.performanceAnalytics(userId),
        queryFn: () => performanceService.getPerformanceAnalytics(userId),
        staleTime: CACHE_TIMES.ANALYTICS,
      }),

      // Recommended quizzes (only for users who completed onboarding)
      ...(this.isOnboardingComplete() ? [
        this.queryClient.prefetchQuery({
          queryKey: ['quizzes', 'recommended', userId],
          queryFn: () => quizService.getRecommendedQuizzes(userId),
          staleTime: CACHE_TIMES.RECOMMENDATIONS,
        })
      ] : []),

      // Popular subjects for quick access
      this.queryClient.prefetchQuery({
        queryKey: ['subjects', 'popular', 5],
        queryFn: () => subjectService.getPopularSubjects(5),
        staleTime: CACHE_TIMES.SUBJECTS,
      }),
    ]

    await Promise.allSettled(prefetchPromises)
  }

  // Subjects page data prefetching
  private async prefetchSubjectsData() {
    const prefetchPromises = [
      // All subjects
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.subjects(),
        queryFn: subjectService.getAllSubjects,
        staleTime: CACHE_TIMES.SUBJECTS,
      }),

      // Subjects with stats for enhanced display
      this.queryClient.prefetchQuery({
        queryKey: ['subjects', 'with-stats'],
        queryFn: () => subjectService.getSubjectsWithStats(),
        staleTime: CACHE_TIMES.ANALYTICS,
      }),

      // Popular subjects
      this.queryClient.prefetchQuery({
        queryKey: ['subjects', 'popular', 10],
        queryFn: () => subjectService.getPopularSubjects(10),
        staleTime: CACHE_TIMES.SUBJECTS,
      }),
    ]

    await Promise.allSettled(prefetchPromises)
  }

  // Subject detail page data prefetching
  private async prefetchSubjectDetailData(subjectId: string, userId?: string) {
    const prefetchPromises = [
      // Subject details
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.subject(subjectId),
        queryFn: () => subjectService.getSubjectById(subjectId),
        staleTime: CACHE_TIMES.SUBJECTS,
      }),

      // Topics for this subject
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.topicsBySubject(subjectId),
        queryFn: () => subjectService.getTopicsBySubject(subjectId),
        staleTime: CACHE_TIMES.TOPICS,
      }),

      // Quizzes for this subject
      this.queryClient.prefetchQuery({
        queryKey: ['quizzes', 'subject', subjectId],
        queryFn: () => quizService.getQuizzesBySubject(subjectId),
        staleTime: CACHE_TIMES.QUIZZES,
      }),
    ]

    // If user is logged in, prefetch performance data
    if (userId) {
      prefetchPromises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['performance', userId, 'subject', subjectId],
          queryFn: () => performanceService.getSubjectPerformance(userId, subjectId),
          staleTime: CACHE_TIMES.PERFORMANCE_DATA,
        })
      )
    }

    await Promise.allSettled(prefetchPromises)
  }

  // Topic detail page data prefetching
  private async prefetchTopicDetailData(topicId: string, userId?: string) {
    const prefetchPromises = [
      // Topic details
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.topic(topicId),
        queryFn: () => topicService.getTopicById(topicId),
        staleTime: CACHE_TIMES.TOPICS,
      }),

      // Quizzes for this topic
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.quizzesByTopic(topicId),
        queryFn: () => quizService.getQuizzesByTopic(topicId),
        staleTime: CACHE_TIMES.QUIZZES,
      }),
    ]

    // If user is logged in, prefetch personalized data
    if (userId) {
      prefetchPromises.push(
        // Optimal quiz parameters for intelligent recommendations
        this.queryClient.prefetchQuery({
          queryKey: ['quizzes', 'optimal-parameters', topicId],
          queryFn: () => quizService.getOptimalQuizParameters(topicId),
          staleTime: CACHE_TIMES.RECOMMENDATIONS,
        }),

        // Quiz history for this topic
        this.queryClient.prefetchQuery({
          queryKey: ['quizzes', 'history', topicId, 5],
          queryFn: () => quizService.getQuizHistory(topicId, 5),
          staleTime: CACHE_TIMES.ANALYTICS,
        })
      )
    }

    await Promise.allSettled(prefetchPromises)
  }

  // Quiz page data prefetching
  private async prefetchQuizData(quizId: string, userId: string) {
    const prefetchPromises = [
      // Quiz details
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.quiz(quizId),
        queryFn: () => quizService.getQuizById(quizId),
        staleTime: CACHE_TIMES.QUIZZES,
      }),

      // User performance for context
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.performance(userId),
        queryFn: () => performanceService.getUserPerformance(userId),
        staleTime: CACHE_TIMES.PERFORMANCE_DATA,
      }),

      // Gamification stats for progress tracking
      this.queryClient.prefetchQuery({
        queryKey: ['gamification', userId],
        queryFn: () => gamificationService.getUserStats(userId),
        staleTime: CACHE_TIMES.GAMIFICATION,
      }),
    ]

    await Promise.allSettled(prefetchPromises)
  }

  // Profile page data prefetching
  private async prefetchProfileData(userId: string) {
    const prefetchPromises = [
      // User details
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.user(userId),
        queryFn: () => userService.getUserById(userId),
        staleTime: CACHE_TIMES.USER_PROFILE,
      }),

      // User stats
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.userStats(userId),
        queryFn: () => userService.getUserStats(userId),
        staleTime: CACHE_TIMES.USER_STATS,
      }),

      // Gamification data
      this.queryClient.prefetchQuery({
        queryKey: ['gamification', userId],
        queryFn: () => gamificationService.getUserStats(userId),
        staleTime: CACHE_TIMES.GAMIFICATION,
      }),

      // User badges
      this.queryClient.prefetchQuery({
        queryKey: ['gamification', 'badges', userId],
        queryFn: () => gamificationService.getUserBadges(userId),
        staleTime: CACHE_TIMES.USER_PREFERENCES,
      }),

      // User achievements
      this.queryClient.prefetchQuery({
        queryKey: ['gamification', 'achievements', userId],
        queryFn: () => gamificationService.getUserAchievements(userId),
        staleTime: CACHE_TIMES.USER_PREFERENCES,
      }),
    ]

    await Promise.allSettled(prefetchPromises)
  }

  // Analytics page data prefetching
  private async prefetchAnalyticsData(userId: string) {
    const prefetchPromises = [
      // Performance analytics
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.performanceAnalytics(userId),
        queryFn: () => performanceService.getPerformanceAnalytics(userId),
        staleTime: CACHE_TIMES.ANALYTICS,
      }),

      // Learning trends
      this.queryClient.prefetchQuery({
        queryKey: ['performance', userId, 'trends'],
        queryFn: () => performanceService.getLearningTrends(userId),
        staleTime: CACHE_TIMES.TRENDS,
      }),

      // Subject mastery
      this.queryClient.prefetchQuery({
        queryKey: ['performance', userId, 'subject-mastery'],
        queryFn: () => performanceService.getSubjectMastery(userId),
        staleTime: CACHE_TIMES.ANALYTICS,
      }),

      // Gamification stats for analytics
      this.queryClient.prefetchQuery({
        queryKey: ['performance', userId, 'gamification-stats'],
        queryFn: () => performanceService.getGamificationStats(userId),
        staleTime: CACHE_TIMES.ANALYTICS,
      }),
    ]

    await Promise.allSettled(prefetchPromises)
  }

  // Predictive prefetching based on user behavior
  async prefetchPredictiveData(userId: string, currentRoute: string, userBehavior: {
    frequentSubjects?: string[]
    recentTopics?: string[]
    preferredDifficulty?: string
  }) {
    const prefetchPromises: Promise<any>[] = []

    // Prefetch frequently accessed subjects
    if (userBehavior.frequentSubjects) {
      userBehavior.frequentSubjects.forEach(subjectId => {
        prefetchPromises.push(
          this.queryClient.prefetchQuery({
            queryKey: createQueryKey.topicsBySubject(subjectId),
            queryFn: () => subjectService.getTopicsBySubject(subjectId),
            staleTime: CACHE_TIMES.TOPICS,
          })
        )
      })
    }

    // Prefetch recent topics' quizzes
    if (userBehavior.recentTopics) {
      userBehavior.recentTopics.forEach(topicId => {
        prefetchPromises.push(
          this.queryClient.prefetchQuery({
            queryKey: createQueryKey.quizzesByTopic(topicId),
            queryFn: () => quizService.getQuizzesByTopic(topicId),
            staleTime: CACHE_TIMES.QUIZZES,
          })
        )
      })
    }

    // Prefetch recommended content based on current context
    if (currentRoute.includes('/subjects')) {
      prefetchPromises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['quizzes', 'recommended', userId],
          queryFn: () => quizService.getRecommendedQuizzes(userId),
          staleTime: CACHE_TIMES.RECOMMENDATIONS,
        })
      )
    }

    await Promise.allSettled(prefetchPromises)
  }

  // Background data refresh for real-time features
  startBackgroundRefresh(userId: string) {
    const refreshInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        // Refresh real-time data in background
        await Promise.allSettled([
          this.queryClient.invalidateQueries({
            queryKey: ['gamification', userId],
            refetchType: 'active'
          }),
          this.queryClient.invalidateQueries({
            queryKey: ['gamification', 'leaderboard'],
            refetchType: 'active'
          }),
          this.queryClient.invalidateQueries({
            queryKey: ['quizzes', 'recommended', userId],
            refetchType: 'active'
          }),
        ])
      }
    }, 1000 * 60 * 3) // Every 3 minutes

    return () => clearInterval(refreshInterval)
  }
}

// Create singleton instance
let dataPrefetcherInstance: DataPrefetcher | null = null

export function getDataPrefetcher(queryClient: QueryClient): DataPrefetcher {
  if (!dataPrefetcherInstance) {
    dataPrefetcherInstance = new DataPrefetcher(queryClient)
  }
  return dataPrefetcherInstance
}