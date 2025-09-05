import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface OptimisticUpdateConfig<T> {
  queryKey: any[]
  updateFn: (oldData: T) => T
  rollbackFn?: (oldData: T) => T
  successMessage?: string
  errorMessage?: string
}

export class OptimisticUpdateManager {
  constructor(private queryClient: QueryClient) {}

  // Generic optimistic update with rollback capability
  async performOptimisticUpdate<T, V>(
    config: OptimisticUpdateConfig<T>,
    mutationFn: () => Promise<V>
  ): Promise<V> {
    const { queryKey, updateFn, rollbackFn, successMessage, errorMessage } = config

    // Get current data
    const previousData = this.queryClient.getQueryData<T>(queryKey)
    
    // Apply optimistic update
    if (previousData) {
      const optimisticData = updateFn(previousData)
      this.queryClient.setQueryData(queryKey, optimisticData)
    }

    try {
      // Perform the actual mutation
      const result = await mutationFn()
      
      // Show success message if provided
      if (successMessage) {
        toast.success(successMessage)
      }
      
      return result
    } catch (error) {
      // Rollback on error
      if (previousData) {
        const rollbackData = rollbackFn ? rollbackFn(previousData) : previousData
        this.queryClient.setQueryData(queryKey, rollbackData)
      }
      
      // Show error message
      if (errorMessage) {
        toast.error(errorMessage)
      }
      
      throw error
    }
  }

  // Optimistic XP update
  async updateXPOptimistically(
    userId: string,
    xpGained: number,
    mutationFn: () => Promise<any>
  ) {
    const userKey = ['users', userId]
    const statsKey = ['users', userId, 'stats']
    const gamificationKey = ['gamification', userId]

    // Store original data for rollback
    const originalUser = this.queryClient.getQueryData(userKey)
    const originalStats = this.queryClient.getQueryData(statsKey)
    const originalGamification = this.queryClient.getQueryData(gamificationKey)

    try {
      // Update user XP optimistically
      if (originalUser) {
        const updatedUser = {
          ...originalUser,
          xp_points: ((originalUser as any).xp_points || 0) + xpGained,
          level: Math.floor(Math.sqrt(((originalUser as any).xp_points || 0) + xpGained) / 100) + 1
        }
        this.queryClient.setQueryData(userKey, updatedUser)
      }

      // Update stats optimistically
      if (originalStats) {
        const updatedStats = {
          ...originalStats,
          totalXP: ((originalStats as any).totalXP || 0) + xpGained
        }
        this.queryClient.setQueryData(statsKey, updatedStats)
      }

      // Update gamification optimistically
      if (originalGamification) {
        const updatedGamification = {
          ...originalGamification,
          totalXP: ((originalGamification as any).totalXP || 0) + xpGained
        }
        this.queryClient.setQueryData(gamificationKey, updatedGamification)
      }

      // Perform actual mutation
      const result = await mutationFn()
      
      toast.success(`+${xpGained} XP earned! 🎯`)
      return result

    } catch (error) {
      // Rollback all changes
      if (originalUser) this.queryClient.setQueryData(userKey, originalUser)
      if (originalStats) this.queryClient.setQueryData(statsKey, originalStats)
      if (originalGamification) this.queryClient.setQueryData(gamificationKey, originalGamification)
      
      toast.error('Failed to update XP')
      throw error
    }
  }

  // Optimistic quiz completion update
  async completeQuizOptimistically(
    userId: string,
    quizId: string,
    score: number,
    xpGained: number,
    mutationFn: () => Promise<any>
  ) {
    const performanceKey = ['performance', userId]
    const gamificationKey = ['gamification', userId]
    const userStatsKey = ['users', userId, 'stats']

    // Store original data
    const originalPerformance = this.queryClient.getQueryData(performanceKey)
    const originalGamification = this.queryClient.getQueryData(gamificationKey)
    const originalStats = this.queryClient.getQueryData(userStatsKey)

    try {
      // Update performance optimistically
      if (originalPerformance) {
        const updatedPerformance = {
          ...originalPerformance,
          totalAttempts: ((originalPerformance as any).totalAttempts || 0) + 1,
          // Add the new score to recent scores
          recentScores: [score, ...((originalPerformance as any).recentScores || [])].slice(0, 10)
        }
        this.queryClient.setQueryData(performanceKey, updatedPerformance)
      }

      // Update gamification optimistically
      if (originalGamification) {
        const updatedGamification = {
          ...originalGamification,
          totalXP: ((originalGamification as any).totalXP || 0) + xpGained,
          quizzesCompleted: ((originalGamification as any).quizzesCompleted || 0) + 1
        }
        this.queryClient.setQueryData(gamificationKey, updatedGamification)
      }

      // Update user stats optimistically
      if (originalStats) {
        const totalQuizzes = ((originalStats as any).totalQuizzesAttempted || 0) + 1
        const totalScore = ((originalStats as any).averageScore || 0) * ((originalStats as any).totalQuizzesAttempted || 0) + score
        const newAverage = totalScore / totalQuizzes

        const updatedStats = {
          ...originalStats,
          totalQuizzesAttempted: totalQuizzes,
          averageScore: newAverage,
          xp_points: ((originalStats as any).xp_points || 0) + xpGained
        }
        this.queryClient.setQueryData(userStatsKey, updatedStats)
      }

      // Perform actual mutation
      const result = await mutationFn()
      
      toast.success(`Quiz completed! Score: ${score}% (+${xpGained} XP)`)
      return result

    } catch (error) {
      // Rollback all changes
      if (originalPerformance) this.queryClient.setQueryData(performanceKey, originalPerformance)
      if (originalGamification) this.queryClient.setQueryData(gamificationKey, originalGamification)
      if (originalStats) this.queryClient.setQueryData(userStatsKey, originalStats)
      
      toast.error('Failed to save quiz results')
      throw error
    }
  }

  // Optimistic badge unlock update
  async unlockBadgeOptimistically(
    userId: string,
    badgeId: string,
    badgeData: any,
    mutationFn: () => Promise<any>
  ) {
    const badgesKey = ['gamification', 'badges', userId]
    const gamificationKey = ['gamification', userId]

    const originalBadges = this.queryClient.getQueryData(badgesKey)
    const originalGamification = this.queryClient.getQueryData(gamificationKey)

    try {
      // Add badge optimistically
      if (originalBadges) {
        const updatedBadges = [
          ...((originalBadges as any[]) || []),
          { ...badgeData, unlockedAt: new Date().toISOString() }
        ]
        this.queryClient.setQueryData(badgesKey, updatedBadges)
      }

      // Update gamification stats
      if (originalGamification) {
        const updatedGamification = {
          ...originalGamification,
          totalBadges: ((originalGamification as any).totalBadges || 0) + 1
        }
        this.queryClient.setQueryData(gamificationKey, updatedGamification)
      }

      // Perform actual mutation
      const result = await mutationFn()
      
      toast.success(`🏆 Badge unlocked: ${badgeData.name}!`, { duration: 5000 })
      return result

    } catch (error) {
      // Rollback changes
      if (originalBadges) this.queryClient.setQueryData(badgesKey, originalBadges)
      if (originalGamification) this.queryClient.setQueryData(gamificationKey, originalGamification)
      
      toast.error('Failed to unlock badge')
      throw error
    }
  }

  // Optimistic streak update
  async updateStreakOptimistically(
    userId: string,
    increment: boolean,
    mutationFn: () => Promise<any>
  ) {
    const userKey = ['users', userId]
    const gamificationKey = ['gamification', userId]

    const originalUser = this.queryClient.getQueryData(userKey)
    const originalGamification = this.queryClient.getQueryData(gamificationKey)

    try {
      // Update streak optimistically
      if (originalUser && increment) {
        const currentStreak = ((originalUser as any).streakCount || 0) + 1
        const updatedUser = {
          ...originalUser,
          streakCount: currentStreak,
          lastQuizDate: new Date().toISOString()
        }
        this.queryClient.setQueryData(userKey, updatedUser)

        // Update gamification streak
        if (originalGamification) {
          const updatedGamification = {
            ...originalGamification,
            currentStreak: currentStreak,
            longestStreak: Math.max(currentStreak, (originalGamification as any).longestStreak || 0)
          }
          this.queryClient.setQueryData(gamificationKey, updatedGamification)
        }
      }

      // Perform actual mutation
      const result = await mutationFn()
      
      if (increment) {
        const newStreak = ((originalUser as any)?.streakCount || 0) + 1
        if (newStreak % 7 === 0) {
          toast.success(`🔥 Amazing! ${newStreak}-day streak!`, { duration: 4000 })
        } else {
          toast.success(`🔥 Streak: ${newStreak} days!`)
        }
      }
      
      return result

    } catch (error) {
      // Rollback changes
      if (originalUser) this.queryClient.setQueryData(userKey, originalUser)
      if (originalGamification) this.queryClient.setQueryData(gamificationKey, originalGamification)
      
      toast.error('Failed to update streak')
      throw error
    }
  }

  // Optimistic list updates (add/remove items)
  async updateListOptimistically<T>(
    queryKey: any[],
    item: T,
    operation: 'add' | 'remove' | 'update',
    mutationFn: () => Promise<any>,
    itemId?: string | number
  ) {
    const originalData = this.queryClient.getQueryData<T[]>(queryKey)

    try {
      if (originalData) {
        let updatedData: T[]

        switch (operation) {
          case 'add':
            updatedData = [...originalData, item]
            break
          case 'remove':
            updatedData = originalData.filter((existingItem: any) => 
              itemId ? existingItem.id !== itemId : existingItem !== item
            )
            break
          case 'update':
            updatedData = originalData.map((existingItem: any) => 
              existingItem.id === itemId ? { ...existingItem, ...item } : existingItem
            )
            break
          default:
            updatedData = originalData
        }

        this.queryClient.setQueryData(queryKey, updatedData)
      }

      // Perform actual mutation
      const result = await mutationFn()
      return result

    } catch (error) {
      // Rollback changes
      if (originalData) {
        this.queryClient.setQueryData(queryKey, originalData)
      }
      throw error
    }
  }
}

// Create singleton instance
let optimisticUpdateManagerInstance: OptimisticUpdateManager | null = null

export function getOptimisticUpdateManager(queryClient: QueryClient): OptimisticUpdateManager {
  if (!optimisticUpdateManagerInstance) {
    optimisticUpdateManagerInstance = new OptimisticUpdateManager(queryClient)
  }
  return optimisticUpdateManagerInstance
}