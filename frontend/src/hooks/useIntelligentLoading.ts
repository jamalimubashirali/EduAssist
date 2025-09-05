import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useCallback } from 'react'
import { getDataPrefetcher } from '@/lib/dataPrefetching'
import { useUserStore } from '@/stores/useUserStore'

// Hook for route-based data prefetching
export function useRoutePrefetching() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user } = useUserStore()
  
  const dataPrefetcher = useMemo(() => {
    return getDataPrefetcher(queryClient)
  }, [queryClient])

  const prefetchForRoute = useCallback(async (
    route: string, 
    params?: Record<string, string>
  ) => {
    if (user?.id) {
      await dataPrefetcher.prefetchForRoute(route, user.id, params)
    }
  }, [dataPrefetcher, user?.id])

  return { prefetchForRoute }
}

// Hook for predictive data loading based on user behavior
export function usePredictiveLoading() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  
  const dataPrefetcher = useMemo(() => {
    return getDataPrefetcher(queryClient)
  }, [queryClient])

  const prefetchPredictive = useCallback(async (
    currentRoute: string,
    userBehavior: {
      frequentSubjects?: string[]
      recentTopics?: string[]
      preferredDifficulty?: string
    }
  ) => {
    if (user?.id) {
      await dataPrefetcher.prefetchPredictiveData(user.id, currentRoute, userBehavior)
    }
  }, [dataPrefetcher, user?.id])

  return { prefetchPredictive }
}

// Hook for background data refresh
export function useBackgroundRefresh() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  
  const dataPrefetcher = useMemo(() => {
    return getDataPrefetcher(queryClient)
  }, [queryClient])

  useEffect(() => {
    if (user?.id) {
      const cleanup = dataPrefetcher.startBackgroundRefresh(user.id)
      return cleanup
    }
  }, [dataPrefetcher, user?.id])
}

// Hook for optimistic navigation with data prefetching
export function useOptimisticNavigation() {
  const { prefetchForRoute } = useRoutePrefetching()
  const router = useRouter()

  const navigateWithPrefetch = useCallback(async (
    route: string,
    params?: Record<string, string>
  ) => {
    // Start prefetching data for the target route
    const prefetchPromise = prefetchForRoute(route, params)
    
    // Navigate immediately (don't wait for prefetch)
    router.push(route)
    
    // Let prefetch complete in background
    await prefetchPromise
  }, [prefetchForRoute, router])

  return { navigateWithPrefetch }
}

// Hook for intelligent pagination with prefetching
export function useIntelligentPagination<T>(
  data: T[] | undefined,
  pageSize: number = 10,
  prefetchNext: boolean = true
) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const paginatedData = useMemo(() => {
    if (!data) return []
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, pageSize])

  const totalPages = useMemo(() => {
    if (!data) return 0
    return Math.ceil(data.length / pageSize)
  }, [data, pageSize])

  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPrevPage])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // Prefetch next page data if enabled
  useEffect(() => {
    if (prefetchNext && hasNextPage && currentPage === totalPages - 1) {
      // This would trigger prefetching of next batch of data
      // Implementation depends on the specific data source
    }
  }, [prefetchNext, hasNextPage, currentPage, totalPages])

  return {
    currentPage,
    paginatedData,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    pageInfo: {
      currentPage,
      totalPages,
      pageSize,
      totalItems: data?.length || 0,
      startIndex: (currentPage - 1) * pageSize + 1,
      endIndex: Math.min(currentPage * pageSize, data?.length || 0),
    }
  }
}

// Hook for infinite loading with intelligent prefetching
export function useInfiniteLoading<T>(
  fetchMore: (offset: number, limit: number) => Promise<T[]>,
  initialLimit: number = 20,
  prefetchThreshold: number = 5
) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const newData = await fetchMore(data.length, initialLimit)
      
      if (newData.length === 0) {
        setHasMore(false)
      } else {
        setData(prev => [...prev, ...newData])
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchMore, data.length, initialLimit, isLoading, hasMore])

  // Auto-load more when approaching end
  const shouldLoadMore = useCallback((visibleIndex: number) => {
    return (
      hasMore && 
      !isLoading && 
      visibleIndex >= data.length - prefetchThreshold
    )
  }, [hasMore, isLoading, data.length, prefetchThreshold])

  const reset = useCallback(() => {
    setData([])
    setHasMore(true)
    setError(null)
  }, [])

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    shouldLoadMore,
    reset,
  }
}

// Hook for smart data synchronization
export function useSmartSync<T>(
  queryKey: any[],
  syncInterval: number = 30000, // 30 seconds
  syncOnFocus: boolean = true,
  syncOnReconnect: boolean = true
) {
  const queryClient = useQueryClient()
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const sync = useCallback(async () => {
    if (isSyncing) return

    setIsSyncing(true)
    try {
      await queryClient.invalidateQueries({ 
        queryKey,
        refetchType: 'active'
      })
      setLastSync(new Date())
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [queryClient, queryKey, isSyncing])

  // Periodic sync
  useEffect(() => {
    const interval = setInterval(sync, syncInterval)
    return () => clearInterval(interval)
  }, [sync, syncInterval])

  // Sync on window focus
  useEffect(() => {
    if (!syncOnFocus) return

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        sync()
      }
    }

    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [sync, syncOnFocus])

  // Sync on network reconnect
  useEffect(() => {
    if (!syncOnReconnect) return

    const handleOnline = () => sync()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [sync, syncOnReconnect])

  return {
    lastSync,
    isSyncing,
    sync,
  }
}

// Hook for adaptive loading based on connection quality
export function useAdaptiveLoading() {
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'offline'>('fast')
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    prefetchEnabled: true,
    backgroundSyncEnabled: true,
    imageQuality: 'high' as 'high' | 'medium' | 'low',
    cacheStrategy: 'aggressive' as 'aggressive' | 'moderate' | 'minimal',
  })

  // Monitor connection quality
  useEffect(() => {
    const updateConnectionQuality = () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline')
        return
      }

      // Use Network Information API if available
      const connection = (navigator as any).connection
      if (connection) {
        const { effectiveType, downlink } = connection
        
        if (effectiveType === '4g' && downlink > 2) {
          setConnectionQuality('fast')
        } else if (effectiveType === '3g' || downlink > 0.5) {
          setConnectionQuality('slow')
        } else {
          setConnectionQuality('slow')
        }
      }
    }

    updateConnectionQuality()

    window.addEventListener('online', updateConnectionQuality)
    window.addEventListener('offline', updateConnectionQuality)

    // Listen to connection changes if supported
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateConnectionQuality)
    }

    return () => {
      window.removeEventListener('online', updateConnectionQuality)
      window.removeEventListener('offline', updateConnectionQuality)
      if (connection) {
        connection.removeEventListener('change', updateConnectionQuality)
      }
    }
  }, [])

  // Adapt settings based on connection quality
  useEffect(() => {
    switch (connectionQuality) {
      case 'fast':
        setAdaptiveSettings({
          prefetchEnabled: true,
          backgroundSyncEnabled: true,
          imageQuality: 'high',
          cacheStrategy: 'aggressive',
        })
        break
      case 'slow':
        setAdaptiveSettings({
          prefetchEnabled: false,
          backgroundSyncEnabled: false,
          imageQuality: 'medium',
          cacheStrategy: 'moderate',
        })
        break
      case 'offline':
        setAdaptiveSettings({
          prefetchEnabled: false,
          backgroundSyncEnabled: false,
          imageQuality: 'low',
          cacheStrategy: 'minimal',
        })
        break
    }
  }, [connectionQuality])

  return {
    connectionQuality,
    adaptiveSettings,
  }
}

// Import useState
import { useState } from 'react'