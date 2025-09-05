import { toast } from 'sonner'
import { AxiosError } from 'axios'

// Enhanced error types for better categorization
export interface ServiceError {
  message: string
  code?: string
  statusCode?: number
  context?: string
  retryable?: boolean
  suggestions?: string[]
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
}

// Service-specific error handlers
export class ServiceErrorHandler {
  // Topic service specific errors
  static handleTopicError(error: any, context: string): ServiceError {
    const baseError = this.parseError(error)
    
    switch (baseError.statusCode) {
      case 404:
        return {
          ...baseError,
          message: context.includes('search') 
            ? 'No topics found matching your search criteria'
            : 'Topic not found. It may have been deleted or moved.',
          context: `Topic ${context}`,
          retryable: false,
          suggestions: [
            'Try searching with different keywords',
            'Browse all topics in the subject',
            'Contact support if this topic should exist'
          ]
        }
      case 400:
        return {
          ...baseError,
          message: 'Invalid topic data provided',
          context: `Topic ${context}`,
          retryable: false,
          suggestions: [
            'Check that all required fields are filled',
            'Ensure topic name is unique within the subject',
            'Verify subject selection is valid'
          ]
        }
      case 409:
        return {
          ...baseError,
          message: 'A topic with this name already exists in the selected subject',
          context: `Topic ${context}`,
          retryable: false,
          suggestions: [
            'Choose a different topic name',
            'Check if the topic already exists',
            'Consider updating the existing topic instead'
          ]
        }
      case 500:
        return {
          ...baseError,
          message: 'Server error while processing topic request',
          context: `Topic ${context}`,
          retryable: true,
          suggestions: [
            'Try again in a few moments',
            'Check your internet connection',
            'Contact support if the problem persists'
          ]
        }
      default:
        return {
          ...baseError,
          message: baseError.message || 'An unexpected error occurred with topic operation',
          context: `Topic ${context}`,
          retryable: true,
          suggestions: [
            'Try the operation again',
            'Refresh the page and retry',
            'Contact support if the issue continues'
          ]
        }
    }
  }

  // Quiz service specific errors
  static handleQuizError(error: any, context: string): ServiceError {
    const baseError = this.parseError(error)
    
    switch (baseError.statusCode) {
      case 404:
        return {
          ...baseError,
          message: context.includes('generate') 
            ? 'No questions available for quiz generation with the selected criteria'
            : 'Quiz not found or no longer available',
          context: `Quiz ${context}`,
          retryable: false,
          suggestions: [
            'Try different difficulty settings',
            'Select a different topic or subject',
            'Check if questions exist for this topic'
          ]
        }
      case 400:
        return {
          ...baseError,
          message: context.includes('generate')
            ? 'Invalid quiz generation parameters'
            : 'Invalid quiz data provided',
          context: `Quiz ${context}`,
          retryable: false,
          suggestions: [
            'Check question count is reasonable (5-50)',
            'Verify topic and subject selections',
            'Ensure difficulty level is valid'
          ]
        }
      case 429:
        return {
          ...baseError,
          message: 'Too many quiz generation requests. Please wait before trying again.',
          context: `Quiz ${context}`,
          retryable: true,
          suggestions: [
            'Wait a few minutes before generating another quiz',
            'Try using existing quizzes while waiting',
            'Consider practicing with different topics'
          ]
        }
      case 503:
        return {
          ...baseError,
          message: 'Quiz generation service is temporarily unavailable',
          context: `Quiz ${context}`,
          retryable: true,
          suggestions: [
            'Try again in a few minutes',
            'Use pre-generated quizzes in the meantime',
            'Check system status page for updates'
          ]
        }
      default:
        return {
          ...baseError,
          message: baseError.message || 'An unexpected error occurred with quiz operation',
          context: `Quiz ${context}`,
          retryable: true,
          suggestions: [
            'Try the operation again',
            'Check your internet connection',
            'Contact support if the issue persists'
          ]
        }
    }
  }

  // User service specific errors
  static handleUserError(error: any, context: string): ServiceError {
    const baseError = this.parseError(error)
    
    switch (baseError.statusCode) {
      case 401:
        return {
          ...baseError,
          message: 'Your session has expired. Please log in again.',
          context: `User ${context}`,
          retryable: false,
          suggestions: [
            'Log in again to continue',
            'Check if your account is still active',
            'Clear browser cache and cookies if needed'
          ]
        }
      case 403:
        return {
          ...baseError,
          message: 'You don\'t have permission to perform this action',
          context: `User ${context}`,
          retryable: false,
          suggestions: [
            'Contact an administrator for access',
            'Check if your account has the required permissions',
            'Try logging out and back in'
          ]
        }
      case 409:
        return {
          ...baseError,
          message: context.includes('email') 
            ? 'An account with this email already exists'
            : 'User data conflict detected',
          context: `User ${context}`,
          retryable: false,
          suggestions: [
            'Try logging in instead of creating a new account',
            'Use a different email address',
            'Contact support if you forgot your password'
          ]
        }
      default:
        return {
          ...baseError,
          message: baseError.message || 'An unexpected error occurred with user operation',
          context: `User ${context}`,
          retryable: true,
          suggestions: [
            'Try the operation again',
            'Check your internet connection',
            'Contact support if the issue persists'
          ]
        }
    }
  }

  // Assessment and onboarding specific errors
  static handleAssessmentError(error: any, context: string): ServiceError {
    const baseError = this.parseError(error)
    
    switch (baseError.statusCode) {
      case 400:
        return {
          ...baseError,
          message: context.includes('generate')
            ? 'Unable to generate assessment with selected subjects'
            : 'Invalid assessment data provided',
          context: `Assessment ${context}`,
          retryable: false,
          suggestions: [
            'Select at least one subject for assessment',
            'Ensure all required fields are completed',
            'Try selecting different subjects if none are available'
          ]
        }
      case 422:
        return {
          ...baseError,
          message: 'Assessment answers are incomplete or invalid',
          context: `Assessment ${context}`,
          retryable: false,
          suggestions: [
            'Answer all questions before submitting',
            'Check that all answers are properly selected',
            'Ensure assessment wasn\'t already submitted'
          ]
        }
      case 409:
        return {
          ...baseError,
          message: 'Assessment has already been completed',
          context: `Assessment ${context}`,
          retryable: false,
          suggestions: [
            'Continue to your personalized dashboard',
            'Contact support if you need to retake the assessment',
            'Check your onboarding progress'
          ]
        }
      default:
        return {
          ...baseError,
          message: baseError.message || 'An unexpected error occurred during assessment',
          context: `Assessment ${context}`,
          retryable: true,
          suggestions: [
            'Save your progress and try again',
            'Check your internet connection',
            'Contact support if the issue persists'
          ]
        }
    }
  }

  // Performance and recommendation errors
  static handlePerformanceError(error: any, context: string): ServiceError {
    const baseError = this.parseError(error)
    
    switch (baseError.statusCode) {
      case 404:
        return {
          ...baseError,
          message: 'No performance data found for this user or topic',
          context: `Performance ${context}`,
          retryable: false,
          suggestions: [
            'Complete some quizzes to generate performance data',
            'Check if the topic or subject exists',
            'Try viewing overall performance instead'
          ]
        }
      case 503:
        return {
          ...baseError,
          message: 'Performance analytics service is temporarily unavailable',
          context: `Performance ${context}`,
          retryable: true,
          suggestions: [
            'Try again in a few minutes',
            'Check basic performance stats in your profile',
            'Contact support if the issue persists'
          ]
        }
      default:
        return {
          ...baseError,
          message: baseError.message || 'An unexpected error occurred with performance data',
          context: `Performance ${context}`,
          retryable: true,
          suggestions: [
            'Refresh the page and try again',
            'Check your internet connection',
            'Contact support if the issue continues'
          ]
        }
    }
  }

  // Generic error parser
  private static parseError(error: any): ServiceError {
    if (error?.response) {
      // Axios error with response
      const axiosError = error as AxiosError<any>
      return {
        message: axiosError.response?.data?.message || axiosError.message,
        code: axiosError.code,
        statusCode: axiosError.response?.status,
        retryable: (axiosError.response?.status ?? 0) >= 500
      }
    } else if (error?.message) {
      // Regular error object
      return {
        message: error.message,
        code: error.code,
        retryable: true
      }
    } else if (typeof error === 'string') {
      // String error
      return {
        message: error,
        retryable: true
      }
    } else {
      // Unknown error
      return {
        message: 'An unexpected error occurred',
        retryable: true
      }
    }
  }
}

// Enhanced toast notifications with retry options
export class EnhancedToast {
  static error(serviceError: ServiceError, onRetry?: () => void): void {
    const description = serviceError.suggestions?.slice(0, 2).join(' • ')
    
    toast.error(serviceError.message, {
      description,
      duration: serviceError.retryable ? 8000 : 6000,
      action: serviceError.retryable && onRetry ? {
        label: 'Retry',
        onClick: onRetry
      } : undefined
    })
  }

  static warning(message: string, options?: {
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }): void {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action
    })
  }

  static success(message: string, options?: {
    description?: string
    duration?: number
  }): void {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000
    })
  }

  static info(message: string, options?: {
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }): void {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
    })
  }

  // Loading toast for long operations
  static loading(message: string, options?: {
    description?: string
  }): string | number {
    return toast.loading(message, {
      description: options?.description
    })
  }

  // Update loading toast
  static updateLoading(toastId: string | number, message: string, options?: {
    description?: string
    type?: 'success' | 'error' | 'info'
  }): void {
    if (options?.type === 'success') {
      toast.success(message, {
        id: toastId,
        description: options?.description
      })
    } else if (options?.type === 'error') {
      toast.error(message, {
        id: toastId,
        description: options?.description
      })
    } else {
      toast.info(message, {
        id: toastId,
        description: options?.description
      })
    }
  }

  static dismiss(toastId?: string | number): void {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }
}

// Retry mechanism utility
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true
    } = options

    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }

        // Calculate delay with optional exponential backoff
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  static isRetryableError(error: any): boolean {
    if (error?.response?.status) {
      const status = error.response.status
      // Retry on server errors and rate limiting
      return status >= 500 || status === 429 || status === 408
    }
    
    // Retry on network errors
    return !error?.response || error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR'
  }
}

// Alternative action suggestions
export class ActionSuggestions {
  static getTopicAlternatives(context: string, error: ServiceError): Array<{
    label: string
    action: () => void
    description: string
  }> {
    const alternatives = []

    if (context.includes('search') && error.statusCode === 404) {
      alternatives.push({
        label: 'Browse All Topics',
        action: () => window.location.href = '/topics',
        description: 'View all available topics'
      })
    }

    if (context.includes('create') && error.statusCode === 409) {
      alternatives.push({
        label: 'View Existing Topics',
        action: () => window.location.href = '/topics',
        description: 'See topics that already exist'
      })
    }

    if (error.retryable) {
      alternatives.push({
        label: 'Try Different Subject',
        action: () => window.location.href = '/subjects',
        description: 'Explore topics in other subjects'
      })
    }

    return alternatives
  }

  static getQuizAlternatives(context: string, error: ServiceError): Array<{
    label: string
    action: () => void
    description: string
  }> {
    const alternatives = []

    if (context.includes('generate') && error.statusCode === 404) {
      alternatives.push({
        label: 'Try Different Topic',
        action: () => window.location.href = '/topics',
        description: 'Find topics with available questions'
      })
      
      alternatives.push({
        label: 'Browse Existing Quizzes',
        action: () => window.location.href = '/quizzes',
        description: 'Take pre-made quizzes'
      })
    }

    if (error.statusCode === 429) {
      alternatives.push({
        label: 'Practice Mode',
        action: () => window.location.href = '/practice',
        description: 'Use practice questions while waiting'
      })
    }

    return alternatives
  }

  static getAssessmentAlternatives(context: string, error: ServiceError): Array<{
    label: string
    action: () => void
    description: string
  }> {
    const alternatives = []

    if (context.includes('generate') && error.statusCode === 400) {
      alternatives.push({
        label: 'Select Different Subjects',
        action: () => window.location.href = '/onboarding/subjects',
        description: 'Choose subjects with available questions'
      })
    }

    if (error.statusCode === 409) {
      alternatives.push({
        label: 'Go to Dashboard',
        action: () => window.location.href = '/dashboard',
        description: 'View your personalized learning experience'
      })
    }

    return alternatives
  }
}