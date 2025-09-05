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
  const { data: allRecommendations, isLoading } = useUserRecommendations(undefined, 20)

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
          <h1 className="text-3xl font-bold text-white mb-2">AI Recommendations 🎯</h1>
          <p className="text-gray-400">Personalized learning suggestions based on your progress</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{allRecommendations?.length ?? 0}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="game-card p-4 text-center">
            <Target className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(allRecommendations || []).filter((r: any) => r.type === 'topic' || r.type === 'quiz').length}
            </div>
            <div className="text-sm text-gray-400">Weak/Focus Areas</div>
          </div>
          <div className="game-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(() => {
                const arr = (allRecommendations || []) as any[]
                if (!arr.length) return '0%'
                const avg = Math.round(arr.reduce((sum, r) => sum + (r.confidence || 0), 0) / arr.length)
                return `${avg}%`
              })()}
            </div>
            <div className="text-sm text-gray-400">Avg Confidence</div>
          </div>
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(allRecommendations || []).reduce((sum, r: any) => sum + (r.metadata?.estimatedTime ? 5 : 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Potential Sessions</div>
          </div>
        </motion.div>          {/* Recommendations Grid */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {isLoading && (
            <div className="game-card p-6 text-center text-gray-400">Loading recommendations...</div>
          )}

          {filteredRecommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              className="game-card p-6"
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
                    <h3 className="text-xl font-bold text-white mb-1">{recommendation.title}</h3>
                    <p className="text-gray-300 mb-2">{recommendation.description}</p>                      <div className="flex items-center gap-4 text-sm text-gray-400">
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources */}
              {recommendation.metadata && (recommendation.metadata.quizId || recommendation.metadata.topicId) && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Available Resources:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStartPractice(recommendation.id, recommendation.metadata?.quizId || recommendation.metadata?.topicId || '')}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Start Practice
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => acceptRec.mutate(recommendation.id)}
                  className="px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm"
                  disabled={acceptRec.isPending}
                >
                  Accept
                </button>
            {filteredRecommendations.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400">No recommendations yet. Complete a quiz to get personalized suggestions.</div>
            )}

                <button
                  onClick={() => dismissRec.mutate({ id: recommendation.id })}
                  className="px-3 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-lg text-sm"
                  disabled={dismissRec.isPending}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => completeRec.mutate(recommendation.id)}
                  className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-sm"
                  disabled={completeRec.isPending}
                >
                  Mark Complete
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStartPractice(recommendation.id, recommendation.metadata?.quizId || recommendation.metadata?.topicId || '')}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  <CheckCircle className="w-4 h-4" />
                  Start Practice
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </GameLayout>
  )
}