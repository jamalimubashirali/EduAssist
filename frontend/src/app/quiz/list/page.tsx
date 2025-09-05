'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuizzes } from '@/hooks/useQuizData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import {
  Brain,
  Clock,
  Star,
  Trophy,
  Search,
  Filter,
  Play,
  BookOpen,
  Target,
  Zap,
  Users,
  TrendingUp,
  Award
} from 'lucide-react'

export default function QuizListPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'difficulty'>('popular')

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Real quizzes from API
  const { data: quizzes, isLoading, isError } = useQuizzes({
    subject: selectedSubject !== 'all' ? selectedSubject : undefined,
    difficulty: selectedDifficulty !== 'all' ? (selectedDifficulty as any) : undefined,
    limit: 30,
  })

  // Filter and sort quizzes (client-side; server also filters by subject/difficulty)
  const filteredQuizzes = (quizzes || [])
    .filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.subjectId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubject === 'all' || quiz.subjectId === selectedSubject
      const matchesDifficulty = selectedDifficulty === 'all' || quiz.difficulty === selectedDifficulty
      return matchesSearch && matchesSubject && matchesDifficulty
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b as any).attemptCount - (a as any).attemptCount
        case 'recent':
          return (b as any).createdAt?.localeCompare((a as any).createdAt || '')
        case 'difficulty':
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
          return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] -
                 difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
        default:
          return 0
      }
    })

  const subjects = ['all', ...Array.from(new Set((quizzes || []).map(q => q.subjectId)))]
  const difficulties = ['all', 'Easy', 'Medium', 'Hard']

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/instructions/${quizId}`)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/10'
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'Hard': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  console.log(filteredQuizzes);

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
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Arena 🧠</h1>
          <p className="text-gray-400">Challenge yourself with our extensive quiz collection</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{quizzes?.length ?? 0}</div>
            <div className="text-sm text-gray-400">Total Quizzes</div>
          </div>
          <div className="game-card p-4 text-center">
            <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(quizzes || []).reduce((sum, q: any) => sum + (q.attemptCount || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Completions</div>
          </div>
          <div className="game-card p-4 text-center">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(() => {
                const arr = (quizzes || []) as any[]
                if (!arr.length) return '0.0'
                const avg = arr.reduce((sum, q) => sum + (q.averageScore || 0), 0) / arr.length
                return avg.toFixed(1)
              })()}
            </div>
            <div className="text-sm text-gray-400">Avg Score</div>
          </div>
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(quizzes || []).reduce((sum, q) => sum + (q.xpReward || 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        {isLoading && (
          <div className="game-card p-6 text-center text-gray-400">Loading quizzes...</div>
        )}
        {isError && (
          <div className="game-card p-6 text-center text-red-400">Failed to load quizzes.</div>
        )}

        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Highest Rated</option>
                <option value="difficulty">By Difficulty</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Quiz Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {filteredQuizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              className="game-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              onClick={() => handleStartQuiz(quiz.id)}
            >
              {/* Quiz Badge */}
              <div className="text-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </span>
              </div>

              {/* Quiz Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-gray-400 text-sm">{quiz.subjectId}</p>

                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {quiz.questions?.length || 0} questions
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.timeLimit || 0} sec
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4" />
                    {(quiz as any).averageScore ?? '-'}
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <Zap className="w-4 h-4" />
                    {quiz.xpReward} XP
                  </div>
                </div>

                {/* Start Button */}
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105">
                  <Play className="w-4 h-4" />
                  Start Quiz
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredQuizzes.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No quizzes found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </GameLayout>
  )
}
