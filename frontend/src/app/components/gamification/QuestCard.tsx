'use client'

import { motion } from 'framer-motion'
import { Quest } from '@/types'
import { getQuestDifficultyColor, formatXP, calculateProgress } from '@/lib/utils'
import { useQuestManager } from '@/hooks/useGamificationData'
import { CheckCircle, Clock, Zap, Gift } from 'lucide-react'

interface QuestCardProps {
  quest: Quest
  onClaim?: (questId: string) => void
}

export default function QuestCard({ quest, onClaim }: QuestCardProps) {
  const { handleQuestComplete, isCompleting } = useQuestManager()
  const difficultyColor = getQuestDifficultyColor(quest.difficulty)
  const progress = calculateProgress(quest.progress, quest.maxProgress)
  
  const handleClaim = () => {
    handleQuestComplete(quest.id)
    onClaim?.(quest.id)
  }

  const getTypeIcon = () => {
    switch (quest.type) {
      case 'daily':
        return <Clock className="w-4 h-4" />
      case 'weekly':
        return <Clock className="w-4 h-4" />
      default:
        return <Gift className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch (quest.type) {
      case 'daily':
        return 'text-blue-400 bg-blue-400/10'
      case 'weekly':
        return 'text-purple-400 bg-purple-400/10'
      default:
        return 'text-orange-400 bg-orange-400/10'
    }
  }

  return (
    <motion.div
      className="quest-card relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      {/* Quest Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg mb-1">{quest.title}</h3>
          <p className="text-gray-400 text-sm">{quest.description}</p>
        </div>
        
        {quest.isCompleted && !quest.isClaimed && (
          <motion.div
            className="ml-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <CheckCircle className="w-6 h-6 text-green-400" />
          </motion.div>
        )}
      </div>

      {/* Quest Meta */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
          {getTypeIcon()}
          {quest.type}
        </span>
        
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyColor}`}>
          {quest.difficulty}
        </span>
        
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-yellow-400 bg-yellow-400/10">
          <Zap className="w-3 h-3" />
          {formatXP(quest.xpReward)} XP
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-white font-medium">
            {quest.progress}/{quest.maxProgress}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Quest Actions */}
      <div className="flex items-center justify-between">
        {quest.expiresAt && (
          <div className="text-xs text-gray-500">
            Expires: {new Date(quest.expiresAt).toLocaleDateString()}
          </div>
        )}
        
        <div className="flex gap-2 ml-auto">
          {quest.isCompleted && !quest.isClaimed && (
            <motion.button
              className="game-button text-sm px-4 py-2 disabled:opacity-50"
              onClick={handleClaim}
              disabled={isCompleting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCompleting ? 'Claiming...' : 'Claim Reward'}
            </motion.button>
          )}
          
          {quest.isClaimed && (
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-green-400 bg-green-400/10">
              <CheckCircle className="w-4 h-4" />
              Completed
            </span>
          )}
          
          {!quest.isCompleted && (
            <span className="text-sm text-gray-500 px-3 py-2">
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Completion Glow Effect */}
      {quest.isCompleted && !quest.isClaimed && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}
