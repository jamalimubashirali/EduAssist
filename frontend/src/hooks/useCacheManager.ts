import { useQueryClient } from '@tanstack/react-query'
import { CacheManager, getCacheManager } from '@/lib/cacheManager'
import { useMemo } from 'react'

export function useCacheManager(): CacheManager {
  const queryClient = useQueryClient()
  
  return useMemo(() => {
    return getCacheManager(queryClient)
  }, [queryClient])
}

// Hook for prefetching data based on user actions
export function usePrefetchStrategies() {
  const cacheManager = useCacheManager()

  return {
    prefetchOnSubjectView: (subjectId: string) => 
      cacheManager.prefetchOnSubjectView(subjectId),
    
    prefetchOnTopicView: (topicId: string, userId?: string) => 
      cacheManager.prefetchOnTopicView(topicId, userId),
    
    prefetchOnQuizStart: (userId: string, topicId: string) => 
      cacheManager.prefetchOnQuizStart(userId, topicId),
    
    prefetchOnQuizComplete: (userId: string, topicId: string) => 
      cacheManager.prefetchOnQuizComplete(userId, topicId),
  }
}

// Hook for cache warming strategies
export function useCacheWarming() {
  const cacheManager = useCacheManager()

  return {
    warmEssentialCache: () => cacheManager.warmEssentialCache(),
    warmPostAuthCache: (userId: string) => cacheManager.warmPostAuthCache(userId),
    warmDashboardCache: (userId: string) => cacheManager.warmDashboardCache(userId),
  }
}

// Hook for optimistic updates
export function useOptimisticUpdates() {
  const cacheManager = useCacheManager()

  return {
    optimisticUpdateUser: (userId: string, updateData: any) => 
      cacheManager.optimisticUpdateUser(userId, updateData),
    
    optimisticUpdateXP: (userId: string, xpGained: number) => 
      cacheManager.optimisticUpdateXP(userId, xpGained),
  }
}

// Hook for intelligent cache invalidation
export function useCacheInvalidation() {
  const cacheManager = useCacheManager()

  return {
    invalidateOnUserUpdate: (userId: string) => 
      cacheManager.invalidateOnUserUpdate(userId),
    
    invalidateOnQuizCompletion: (userId: string, topicId?: string, subjectId?: string) => 
      cacheManager.invalidateOnQuizCompletion(userId, topicId, subjectId),
    
    invalidateOnContentUpdate: (type: 'subject' | 'topic' | 'quiz', id?: string) => 
      cacheManager.invalidateOnContentUpdate(type, id),
    
    invalidateOnOnboardingComplete: (userId: string) => 
      cacheManager.invalidateOnOnboardingComplete(userId),
  }
}