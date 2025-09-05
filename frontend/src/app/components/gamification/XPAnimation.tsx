'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { formatXP } from '@/lib/utils'
import { Zap } from 'lucide-react'

export default function XPAnimation() {
  const { showXPAnimation, xpAnimationAmount } = useGamificationStore()

  return (
    <AnimatePresence>
      {showXPAnimation && (
        <motion.div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 0, scale: 1 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: [0, -20, -40, -60], 
            scale: [1, 1.2, 1, 1] 
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 py-2 rounded-full shadow-lg border border-green-400">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-lg">
              +{formatXP(xpAnimationAmount)} XP
            </span>
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
