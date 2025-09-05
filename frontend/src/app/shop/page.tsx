'use client'

import { motion } from 'framer-motion'
import GameLayout from '@/app/components/layout/GameLayout'
import { ShoppingBag, Palette, Zap, Crown, Lock } from 'lucide-react'

const shopItems = [
  {
    id: '1',
    name: 'Dark Theme',
    description: 'Sleek dark interface theme',
    price: 500,
    type: 'theme',
    icon: '🌙',
    rarity: 'common',
    owned: false
  },
  {
    id: '2',
    name: 'Neon Theme',
    description: 'Vibrant neon colors',
    price: 750,
    type: 'theme',
    icon: '⚡',
    rarity: 'rare',
    owned: false
  },
  {
    id: '3',
    name: 'Golden Avatar Frame',
    description: 'Prestigious golden border',
    price: 1000,
    type: 'avatar',
    icon: '👑',
    rarity: 'epic',
    owned: false
  },
  {
    id: '4',
    name: 'XP Booster',
    description: '2x XP for 24 hours',
    price: 300,
    type: 'booster',
    icon: '🚀',
    rarity: 'common',
    owned: false
  }
]

export default function ShopPage() {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400 text-gray-400'
      case 'rare':
        return 'border-blue-400 text-blue-400'
      case 'epic':
        return 'border-purple-400 text-purple-400'
      case 'legendary':
        return 'border-yellow-400 text-yellow-400'
      default:
        return 'border-gray-400 text-gray-400'
    }
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
                Reward Shop 🛍️
              </h1>
              <p className="text-gray-400">
                Spend your hard-earned XP on awesome rewards and customizations!
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                1,250 XP
              </div>
              <div className="text-gray-400 text-sm">Available to Spend</div>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon Notice */}
        <motion.div
          className="game-card p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Shop Coming Soon!</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            We're working hard to bring you an amazing selection of themes, avatars, 
            boosters, and other exciting rewards. Stay tuned!
          </p>
          
          <div className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Premium features in development</span>
          </div>
        </motion.div>

        {/* Preview Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Preview Items</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shopItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="game-card p-6 text-center relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-400 text-sm font-medium">Coming Soon</span>
                  </div>
                </div>
                
                {/* Item Content */}
                <div className="text-4xl mb-4">{item.icon}</div>
                
                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mb-4 ${getRarityColor(item.rarity)}`}>
                  {item.rarity.toUpperCase()}
                </div>
                
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-4">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold">{item.price} XP</span>
                </div>
                
                <button 
                  className="w-full py-2 px-4 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Categories Preview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Themes</h3>
            <p className="text-gray-400 text-sm">Customize your interface with beautiful themes</p>
          </div>
          
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Avatar Items</h3>
            <p className="text-gray-400 text-sm">Frames, badges, and profile decorations</p>
          </div>
          
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Boosters</h3>
            <p className="text-gray-400 text-sm">Temporary bonuses and power-ups</p>
          </div>
        </motion.div>
      </div>
    </GameLayout>
  )
}
