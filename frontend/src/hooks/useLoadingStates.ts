import { useState, useEffect } from 'react'
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// Enhanced loading state management
export interface LoadingState {
  isLoading: boolean
  isInitialLoading: boolean
  isRefetching: boolean
  isFetching: boolean
  isError: boolean
  error: any
  progress?: number
  stage?: string
}

// Hook for managing complex loading states with progress
export function useProgressiveLoading(
  stages: string[],
  duration: number = 3000
) {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!isActive) return

    const stageInterval = duration / stages.length
    const progressInterval = 50 // Update progress every 50ms

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / progressInterval))
        if (newProgress >= 100) {
          setIsActive(false)
          return 100
        }
        return newProgress
      })
    }, progressInterval)

    const stageTimer = setInterval(() => {
      setCurrentStage(prev => {
        const nextStage = prev + 1
        if (nextStage >= stages.length) {
          return prev
        }
        return nextStage
      })
    }, stageInterval)

    return () => {
      clearInterval(progressTimer)
      clearInterval(stageTimer)
    }
  }, [isActive, duration, stages.length])

  const start = () => {
    setCurrentStage(0)
    setProgress(0)
    setIsActive(true)
  }

  const stop = () => {
    setIsActive(false)
    setProgress(100)
  }

  const reset = () => {
    setCurrentStage(0)
    setProgress(0)
    setIsActive(false)
  }

  return {
    progress,
    currentStage: stages[currentStage] || stages[0],
    isActive,
    start,
    stop,
    reset
  }
}

// Hook for enhanced React Query loading states
export function useEnhancedQuery<T>(
  queryResult: UseQueryResult<T, any>
): LoadingState {
  const {
    isLoading,
    isFetching,
    isRefetching,
    isError,
    error,
    isInitialLoading
  } = queryResult

  return {
    isLoading,
    isInitialLoading,
    isRefetching,
    isFetching,
    isError,
    error
  }
}

// Hook for enhanced mutation loading states
export function useEnhancedMutation<T, V>(
  mutationResult: UseMutationResult<T, any, V, any>
): LoadingState & {
  isSuccess: boolean
  isIdle: boolean
} {
  const {
    isPending,
    isError,
    error,
    isSuccess,
    isIdle
  } = mutationResult

  return {
    isLoading: isPending,
    isInitialLoading: isPending,
    isRefetching: false,
    isFetching: isPending,
    isError,
    error,
    isSuccess,
    isIdle
  }
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates(
  states: Record<string, boolean>
): {
  isAnyLoading: boolean
  isAllLoading: boolean
  loadingStates: Record<string, boolean>
  loadingCount: number
  completedCount: number
  progress: number
} {
  const loadingStates = states
  const loadingEntries = Object.entries(loadingStates)
  const loadingCount = loadingEntries.filter(([, isLoading]) => isLoading).length
  const totalCount = loadingEntries.length
  const completedCount = totalCount - loadingCount

  return {
    isAnyLoading: loadingCount > 0,
    isAllLoading: loadingCount === totalCount,
    loadingStates,
    loadingCount,
    completedCount,
    progress: totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  }
}

// Hook for debounced loading states (prevents flickering)
export function useDebouncedLoading(
  isLoading: boolean,
  delay: number = 200
): boolean {
  const [debouncedLoading, setDebouncedLoading] = useState(isLoading)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLoading(isLoading)
    }, delay)

    return () => clearTimeout(timer)
  }, [isLoading, delay])

  return debouncedLoading
}

// Hook for minimum loading duration (ensures loading state is visible)
export function useMinimumLoading(
  isLoading: boolean,
  minimumDuration: number = 500
): boolean {
  const [showLoading, setShowLoading] = useState(isLoading)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now())
      setShowLoading(true)
    } else if (!isLoading && startTime) {
      const elapsed = Date.now() - startTime
      const remaining = minimumDuration - elapsed

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false)
          setStartTime(null)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setShowLoading(false)
        setStartTime(null)
      }
    }
  }, [isLoading, startTime, minimumDuration])

  return showLoading
}

// Hook for sequential loading states
export function useSequentialLoading(
  steps: Array<{
    key: string
    label: string
    duration?: number
  }>
) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const start = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setIsActive(true)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, steps[currentStep].key])
      setCurrentStep(prev => prev + 1)
    } else {
      complete()
    }
  }

  const complete = () => {
    setCompletedSteps(steps.map(step => step.key))
    setIsActive(false)
  }

  const reset = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setIsActive(false)
  }

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return {
    currentStep: currentStepData,
    currentStepIndex: currentStep,
    completedSteps,
    progress,
    isActive,
    isComplete: completedSteps.length === steps.length,
    start,
    nextStep,
    complete,
    reset
  }
}

// Hook for smart loading states based on data freshness
export function useSmartLoading<T>(
  queryResult: UseQueryResult<T, any>,
  options: {
    showSkeletonOnInitial?: boolean
    showSkeletonOnRefetch?: boolean
    minimumLoadingTime?: number
  } = {}
) {
  const {
    showSkeletonOnInitial = true,
    showSkeletonOnRefetch = false,
    minimumLoadingTime = 300
  } = options

  const {
    isLoading,
    isInitialLoading,
    isRefetching,
    isFetching,
    data,
    error
  } = queryResult

  const shouldShowSkeleton = 
    (isInitialLoading && showSkeletonOnInitial) ||
    (isRefetching && showSkeletonOnRefetch && !data)

  const shouldShowSpinner = 
    isFetching && !shouldShowSkeleton && data

  const debouncedSkeleton = useDebouncedLoading(shouldShowSkeleton, 100)
  const minimumSkeleton = useMinimumLoading(debouncedSkeleton, minimumLoadingTime)

  return {
    showSkeleton: minimumSkeleton,
    showSpinner: shouldShowSpinner,
    showContent: !minimumSkeleton && !error,
    hasData: !!data,
    isError: !!error,
    error
  }
}

// Hook for coordinated loading across multiple queries
export function useCoordinatedLoading(
  queries: Record<string, UseQueryResult<any, any>>,
  options: {
    waitForAll?: boolean
    showProgressBar?: boolean
  } = {}
) {
  const { waitForAll = false, showProgressBar = false } = options

  const queryStates = Object.entries(queries).map(([key, query]) => ({
    key,
    isLoading: query.isLoading,
    isError: query.isError,
    hasData: !!query.data,
    error: query.error
  }))

  const loadingQueries = queryStates.filter(q => q.isLoading)
  const errorQueries = queryStates.filter(q => q.isError)
  const completedQueries = queryStates.filter(q => q.hasData && !q.isLoading)

  const isAnyLoading = loadingQueries.length > 0
  const isAllLoading = loadingQueries.length === queryStates.length
  const hasAnyError = errorQueries.length > 0
  const isComplete = completedQueries.length === queryStates.length

  const progress = (completedQueries.length / queryStates.length) * 100

  const shouldShowLoading = waitForAll ? isAnyLoading : isAllLoading

  return {
    isLoading: shouldShowLoading,
    isComplete,
    hasError: hasAnyError,
    progress: showProgressBar ? progress : undefined,
    loadingQueries: loadingQueries.map(q => q.key),
    errorQueries: errorQueries.map(q => ({ key: q.key, error: q.error })),
    completedQueries: completedQueries.map(q => q.key),
    queryStates
  }
}