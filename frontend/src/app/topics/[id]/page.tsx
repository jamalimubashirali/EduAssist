'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTopicById } from '@/hooks/useTopicData'
import { useSubject } from '@/hooks/useSubjectData'
import { useQuizzesByTopic, useGetOrCreateTopicQuiz } from '@/hooks/useQuizData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { 
  ArrowLeft, 
  BookOpen, 
  Brain, 
  Clock,
  Target,
  Zap,
  Play,
  Trophy
} from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import NavigationSuggestions, { generateNavigationSuggestions } from '@/components/ui/NavigationSuggestions'
import ProgressIndicator, { generateLearningProgressSteps } from '@/components/ui/ProgressIndicator'

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUserStore()
  const topicId = params.id as string
  
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const { data: topic, isLoading: topicLoading, error: topicError } = useTopicById(topicId)
  const { data: subject, isLoading: subjectLoading } = useSubject(topic?.subjectId || '')
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzesByTopic(topicId)
  const getOrCreateTopicQuiz = useGetOrCreateTopicQuiz()

  // Handle smart practice quiz creation
  const handlePracticeQuiz = async (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    if (!topic || !subject) return

    try {
      const quiz = await getOrCreateTopicQuiz.mutateAsync({
        topicId: topicId,
        subjectId: subject.id,
        difficulty,
        questionCount: 10
      })

      // Navigate to the quiz
      router.push(`/quiz/${quiz.id}`)
    } catch (error) {
      console.error('Failed to create practice quiz:', error)
    }
  }

  // Generate contextual navigation data
  const navigationSuggestions = topic && subject ? generateNavigationSuggestions({
    currentPage: `/topics/${topicId}`,
    user,
    subject,
    topic,
    userProgress: user ? {
      averageScore: user.averageScore || 0,
      streakCount: user.streakCount || 0,
      totalQuizzes: user.totalQuizzesAttempted || 0
    } : undefined
  }) : []

  const progressSteps = generateLearningProgressSteps({
    subject,
    topic,
    currentPage: `/topics/${topicId}`,
    userProgress: user ? {
      averageScore: user.averageScore || 0
    } : undefined
  })

  const breadcrumbItems = topic && subject ? [
    { label: 'Subjects', href: '/subjects' },
    { label: subject.name, href: `/subjects/${subject.id}` },
    { label: topic.name, current: true }
  ] : [
    { label: 'Topics', href: '/topics' },
    { label: topic?.name || 'Topic', current: true }
  ]

  const difficultyColors = {
    beginner: 'text-green-400 bg-green-400/20 border-green-400/30',
    intermediate: 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30',
    advanced: 'text-red-400 bg-red-400/20 border-red-400/30'
  }

  const difficultyIcons = {
    beginner: Target,
    intermediate: Brain,
    advanced: Zap
  }

  if (topicLoading || subjectLoading) {
    return (
      <GameLayout>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-700 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="game-card p-6">
                  <div className="h-8 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GameLayout>
    )
  }

  if (topicError || !topic) {
    return (
      <GameLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Topic Not Found</h1>
          <p className="text-gray-400 mb-6">
            The topic you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/topics')}
            className="game-button px-6 py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Topics
          </button>
        </div>
      </GameLayout>
    )
  }

  if (!user) {
    return null
  }

  const DifficultyIcon = difficultyIcons[topic.difficulty]

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Learning Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator steps={progressSteps} className="max-w-2xl" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => subject ? router.push(`/subjects/${subject.id}`) : router.push('/topics')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 rounded-xl border ${difficultyColors[topic.difficulty]}`}>
                <DifficultyIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{topic.name}</h1>
                <p className="text-gray-400">{topic.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${difficultyColors[topic.difficulty]}`}>
                {topic.difficulty} Level
              </div>
              {subject && (
                <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                  {subject.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="game-card p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{quizzes?.length || 0}</div>
            <div className="text-gray-400">Practice Quizzes</div>
          </div>
          <div className="game-card p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{topic.questionCount || 0}</div>
            <div className="text-gray-400">Questions Available</div>
          </div>
          <div className="game-card p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {topic.averageScore ? `${Math.round(topic.averageScore)}%` : 'N/A'}
            </div>
            <div className="text-gray-400">Average Score</div>
          </div>
        </div>

        {/* Prerequisites */}
        {topic.prerequisites && topic.prerequisites.length > 0 && (
          <motion.div
            className="game-card p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Prerequisites
            </h2>
            <div className="flex flex-wrap gap-2">
              {topic.prerequisites.map((prereq, i) => (
                <span key={i} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                  {prereq}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Practice Options */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => handlePracticeQuiz('beginner')}
              disabled={getOrCreateTopicQuiz.isPending}
              className="w-full game-card p-6 hover:border-green-500 transition-all duration-200 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                    Easy Practice
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {getOrCreateTopicQuiz.isPending ? 'Preparing quiz...' : 'Build your foundation'}
                  </p>
                </div>
                <Play className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => handlePracticeQuiz('intermediate')}
              disabled={getOrCreateTopicQuiz.isPending}
              className="w-full game-card p-6 hover:border-yellow-500 transition-all duration-200 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
                    Standard Quiz
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {getOrCreateTopicQuiz.isPending ? 'Preparing quiz...' : 'Test your knowledge'}
                  </p>
                </div>
                <Play className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => handlePracticeQuiz('advanced')}
              disabled={getOrCreateTopicQuiz.isPending}
              className="w-full game-card p-6 hover:border-red-500 transition-all duration-200 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                    Challenge Mode
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {getOrCreateTopicQuiz.isPending ? 'Preparing quiz...' : 'Master the topic'}
                  </p>
                </div>
                <Play className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Available Quizzes */}
        {!quizzesLoading && quizzes && quizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Available Quizzes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Link href={`/quiz/${quiz.id}`}>
                    <div className="game-card p-6 hover:border-purple-500 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                            {quiz.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{quiz.timeLimit} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Brain className="w-4 h-4" />
                              <span>{quiz.questions?.length || 0} questions</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          quiz.difficulty === 'Easy' ? 'text-green-400 bg-green-400/20' :
                          quiz.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-400/20' :
                          'text-red-400 bg-red-400/20'
                        }`}>
                          {quiz.difficulty}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-purple-400">
                          <Trophy className="w-4 h-4" />
                          <span>{quiz.xpReward} XP</span>
                        </div>
                        <Play className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State for Quizzes */}
        {!quizzesLoading && (!quizzes || quizzes.length === 0) && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No quizzes available yet</h3>
            <p className="text-gray-400 mb-6">
              Create a custom quiz to practice this topic.
            </p>
            <button
              onClick={() => handlePracticeQuiz('intermediate')}
              disabled={getOrCreateTopicQuiz.isPending}
              className="game-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Brain className="w-5 h-5 mr-2" />
              {getOrCreateTopicQuiz.isPending ? 'Creating Quiz...' : 'Create Smart Quiz'}
            </button>
          </motion.div>
        )}

        {/* Contextual Navigation Suggestions */}
        {navigationSuggestions.length > 0 && (
          <NavigationSuggestions 
            suggestions={navigationSuggestions}
            title="Recommended Next Steps"
            className="mt-12"
          />
        )}
      </div>
    </GameLayout>
  )
}