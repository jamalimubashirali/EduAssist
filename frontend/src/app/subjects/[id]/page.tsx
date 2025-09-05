'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSubjectWithTopics } from '@/hooks/useSubjectData'
import { useQuizzesBySubject, useGetOrCreateTopicQuiz } from '@/hooks/useQuizData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { 
  ArrowLeft, 
  BookOpen, 
  Brain,
  Star,
  Target,
  Zap,
  Play,
  Search
} from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import NavigationSuggestions, { generateNavigationSuggestions } from '@/components/ui/NavigationSuggestions'
import ProgressIndicator, { generateLearningProgressSteps } from '@/components/ui/ProgressIndicator'

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUserStore()
  const subjectId = params.id as string
  
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')
  
  const { subject, topics, isLoading, error } = useSubjectWithTopics(subjectId)
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzesBySubject(subjectId)
  const getOrCreateTopicQuiz = useGetOrCreateTopicQuiz()

  console.log(subject);
  console.log(topics);
  console.log(quizzes);
  console.log(getOrCreateTopicQuiz);

  // Handle smart practice quiz creation
  const handleTopicPractice = async (topicId: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate') => {
    if (!subject) return

    try {
      const quiz = await getOrCreateTopicQuiz.mutateAsync({
        topicId,
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
  const navigationSuggestions = subject ? generateNavigationSuggestions({
    currentPage: `/subjects/${subjectId}`,
    user : { id : user?.id ?? '', name : user?.name ?? '' },
    subject,
    userProgress: user ? {
      averageScore: user.averageScore || 0,
      streakCount: user.streakCount || 0,
      totalQuizzes: user.totalQuizzesAttempted || 0
    } : undefined
  }) : []

  const progressSteps = generateLearningProgressSteps({
    subject,
    currentPage: `/subjects/${subjectId}`,
    userProgress: user ? {
      averageScore: user.averageScore || 0
    } : undefined
  })

  const breadcrumbItems = [
    { label: 'Subjects', href: '/subjects' },
    { label: subject?.name || 'Subject', current: true }
  ]

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = !searchQuery || topic.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = selectedDifficulty === 'all' || topic.difficulty === selectedDifficulty
    return matchesSearch && matchesDifficulty
  })

  const difficultyColors = {
    beginner: 'text-green-400 bg-green-400/20',
    intermediate: 'text-yellow-400 bg-yellow-400/20',
    advanced: 'text-red-400 bg-red-400/20'
  }

  if (isLoading) {
    return (
      <GameLayout>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-700 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="game-card p-6">
                  <div className="h-6 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GameLayout>
    )
  }

  if (error || !subject) {
    return (
      <GameLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Subject Not Found</h1>
          <p className="text-gray-400 mb-6">
            The subject you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/subjects')}
            className="game-button px-6 py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Subjects
          </button>
        </div>
      </GameLayout>
    )
  }

  if (!user) {
    return null; // or a loading spinner
  }

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
            onClick={() => router.push('/subjects')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: subject.color + '20', color: subject.color }}
              >
                {subject.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
                <p className="text-gray-400">{subject.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="game-card p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{topics.length}</div>
            <div className="text-gray-400">Topics Available</div>
          </div>
          <div className="game-card p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{quizzes?.length || 0}</div>
            <div className="text-gray-400">Practice Quizzes</div>
          </div>
          <div className="game-card p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {topics.filter(t => t.difficulty === 'advanced').length}
            </div>
            <div className="text-gray-400">Advanced Topics</div>
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

        {/* Topics Grid */}
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
              <div className="game-card p-6 hover:border-purple-500 transition-all duration-200 group">
                {/* Topic Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {topic.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {topic.description}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${difficultyColors[topic.difficulty]}`}>
                    {topic.difficulty}
                  </div>
                </div>

                {/* Prerequisites */}
                {topic.prerequisites && topic.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Prerequisites:</div>
                    <div className="flex flex-wrap gap-1">
                      {topic.prerequisites.map((prereq, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topic Statistics */}
                <div className="mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Brain className="w-4 h-4" />
                      <span>{topic.quizCount || 0} quizzes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{topic.questionCount || 0} questions</span>
                    </div>
                    {topic.averageScore && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{Math.round(topic.averageScore)}% avg</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/topics/${topic.id}`} className="flex-1">
                    <button className="w-full game-button-secondary py-2 text-sm flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      View Topic
                    </button>
                  </Link>
                  <button
                    onClick={() => handleTopicPractice(topic.id)}
                    disabled={getOrCreateTopicQuiz.isPending}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {getOrCreateTopicQuiz.isPending ? 'Creating...' : 'Practice'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredTopics.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No topics found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery 
                ? `No topics match "${searchQuery}" with the selected filters.`
                : 'No topics are available for this subject yet.'
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

        {/* Quick Actions */}
        {!quizzesLoading && quizzes && quizzes.length > 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Practice</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href={`/quiz/generate?subject=${subjectId}&difficulty=beginner`}>
                <div className="game-card p-6 hover:border-green-500 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                        Beginner Quiz
                      </h3>
                      <p className="text-gray-400 text-sm">Start with the basics</p>
                    </div>
                    <Play className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                  </div>
                </div>
              </Link>

              <Link href={`/quiz/generate?subject=${subjectId}&difficulty=advanced`}>
                <div className="game-card p-6 hover:border-red-500 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                        Challenge Quiz
                      </h3>
                      <p className="text-gray-400 text-sm">Test your mastery</p>
                    </div>
                    <Play className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Contextual Navigation Suggestions */}
        {navigationSuggestions.length > 0 && (
          <NavigationSuggestions 
            suggestions={navigationSuggestions}
            title="Recommended Actions"
            className="mt-12"
          />
        )}
      </div>
    </GameLayout>
  )
}
