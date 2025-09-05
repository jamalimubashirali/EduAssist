'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSubjectsOverview, useSearchSubjects } from '@/hooks/useSubjectData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Search, 
  TrendingUp, 
  Users, 
  Clock,
  Star,
  ArrowRight
} from 'lucide-react'
import NavigationSuggestions, { generateNavigationSuggestions } from '@/components/ui/NavigationSuggestions'

export default function SubjectsPage() {
  const { user } = useUserStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'popular' | 'recent'>('all')
  
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const { 
    subjects, 
    popularSubjects, 
    isLoading, 
    totalTopics, 
    totalQuizzes 
  } = useSubjectsOverview()
  
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    error: searchError 
  } = useSearchSubjects(searchQuery)

  // Generate contextual navigation suggestions
  const navigationSuggestions = generateNavigationSuggestions({
    currentPage: '/subjects',
    user,
    userProgress: user ? {
      averageScore: user.averageScore || 0,
      streakCount: user.streakCount || 0,
      totalQuizzes: user.totalQuizzesAttempted || 0
    } : undefined
  })

  const displayedSubjects = searchQuery 
    ? searchResults || []
    : selectedFilter === 'popular' 
      ? popularSubjects 
      : subjects

  const filters = [
    { id: 'all', name: 'All Subjects', icon: BookOpen },
    { id: 'popular', name: 'Popular', icon: TrendingUp },
    { id: 'recent', name: 'Recently Added', icon: Clock },
  ]

  // Loading state for search
  const showLoading = isLoading || (searchQuery && isSearching)

  // Error handling
  if (searchError) {
    console.error('Search error:', searchError)
  }

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Learning Subjects 📚
            </h1>
            <p className="text-gray-400">
              Explore different subjects and start your learning journey
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">
              {subjects.length}
            </div>
            <div className="text-gray-400 text-sm">Total Subjects</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id as any)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedFilter === filter.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{filter.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading State */}
        {showLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={`loading-skeleton-${i}`} className="game-card p-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-700 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Status */}
        {searchQuery && !isSearching && (
          <div className="mb-4 text-sm text-gray-400">
            {searchResults?.length ? 
              `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${searchQuery}"` :
              `No results found for "${searchQuery}"`
            }
          </div>
        )}

        {/* Subjects Grid */}
        {!showLoading && displayedSubjects.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {displayedSubjects.map((subject, index) => (
              <motion.div
                key={`subject-${subject.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/subjects/${subject.id}`}>
                  <div className="game-card p-6 hover:border-purple-500 transition-all duration-200 cursor-pointer group">
                    {/* Subject Icon */}
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: subject.color + '20', color: subject.color }}
                    >
                      {subject.icon}
                    </div>

                    {/* Subject Info */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {subject.description}
                    </p>

                    {/* Stats with real data */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-blue-400">
                          <BookOpen className="w-4 h-4" />
                          <span>{subject.topicCount || 0} topics</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-400">
                          <Users className="w-4 h-4" />
                          <span>{subject.quizCount || 0} quizzes</span>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    {/* Popular Badge */}
                    {Array.isArray(popularSubjects) && popularSubjects.some(p => p.id === subject.id) && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Popular
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!showLoading && displayedSubjects.length === 0 && (
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
              {searchQuery ? 'No subjects found' : 'No subjects available'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery 
                ? `No subjects match "${searchQuery}". Try a different search term.`
                : 'There are no subjects available at the moment.'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="game-button px-6 py-3"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}

        {/* Enhanced Quick Stats with real data */}
        {!showLoading && displayedSubjects.length > 0 && (
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="game-card p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {totalTopics}
              </div>
              <div className="text-gray-400">Total Topics</div>
            </div>
            
            <div className="game-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {totalQuizzes}
              </div>
              <div className="text-gray-400">Total Quizzes</div>
            </div>
            
            <div className="game-card p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {Array.isArray(popularSubjects) ? popularSubjects.length : 0}
              </div>
              <div className="text-gray-400">Popular Subjects</div>
            </div>
          </motion.div>
        )}

        {/* Contextual Navigation Suggestions */}
        {navigationSuggestions.length > 0 && (
          <NavigationSuggestions 
            suggestions={navigationSuggestions}
            title="Get Started"
            className="mt-12"
          />
        )}
      </div>
    </GameLayout>
  )
}
