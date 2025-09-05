import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/stores/useUserStore'
import { useIntelligentRecommendationSystem } from './useIntelligentRecommendations'
import { intelligentRecommendationKeys } from './useIntelligentRecommendations'
import { recommendationKeys } from './useRecommendationData'
import { toast } from 'sonner'

// Interface for tracking user behavior patterns
interface UserBehaviorPattern {
  action: string
  timestamp: number
  context: {
    subjectId?: string
    topicId?: string
    difficulty?: string
    timeSpent?: number
    score?: number
    sessionDuration?: number
  }
  metadata?: Record<string, any>
}

// Interface for behavior-based recommendation triggers
interface BehaviorRecommendationTrigger {
  behaviorType: 'quiz_completion' | 'topic_exploration' | 'difficulty_change' | 'time_spent' | 'streak_milestone' | 'performance_pattern'
  intensity: 'low' | 'medium' | 'high' // How significant the behavior change is
  context: {
    subjectId?: string
    topicId?: string
    previousPerformance?: number
    currentPerformance?: number
    timeSpent?: number
    difficulty?: string
    streakCount?: number
  }
  shouldUpdateRecommendations: boolean
}

// Hook for syncing recommendations based on user behavior patterns
export function useUserBehaviorRecommendationSync(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id
  const queryClient = useQueryClient()
  const behaviorHistoryRef = useRef<UserBehaviorPattern[]>([])
  const lastUpdateRef = useRef<number>(0)

  const {
    syncRecommendationsAfterPerformance,
    isRegenerating,
  } = useIntelligentRecommendationSystem(targetUserId)

  // Analyze behavior patterns to determine if recommendations should be updated
  const analyzeBehaviorPattern = useCallback((behaviors: UserBehaviorPattern[]): BehaviorRecommendationTrigger | null => {
    if (behaviors.length < 2) return null

    const recentBehaviors = behaviors.slice(-5) // Last 5 behaviors
    const now = Date.now()
    const recentTimeWindow = 30 * 60 * 1000 // 30 minutes

    // Filter behaviors within recent time window
    const recentRelevantBehaviors = recentBehaviors.filter(b => 
      now - b.timestamp < recentTimeWindow
    )

    if (recentRelevantBehaviors.length === 0) return null

    // Detect quiz completion patterns
    const quizCompletions = recentRelevantBehaviors.filter(b => b.action === 'quiz_completed')
    if (quizCompletions.length >= 2) {
      const scores = quizCompletions.map(b => b.context.score || 0)
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const scoreVariance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length

      // High variance in scores suggests need for recommendation update
      if (scoreVariance > 400) { // Significant score variation
        return {
          behaviorType: 'quiz_completion',
          intensity: 'high',
          context: {
            subjectId: quizCompletions[quizCompletions.length - 1].context.subjectId,
            topicId: quizCompletions[quizCompletions.length - 1].context.topicId,
            currentPerformance: scores[scores.length - 1],
            previousPerformance: scores.length > 1 ? scores[scores.length - 2] : undefined,
          },
          shouldUpdateRecommendations: true,
        }
      }
    }

    // Detect difficulty exploration patterns
    const difficultyChanges = recentRelevantBehaviors.filter(b => b.action === 'difficulty_changed')
    if (difficultyChanges.length >= 2) {
      return {
        behaviorType: 'difficulty_change',
        intensity: 'medium',
        context: {
          difficulty: difficultyChanges[difficultyChanges.length - 1].context.difficulty,
          subjectId: difficultyChanges[difficultyChanges.length - 1].context.subjectId,
        },
        shouldUpdateRecommendations: true,
      }
    }

    // Detect extended study sessions
    const totalTimeSpent = recentRelevantBehaviors.reduce((sum, b) => sum + (b.context.timeSpent || 0), 0)
    if (totalTimeSpent > 60 * 60 * 1000) { // More than 1 hour in recent session
      return {
        behaviorType: 'time_spent',
        intensity: 'high',
        context: {
          timeSpent: totalTimeSpent,
          subjectId: recentRelevantBehaviors[recentRelevantBehaviors.length - 1].context.subjectId,
        },
        shouldUpdateRecommendations: true,
      }
    }

    // Detect streak milestones
    const streakBehaviors = recentRelevantBehaviors.filter(b => b.action === 'streak_updated')
    if (streakBehaviors.length > 0) {
      const latestStreak = streakBehaviors[streakBehaviors.length - 1].context.sessionDuration || 0
      if (latestStreak > 0 && latestStreak % 7 === 0) { // Weekly streak milestone
        return {
          behaviorType: 'streak_milestone',
          intensity: 'medium',
          context: {
            streakCount: latestStreak,
          },
          shouldUpdateRecommendations: true,
        }
      }
    }

    return null
  }, [])

  // Track user behavior and update recommendations accordingly
  const trackBehavior = useCallback((behavior: UserBehaviorPattern) => {
    if (!targetUserId) return

    // Add to behavior history
    behaviorHistoryRef.current.push(behavior)

    // Keep only last 50 behaviors to prevent memory issues
    if (behaviorHistoryRef.current.length > 50) {
      behaviorHistoryRef.current = behaviorHistoryRef.current.slice(-50)
    }

    // Analyze behavior pattern
    const trigger = analyzeBehaviorPattern(behaviorHistoryRef.current)
    
    if (trigger && trigger.shouldUpdateRecommendations) {
      // Throttle updates to prevent excessive API calls (max once per 5 minutes)
      const now = Date.now()
      if (now - lastUpdateRef.current > 5 * 60 * 1000) {
        lastUpdateRef.current = now

        // Trigger recommendation update based on behavior
        syncRecommendationsAfterPerformance({
          subjectId: trigger.context.subjectId || '',
          topicId: trigger.context.topicId,
          score: trigger.context.currentPerformance || 0,
          averageScore: trigger.context.previousPerformance,
        })

        // Show contextual feedback based on behavior type
        switch (trigger.behaviorType) {
          case 'quiz_completion':
            if (trigger.intensity === 'high') {
              toast.success('Your performance pattern has been analyzed! 📊 Updated recommendations available.')
            }
            break
          case 'difficulty_change':
            toast.info('Difficulty preferences updated! 🎯 Recommendations adjusted to match your level.')
            break
          case 'time_spent':
            toast.success('Great study session! 🔥 New recommendations based on your dedication.')
            break
          case 'streak_milestone':
            toast.success(`${trigger.context.streakCount}-day streak! 🏆 Special recommendations unlocked.`)
            break
        }
      }
    }
  }, [targetUserId, analyzeBehaviorPattern, syncRecommendationsAfterPerformance])

  // Auto-track common user behaviors
  useEffect(() => {
    if (!targetUserId) return

    // Track quiz completions
    const handleQuizCompletion = (event: CustomEvent) => {
      trackBehavior({
        action: 'quiz_completed',
        timestamp: Date.now(),
        context: {
          subjectId: event.detail.subjectId,
          topicId: event.detail.topicId,
          score: event.detail.score,
          timeSpent: event.detail.timeSpent,
          difficulty: event.detail.difficulty,
        }
      })
    }

    // Track topic exploration
    const handleTopicExploration = (event: CustomEvent) => {
      trackBehavior({
        action: 'topic_explored',
        timestamp: Date.now(),
        context: {
          subjectId: event.detail.subjectId,
          topicId: event.detail.topicId,
          timeSpent: event.detail.timeSpent,
        }
      })
    }

    // Track difficulty changes
    const handleDifficultyChange = (event: CustomEvent) => {
      trackBehavior({
        action: 'difficulty_changed',
        timestamp: Date.now(),
        context: {
          difficulty: event.detail.difficulty,
          subjectId: event.detail.subjectId,
          topicId: event.detail.topicId,
        }
      })
    }

    // Track streak updates
    const handleStreakUpdate = (event: CustomEvent) => {
      trackBehavior({
        action: 'streak_updated',
        timestamp: Date.now(),
        context: {
          streakCount: event.detail.streakCount,
          sessionDuration: event.detail.sessionDuration,
        }
      })
    }

    // Track study session duration
    const handleStudySession = (event: CustomEvent) => {
      trackBehavior({
        action: 'study_session',
        timestamp: Date.now(),
        context: {
          timeSpent: event.detail.duration,
          subjectId: event.detail.subjectId,
          sessionDuration: event.detail.duration,
        }
      })
    }

    // Add event listeners
    window.addEventListener('quiz-completed', handleQuizCompletion as EventListener)
    window.addEventListener('topic-explored', handleTopicExploration as EventListener)
    window.addEventListener('difficulty-changed', handleDifficultyChange as EventListener)
    window.addEventListener('streak-updated', handleStreakUpdate as EventListener)
    window.addEventListener('study-session-ended', handleStudySession as EventListener)

    return () => {
      window.removeEventListener('quiz-completed', handleQuizCompletion as EventListener)
      window.removeEventListener('topic-explored', handleTopicExploration as EventListener)
      window.removeEventListener('difficulty-changed', handleDifficultyChange as EventListener)
      window.removeEventListener('streak-updated', handleStreakUpdate as EventListener)
      window.removeEventListener('study-session-ended', handleStudySession as EventListener)
    }
  }, [targetUserId, trackBehavior])

  // Provide manual behavior tracking for components
  const trackManualBehavior = useCallback((action: string, context: UserBehaviorPattern['context']) => {
    trackBehavior({
      action,
      timestamp: Date.now(),
      context,
    })
  }, [trackBehavior])

  // Get behavior insights
  const getBehaviorInsights = useCallback(() => {
    const behaviors = behaviorHistoryRef.current
    const now = Date.now()
    const last24Hours = behaviors.filter(b => now - b.timestamp < 24 * 60 * 60 * 1000)
    const lastWeek = behaviors.filter(b => now - b.timestamp < 7 * 24 * 60 * 60 * 1000)

    return {
      totalBehaviors: behaviors.length,
      last24Hours: last24Hours.length,
      lastWeek: lastWeek.length,
      mostCommonActions: behaviors.reduce((acc, b) => {
        acc[b.action] = (acc[b.action] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averageSessionTime: behaviors
        .filter(b => b.context.timeSpent)
        .reduce((sum, b) => sum + (b.context.timeSpent || 0), 0) / 
        Math.max(1, behaviors.filter(b => b.context.timeSpent).length),
      subjectFocus: behaviors
        .filter(b => b.context.subjectId)
        .reduce((acc, b) => {
          const subjectId = b.context.subjectId!
          acc[subjectId] = (acc[subjectId] || 0) + 1
          return acc
        }, {} as Record<string, number>),
    }
  }, [])

  // Force recommendation update based on current behavior pattern
  const forceRecommendationUpdate = useCallback(() => {
    const trigger = analyzeBehaviorPattern(behaviorHistoryRef.current)
    if (trigger) {
      syncRecommendationsAfterPerformance({
        subjectId: trigger.context.subjectId || '',
        topicId: trigger.context.topicId,
        score: trigger.context.currentPerformance || 0,
        averageScore: trigger.context.previousPerformance,
      })
      toast.success('Recommendations updated based on your behavior patterns! 🎯')
    } else {
      toast.info('No significant behavior patterns detected for recommendation updates.')
    }
  }, [analyzeBehaviorPattern, syncRecommendationsAfterPerformance])

  return {
    // Core functionality
    trackBehavior: trackManualBehavior,
    forceRecommendationUpdate,
    
    // Insights
    behaviorInsights: getBehaviorInsights(),
    
    // State
    isRegenerating,
    behaviorHistoryLength: behaviorHistoryRef.current.length,
    
    // Utilities
    clearBehaviorHistory: () => {
      behaviorHistoryRef.current = []
    },
    
    // Export behavior data for analysis
    exportBehaviorData: () => ({
      behaviors: behaviorHistoryRef.current,
      insights: getBehaviorInsights(),
      lastUpdate: lastUpdateRef.current,
    }),
  }
}

// Hook for components to easily dispatch behavior events
export function useBehaviorEventDispatcher() {
  const dispatchBehaviorEvent = useCallback((eventType: string, detail: any) => {
    window.dispatchEvent(new CustomEvent(eventType, { detail }))
  }, [])

  return {
    // Quiz-related events
    dispatchQuizCompleted: (data: {
      subjectId: string
      topicId?: string
      score: number
      timeSpent: number
      difficulty: string
    }) => dispatchBehaviorEvent('quiz-completed', data),

    // Topic exploration events
    dispatchTopicExplored: (data: {
      subjectId: string
      topicId: string
      timeSpent: number
    }) => dispatchBehaviorEvent('topic-explored', data),

    // Difficulty change events
    dispatchDifficultyChanged: (data: {
      difficulty: string
      subjectId: string
      topicId?: string
    }) => dispatchBehaviorEvent('difficulty-changed', data),

    // Streak events
    dispatchStreakUpdated: (data: {
      streakCount: number
      sessionDuration: number
    }) => dispatchBehaviorEvent('streak-updated', data),

    // Study session events
    dispatchStudySessionEnded: (data: {
      duration: number
      subjectId: string
    }) => dispatchBehaviorEvent('study-session-ended', data),
  }
}