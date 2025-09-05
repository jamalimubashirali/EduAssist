'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGenerateQuiz } from '@/hooks/useQuizData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import { 
  Brain, 
  Zap, 
  Clock, 
  Target, 
  ArrowLeft,
  Sparkles,
  BookOpen
} from 'lucide-react'

export default function GenerateQuizPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const generateQuiz = useGenerateQuiz()

  useEffect(() => {
    if (user === null) {
      router.push('/login')
    }
  }, [user, router])

  const [formData, setFormData] = useState({
    subject: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    questionCount: 5,
    topics: [] as string[]
  })

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '🔢', color: 'from-blue-500 to-cyan-500' },
    { id: 'science', name: 'Science', icon: '🧪', color: 'from-green-500 to-emerald-500' },
    { id: 'english', name: 'English', icon: '📚', color: 'from-purple-500 to-pink-500' },
    { id: 'history', name: 'History', icon: '🏛️', color: 'from-yellow-500 to-orange-500' },
    { id: 'geography', name: 'Geography', icon: '🌍', color: 'from-teal-500 to-blue-500' },
    { id: 'physics', name: 'Physics', icon: '⚛️', color: 'from-indigo-500 to-purple-500' }
  ]

  const handleSubjectSelect = (subjectId: string) => {
    setFormData(prev => ({ ...prev, subject: subjectId }))
  }

  const handleDifficultySelect = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setFormData(prev => ({ ...prev, difficulty }))
  }

  const handleQuestionCountChange = (count: number) => {
    setFormData(prev => ({ ...prev, questionCount: count }))
  }

  const handleGenerateQuiz = async () => {
    if (!formData.subject) return

    try {
      const quiz = await generateQuiz.mutateAsync({
        subject: formData.subject,
        difficulty: formData.difficulty,
        questionCount: formData.questionCount,
        topics: formData.topics
      })
      
      // Redirect to instructions; generated quizzes are not retrievable by ID
      router.push(`/quiz/instructions/${quiz.id || quiz._id}`)
    } catch (error) {
      console.error('Failed to generate quiz:', error)
    }
  }

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/quiz')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Generate Custom Quiz</h1>
            <p className="text-gray-400">Create a personalized quiz tailored to your learning needs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subject Selection */}
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Choose Subject
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.subject === subject.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${subject.color} flex items-center justify-center text-2xl mb-3 mx-auto`}>
                      {subject.icon}
                    </div>
                    <div className="text-white font-medium text-sm">{subject.name}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Difficulty Selection */}
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Difficulty Level
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'beginner', name: 'Beginner', color: 'from-green-500 to-emerald-500', xp: '10-15 XP' },
                  { id: 'intermediate', name: 'Intermediate', color: 'from-yellow-500 to-orange-500', xp: '20-30 XP' },
                  { id: 'advanced', name: 'Advanced', color: 'from-red-500 to-pink-500', xp: '35-50 XP' }
                ].map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => handleDifficultySelect(difficulty.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.difficulty === difficulty.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${difficulty.color} mx-auto mb-2`}></div>
                    <div className="text-white font-medium text-sm mb-1">{difficulty.name}</div>
                    <div className="text-gray-400 text-xs">{difficulty.xp}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Question Count */}
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Number of Questions
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuestionCountChange(Math.max(3, formData.questionCount - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-white">{formData.questionCount}</div>
                  <div className="text-gray-400 text-sm">Questions</div>
                </div>
                <button
                  onClick={() => handleQuestionCountChange(Math.min(20, formData.questionCount + 1))}
                  className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors"
                >
                  +
                </button>
              </div>
              <div className="mt-4 flex justify-center gap-2">
                {[3, 5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleQuestionCountChange(count)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.questionCount === count
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Summary & Generate Button */}
          <div className="space-y-6">
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <span className="font-medium text-white">{formData.subject ? subjects.find(s => s.id === formData.subject)?.name : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <span className="font-medium text-white capitalize">{formData.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-medium text-white">{formData.questionCount}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button
                onClick={handleGenerateQuiz}
                disabled={!formData.subject || generateQuiz.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generateQuiz.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Quiz
                  </>
                )}
              </button>
            </motion.div>
            
            <motion.div
              className="text-center text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p>AI-powered quiz generation ensures a unique experience every time.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
