'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import GameLayout from '@/app/components/layout/GameLayout'
import { usePopularQuizzes, useQuizzes } from '@/hooks/useQuizData'
import { useUserStore } from '@/stores/useUserStore';
import { useUserPreferences } from '@/hooks/useUserData';
import {
  Brain,
  Calculator,
  Atom,
  BookOpen,
  Globe,
  Zap,
  Clock,
  Trophy,
  List,
  Grid3X3,
  Search,
  Filter,
  Play,
  Target,
  Users,
  TrendingUp,
  Award,
  Star
} from 'lucide-react'
import { QuickQuizButton, ChallengeQuizButton, SubjectQuizButton } from '../components/quiz/StartQuizButton'

export default function QuizArena() {
  const { user } = useUserStore()
  const router = useRouter()
  const { data: popularQuizzes, isLoading } = usePopularQuizzes(6)
  const { data: allQuizzes, isLoading: isAllQuizzesLoading } = useQuizzes({ limit: 50 })
  const [activeTab, setActiveTab] = useState<'subjects' | 'quizzes'>('subjects');
  const { data: preferences } = useUserPreferences();

  // useEffect(() => {
  //   if (!user) {
  //     router.push('/login')
  //   }
  // }, [user, router])

  // Quiz list state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  // const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'difficulty'>('popular')

  // Use real quizzes from API instead of mock data
  const quizzes = activeTab === 'quizzes' ? (allQuizzes || []) : (popularQuizzes || [])

  console.log("Available Quizzes :", quizzes);

  // Filter quizzes based on search and filters
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || quiz.subject.toLowerCase() === selectedSubject.toLowerCase()
    const matchesDifficulty = selectedDifficulty === 'all' || quiz.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()

    return matchesSearch && matchesSubject && matchesDifficulty
  })


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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Quiz Arena ⚔️
              </h1>
              <p className="text-gray-400">
                Challenge yourself and earn XP by testing your knowledge!
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/quiz/generate">
                <motion.button
                  className="game-button px-6 py-3 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-5 h-5" />
                  Generate Quiz
                </motion.button>
              </Link>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  {activeTab === 'subjects' ? (preferences && preferences.length) : filteredQuizzes.length}
                </div>
                <div className="text-gray-400 text-sm">
                  {activeTab === 'subjects' ? 'Subjects Available' : 'Quizzes Available'}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'subjects'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="font-medium">By Subject</span>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'quizzes'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="font-medium">All Quizzes</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'subjects' ? (
          <>
            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">Quick Quiz</div>
            <div className="text-gray-400 text-sm mb-4">5 questions • 2 min</div>
            <QuickQuizButton size="sm" showStats={false}>
              Start Now
            </QuickQuizButton>
          </div>
          
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">Timed Challenge</div>
            <div className="text-gray-400 text-sm mb-4">10 questions • 5 min</div>
            <ChallengeQuizButton size="sm" showStats={false} questionCount={7}>
              Start Challenge
            </ChallengeQuizButton>
          </div>
          
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">Daily Challenge</div>
            <div className="text-gray-400 text-sm mb-4">Special quiz • Bonus XP</div>
            <Link href="/quiz/daily" className="game-button text-sm px-4 py-2 inline-block">
              Take Challenge
            </Link>
          </div>
        </motion.div>

        {/* Subject Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Choose Your Subject to practice</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preferences && preferences.map((subject, index) => {
              
              const Icon = subject.subjectName.toLowerCase() === 'mathematics' ? Calculator :
                           subject.subjectName.toLowerCase() === 'science' ? Atom :
                           subject.subjectName.toLowerCase() === 'language' ? BookOpen :
                           subject.subjectName.toLowerCase() === 'history' ? Globe :
                           Brain; // Default icon
              
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Link href={`/subjects/${subject.id}`}>
                    <div className="game-card p-6 hover:scale-105 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-r rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {subject.subjectName}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            {subject.subjectDescription}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            {/* <div className="flex items-center gap-1 text-blue-400">
                              <Brain className="w-4 h-4" />
                              <span>{subject.quizCount} quizzes</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Zap className="w-4 h-4" />
                              <span>~{subject.avgXP} XP avg</span>
                            </div> */}
                          </div>
                        </div>
                        
                        <div className="text-gray-400 group-hover:text-white transition-colors">
                          →
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
          </div>
          
          <div className="game-card p-6">
            <div className="text-center text-gray-400 py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent quiz activity</p>
              <p className="text-sm mt-2">Start a quiz to see your progress here!</p>
            </div>
          </div>
        </motion.div>
          </>
        ) : (
          <>
            {/* Quiz List Content */}
            {/* Search and Filters */}
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Subjects</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                  </select>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Quiz Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {filteredQuizzes.length > 0 ? filteredQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  className="game-card p-6 hover:border-purple-500 transition-all duration-200 cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => window.location.href = `/quiz/instructions/${quiz.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">📚</div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{(quiz as any).averageScore?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {quiz.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {quiz.subject} - Test your knowledge with this comprehensive quiz
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        <span>{quiz.questions?.length || 0} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.ceil((quiz.timeLimit || 0) / 60)} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        quiz.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        quiz.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {quiz.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">+{quiz.xpReward || 100} XP</span>
                      </div>
                    </div>

                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      <span className="text-sm font-medium">Start</span>
                    </button>
                  </div>
                </motion.div>
              )) : isLoading || isAllQuizzesLoading ? (
                // Loading skeleton
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="game-card p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gray-700 rounded"></div>
                      <div className="w-12 h-4 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-800 rounded mb-4"></div>
                    <div className="flex justify-between mb-4">
                      <div className="w-20 h-4 bg-gray-700 rounded"></div>
                      <div className="w-16 h-4 bg-gray-700 rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-16 h-6 bg-gray-700 rounded"></div>
                      <div className="w-20 h-8 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))
              ) : null}
            </motion.div>

            {/* Empty State */}
            {!isLoading && !isAllQuizzesLoading && filteredQuizzes.length === 0 && (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No quizzes found</h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search terms or filters to find more quizzes.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedSubject('all')
                    setSelectedDifficulty('all')
                  }}
                  className="game-button px-6 py-3"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </GameLayout>
  )
}
