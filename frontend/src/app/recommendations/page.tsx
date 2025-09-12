'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import RecommendationLogo from '@/components/ui/RecommendationLogo'
import {
  useUserRecommendations,
  useAcceptRecommendation,
  useDismissRecommendation,
  useCompleteRecommendation,
} from '@/hooks/useRecommendationData'
import {
  Brain,
  Target,
  TrendingUp,
  BookOpen,
  Play,
  Star,
  Clock,
  Zap,
  CheckCircle,
  X,
  Lightbulb,
  Award,
  Users,
  ArrowRight,
  Sparkles,
  Filter,
  RefreshCw
} from 'lucide-react'
import { SubjectQuizButton } from '../components/quiz/StartQuizButton'

export default function RecommendationsPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'weak' | 'practice' | 'advanced'>('all')

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Real recommendations
  const { data: allRecommendations, isLoading, refetch } = useUserRecommendations(undefined, 20)

  // Mutations
  const acceptRec = useAcceptRecommendation()
  const dismissRec = useDismissRecommendation()
  const completeRec = useCompleteRecommendation()
  const filteredRecommendations = (allRecommendations || []).filter(rec => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'weak') return rec.type === 'topic' || rec.type === 'quiz'
    if (selectedCategory === 'practice') return rec.type === 'quiz'
    if (selectedCategory === 'advanced') return rec.metadata?.difficulty === 'advanced'
    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weak_area': return <Target className="w-5 h-5 text-red-400" />
      case 'practice': return <BookOpen className="w-5 h-5 text-blue-400" />
      case 'streak': return <Zap className="w-5 h-5 text-yellow-400" />
      case 'new_topic': return <Sparkles className="w-5 h-5 text-purple-400" />
      default: return <Brain className="w-5 h-5 text-gray-400" />
    }
  }

  const handleStartPractice = (recommendationId: string, resourceId: string) => {
    // Validate resourceId before navigating
    if (!resourceId || resourceId.trim() === '') {
      console.warn('Invalid resource ID for recommendation:', recommendationId)
      return
    }
    
    // Check if it's a valid ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(resourceId)
    if (!isValidObjectId) {
      console.warn('Invalid ObjectId format for resource:', resourceId)
      return
    }
    
    router.push(`/quiz/instructions/${resourceId}`)
  }

  console.log(`Filtered Recommendations:`, filteredRecommendations)

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
          <RecommendationLogo variant="animated" size="xl" showText={false} className="mx-auto mb-4" />
          <h1 className="text-responsive-3xl font-bold text-gray-900 dark:text-white mb-2">AI Recommendations 🎯</h1>
          <p className="text-responsive-base text-gray-600 dark:text-gray-400">Personalized learning suggestions based on your progress</p>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="flex flex-wrap gap-2">
            {(['all', 'weak', 'practice', 'advanced'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-responsive-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-4 h-4 inline mr-1" />
                {category === 'all' ? 'All' :
                 category === 'weak' ? 'Weak Areas' :
                 category === 'practice' ? 'Practice' : 'Advanced'}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-responsive-sm font-medium transition-colors flex items-center gap-1"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card-theme p-4 text-center">
            <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-responsive-2xl font-bold text-gray-900 dark:text-white">{allRecommendations?.length ?? 0}</div>
            <div className="text-responsive-sm text-gray-600 dark:text-gray-400">Active</div>
          </div>
          <div className="game-card-theme p-4 text-center">
            <Target className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-responsive-2xl font-bold text-gray-900 dark:text-white">
              {(allRecommendations || []).filter((r: any) => r.type === 'topic' || r.type === 'quiz').length}
            </div>
            <div className="text-responsive-sm text-gray-600 dark:text-gray-400">Weak/Focus Areas</div>
          </div>
          <div className="game-card-theme p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-responsive-2xl font-bold text-gray-900 dark:text-white">
              {(() => {
                const arr = (allRecommendations || []) as any[]
                if (!arr.length) return '0%'
                const avg = Math.round(arr.reduce((sum, r) => sum + (r.confidence || 0), 0) / arr.length)
                return `${avg}%`
              })()}
            </div>
            <div className="text-responsive-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
          </div>
          <div className="game-card-theme p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-responsive-2xl font-bold text-gray-900 dark:text-white">
              {(allRecommendations || []).reduce((sum, r: any) => sum + (r.metadata?.estimatedTime ? 5 : 0), 0)}
            </div>
            <div className="text-responsive-sm text-gray-600 dark:text-gray-400">Potential Sessions</div>
          </div>
        </motion.div>          {/* Recommendations Grid */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="game-card p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-800 rounded mb-2"></div>
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredRecommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              className="game-card-theme p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                    {getTypeIcon(recommendation.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-responsive-xl font-bold text-white">{recommendation.title}</h3>
                      {recommendation.priority && (
                        <span className={`px-2 py-1 rounded-full text-responsive-xs font-medium ${
                          recommendation.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          recommendation.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {recommendation.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-responsive-base text-gray-300 mb-2">{recommendation.description}</p>
                    {recommendation.reason && (
                      <p className="text-responsive-sm text-blue-300 mb-2 italic">💡 {recommendation.reason}</p>
                    )}
                    <div className="flex items-center gap-4 text-responsive-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {recommendation.type === 'subject' ? 'Subject' : 
                         recommendation.type === 'topic' ? 'Topic' : 
                         recommendation.type === 'quiz' ? 'Quiz' : 'Study Plan'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recommendation.metadata?.estimatedTime || 15} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {recommendation.type === 'quiz' ? '120' : 
                         recommendation.type === 'topic' ? '80' : '50'} XP
                      </span>
                      {recommendation.confidence && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {Math.round(recommendation.confidence * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional metadata display */}
              {recommendation.metadata && Object.keys(recommendation.metadata).length > 0 && (
                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="text-responsive-sm font-semibold text-white mb-2">Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-responsive-sm">
                    {recommendation.metadata.difficulty && (
                      <span className="text-gray-300">
                        Difficulty: <span className="text-white">{recommendation.metadata.difficulty}</span>
                      </span>
                    )}
                    {recommendation.metadata.subjectId && (
                      <span className="text-gray-300">
                        Subject ID: <span className="text-white">{recommendation.metadata.subjectId}</span>
                      </span>
                    )}
                    {recommendation.metadata.topicId && (
                      <span className="text-gray-300">
                        Topic ID: <span className="text-white">{recommendation.metadata.topicId}</span>
                      </span>
                    )}
                    {recommendation.metadata.quizId && (
                      <span className="text-gray-300">
                        Quiz ID: <span className="text-white">{recommendation.metadata.quizId}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Resources */}
              {recommendation.metadata && (recommendation.metadata.quizId || recommendation.metadata.topicId) && (
                <div className="mb-4">
                  <h4 className="text-responsive-sm font-semibold text-white mb-2">Available Resources:</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.metadata.quizId && (
                      <button
                        onClick={() => handleStartPractice(recommendation.id, recommendation.metadata.quizId!)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-responsive-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Start Quiz
                      </button>
                    )}
                    {recommendation.metadata.topicId && !recommendation.metadata.quizId && (
                      <button
                        onClick={() => router.push(`/subjects/${recommendation.metadata.subjectId}/topics/${recommendation.metadata.topicId}`)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-responsive-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        Study Topic
                      </button>
                    )}
                    {recommendation.metadata.subjectId && !recommendation.metadata.topicId && !recommendation.metadata.quizId && (
                      <button
                        onClick={() => router.push(`/subjects/${recommendation.metadata.subjectId}`)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-responsive-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        Explore Subject
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-3">
                <button
                  onClick={() => acceptRec.mutate(recommendation.id)}
                  className="px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-responsive-sm"
                  disabled={acceptRec.isPending}
                >
                  Accept
                </button>
                <button
                  onClick={() => dismissRec.mutate({ id: recommendation.id })}
                  className="px-3 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-lg text-responsive-sm"
                  disabled={dismissRec.isPending}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => completeRec.mutate(recommendation.id)}
                  className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-responsive-sm"
                  disabled={completeRec.isPending}
                >
                  Mark Complete
                </button>
              </div>

              {/* Main action button */}
              {recommendation.metadata && (recommendation.metadata.quizId || recommendation.metadata.topicId || recommendation.metadata.subjectId) && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      if (recommendation.metadata.quizId) {
                        handleStartPractice(recommendation.id, recommendation.metadata.quizId)
                      } else if (recommendation.metadata.topicId) {
                        router.push(`/subjects/${recommendation.metadata.subjectId}/topics/${recommendation.metadata.topicId}`)
                      } else if (recommendation.metadata.subjectId) {
                        router.push(`/subjects/${recommendation.metadata.subjectId}`)
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {recommendation.metadata.quizId ? 'Start Quiz' : 
                     recommendation.metadata.topicId ? 'Study Topic' : 'Explore Subject'}
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {filteredRecommendations.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-400">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recommendations yet. Complete a quiz to get personalized suggestions.</p>
            </div>
          )}
        </motion.div>
      </div>
    </GameLayout>
  )
}