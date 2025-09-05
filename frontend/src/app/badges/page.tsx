'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'
import { useGamificationDashboard } from '@/hooks/useGamificationData'
import GameLayout from '@/app/components/layout/GameLayout'
import BadgeCard from '@/app/components/gamification/BadgeCard'
import { 
  Award, 
  Trophy, 
  Star, 
  Target,
  Zap,
  BookOpen,
  Users,
  Calendar,
  Brain,
  Heart,
  Shield,
  Crown,
  Sparkles,
  Filter,
  Lock,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

export default function BadgesPage() {
  const { user } = useUserStore()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'learning' | 'streak' | 'achievement' | 'social'>('all')
  const [selectedRarity, setSelectedRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')

  const {
    badges,
    unlockedBadges,
    lockedBadges,
    summary,
    isBadgesLoading
  } = useGamificationDashboard(user?.id)

  const filteredBadges = badges.filter(badge => {
    const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory
    const rarityMatch = selectedRarity === 'all' || badge.rarity === selectedRarity
    return categoryMatch && rarityMatch
  })

  const categories = [
    { id: 'all', label: 'All Badges', icon: Award },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'streak', label: 'Streaks', icon: Zap },
    { id: 'achievement', label: 'Achievements', icon: Trophy },
    { id: 'social', label: 'Social', icon: Users }
  ]

  const rarities = [
    { id: 'all', label: 'All Rarities', color: 'text-gray-400' },
    { id: 'common', label: 'Common', color: 'text-gray-400' },
    { id: 'rare', label: 'Rare', color: 'text-blue-400' },
    { id: 'epic', label: 'Epic', color: 'text-purple-400' },
    { id: 'legendary', label: 'Legendary', color: 'text-yellow-400' }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/30 bg-gray-500/5'
      case 'rare': return 'border-blue-500/30 bg-blue-500/5'
      case 'epic': return 'border-purple-500/30 bg-purple-500/5'
      case 'legendary': return 'border-yellow-500/30 bg-yellow-500/5'
      default: return 'border-gray-500/30 bg-gray-500/5'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const unlockedCount = unlockedBadges.length

  if (isBadgesLoading) {
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
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Badge Collection 🏆</h1>
          <p className="text-gray-400">Showcase your learning achievements and milestones</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{unlockedCount}</div>
            <div className="text-sm text-gray-400">Unlocked</div>
          </div>
          <div className="game-card p-4 text-center">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{badges.length}</div>
            <div className="text-sm text-gray-400">Total Badges</div>
          </div>
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {unlockedBadges.filter(b => b.rarity === 'rare' || b.rarity === 'epic' || b.rarity === 'legendary').length}
            </div>
            <div className="text-sm text-gray-400">Rare+ Badges</div>
          </div>
          <div className="game-card p-4 text-center">
            <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round((unlockedCount / Math.max(badges.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Completion</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Category Filter */}
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>

          {/* Rarity Filter */}
          <div className="flex gap-2">
            {rarities.map((rarity) => (
              <button
                key={rarity.id}
                onClick={() => setSelectedRarity(rarity.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedRarity === rarity.id
                    ? 'bg-blue-600 text-white'
                    : `bg-gray-800 ${rarity.color} hover:bg-gray-700`
                }`}
              >
                {rarity.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Badges Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <AnimatePresence>
            {filteredBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                className={`game-card p-6 border ${getRarityColor(badge.rarity)} ${
                  badge.unlockedAt ? 'hover:scale-105' : 'opacity-75'
                } transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -5 }}
              >
                {/* Glow effect for unlocked badges */}
                {badge.unlockedAt && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                )}

                {/* Lock overlay for locked badges */}
                {!badge.unlockedAt && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                )}

                {/* Badge Icon */}
                <div className="text-center mb-4">
                  <div className={`text-6xl mb-2 ${badge.unlockedAt ? 'filter-none' : 'grayscale'}`}>
                    {badge.icon}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getRarityTextColor(badge.rarity)} bg-current/10`}>
                    {badge.rarity}
                  </div>
                </div>

                {/* Badge Info */}
                <div className="text-center space-y-2">
                  <h3 className={`text-xl font-bold ${badge.unlockedAt ? 'text-white' : 'text-gray-400'}`}>
                    {badge.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{badge.description}</p>

                  {/* Progress Bar */}
                  {!badge.unlockedAt && badge.progress && badge.maxProgress && badge.progress < badge.maxProgress && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{badge.progress}/{badge.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlock Date */}
                  {badge.unlockedAt && (
                    <div className="flex items-center justify-center gap-2 text-xs text-green-400 mt-3">
                      <CheckCircle className="w-3 h-3" />
                      <span>Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* No Badges Message */}
        {filteredBadges.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No badges found</h3>
            <p className="text-gray-400">Try adjusting your filters or complete more activities to unlock badges</p>
          </motion.div>
        )}

        {/* Achievement Tips */}
        <motion.div
          className="game-card p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Badge Hunting Tips
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-purple-400 font-semibold">Quick Wins:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Complete daily quizzes for streak badges</li>
                <li>• Try different subjects for variety badges</li>
                <li>• Aim for perfect scores on easier quizzes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-blue-400 font-semibold">Long-term Goals:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Maintain consistent learning streaks</li>
                <li>• Focus on improving subject mastery</li>
                <li>• Participate in community challenges</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </GameLayout>
  )
}
