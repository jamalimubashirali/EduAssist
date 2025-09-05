import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'

// Query keys
export const userPreferencesKeys = {
  all: ['user-preferences'] as const,
  validation: (userId: string) => [...userPreferencesKeys.all, 'validation', userId] as const,
  initialization: (userId: string) => [...userPreferencesKeys.all, 'initialization', userId] as const,
}

// Validate user preferences and goals
export function useUserPreferencesValidation(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: userPreferencesKeys.validation(targetUserId || ''),
    queryFn: () => userService.validateUserPreferences(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Update user preferences
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient()
  const { user, setUser } = useUserStore()

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: string[] }) =>
      userService.updateUserPreferences(userId, preferences),
    onSuccess: (updatedUser, { userId }) => {
      // Update user store
      setUser(updatedUser)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: userPreferencesKeys.validation(userId) 
      })
      
      toast.success('Preferences updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences')
    },
  })
}

// Update user goals
export function useUpdateUserGoals() {
  const queryClient = useQueryClient()
  const { user, setUser } = useUserStore()

  return useMutation({
    mutationFn: ({ userId, goals }: { userId: string; goals: string[] }) =>
      userService.updateUserGoals(userId, goals),
    onSuccess: (updatedUser, { userId }) => {
      // Update user store
      setUser(updatedUser)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: userPreferencesKeys.validation(userId) 
      })
      
      toast.success('Goals updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update goals')
    },
  })
}

// Sync onboarding data to profile
export function useSyncOnboardingToProfile() {
  const queryClient = useQueryClient()
  const { user, setUser } = useUserStore()

  return useMutation({
    mutationFn: (userId: string) => userService.syncOnboardingToProfile(userId),
    onSuccess: (updatedUser, userId) => {
      // Update user store
      setUser(updatedUser)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: userPreferencesKeys.validation(userId) 
      })
      
      toast.success('Profile synchronized with onboarding data!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync onboarding data')
    },
  })
}

// Initialize post-onboarding experience
export function useInitializePostOnboardingExperience() {
  const queryClient = useQueryClient()
  const { user, setUser } = useUserStore()

  return useMutation({
    mutationFn: (userId: string) => userService.initializePostOnboardingExperience(userId),
    onSuccess: (result, userId) => {
      // Update user store
      setUser(result.user)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: userPreferencesKeys.validation(userId) 
      })
      
      // Also invalidate recommendation queries since they depend on preferences
      queryClient.invalidateQueries({ 
        queryKey: ['recommendations', 'user', userId] 
      })
      
      toast.success('Post-onboarding experience initialized!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initialize post-onboarding experience')
    },
  })
}

// Combined hook for post-onboarding validation and actions
export function usePostOnboardingValidation(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  const { data: validation, isLoading: validationLoading } = useUserPreferencesValidation(targetUserId)
  const updatePreferences = useUpdateUserPreferences()
  const updateGoals = useUpdateUserGoals()
  const syncOnboarding = useSyncOnboardingToProfile()
  const initializeExperience = useInitializePostOnboardingExperience()

  return {
    validation,
    isLoading: validationLoading,
    
    // Actions
    updatePreferences: (preferences: string[]) => 
      updatePreferences.mutate({ userId: targetUserId!, preferences }),
    updateGoals: (goals: string[]) => 
      updateGoals.mutate({ userId: targetUserId!, goals }),
    syncOnboardingData: () => 
      syncOnboarding.mutate(targetUserId!),
    initializeExperience: () => 
      initializeExperience.mutate(targetUserId!),
    
    // Status
    isUpdating: updatePreferences.isPending || updateGoals.isPending || 
                syncOnboarding.isPending || initializeExperience.isPending,
    
    // Validation helpers
    needsPreferencesSync: validation && !validation.hasPreferences && validation.hasOnboardingData,
    needsGoalsSync: validation && !validation.hasGoals && validation.hasOnboardingData,
    isSetupComplete: validation?.isComplete || false,
  }
}