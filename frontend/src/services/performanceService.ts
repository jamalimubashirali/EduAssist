import api, { handleApiResponse, handleApiError } from '@/lib/api'

export interface PerformanceData {
  subjectId: string
  topicId: string
  attemptData: {
    score: number
    timeSpent: number
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    date: string
  }
}

export interface PerformanceStats {
  userId: string
  subjectId: string
  averageScore: number
  totalAttempts: number
  totalTimeSpent: number
  bestScore: number
  worstScore: number
  improvementRate: number
  lastAttemptDate: string
}

export interface SubjectPerformance {
  subjectId: string
  subjectName: string
  averageScore: number
  totalAttempts: number
  mastery: number // 0-100
  weakTopics: string[]
  strongTopics: string[]
}

export interface LearningProgress {
  userId: string
  totalXP: number
  level: number
  streakDays: number
  subjectsStudied: number
  topicsCompleted: number
  averageSessionTime: number
  weeklyProgress: {
    week: string
    xpGained: number
    quizzesCompleted: number
    averageScore: number
  }[]
}

class PerformanceService {
  // Record performance data
  async recordPerformance(data: PerformanceData): Promise<void> {
    try {
      console.debug('[performanceService] recordPerformance payload:', data)
      const response = await api.post('/performance/update', {
        subjectId: data.subjectId,
        topicId: data.topicId,
        attemptData: data.attemptData,
      })
      const out = handleApiResponse(response)
      console.debug('[performanceService] recordPerformance result:', out)
      return out
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get user's overall performance (backend infers user from auth)
  async getUserPerformance(_userId: string): Promise<PerformanceStats[]> {
    try {
      const response = await api.get(`/performance/my-performance`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get performance by subject
  async getSubjectPerformance(userId: string, subjectId: string): Promise<PerformanceStats> {
    try {
      const response = await api.get(`/performance/user/${userId}/subject/${subjectId}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get performance analytics
  async getPerformanceAnalytics(userId: string): Promise<{
    overallStats: PerformanceStats
    subjectBreakdown: SubjectPerformance[]
    weeklyTrend: { week: string; averageScore: number; attempts: number }[]
    improvementAreas: string[]
  }> {
    try {
      const response = await api.get(`/performance/analytics/${userId}`)
      const perfArray = handleApiResponse(response) as any[]

      // Transform backend performances to FE analytics shape
      const totalAttempts = perfArray.reduce((sum, p) => sum + (p.totalAttempts || 0), 0)
      const avgScore = perfArray.length
        ? perfArray.reduce((sum, p) => sum + (p.averageScore || 0), 0) / perfArray.length
        : 0
      const bestScore = perfArray.reduce((m, p) => Math.max(m, p.bestScore ?? 0), 0)
      const worstScore = perfArray.reduce((m, p) => Math.min(m, p.worstScore ?? 100), 100)
      const improvementRate = perfArray.length
        ? perfArray.reduce((sum, p) => sum + (p.learningVelocity || 0), 0) / perfArray.length
        : 0
      const lastAttemptDate = perfArray.reduce((latest: string, p) => {
        const d = p.lastUpdated ? new Date(p.lastUpdated).toISOString() : ''
        return !latest || (d && d > latest) ? d : latest
      }, '')

      const subjectBreakdown = (perfArray || []).map((p) => ({
        subjectId: p.subjectId?._id || p.subjectId?.toString?.() || '',
        subjectName: p.subjectId?.name || 'Subject',
        averageScore: p.averageScore || 0,
        totalAttempts: p.totalAttempts || 0,
        mastery: p.masteryLevel || 0,
        weakTopics: [],
        strongTopics: [],
      }))

      // Build a simple weekly trend from recentScores (index-based)
      const maxLen = Math.max(...perfArray.map((p) => (p.recentScores?.length || 0)))
      const weeks = Math.min(maxLen, 8)
      const weeklyTrend = Array.from({ length: weeks }).map((_, idx) => {
        const values: number[] = []
        perfArray.forEach((p) => {
          if (Array.isArray(p.recentScores) && p.recentScores[idx] != null) {
            values.push(p.recentScores[idx])
          }
        })
        const averageScore = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
        return { week: `W${idx + 1}`, averageScore: Math.round(averageScore), attempts: values.length }
      })

      const improvementAreas = subjectBreakdown
        .filter((s) => s.averageScore < 60)
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 5)
        .map((s) => s.subjectName)

      return {
        overallStats: {
          userId,
          subjectId: '',
          averageScore: Math.round(avgScore * 10) / 10,
          totalAttempts,
          totalTimeSpent: 0,
          bestScore,
          worstScore,
          improvementRate,
          lastAttemptDate,
        },
        subjectBreakdown,
        weeklyTrend,
        improvementAreas,
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Connect to backend's advanced gamification analytics
  async getGamificationStats(userId: string): Promise<{
    totalTopics: number
    averageMastery: number
    strongAreas: { topic: string; masteryLevel: number; averageScore: number }[]
    weakAreas: { topic: string; masteryLevel: number; averageScore: number }[]
    recentProgress: { date: string; score: number }[]
    subjectBreakdown: Record<string, { topicCount: number; averageMastery: number; averageScore: number }>
  }> {
    try {
      const response = await api.get(`/performance/user/${userId}/gamification-stats`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Connect to backend's subject mastery calculations
  async getSubjectMastery(userId: string): Promise<{
    subjectId: string
    subjectName: string
    masteryLevel: number
    averageScore: number
    topicCount: number
    totalAttempts: number
    masteryDescription: string
  }[]> {
    try {
      const response = await api.get(`/performance/user/${userId}/subject-mastery`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Connect to backend's learning velocity and trend analysis
  async getLearningTrends(userId: string): Promise<{
    dailyTrends: { date: string; quizCount: number; averageScore: number; subjectsStudied: number }[]
    weeklyTrends: { weekStart: string; daysActive: number; averageDailyQuizzes: number; averageScore: number; totalQuizzes: number }[]
    totalDaysActive: number
    averageDailyQuizzes: number
    overallTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data' | 'no_recent_activity' | 'new_learner'
  }> {
    try {
      const response = await api.get(`/performance/user/${userId}/learning-trends`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get learning progress (map from /performance/my-performance)
  async getLearningProgress(_userId: string): Promise<LearningProgress> {
    try {
      const response = await api.get(`/performance/my-performance`)
      const arr = handleApiResponse(response) as any[]
      // Build a lightweight progress summary from topic performances
      const totalAttempts = arr.reduce((s, p) => s + (p.totalAttempts || 0), 0)
      const avgSessionTime = 0
      const weeklyProgress = [] as LearningProgress['weeklyProgress']
      return {
        userId: 'me',
        totalXP: 0,
        level: 1,
        streakDays: 0,
        subjectsStudied: new Set(arr.map(p => p.subjectId?._id || p.subjectId)).size,
        topicsCompleted: arr.length,
        averageSessionTime: avgSessionTime,
        weeklyProgress,
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get weak areas for user (derived from analytics)
  async getWeakAreas(userId: string): Promise<{
    subjects: { id: string; name: string; averageScore: number }[]
    topics: { id: string; name: string; subjectName: string; averageScore: number }[]
  }> {
    try {
      const analytics = await this.getPerformanceAnalytics(userId)
      const subjects = (analytics.subjectBreakdown || [])
        .sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0))
        .slice(0, 5)
        .map(s => ({ id: s.subjectId, name: s.subjectName, averageScore: s.averageScore }))
      return { subjects, topics: [] }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get strong areas for user (derived from analytics)
  async getStrongAreas(userId: string): Promise<{
    subjects: { id: string; name: string; averageScore: number }[]
    topics: { id: string; name: string; subjectName: string; averageScore: number }[]
  }> {
    try {
      const analytics = await this.getPerformanceAnalytics(userId)
      const subjects = (analytics.subjectBreakdown || [])
        .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
        .slice(0, 5)
        .map(s => ({ id: s.subjectId, name: s.subjectName, averageScore: s.averageScore }))
      return { subjects, topics: [] }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get performance comparison with peers
  async getPerformanceComparison(userId: string): Promise<{
    userRank: number
    totalUsers: number
    percentile: number
    subjectRankings: {
      subjectId: string
      subjectName: string
      userRank: number
      totalUsers: number
      percentile: number
    }[]
  }> {
    try {
      const response = await api.get(`/performance/user/${userId}/comparison`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get study recommendations based on performance
  async getStudyRecommendations(userId: string): Promise<{
    recommendedTopics: {
      topicId: string
      topicName: string
      subjectName: string
      reason: string
      priority: 'high' | 'medium' | 'low'
    }[]
    suggestedDifficulty: 'beginner' | 'intermediate' | 'advanced'
    recommendedStudyTime: number // minutes per day
  }> {
    try {
      const response = await api.get(`/performance/user/${userId}/recommendations`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get performance trends
  async getPerformanceTrends(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{
    scoresTrend: { date: string; averageScore: number }[]
    timeTrend: { date: string; totalTime: number }[]
    xpTrend: { date: string; xpGained: number }[]
  }> {
    try {
      const response = await api.get(`/performance/user/${userId}/learning-trends`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  /**
   * Get user's goal progress with enhanced weak area tracking
   */
  async getUserGoalProgress(userId?: string): Promise<{
    targetScore: number
    currentAverageScore: number
    adjustedProgressScore: number
    progressPercentage: number
    scoreGap: number
    topicsAtTarget: number
    totalTopics: number
    weakAreasCount: number
    strongAreasCount: number
    recentlyImprovedCount: number
    newlyWeakCount: number
    weeklyGoalProgress: {
      target: number
      completed: number
      isOnTrack: boolean
    }
    focusAreaProgress: Array<{
      area: string
      currentScore: number
      targetScore: number
      isOnTrack: boolean
      improvement: boolean
      trend: 'improving' | 'declining' | 'stable'
      topicsInArea: number
      weakTopicsInArea: number
    }>
    weakAreas: string[]
    strongAreas: string[]
    improvingTopics: string[]
    decliningTopics: string[]
    recentlyImprovedAreas: string[]
    newlyWeakAreas: string[]
    improvementRate: number
  }> {
    try {
      const endpoint = userId 
        ? `/performance/user/${userId}/goal-progress`
        : '/performance/my-goal-progress'
      
      const response = await api.get(endpoint)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  /**
   * Get enhanced recommendations based on goal progress and weak areas
   */
  async getEnhancedRecommendations(userId: string): Promise<{
    recommendations: Array<{
      title: string
      reason: string
      difficulty: 'EASY' | 'MEDIUM' | 'HARD'
      priority: number
      factors: string[]
      goalContext: {
        targetScore: number
        currentProgress: number
        scoreGap: number
        isWeakArea: boolean
        hasRecentlyImproved: boolean
        weakAreasCount: number
        strongAreasCount: number
      }
    }>
  }> {
    try {
      const response = await api.get(`/recommendations/user/${userId}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }
}

export const performanceService = new PerformanceService()
export default performanceService
