'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Play, Zap, Clock, Brain } from 'lucide-react'

interface StartQuizButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  quizType?: 'quick' | 'challenge' | 'subject' | 'custom'
  subject?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  questionCount?: number
  className?: string
  children?: React.ReactNode
  showStats?: boolean
  onStart?: () => void;
}

export default function StartQuizButton({
  variant = 'primary',
  size = 'md',
  quizType = 'quick',
  subject = 'mixed',
  difficulty = 'mixed',
  questionCount = 5,
  className = '',
  children,
  showStats = true,
  onStart
}: StartQuizButtonProps) {
  const router = useRouter()

  const handleStartQuiz = () => {
    onStart?.();
    // Create quiz parameters for real backend generation
    const params = new URLSearchParams({
      type: quizType,
      subject,
      difficulty,
      count: questionCount.toString()
    })
    
    // Navigate to real quiz generation page
    router.push(`/quiz/generate?${params.toString()}`)
  }

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
      case 'secondary':
        return 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg'
      case 'outline':
        return 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white'
      default:
        return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
    }
  }

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm'
      case 'md':
        return 'px-6 py-3 text-base'
      case 'lg':
        return 'px-8 py-4 text-lg'
      default:
        return 'px-6 py-3 text-base'
    }
  }

  // Get quiz type info
  const getQuizInfo = () => {
    switch (quizType) {
      case 'quick':
        return {
          icon: <Zap className="w-4 h-4" />,
          title: 'Quick Quiz',
          time: '2-3 min',
          xp: '+50 XP'
        }
      case 'challenge':
        return {
          icon: <Brain className="w-4 h-4" />,
          title: 'Challenge',
          time: '5-7 min',
          xp: '+150 XP'
        }
      case 'subject':
        return {
          icon: <Play className="w-4 h-4" />,
          title: `${subject} Quiz`,
          time: `${Math.ceil(questionCount * 1.5)} min`,
          xp: `+${questionCount * 20} XP`
        }
      default:
        return {
          icon: <Play className="w-4 h-4" />,
          title: 'Start Quiz',
          time: `${Math.ceil(questionCount * 1.5)} min`,
          xp: `+${questionCount * 20} XP`
        }
    }
  }

  const quizInfo = getQuizInfo()

  if (children) {
    // Custom content - just wrap with click handler
    return (
      <motion.button
        onClick={handleStartQuiz}
        className={`${getVariantStyles()} ${getSizeStyles()} ${className} rounded-lg quiz-start-text transition-all duration-200 flex items-center justify-center gap-2`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <motion.button
      onClick={handleStartQuiz}
      className={`${getVariantStyles()} ${getSizeStyles()} ${className} rounded-lg quiz-start-text transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background animation */}
      <motion.div
        className="absolute inset-0 bg-white/10"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        {quizInfo.icon}
        <span>{quizInfo.title}</span>
      </div>
      
      {/* Stats */}
      {showStats && (
        <div className="relative z-10 flex items-center gap-3 ml-2 text-sm opacity-80">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{quizInfo.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{quizInfo.xp}</span>
          </div>
        </div>
      )}
    </motion.button>
  )
}

// Preset components for common use cases
export function QuickQuizButton({ className = '', ...props }: Omit<StartQuizButtonProps, 'quizType'>) {
  return (
    <StartQuizButton
      quizType="quick"
      variant="primary"
      size="md"
      className={className}
      {...props}
    />
  )
}

export function ChallengeQuizButton({ className = '', ...props }: Omit<StartQuizButtonProps, 'quizType'>) {
  return (
    <StartQuizButton
      quizType="challenge"
      variant="secondary"
      size="md"
      className={className}
      {...props}
    />
  )
}

export function SubjectQuizButton({ 
  subject, 
  className = '', 
  ...props 
}: Omit<StartQuizButtonProps, 'quizType'> & { subject: string }) {
  return (
    <StartQuizButton
      quizType="subject"
      subject={subject}
      variant="outline"
      size="sm"
      className={className}
      {...props}
    />
  )
}
