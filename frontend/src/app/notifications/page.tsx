'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Trophy, 
  Zap, 
  Target,
  BookOpen,
  Users,
  Calendar,
  Settings,
  Trash2,
  CheckCircle,
  X,
  Filter,
  Star,
  Award,
  Brain,
  Heart,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function NotificationsPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'achievements' | 'system'>('all')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Mock notifications data - TODO: Replace with real API calls
  const mockNotifications = [
    {
      id: 'notif_1',
      type: 'level_up',
      title: 'Level Up! 🎉',
      message: 'Congratulations! You\'ve reached Level 5',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      icon: '🎉',
      color: 'from-purple-500 to-blue-500',
      xp: 0,
      actionUrl: '/progress'
    },
    {
      id: 'notif_2',
      type: 'badge_unlock',
      title: 'New Badge Unlocked!',
      message: 'You earned the "Quiz Master" badge for completing 25 quizzes',
      timestamp: '2024-01-15T09:15:00Z',
      read: false,
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500',
      xp: 200,
      actionUrl: '/badges'
    },
    {
      id: 'notif_3',
      type: 'streak_milestone',
      title: '7-Day Streak! 🔥',
      message: 'Amazing! You\'ve maintained your learning streak for 7 days',
      timestamp: '2024-01-14T08:00:00Z',
      read: true,
      icon: '🔥',
      color: 'from-red-500 to-pink-500',
      xp: 100,
      actionUrl: '/streak'
    },
    {
      id: 'notif_4',
      type: 'quiz_complete',
      title: 'Quiz Completed',
      message: 'Great job on "Algebra Fundamentals"! You scored 85%',
      timestamp: '2024-01-14T16:45:00Z',
      read: true,
      icon: '🎯',
      color: 'from-green-500 to-teal-500',
      xp: 150,
      actionUrl: '/quiz/results/algebra_1'
    },
    {
      id: 'notif_5',
      type: 'recommendation',
      title: 'New Recommendation',
      message: 'Based on your progress, we recommend "Advanced Biology"',
      timestamp: '2024-01-14T12:20:00Z',
      read: true,
      icon: '💡',
      color: 'from-blue-500 to-cyan-500',
      xp: 0,
      actionUrl: '/recommendations'
    },
    {
      id: 'notif_6',
      type: 'leaderboard',
      title: 'Leaderboard Update',
      message: 'You\'ve moved up to #12 on the global leaderboard!',
      timestamp: '2024-01-13T20:30:00Z',
      read: true,
      icon: '📈',
      color: 'from-indigo-500 to-purple-500',
      xp: 0,
      actionUrl: '/leaderboard'
    },
    {
      id: 'notif_7',
      type: 'system',
      title: 'Welcome to EduAssist!',
      message: 'Thanks for joining! Complete your first quiz to get started',
      timestamp: '2024-01-01T10:00:00Z',
      read: true,
      icon: '👋',
      color: 'from-gray-500 to-gray-600',
      xp: 0,
      actionUrl: '/quiz'
    }
  ]

  const filteredNotifications = mockNotifications.filter(notification => {
    if (selectedFilter === 'unread') return !notification.read
    if (selectedFilter === 'achievements') return ['level_up', 'badge_unlock', 'streak_milestone'].includes(notification.type)
    if (selectedFilter === 'system') return notification.type === 'system'
    return true
  })

  const unreadCount = mockNotifications.filter(n => !n.read).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'level_up': return <Star className="w-4 h-4" />
      case 'badge_unlock': return <Award className="w-4 h-4" />
      case 'streak_milestone': return <Zap className="w-4 h-4" />
      case 'quiz_complete': return <Target className="w-4 h-4" />
      case 'recommendation': return <Brain className="w-4 h-4" />
      case 'leaderboard': return <Trophy className="w-4 h-4" />
      case 'system': return <Bell className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const handleMarkAsRead = (notificationId: string) => {
    // TODO: Implement mark as read functionality
    console.log('Marking as read:', notificationId)
  }

  const handleDeleteNotification = (notificationId: string) => {
    // TODO: Implement delete functionality
    console.log('Deleting notification:', notificationId)
  }

  const handleClearAll = () => {
    // TODO: Implement clear all functionality
    console.log('Clearing all notifications')
  }

  const handleMarkAllAsRead = () => {
    // TODO: Implement mark all as read functionality
    console.log('Marking all as read')
  }

  if (!user) {
    return null; // Or a loading spinner
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
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
            <Bell className="w-10 h-10 text-white" />
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {unreadCount}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications 🔔</h1>
          <p className="text-gray-400">Stay updated with your learning progress</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <Bell className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{mockNotifications.length}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="game-card p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{unreadCount}</div>
            <div className="text-sm text-gray-400">Unread</div>
          </div>
          <div className="game-card p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {mockNotifications.filter(n => ['level_up', 'badge_unlock', 'streak_milestone'].includes(n.type)).length}
            </div>
            <div className="text-sm text-gray-400">Achievements</div>
          </div>
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {mockNotifications.reduce((sum, n) => sum + (n.xp || 0), 0)}
            </div>
            <div className="text-sm text-gray-400">XP Earned</div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="flex flex-wrap gap-4 justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Filters */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All', icon: Bell },
              { id: 'unread', label: 'Unread', icon: AlertCircle },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'system', label: 'System', icon: Settings }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedFilter === filter.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
                {filter.id === 'unread' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                className={`game-card p-6 border transition-all duration-300 hover:scale-[1.02] ${
                  !notification.read 
                    ? 'border-blue-500/30 bg-blue-500/5' 
                    : 'border-gray-700/50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                layout
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${notification.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {notification.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          !notification.read ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'
                        }`}>
                          {getTypeIcon(notification.type)}
                          {notification.type.replace('_', ' ')}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-3">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {notification.xp > 0 && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Zap className="w-4 h-4" />
                            <span className="font-semibold">+{notification.xp} XP</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        {notification.actionUrl && (
                          <button
                            onClick={() => window.location.href = notification.actionUrl!}
                            className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No notifications found</h3>
            <p className="text-gray-400">
              {selectedFilter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "Try adjusting your filters or complete more activities to get notifications."
              }
            </p>
          </motion.div>
        )}

        {/* Notification Settings */}
        <motion.div
          className="game-card p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-700/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Notification Preferences
            </h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </button>
          </div>

          {showSettings && (
            <motion.div
              className="grid md:grid-cols-2 gap-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-3">
                <h3 className="text-white font-semibold">Achievement Notifications</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-300">Level ups and XP milestones</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-300">Badge unlocks</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-300">Streak milestones</span>
                </label>
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-semibold">Learning Notifications</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-300">Quiz completions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-300">New recommendations</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-300">Daily reminders</span>
                </label>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </GameLayout>
  )
}
