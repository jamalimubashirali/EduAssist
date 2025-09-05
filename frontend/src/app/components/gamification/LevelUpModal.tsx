'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { useXP } from '@/hooks/useXP'
import { Star, Zap, Trophy, X } from 'lucide-react'
import { useEffect } from 'react'

export default function LevelUpModal() {
  const { showLevelUpModal, hideLevelUp } = useGamificationStore()
  const { xpData } = useXP()

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (showLevelUpModal) {
      const timer = setTimeout(() => {
        hideLevelUp()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showLevelUpModal, hideLevelUp])

  return (
    <AnimatePresence>
      {showLevelUpModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={hideLevelUp}
        >
          <motion.div
            className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/50 shadow-2xl"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={hideLevelUp}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Sparkle Effects */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Main Content */}
            <div className="text-center relative z-10">
              {/* Level Up Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              {/* Level Up Text */}
              <motion.h2
                className="text-4xl font-bold text-white mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                LEVEL UP!
              </motion.h2>

              <motion.div
                className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", damping: 10 }}
              >
                {xpData.level}
              </motion.div>

              <motion.p
                className="text-gray-300 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Congratulations! You've reached a new level and unlocked new possibilities!
              </motion.p>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-2 gap-4 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">Total XP</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {xpData.currentXP.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">New Level</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {xpData.level}
                  </div>
                </div>
              </motion.div>

              {/* Continue Button */}
              <motion.button
                className="game-button w-full py-3 text-lg font-semibold"
                onClick={hideLevelUp}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue Your Journey
              </motion.button>
            </div>

            {/* Animated Border */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-yellow-400 via-purple-500 to-blue-500"
              animate={{
                borderColor: [
                  "rgb(251, 191, 36)",
                  "rgb(168, 85, 247)",
                  "rgb(59, 130, 246)",
                  "rgb(251, 191, 36)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
