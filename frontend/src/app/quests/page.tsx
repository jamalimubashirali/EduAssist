'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGamificationDashboard } from '@/hooks/useGamificationData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { useRouter } from 'next/navigation'
import QuestCard from '@/app/components/gamification/QuestCard'
import { 
  Clock, 
  Calendar, 
  Star, 
  Target,
  Loader2
} from 'lucide-react'
import { Quest } from '@/types'


export default function QuestsPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'daily' | 'weekly' | 'special'>('all')
  
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const {
    quests,
    dailyQuests,
    weeklyQuests,
    specialQuests,
    activeQuests,
    completedQuests,
    claimableQuests,
    summary,
    isQuestsLoading
  } = useGamificationDashboard(user?.id)

  const filteredQuests = selectedFilter === 'all' ? quests :
    selectedFilter === 'daily' ? dailyQuests :
    selectedFilter === 'weekly' ? weeklyQuests :
    specialQuests

  const QuestSection = ({ 
    title, 
    icon: Icon, 
    quests: questList, 
    color 
  }: { 
    title: string
    icon: any
    quests: Quest[]
    color: string 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <Icon className={`w-6 h-6 ${color}`} />
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm">
          {questList.length}
        </span>
      </div>
      
      {questList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questList.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      ) : (
        <div className="game-card p-8 text-center">
          <div className="text-gray-400 mb-2">No {title.toLowerCase()} available</div>
          <p className="text-gray-500 text-sm">Check back later for new challenges!</p>
        </div>
      )}
    </motion.div>
  )

  if (isQuestsLoading || !user) {
    return (
        <GameLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </GameLayout>
    )
  }

  return (
      <GameLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            className="game-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Quest Hub 🎯
                </h1>
                <p className="text-gray-400">
                  Complete quests to earn XP, badges, and unlock new challenges!
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {claimableQuests.length}
                </div>
                <div className="text-gray-400 text-sm">Ready to claim</div>
              </div>
            </div>
          </motion.div>

          {/* Quest Filters */}
          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {[
              { id: 'all', label: 'All Quests', icon: Target },
              { id: 'daily', label: 'Daily', icon: Clock },
              { id: 'weekly', label: 'Weekly', icon: Calendar },
              { id: 'special', label: 'Special', icon: Star },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedFilter === filter.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </motion.div>

          {/* Quest Stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {activeQuests.length}
              </div>
              <div className="text-gray-400 text-sm">Active Quests</div>
            </div>
            
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {summary.completedQuestsCount}
              </div>
              <div className="text-gray-400 text-sm">Completed</div>
            </div>
            
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {quests.reduce((sum, q) => sum + q.xpReward, 0)}
              </div>
              <div className="text-gray-400 text-sm">Total XP Available</div>
            </div>
            
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {claimableQuests.length}
              </div>
              <div className="text-gray-400 text-sm">Ready to Claim</div>
            </div>
          </motion.div>

          {/* Filtered Quests Display */}
          {selectedFilter === 'all' ? (
            <>
              {/* Daily Quests */}
              <QuestSection
                title="Daily Quests"
                icon={Clock}
                quests={dailyQuests}
                color="text-blue-400"
              />

              {/* Weekly Quests */}
              <QuestSection
                title="Weekly Challenges"
                icon={Calendar}
                quests={weeklyQuests}
                color="text-purple-400"
              />

              {/* Special Quests */}
              <QuestSection
                title="Special Missions"
                icon={Star}
                quests={specialQuests}
                color="text-orange-400"
              />
            </>
          ) : (
            <QuestSection
              title={selectedFilter === 'daily' ? 'Daily Quests' : 
                     selectedFilter === 'weekly' ? 'Weekly Challenges' : 'Special Missions'}
              icon={selectedFilter === 'daily' ? Clock : 
                    selectedFilter === 'weekly' ? Calendar : Star}
              quests={filteredQuests}
              color={selectedFilter === 'daily' ? 'text-blue-400' : 
                     selectedFilter === 'weekly' ? 'text-purple-400' : 'text-orange-400'}
            />
          )}

          {/* Empty State */}
          {quests.length === 0 && !isQuestsLoading && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No quests available</h3>
              <p className="text-gray-400">Complete some quizzes to unlock new challenges!</p>
            </motion.div>
          )}
        </div>
      </GameLayout>
  )
}
