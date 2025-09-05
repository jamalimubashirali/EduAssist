'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import { useState } from 'react'
import { createOptimizedQueryClient } from '@/lib/queryClient'
import { DataLoadingProvider } from '@/components/DataLoadingProvider'

function AppThemeProvider({ children, ...props }: ThemeProviderProps & { children: React.ReactNode }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}



export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createOptimizedQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DataLoadingProvider>
        <AppThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </AppThemeProvider>
      </DataLoadingProvider>
    </QueryClientProvider>
  )
}
