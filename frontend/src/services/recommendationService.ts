import api, { handleApiResponse, handleApiError } from '@/lib/api'

export interface Recommendation {
  id: string
  userId: string
  type: 'weak' | 'practice' | 'advanced' | 'quiz' | 'topic' | 'subject' | 'study_plan'
  title: string
  description: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  confidence: number // 0-1
  metadata: {
    quizId?: string
    topicId?: string
    subjectId?: string
    topicName?: string
    subjectName?: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'Easy' | 'Medium' | 'Hard'
    estimatedTime?: number
    source?: string
  }
  status: 'pending' | 'accepted' | 'dismissed' | 'completed'
  createdAt: string
  expiresAt?: string
}

export interface StudyPlan {
  id: string
  userId: string
  title: string
  description: string
  duration: number // days
  dailyTimeCommitment: number // minutes
  subjects: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  milestones: {
    day: number
    title: string
    description: string
    quizzes: string[]
    topics: string[]
  }[]
  progress: {
    currentDay: number
    completedMilestones: number
    totalXPEarned: number
  }
  status: 'active' | 'completed' | 'paused'
  createdAt: string
}

class RecommendationService {
  // Get recommendations for user
  async getUserRecommendations(userId: string, type?: string, limit?: number): Promise<Recommendation[]> {
    try {
      // Backend provides my-recommendations for the authenticated user.
      // We ignore userId here and fetch for the current session user, then filter client-side by type/limit.
      const response = await api.get(`/recommendations/my-recommendations`)
      const data = handleApiResponse<Recommendation[]>(response)
      let result = data
      if (type) result = result.filter(r => r.type === (type as any))
      if (limit) result = result.slice(0, limit)
      return result
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Connect to backend's intelligent recommendation engine with priority scoring
  async getSmartRecommendations(userId?: string): Promise<{
    id: string
    userId: string
    type: string
    title: string
    description: string
    reason: string
    priority: number
    urgency: number
    estimatedTime: number
    confidence: number
    metadata: {
      quizId?: string
      topicId?: string
      subjectId?: string
      difficulty?: 'Easy' | 'Medium' | 'Hard'
      estimatedTime?: number
      weaknessScore?: number
      improvementPotential?: number
    }
    status: string
    createdAt: string
  }[]> {
    try {
      const response = await api.get(`/recommendations/smart-recommendations`)
      const recommendations = handleApiResponse(response)
      
      // Ensure all recommendations have the required intelligent fields
      return recommendations.map((rec: {
        id: string
        userId: string
        type: string
        title: string
        description: string
        reason: string
        priority?: number
        urgency?: number
        estimatedTime?: number
        confidence?: number
        metadata?: {
          quizId?: string
          topicId?: string
          subjectId?: string
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          estimatedTime?: number
          weaknessScore?: number
          improvementPotential?: number
        }
        status: string
        createdAt: string
      }) => ({
        ...rec,
        priority: rec.priority || 50,
        urgency: rec.urgency || 30,
        estimatedTime: rec.estimatedTime || 20,
        confidence: rec.confidence || 0.5,
        metadata: {
          ...rec.metadata,
          improvementPotential: rec.metadata?.improvementPotential || rec.priority || 50,
          weaknessScore: rec.metadata?.weaknessScore || (100 - (rec.confidence! * 100)),
        }
      }))
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get recommendation analytics from backend
  async getRecommendationAnalytics(userId: string): Promise<{
    totalRecommendations: number
    recentRecommendations: any[]
    subjectDistribution: Record<string, number>
    difficultyTrend: any[]
    completionRate: number
    averageResponseTime: number
  }> {
    try {
      const response = await api.get(`/recommendations/analytics/${userId}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get recommendation statistics from backend
  async getRecommendationStats(userId?: string): Promise<{
    statusBreakdown: {
      pending: number
      accepted: number
      rejected: number
      completed: number
      total: number
    }
    difficultyBreakdown: {
      Easy: number
      Medium: number
      Hard: number
    }
    totalRecommendations: number
  }> {
    try {
      const response = await api.get(`/recommendations/stats`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get recommendations by status from backend
  async getRecommendationsByStatus(status: 'pending' | 'accepted' | 'rejected' | 'completed'): Promise<Recommendation[]> {
    try {
      const response = await api.get(`/recommendations/by-status?status=${status}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Batch update recommendation status
  async batchUpdateRecommendationStatus(recommendationIds: string[], status: string): Promise<{
    matchedCount: number
    modifiedCount: number
    message: string
  }> {
    try {
      const response = await api.post(`/recommendations/batch-update-status`, {
        recommendationIds,
        status
      })
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get recommendation by ID
  async getRecommendationById(id: string): Promise<Recommendation> {
    try {
      const response = await api.get(`/recommendations/${id}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Accept recommendation
  async acceptRecommendation(id: string): Promise<Recommendation> {
    try {
      const response = await api.patch(`/recommendations/${id}/status`, { status: 'accepted' })
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Dismiss recommendation
  async dismissRecommendation(id: string, reason?: string): Promise<Recommendation> {
    try {
      const response = await api.patch(`/recommendations/${id}/status`, { status: 'dismissed', reason })
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Mark recommendation as completed
  async completeRecommendation(id: string): Promise<Recommendation> {
    try {
      const response = await api.patch(`/recommendations/${id}/status`, { status: 'completed' })
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Generate new recommendations (fallback to fetching current user's recommendations)
  // Backend does not expose POST /recommendations/generate/:userId; use my-recommendations instead
  async generateRecommendations(_userId?: string): Promise<Recommendation[]> {
    try {
      const response = await api.get(`/recommendations/my-recommendations`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get personalized study plan
  async getStudyPlan(userId: string): Promise<StudyPlan | null> {
    try {
      const response = await api.get(`/recommendations/study-plan/${userId}`)
      return handleApiResponse(response)
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      return handleApiError(error)
    }
  }

  // Create study plan
  async createStudyPlan(userId: string, preferences: {
    subjects: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    dailyTimeCommitment: number
    duration: number
    goals: string[]
  }): Promise<StudyPlan> {
    try {
      const response = await api.post(`/recommendations/study-plan/${userId}`, preferences)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Update study plan progress
  async updateStudyPlanProgress(planId: string, progress: {
    currentDay?: number
    completedMilestones?: number
    totalXPEarned?: number
  }): Promise<StudyPlan> {
    try {
      const response = await api.patch(`/recommendations/study-plan/${planId}/progress`, progress)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get quiz recommendations based on weak areas
  async getQuizRecommendations(userId: string, limit: number = 5): Promise<{
    quizId: string
    title: string
    subject: string
    difficulty: string
    reason: string
    confidence: number
  }[]> {
    try {
      const response = await api.get(`/recommendations/quizzes/${userId}?limit=${limit}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get topic recommendations
  async getTopicRecommendations(userId: string, limit: number = 5): Promise<{
    topicId: string
    topicName: string
    subjectName: string
    difficulty: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }[]> {
    try {
      const response = await api.get(`/recommendations/topics/${userId}?limit=${limit}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get adaptive difficulty recommendation
  async getAdaptiveDifficulty(userId: string, subjectId: string): Promise<{
    recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced'
    confidence: number
    reason: string
  }> {
    try {
      const response = await api.get(`/recommendations/difficulty/${userId}/${subjectId}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Provide feedback on recommendation
  async provideFeedback(recommendationId: string, feedback: {
    helpful: boolean
    rating: number // 1-5
    comment?: string
  }): Promise<void> {
    try {
      const response = await api.post(`/recommendations/${recommendationId}/feedback`, feedback)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Auto-generate recommendations for a completed attempt
  async autoGenerateForAttempt(attemptId: string): Promise<Recommendation[]> {
    try {
      console.debug('[recommendationService] autoGenerateForAttempt:', attemptId)
      const response = await api.post(`/recommendations/auto-generate/${attemptId}`)
      const recs = handleApiResponse(response)
      console.debug('[recommendationService] autoGenerateForAttempt -> count:', Array.isArray(recs)?recs.length:'n/a')
      return recs
    } catch (error: any) {
      console.warn('[recommendationService] autoGenerateForAttempt error:', error)
      return handleApiError(error)
    }
  }
}

export const recommendationService = new RecommendationService()
export default recommendationService
