'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Target, Brain, Sparkles, Zap } from 'lucide-react'

interface RecommendationLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'animated' | 'minimal' | 'badge'
  showText?: boolean
  className?: string
}

export default function RecommendationLogo({ 
  size = 'md', 
  variant = 'default',
  showText = true,
  className = '' 
}: RecommendationLogoProps) {
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8', 
    xl: 'w-10 h-10'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center`}>
          <Lightbulb className={`${iconSizes[size]} text-white`} />
        </div>
        {showText && (
          <span className={`font-game text-purple-400 ${textSizes[size]}`}>
            Recommendations
          </span>
        )}
      </div>
    )
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full ${className}`}>
        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Lightbulb className="w-3 h-3 text-white" />
        </div>
        {showText && (
          <span className="font-game text-purple-400 text-sm">
            AI Recommendations
          </span>
        )}
      </div>
    )
  }

  if (variant === 'animated') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <motion.div 
          className={`${sizeClasses[size]} relative`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main logo container */}
          <div className="relative w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            {/* Sparkle effects */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ 
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </motion.div>
            
            {/* Main icon */}
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Lightbulb className={`${iconSizes[size]} text-white`} />
            </motion.div>
            
            {/* Secondary icons */}
            <motion.div
              className="absolute -bottom-1 -left-1"
              animate={{ 
                scale: [0.6, 1, 0.6],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <Target className="w-3 h-3 text-blue-300" />
            </motion.div>
          </div>
        </motion.div>
        
        {showText && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`font-game text-purple-400 ${textSizes[size]} mb-1`}>
              AI Recommendations
            </div>
            <div className="text-xs text-gray-400 font-secondary">
              Personalized for You
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20" />
        
        {/* Main icon */}
        <Lightbulb className={`${iconSizes[size]} text-white relative z-10`} />
        
        {/* Corner accent */}
        <div className="absolute top-1 right-1">
          <Brain className="w-3 h-3 text-purple-200 opacity-60" />
        </div>
      </div>
      
      {showText && (
        <div>
          <div className={`font-game text-purple-400 ${textSizes[size]}`}>
            AI Recommendations
          </div>
          <div className="text-xs text-gray-400 font-secondary">
            Smart Learning Suggestions
          </div>
        </div>
      )}
    </div>
  )
}

// Export individual logo components for specific use cases
export const RecommendationIcon = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center ${className}`}>
      <Lightbulb className={`${iconSizes[size]} text-white`} />
    </div>
  )
}

export const RecommendationBadge = ({ className = '' }: { className?: string }) => (
  <RecommendationLogo variant="badge" size="sm" className={className} />
)
