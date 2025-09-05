'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, Zap } from 'lucide-react'

interface QuizTimerProps {
  totalTime: number // in seconds
  onTimeUp: () => void
  onTimeWarning?: (timeLeft: number) => void
  isPaused?: boolean
  showWarnings?: boolean
  warningThresholds?: number[] // in seconds, e.g., [60, 30, 10]
}

export default function QuizTimer({
  totalTime,
  onTimeUp,
  onTimeWarning,
  isPaused = false,
  showWarnings = true,
  warningThresholds = [60, 30, 10]
}: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTime)
  const [isWarning, setIsWarning] = useState(false)
  const [isCritical, setIsCritical] = useState(false)
  const [warningsTriggered, setWarningsTriggered] = useState<Set<number>>(new Set())
  const [pendingWarning, setPendingWarning] = useState<number | null>(null);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get timer color based on time left
  const getTimerColor = useCallback(() => {
    const percentage = (timeLeft / totalTime) * 100
    if (percentage <= 10) return 'text-red-400'
    if (percentage <= 25) return 'text-orange-400'
    if (percentage <= 50) return 'text-yellow-400'
    return 'text-green-400'
  }, [timeLeft, totalTime])

  // Get progress bar color
  const getProgressColor = useCallback(() => {
    const percentage = (timeLeft / totalTime) * 100
    if (percentage <= 10) return 'from-red-500 to-red-600'
    if (percentage <= 25) return 'from-orange-500 to-red-500'
    if (percentage <= 50) return 'from-yellow-500 to-orange-500'
    return 'from-green-500 to-blue-500'
  }, [timeLeft, totalTime])

  // Timer effect (defer callbacks to avoid setState during child render)
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1

        // Check for warnings
        if (showWarnings && warningThresholds.includes(newTime) && !warningsTriggered.has(newTime)) {
          setWarningsTriggered(prev => new Set([...prev, newTime]))
          setPendingWarning(newTime)
        }

        // Update warning states
        if (newTime <= 10) {
          setIsCritical(true)
          setIsWarning(true)
        } else if (newTime <= 60) {
          setIsWarning(true)
          setIsCritical(false)
        } else {
          setIsWarning(false)
          setIsCritical(false)
        }

        // Time's up: schedule onTimeUp outside of render phase
        if (newTime <= 0) {
          setTimeout(() => onTimeUp(), 0)
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused, timeLeft, onTimeUp, showWarnings, warningThresholds, warningsTriggered])

  // Effect to notify parent of warning
  useEffect(() => {
    if (pendingWarning !== null) {
      onTimeWarning?.(pendingWarning);
      setPendingWarning(null);
    }
  }, [pendingWarning, onTimeWarning]);

  // Reset warnings when time changes externally
  useEffect(() => {
    setTimeLeft(totalTime)
    setWarningsTriggered(new Set())
    setIsWarning(false)
    setIsCritical(false)
  }, [totalTime])

  const percentage = (timeLeft / totalTime) * 100

  return (
    <div className="flex items-center gap-3">
      {/* Timer Icon */}
      <motion.div
        animate={isCritical ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
      >
        {isCritical ? (
          <AlertTriangle className={`w-5 h-5 ${getTimerColor()}`} />
        ) : (
          <Clock className={`w-5 h-5 ${getTimerColor()}`} />
        )}
      </motion.div>

      {/* Time Display */}
      <motion.div
        className={`font-mono text-lg font-bold ${getTimerColor()}`}
        animate={isCritical ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
      >
        {formatTime(timeLeft)}
      </motion.div>

      {/* Progress Bar */}
      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getProgressColor()}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Warning Pulse Effect */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            className="absolute inset-0 bg-red-500/10 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Speed Indicator */}
      {isPaused && (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>Paused</span>
        </div>
      )}
    </div>
  )
}

// Timer Warning Component
export function TimerWarning({ 
  timeLeft, 
  onDismiss 
}: { 
  timeLeft: number
  onDismiss: () => void 
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      className="fixed top-4 right-4 z-50 bg-orange-500 text-white p-4 rounded-lg shadow-lg"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <div className="font-semibold">Time Warning!</div>
          <div className="text-sm">{formatTime(timeLeft)} remaining</div>
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}
