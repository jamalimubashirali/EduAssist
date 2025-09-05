import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getOptimisticUpdateManager, OptimisticUpdateManager } from '@/lib/optimisticUpdates'

export function useOptimisticUpdates(): OptimisticUpdateManager {
  const queryClient = useQueryClient()
  
  return useMemo(() => {
    return getOptimisticUpdateManager(queryClient)
  }, [queryClient])
}

// Specific hooks for common optimistic update patterns

export function useOptimisticXPUpdate() {
  const optimisticManager = useOptimisticUpdates()
  
  return (userId: string, xpGained: number, mutationFn: () => Promise<any>) => {
    return optimisticManager.updateXPOptimistically(userId, xpGained, mutationFn)
  }
}

export function useOptimisticQuizCompletion() {
  const optimisticManager = useOptimisticUpdates()
  
  return (
    userId: string,
    quizId: string,
    score: number,
    xpGained: number,
    mutationFn: () => Promise<any>
  ) => {
    return optimisticManager.completeQuizOptimistically(
      userId,
      quizId,
      score,
      xpGained,
      mutationFn
    )
  }
}

export function useOptimisticBadgeUnlock() {
  const optimisticManager = useOptimisticUpdates()
  
  return (
    userId: string,
    badgeId: string,
    badgeData: any,
    mutationFn: () => Promise<any>
  ) => {
    return optimisticManager.unlockBadgeOptimistically(
      userId,
      badgeId,
      badgeData,
      mutationFn
    )
  }
}

export function useOptimisticStreakUpdate() {
  const optimisticManager = useOptimisticUpdates()
  
  return (userId: string, increment: boolean, mutationFn: () => Promise<any>) => {
    return optimisticManager.updateStreakOptimistically(userId, increment, mutationFn)
  }
}

export function useOptimisticListUpdate<T>() {
  const optimisticManager = useOptimisticUpdates()
  
  return (
    queryKey: any[],
    item: T,
    operation: 'add' | 'remove' | 'update',
    mutationFn: () => Promise<any>,
    itemId?: string | number
  ) => {
    return optimisticManager.updateListOptimistically(
      queryKey,
      item,
      operation,
      mutationFn,
      itemId
    )
  }
}