'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Lightbulb, Flag, BookOpen } from 'lucide-react'

interface QuizQuestionProps {
  question: {
    _id?: string
    id?: string
    questionText: string
    answerOptions: string[]
    correctAnswer: number
    explanation?: string
    difficulty?: string
    questionDifficulty?: string
    tags?: string[]
    timeLimit?: number
  }
  selectedAnswer: number | null
  onAnswerSelect: (answerIndex: number) => void
  onSubmit: () => void
  showExplanation?: boolean
  isCorrect?: boolean
  timeSpent?: number
  questionNumber: number
  totalQuestions: number
  disabled?: boolean
  showHints?: boolean
}

export default function QuizQuestion({
  question,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  showExplanation = false,
  isCorrect,
  timeSpent,
  questionNumber,
  totalQuestions,
  disabled = false,
  showHints = true
}: QuizQuestionProps) {
  const [questionStartTime] = useState(Date.now())
  const [currentTimeSpent, setCurrentTimeSpent] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // Debug logging for question data - simplified to avoid hook order issues
  console.log('📝 [QUIZ_QUESTION] Component rendered with question:', question)
  if (question) {
    console.log('🔍 [QUIZ_QUESTION] Question details:', {
      id: question?.id,
      text: question?.questionText?.substring(0, 50) + '...',
      optionsCount: question?.answerOptions?.length || 0,
      correctAnswer: question?.correctAnswer,
      explanation: question?.explanation ? 'Present' : 'Missing',
      difficulty: question?.difficulty || question?.questionDifficulty,
      tags: question?.tags
    })
  }

  // Update time spent
  useEffect(() => {
    if (!showExplanation && !disabled) {
      const timer = setInterval(() => {
        setCurrentTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [questionStartTime, showExplanation, disabled])

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'hard': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getOptionStyle = (index: number) => {
    if (showExplanation) {
      if (index === question.correctAnswer) {
        return 'bg-green-500/20 border-green-500 text-green-400'
      }
      if (index === selectedAnswer && index !== question.correctAnswer) {
        return 'bg-red-500/20 border-red-500 text-red-400'
      }
      return 'bg-gray-800/50 border-gray-600 text-gray-400'
    }
    
    if (selectedAnswer === index) {
      return 'bg-purple-600 border-purple-400 text-white'
    }
    
    return 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-750'
  }

  const getOptionIcon = (index: number) => {
    if (showExplanation) {
      if (index === question.correctAnswer) {
        return <CheckCircle className="w-5 h-5 text-green-400" />
      }
      if (index === selectedAnswer && index !== question.correctAnswer) {
        return <XCircle className="w-5 h-5 text-red-400" />
      }
    }
    
    return (
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        selectedAnswer === index
          ? 'border-white bg-white text-purple-600'
          : 'border-gray-500'
      }`}>
        {selectedAnswer === index && <div className="w-2 h-2 bg-purple-600 rounded-full" />}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-400">
              Question {questionNumber} of {totalQuestions}
            </span>
            
            {question.difficulty && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty}
              </span>
            )}
            
            {question.tags && question.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {question.tags.slice(0, 2).join(', ')}
                </span>
              </div>
            )}
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
            {question.questionText}
          </h2>
        </div>

        {/* Time and Actions */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{timeSpent || currentTimeSpent}s</span>
          </div>
          
          {showHints && !showExplanation && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Lightbulb className="w-3 h-3" />
              Hint
            </button>
          )}
        </div>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && !showExplanation && (
          <motion.div
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-blue-400 font-semibold mb-1">Hint</div>
                <div className="text-blue-300 text-sm">
                  Think about the key concepts related to {question.tags?.[0] || 'this topic'}. 
                  Consider the most fundamental or commonly accepted answer.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.answerOptions.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => !disabled && !showExplanation && onAnswerSelect(index)}
            disabled={disabled || showExplanation}
            className={`
              w-full p-4 rounded-lg text-left transition-all duration-200 border-2
              ${getOptionStyle(index)}
              ${disabled || showExplanation ? 'cursor-default' : 'cursor-pointer'}
            `}
            whileHover={!disabled && !showExplanation ? { scale: 1.01 } : {}}
            whileTap={!disabled && !showExplanation ? { scale: 0.99 } : {}}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              {getOptionIcon(index)}
              <span className="font-medium flex-1">{option}</span>
              
              {/* Option Label */}
              <span className="text-xs text-gray-500 font-mono">
                {String.fromCharCode(65 + index)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && question.explanation && (
          <motion.div
            className={`rounded-lg p-6 border-2 ${
              isCorrect 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isCorrect ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${
                  isCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                
                <p className="text-gray-300 leading-relaxed">
                  {question.explanation}
                </p>
                
                {!isCorrect && (
                  <div className="mt-3 text-sm text-gray-400">
                    The correct answer was: <span className="text-green-400 font-semibold">
                      {question.answerOptions[question.correctAnswer]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      {!showExplanation && (
        <motion.button
          onClick={onSubmit}
          disabled={selectedAnswer === null || disabled}
          className={`
            w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200
            ${selectedAnswer !== null && !disabled
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
          whileHover={selectedAnswer !== null && !disabled ? { scale: 1.02 } : {}}
          whileTap={selectedAnswer !== null && !disabled ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {questionNumber === totalQuestions ? 'Finish Quiz' : 'Next Question'}
        </motion.button>
      )}
    </div>
  )
}
