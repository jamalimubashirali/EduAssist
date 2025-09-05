import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { Badge, Quest, Streak, Achievement, GameNotification, User } from '@/types'

// Gamification-specific types
export interface UserStats {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  totalQuizzes: number
  totalBadges: number
  averageScore: number
  rank: number
  percentile: number
}

export interface QuestProgress {
  questId: string
  progress: number
  completedAt?: string
}

export interface BadgeUnlock {
  badgeId: string
  unlockedAt: string
  xpEarned: number
}

export interface LeaderboardEntry {
  id: string
  userId: string
  userName: string
  avatar?: string
  level: number
  totalXP: number
  averageScore: number
  currentStreak: number
  rank: number
  completedQuizzes: number
  score?: number // For backward compatibility
  xpEarned?: number // For backward compatibility
  streak?: number // For backward compatibility
}

export interface GamificationStats {
  questsCompleted: number
  badgesUnlocked: number
  achievementsUnlocked: number
  totalXPEarned: number
  averageQuizScore: number
  bestSubject: string
  improvementAreas: string[]
  weeklyProgress: number
}

export interface SubjectMastery {
  subject: string
  masteryLevel: number
  completedQuizzes: number
  averageScore: number
  strongTopics: string[]
  weakTopics: string[]
}

export interface LearningTrend {
  date: string
  quizzesCompleted: number
  averageScore: number
  xpEarned: number
  timeSpent: number
}

class GamificationService {
  // User Statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response = await api.get(`/users/${userId}/stats`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Calculate level from XP using existing user service logic
  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  // Get user rank from leaderboard endpoint
  async getUserRank(userId: string): Promise<number> {
    try {
      const response = await api.get(`/attempts/my-leaderboard-position`)
      const data = handleApiResponse(response)
      return data.position || 0
    } catch (error: any) {
      return 0 // Return 0 if unable to determine rank
    }
  }

  // Quests Management
  async getUserQuests(userId: string): Promise<Quest[]> {
    try {
      const response = await api.get(`/users/${userId}/quests`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async completeQuest(userId: string, questId: string): Promise<{ success: boolean; xpEarned: number }> {
    try {
      const response = await api.post(`/users/${userId}/quests/${questId}/complete`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async claimQuestReward(userId: string, questId: string): Promise<{ success: boolean; xpEarned: number }> {
    try {
      const response = await api.post(`/users/${userId}/quests/${questId}/claim`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Badge Management
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const response = await api.get(`/users/${userId}/badges`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Streak Management
  async updateStreak(userId: string): Promise<Streak> {    try {
      const response = await api.patch(`/users/${userId}/streak`)
      const updatedUser = handleApiResponse(response)
      return {
        current: updatedUser.currentStreak || updatedUser.streakCount || 0,
        longest: updatedUser.longestStreak || updatedUser.streakCount || 0,
        lastActivityDate: new Date().toISOString(),
        isActive: (updatedUser.currentStreak || updatedUser.streakCount || 0) > 0
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  calculateStreakMultiplier(streak: number): number {
    if (streak >= 30) return 2.0
    if (streak >= 14) return 1.5
    if (streak >= 7) return 1.2
    return 1.0
  }

  // XP and Level Management
  async updateUserXP(userId: string, xpGained: number, source: string = 'quiz'): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    try {
      const response = await api.patch(`/users/${userId}/xp`, { xpGained, source })
      const updatedUser = handleApiResponse(response)
      
      const newLevel = this.calculateLevel(updatedUser.xp_points)
      const previousXP = updatedUser.xp_points - xpGained
      const previousLevel = this.calculateLevel(previousXP)

      return {
        xp: updatedUser.xp_points,
        level: newLevel,
        leveledUp: newLevel > previousLevel
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Achievements
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const response = await api.get(`/users/${userId}/achievements`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Leaderboard
  async getGlobalLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get(`/attempts/leaderboard/${limit}`)
      const data = handleApiResponse(response)
      return data.map((entry: any, index: number) => ({
        id: entry._id || entry.id,
        userId: entry.userId || entry.user?._id,
        userName: entry.userName || entry.user?.name || 'Anonymous',
        avatar: entry.avatar || entry.user?.avatar,
        level: this.calculateLevel(entry.totalXP || entry.xp_points || 0),
        totalXP: entry.totalXP || entry.xp_points || 0,
        averageScore: entry.averageScore || entry.score || 0,
        currentStreak: entry.currentStreak || entry.streakCount || 0,
        rank: index + 1,
        completedQuizzes: entry.completedQuizzes || entry.totalQuizzes || 0,
        // Backward compatibility
        score: entry.score || entry.averageScore || 0,
        xpEarned: entry.xpEarned || entry.totalXP || 0,
        streak: entry.streak || entry.currentStreak || 0
      }))
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Analytics and Statistics
  async getGamificationStats(userId: string): Promise<GamificationStats> {
    try {
      const response = await api.get(`/performance/user/${userId}/gamification-stats`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async getSubjectMastery(userId: string): Promise<SubjectMastery[]> {
    try {
      const response = await api.get(`/performance/user/${userId}/subject-mastery`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async getLearningTrends(userId: string, days: number = 30): Promise<LearningTrend[]> {
    try {
      const response = await api.get(`/performance/user/${userId}/learning-trends?days=${days}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Notification Management
  async getNotifications(userId: string): Promise<GameNotification[]> {
    // This would be implemented if we had a notifications backend endpoint
    // For now, return empty array as notifications might be handled differently
    try {
      // If we implement notifications endpoint later:
      // const response = await api.get(`/users/${userId}/notifications`)
      // return handleApiResponse(response)
      return []
    } catch (error: any) {
      return []
    }
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      // If we implement notifications endpoint later:
      // const response = await api.patch(`/users/${userId}/notifications/${notificationId}/read`)
      // return handleApiResponse(response)
      return true
    } catch (error: any) {
      return false
    }
  }

  // Utility methods
  private getDateDaysAgo(days: number): Date {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date
  }

  private getWeekEnd(): Date {
    const now = new Date()
    const currentDay = now.getDay()
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + daysUntilSunday)
    weekEnd.setHours(23, 59, 59, 999)
    return weekEnd
  }

  // Environment check for real API usage
  private get useRealAPI(): boolean {
    return process.env.NEXT_PUBLIC_USE_REAL_API !== 'false'
  }
}

export const gamificationService = new GamificationService()
export default gamificationService
