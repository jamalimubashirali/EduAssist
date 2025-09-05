'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import { useQuiz } from '@/hooks/useQuizData'
import GameLayout from '@/app/components/layout/GameLayout'
import {
  Brain,
  Clock,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle,
  Play,
  ArrowLeft,
  Zap,
  Star,
  Users,
  BookOpen,
  Timer,
  Award,
  Flag,
  Pause,
  TrendingUp
} from 'lucide-react'

export default function QuizInstructionsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useUserStore()
  const [isReady, setIsReady] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [showCountdown, setShowCountdown] = useState(false)

  const quizId = params.id as string

  // Get real quiz data from API
  const { data: quiz, isLoading, error } = useQuiz(quizId)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (showCountdown && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showCountdown && timeRemaining === 0) {
      router.push(`/quiz/${quizId}`)
    }
  }, [showCountdown, timeRemaining, router, quizId])

  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white text-lg">Loading quiz details...</p>
          </div>
        </div>
      </GameLayout>
    )
  }

  if (error || !quiz) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-lg mb-4">Quiz not found</p>
            <button 
              onClick={() => router.push('/quiz')}
              className="game-button px-6 py-3"
            >
              Back to Quiz Arena
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  console.log('Fetched Quiz Data:', quiz);

  // Create quiz info with real data and sensible defaults
  const quizInfo = {
    id: quiz.id,
    title: quiz.title,
    subject: quiz.subjectId || '',
    difficulty: quiz.difficulty,
    questionCount: quiz.questions?.length || 0,
    estimatedTime: Math.ceil((quiz.timeLimit || 300) / 60),
    timeLimit: Math.ceil((quiz.timeLimit || 300) / 60),
    rating: quiz.rating || 0.0,
    completions: quiz.completions || 0,
    xpReward: quiz.xpReward || 100,
    description: quiz.description || `Test your knowledge of ${quiz.subjectId} with this comprehensive quiz covering key concepts and problem-solving techniques.`,
    topics: [`${quiz.subjectId} Fundamentals`, 'Problem Solving', 'Key Concepts', 'Applications'],
    instructions: [
      'Read each question carefully before selecting your answer',
      'You can change your answer before moving to the next question',
      'Use the timer to manage your time effectively',
      'Some questions may have multiple correct approaches',
      'Take your time and think through each problem step by step'
    ],
    rules: [
      'No external calculators or resources allowed',
      'Each question must be answered to proceed',
      'You cannot go back to previous questions once submitted',
      'The quiz will auto-submit when time expires',
      'Partial credit may be awarded for some questions'
    ],
    rewards: {
      completion: quiz.xpReward || 100,
      perfectScore: 50,
      timeBonus: 25,
      firstAttempt: 30
    }
  }

  const handleStartQuiz = () => {
    setShowCountdown(true)
  }

  const handleBack = () => {
    router.push('/quiz/list')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  if (showCountdown) {
    return (
      <GameLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-6xl font-bold text-white">{timeRemaining}</span>
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Get Ready!</h2>
            <p className="text-gray-300">Quiz starting in {timeRemaining} seconds...</p>
          </motion.div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{quizInfo.title}</h1>
          <p className="text-gray-400">{quizInfo.subject}</p>
          <div className={`inline-block px-4 py-2 rounded-full border mt-4 ${getDifficultyColor(quizInfo.difficulty)}`}>
            {quizInfo.difficulty.charAt(0).toUpperCase() + quizInfo.difficulty.slice(1)} Level
          </div>
        </motion.div>

        {/* Quiz Overview */}
        <motion.div
          className="grid md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Quiz Stats */}
          <div className="game-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Quiz Details
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Questions:</span>
                <span className="text-white font-semibold">{quizInfo.questionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Time:</span>
                <span className="text-white font-semibold">{quizInfo.estimatedTime} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time Limit:</span>
                <span className="text-white font-semibold">{quizInfo.timeLimit} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">XP Reward:</span>
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {quizInfo.xpReward}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rating:</span>
                <span className="text-yellow-400 font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {quizInfo.rating}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completions:</span>
                <span className="text-blue-400 font-semibold">{quizInfo.completions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="game-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Potential Rewards
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completion Bonus:</span>
                <span className="text-green-400 font-semibold">+{quizInfo.rewards.completion} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Perfect Score:</span>
                <span className="text-yellow-400 font-semibold">+{quizInfo.rewards.perfectScore} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Time Bonus:</span>
                <span className="text-blue-400 font-semibold">+{quizInfo.rewards.timeBonus} XP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">First Attempt:</span>
                <span className="text-purple-400 font-semibold">+{quizInfo.rewards.firstAttempt} XP</span>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Maximum XP:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {Object.values(quizInfo.rewards).reduce((sum, val) => sum + val, 0)} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            About This Quiz
          </h2>
          <p className="text-gray-300 mb-4">{quizInfo.description}</p>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Topics Covered:</h3>
            <div className="flex flex-wrap gap-2">
              {quizInfo.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Instructions and Rules */}
        <motion.div
          className="grid md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Instructions */}
          <div className="game-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Instructions
            </h2>
            <ul className="space-y-2">
              {quizInfo.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {instruction}
                </li>
              ))}
            </ul>
          </div>

          {/* Rules */}
          <div className="game-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Rules
            </h2>
            <ul className="space-y-2">
              {quizInfo.rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button
            onClick={handleBack}
            className="px-8 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to List
          </button>
          
          <button
            onClick={handleStartQuiz}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Play className="w-5 h-5" />
            Start Quiz
          </button>
        </motion.div>
      </div>
    </GameLayout>
  )
}
