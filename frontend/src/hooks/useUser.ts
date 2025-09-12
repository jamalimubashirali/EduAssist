// Centralized user hooks entry. We use React Query hooks from useUserData
// Re-export here to provide a consistent import path across the app.
export {
  userKeys,
  useCurrentUser,
  useUser,
  // Mutations re-exported for convenience
  useUpdateUserXP,
  useUpdateUserStreak,
} from './useUserData'

// Re-export useUserStats from gamification data (more comprehensive)
export { useUserStats } from './useGamificationData'

