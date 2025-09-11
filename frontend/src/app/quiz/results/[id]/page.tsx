'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import { userService } from '@/services/userService'
import { useXP } from '@/hooks/useXP'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import GameLayout from '@/app/components/layout/GameLayout'
import QuizAssessment from '@/components/quiz/QuizAssessment'
import { useUpdateUserXP, useUpdateUserStreak } from '@/hooks/useUserData'
import { recommendationService } from '@/services/recommendationService'
import { performanceService } from '@/services/performanceService'
import { attemptService } from '@/services/attemptService'
import { quizService } from '@/services/quizService'
import {
  Trophy,
  Star,
  Target,
  Clock,
  Zap,
  TrendingUp,
  RotateCcw,
  Home,
  Share2,
  Award,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles,
  ArrowRight,
  Lightbulb,
  BookOpen,
  AlertCircle
} from 'lucide-react'
import { useAttempt } from '@/hooks/useAttemptData'
import { useQuiz } from '@/hooks/useQuizData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function QuizResultsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useUserStore()
  const { simulateXPGain } = useXP()
  const { addBadge: unlockBadge } = useGamificationStore()
  const { addNotification } = useNotificationStore()
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const updateUserXP = useUpdateUserXP()
  const updateUserStreak = useUpdateUserStreak()
  const animationRanRef = useRef<string | null>(null)
  const gamificationAppliedRef = useRef<string | null>(null)

  const quizId = params.id as string

  const attemptId = params.id as string
  const { data: attempt, isLoading, error } = useAttempt(attemptId)
  const { data: quiz } = useQuiz(attempt?.quizId || '')


  // Fetch prior attempts for improvement comparison
  const [prevScore, setPrevScore] = useState<number | null>(null)
  const [avgTimePerQ, setAvgTimePerQ] = useState<number | null>(null)

  useEffect(() => {
    const loadComparisons = async () => {
      try {
        if (!attempt?.userId || !attempt?.quizId) return
        const recent = await attemptService.getRecentAttempts(attempt.userId, 5)
        const sameQuizPrev = recent
          .filter(a => a.quizId === attempt.quizId && a.id !== attempt.id && a.completedAt)
          .sort((a, b) => (new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()))
        if (sameQuizPrev.length > 0) {
          setPrevScore(sameQuizPrev[0].score)
          // Attach prevScore to attempt locally for memo usage
          ;(attempt as any)._prevScore = sameQuizPrev[0].score
        }
        if (attempt.totalQuestions && attempt.timeTaken != null) {
          const avg = Math.round((attempt.timeTaken / Math.max(1, attempt.totalQuestions)))
          setAvgTimePerQ(avg)
        }
      } catch (e) {
        console.warn('Failed to load comparison stats', e)
      }
    }
    loadComparisons()
  }, [attempt?.id, attempt?.userId, attempt?.quizId, attempt?.completedAt])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Derived results from backend attempt data (memoized to prevent re-renders)
  const attemptResults = useMemo(() => {
    if (!attempt) return null
    const total = attempt.totalQuestions || attempt.answersRecorded?.length || 0
    const correct = attempt.correctAnswers ?? attempt.answersRecorded?.filter(a => a.isCorrect).length ?? 0
    const score = attempt.score ?? Math.round((correct / Math.max(1, total)) * 100)
    const timeSpentMin = Math.round((attempt.timeTaken || 0) / 60)

    // Prefer backend xpEarned if present; otherwise compute from quiz.xpReward
    const computedXp = quiz && total ? Math.round((correct / total) * (quiz.xpReward || 0)) : 0
    const xpEarned = (attempt as any).xpEarned ?? computedXp

    // Compute improvement vs previous attempt on same quiz if available
    const improvementPct = (attempt as any)._prevScore != null
      ? `${(score - (attempt as any)._prevScore) >= 0 ? '+' : ''}${score - (attempt as any)._prevScore}%`
      : '+0%'

    // Speed rating based on average seconds per question
    const avgSecPerQ = total > 0 ? Math.round((attempt.timeTaken || 0) / total) : 0
    const speedRating = avgSecPerQ <= 20 ? 'Fast' : avgSecPerQ <= 40 ? 'Good' : 'Needs Practice'

    return {
      quizId: attempt.quizId,
      quizTitle: quiz?.title || 'Quiz Completed',
      subject: '',
      score,
      correctAnswers: correct,
      totalQuestions: total,
      timeSpent: timeSpentMin,
      timeLimit: quiz?.timeLimit,
      xpEarned,
      performance: {
        accuracy: Math.round((correct / Math.max(1, total)) * 100),
        speed: speedRating,
        improvement: improvementPct,
        rank: score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : 'C'
      }
    }
  }, [attempt, quiz])

  // Get comprehensive recommendations from attempt (handle missing type)
  const comprehensiveRecommendations = (attempt as any)?.comprehensiveAnalysis?.comprehensiveRecommendations;

  console.log(attemptResults);

  // Animation + gamification sequence (run once per attempt)
  useEffect(() => {
    const id = attempt?.id || (attempt as any)?._id
    if (!attemptResults || !id) return
    if (animationRanRef.current === id) return
    animationRanRef.current = id

    const sequence = async () => {
      // Step 1: Show results
      await new Promise(resolve => setTimeout(resolve, 600))
      setCurrentStep(1)

      // Step 2: Show XP animation
      await new Promise(resolve => setTimeout(resolve, 900))
      setCurrentStep(2)
      setShowXPAnimation(true)

      // Apply XP and streak once
      if (user?.id && gamificationAppliedRef.current !== id) {
        gamificationAppliedRef.current = id
        if (attemptResults.xpEarned > 0) {
          updateUserXP.mutate({ userId: user.id, xpGained: attemptResults.xpEarned })
        }
        updateUserStreak.mutate({ userId: user.id, increment: true })
      }

      // Optional local animation XP effect
      simulateXPGain(attemptResults.xpEarned)

      // Step 3: Check for badges + generate recommendations + record performance
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        console.log('[Results] Step 3 start: score=', attemptResults.score, 'attemptId=', id)
        // Badge
        if (attemptResults.score >= 90) {
          unlockBadge({ id: 'high_scorer', name: 'High Scorer', description: 'Score 90% or higher on a quiz', icon: '🎯', rarity: 'rare', category: 'achievement' })
          console.log('[Results] Badge unlocked: high_scorer')
        }
        // Performance record
        if (attempt?.subjectId || quiz?.subjectId) {
          console.log('[Results] Recording performance with subjectId:', attempt?.subjectId || quiz?.subjectId, 'topicId:', attempt?.topicId || quiz?.topicId)
          await performanceService.recordPerformance({
            subjectId: attempt?.subjectId || quiz?.subjectId || '',
            topicId: attempt?.topicId || quiz?.topicId || '',
            attemptData: {
              score: attemptResults.score,
              timeSpent: (attempt?.timeTaken ?? (attemptResults.timeSpent * 60)),
              difficulty: (quiz?.difficulty as any) || 'beginner',
              date: new Date().toISOString()
            }
          })
          console.log('[Results] Performance recorded')
        } else {
          console.log('[Results] Skipping performance record (no subjectId)')
        }
        // Recommendations trigger
        if (attempt?.id && (attempt?.subjectId || quiz?.subjectId)) {
          console.log('[Results] Triggering recommendations for attempt', attempt.id)
          await recommendationService.autoGenerateForAttempt(attempt.id)
          console.log('[Results] Recommendations generated')
        } else {
          console.log('[Results] Skipping recommendation generation (no context)')
        }
      } catch (e) {
        console.warn('[Results] Post-result side effects failed', e)
      }

      // Step 4: Show comprehensive recommendations
      await new Promise(resolve => setTimeout(resolve, 800))
      setCurrentStep(3)
    }

    sequence()
  }, [attemptResults, attempt?.id, user?.id, updateUserXP, updateUserStreak, simulateXPGain, unlockBadge, performanceService, recommendationService])



  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getRankColor = (rank: string) => {
    if (rank.startsWith('A')) return 'text-green-400 bg-green-400/10'
    if (rank.startsWith('B')) return 'text-blue-400 bg-blue-400/10'
    if (rank.startsWith('C')) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-red-400 bg-red-400/10'
  }

  const handleRetakeQuiz = () => {
    router.push(`/quiz/instructions/${quizId}`)
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleTakeRecommended = (recommendedQuizId: string) => {
    router.push(`/quiz/instructions/${recommendedQuizId}`)
  }

  const handleShare = () => {
    // TODO: Implement sharing functionality
    addNotification({
      type: 'xp_gain',
      title: 'Share Feature',
      message: 'Sharing functionality coming soon!',
      read: false
    })
  }

  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading results...</p>
          </div>
        </div>
      </GameLayout>
    )
  }

  if (error || !attemptResults) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
            <p className="text-gray-400 mb-6">Unable to load quiz results. Please try again.</p>
            <button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Score */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        >
          <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <Trophy className="w-16 h-16 text-white" />
            {(attemptResults?.score ?? 0) >= 80 && (
              <motion.div
                className="absolute -top-2 -right-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", bounce: 0.6 }}
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-900" />
                </div>
              </motion.div>
            )}
          </div>

          <motion.h1
            className="text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Quiz Complete!
          </motion.h1>

          <motion.p
            className="text-gray-400 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {attemptResults?.quizTitle || 'Quiz'}
          </motion.p>

          <motion.div
            className={`text-6xl font-bold mb-2 ${getScoreColor(attemptResults?.score ?? 0)}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            {attemptResults?.score ?? 0}%
          </motion.div>

          <motion.div
            className={`inline-block px-4 py-2 rounded-full font-bold ${getRankColor(attemptResults?.performance.rank ?? 'C')}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Grade: {attemptResults?.performance.rank ?? 'C'}
          </motion.div>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{attemptResults?.correctAnswers ?? 0}/{attemptResults?.totalQuestions ?? 0}</div>
            <div className="text-sm text-gray-400">Correct</div>
          </div>
          <div className="game-card p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{attemptResults?.timeSpent ?? 0}m</div>
            <div className="text-sm text-gray-400">Time Used</div>
          </div>
          <div className="game-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{attemptResults?.performance.improvement ?? '+0%'}</div>
            <div className="text-sm text-gray-400">Improvement</div>
          </div>
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{attemptResults?.xpEarned ?? 0}</div>
            <div className="text-sm text-gray-400">XP Earned</div>
          </div>
        </motion.div>

        {/* XP Breakdown */}
        <AnimatePresence>
          {currentStep >= 2 && (
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                XP Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Base XP:</span>
                  <span className="text-white font-semibold">+{attemptResults?.xpEarned ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-green-400 font-semibold">{attemptResults?.performance.accuracy ?? 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time Spent:</span>
                  <span className="text-blue-400 font-semibold">{attemptResults?.timeSpent ?? 0}m</span>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total XP Earned:</span>
                    <span className="text-yellow-400 font-bold text-lg">+{attemptResults?.xpEarned ?? 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Analysis */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Attempted Questions Breakdown
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {(attempt?.answersRecorded || []).map((rec: any, index: number) => (
              <motion.div
                key={(rec.questionId && (rec.questionId._id || rec.questionId)) || index}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  rec.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.05, duration: 0.3 }}
                title={`Question ${index + 1}: ${rec.isCorrect ? 'Correct' : 'Incorrect'} (${rec.timeSpent || 0}s)`}
              >
                {rec.isCorrect ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-4">
            <span>Question 1</span>
            <span>Question {attemptResults?.totalQuestions ?? (attempt?.answersRecorded?.length || 0)}</span>
          </div>
        </motion.div>

        {/* Improvement Suggestions */}
        {/* <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Areas for Improvement
          </h2>
          <ul className="space-y-2">
            {(attempt as any)?.feedback?.suggestions?.map((suggestion: any, index: number) => (
              <li key={index} className="flex items-start gap-2 text-gray-300">
                <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                {suggestion.text}
              </li>
            ))}
          </ul>
        </motion.div> */}

        {/* Recommended Next Quizzes */}
        {/* <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            Recommended Next Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(attempt as any)?.feedback?.recommendations?.map((quiz: any) => (
              <motion.button
                key={quiz.id}
                onClick={() => handleTakeRecommended(quiz.id)}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors">
                  {quiz.title}
                </h3>
                <span className="text-sm text-gray-400 capitalize">{quiz.difficulty}</span>
              </motion.button>
            ))}
          </div>
        </motion.div> */}

        {/* Enhanced Assessment */}
        {/* {attemptResults && currentStep >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
          >
            <QuizAssessment
              results={{
                score: attemptResults.score,
                correctAnswers: attemptResults.correctAnswers,
                totalQuestions: attemptResults.totalQuestions,
                timeSpent: attemptResults.timeSpent * 60, // Convert back to seconds
                timeLimit: attemptResults.timeLimit,
                difficulty: attemptResults.performance.rank,
                xpEarned: attemptResults.xpEarned,
                answers: attempt?.answersRecorded?.map((answer: any, index: number) => ({
                  questionId: (answer.questionId && (answer.questionId._id || answer.questionId)) || `q${index}`,
                  isCorrect: !!answer.isCorrect,
                  timeSpent: answer.timeSpent ?? 0,
                  selectedAnswer: typeof answer.selectedAnswer === 'string' ? parseInt(answer.selectedAnswer, 10) : (answer.selectedAnswer ?? -1),
                  correctAnswer: (answer as any).correctAnswer != null ? (answer as any).correctAnswer : undefined
                })) || []
              }}
              recommendations={[
                {
                  type: 'improvement',
                  title: 'Focus on Time Management',
                  description: 'You spent more time on some questions. Practice with timed quizzes to improve speed.',
                  actionable: 'Try taking practice quizzes with shorter time limits'
                },
                {
                  type: 'strength',
                  title: 'Strong Foundation',
                  description: 'You demonstrated good understanding of core concepts.',
                  actionable: 'Continue building on this foundation with advanced topics'
                }
              ]}
            />
          </motion.div>
        )} */}

        {/* Comprehensive Recommendations from Backend */}
        <AnimatePresence>
          {currentStep >= 3 && comprehensiveRecommendations && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Performance Insights */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <span>Performance Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 mb-4">
                      {comprehensiveRecommendations.performance_insights?.overall_performance}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-400">Accuracy Rate:</span>
                        <div className="text-lg font-bold text-green-400">
                          {comprehensiveRecommendations.performance_insights?.accuracy_rate}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Improvement Potential:</span>
                        <div className="text-lg font-bold text-orange-400">
                          +{comprehensiveRecommendations.performance_insights?.improvement_potential}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">Next Target:</span>
                        <div className="text-lg font-bold text-blue-400">
                          {comprehensiveRecommendations.performance_insights?.next_level_target}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Path */}
              {comprehensiveRecommendations.learning_path && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Target className="w-5 h-5 text-green-400" />
                      <span>Learning Path</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-blue-400">
                          {comprehensiveRecommendations.learning_path.current_level}
                        </Badge>
                        <span className="text-sm text-gray-400">Current Level</span>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-white">Recommended Next Steps:</h5>
                        <ul className="space-y-2">
                          {comprehensiveRecommendations.learning_path.recommended_next_steps?.map((step: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Study Strategy */}
              {comprehensiveRecommendations.study_strategy && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <BookOpen className="w-5 h-5 text-yellow-400" />
                      <span>Study Strategy</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2 text-white">Recommended Strategies:</h5>
                        <ul className="space-y-2">
                          {comprehensiveRecommendations.study_strategy.recommended_strategies?.map((strategy: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <Target className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-300">{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-white">Motivation Tips:</h5>
                        <ul className="space-y-2">
                          {comprehensiveRecommendations.study_strategy.motivation_tips?.map((tip: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-gray-300">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Areas */}
              {comprehensiveRecommendations.improvement_areas && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <span>Priority Improvement Areas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2 text-white">Focus Areas:</h5>
                        <ul className="space-y-2">
                          {comprehensiveRecommendations.improvement_areas.priority_focus?.map((focus: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <AlertCircle className="w-4 h-4 text-orange-400" />
                              <span className="text-gray-300">{focus}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-white">Improvement Timeline:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-300">
                            <span className="font-medium">Immediate:</span> {comprehensiveRecommendations.improvement_areas.improvement_timeline?.immediate_focus}
                          </div>
                          <div className="text-gray-300">
                            <span className="font-medium">Short-term:</span> {comprehensiveRecommendations.improvement_areas.improvement_timeline?.short_term}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          <button
            onClick={handleRetakeQuiz}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>

          <button
            onClick={handleShare}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Results
          </button>

          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </GameLayout>
  )
}
