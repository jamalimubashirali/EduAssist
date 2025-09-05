import { toast } from 'sonner'

// Custom toast utility with consistent styling for EduAssist
export const showToast = {
  success: (message: string, options?: { 
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }) => {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      style: {
        background: '#1F2937',
        border: '1px solid #10B981',
        borderLeft: '4px solid #10B981',
        color: '#F9FAFB',
      },
    })
  },

  error: (message: string, options?: { 
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }) => {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000, // Longer duration for errors
      action: options?.action,
      style: {
        background: '#1F2937',
        border: '1px solid #EF4444',
        borderLeft: '4px solid #EF4444',
        color: '#F9FAFB',
      },
    })
  },

  info: (message: string, options?: { 
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }) => {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      style: {
        background: '#1F2937',
        border: '1px solid #3B82F6',
        borderLeft: '4px solid #3B82F6',
        color: '#F9FAFB',
      },
    })
  },

  warning: (message: string, options?: { 
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }) => {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
      style: {
        background: '#1F2937',
        border: '1px solid #F59E0B',
        borderLeft: '4px solid #F59E0B',
        color: '#F9FAFB',
      },
    })
  },

  // Custom toast for XP gains
  xpGain: (xp: number, message?: string) => {
    return toast.success(message || `+${xp} XP Earned!`, {
      description: 'Keep up the great work!',
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
        border: '1px solid #9333ea',
        color: '#ffffff',
        fontWeight: '600',
      },
    })
  },

  // Custom toast for level up
  levelUp: (level: number) => {
    return toast.success(`🎉 Level ${level} Achieved!`, {
      description: 'You\'re getting stronger!',
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #fbbf24, #f97316)',
        border: '1px solid #fbbf24',
        color: '#111827',
        fontWeight: '700',
      },
    })
  },

  // Custom toast for achievements
  achievement: (title: string, description?: string) => {
    return toast.success(`🏆 ${title}`, {
      description: description || 'Achievement unlocked!',
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        border: '1px solid #10b981',
        color: '#ffffff',
        fontWeight: '600',
      },
    })
  },

  // Custom toast for quiz completion
  quizComplete: (score: number, totalQuestions: number) => {
    const percentage = Math.round((score / totalQuestions) * 100)
    const isGoodScore = percentage >= 70
    
    return toast.success(`Quiz Complete! ${score}/${totalQuestions}`, {
      description: `You scored ${percentage}%`,
      duration: 4000,
      style: {
        background: isGoodScore ? '#1F2937' : '#1F2937',
        border: `1px solid ${isGoodScore ? '#10B981' : '#F59E0B'}`,
        borderLeft: `4px solid ${isGoodScore ? '#10B981' : '#F59E0B'}`,
        color: '#F9FAFB',
      },
    })
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss()
  },

  // Dismiss specific toast
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId)
  }
}

// Export the original toast for advanced usage
export { toast }

// Default export
export default showToast
