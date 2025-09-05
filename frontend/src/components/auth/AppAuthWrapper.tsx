/**
 * App Auth Wrapper
 * 
 * This component wraps the entire app and handles:
 * 1. Initial authentication check
 * 2. Automatic token refresh
 * 3. Route-based redirections
 * 4. Loading states during auth initialization
 */

'use client'

import { useAuthInitialization } from '@/hooks/useAuthInitialization'
import { Toaster } from 'sonner'

interface AppAuthWrapperProps {
  children: React.ReactNode
}

export default function AppAuthWrapper({ children }: AppAuthWrapperProps) {
  const { isLoading, isInitialized } = useAuthInitialization()

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
