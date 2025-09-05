'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { EnhancedToast } from '@/lib/errorHandling'

interface LoadingOperation {
  id: string
  message: string
  description?: string
  progress?: number
  stage?: string
  startTime: number
  estimatedDuration?: number
}

interface LoadingContextType {
  operations: Record<string, LoadingOperation>
  startOperation: (id: string, message: string, options?: {
    description?: string
    estimatedDuration?: number
  }) => void
  updateOperation: (id: string, updates: Partial<LoadingOperation>) => void
  completeOperation: (id: string, successMessage?: string) => void
  failOperation: (id: string, errorMessage: string) => void
  isOperationActive: (id: string) => boolean
  getOperation: (id: string) => LoadingOperation | undefined
  hasActiveOperations: boolean
  activeOperationCount: number
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Record<string, LoadingOperation>>({})

  const startOperation = useCallback((
    id: string, 
    message: string, 
    options: {
      description?: string
      estimatedDuration?: number
    } = {}
  ) => {
    const operation: LoadingOperation = {
      id,
      message,
      description: options.description,
      progress: 0,
      startTime: Date.now(),
      estimatedDuration: options.estimatedDuration
    }

    setOperations(prev => ({
      ...prev,
      [id]: operation
    }))

    // Show loading toast
    const toastId = EnhancedToast.loading(message, {
      description: options.description
    })

    // Store toast ID for later updates
    setOperations(prev => ({
      ...prev,
      [id]: { ...prev[id], toastId }
    }))
  }, [])

  const updateOperation = useCallback((id: string, updates: Partial<LoadingOperation>) => {
    setOperations(prev => {
      const existing = prev[id]
      if (!existing) return prev

      const updated = { ...existing, ...updates }

      // Update toast if progress or stage changed
      if (existing.toastId && (updates.progress !== undefined || updates.stage)) {
        EnhancedToast.updateLoading(existing.toastId, updates.stage || existing.message, {
          description: updates.description || existing.description
        })
      }

      return {
        ...prev,
        [id]: updated
      }
    })
  }, [])

  const completeOperation = useCallback((id: string, successMessage?: string) => {
    setOperations(prev => {
      const existing = prev[id]
      if (!existing) return prev

      // Update toast to success
      if (existing.toastId) {
        EnhancedToast.updateLoading(existing.toastId, successMessage || 'Operation completed successfully!', {
          type: 'success'
        })
      }

      // Remove operation after a delay
      setTimeout(() => {
        setOperations(current => {
          const { [id]: removed, ...rest } = current
          return rest
        })
      }, 1000)

      return prev
    })
  }, [])

  const failOperation = useCallback((id: string, errorMessage: string) => {
    setOperations(prev => {
      const existing = prev[id]
      if (!existing) return prev

      // Update toast to error
      if (existing.toastId) {
        EnhancedToast.updateLoading(existing.toastId, errorMessage, {
          type: 'error'
        })
      }

      // Remove operation after a delay
      setTimeout(() => {
        setOperations(current => {
          const { [id]: removed, ...rest } = current
          return rest
        })
      }, 3000)

      return prev
    })
  }, [])

  const isOperationActive = useCallback((id: string) => {
    return id in operations
  }, [operations])

  const getOperation = useCallback((id: string) => {
    return operations[id]
  }, [operations])

  const hasActiveOperations = Object.keys(operations).length > 0
  const activeOperationCount = Object.keys(operations).length

  const value: LoadingContextType = {
    operations,
    startOperation,
    updateOperation,
    completeOperation,
    failOperation,
    isOperationActive,
    getOperation,
    hasActiveOperations,
    activeOperationCount
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Convenience hooks for common operations
export function useOperationLoading() {
  const { startOperation, updateOperation, completeOperation, failOperation } = useLoading()

  const withLoading = useCallback(async <T>(
    operationId: string,
    message: string,
    operation: () => Promise<T>,
    options: {
      description?: string
      successMessage?: string
      stages?: string[]
    } = {}
  ): Promise<T> => {
    try {
      startOperation(operationId, message, {
        description: options.description
      })

      // If stages are provided, simulate progress
      if (options.stages) {
        const stageInterval = 100 / options.stages.length
        for (let i = 0; i < options.stages.length; i++) {
          updateOperation(operationId, {
            stage: options.stages[i],
            progress: (i + 1) * stageInterval
          })
          // Small delay to show stage progression
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      const result = await operation()
      
      completeOperation(operationId, options.successMessage)
      return result
    } catch (error: any) {
      failOperation(operationId, error.message || 'Operation failed')
      throw error
    }
  }, [startOperation, updateOperation, completeOperation, failOperation])

  return { withLoading }
}

// Hook for quiz generation with stages
export function useQuizGenerationLoading() {
  const { withLoading } = useOperationLoading()

  const generateWithLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      type?: 'standard' | 'personalized' | 'assessment'
      topicName?: string
    } = {}
  ): Promise<T> => {
    const { type = 'standard', topicName } = options

    const stages = type === 'personalized' 
      ? [
          'Analyzing your performance history...',
          'Selecting optimal difficulty level...',
          'Choosing personalized questions...',
          'Finalizing your quiz...'
        ]
      : type === 'assessment'
      ? [
          'Preparing assessment questions...',
          'Balancing difficulty levels...',
          'Creating your personalized assessment...'
        ]
      : [
          'Generating quiz questions...',
          'Organizing content...',
          'Preparing your quiz...'
        ]

    const message = type === 'personalized'
      ? `Creating personalized quiz${topicName ? ` for ${topicName}` : ''}...`
      : type === 'assessment'
      ? 'Generating your assessment...'
      : `Generating quiz${topicName ? ` for ${topicName}` : ''}...`

    return withLoading(
      `quiz-generation-${Date.now()}`,
      message,
      operation,
      {
        description: 'This may take a few moments',
        successMessage: type === 'assessment' 
          ? 'Assessment ready! Let\'s begin.' 
          : 'Quiz generated successfully!',
        stages
      }
    )
  }, [withLoading])

  return { generateWithLoading }
}

// Hook for onboarding operations
export function useOnboardingLoading() {
  const { withLoading } = useOperationLoading()

  const completeOnboardingWithLoading = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    return withLoading(
      'onboarding-completion',
      'Completing your onboarding...',
      operation,
      {
        description: 'Setting up your personalized learning experience',
        successMessage: 'Welcome to EduAssist! 🎉',
        stages: [
          'Processing your assessment results...',
          'Creating your learning profile...',
          'Setting up personalized recommendations...',
          'Finalizing your dashboard...'
        ]
      }
    )
  }, [withLoading])

  const submitAssessmentWithLoading = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    return withLoading(
      'assessment-submission',
      'Submitting your assessment...',
      operation,
      {
        description: 'Analyzing your responses',
        successMessage: 'Assessment submitted successfully!',
        stages: [
          'Processing your answers...',
          'Calculating performance metrics...',
          'Generating insights...'
        ]
      }
    )
  }, [withLoading])

  return { 
    completeOnboardingWithLoading,
    submitAssessmentWithLoading
  }
}