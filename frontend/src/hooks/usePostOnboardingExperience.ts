import { useEffect, useMemo, useRef } from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { useAssessmentResultsStore } from '@/stores/assessmentResultsStore'
import { useUserRecommendations, useGenerateRecommendations, useStudyPlan } from '@/hooks/useRecommendationData'
import { useUserStats } from '@/hooks/useGamificationData'

/**
 * Hook to manage post-onboarding user experience
 * Ensures dashboard shows personalized content based on assessment results
 * and connects to backend's intelligent recommendation system
 */
export function usePostOnboardingExperience() {
    const { user } = useUserStore()
    const { results: assessmentResults } = useAssessmentResultsStore()
    const { data: recommendations, isLoading: recommendationsLoading } = useUserRecommendations(undefined, 5)
    const { data: studyPlan, isLoading: studyPlanLoading } = useStudyPlan()
    const { data: userStats } = useUserStats()
    const generateRecommendations = useGenerateRecommendations()
    const initFlagKey = useMemo(() => user?.id ? `ea__initial_recs_done:${user.id}` : undefined, [user?.id])

    // Check if user has completed onboarding but lacks recommendations
    const needsInitialRecommendations = useMemo(() => {
        if (!user || !user.onboarding) return false

        const onboardingCompleted = user.onboarding.status === 'COMPLETED'
        const hasAssessmentResults = !!assessmentResults || !!user.onboarding.assessment_results
        const lacksRecommendations = !recommendations || recommendations.length === 0

        return onboardingCompleted && hasAssessmentResults && lacksRecommendations
    }, [user, assessmentResults, recommendations])

    // Generate initial recommendations if needed (guard to prevent loops)
    const ranRef = useRef(false)
    useEffect(() => {
        if (!initFlagKey) return
        if (ranRef.current || localStorage.getItem(initFlagKey) === '1') return
        if (needsInitialRecommendations && !generateRecommendations.isPending && user?.id) {
            ranRef.current = true
            localStorage.setItem(initFlagKey, '1')
            console.log('Generating initial recommendations for post-onboarding experience')
            generateRecommendations.mutate(user.id)
        }
    }, [needsInitialRecommendations, generateRecommendations.isPending, user?.id, initFlagKey])

    // Get personalized content based on assessment results
    const personalizedContent = useMemo(() => {
        const results = assessmentResults || user?.onboarding?.assessment_results
        if (!results) return null

        const weakSubjects = results.subject_analysis?.filter((s: any) => s.score_percentage < 60) || []
        const strongSubjects = results.subject_analysis?.filter((s: any) => s.score_percentage >= 80) || []
        const focusAreas = results.recommendations?.focus_areas || []
        const studyPlan = results.recommendations?.study_plan || []

        return {
            weakSubjects,
            strongSubjects,
            focusAreas,
            studyPlan,
            recommendedDailyQuestions: results.recommendations?.recommended_daily_questions || 5,
            overallProficiency: results.overall_proficiency || 'BEGINNER',
            overallScore: results.overall_score || 0
        }
    }, [assessmentResults, user])

    // Get personalized greeting based on performance and time
    const personalizedGreeting = useMemo(() => {
        if (!user) return 'Welcome!'

        const hour = new Date().getHours()
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

        if (personalizedContent) {
            const { overallProficiency, focusAreas } = personalizedContent

            if (overallProficiency === 'ADVANCED') {
                return `${timeGreeting}, ${user.name}! Ready to master new challenges?`
            } else if (overallProficiency === 'INTERMEDIATE') {
                return `${timeGreeting}, ${user.name}! Let's build on your progress today.`
            } else if (focusAreas.length > 0) {
                return `${timeGreeting}, ${user.name}! Focus on ${focusAreas[0]} today.`
            }
        }

        return `${timeGreeting}, ${user.name}! Ready to level up your learning?`
    }, [user, personalizedContent])

    // Get next recommended actions based on assessment results and recommendations
    const nextActions = useMemo(() => {
        const actions: Array<{
            type: string
            title: string
            description: string
            priority: 'high' | 'medium' | 'low'
            xpReward: number
            recommendationId?: string
            route?: string
        }> = []

        // Add weak subject practice if available
        if (personalizedContent?.weakSubjects && personalizedContent.weakSubjects.length > 0) {
            const weakestSubject = personalizedContent.weakSubjects[0]
            actions.push({
                type: 'practice_weak_area',
                title: `Practice ${weakestSubject.subject_name}`,
                description: `Improve your ${weakestSubject.subject_name} skills (${Math.round(weakestSubject.score_percentage)}% current)`,
                priority: 'high',
                xpReward: 100,
                route: `/subjects/${weakestSubject.subject_id}`
            })
        }

        // Add top recommendation if available
        if (recommendations && recommendations.length > 0) {
            const topRecommendation = recommendations[0]
            actions.push({
                type: 'follow_recommendation',
                title: topRecommendation.title,
                description: topRecommendation.description,
                priority: (topRecommendation.priority as 'high' | 'medium' | 'low') || 'medium',
                xpReward: 80,
                recommendationId: topRecommendation.id,
                route: topRecommendation.metadata?.route
            })
        }

        // Add daily practice session
        if (personalizedContent?.recommendedDailyQuestions) {
            actions.push({
                type: 'daily_practice',
                title: 'Daily Practice Session',
                description: `Complete ${personalizedContent.recommendedDailyQuestions} questions today`,
                priority: 'medium',
                xpReward: 50,
                route: '/quiz/quick'
            })
        }

        // Add study plan action if available
        if (studyPlan && studyPlan.currentMilestone) {
            actions.push({
                type: 'study_plan',
                title: 'Continue Study Plan',
                description: studyPlan.currentMilestone.title,
                priority: 'medium',
                xpReward: 75,
                route: '/study-plan'
            })
        }

        return actions.slice(0, 3) // Return top 3 actions
    }, [personalizedContent, recommendations, studyPlan])

    // Check if user preferences and goals are properly stored and used
    const preferencesStatus = useMemo(() => {
        if (!user) return { stored: false, used: false, details: {} }

        // Check if preferences are stored
        const hasPreferences = !!(user.preferences && user.preferences.length > 0)
        const hasOnboardingPreferences = !!(user.onboarding?.preferences && user.onboarding.preferences.length > 0)
        const hasGoals = !!(user.goals && user.goals.length > 0)
        const hasOnboardingGoals = !!(user.onboarding?.goals)

        const stored = hasPreferences || hasOnboardingPreferences || hasGoals || hasOnboardingGoals

        // Check if preferences are being used (evidenced by personalized content)
        const hasPersonalizedContent = !!personalizedContent
        const hasRecommendations = !!(recommendations && recommendations.length > 0)
        const hasStudyPlan = !!studyPlan

        const used = hasPersonalizedContent || hasRecommendations || hasStudyPlan

        return { 
            stored, 
            used,
            details: {
                hasPreferences,
                hasOnboardingPreferences,
                hasGoals,
                hasOnboardingGoals,
                hasPersonalizedContent,
                hasRecommendations,
                hasStudyPlan
            }
        }
    }, [user, personalizedContent, recommendations, studyPlan])

    // Enhanced dashboard content based on assessment results
    const dashboardContent = useMemo(() => {
        if (!personalizedContent) return null

        return {
            welcomeMessage: personalizedGreeting,
            focusAreas: personalizedContent.focusAreas.slice(0, 3),
            weakSubjects: personalizedContent.weakSubjects.slice(0, 3),
            strongSubjects: personalizedContent.strongSubjects.slice(0, 3),
            dailyGoal: personalizedContent.recommendedDailyQuestions,
            proficiencyLevel: personalizedContent.overallProficiency,
            overallScore: personalizedContent.overallScore,
            nextSteps: nextActions
        }
    }, [personalizedContent, personalizedGreeting, nextActions])

    return {
        // Data
        personalizedContent,
        recommendations: recommendations || [],
        studyPlan,
        userStats,
        dashboardContent,

        // UI Content
        personalizedGreeting,
        nextActions,

        // Status
        isLoading: recommendationsLoading || generateRecommendations.isPending || studyPlanLoading,
        needsInitialRecommendations,
        preferencesStatus,

        // Actions
        generateInitialRecommendations: () => {
            if (user?.id) {
                generateRecommendations.mutate(user.id)
            }
        },

        // Validation
        isPostOnboardingSetupComplete: !needsInitialRecommendations && preferencesStatus.stored && preferencesStatus.used,
        
        // Enhanced validation for requirements
        validationStatus: {
            assessmentResultsStored: !!personalizedContent,
            preferencesStored: preferencesStatus.stored,
            preferencesUsed: preferencesStatus.used,
            recommendationsGenerated: !!(recommendations && recommendations.length > 0),
            dashboardPersonalized: !!dashboardContent,
            setupComplete: !needsInitialRecommendations && preferencesStatus.stored && preferencesStatus.used
        }
    }
}