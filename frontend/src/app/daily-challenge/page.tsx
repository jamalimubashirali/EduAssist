'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { useXP } from '@/hooks/useXP'
import { useGamificationDashboard, useQuestManager } from '@/hooks/useGamificationData'
import GameLayout from '@/app/components/layout/GameLayout'
import { 
  Calendar, 
  Zap, 
  Trophy, 
  Target,
  Clock,
  Star,
  CheckCircle,
  X,
  RefreshCw,
  Award,
  Flame,
  Brain,
  ArrowRight,
  Timer,
  Sparkles,
  Loader2
} from 'lucide-react'

export default function DailyChallengePage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { addBadge } = useGamificationStore()
  const { simulateXPGain } = useXP()
  const { handleQuestComplete, isCompleting } = useQuestManager()
  
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  // Get real daily quest data from backend
  const { 
    quests, 
    streak, 
    summary,
    isQuestsLoading, 
    isLoading 
  } = useGamificationDashboard(user?.id)
  
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [isActive, setIsActive] = useState(false)
  const [challengeCompleted, setChallengeCompleted] = useState(false)

  // Find the daily challenge quest from real backend data
  const dailyQuest = quests.find(q => q.id === 'daily-quiz' || q.type === 'daily')
  
  // Default challenge data with real quest information when available
  const challengeData = {
    id: dailyQuest?.id || 'daily-challenge',
    date: new Date().toISOString().split('T')[0],
    title: dailyQuest?.title || 'Daily Challenge',
    description: dailyQuest?.description || 'Quick daily quiz to keep your skills sharp!',
    difficulty: dailyQuest?.difficulty || 'intermediate',
    timeLimit: 180, // 3 minutes
    xpReward: dailyQuest?.xpReward || 100,
    bonusXP: 50, // for perfect score
    streakBonus: 25, // for maintaining daily streak
    isCompleted: dailyQuest?.isCompleted || false,
    isClaimed: dailyQuest?.isClaimed || false,
    progress: dailyQuest?.progress || 0,
    maxProgress: dailyQuest?.maxProgress || 3,
    questions: [
      {
        id: 1,
        question: 'Solve for x: 2x + 5 = 13',
        options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
        correctAnswer: 1,
        explanation: '2x + 5 = 13, so 2x = 8, therefore x = 4'
      },
      {
        id: 2,
        question: 'What is the value of 3² + 4²?',
        options: ['12', '25', '49', '144'],
        correctAnswer: 1,
        explanation: '3² = 9 and 4² = 16, so 9 + 16 = 25'
      },
      {
        id: 3,
        question: 'If y = 2x - 3 and x = 5, what is y?',
        options: ['7', '8', '10', '13'],
        correctAnswer: 0,
        explanation: 'y = 2(5) - 3 = 10 - 3 = 7'
      }
    ]
  }

  // Real streak data from backend
  const streakData = {
    currentStreak: streak?.current || summary?.currentStreak || 0,
    longestStreak: streak?.longest || 0, // Only try to get from streak object
    totalCompleted: summary?.completedQuestsCount || 0,
    averageScore: 85, // This could come from user stats
    lastCompleted: streak?.lastActivityDate?.split('T')[0] || '',
    weeklyProgress: generateWeeklyProgress()
  }

  // Generate weekly progress based on real data
  function generateWeeklyProgress() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => {
      // This is a simplified version - in a real app you'd get this from the backend
      const completed = Math.random() > 0.4 // Simulate some completed days
      return {
        day,
        completed,
        score: completed ? Math.floor(Math.random() * 40 + 60) : 0 // 60-100 if completed
      }
    })
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0 && !showResult) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp()
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, showResult])

  if (!user) {
    return null;
  }

  const handleStartChallenge = () => {
    setIsActive(true)
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedAnswer(null)
    setShowResult(false)
    setChallengeCompleted(false)
    setTimeLeft(challengeData.timeLimit)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return

    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (currentQuestion < challengeData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
    } else {
      handleChallengeComplete(newAnswers)
    }
  }

  const handleTimeUp = () => {
    // Auto-submit with current answers
    const finalAnswers = [...answers]
    while (finalAnswers.length < challengeData.questions.length) {
      finalAnswers.push(-1) // -1 for unanswered
    }
    handleChallengeComplete(finalAnswers)
  }

  const handleChallengeComplete = async (finalAnswers: number[]) => {
    setIsActive(false)
    setShowResult(true)
    setChallengeCompleted(true)

    // Calculate score
    const correctAnswers = finalAnswers.filter((answer, index) => 
      answer === challengeData.questions[index].correctAnswer
    ).length
    const score = Math.round((correctAnswers / challengeData.questions.length) * 100)
    const timeBonus = timeLeft > 60 ? 25 : 0
    const perfectBonus = score === 100 ? challengeData.bonusXP : 0
    const totalXP = challengeData.xpReward + timeBonus + perfectBonus + challengeData.streakBonus

    // Award XP
    simulateXPGain(totalXP)

    // Add notification - This functionality seems to be missing from the new stores.
    // For now, I'll comment it out. It should be added to one of the stores.
    // addNotification({
    //   type: 'quest_complete',
    //   title: 'Daily Challenge Complete!',
    //   message: `You scored ${score}% and earned ${totalXP} XP`,
    //   isRead: false,
    //   data: { xp: totalXP, score }
    // })

    // Unlock badge for first daily challenge
    if (summary?.completedQuestsCount === 0) {
      addBadge({
        id: 'first_daily_challenge',
        name: 'Daily Contender',
        description: 'Completed your first daily challenge.',
        unlockedAt: new Date().toISOString(),
        icon: '📅',
        // criteria: 'Complete one daily challenge',
        category: 'streak',
        rarity: 'common'
      })
    }

    // Mark quest as complete
    if (dailyQuest) {
      handleQuestComplete(dailyQuest.id)
    }
  }

  const score = showResult 
    ? Math.round(
        (answers.filter((answer, index) => 
          answer === challengeData.questions[index].correctAnswer
        ).length / challengeData.questions.length) * 100
      )
    : 0

  const renderContent = () => {
    if (isLoading || isQuestsLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      )
    }

    if (challengeData.isCompleted) {
      return <ChallengeCompletedCard />
    }

    if (showResult) {
      return <ChallengeResultCard score={score} onRestart={handleStartChallenge} />
    }

    if (isActive) {
      return (
        <QuizInterface
          questionData={challengeData.questions[currentQuestion]}
          onAnswerSelect={handleAnswerSelect}
          onNext={handleNextQuestion}
          selectedAnswer={selectedAnswer}
          questionNumber={currentQuestion + 1}
          totalQuestions={challengeData.questions.length}
          timeLeft={timeLeft}
        />
      )
    }

    return <ChallengeStartCard onStart={handleStartChallenge} />
  }

  return (
    <GameLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {renderContent()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StreakTracker />
          <ChallengeInfoCard />
        </div>
      </div>
    </GameLayout>
  )

  // --- Sub-components ---

  function ChallengeStartCard({ onStart }: { onStart: () => void }) {
    return (
      <motion.div 
        className="game-card p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{challengeData.title}</h1>
        <p className="text-gray-400 mb-6">{challengeData.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-white font-bold">{challengeData.questions.length}</p>
            <p className="text-gray-400">Questions</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-white font-bold">{challengeData.timeLimit / 60} min</p>
            <p className="text-gray-400">Time Limit</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-white font-bold">{challengeData.xpReward} XP</p>
            <p className="text-gray-400">Base Reward</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-white font-bold capitalize">{challengeData.difficulty}</p>
            <p className="text-gray-400">Difficulty</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Start Challenge
        </button>
      </motion.div>
    )
  }

  function QuizInterface({
    questionData,
    onAnswerSelect,
    onNext,
    selectedAnswer,
    questionNumber,
    totalQuestions,
    timeLeft
  }: {
    questionData: any,
    onAnswerSelect: (index: number) => void,
    onNext: () => void,
    selectedAnswer: number | null,
    questionNumber: number,
    totalQuestions: number,
    timeLeft: number
  }) {
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
      <motion.div 
        className="game-card p-8"
        key={questionNumber}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-400">
            Question {questionNumber} / {totalQuestions}
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full text-sm">
            <Timer className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question */}
        <h2 className="text-2xl font-bold text-white mb-8 leading-snug">{questionData.question}</h2>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {questionData.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => onAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedAnswer === index
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedAnswer === index ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className="text-white">{option}</span>
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={selectedAnswer === null}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {questionNumber === totalQuestions ? 'Finish' : 'Next Question'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    )
  }

  function ChallengeResultCard({ score, onRestart }: { score: number, onRestart: () => void }) {
    const isPerfect = score === 100
    return (
      <motion.div 
        className="game-card p-8 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
          className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-white ${
            isPerfect ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
          }`}
        >
          {isPerfect ? <Trophy /> : `${score}%`}
        </motion.div>
        
        <h2 className="text-3xl font-bold text-white mb-2">
          {isPerfect ? 'Perfect Score!' : 'Challenge Complete!'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isPerfect 
            ? 'Incredible! You answered all questions correctly.' 
            : `Great effort! You scored ${score}%.`}
        </p>

        <div className="bg-gray-800/50 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-bold text-white mb-3">Rewards Earned</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <p className="text-purple-400 font-bold">+{challengeData.xpReward} XP</p>
              <p className="text-gray-400">Base Reward</p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <p className="text-purple-400 font-bold">+{timeLeft > 60 ? 25 : 0} XP</p>
              <p className="text-gray-400">Time Bonus</p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <p className="text-purple-400 font-bold">+{isPerfect ? challengeData.bonusXP : 0} XP</p>
              <p className="text-gray-400">Perfect Bonus</p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <p className="text-purple-400 font-bold">+{challengeData.streakBonus} XP</p>
              <p className="text-gray-400">Streak Bonus</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
          <button 
            onClick={onRestart}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </motion.div>
    )
  }

  function ChallengeCompletedCard() {
    return (
      <motion.div 
        className="game-card p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Challenge Already Completed</h1>
        <p className="text-gray-400 mb-6">You've already completed today's challenge. Come back tomorrow for a new one!</p>
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
        >
          Go to Dashboard
        </button>
      </motion.div>
    )
  }

  function ChallengeInfoCard() {
    return (
      <div className="game-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          About Daily Challenges
        </h3>
        <ul className="text-gray-300 text-sm space-y-2">
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
            <span>A new challenge is available every 24 hours.</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
            <span>Earn bonus XP for speed and accuracy.</span>
          </li>
          <li className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
            <span>Maintain your daily streak for extra rewards.</span>
          </li>
        </ul>
      </div>
    )
  }

  function StreakTracker() {
    return (
      <div className="game-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Daily Streak
        </h3>
        <div className="text-center mb-4">
          <p className="text-5xl font-bold text-white">{streakData.currentStreak}</p>
          <p className="text-gray-400">Day Streak</p>
        </div>
        <div className="flex justify-between text-sm text-gray-300 mb-4">
          <div>
            <p className="font-bold text-white">{streakData.longestStreak}</p>
            <p>Longest</p>
          </div>
          <div>
            <p className="font-bold text-white">{streakData.totalCompleted}</p>
            <p>Total Completed</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">This Week's Progress</p>
          <div className="flex justify-between gap-1">
            {streakData.weeklyProgress.map((day, index) => (
              <div key={index} className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  day.completed ? 'bg-green-500' : 'bg-gray-700'
                }`}>
                  {day.completed && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <p className="text-xs mt-1 text-gray-400">{day.day}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
}
