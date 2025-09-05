'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/types'
import { getBadgeRarityColor, formatRelativeTime } from '@/lib/utils'
import { Award, Lock } from 'lucide-react'

interface BadgeCardProps {
  badge: Badge
  isUnlocked?: boolean
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export default function BadgeCard({ 
  badge, 
  isUnlocked = false, 
  showProgress = false, 
  size = 'md',
  onClick 
}: BadgeCardProps) {
  const rarityColor = getBadgeRarityColor(badge.rarity)
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  }

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const progress = badge.progress && badge.maxProgress 
    ? (badge.progress / badge.maxProgress) * 100 
    : 0

  return (
    <motion.div
      className={`relative cursor-pointer group ${sizeClasses[size]}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Badge Container */}
      <div className={`
        relative w-full h-full rounded-full border-2 ${rarityColor}
        ${isUnlocked ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gray-800/50'}
        ${isUnlocked && badge.rarity === 'legendary' ? 'badge-glow' : ''}
        flex items-center justify-center transition-all duration-300
        group-hover:shadow-lg
      `}>
        
        {/* Badge Icon */}
        {isUnlocked ? (
          <Award className={`${iconSizeClasses[size]} text-yellow-400`} />
        ) : (
          <Lock className={`${iconSizeClasses[size]} text-gray-500`} />
        )}
        
        {/* Unlock Animation Sparkles */}
        {isUnlocked && badge.rarity === 'legendary' && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
            />
          </>
        )}
      </div>

      {/* Progress Ring for Incomplete Badges */}
      {!isUnlocked && showProgress && badge.progress && badge.maxProgress && (
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth="2"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700 whitespace-nowrap">
          <div className="font-semibold">{badge.name}</div>
          <div className="text-gray-400">{badge.description}</div>
          {badge.rarity && (
            <div className={`text-xs mt-1 capitalize ${rarityColor.split(' ')[0]}`}>
              {badge.rarity}
            </div>
          )}
          {isUnlocked && badge.unlockedAt && (
            <div className="text-xs text-gray-500 mt-1">
              Unlocked {formatRelativeTime(badge.unlockedAt)}
            </div>
          )}
          {!isUnlocked && showProgress && badge.progress && badge.maxProgress && (
            <div className="text-xs text-blue-400 mt-1">
              Progress: {badge.progress}/{badge.maxProgress}
            </div>
          )}
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </motion.div>
  )
}
