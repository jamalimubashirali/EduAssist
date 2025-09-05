import { QueryClient } from '@tanstack/react-query'
import { CACHE_INVALIDATION, CACHE_TIMES, createQueryKey } from './queryClient'

export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  // Intelligent cache invalidation based on user actions
  async invalidateOnUserUpdate(userId: string) {
    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.user(userId) }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.currentUser() }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.userStats(userId) }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.gamification(userId) }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.performance(userId) }),
      this.queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
    ])
  }

  async invalidateOnQuizCompletion(userId: string, topicId?: string, subjectId?: string) {
    await Promise.all([
      // Invalidate performance data
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.performance(userId) }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.performanceAnalytics(userId) }),
      
      // Invalidate gamification data
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.gamification(userId) }),
      this.queryClient.invalidateQueries({ queryKey: ['gamification', 'leaderboard'] }),
      
      // Invalidate recommendations
      this.queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
      
      // Invalidate analytics
      this.queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      
      // Invalidate user stats
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.userStats(userId) }),
    ])

    // If topic/subject specific, invalidate those too
    if (topicId) {
      await this.queryClient.invalidateQueries({ 
        queryKey: ['quizzes', 'optimal-parameters', topicId] 
      })
      await this.queryClient.invalidateQueries({ 
        queryKey: ['quizzes', 'history', topicId] 
      })
    }
  }

  async invalidateOnContentUpdate(type: 'subject' | 'topic' | 'quiz', id?: string) {
    const invalidations = []

    switch (type) {
      case 'subject':
        invalidations.push(
          this.queryClient.invalidateQueries({ queryKey: createQueryKey.subjects() }),
          this.queryClient.invalidateQueries({ queryKey: ['search', 'subjects'] })
        )
        if (id) {
          invalidations.push(
            this.queryClient.invalidateQueries({ queryKey: createQueryKey.subject(id) }),
            this.queryClient.invalidateQueries({ queryKey: createQueryKey.subjectStats(id) }),
            this.queryClient.invalidateQueries({ queryKey: createQueryKey.topicsBySubject(id) })
          )
        }
        break

      case 'topic':
        invalidations.push(
          this.queryClient.invalidateQueries({ queryKey: createQueryKey.topics() }),
          this.queryClient.invalidateQueries({ queryKey: ['search', 'topics'] })
        )
        if (id) {
          invalidations.push(
            this.queryClient.invalidateQueries({ queryKey: createQueryKey.topic(id) }),
            this.queryClient.invalidateQueries({ queryKey: createQueryKey.quizzesByTopic(id) })
          )
        }
        break

      case 'quiz':
        invalidations.push(
          this.queryClient.invalidateQueries({ queryKey: createQueryKey.quizzes() }),
          this.queryClient.invalidateQueries({ queryKey: ['search', 'quizzes'] })
        )
        if (id) {
          invalidations.push(
            this.queryClient.invalidateQueries({ queryKey: createQueryKey.quiz(id) })
          )
        }
        break
    }

    await Promise.all(invalidations)
  }

  async invalidateOnOnboardingComplete(userId: string) {
    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.user(userId) }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.currentUser() }),
      this.queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.performance(userId) }),
      this.queryClient.invalidateQueries({ queryKey: createQueryKey.gamification(userId) }),
    ])
  }

  // Optimistic updates for immediate UI feedback
  async optimisticUpdateUser(userId: string, updateData: any) {
    const userKey = createQueryKey.user(userId)
    const currentUserKey = createQueryKey.currentUser()

    // Get current data
    const currentUser = this.queryClient.getQueryData(userKey)
    const currentUserData = this.queryClient.getQueryData(currentUserKey)

    // Apply optimistic update
    if (currentUser) {
      this.queryClient.setQueryData(userKey, { ...currentUser, ...updateData })
    }
    if (currentUserData) {
      this.queryClient.setQueryData(currentUserKey, { ...currentUserData, ...updateData })
    }

    return {
      rollback: () => {
        if (currentUser) this.queryClient.setQueryData(userKey, currentUser)
        if (currentUserData) this.queryClient.setQueryData(currentUserKey, currentUserData)
      }
    }
  }

  async optimisticUpdateXP(userId: string, xpGained: number) {
    const userKey = createQueryKey.user(userId)
    const statsKey = createQueryKey.userStats(userId)
    const gamificationKey = createQueryKey.gamification(userId)

    // Get current data
    const currentUser = this.queryClient.getQueryData(userKey) as any
    const currentStats = this.queryClient.getQueryData(statsKey) as any
    const currentGamification = this.queryClient.getQueryData(gamificationKey) as any

    const rollbacks: (() => void)[] = []

    // Update user XP
    if (currentUser) {
      const newXP = (currentUser.xp_points || 0) + xpGained
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1
      const updatedUser = { ...currentUser, xp_points: newXP, level: newLevel }
      
      this.queryClient.setQueryData(userKey, updatedUser)
      this.queryClient.setQueryData(createQueryKey.currentUser(), updatedUser)
      
      rollbacks.push(() => {
        this.queryClient.setQueryData(userKey, currentUser)
        this.queryClient.setQueryData(createQueryKey.currentUser(), currentUser)
      })
    }

    // Update stats
    if (currentStats) {
      const updatedStats = { 
        ...currentStats, 
        totalXP: (currentStats.totalXP || 0) + xpGained 
      }
      this.queryClient.setQueryData(statsKey, updatedStats)
      rollbacks.push(() => this.queryClient.setQueryData(statsKey, currentStats))
    }

    // Update gamification
    if (currentGamification) {
      const updatedGamification = { 
        ...currentGamification, 
        totalXP: (currentGamification.totalXP || 0) + xpGained 
      }
      this.queryClient.setQueryData(gamificationKey, updatedGamification)
      rollbacks.push(() => this.queryClient.setQueryData(gamificationKey, currentGamification))
    }

    return {
      rollback: () => rollbacks.forEach(fn => fn())
    }
  }

  // Prefetch strategies for predictable user actions
  async prefetchOnSubjectView(subjectId: string) {
    // Prefetch topics for this subject
    await this.queryClient.prefetchQuery({
      queryKey: createQueryKey.topicsBySubject(subjectId),
      staleTime: CACHE_TIMES.TOPICS,
    })

    // Prefetch subject stats
    await this.queryClient.prefetchQuery({
      queryKey: createQueryKey.subjectStats(subjectId),
      staleTime: CACHE_TIMES.ANALYTICS,
    })
  }

  async prefetchOnTopicView(topicId: string, userId?: string) {
    // Prefetch quizzes for this topic
    await this.queryClient.prefetchQuery({
      queryKey: createQueryKey.quizzesByTopic(topicId),
      staleTime: CACHE_TIMES.QUIZZES,
    })

    // Prefetch optimal quiz parameters if user is logged in
    if (userId) {
      await this.queryClient.prefetchQuery({
        queryKey: ['quizzes', 'optimal-parameters', topicId],
        staleTime: CACHE_TIMES.RECOMMENDATIONS,
      })
    }
  }

  async prefetchOnQuizStart(userId: string, topicId: string) {
    // Prefetch performance data for quick results display
    await this.queryClient.prefetchQuery({
      queryKey: createQueryKey.performance(userId),
      staleTime: CACHE_TIMES.PERFORMANCE_DATA,
    })

    // Prefetch quiz history for this topic
    await this.queryClient.prefetchQuery({
      queryKey: ['quizzes', 'history', topicId, 10],
      staleTime: CACHE_TIMES.ANALYTICS,
    })
  }

  async prefetchOnQuizComplete(userId: string, topicId: string) {
    // Prefetch updated performance analytics
    await this.queryClient.prefetchQuery({
      queryKey: createQueryKey.performanceAnalytics(userId),
      staleTime: CACHE_TIMES.ANALYTICS,
    })

    // Prefetch updated gamification stats
    await this.queryClient.prefetchQuery({
      queryKey: createQueryKey.gamification(userId),
      staleTime: CACHE_TIMES.GAMIFICATION,
    })

    // Prefetch updated recommendations
    await this.queryClient.prefetchQuery({
      queryKey: ['recommendations', userId],
      staleTime: CACHE_TIMES.RECOMMENDATIONS,
    })
  }

  // Cache warming for essential data
  async warmEssentialCache() {
    await Promise.all([
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.subjects(),
        staleTime: CACHE_TIMES.SUBJECTS,
      }),
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.currentUser(),
        staleTime: CACHE_TIMES.USER_PROFILE,
      }),
    ])
  }

  async warmPostAuthCache(userId: string) {
    await Promise.all([
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.userStats(userId),
        staleTime: CACHE_TIMES.USER_STATS,
      }),
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.gamification(userId),
        staleTime: CACHE_TIMES.GAMIFICATION,
      }),
      this.queryClient.prefetchQuery({
        queryKey: ['recommendations', userId],
        staleTime: CACHE_TIMES.RECOMMENDATIONS,
      }),
    ])
  }

  async warmDashboardCache(userId: string) {
    await Promise.all([
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.performance(userId),
        staleTime: CACHE_TIMES.PERFORMANCE_DATA,
      }),
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.performanceAnalytics(userId),
        staleTime: CACHE_TIMES.ANALYTICS,
      }),
      this.queryClient.prefetchQuery({
        queryKey: createQueryKey.leaderboard(10),
        staleTime: CACHE_TIMES.LEADERBOARD,
      }),
    ])
  }

  // Background sync for real-time data
  startBackgroundSync(userId: string) {
    const syncInterval = setInterval(async () => {
      // Only sync if user is active (document is visible)
      if (document.visibilityState === 'visible') {
        await Promise.all([
          this.queryClient.invalidateQueries({ 
            queryKey: createQueryKey.gamification(userId),
            refetchType: 'active' 
          }),
          this.queryClient.invalidateQueries({ 
            queryKey: ['gamification', 'leaderboard'],
            refetchType: 'active' 
          }),
        ])
      }
    }, 1000 * 60 * 2) // Every 2 minutes

    return () => clearInterval(syncInterval)
  }

  // Clean up stale cache entries
  async cleanupStaleCache() {
    // Remove queries that haven't been used recently
    this.queryClient.getQueryCache().getAll().forEach(query => {
      const lastUpdated = query.state.dataUpdatedAt
      const now = Date.now()
      const maxAge = 1000 * 60 * 30 // 30 minutes

      if (now - lastUpdated > maxAge && !query.getObserversCount()) {
        this.queryClient.removeQueries({ queryKey: query.queryKey })
      }
    })
  }
}

// Create a singleton instance
let cacheManagerInstance: CacheManager | null = null

export function getCacheManager(queryClient: QueryClient): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(queryClient)
  }
  return cacheManagerInstance
}

// Hook to use cache manager in components
export function useCacheManager() {
  const queryClient = new QueryClient() // This should be injected properly
  return getCacheManager(queryClient)
}