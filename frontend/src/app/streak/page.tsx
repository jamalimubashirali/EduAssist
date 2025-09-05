'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationDashboard } from '@/hooks/useGamificationData'
import api from '@/lib/api'
import GameLayout from '@/app/components/layout/GameLayout'
import { useRouter } from 'next/navigation'
import { 
  Flame, 
  Calendar, 
  Target, 
  TrendingUp,
  Award,
  Clock,
  Zap,
  Star,
  Trophy,
  Heart,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function StreakAnalyzerPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Get real gamification data
  const { 
    summary, 
    streak, 
    isLoading 
  } = useGamificationDashboard(user?.id)

  // Pull learning trends for last 60 days to paint heatmap
  const { data: learningTrends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['learning-trends', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await api.get(`/performance/user/${user.id}/learning-trends?days=60`)
      return response.data as Array<{ date: string; quizzesCompleted: number; xpEarned: number }>
    },
    enabled: !!user?.id
  })

  // Get real streak summary
  const { data: streakData, isLoading: isStreakLoading } = useQuery({
    queryKey: ['streak-analytics', user?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!user?.id) return null
      const response = await api.get(`/users/${user.id}/stats`)
      return response.data
    },
    enabled: !!user?.id
  })

  const currentStreakData = {
    currentStreak: streak?.current || streakData?.currentStreak || 0,
    longestStreak: streak?.longest || streakData?.longestStreak || 0,
    totalActiveDays: (learningTrends || []).filter((d) => d.quizzesCompleted > 0).length,
    streakFreeze: 2, // placeholder, could be user preference later
    lastActivity: streak?.lastActivityDate || new Date().toISOString(),
  }

  // Build calendar days using learningTrends
  const buildCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
    const days: any[] = []

    // Offset
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null)

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      const dateString = date.toISOString().split('T')[0]
      const trend = (learningTrends || []).find((t) => t.date.startsWith(dateString))
      const xp = trend?.xpEarned || 0
      const quizzes = trend?.quizzesCompleted || 0
      const active = quizzes > 0
      days.push({ day, date: dateString, active, xp, quizzes })
    }
    return days
  }

  if (isStreakLoading || isLoading || isTrendsLoading) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Flame className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white text-lg">Loading your streak data...</p>
          </div>
        </div>
      </GameLayout>
    )
  }

  if (!user) {
    return null; // or a loading spinner
  }

  const calendarData = buildCalendarDays()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-400'
    if (streak >= 14) return 'text-blue-400'
    if (streak >= 7) return 'text-green-400'
    if (streak >= 3) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getActivityIntensity = (xp: number) => {
    if (xp >= 250) return 'bg-green-500'
    if (xp >= 200) return 'bg-green-400'
    if (xp >= 150) return 'bg-green-300'
    if (xp >= 100) return 'bg-green-200'
    if (xp > 0) return 'bg-green-100'
    return 'bg-gray-700'
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
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flame className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Streak Analyzer 🔥</h1>
          <p className="text-gray-400">Track your learning consistency and build lasting habits</p>
        </motion.div>

        {/* Current Streak Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">              <Flame className={`w-6 h-6 mx-auto mb-2 ${getStreakColor(currentStreakData.currentStreak)}`} />
            <div className={`text-2xl font-bold ${getStreakColor(currentStreakData.currentStreak)}`}>
              {currentStreakData.currentStreak}
            </div>
            <div className="text-sm text-gray-400">Current Streak</div>
          </div>
          <div className="game-card p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{currentStreakData.longestStreak}</div>
            <div className="text-sm text-gray-400">Longest Streak</div>
          </div>
          <div className="game-card p-4 text-center">
            <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{currentStreakData.totalActiveDays}</div>
            <div className="text-sm text-gray-400">Active Days</div>
          </div>
          <div className="game-card p-4 text-center">
            <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{currentStreakData.streakFreeze}</div>
            <div className="text-sm text-gray-400">Streak Freezes</div>
          </div>
        </motion.div>

        {/* Calendar Heatmap */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, index) => (
              day ? (
                <div key={index} className={`h-10 rounded-lg ${getActivityIntensity(day.xp)} flex items-center justify-center text-xs text-gray-900`}>
                  {day.day}
                </div>
              ) : (
                <div key={index} className="h-10 rounded-lg bg-transparent"></div>
              )
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-400 flex items-center gap-2">
            <span>Low</span>
            <div className="flex gap-1">
              <div className="w-4 h-3 bg-gray-700 rounded"></div>
              <div className="w-4 h-3 bg-green-100 rounded"></div>
              <div className="w-4 h-3 bg-green-200 rounded"></div>
              <div className="w-4 h-3 bg-green-300 rounded"></div>
              <div className="w-4 h-3 bg-green-400 rounded"></div>
              <div className="w-4 h-3 bg-green-500 rounded"></div>
            </div>
            <span>High</span>
          </div>
        </motion.div>
      </div>
    </GameLayout>
  )
}
