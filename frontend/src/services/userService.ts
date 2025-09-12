import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { User, BackendUser } from '@/types'
import { convertBackendUser, convertApiResponse } from '@/lib/typeConverters'
import { ServiceErrorHandler, EnhancedToast, RetryHandler } from '@/lib/errorHandling'
import { calculateLevel } from '@/lib/utils'

export interface UpdateUserData {
  name?: string
  email?: string
  preferences?: string[]
}

export interface UserStats {
  totalQuizzesAttempted: number
  averageScore: number
  streakCount: number
  level: number
  xp_points: number
  leaderboardScore: number
}

interface preferences {
  id: string,
  subjectName : string,
  subjectDescription: string
}

class UserService {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users')
      const backendUsers = handleApiResponse(response) as BackendUser[]
      return convertApiResponse(backendUsers, convertBackendUser) as User[]
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`)
      const backendUser = handleApiResponse(response) as BackendUser
      return convertBackendUser(backendUser)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/users/me')
      const backendUser = handleApiResponse(response) as BackendUser
      return convertBackendUser(backendUser);
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      console.error('Server logout failed, proceeding with client-side cleanup.', error);
    }
  }

  // Update user
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await api.patch(`/users/${id}`, data)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await api.delete(`/users/${id}`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Update user XP and level
  async updateUserXP(userId: string, xpGained: number): Promise<User> {
    try {
      const user = await this.getUserById(userId)
      const newXP = (user.xp_points || 0) + xpGained
      const newLevel = calculateLevel(newXP)

      const response = await api.patch(`/users/${userId}`, {
        xp_points: newXP,
        level: newLevel
      })
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }


  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const user = await this.getUserById(userId)
      return {
        totalQuizzesAttempted: user.totalQuizzesAttempted || 0,
        averageScore: user.averageScore || 0,
        streakCount: user.streakCount || 0,
        level: user.level || 1,
        xp_points: user.xp_points || 0,
        leaderboardScore: user.leaderboardScore || 0
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Update user streak (use backend endpoint to handle date logic server-side)
  async updateStreak(userId: string, increment: boolean = true): Promise<User> {
    try {
      // Let the backend compute streak/lastQuizDate to satisfy validation rules
      await api.patch(`/users/${userId}/streak`)
      // Fetch and return the updated user
      const updatedUser = await this.getUserById(userId)
      return updatedUser
    } catch (error: any) {
      return handleApiError(error)
    }
  }
  // Onboarding APIs
  // async updateOnboarding(userId: string, payload: any): Promise<User> {
  //   try {
  //     const response = await api.patch(`/users/${userId}/onboarding`, payload)
  //     return handleApiResponse(response)
  //   } catch (error: any) {
  //     return handleApiError(error)
  //   }
  // }

  async updateProfileBasics(userId: string, payload: { avatar?: string; theme?: string; goals?: string[] }): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}/profile-basics`, payload)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async generateAssessment(userId: string, selectedSubjects: string[]): Promise<any> {
    const loadingToast = EnhancedToast.loading('Generating your personalized assessment...', {
      description: 'Creating questions based on your selected subjects'
    })

    try {
      const response = await RetryHandler.withRetry(
        () => api.post(`/quizzes/assessments/generate`, {
          user_id: userId,
          selected_subjects: selectedSubjects
        }),
        { maxRetries: 2, retryDelay: 2000 }
      )

      const result = handleApiResponse(response)
      
      EnhancedToast.updateLoading(loadingToast, 'Assessment ready!', {
        type: 'success',
        description: `${result?.questions?.length || 0} questions prepared for you`
      })

      return result
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleAssessmentError(error, `generate for subjects: ${selectedSubjects.join(', ')}`)
      EnhancedToast.updateLoading(loadingToast, serviceError.message, {
        type: 'error',
        description: serviceError.suggestions?.[0]
      })
      throw error
    }
  }

  async submitAssessment(userId: string, assessmentData: {
    answers: Array<{
      question_id: string
      user_answer: string
      time_taken: number
    }>
    started_at: string
    completed_at: string
  }): Promise<any> {
    const loadingToast = EnhancedToast.loading('Submitting your assessment...', {
      description: 'Analyzing your responses and calculating results'
    })

    try {
      const response = await RetryHandler.withRetry(
        () => api.post(`/users/assessments/submit`, {
          user_id: userId,
          ...assessmentData
        }),
        { maxRetries: 2, retryDelay: 1500 }
      )

      const result = handleApiResponse(response)
      
      EnhancedToast.updateLoading(loadingToast, 'Assessment submitted successfully!', {
        type: 'success',
        description: 'Your personalized learning profile is being created'
      })

      return result
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleAssessmentError(error, `submit (${assessmentData.answers.length} answers)`)
      EnhancedToast.updateLoading(loadingToast, serviceError.message, {
        type: 'error',
        description: serviceError.suggestions?.[0]
      })
      throw error
    }
  }

  async completeOnboarding(userId: string, onboardingData: any): Promise<any> {
    const loadingToast = EnhancedToast.loading('Completing your onboarding...', {
      description: 'Setting up your personalized learning experience'
    })

    try {
      const response = await RetryHandler.withRetry(
        () => api.post(`/users/${userId}/complete-onboarding`, {
          ...onboardingData,
          // Include assessment results in completion
          assessment_results: onboardingData.assessment_results
        }),
        { maxRetries: 2, retryDelay: 2000 }
      )

      const result = handleApiResponse(response)
      
      EnhancedToast.updateLoading(loadingToast, 'Welcome to EduAssist! 🎉', {
        type: 'success',
        description: 'Your personalized learning journey is ready to begin'
      })

      return result
    } catch (error: any) {
      const serviceError = ServiceErrorHandler.handleUserError(error, 'complete onboarding')
      EnhancedToast.updateLoading(loadingToast, serviceError.message, {
        type: 'error',
        description: serviceError.suggestions?.[0]
      })
      throw error
    }
  }

  // Onboarding progress tracking
  async getOnboardingProgress(userId: string): Promise<any> {
    try {
      const response = await api.get(`/users/${userId}/onboarding-progress`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async saveOnboardingProgress(userId: string, progressData: any): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/save-onboarding-progress`, progressData)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Update onboarding step
  async updateOnboarding(userId: string, payload: { step: string, [key: string]: any }): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}/onboarding`, payload);
      const backendUser = handleApiResponse(response) as BackendUser;
      return convertBackendUser(backendUser);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Gamification API methods
  async getUserGamificationStats(userId: string): Promise<{
    xp: number
    level: number
    streak: { current: number; longest: number }
  }> {
    try {
      const response = await api.get(`/users/${userId}/stats`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/users/${userId}/badges`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async getUserQuests(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/users/${userId}/quests`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async completeQuest(userId: string, questId: string): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/quests/${questId}/complete`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async unlockBadge(userId: string, badgeId: string): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/badges/${badgeId}/unlock`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Enhanced methods for post-onboarding experience
  async validateUserPreferences(userId: string): Promise<{
    hasPreferences: boolean
    hasGoals: boolean
    hasOnboardingData: boolean
    isComplete: boolean
    details: any
  }> {
    try {
      const user = await this.getUserById(userId)
      
      const hasPreferences = !!(user.preferences && user.preferences.length > 0)
      const hasGoals = !!(user.goals && user.goals.length > 0)
      const hasOnboardingPreferences = !!(user.onboarding?.preferences && user.onboarding.preferences.length > 0)
      const hasOnboardingGoals = !!(user.onboarding?.goals)
      const hasAssessmentResults = !!(user.onboarding?.assessment_results)
      
      const hasOnboardingData = hasOnboardingPreferences || hasOnboardingGoals || hasAssessmentResults
      const isComplete = (hasPreferences || hasOnboardingPreferences) && 
                        (hasGoals || hasOnboardingGoals) && 
                        hasAssessmentResults

      return {
        hasPreferences: hasPreferences || hasOnboardingPreferences,
        hasGoals: hasGoals || hasOnboardingGoals,
        hasOnboardingData,
        isComplete,
        details: {
          preferences: user.preferences || [],
          goals: user.goals || [],
          onboardingPreferences: user.onboarding?.preferences || [],
          onboardingGoals: user.onboarding?.goals,
          assessmentResults: user.onboarding?.assessment_results,
          onboardingStatus: user.onboarding?.status
        }
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async updateUserPreferences(userId: string, preferences: string[]): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}`, { preferences })
      const backendUser = handleApiResponse(response) as BackendUser
      return convertBackendUser(backendUser)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async updateUserGoals(userId: string, goals: string[]): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}`, { goals })
      const backendUser = handleApiResponse(response) as BackendUser
      return convertBackendUser(backendUser)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async syncOnboardingToProfile(userId: string): Promise<User> {
    try {
      // Get current user data
      const user = await this.getUserById(userId)
      
      // Prepare data to sync from onboarding to main profile
      const updateData: any = {}
      
      // Sync preferences if not already set
      if (!user.preferences || user.preferences.length === 0) {
        if (user.onboarding?.preferences && user.onboarding.preferences.length > 0) {
          updateData.preferences = user.onboarding.preferences
        }
      }
      
      // Sync goals if not already set
      if (!user.goals || user.goals.length === 0) {
        if (user.onboarding?.goals) {
          // Convert onboarding goals structure to simple goals array
          const goals = []
          if (user.onboarding.goals.primary_goal) goals.push(user.onboarding.goals.primary_goal)
          if (user.onboarding.goals.focus_areas) goals.push(...user.onboarding.goals.focus_areas)
          if (user.onboarding.goals.custom_goal) goals.push(user.onboarding.goals.custom_goal)
          updateData.goals = goals.filter(Boolean)
        }
      }
      
      // Update user if there's data to sync
      if (Object.keys(updateData).length > 0) {
        const response = await api.patch(`/users/${userId}`, updateData)
        const backendUser = handleApiResponse(response) as BackendUser
        return convertBackendUser(backendUser)
      }
      
      return user
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async initializePostOnboardingExperience(userId: string): Promise<{
    user: User
    preferencesValidation: any
    recommendationsTriggered: boolean
  }> {
    try {
      // Sync onboarding data to profile
      const user = await this.syncOnboardingToProfile(userId)
      
      // Validate preferences
      const preferencesValidation = await this.validateUserPreferences(userId)
      
      // This method would typically trigger recommendation generation
      // but that's handled by the recommendation service
      
      return {
        user,
        preferencesValidation,
        recommendationsTriggered: preferencesValidation.isComplete
      }
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  async getUserPreferences(): Promise<preferences[]> {
    try {
      const response = await api.get(`/users/preferences`)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }
}

export const userService = new UserService()
export default userService
