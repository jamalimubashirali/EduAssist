'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle, XCircle, Clock, Zap, Target } from 'lucide-react'

interface QuizProgressProps {
  currentQuestion: number
  totalQuestions: number
  answers: (number | null)[]
  correctAnswers?: boolean[]
  timePerQuestion?: number[]
  streak?: number
  showDetailedProgress?: boolean
}

export default function QuizProgress({
  currentQuestion,
  totalQuestions,
  answers,
  correctAnswers = [],
  timePerQuestion = [],
  streak = 0,
  showDetailedProgress = false
}: QuizProgressProps) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100
  const answeredCount = answers.filter(answer => answer !== null).length
  const correctCount = correctAnswers.filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-gray-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Answered Count */}
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">Answered:</span>
            <span className="text-white font-semibold">{answeredCount}/{totalQuestions}</span>
          </div>

          {/* Correct Count */}
          {correctAnswers.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">Correct:</span>
              <span className="text-green-400 font-semibold">{correctCount}</span>
            </div>
          )}

          {/* Streak */}
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Zap className="w-4 h-4" />
              <span className="font-semibold">{streak} streak!</span>
            </motion.div>
          )}
        </div>

        {/* Average Time */}
        {timePerQuestion.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400">Avg:</span>
            <span className="text-yellow-400 font-semibold">
              {Math.round(timePerQuestion.reduce((a, b) => a + b, 0) / timePerQuestion.length)}s
            </span>
          </div>
        )}
      </div>

      {/* Detailed Progress (Question Dots) */}
      {showDetailedProgress && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Question Progress:</div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: totalQuestions }, (_, index) => {
              const isAnswered = answers[index] !== null && answers[index] !== undefined
              const isCorrect = correctAnswers[index] === true
              const isCurrent = index === currentQuestion
              const isPast = index < currentQuestion

              return (
                <motion.div
                  key={index}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300 relative
                    ${isCurrent 
                      ? 'bg-purple-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900' 
                      : isPast && isAnswered
                        ? isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : isPast
                          ? 'bg-gray-600 text-gray-400'
                          : 'bg-gray-700 text-gray-500'
                    }
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {isPast && isAnswered ? (
                    isCorrect ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )
                  ) : (
                    index + 1
                  )}

                  {/* Time indicator */}
                  {timePerQuestion[index] && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                      {timePerQuestion[index]}s
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {showDetailedProgress && correctAnswers.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {Math.round((correctCount / Math.max(answeredCount, 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-400">Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {timePerQuestion.length > 0 
                ? Math.round(timePerQuestion.reduce((a, b) => a + b, 0) / timePerQuestion.length)
                : 0}s
            </div>
            <div className="text-xs text-gray-400">Avg Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {streak}
            </div>
            <div className="text-xs text-gray-400">Best Streak</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini Progress Component for compact spaces
export function MiniQuizProgress({
  currentQuestion,
  totalQuestions,
  correctCount = 0
}: {
  currentQuestion: number
  totalQuestions: number
  correctCount?: number
}) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-400">
        {currentQuestion + 1}/{totalQuestions}
      </div>
      
      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {correctCount > 0 && (
        <div className="text-sm text-green-400 font-semibold">
          {correctCount} ✓
        </div>
      )}
    </div>
  )
}
