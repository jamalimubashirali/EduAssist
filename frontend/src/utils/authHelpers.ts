import { toast } from 'sonner'

/**
 * Standard error handler for authentication operations
 * @param error - The error object
 * @param context - Context where the error occurred
 * @returns The original error for rethrowing
 */
export function handleAuthError(error: any, context: string): Error {
  console.error(`Auth error in ${context}:`, error)
  
  // Extract meaningful error message
  let message = 'An unexpected error occurred'
  
  if (error?.message) {
    message = error.message
  } else if (error?.response?.data?.message) {
    message = error.response.data.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  // Show user-friendly toast
  toast.error(`${context} failed: ${message}`)
  
  return error
}

/**
 * Log and handle non-critical errors without showing toast
 * @param error - The error object
 * @param context - Context where the error occurred
 */
export function logAuthError(error: any, context: string): void {
  console.error(`Auth warning in ${context}:`, error)
}

/**
 * Create a standardized auth error object
 * @param message - Error message
 * @param code - Optional error code
 * @returns Standardized error object
 */
export function createAuthError(message: string, code?: string): Error {
  const error = new Error(message)
  if (code) {
    (error as any).code = code
  }
  return error
}
