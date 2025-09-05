'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTopics, useSearchTopics } from '@/hooks/useTopicData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Search,
  ArrowRight,
  Brain,
  Target
} from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import NavigationSuggestions, { generateNavigationSuggestions } from '@/components/ui/NavigationSuggestions'

export default function TopicsPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')
  
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const { data: topics, isLoading } = useTopics()
  const { data: searchResults, isLoading: isSearching } = useSearchTopics(searchQuery)

  // Generate contextual navigation suggestions
  const navigationSuggestions = generateNavigationSuggestions({
    currentPage: '/topics',
    user,
    userProgress: user ? {
      averageScore: user.averageScore || 0,
      streakCount: user.streakCount || 0,
      totalQuizzes: user.totalQuizzesAttempted || 0
    } : undefined
  })

  const breadcrumbItems = [
    { label: 'Topics', current: true }
  ]

  const displayedTopics = searchQuery 
    ? searchResults || []
    : topics || []

  const filteredTopics = displayedTopics.filter(topic => 
    selectedDifficulty === 'all' || topic.difficulty === selectedDifficulty
  )

  const difficultyColors = {
    beginner: 'text-green-400 bg-green-400/20',
    intermediate: 'text-yellow-400 bg-yellow-400/20',
    advanced: 'text-red-400 bg-red-400/20'
  }

  if (!user) {
    return null
  }

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              All Topics 📖
            </h1>     
       <p className="text-gray-400">
              Explore learning topics across all subjects
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">
              {filteredTopics.length}
            </div>
            <div className="text-gray-400 text-sm">Topics Available</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty as any)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 capitalize ${
                  selectedDifficulty === difficulty
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || isSearching) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={`loading-${i}`} className="game-card p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Topics Grid */}
        {!isLoading && !isSearching && filteredTopics.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/topics/${topic.id}`}>
                  <div className="game-card p-6 hover:border-purple-500 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                          {topic.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {topic.description}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${difficultyColors[topic.difficulty]}`}>
                        {topic.difficulty}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-blue-400">
                          <Brain className="w-4 h-4" />
                          <span>{topic.quizCount || 0} quizzes</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-400">
                          <Target className="w-4 h-4" />
                          <span>{topic.questionCount || 0} questions</span>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !isSearching && filteredTopics.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'No topics found' : 'No topics available'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery 
                ? `No topics match "${searchQuery}" with the selected filters.`
                : 'There are no topics available at the moment.'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedDifficulty('all')
                }}
                className="game-button px-6 py-3"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Contextual Navigation Suggestions */}
        {navigationSuggestions.length > 0 && (
          <NavigationSuggestions 
            suggestions={navigationSuggestions}
            title="Quick Actions"
            className="mt-12"
          />
        )}
      </div>
    </GameLayout>
  )
}