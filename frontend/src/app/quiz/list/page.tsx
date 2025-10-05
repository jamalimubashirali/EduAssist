'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Award,
  X
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

  // Filter and sort quizzes with improved search and filtering
  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return []
    
    return quizzes
      .filter(quiz => {
        // Enhanced search - search in title, subject, and description
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = !searchTerm || 
          quiz.title.toLowerCase().includes(searchLower) ||
          (quiz.subject || quiz.subjectId || '').toLowerCase().includes(searchLower) ||
          (quiz.description || '').toLowerCase().includes(searchLower)
        
        // Subject filtering
        const matchesSubject = selectedSubject === 'all' || 
          quiz.subjectId === selectedSubject ||
          quiz.subject === selectedSubject
        
        // Difficulty filtering - handle different formats
        const quizDifficulty = quiz.difficulty?.toLowerCase()
        const selectedDiff = selectedDifficulty.toLowerCase()
        const matchesDifficulty = selectedDifficulty === 'all' || 
          quizDifficulty === selectedDiff ||
          (selectedDiff === 'easy' && quizDifficulty === 'beginner') ||
          (selectedDiff === 'medium' && quizDifficulty === 'intermediate') ||
          (selectedDiff === 'hard' && quizDifficulty === 'advanced')
        
        return matchesSearch && matchesSubject && matchesDifficulty
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            const aAttempts = (a as any).attemptCount || (a as any).attempts || 0
            const bAttempts = (b as any).attemptCount || (b as any).attempts || 0
            return bAttempts - aAttempts
          case 'recent':
            const aDate = (a as any).createdAt || (a as any).created_at || ''
            const bDate = (b as any).createdAt || (b as any).created_at || ''
            return bDate.localeCompare(aDate)
          case 'difficulty':
            const difficultyOrder = { 
              beginner: 1, easy: 1,
              intermediate: 2, medium: 2,
              advanced: 3, hard: 3
            }
            const aDiff = difficultyOrder[a.difficulty?.toLowerCase() as keyof typeof difficultyOrder] || 1
            const bDiff = difficultyOrder[b.difficulty?.toLowerCase() as keyof typeof difficultyOrder] || 1
            return aDiff - bDiff
          default:
            return 0
        }
      })
  }, [quizzes, searchTerm, selectedSubject, selectedDifficulty, sortBy])

  // Extract unique subjects and difficulties from quizzes
  const subjects = useMemo(() => {
    if (!quizzes) return ['all']
    const uniqueSubjects = Array.from(new Set(
      quizzes.map(q => q.subjectId || q.subject).filter(Boolean)
    ))
    return ['all', ...uniqueSubjects]
  }, [quizzes])
  
  const difficulties = ['all', 'Easy', 'Medium', 'Hard']

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/instructions/${quizId}`)
  }

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty?.toLowerCase()
    switch (diff) {
      case 'easy':
      case 'beginner':
        return 'text-green-400 bg-green-400/10 border border-green-400/20'
      case 'medium':
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
      case 'hard':
      case 'advanced':
        return 'text-red-400 bg-red-400/10 border border-red-400/20'
      default:
        return 'text-gray-400 bg-gray-400/10 border border-gray-400/20'
    }
  }
  
  const formatDifficulty = (difficulty: string) => {
    const diff = difficulty?.toLowerCase()
    switch (diff) {
      case 'beginner': return 'Easy'
      case 'intermediate': return 'Medium'
      case 'advanced': return 'Hard'
      default: return difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1) || 'Unknown'
    }
  }

  // Debug logging
  useEffect(() => {
    console.log('🎯 [QUIZ_LIST] Quiz data loaded:', {
      totalQuizzes: quizzes?.length || 0,
      filteredQuizzes: filteredQuizzes.length,
      searchTerm,
      selectedSubject,
      selectedDifficulty,
      sortBy,
      isLoading,
      isError
    })
    if (quizzes?.length > 0) {
      console.log('📋 [QUIZ_LIST] Sample quiz:', quizzes[0])
    }
  }, [quizzes, filteredQuizzes, searchTerm, selectedSubject, selectedDifficulty, sortBy, isLoading, isError])

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

        {/* Loading and Error States */}
        {isLoading && (
          <motion.div
            className="game-card p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="text-lg">Loading quizzes...</span>
            </div>
          </motion.div>
        )}
        
        {isError && (
          <motion.div
            className="game-card p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-red-400 mb-4">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Failed to load quizzes</h3>
              <p className="text-gray-400">Please try refreshing the page</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh Page
            </button>
          </motion.div>
        )}

        {/* Search and Filters */}

        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Enhanced Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, subject, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
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
                <option value="recent">Most Recent</option>
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
                  {formatDifficulty(quiz.difficulty)}
                </span>
              </div>

              {/* Quiz Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                  {quiz.title}
                </h3>
                <p className="text-gray-400 text-sm">{quiz.subject || quiz.subjectId}</p>
                {quiz.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{quiz.description}</p>
                )}

                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {quiz.questions?.length || quiz.questionCount || 0} questions
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.timeLimit ? `${Math.floor(quiz.timeLimit / 60)}m` : 'No limit'}
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4" />
                    {(quiz as any).averageScore ? `${(quiz as any).averageScore}%` : 'New'}
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <Zap className="w-4 h-4" />
                    {quiz.xpReward || 10} XP
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
        {!isLoading && !isError && filteredQuizzes.length === 0 && (
          <motion.div
            className="game-card p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No quizzes found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedSubject !== 'all' || selectedDifficulty !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No quizzes available at the moment'
              }
            </p>
            {(searchTerm || selectedSubject !== 'all' || selectedDifficulty !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedSubject('all')
                  setSelectedDifficulty('all')
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        {!isLoading && !isError && filteredQuizzes.length > 0 && (
          <motion.div
            className="text-center text-gray-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Showing {filteredQuizzes.length} of {quizzes?.length || 0} quizzes
            {searchTerm && ` for "${searchTerm}"`}
          </motion.div>
        )}
      </div>
    </GameLayout>
  )
}
