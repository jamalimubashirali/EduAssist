'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useRequireAuth } from '@/hooks/useAuthProtection'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { useGamificationDashboard } from '@/hooks/useGamificationData'
import GameLayout from '@/app/components/layout/GameLayout'
import XPBar from '@/app/components/gamification/XPBar'
import StreakCounter from '@/app/components/gamification/StreakCounter'
import BadgeCard from '@/app/components/gamification/BadgeCard'
import QuestCard from '@/app/components/gamification/QuestCard'
import {
  Brain,
  Target,
  TrendingUp,
  Zap,
  Trophy,
  BookOpen,
  Calendar
} from 'lucide-react'
import { QuickQuizButton, ChallengeQuizButton } from '@/app/components/quiz/StartQuizButton'
import { useQuizRecommendations } from '@/hooks/useRecommendationData'
import { usePostOnboardingExperience } from '@/hooks/usePostOnboardingExperience'
import { Lightbulb } from 'lucide-react'
import { useDashboardAnalytics, useUserGoalProgress } from '@/hooks/usePerformanceData'
import { usePopularSubjects } from '@/hooks/useSubjectData'
import { useRecommendedQuizzes } from '@/hooks/useQuizData';
import { quizService } from '@/services/quizService'


// Real data hooks for dashboard

export default function Dashboard() {
  const router = useRouter()
  const { addXp } = useGamificationStore()
  
  // Protect this page - require authentication
  const { isLoading, shouldRedirect, user: authUser } = useRequireAuth();

  // Use real gamification data - only when user is authenticated and loaded
  const {
    badges,
    unlockedBadges,
    activeQuests,
    summary,
    isQuestsLoading,
    isBadgesLoading
  } = useGamificationDashboard(authUser?.id && !isLoading ? authUser.id : undefined)

  // Load streak data and update gamification store
  const setGamificationState = useGamificationStore(state => state.setGamificationState)
  const hasUpdatedRef = React.useRef(false)
  
  // Update gamification store when summary data changes (only once)
  React.useEffect(() => {
    if (summary && authUser && !hasUpdatedRef.current) {
      setGamificationState({
        xp: summary.totalXP || 0,
        level: summary.level || 1,
        streak: {
          current: summary.currentStreak || 0,
          longest: 0
        }
      })
      hasUpdatedRef.current = true
    }
  }, [summary, authUser, setGamificationState])
  
  // Reset the ref when user changes
  React.useEffect(() => {
    hasUpdatedRef.current = false
  }, [authUser?.id])

  // Use post-onboarding experience hook for personalized content
  const {
    personalizedContent,
    recommendations,
    personalizedGreeting,
    nextActions,
    dashboardContent,
    isLoading: postOnboardingLoading,
    isPostOnboardingSetupComplete,
    validationStatus,
    generateInitialRecommendations
  } = usePostOnboardingExperience()

  // Real backend data hooks
  const dashboardAnalytics = useDashboardAnalytics(authUser?.id)



  const { data: popularSubjects, isLoading: subjectsLoading } = usePopularSubjects(5)



  const { data: recommendedQuizzes, isLoading: quizzesLoading } = useRecommendedQuizzes(authUser?.id || '');

  const { data: quizRecommendations, isLoading: quizRecLoading } = useQuizRecommendations(5, authUser?.id)


  const handleQuickAction = (action: string, xp: number, route?: string) => {
    if (xp > 0) {
      addXp(xp)
    }
    if (route) {
      router.push(route)
    }
  }



  // Handle click on a recommendation card: if it has a quizId go to instructions;
  // if it only has a topicId, find-or-create a topic quiz then navigate.
  const handleRecommendationClick = async (rec: any) => {
    try {
      const quizId = rec?.id || rec?.metadata?.quizId
      if (quizId) {
        router.push(`/quiz/instructions/${quizId}`)
        return
      }
      const topicId = rec?.metadata?.topicId
      const subjectId = rec?.metadata?.subjectId
      if (topicId && subjectId) {
        const created = await quizService.getOrCreateTopicQuiz({
          topicId,
          subjectId,
          difficulty: 'intermediate',
          questionCount: 10,
        })
        if (created?.id) {
          router.push(`/quiz/instructions/${created.id}`)
          return
        }
      }
      // Fallback: go to quiz arena
      router.push('/quiz')
    } catch (e) {
      console.warn('Failed to start recommendation quiz, redirecting to quiz arena', e)
      router.push('/quiz')
    }
  }

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white font-secondary">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  // Show redirecting message if not authenticated
  if (shouldRedirect || !authUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
      <GameLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-responsive-3xl font-primary text-white mb-2">
                {personalizedGreeting || `Welcome back, ${authUser?.name}! 🎮`}
              </h1>
              <p className="text-responsive-base text-gray-400">
                {dashboardContent?.focusAreas && dashboardContent.focusAreas.length > 0 ? 
                  `Focus on ${dashboardContent.focusAreas.slice(0, 2).join(' and ')} today!` :
                  'Ready to level up your learning today?'
                }
              </p>
              {dashboardContent?.weakSubjects && dashboardContent.weakSubjects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {dashboardContent.weakSubjects.slice(0, 3).map((subject: any, index: number) => (
                    <span key={index} className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-responsive-xs">
                      Improve {subject.subject_name} ({Math.round(subject.score_percentage)}%)
                    </span>
                  ))}
                </div>
              )}
              {dashboardContent?.strongSubjects && dashboardContent.strongSubjects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {dashboardContent.strongSubjects.slice(0, 2).map((subject: any, index: number) => (
                    <span
                      key={subject?.subject_id || subject?.subjectId || subject?.subject_name || `${subject?.name || 'subject'}-${index}`}
                      className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-responsive-xs"
                    >
                      Strong in {subject.subject_name} ({Math.round(subject.score_percentage)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <StreakCounter />
            </div>
          </div>

          <div className="mt-6">
            <XPBar size="lg" />
          </div>

          {/* Post-Onboarding Setup Status */}
          {!isPostOnboardingSetupComplete && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Setting up your personalized experience...</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                {!validationStatus.assessmentResultsStored && (
                  <div>• Assessment results processing</div>
                )}
                {!validationStatus.preferencesStored && (
                  <div>• Storing your preferences</div>
                )}
                {!validationStatus.recommendationsGenerated && (
                  <div className="flex items-center gap-2">
                    • Generating personalized recommendations
                    {postOnboardingLoading && (
                      <button
                        onClick={generateInitialRecommendations}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

      
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Personalized Next Actions */}
          {/* {nextActions && nextActions.length > 0 && (
            <div>
              <h2 className="text-xl font-secondary font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Recommended for You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nextActions.map((action, index) => (
                  <button
                    key={`${action.recommendationId || action.route || action.title}-${index}`}
                    onClick={() => handleQuickAction(action.title, action.xpReward, action.route)}
                    className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        action.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        action.priority === 'medium' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                        'bg-gradient-to-r from-green-500 to-teal-500'
                      }`}>
                        {action.type === 'practice_weak_area' && <Brain className="w-5 h-5 text-white" />}
                        {action.type === 'follow_recommendation' && <Lightbulb className="w-5 h-5 text-white" />}
                        {action.type === 'daily_practice' && <Calendar className="w-5 h-5 text-white" />}
                        {action.type === 'study_plan' && <BookOpen className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">{action.title}</h3>
                        <p className="text-gray-400 text-xs line-clamp-2">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">+{action.xpReward} XP</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        action.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        action.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )} */}

          {/* Enhanced Goal Progress Widget */}
          <GoalProgressWidget userId={authUser?.id} />

          {/* Standard Quick Actions */}
          <div>
            <h2 className="text-responsive-xl font-primary font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-responsive-sm font-semibold text-white">Quick Quiz</h3>
                    <p className="text-gray-400 text-responsive-xs">Test your knowledge</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Zap className="w-3 h-3" />
                    <span className="text-responsive-xs font-medium">+50 XP</span>
                  </div>
                  <QuickQuizButton size="sm" showStats={false} onStart={() => addXp(50)}>
                    Start
                  </QuickQuizButton>
                </div>
              </div>

              <div className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-responsive-sm font-semibold text-white">Daily Challenge</h3>
                    <p className="text-gray-400 text-responsive-xs">Today's special quest</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Zap className="w-3 h-3" />
                    <span className="text-responsive-xs font-medium">+200 XP</span>
                  </div>
                  <ChallengeQuizButton size="sm" showStats={false} questionCount={7} onStart={() => addXp(200)}>
                    Start
                  </ChallengeQuizButton>
                </div>
              </div>

              <button
                onClick={() => handleQuickAction('Study Session', 75, '/subjects')}
                className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-responsive-sm font-semibold text-white">Study Session</h3>
                    <p className="text-gray-400 text-responsive-xs">Focus time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Zap className="w-3 h-3" />
                  <span className="text-responsive-xs font-medium">+75 XP</span>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('View Progress', 0, '/progress')}
                className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-responsive-sm font-semibold text-white">Progress</h3>
                    <p className="text-gray-400 text-responsive-xs">Track your growth</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Target className="w-3 h-3" />
                  <span className="text-responsive-xs font-medium">View Stats</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Preferences Validation */}
        {/* <PreferencesValidation validationStatus={validationStatus} /> */}

        {/* Personalized Recommendations */}
        {/* {recommendations && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-secondary font-semibold text-white">Recommended for You</h2>
              </div>
              <button
                onClick={() => router.push('/recommendations')}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                View All
                <Lightbulb className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={rec.id || rec.metadata?.quizId || rec.metadata?.topicId || `rec-${idx}`} className="game-card p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-1">{rec.title}</h4>
                      <p className="text-gray-400 text-xs line-clamp-2">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {rec.metadata?.estimatedTime || 15} min
                    </span>
                    <button
                      onClick={() => handleRecommendationClick(rec)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )} */}

        {/* Active Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-400" />
              <h2 className="text-responsive-2xl font-primary font-semibold text-white">Active Quests</h2>
            </div>
            <button
              onClick={() => router.push('/quests')}
              className="text-purple-400 hover:text-purple-300 transition-colors text-responsive-sm font-medium flex items-center gap-1"
            >
              View All
              <Target className="w-4 h-4" />
            </button>
          </div>          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isQuestsLoading ? (
              // Loading skeleton
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="game-card p-6 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded mb-4"></div>
                  <div className="h-2 bg-gray-700 rounded"></div>
                </div>
              ))
            ) : activeQuests.length > 0 ? (
              activeQuests.slice(0, 4).map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete some quizzes to unlock quests!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Popular Subjects - Real Backend Data */}
        {popularSubjects && popularSubjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-secondary font-semibold text-white">Popular Subjects</h2>
              </div>
              <button
                onClick={() => router.push('/subjects')}
                className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                View All
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="game-card p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded mb-4"></div>
                    <div className="h-2 bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : (
                popularSubjects.slice(0, 3).map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => router.push(`/subjects/${subject.id}`)}
                    className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
                        <p className="text-gray-400 text-xs line-clamp-2">{subject.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {subject.quizCount || 0} quizzes
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                        Popular
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Recommended Quizzes - Real Backend Data */}
        {recommendedQuizzes && recommendedQuizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-secondary font-semibold text-white">Recommended Quizzes</h2>
              </div>
              <button
                onClick={() => router.push('/quiz/list')}
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                View All
                <Brain className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzesLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="game-card p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded mb-4"></div>
                    <div className="h-2 bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : (
                recommendedQuizzes.slice(0, 3).map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => router.push(`/quiz/instructions/${quiz.id}`)}
                    className="game-card p-4 hover:scale-105 transition-transform duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">{quiz.title}</h3>
                        <p className="text-gray-400 text-xs line-clamp-2">Practice Quiz</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">+100 XP</span>
                      </div>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                        {quiz.difficulty || 'Medium'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Recent Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-primary font-semibold text-white">Recent Achievements</h2>
            </div>
            <button
              onClick={() => router.push('/badges')}
              className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium flex items-center gap-1"
            >
              View All
              <Trophy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {isBadgesLoading ? (
              // Loading skeleton for badges
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-700 rounded-full animate-pulse"></div>
              ))
            ) : unlockedBadges.length > 0 ? (
              <>
                {unlockedBadges.slice(0, 5).map((badge) => (
                  <div key={badge.id} className="flex-shrink-0">
                    <BadgeCard badge={badge} isUnlocked={true} size="lg" />
                  </div>
                ))}
                {badges.filter(b => !unlockedBadges.find(ub => ub.id === b.id)).slice(0, 3).map((badge) => (
                  <div key={badge.id} className="flex-shrink-0">
                    <BadgeCard badge={badge} isUnlocked={false} showProgress={true} size="lg" />
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 w-full">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete quests to earn your first badges!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </GameLayout>
  )
}

// Enhanced Goal Progress Widget Component
function GoalProgressWidget({ userId }: { userId?: string }) {
  const { data: goalProgress, isLoading } = useUserGoalProgress(userId);

  if (isLoading || !goalProgress) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-responsive-xl font-primary font-semibold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-green-400" />
        Goal Progress
      </h2>
      
      <div className="game-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Target Score: {goalProgress.targetScore}%
            </h3>
            <p className="text-sm text-gray-400">
              Current Average: {goalProgress.currentAverageScore}%
            </p>
            {goalProgress.adjustedProgressScore !== goalProgress.currentAverageScore && (
              <p className="text-xs text-blue-400">
                Weighted Score: {goalProgress.adjustedProgressScore}%
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              {goalProgress.progressPercentage}%
            </div>
            <div className="text-xs text-gray-400">Complete</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(goalProgress.progressPercentage, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {goalProgress.topicsAtTarget}
            </div>
            <div className="text-gray-400">At Target</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {goalProgress.totalTopics}
            </div>
            <div className="text-gray-400">Total Topics</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">
              {goalProgress.scoreGap}%
            </div>
            <div className="text-gray-400">Gap to Close</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              goalProgress.weeklyGoalProgress?.isOnTrack ? 'text-green-400' : 'text-red-400'
            }`}>
              {goalProgress.weeklyGoalProgress?.completed || 0}/{goalProgress.weeklyGoalProgress?.target || 5}
            </div>
            <div className="text-gray-400">Weekly Goal</div>
          </div>
        </div>

        {/* Quick insights */}
        {(goalProgress.improvingTopics?.length > 0 || goalProgress.weakAreas?.length > 0 || 
          goalProgress.recentlyImprovedCount > 0 || goalProgress.newlyWeakCount > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {goalProgress.recentlyImprovedCount > 0 && (
                <div className="flex items-center space-x-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>{goalProgress.recentlyImprovedCount} areas improved!</span>
                </div>
              )}
              {goalProgress.improvingTopics?.length > 0 && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>{goalProgress.improvingTopics.length} topics improving</span>
                </div>
              )}
              {goalProgress.weakAreas?.length > 0 && (
                <div className="flex items-center space-x-2 text-orange-400">
                  <Target className="w-4 h-4" />
                  <span>{goalProgress.weakAreas.length} areas need focus</span>
                </div>
              )}
              {goalProgress.newlyWeakCount > 0 && (
                <div className="flex items-center space-x-2 text-red-400">
                  <Target className="w-4 h-4" />
                  <span>{goalProgress.newlyWeakCount} new weak areas</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}