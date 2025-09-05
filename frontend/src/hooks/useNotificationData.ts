import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notificationService'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationStats } from './useGamificationData'
import { useRecommendations } from './useRecommendationData'
import { useEffect } from 'react'

export function useNotifications() {
  const { user } = useUserStore()
  const { setNotifications, addNotification } = useNotificationStore()
  const { data: gamificationStats } = useGamificationStats()
  const { data: recommendations } = useRecommendations()

  // Generate notifications based on user progress and achievements
  useEffect(() => {
    if (!user) return

    const notifications = []

    // Generate achievement notifications
    if (gamificationStats) {
      const achievementNotifications = notificationService.generateAchievementNotifications(gamificationStats)
      notifications.push(...achievementNotifications)
    }

    // Generate recommendation notifications
    if (recommendations) {
      const recommendationNotifications = notificationService.generateRecommendationNotifications(recommendations)
      notifications.push(...recommendationNotifications)
    }

    // Update store with generated notifications
    if (notifications.length > 0) {
      setNotifications(notifications)
    }
  }, [user, gamificationStats, recommendations, setNotifications])

  // Query for backend notifications (when implemented)
  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => user ? notificationService.getUserNotifications(user.id) : Promise.resolve([]),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notifications
      // queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Mutation to create notification
  const createNotificationMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: any }) => 
      notificationService.createNotification(userId, data),
    onSuccess: (newNotification) => {
      addNotification(newNotification)
    }
  })

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markAsRead: markAsReadMutation.mutate,
    createNotification: createNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isCreating: createNotificationMutation.isPending
  }
}

// Hook to create specific types of notifications
export function useCreateNotification() {
  const { user } = useUserStore()
  const { addNotification } = useNotificationStore()

  const createLevelUpNotification = (level: number) => {
    if (!user) return

    const notification = {
      type: 'level_up',
      title: `Level ${level} Achieved! 🎉`,
      message: `Congratulations! You've reached Level ${level}`,
      icon: '🎉',
      color: 'from-purple-500 to-blue-500',
      xp: 0,
      actionUrl: '/progress'
    }

    addNotification(notification)
  }

  const createBadgeNotification = (badgeName: string, xp: number = 0) => {
    if (!user) return

    const notification = {
      type: 'badge_unlock',
      title: 'New Badge Unlocked! 🏆',
      message: `You earned the "${badgeName}" badge`,
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500',
      xp,
      actionUrl: '/badges'
    }

    addNotification(notification)
  }

  const createStreakNotification = (streakCount: number) => {
    if (!user) return

    const notification = {
      type: 'streak_milestone',
      title: `${streakCount}-Day Streak! 🔥`,
      message: `Amazing! You've maintained your learning streak for ${streakCount} days`,
      icon: '🔥',
      color: 'from-red-500 to-pink-500',
      xp: streakCount * 10,
      actionUrl: '/streak'
    }

    addNotification(notification)
  }

  const createQuizCompletionNotification = (quizTitle: string, score: number, xp: number) => {
    if (!user) return

    const notification = {
      type: 'quiz_completion',
      title: 'Quiz Completed! ✅',
      message: `You scored ${score}% on "${quizTitle}"`,
      icon: '✅',
      color: score >= 80 ? 'from-green-500 to-emerald-500' : 'from-blue-500 to-cyan-500',
      xp,
      actionUrl: '/progress'
    }

    addNotification(notification)
  }

  return {
    createLevelUpNotification,
    createBadgeNotification,
    createStreakNotification,
    createQuizCompletionNotification
  }
}