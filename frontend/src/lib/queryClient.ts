import { QueryClient, DefaultOptions } from '@tanstack/react-query'

// Cache time configurations for different data types
export const CACHE_TIMES = {
  // Static/rarely changing data
  SUBJECTS: 1000 * 60 * 15, // 15 minutes
  TOPICS: 1000 * 60 * 10, // 10 minutes
  QUESTIONS: 1000 * 60 * 10, // 10 minutes
  
  // User-specific data
  USER_PROFILE: 1000 * 60 * 5, // 5 minutes
  USER_STATS: 1000 * 60 * 2, // 2 minutes
  USER_PREFERENCES: 1000 * 60 * 10, // 10 minutes
  
  // Dynamic/frequently changing data
  QUIZZES: 1000 * 60 * 5, // 5 minutes
  QUIZ_RESULTS: 1000 * 60 * 2, // 2 minutes
  PERFORMANCE_DATA: 1000 * 60 * 2, // 2 minutes
  RECOMMENDATIONS: 1000 * 60 * 3, // 3 minutes
  
  // Real-time data
  GAMIFICATION: 1000 * 60 * 1, // 1 minute
  LEADERBOARD: 1000 * 60 * 2, // 2 minutes
  STREAKS: 1000 * 60 * 1, // 1 minute
  
  // Search results
  SEARCH_RESULTS: 1000 * 60 * 5, // 5 minutes
  
  // Analytics data
  ANALYTICS: 1000 * 60 * 5, // 5 minutes
  TRENDS: 1000 * 60 * 10, // 10 minutes
} as const

// Garbage collection times (when to remove from cache)
export const GC_TIMES = {
  // Keep static data longer
  STATIC: 1000 * 60 * 30, // 30 minutes
  
  // User data moderate retention
  USER_DATA: 1000 * 60 * 15, // 15 minutes
  
  // Dynamic data shorter retention
  DYNAMIC: 1000 * 60 * 10, // 10 minutes
  
  // Real-time data shortest retention
  REALTIME: 1000 * 60 * 5, // 5 minutes
} as const

// Query client default options with intelligent caching
const queryClientOptions: DefaultOptions = {
  queries: {
    // Default stale time - data is considered fresh for this duration
    staleTime: CACHE_TIMES.QUIZZES,
    
    // Default cache time - how long to keep data in cache after component unmounts
    gcTime: GC_TIMES.DYNAMIC,
    
    // Retry configuration - more conservative
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      // Retry only once for other errors to reduce repeated calls
      return failureCount < 1
    },

    // Retry delay - longer delay to prevent rapid retries
    retryDelay: 3000, // Fixed 3 second delay
      // Refetch on window focus for real-time data
    refetchOnWindowFocus: false, // We'll enable this selectively
    
    // Refetch on reconnect
    refetchOnReconnect: false,
    
    // Refetch on mount
    refetchOnMount: false,
    
    // Background refetch interval (disabled by default, enabled selectively)
    refetchInterval: false,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error: any) => {
      if (error?.code === 'NETWORK_ERROR' && failureCount < 1) {
        return true
      }
      return false
    },
    
    // Retry delay for mutations
    retryDelay: 1000,
  },
}

// Create optimized query client
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryClientOptions,
  })
}

// Cache invalidation strategies
export const CACHE_INVALIDATION = {
  // When user data changes, invalidate related caches
  USER_UPDATE: [
    'users',
    'gamification',
    'performance',
    'recommendations',
  ],
  
  // When quiz is completed, invalidate performance and gamification
  QUIZ_COMPLETION: [
    'performance',
    'gamification',
    'recommendations',
    'analytics',
    'leaderboard',
  ],
  
  // When subjects/topics are modified, invalidate related data
  CONTENT_UPDATE: [
    'subjects',
    'topics',
    'quizzes',
    'search',
  ],
  
  // When onboarding is completed, invalidate user-related data
  ONBOARDING_COMPLETE: [
    'users',
    'recommendations',
    'performance',
    'gamification',
  ],
} as const

// Prefetch strategies for predictable user actions
export const PREFETCH_STRATEGIES = {
  // When user views subjects, prefetch popular topics
  SUBJECT_VIEW: {
    prefetchTopics: true,
    prefetchQuizzes: false,
  },
  
  // When user views topic, prefetch related quizzes
  TOPIC_VIEW: {
    prefetchQuizzes: true,
    prefetchRecommendations: true,
  },
  
  // When user starts quiz, prefetch next recommendations
  QUIZ_START: {
    prefetchRecommendations: true,
    prefetchPerformance: true,
  },
  
  // When user completes quiz, prefetch updated stats
  QUIZ_COMPLETE: {
    prefetchPerformance: true,
    prefetchGamification: true,
    prefetchRecommendations: true,
  },
} as const

// Background sync configuration
export const BACKGROUND_SYNC = {
  // Real-time data that should sync in background
  REALTIME_QUERIES: [
    'gamification',
    'leaderboard',
    'streaks',
  ],
  
  // Interval for background sync (in milliseconds)
  SYNC_INTERVAL: 1000 * 60 * 2, // 2 minutes
  
  // Only sync when user is active
  SYNC_ON_FOCUS: true,
} as const

// Query key factories for consistent cache management
export const createQueryKey = {
  // User-related keys
  user: (id: string) => ['users', id] as const,
  currentUser: () => ['users', 'current'] as const,
  userStats: (id: string) => ['users', id, 'stats'] as const,
  
  // Subject-related keys
  subjects: () => ['subjects'] as const,
  subject: (id: string) => ['subjects', id] as const,
  subjectStats: (id: string) => ['subjects', id, 'stats'] as const,
  
  // Topic-related keys
  topics: () => ['topics'] as const,
  topic: (id: string) => ['topics', id] as const,
  topicsBySubject: (subjectId: string) => ['topics', 'subject', subjectId] as const,
  
  // Quiz-related keys
  quizzes: () => ['quizzes'] as const,
  quiz: (id: string) => ['quizzes', id] as const,
  quizzesByTopic: (topicId: string) => ['quizzes', 'topic', topicId] as const,
  personalizedQuiz: (config: any) => ['quizzes', 'personalized', config] as const,
  
  // Performance-related keys
  performance: (userId: string) => ['performance', userId] as const,
  performanceAnalytics: (userId: string) => ['performance', userId, 'analytics'] as const,
  
  // Gamification-related keys
  gamification: (userId: string) => ['gamification', userId] as const,
  leaderboard: (limit: number) => ['gamification', 'leaderboard', limit] as const,
  
  // Search-related keys
  search: (type: string, query: string, filters?: any) => 
    ['search', type, query, filters] as const,
} as const

// Cache warming strategies
export const CACHE_WARMING = {
  // Essential data to prefetch on app load
  ESSENTIAL: [
    'subjects',
    'currentUser',
  ],
  
  // Data to prefetch after user authentication
  POST_AUTH: [
    'userStats',
    'gamification',
    'recommendations',
  ],
  
  // Data to prefetch on dashboard load
  DASHBOARD: [
    'performance',
    'analytics',
    'leaderboard',
  ],
} as const