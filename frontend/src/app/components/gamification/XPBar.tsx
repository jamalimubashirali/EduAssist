'use client'

import { motion } from 'framer-motion'
import { useXP } from '@/hooks/useXP'
import { formatXP } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface XPBarProps {
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function XPBar({ showDetails = true, size = 'md', className = '' }: XPBarProps) {
  const { xpData } = useXP();
  const { currentXP, level, levelProgress, xpToNextLevel, xpForNextLevel } = xpData;
  // TODO: Replace with actual streak source if available
  const streak = 0;

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Handle levelProgress as number or object
  let progressPercent = 0;
  if (typeof levelProgress === 'number') {
    progressPercent = isNaN(levelProgress) ? 0 : Math.round(levelProgress);
  } else if (levelProgress && typeof levelProgress === 'object' && 'progress' in levelProgress) {
    progressPercent = isNaN(levelProgress.progress) ? 0 : Math.round(levelProgress.progress);
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Top bar with level, XP, and progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className={`level-text text-white ${textSizeClasses[size]}`}>Level {level}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`xp-text text-gray-400 ${textSizeClasses[size]}`}>{formatXP(currentXP!)} / {formatXP(xpForNextLevel)} XP</span>
          <span className={`text-green-400 font-medium ${textSizeClasses[size]}`}>{progressPercent}%</span>
        </div>
      </div>
      
      <div className={`xp-bar ${sizeClasses[size]} relative`}>
        <motion.div
          className="xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {showDetails && (
        <div className="flex justify-between items-center">
          <span className={`text-gray-500 ${textSizeClasses[size]}`}>{formatXP(xpToNextLevel)} XP to next level</span>
          {/* <span className={`text-green-400 font-medium ${textSizeClasses[size]}`}>{progressPercent}%</span> */}
        </div>
      )}
    </div>
  );
}
