'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { useGamificationDashboard } from '@/hooks/useGamificationData'
import api from '@/lib/api'
import GameLayout from '@/app/components/layout/GameLayout'
import XPBar from '@/app/components/gamification/XPBar'
import BadgeCard from '@/app/components/gamification/BadgeCard'
import { Attempt } from '@/types'
import { 
  User, 
  Edit, 
  Trophy, 
  Target, 
  Calendar,
  Zap,
  Award,
  Settings,
  Crown
} from 'lucide-react'

export default function ProfilePage() {
  const { user: authUser } = useUserStore()
  const { xp, level } = useGamificationStore()
  
  // Use real gamification data
  const {
    badges,
    unlockedBadges, 
    achievements,
    summary,
  } = useGamificationDashboard(authUser?.id)
  
  // Get real quiz history from attempts
  const { data: quizHistory, isLoading: isHistoryLoading } = useQuery<Attempt[]>({
    queryKey: ['quiz-history', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return []
      const response = await api.get(`/attempts/user/${authUser.id}`)
      return response.data
    },
    enabled: !!authUser?.id
  })

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-yellow-400'
    if (score >= 70) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <GameLayout>
      <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        className="game-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white">
              {authUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-gray-900" />
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{authUser?.name || 'User'}</h1>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Edit className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="level-badge">Level {level}</div>
              {/* This assumes a title property might exist on the user object in the future */}
              {/* {authUser?.title && (
                <div className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                  {authUser.title}
                </div>
              )} */}
            </div>

            <XPBar size="lg" />
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Total XP</p>
              <p className="text-xl font-bold text-white">{xp}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">Current Streak</p>
              <p className="text-xl font-bold text-white">{summary?.currentStreak || 0}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Achievements</p>
              <p className="text-xl font-bold text-white">{achievements.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">Badges</p>
              <p className="text-xl font-bold text-white">{unlockedBadges.length} / {badges.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">My Badges</h2>
          <button className="text-purple-400 hover:text-white transition-colors">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {unlockedBadges.slice(0, 7).map((badge) => (
            <div key={badge._id} className="flex-shrink-0">
              <BadgeCard badge={badge} isUnlocked={true} size="lg" />
            </div>
          ))}
          {badges.filter(b => !unlockedBadges.find(ub => ub._id === b._id)).slice(0, 3).map((badge) => (
            <div key={badge._id} className="flex-shrink-0">
              <BadgeCard badge={badge} isUnlocked={false} showProgress={true} size="lg" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quiz History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Quiz History</h2>
        <div className="game-card-secondary p-4 space-y-3">
          {isHistoryLoading ? (
            <p className="text-center text-gray-400">Loading history...</p>
          ) : quizHistory && quizHistory.length > 0 ? (
            quizHistory.slice(0, 5).map((attempt: Attempt) => (
              <div key={attempt._id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-white">{attempt.quizTitle || 'Quiz'}</p>
                  <p className="text-sm text-gray-400">{formatDate(attempt.completedAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${getScoreColor(attempt.score)}`}>{attempt.score}%</p>
                  <p className="text-sm text-yellow-400">+{attempt.xpEarned} XP</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No quizzes attempted yet.</p>
          )}
        </div>
      </motion.div>
      </div>
    </GameLayout>
  )
}
