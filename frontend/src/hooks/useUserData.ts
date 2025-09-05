import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, UpdateUserData, UserStats } from '@/services/userService'
import { User } from '@/types'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { toast } from 'sonner'
import { CACHE_TIMES, createQueryKey } from '@/lib/queryClient'
import { useCacheInvalidation } from '@/hooks/useCacheManager'
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  user: (id: string) => [...userKeys.all, id] as const,
  currentUser: () => [...userKeys.all, 'current'] as const,
  stats: (id: string) => [...userKeys.all, id, 'stats'] as const,
}

// Get current user - optimized for frequent access
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.currentUser(),
    queryFn: async () => {
      const user = await userService.getCurrentUser();
      console.log('[UserData] Fetched current user from backend:', user);
      return user;
    },
    staleTime: CACHE_TIMES.USER_PROFILE,
    gcTime: 1000 * 60 * 15, // Keep current user data longer
    refetchOnWindowFocus: false, // Don't refetch on every focus
    retry: 1,
  })
}

// Get user by ID - with intelligent caching
export function useUser(id: string) {
  return useQuery({
    queryKey: [...userKeys.user(id)],
    queryFn: async () => {
      const user = await userService.getUserById(id);
      console.log(`[UserData] Fetched user by ID (${id}) from backend:`, user);
      return user;
    },
    enabled: !!id,
    staleTime: CACHE_TIMES.USER_PROFILE,
    gcTime: 1000 * 60 * 10,
  })
}

// Get user stats - frequent updates for dynamic data
export function useUserStats(userId: string) {
  return useQuery({
    queryKey: userKeys.stats(userId),
    queryFn: async () => {
      const stats = await userService.getUserStats(userId);
      console.log(`[UserData] Fetched user stats for userId (${userId}) from backend:`, stats);
      return stats;
    },
    enabled: !!userId,
    staleTime: CACHE_TIMES.USER_STATS,
    refetchOnWindowFocus: false, // Disable aggressive refetching
    retry: 1,
    retryDelay: 2000,
  })
}

// Update user mutation with optimistic updates
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { setUser } = useUserStore()
  const optimisticManager = useOptimisticUpdates()
  const { invalidateOnUserUpdate } = useCacheInvalidation()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => {
      return optimisticManager.performOptimisticUpdate(
        {
          queryKey: Array.from(userKeys.user(id)),
          updateFn: (oldUser: any) => ({ ...oldUser, ...data }),
          successMessage: 'Profile updated successfully!',
          errorMessage: 'Failed to update profile'
        },
        () => userService.updateUser(id, data)
      )
    },
    onSuccess: async (updatedUser) => {
      // Update cache with real data
      queryClient.setQueryData(userKeys.user(updatedUser.id), updatedUser)
      queryClient.setQueryData(userKeys.currentUser(), updatedUser)

      // Update user store
      setUser(updatedUser)

      // Intelligent cache invalidation
      await invalidateOnUserUpdate(updatedUser.id)
    },
    onError: (error: any) => {
      // Error handling is done in optimistic update manager
      console.error('User update failed:', error)
    },
  })
}

// Update user XP mutation
export function useUpdateUserXP() {
  const queryClient = useQueryClient()
  const { setUser } = useUserStore()

  return useMutation({
    mutationFn: ({ userId, xpGained }: { userId: string; xpGained: number }) =>
      userService.updateUserXP(userId, xpGained),
    onSuccess: (updatedUser) => {
      // Update cache
      queryClient.setQueryData(userKeys.user(updatedUser.id), updatedUser)
      queryClient.setQueryData(userKeys.currentUser(), updatedUser)

      // Update user store
      setUser(updatedUser)

      // Invalidate stats to refresh
      queryClient.invalidateQueries({ queryKey: userKeys.stats(updatedUser.id) })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update XP')
    },
  })
}

// Update user streak mutation
export function useUpdateUserStreak() {
  const queryClient = useQueryClient()
  const { setUser } = useUserStore()
  const setGamificationState = useGamificationStore(state => state.setGamificationState);

  return useMutation({
    mutationFn: ({ userId, increment }: { userId: string; increment?: boolean }) =>
      userService.updateStreak(userId, increment),
    onSuccess: (updatedUser) => {
      // Update cache
      queryClient.setQueryData(userKeys.user(updatedUser.id), updatedUser)
      queryClient.setQueryData(userKeys.currentUser(), updatedUser)

      // Update user store
      setUser(updatedUser)

      // Update gamification streak state
      setGamificationState({ streak: {
        current: updatedUser.streakCount || 0,
        longest: updatedUser.longestStreak || updatedUser.streakCount || 0
      } })

      // Invalidate stats to refresh
      queryClient.invalidateQueries({ queryKey: userKeys.stats(updatedUser.id) })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update streak')
    },
  })
}
