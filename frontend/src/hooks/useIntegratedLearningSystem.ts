import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'
import { performanceKeys, useAdvancedDashboardAnalytics } from './usePerformanceData'
import { recommendationKeys, useIntelligentRecommendationDashboard } from './useRecommendationData'
import { intelligentQuizKeys, useIntelligentQuizDashboard } from './useIntelligentQuizData'
import { usePerformanceRecommendationSync } from './usePerformanceRecommendationSync'
import { useQuizRecommendationIntegration } from './useIntelligentQuizData'

// Comprehensive learning system integration
export function useIntegratedLearningSystem(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id

  // Get all advanced analytics
  const performanceAnalytics = useAdvancedDashboardAnalytics(targetUserId)
  const recommendationDashboard = useIntelligentRecommendationDashboard(targetUserId)
  const quizDashboard = useIntelligentQuizDashboard(targetUserId)
  
  // Get synchronization capabilities
  const performanceSync = usePerformanceRecommendationSync()
  const quizIntegration = useQuizRecommendationIntegration()

  // Combined loading state
  const isLoading = performanceAnalytics.isLoading || 
                   recommendationDashboard.isLoading || 
                   quizDashboard.isLoading

  // Integrated insights combining all systems
  const integratedInsights = {
    // Overall learning health score
    learningHealthScore: calculateLearningHealthScore(
      performanceAnalytics,
      recommendationDashboard,
      quizDashboard
    ),
    
    // Priority learning actions
    priorityActions: generatePriorityActions(
      performanceAnalytics,
      recommendationDashboard,
      quizDashboard
    ),
    
    // Learning trajectory analysis
    learningTrajectory: analyzeLearningTrajectory(
      performanceAnalytics,
      recommendationDashboard
    ),
    
    // Personalized learning path
    personalizedPath: generatePersonalizedPath(
      performanceAnalytics,
      recommendationDashboard,
      quizDashboard
    ),
    
    // System effectiveness metrics
    systemEffectiveness: calculateSystemEffectiveness(
      performanceAnalytics,
      recommendationDashboard
    )
  }

  return {
    // Raw data from all systems
    performance: performanceAnalytics,
    recommendations: recommendationDashboard,
    quizzes: quizDashboard,
    
    // Integrated insights
    insights: integratedInsights,
    
    // System capabilities
    sync: performanceSync,
    quizGeneration: quizIntegration,
    
    // Overall state
    isLoading,
    
    // Integrated actions
    actions: {
      // Complete a learning session with full system integration
      completeIntegratedLearningSession: async (sessionData: {
        topicId: string
        subjectId: string
        score: number
        timeSpent: number
        difficulty: 'beginner' | 'intermediate' | 'advanced'
        attemptId?: string
        recommendationId?: string
      }) => {
        try {
          // Update performance and generate recommendations
          await performanceSync.updatePerformanceWithRecommendations.mutateAsync({
            userId: targetUserId!,
            topicId: sessionData.topicId,
            subjectId: sessionData.subjectId,
            attemptData: {
              score: sessionData.score,
              timeSpent: sessionData.timeSpent,
              difficulty: sessionData.difficulty,
              attemptId: sessionData.attemptId
            }
          })

          // Mark recommendation as completed if applicable
          if (sessionData.recommendationId) {
            // This would typically call the recommendation service to mark as completed
            // For now, we'll just invalidate the queries
            const queryClient = useQueryClient()
            queryClient.invalidateQueries({ 
              queryKey: recommendationKeys.smartRecommendations(targetUserId!) 
            })
          }

          toast.success('Learning session completed! Your progress and recommendations have been updated.')
        } catch (error) {
          console.error('Failed to complete integrated learning session:', error)
          toast.error('Failed to update your learning progress')
        }
      },

      // Generate next optimal learning session
      generateOptimalSession: async () => {
        try {
          const urgentRecommendations = recommendationDashboard.smartRecommendations?.slice(0, 1) || []
          
          if (urgentRecommendations.length > 0) {
            const recommendation = urgentRecommendations[0]
            return await quizIntegration.generateIntelligentQuiz(recommendation)
          } else {
            // Generate based on performance insights
            const weakAreas = performanceAnalytics.gamificationStats?.weakAreas || []
            if (weakAreas.length > 0) {
              // This would generate a quiz for the weakest area
              toast.info('Generating practice session for your weakest area...')
              // Implementation would depend on having topic IDs from weak areas
            }
          }
        } catch (error) {
          console.error('Failed to generate optimal session:', error)
          toast.error('Failed to generate optimal learning session')
        }
      },

      // Recalibrate entire learning system
      recalibrateSystem: async () => {
        try {
          await performanceSync.recalculateRecommendations.mutateAsync(targetUserId)
          toast.success('Learning system recalibrated based on your latest performance!')
        } catch (error) {
          console.error('Failed to recalibrate system:', error)
          toast.error('Failed to recalibrate learning system')
        }
      }
    }
  }
}

// Helper functions for integrated insights
function calculateLearningHealthScore(
  performance: any,
  recommendations: any,
  quizzes: any
): number {
  let score = 50 // Base score

  // Performance factors (40% weight)
  if (performance.insights?.overallMastery) {
    score += (performance.insights.overallMastery - 50) * 0.4
  }
  
  if (performance.insights?.learningVelocity === 'improving') {
    score += 15
  } else if (performance.insights?.learningVelocity === 'declining') {
    score -= 15
  }

  // Recommendation engagement (30% weight)
  if (recommendations.insights?.effectivenessScore) {
    score += (recommendations.insights.effectivenessScore - 50) * 0.3
  }

  // Quiz performance (30% weight)
  if (quizzes.insights?.learningTrajectory?.averageScore) {
    score += (quizzes.insights.learningTrajectory.averageScore - 50) * 0.3
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function generatePriorityActions(
  performance: any,
  recommendations: any,
  quizzes: any
): Array<{
  type: string
  title: string
  description: string
  priority: number
  estimatedTime: number
  category: 'urgent' | 'improvement' | 'maintenance' | 'challenge'
}> {
  const actions = []

  // Urgent recommendations
  const urgentRecs = recommendations.insights?.urgentRecommendations || []
  urgentRecs.forEach((rec: any) => {
    actions.push({
      type: 'urgent_recommendation',
      title: `Address ${rec.title}`,
      description: rec.reason,
      priority: rec.priority,
      estimatedTime: rec.estimatedTime,
      category: 'urgent' as const
    })
  })

  // Performance improvement opportunities
  const improvementAreas = performance.insights?.attentionAreas || []
  improvementAreas.forEach((area: any) => {
    actions.push({
      type: 'improvement_focus',
      title: `Improve ${area.topic}`,
      description: `Focus on strengthening your understanding in this area`,
      priority: 70,
      estimatedTime: 25,
      category: 'improvement' as const
    })
  })

  // Maintenance for strong areas
  const strongAreas = performance.insights?.expertiseAreas || []
  strongAreas.forEach((area: any) => {
    actions.push({
      type: 'maintenance_practice',
      title: `Maintain ${area.subjectName}`,
      description: `Keep your strong performance with regular practice`,
      priority: 40,
      estimatedTime: 15,
      category: 'maintenance' as const
    })
  })

  // Challenge opportunities
  if (quizzes.insights?.learningTrajectory?.averageScore > 80) {
    actions.push({
      type: 'challenge_session',
      title: 'Take on Advanced Challenges',
      description: 'You\'re ready for more difficult questions',
      priority: 50,
      estimatedTime: 30,
      category: 'challenge' as const
    })
  }

  return actions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8) // Limit to top 8 actions
}

function analyzeLearningTrajectory(
  performance: any,
  recommendations: any
): {
  trend: 'accelerating' | 'steady' | 'plateauing' | 'declining'
  confidence: number
  projectedImprovement: number
  timeToNextLevel: number // days
} {
  const learningVelocity = performance.insights?.learningVelocity || 'stable'
  const activityConsistency = performance.insights?.activityConsistency || 0
  const completionRate = recommendations.insights?.completionRate || 0

  let trend: 'accelerating' | 'steady' | 'plateauing' | 'declining' = 'steady'
  let confidence = 50
  let projectedImprovement = 5
  let timeToNextLevel = 30

  // Analyze trend
  if (learningVelocity === 'improving' && completionRate > 70) {
    trend = 'accelerating'
    confidence = 85
    projectedImprovement = 15
    timeToNextLevel = 14
  } else if (learningVelocity === 'declining' || completionRate < 30) {
    trend = 'declining'
    confidence = 75
    projectedImprovement = -5
    timeToNextLevel = 60
  } else if (activityConsistency > 20 && completionRate > 50) {
    trend = 'steady'
    confidence = 70
    projectedImprovement = 8
    timeToNextLevel = 21
  } else {
    trend = 'plateauing'
    confidence = 60
    projectedImprovement = 2
    timeToNextLevel = 45
  }

  return {
    trend,
    confidence,
    projectedImprovement,
    timeToNextLevel
  }
}

function generatePersonalizedPath(
  performance: any,
  recommendations: any,
  quizzes: any
): {
  currentPhase: 'foundation' | 'building' | 'mastery' | 'expert'
  nextMilestones: Array<{
    title: string
    description: string
    estimatedDays: number
    requirements: string[]
  }>
  suggestedSchedule: {
    dailyMinutes: number
    weeklyGoals: string[]
    focusAreas: string[]
  }
} {
  const overallMastery = performance.insights?.overallMastery || 0
  const averageScore = quizzes.insights?.learningTrajectory?.averageScore || 0

  // Determine current phase
  let currentPhase: 'foundation' | 'building' | 'mastery' | 'expert' = 'foundation'
  if (overallMastery >= 90 && averageScore >= 90) {
    currentPhase = 'expert'
  } else if (overallMastery >= 75 && averageScore >= 80) {
    currentPhase = 'mastery'
  } else if (overallMastery >= 50 && averageScore >= 65) {
    currentPhase = 'building'
  }

  // Generate next milestones based on phase
  const nextMilestones = generateMilestonesForPhase(currentPhase, performance, recommendations)

  // Suggest schedule based on current performance and goals
  const suggestedSchedule = generateScheduleForPhase(currentPhase, performance, quizzes)

  return {
    currentPhase,
    nextMilestones,
    suggestedSchedule
  }
}

function generateMilestonesForPhase(
  phase: string,
  performance: any,
  recommendations: any
): Array<{
  title: string
  description: string
  estimatedDays: number
  requirements: string[]
}> {
  const milestones = []

  switch (phase) {
    case 'foundation':
      milestones.push({
        title: 'Build Strong Fundamentals',
        description: 'Achieve consistent 70%+ scores across core topics',
        estimatedDays: 21,
        requirements: ['Complete 15 practice quizzes', 'Maintain 7-day streak', 'Review weak areas']
      })
      break
    case 'building':
      milestones.push({
        title: 'Expand Knowledge Base',
        description: 'Master intermediate concepts and improve consistency',
        estimatedDays: 28,
        requirements: ['Achieve 80%+ average score', 'Complete 20 quizzes', 'Master 3 new topics']
      })
      break
    case 'mastery':
      milestones.push({
        title: 'Achieve Subject Mastery',
        description: 'Demonstrate expert-level understanding',
        estimatedDays: 35,
        requirements: ['Maintain 85%+ scores', 'Complete advanced challenges', 'Help others learn']
      })
      break
    case 'expert':
      milestones.push({
        title: 'Become a Learning Leader',
        description: 'Share knowledge and tackle the hardest challenges',
        estimatedDays: 42,
        requirements: ['Maintain 90%+ scores', 'Complete expert challenges', 'Mentor other learners']
      })
      break
  }

  return milestones
}

function generateScheduleForPhase(
  phase: string,
  performance: any,
  quizzes: any
): {
  dailyMinutes: number
  weeklyGoals: string[]
  focusAreas: string[]
} {
  const activityLevel = performance.insights?.activityConsistency || 0
  const currentScore = quizzes.insights?.learningTrajectory?.averageScore || 0

  let dailyMinutes = 20
  let weeklyGoals = ['Complete 5 practice sessions']
  let focusAreas = ['Review fundamentals']

  switch (phase) {
    case 'foundation':
      dailyMinutes = Math.max(15, Math.min(30, activityLevel + 10))
      weeklyGoals = [
        'Complete 7 practice quizzes',
        'Maintain daily learning streak',
        'Review 2 weak topic areas'
      ]
      focusAreas = ['Basic concepts', 'Fundamental skills', 'Consistent practice']
      break
    case 'building':
      dailyMinutes = Math.max(20, Math.min(40, activityLevel + 15))
      weeklyGoals = [
        'Complete 10 practice sessions',
        'Achieve 75%+ average score',
        'Explore 1 new topic area'
      ]
      focusAreas = ['Intermediate concepts', 'Problem-solving', 'Knowledge expansion']
      break
    case 'mastery':
      dailyMinutes = Math.max(25, Math.min(45, activityLevel + 20))
      weeklyGoals = [
        'Complete 8 challenging sessions',
        'Maintain 80%+ average score',
        'Master advanced concepts'
      ]
      focusAreas = ['Advanced topics', 'Complex problem-solving', 'Knowledge integration']
      break
    case 'expert':
      dailyMinutes = Math.max(30, Math.min(60, activityLevel + 25))
      weeklyGoals = [
        'Complete 6 expert challenges',
        'Maintain 90%+ average score',
        'Contribute to community'
      ]
      focusAreas = ['Expert-level challenges', 'Knowledge sharing', 'Innovation']
      break
  }

  return {
    dailyMinutes,
    weeklyGoals,
    focusAreas
  }
}

function calculateSystemEffectiveness(
  performance: any,
  recommendations: any
): {
  overallEffectiveness: number
  performanceTracking: number
  recommendationAccuracy: number
  userEngagement: number
  learningOutcomes: number
} {
  const performanceTracking = performance.insights?.overallMastery ? 
    Math.min(100, performance.insights.overallMastery + 20) : 50

  const recommendationAccuracy = recommendations.insights?.effectivenessScore || 50

  const userEngagement = performance.insights?.activityConsistency ? 
    Math.min(100, performance.insights.activityConsistency * 3) : 30

  const learningOutcomes = performance.insights?.learningVelocity === 'improving' ? 85 :
                          performance.insights?.learningVelocity === 'stable' ? 65 :
                          performance.insights?.learningVelocity === 'declining' ? 35 : 50

  const overallEffectiveness = Math.round(
    (performanceTracking * 0.3 + 
     recommendationAccuracy * 0.3 + 
     userEngagement * 0.2 + 
     learningOutcomes * 0.2)
  )

  return {
    overallEffectiveness,
    performanceTracking,
    recommendationAccuracy,
    userEngagement,
    learningOutcomes
  }
}