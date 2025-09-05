import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import { subjectService } from '@/services/subjectService'
import { recommendationService } from '@/services/recommendationService'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'
import { AssessmentSubmission, User } from '@/types'

// Query keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  progress: (userId: string) => [...onboardingKeys.all, 'progress', userId] as const,
  subjects: () => [...onboardingKeys.all, 'subjects'] as const,
  assessment: (userId: string) => [...onboardingKeys.all, 'assessment', userId] as const,
}

// Get onboarding progress
export function useOnboardingProgress(userId?: string) {
  return useQuery({
    queryKey: onboardingKeys.progress(userId || ''),
    queryFn: () => userService.getOnboardingProgress(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

// Get subjects for onboarding
export function useOnboardingSubjects() {
  return useQuery({
    queryKey: onboardingKeys.subjects(),
    queryFn: () => subjectService.getAllSubjects(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  })
}

// Save onboarding progress mutation
export function useSaveOnboardingProgress() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (progressData: any) => 
      userService.saveOnboardingProgress(user!.id, progressData),
    onSuccess: (data, variables) => {
      // Update the progress cache
      queryClient.setQueryData(
        onboardingKeys.progress(user!.id),
        data
      )
    },
    onError: (error: any) => {
      console.error('Failed to save onboarding progress:', error)
      toast.error('Failed to save progress')
    },
  })
}

// Generate assessment mutation
export function useGenerateAssessment() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: (selectedSubjects: string[]) => 
      userService.generateAssessment(user!.id, selectedSubjects),
    onSuccess: (data) => {
      // Cache the assessment data
      queryClient.setQueryData(
        onboardingKeys.assessment(user!.id),
        data
      )
      toast.success('Assessment prepared! Let\'s begin.')
    },
    onError: (error: any) => {
      console.error('Failed to generate assessment:', error)
      toast.error('Failed to prepare assessment. Please try again.')
    },
  })
}

// Submit assessment mutation
export function useSubmitAssessment() {
  const queryClient = useQueryClient()
  const { user, setUser } = useUserStore()

  return useMutation({
    mutationFn: (assessmentData: AssessmentSubmission) => userService.submitAssessment(user!.id, assessmentData),
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: onboardingKeys.progress(user!.id) })
      queryClient.invalidateQueries({ queryKey: ['performance', 'user', user!.id] })
      
      toast.success('Assessment completed! 🎉')
      userService.getUserById(user!.id).then((updatedUser: User) => setUser(updatedUser));
      return data
    },
    onError: (error: any) => {
      console.error('Failed to submit assessment:', error)
      toast.error('Failed to submit assessment. Please try again.')
    },
  })
}

// Complete onboarding mutation
export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  const { user, setUser } = useUserStore()

  return useMutation({
    mutationFn: (onboardingData: any) => 
      userService.completeOnboarding(user!.id, onboardingData),
    onSuccess: async (data) => {
      // Refresh user data to get updated XP and level
      const updatedUser = await userService.getUserById(user!.id);
      setUser(updatedUser);
      
      // Trigger initial recommendation generation based on assessment results
      try {
        if (onboardingData.assessment_results) {
          // Generate recommendations based on assessment results
          await recommendationService.generateRecommendations(user!.id)
        }
      } catch (error) {
        console.error('Failed to generate initial recommendations:', error)
        // Don't fail onboarding if recommendations fail
      }
      
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['performance'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
      
      toast.success('Welcome to EduAssist! Your learning journey begins now! 🚀')
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
    },
    onError: (error: any) => {
      console.error('Failed to complete onboarding:', error)
      toast.error('Failed to complete setup. Please try again.')
    },
  })
}
