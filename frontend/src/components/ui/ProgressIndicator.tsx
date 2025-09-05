'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle } from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
  completed: boolean
  current?: boolean
  href?: string
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export default function ProgressIndicator({ 
  steps, 
  className = '',
  orientation = 'horizontal'
}: ProgressIndicatorProps) {
  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : step.current ? (
                <div className="w-6 h-6 rounded-full border-2 border-purple-400 bg-purple-400/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
              ) : (
                <Circle className="w-6 h-6 text-gray-600" />
              )}
            </div>
            
            <div className="flex-1">
              {step.href ? (
                <a 
                  href={step.href}
                  className={`text-sm font-medium transition-colors ${
                    step.completed 
                      ? 'text-green-400 hover:text-green-300' 
                      : step.current 
                        ? 'text-purple-400 hover:text-purple-300' 
                        : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {step.label}
                </a>
              ) : (
                <span className={`text-sm font-medium ${
                  step.completed 
                    ? 'text-green-400' 
                    : step.current 
                      ? 'text-purple-400' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div className="absolute left-3 mt-8 w-px h-4 bg-gray-700"></div>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          className="flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0 mb-2">
              {step.completed ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : step.current ? (
                <div className="w-8 h-8 rounded-full border-2 border-purple-400 bg-purple-400/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                </div>
              ) : (
                <Circle className="w-8 h-8 text-gray-600" />
              )}
            </div>
            
            <div className="text-center">
              {step.href ? (
                <a 
                  href={step.href}
                  className={`text-xs font-medium transition-colors ${
                    step.completed 
                      ? 'text-green-400 hover:text-green-300' 
                      : step.current 
                        ? 'text-purple-400 hover:text-purple-300' 
                        : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {step.label}
                </a>
              ) : (
                <span className={`text-xs font-medium ${
                  step.completed 
                    ? 'text-green-400' 
                    : step.current 
                      ? 'text-purple-400' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              )}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4">
              <div className={`h-px ${
                steps[index + 1].completed || step.completed 
                  ? 'bg-green-400' 
                  : 'bg-gray-700'
              }`}></div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Helper function to generate learning progress steps
export function generateLearningProgressSteps(
  context: {
    subject?: { id: string; name: string }
    topic?: { id: string; name: string }
    userProgress?: { averageScore: number }
    currentPage: string
  }
): ProgressStep[] {
  const steps: ProgressStep[] = []
  
  // Basic learning journey steps
  steps.push({
    id: 'explore',
    label: 'Explore',
    completed: true, // User is already exploring if they're on the site
    href: '/subjects'
  })
  
  if (context.subject) {
    steps.push({
      id: 'choose-topic',
      label: 'Choose Topic',
      completed: !!context.topic,
      current: context.currentPage.includes('/subjects/') && !context.topic,
      href: `/subjects/${context.subject.id}`
    })
  }
  
  if (context.topic) {
    steps.push({
      id: 'practice',
      label: 'Practice',
      completed: false,
      current: context.currentPage.includes('/topics/'),
      href: `/quiz/generate?topic=${context.topic.id}`
    })
    
    steps.push({
      id: 'master',
      label: 'Master',
      completed: context.userProgress?.averageScore > 80,
      current: false
    })
  } else {
    steps.push({
      id: 'practice',
      label: 'Practice',
      completed: false,
      current: false,
      href: '/quiz/generate'
    })
    
    steps.push({
      id: 'master',
      label: 'Master',
      completed: false,
      current: false
    })
  }
  
  return steps
}