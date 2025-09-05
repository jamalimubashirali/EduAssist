'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGlobalLeaderboard, useQuizLeaderboard } from '@/hooks/useAttemptData'
import { useGamificationLeaderboard } from '@/hooks/useGamificationData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  TrendingUp,
  Users,
  Zap,
  Target,
  Filter,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Define a unified leaderboard entry type for the component
interface DisplayLeaderboardEntry {
  id: string
  userId: string
  userName: string
  score: number
  totalQuestions?: number
  correctAnswers?: number
  timeSpent?: number
  xpEarned: number
  level: number
  streak: number
  completedAt: string
}

export default function LeaderboardPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'global' | 'quiz'>('global')
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  const { data: globalLeaderboard, isLoading: globalLoading } = useGlobalLeaderboard(50)
  const { data: gamificationLeaderboard, isLoading: gamificationLoading } = useGamificationLeaderboard(50)
  const { data: quizLeaderboard, isLoading: quizLoading } = useQuizLeaderboard(
    selectedQuiz, 
    selectedTab === 'quiz' ? 20 : 0
  )

  // Transform data to unified format
  const transformToDisplayFormat = (data: any[]): DisplayLeaderboardEntry[] => {
    if (!data || data.length === 0) return []
    
    return data.map((entry: any, index: number) => ({
      id: entry.id || entry._id || `entry-${index}`,
      userId: entry.userId,
      userName: entry.userName || entry.username || `User ${index + 1}`,
      score: entry.score || entry.averageScore || 0,
      totalQuestions: entry.totalQuestions || 100,
      correctAnswers: entry.correctAnswers,
      timeSpent: entry.timeSpent,
      xpEarned: entry.xpEarned || entry.totalXP || 0,
      level: entry.level || 1,
      streak: entry.streak || entry.currentStreak || 0,
      completedAt: entry.completedAt || new Date().toISOString()
    }))
  }

  // Use gamification leaderboard for more comprehensive data when available
  const currentLeaderboard = selectedTab === 'global' 
    ? (gamificationLeaderboard || globalLeaderboard) 
    : quizLeaderboard
  const isLoading = selectedTab === 'global' 
    ? (gamificationLoading || globalLoading) 
    : quizLoading  // Transform and fallback to mock data
  const transformedData = transformToDisplayFormat(currentLeaderboard || [])
  


  // Use only real backend data - no fallback to mock data
  const displayLeaderboard = transformedData

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">#{rank}</div>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
      case 2:
        return 'from-gray-400/20 to-gray-500/20 border-gray-400/30'
      case 3:
        return 'from-amber-600/20 to-amber-700/20 border-amber-600/30'
      default:
        return 'from-gray-800/50 to-gray-900/50 border-gray-700/30'
    }
  }

  // Show loading state
  if (isLoading || !user) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard 🏆</h1>
          <p className="text-gray-400">See how you rank against other learners</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setSelectedTab('global')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedTab === 'global'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Global
            </button>
            <button
              onClick={() => setSelectedTab('quiz')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedTab === 'quiz'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              Quiz Specific
            </button>
          </div>
        </div>

        {/* Quiz Selection for Quiz-Specific Tab */}
        {selectedTab === 'quiz' && (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Quiz
              </label>
              <input
                type="text"
                placeholder="Enter Quiz ID"
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter a quiz ID to see quiz-specific rankings
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-8">
          {['all', 'week', 'month'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                timeFilter === filter
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'All Time' : `This ${filter}`}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {displayLeaderboard.slice(0, 3).map((entry, index) => {
            const rank = index + 1
            const isCurrentUser = entry.userId === user?.id
            
            return (
              <motion.div
                key={entry.id}
                className={`game-card p-6 text-center relative ${
                  rank === 1 ? 'transform scale-105' : ''
                } ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${getRankColor(rank).split(' ')[0].replace('from-', 'rgba(').replace('/20', ', 0.2)')}, ${getRankColor(rank).split(' ')[1].replace('to-', 'rgba(').replace('/20', ', 0.2)')})`
                }}
                whileHover={{ scale: rank === 1 ? 1.08 : 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Rank Icon */}
                <div className="flex justify-center mb-4">
                  {getRankIcon(rank)}
                </div>

                {/* User Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {isCurrentUser ? 'You' : entry.userName}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>Level {entry.level}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Score:</span>
                    <span className="text-white font-bold">{entry.score}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">XP:</span>
                    <span className="text-yellow-400 font-bold">{entry.xpEarned}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Streak:</span>
                    <span className="text-orange-400 font-bold">{entry.streak} days</span>
                  </div>
                </div>

                {/* Current User Badge */}
                {isCurrentUser && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      You
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Empty State for Quiz Selection */}
        {selectedTab === 'quiz' && !selectedQuiz && (
          <motion.div
            className="game-card p-8 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Select a Quiz</h3>
            <p className="text-gray-400">
              Enter a quiz ID above to view quiz-specific leaderboard rankings
            </p>
          </motion.div>
        )}

        {/* Empty State for No Data */}
        {displayLeaderboard.length === 0 && !(selectedTab === 'quiz' && !selectedQuiz) && (
          <motion.div
            className="game-card p-8 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Rankings Available</h3>
            <p className="text-gray-400">
              {selectedTab === 'quiz' 
                ? 'No one has completed this quiz yet. Be the first!'
                : 'Complete some quizzes to see leaderboard rankings!'
              }
            </p>
          </motion.div>
        )}

        {/* Show content only if we have data and not waiting for quiz selection */}
        {displayLeaderboard.length > 0 && !(selectedTab === 'quiz' && !selectedQuiz) && (
          <>
            {/* Full Leaderboard */}
            <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Full Rankings
          </h2>

          <div className="space-y-3">
            {displayLeaderboard.map((entry, index) => {
              const rank = index + 1
              const isCurrentUser = entry.userId === user?.id
              
              return (
                <motion.div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                    isCurrentUser 
                      ? 'bg-purple-500/20 border border-purple-500/30' 
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {/* Rank */}
                  <div className="w-12 flex justify-center">
                    {rank <= 3 ? getRankIcon(rank) : (
                      <span className="text-gray-400 font-bold">#{rank}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                        {isCurrentUser ? 'You' : entry.userName}
                      </span>
                      <span className="text-sm text-gray-400">Level {entry.level}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-white font-bold">{entry.score}%</div>
                      <div className="text-gray-400">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {entry.xpEarned}
                      </div>
                      <div className="text-gray-400">XP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-400 font-bold">{entry.streak}</div>
                      <div className="text-gray-400">Streak</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Your Rank Summary */}
        {user && displayLeaderboard.length > 0 && !(selectedTab === 'quiz' && !selectedQuiz) && (
          <motion.div
            className="mt-8 game-card p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">Your Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">#{displayLeaderboard.findIndex(e => e.userId === user.id) + 1}</div>
                <div className="text-gray-400 text-sm">Current Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {displayLeaderboard.find(e => e.userId === user.id)?.score || 0}%
                </div>
                <div className="text-gray-400 text-sm">Best Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {displayLeaderboard.find(e => e.userId === user.id)?.xpEarned || 0}
                </div>
                <div className="text-gray-400 text-sm">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {displayLeaderboard.find(e => e.userId === user.id)?.streak || 0}
                </div>
                <div className="text-gray-400 text-sm">Day Streak</div>
              </div>
            </div>
          </motion.div>
        )}
          </>
        )}
      </div>
    </GameLayout>
  )
}
