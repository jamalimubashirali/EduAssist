'use client'

import React from 'react'
import { motion } from 'framer-motion'
import showToast from '@/utils/toast'
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle, 
  Zap, 
  Trophy,
  Target,
  X
} from 'lucide-react'

export default function ToastDemo() {
  const handleSuccessToast = () => {
    showToast.success('Success!', {
      description: 'This is a success message with a close button',
      duration: 6000
    })
  }

  const handleErrorToast = () => {
    showToast.error('Error occurred!', {
      description: 'This is an error message that you can dismiss',
      duration: 8000
    })
  }

  const handleInfoToast = () => {
    showToast.info('Information', {
      description: 'This is an info message with close functionality',
      duration: 5000
    })
  }

  const handleWarningToast = () => {
    showToast.warning('Warning!', {
      description: 'This is a warning message you can close manually',
      duration: 7000
    })
  }

  const handleXPToast = () => {
    showToast.xpGain(250, 'Quiz Completed!')
  }

  const handleLevelUpToast = () => {
    showToast.levelUp(15)
  }

  const handleAchievementToast = () => {
    showToast.achievement('Quiz Master', 'Completed 25 quizzes in a row!')
  }

  const handleQuizCompleteToast = () => {
    showToast.quizComplete(8, 10)
  }

  const handleDismissAll = () => {
    showToast.dismissAll()
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-game text-purple-400 mb-2">
          Toast Notifications Demo
        </h1>
        <p className="text-gray-400 font-secondary">
          Test the new dismissible toast notifications with close buttons
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        
        {/* Basic Toasts */}
        <motion.button
          onClick={handleSuccessToast}
          className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div className="text-left">
            <div className="font-semibold text-green-400">Success Toast</div>
            <div className="text-sm text-gray-400">6 second duration</div>
          </div>
        </motion.button>

        <motion.button
          onClick={handleErrorToast}
          className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="text-left">
            <div className="font-semibold text-red-400">Error Toast</div>
            <div className="text-sm text-gray-400">8 second duration</div>
          </div>
        </motion.button>

        <motion.button
          onClick={handleInfoToast}
          className="flex items-center gap-3 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Info className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <div className="font-semibold text-blue-400">Info Toast</div>
            <div className="text-sm text-gray-400">5 second duration</div>
          </div>
        </motion.button>

        <motion.button
          onClick={handleWarningToast}
          className="flex items-center gap-3 p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <div className="text-left">
            <div className="font-semibold text-yellow-400">Warning Toast</div>
            <div className="text-sm text-gray-400">7 second duration</div>
          </div>
        </motion.button>

        {/* Gaming Toasts */}
        <motion.button
          onClick={handleXPToast}
          className="flex items-center gap-3 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <div className="font-semibold text-purple-400">XP Gain</div>
            <div className="text-sm text-gray-400">+250 XP earned</div>
          </div>
        </motion.button>

        <motion.button
          onClick={handleLevelUpToast}
          className="flex items-center gap-3 p-4 bg-orange-600/20 border border-orange-500/30 rounded-lg hover:bg-orange-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trophy className="w-5 h-5 text-orange-400" />
          <div className="text-left">
            <div className="font-semibold text-orange-400">Level Up</div>
            <div className="text-sm text-gray-400">Reached Level 15</div>
          </div>
        </motion.button>

        <motion.button
          onClick={handleAchievementToast}
          className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trophy className="w-5 h-5 text-green-400" />
          <div className="text-left">
            <div className="font-semibold text-green-400">Achievement</div>
            <div className="text-sm text-gray-400">Quiz Master unlocked</div>
          </div>
        </motion.button>

        <motion.button
          onClick={handleQuizCompleteToast}
          className="flex items-center gap-3 p-4 bg-teal-600/20 border border-teal-500/30 rounded-lg hover:bg-teal-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Target className="w-5 h-5 text-teal-400" />
          <div className="text-left">
            <div className="font-semibold text-teal-400">Quiz Complete</div>
            <div className="text-sm text-gray-400">8/10 correct (80%)</div>
          </div>
        </motion.button>

        {/* Dismiss All */}
        <motion.button
          onClick={handleDismissAll}
          className="flex items-center gap-3 p-4 bg-gray-600/20 border border-gray-500/30 rounded-lg hover:bg-gray-600/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <X className="w-5 h-5 text-gray-400" />
          <div className="text-left">
            <div className="font-semibold text-gray-400">Dismiss All</div>
            <div className="text-sm text-gray-500">Clear all toasts</div>
          </div>
        </motion.button>
      </div>

      <div className="mt-8 p-6 bg-gray-800 rounded-lg max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-4">Toast Features:</h2>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>✨ <strong>Close Button</strong> - Click the X to dismiss any toast manually</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>⏱️ <strong>Custom Durations</strong> - Different toast types have appropriate timeouts</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>🎨 <strong>Themed Styling</strong> - Matches your dark theme with colored borders</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>🎮 <strong>Gaming Toasts</strong> - Special toasts for XP, levels, and achievements</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>📱 <strong>Responsive</strong> - Works great on mobile and desktop</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
