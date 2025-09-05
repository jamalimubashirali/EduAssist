'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationStore } from '@/stores/useGamificationStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { useRouter } from 'next/navigation'
import { 
  Trophy, 
  Star, 
  Calendar, 
  Zap,
  Target,
  BookOpen,
  Award,
  Crown,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Brain,
  Heart,
  Sparkles
} from 'lucide-react'

export default function MilestonesPage() {
  const { user } = useUserStore()
  const { xp, streak } = useGamificationStore()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'upcoming'>('all')
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      router.push('/login')
    }
  }, [user, router])

  // Mock milestones data - TODO: Replace with real API calls
  const mockMilestones = [
    {
      id: 'welcome',
      title: 'Welcome to EduAssist!',
      description: 'Started your learning journey',
      type: 'account',
      date: '2024-01-01T10:00:00Z',
      xpEarned: 0,
      completed: true,
      icon: '🎉',
      color: 'from-purple-500 to-blue-500'
    },
    {
      id: 'first_quiz',
      title: 'First Quiz Completed',
      description: 'Completed your very first quiz',
      type: 'learning',
      date: '2024-01-01T11:30:00Z',
      xpEarned: 50,
      completed: true,
      icon: '🎯',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'level_2',
      title: 'Level 2 Achieved',
      description: 'Reached level 2 with 200 XP',
      type: 'progression',
      date: '2024-01-03T14:20:00Z',
      xpEarned: 0,
      completed: true,
      icon: '⭐',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'week_streak',
      title: '7-Day Streak',
      description: 'Maintained learning for 7 consecutive days',
      type: 'streak',
      date: '2024-01-07T09:00:00Z',
      xpEarned: 100,
      completed: true,
      icon: '🔥',
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'subject_master',
      title: 'Mathematics Mastery',
      description: 'Achieved 85% average in Mathematics',
      type: 'mastery',
      date: '2024-01-10T16:45:00Z',
      xpEarned: 200,
      completed: true,
      icon: '🧮',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'quiz_master',
      title: 'Quiz Master',
      description: 'Complete 25 quizzes',
      type: 'learning',
      date: null,
      xpEarned: 250,
      completed: false,
      progress: 18,
      target: 25,
      icon: '🧠',
      color: 'from-purple-500 to-violet-500'
    },
    {
      id: 'level_5',
      title: 'Level 5 Achievement',
      description: 'Reach level 5 with 1000 XP',
      type: 'progression',
      date: null,
      xpEarned: 0,
      completed: false,
      progress: xp,
      target: 1000,
      icon: '👑',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Score 100% on any quiz',
      type: 'achievement',
      date: null,
      xpEarned: 300,
      completed: false,
      icon: '💎',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'month_streak',
      title: '30-Day Streak',
      description: 'Maintain learning for 30 consecutive days',
      type: 'streak',
      date: null,
      xpEarned: 500,
      completed: false,
      progress: streak,
      target: 30,
      icon: '⚡',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'community_star',
      title: 'Community Star',
      description: 'Reach top 10 on the leaderboard',
      type: 'social',
      date: null,
      xpEarned: 400,
      completed: false,
      progress: 15,
      target: 10,
      icon: '🌟',
      color: 'from-pink-500 to-rose-500'
    }
  ]

  const filteredMilestones = mockMilestones.filter(milestone => {
    if (selectedFilter === 'completed') return milestone.completed
    if (selectedFilter === 'upcoming') return !milestone.completed
    return true
  })

  const completedCount = mockMilestones.filter(m => m.completed).length
  const totalXP = mockMilestones.filter(m => m.completed).reduce((sum, m) => sum + m.xpEarned, 0)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'account': return <Users className="w-4 h-4" />
      case 'learning': return <BookOpen className="w-4 h-4" />
      case 'progression': return <TrendingUp className="w-4 h-4" />
      case 'streak': return <Zap className="w-4 h-4" />
      case 'mastery': return <Target className="w-4 h-4" />
      case 'achievement': return <Award className="w-4 h-4" />
      case 'social': return <Users className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
      <GameLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Learning Milestones 🏆</h1>
            <p className="text-gray-400">Track your journey and celebrate achievements</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="game-card p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{completedCount}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="game-card p-4 text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{mockMilestones.length - completedCount}</div>
              <div className="text-sm text-gray-400">Upcoming</div>
            </div>
            <div className="game-card p-4 text-center">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{totalXP}</div>
              <div className="text-sm text-gray-400">XP Earned</div>
            </div>
            <div className="game-card p-4 text-center">
              <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {Math.round((completedCount / mockMilestones.length) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Progress</div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {[
              { id: 'all', label: 'All Milestones', icon: Trophy },
              { id: 'completed', label: 'Completed', icon: CheckCircle },
              { id: 'upcoming', label: 'Upcoming', icon: Clock }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedFilter === filter.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </motion.div>

          {/* Timeline */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-transparent"></div>

            {/* Milestones */}
            <div className="space-y-8">
              {filteredMilestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  className="relative flex items-start gap-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  {/* Timeline Node */}
                  <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-r ${milestone.color} flex items-center justify-center text-2xl shadow-lg ${
                    milestone.completed ? 'ring-4 ring-green-500/30' : 'ring-4 ring-gray-700/30'
                  }`}>
                    {milestone.completed && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span>{milestone.icon}</span>
                  </div>

                  {/* Milestone Content */}
                  <div className={`flex-1 game-card p-6 ${
                    milestone.completed ? 'border-green-500/20' : 'border-gray-700/50'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl font-bold ${
                            milestone.completed ? 'text-white' : 'text-gray-300'
                          }`}>
                            {milestone.title}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            milestone.completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'
                          }`}>
                            {getTypeIcon(milestone.type)}
                            {milestone.type}
                          </div>
                        </div>
                        <p className="text-gray-400 mb-3">{milestone.description}</p>

                        {/* Progress Bar for Incomplete Milestones */}
                        {!milestone.completed && milestone.progress !== undefined && milestone.target && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>
                                {`${milestone.progress}/${milestone.target}`}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((Number(milestone.progress) || 0) / (Number(milestone.target) || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Date and XP */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {milestone.date ? (
                              <span>{formatDate(milestone.date)}</span>
                            ) : (
                              <span>In Progress</span>
                            )}
                          </div>
                          {milestone.xpEarned > 0 && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              <span className={milestone.completed ? 'text-yellow-400' : 'text-gray-500'}>
                                {milestone.xpEarned} XP
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Milestones Preview */}
          {selectedFilter === 'all' && (
            <motion.div
              className="game-card p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Next Milestones
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {mockMilestones
                  .filter(m => !m.completed)
                  .slice(0, 3)
                  .map((milestone, index) => (
                    <div key={milestone.id} className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{milestone.icon}</span>
                        <div>
                          <h3 className="text-white font-semibold text-sm">{milestone.title}</h3>
                          <p className="text-gray-400 text-xs">{milestone.description}</p>
                        </div>
                      </div>
                      {milestone.progress !== undefined && milestone.target && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
                              style={{ width: `${(Number(milestone.progress) / Number(milestone.target)) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {`${milestone.progress}/${milestone.target} completed`}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </GameLayout>
  )
}
