'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGamificationStore } from '@/stores/useGamificationStore'
import { Flame, Calendar } from 'lucide-react'

interface StreakCounterProps {
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  clickable?: boolean
}

export default function StreakCounter({
  showDetails = true,
  size = 'md',
  className = '',
  clickable = true
}: StreakCounterProps) {
  const router = useRouter()
  const streak = useGamificationStore(state => state.streak);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const getStreakColor = () => {
    if (streak.current === 0) return 'text-gray-500'
    if (streak.current < 7) return 'text-orange-400'
    if (streak.current < 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStreakMessage = () => {
    if (streak.current === 0) return 'Start your streak!'
    if (streak.current === 1) return 'Great start!'
    if (streak.current < 7) return 'Keep it up!'
    if (streak.current < 30) return 'On fire!'
    return 'Legendary streak!'
  }

  const handleClick = () => {
    if (clickable) {
      router.push('/streak')
    }
  }

  return (
    <div
      className={`flex items-center gap-2 ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={handleClick}
    >
      <motion.div
        className={`flex items-center gap-2 ${getStreakColor()}`}
        animate={streak.current > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Flame className={`${iconSizeClasses[size]} ${streak.current > 0 ? 'streak-flame' : ''}`} />
        <span className={`font-bold ${sizeClasses[size]}`}>
          {streak.current}
        </span>
      </motion.div>

      {showDetails && (
        <div className="flex flex-col">
          <span className={`text-white font-medium ${sizeClasses[size]}`}>
            {getStreakMessage()}
          </span>
          {streak.longest > 0 && (
            <span className="text-gray-400 text-xs">
              {streak.longest && streak.longest === 1 ? 'Longest Streak: 1 day' : `Longest Streak: ${streak.longest} days`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
