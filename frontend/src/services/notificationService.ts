import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { Notification } from '@/stores/useNotificationStore'

export interface CreateNotificationData {
  type: string
  title: string
  message: string
  icon?: string
  color?: string
  xp?: number
  actionUrl?: string
}

class NotificationService {
  // Get user notifications (when backend implements this)
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      // TODO: Implement when backend adds notification endpoints
      // const response = await api.get(`/notifications/user/${userId}`)
      // return handleApiResponse(response) as Notification[]
      
      // For now, return empty array - notifications will be generated client-side
      return []
    } catch (error: any) {
      console.warn('Notification service not yet implemented in backend')
      return []
    }
  }

  // Mark notification as read (when backend implements this)
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // TODO: Implement when backend adds notification endpoints
      // await api.patch(`/notifications/${notificationId}/read`)
      console.log('Mark as read - backend not implemented yet')
    } catch (error: any) {
      console.warn('Notification service not yet implemented in backend')
    }
  }

  // Create notification (when backend implements this)
  async createNotification(userId: string, data: CreateNotificationData): Promise<Notification> {
    try {
      // TODO: Implement when backend adds notification endpoints
      // const response = await api.post(`/notifications/user/${userId}`, data)
      // return handleApiResponse(response) as Notification
      
      // For now, create client-side notification
      const notification: Notification = {
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: data.type || 'system',
        title: data.title,
        message: data.message,
        icon: data.icon || '🔔',
        color: data.color || 'from-gray-500 to-gray-600',
        xp: data.xp || 0,
        actionUrl: data.actionUrl || '/'
      }
      
      return notification
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Generate achievement notifications based on user progress
  generateAchievementNotifications(userStats: any): Notification[] {
    const notifications: Notification[] = []
    
    // Level up notification
    if (userStats.level > 1) {
      notifications.push({
        id: `level_${userStats.level}`,
        type: 'level_up',
        title: `Level ${userStats.level} Achieved! 🎉`,
        message: `Congratulations! You've reached Level ${userStats.level}`,
        timestamp: new Date().toISOString(),
        read: false,
        icon: '🎉',
        color: 'from-purple-500 to-blue-500',
        xp: 0,
        actionUrl: '/progress'
      })
    }

    // Streak notifications
    if (userStats.streakCount >= 7) {
      notifications.push({
        id: `streak_${userStats.streakCount}`,
        type: 'streak_milestone',
        title: `${userStats.streakCount}-Day Streak! 🔥`,
        message: `Amazing! You've maintained your learning streak for ${userStats.streakCount} days`,
        timestamp: new Date().toISOString(),
        read: false,
        icon: '🔥',
        color: 'from-red-500 to-pink-500',
        xp: userStats.streakCount * 10,
        actionUrl: '/streak'
      })
    }

    return notifications
  }

  // Generate recommendation notifications
  generateRecommendationNotifications(recommendations: any[]): Notification[] {
    if (!recommendations || recommendations.length === 0) return []

    const highPriorityRecs = recommendations.filter(r => r.priority > 70)
    
    return highPriorityRecs.slice(0, 2).map(rec => ({
      id: `rec_${rec.id}`,
      type: 'recommendation',
      title: 'New Recommendation 💡',
      message: `Based on your progress: ${rec.title}`,
      timestamp: new Date().toISOString(),
      read: false,
      icon: '💡',
      color: 'from-blue-500 to-cyan-500',
      xp: 0,
      actionUrl: rec.actionUrl || '/recommendations'
    }))
  }
}

export const notificationService = new NotificationService()
export default notificationService