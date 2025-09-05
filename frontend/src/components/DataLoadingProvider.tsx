'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import { getDataPrefetcher } from '@/lib/dataPrefetching'
import { getCacheManager } from '@/lib/cacheManager'
import { 
  useRoutePrefetching, 
  useBackgroundRefresh, 
  useAdaptiveLoading 
} from '@/hooks/useIntelligentLoading'

interface DataLoadingContextType {
  prefetchForRoute: (route: string, params?: Record<string, string>) => Promise<void>
  connectionQuality: 'fast' | 'slow' | 'offline'
  adaptiveSettings: {
    prefetchEnabled: boolean
    backgroundSyncEnabled: boolean
    imageQuality: 'high' | 'medium' | 'low'
    cacheStrategy: 'aggressive' | 'moderate' | 'minimal'
  }
}

const DataLoadingContext = createContext<DataLoadingContextType | null>(null)

export function useDataLoading() {
  const context = useContext(DataLoadingContext)
  if (!context) {
    throw new Error('useDataLoading must be used within DataLoadingProvider')
  }
  return context
}

interface DataLoadingProviderProps {
  children: ReactNode
}

export function DataLoadingProvider({ children }: DataLoadingProviderProps) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const { user } = useUserStore()
  const { prefetchForRoute } = useRoutePrefetching()
  const { connectionQuality, adaptiveSettings } = useAdaptiveLoading()

  // Initialize background refresh for real-time data
  useBackgroundRefresh()

  // Initialize cache warming on app load
  useEffect(() => {
    const cacheManager = getCacheManager(queryClient)
    
    // Warm essential cache on app load
    cacheManager.warmEssentialCache()

    // Warm post-auth cache when user logs in
    if (user?.id) {
      cacheManager.warmPostAuthCache(user.id)
    }
  }, [queryClient, user?.id])

  // Prefetch data based on current route
  useEffect(() => {
    if (adaptiveSettings.prefetchEnabled && user?.id) {
      const routeParams = extractRouteParams(pathname)
      prefetchForRoute(pathname, routeParams).catch(error => {
        console.warn('Route prefetching failed:', error)
      })
    }
  }, [pathname, user?.id, adaptiveSettings.prefetchEnabled, prefetchForRoute])

  // Predictive prefetching based on user behavior
  useEffect(() => {
    if (!user?.id || !adaptiveSettings.prefetchEnabled) return

    const dataPrefetcher = getDataPrefetcher(queryClient)
    
    // Get user behavior patterns from localStorage or user preferences
    const userBehavior = getUserBehaviorPatterns(user.id)
    
    // Prefetch predictive data
    dataPrefetcher.prefetchPredictiveData(user.id, pathname, userBehavior).catch(error => {
      console.warn('Predictive prefetching failed:', error)
    })
  }, [queryClient, user?.id, pathname, adaptiveSettings.prefetchEnabled])

  // Cache cleanup on route changes
  useEffect(() => {
    const cacheManager = getCacheManager(queryClient)
    
    // Clean up stale cache entries periodically
    const cleanupInterval = setInterval(() => {
      if (adaptiveSettings.cacheStrategy !== 'aggressive') {
        cacheManager.cleanupStaleCache()
      }
    }, 1000 * 60 * 10) // Every 10 minutes

    return () => clearInterval(cleanupInterval)
  }, [queryClient, adaptiveSettings.cacheStrategy])

  const contextValue: DataLoadingContextType = {
    prefetchForRoute,
    connectionQuality,
    adaptiveSettings,
  }

  return (
    <DataLoadingContext.Provider value={contextValue}>
      {children}
    </DataLoadingContext.Provider>
  )
}

// Helper function to extract route parameters
function extractRouteParams(pathname: string): Record<string, string> {
  const params: Record<string, string> = {}
  
  // Extract dynamic route parameters
  const segments = pathname.split('/')
  
  segments.forEach((segment, index) => {
    // Check if segment looks like a dynamic parameter (UUID, number, etc.)
    if (segment.match(/^[a-f0-9-]{36}$/i)) { // UUID pattern
      const prevSegment = segments[index - 1]
      if (prevSegment) {
        params[prevSegment] = segment
      }
    } else if (segment.match(/^\d+$/)) { // Number pattern
      const prevSegment = segments[index - 1]
      if (prevSegment) {
        params[prevSegment] = segment
      }
    }
  })
  
  return params
}

// Helper function to get user behavior patterns
function getUserBehaviorPatterns(userId: string): {
  frequentSubjects?: string[]
  recentTopics?: string[]
  preferredDifficulty?: string
} {
  try {
    const stored = localStorage.getItem(`userBehavior_${userId}`)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Helper function to track user behavior
export function trackUserBehavior(
  userId: string, 
  action: string, 
  data: Record<string, any>
) {
  try {
    const existing = getUserBehaviorPatterns(userId)
    
    switch (action) {
      case 'subject_view':
        const frequentSubjects = existing.frequentSubjects || []
        if (!frequentSubjects.includes(data.subjectId)) {
          frequentSubjects.push(data.subjectId)
          if (frequentSubjects.length > 5) {
            frequentSubjects.shift() // Keep only last 5
          }
        }
        existing.frequentSubjects = frequentSubjects
        break
        
      case 'topic_view':
        const recentTopics = existing.recentTopics || []
        if (!recentTopics.includes(data.topicId)) {
          recentTopics.unshift(data.topicId)
          if (recentTopics.length > 10) {
            recentTopics.pop() // Keep only last 10
          }
        }
        existing.recentTopics = recentTopics
        break
        
      case 'quiz_complete':
        // Track preferred difficulty based on completion patterns
        if (data.difficulty && data.score > 70) {
          existing.preferredDifficulty = data.difficulty
        }
        break
    }
    
    localStorage.setItem(`userBehavior_${userId}`, JSON.stringify(existing))
  } catch (error) {
    console.warn('Failed to track user behavior:', error)
  }
}