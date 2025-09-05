'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuiz } from '@/hooks/useQuizData'
import { useStartAttempt, useRecordAnswer, useCompleteAttempt } from '@/hooks/useAttemptData'
import { usePerformanceTracker } from '@/hooks/usePerformanceData'
import { useUserStore } from '@/stores/useUserStore'
import GameLayout from '@/app/components/layout/GameLayout'
import QuizTimer, { TimerWarning } from '@/components/quiz/QuizTimer'
import QuizProgress from '@/components/quiz/QuizProgress'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import { Brain, Clock, Zap, CheckCircle, X, Trophy, ArrowLeft, Pause, Play, Flag, Target } from 'lucide-react'
import { toast } from 'sonner'

export default function QuizTakingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUserStore()
  const quizId = params.id as string

  const { data: quiz, isLoading, error } = useQuiz(quizId)
  const { trackQuizPerformance } = usePerformanceTracker()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Consolidated debug logging and user check
  useEffect(() => {
    // User authentication check
    if (!user) {
      router.push('/login')
      return
    }

    // Debug logging for quiz data
    console.log('🎯 [QUIZ PAGE] Quiz ID:', quizId)
    console.log('🔄 [QUIZ PAGE] Loading state:', isLoading)
    console.log('❌ [QUIZ PAGE] Error state:', error)
    console.log('📊 [QUIZ PAGE] Quiz data:', quiz)

    if (quiz) {
      console.log('📝 [QUIZ PAGE] Quiz details:')
      console.log('  - Title:', quiz.title)
      console.log('  - Questions count:', quiz.questions?.length || 0)
      console.log('  - Time limit:', quiz.timeLimit)
      console.log('  - Difficulty:', quiz.difficulty)
      console.log('  - XP Reward:', quiz.xpReward)
      console.log('📋 [QUIZ PAGE] Questions array:', quiz.questions)

      if (quiz.questions && quiz.questions.length > 0) {
        console.log('🔍 [QUIZ PAGE] First question sample:', quiz.questions[0])
        quiz.questions.forEach((q, index) => {
          console.log(`📝 [QUIZ PAGE] Question ${index + 1}:`, {
            id: q.id,
            text: q.questionText?.substring(0, 50) + '...',
            optionsCount: q.answerOptions?.length || 0,
            correctAnswer: q.correctAnswer,
            difficulty: q.questionDifficulty
          })
        })
      } else {
        console.warn('⚠️ [QUIZ PAGE] No questions found in quiz data!')
      }
    }
  }, [user, router, isLoading, error]);

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([])
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const [startTime, setStartTime] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [warningTimeLeft, setWarningTimeLeft] = useState(0)

  const startAttempt = useStartAttempt()
  const recordAnswer = useRecordAnswer()
  const completeAttempt = useCompleteAttempt()
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)

  // User authentication is now handled in the consolidated useEffect above

  const startedRef = useRef(false)
  const initKeyRef = useRef<string | null>(null)
  const timeUpGuardRef = useRef<number | null>(null)
  const completeOnceRef = useRef(false)

  const getAttemptIdFromResult = (res: any): string | null => {
    return (
      res?.id ||
      res?._id ||
      res?.attemptId ||
      res?.attempt?.id ||
      res?.attempt?._id ||
      res?.data?.id ||
      res?.data?._id ||
      null
    )
  }

  // Initialize quiz when started (run once per quiz.id)
  useEffect(() => {
    if (!quiz || !quizStarted) return

    // Prevent re-initializing if already initialized for this quiz
    if (initKeyRef.current === quiz.id) return
    initKeyRef.current = quiz.id

    const now = Date.now()
    setTimeLeft(quiz.timeLimit || 300)
    setStartTime(now)
    setQuestionStartTime(now)

    // Initialize tracking arrays once
    setAnswers(new Array(quiz.questions.length).fill(null))
    setCorrectAnswers(new Array(quiz.questions.length).fill(false))
    setTimePerQuestion(new Array(quiz.questions.length).fill(0))

    // Start attempt once
    if (!attemptId && !startedRef.current) {
      startedRef.current = true
      const payloadBase: any = { quizId: quiz.id }
      if (quiz.topicId) payloadBase.topicId = quiz.topicId
      if (quiz.subjectId) payloadBase.subjectId = quiz.subjectId
      console.log('🚀 [ATTEMPT] Starting attempt with payload:', payloadBase)
      startAttempt.mutate(payloadBase, {
        onSuccess: (res) => {
          try {
            console.log('✅ [ATTEMPT] start-quiz success raw response:', res)
            const derivedId = getAttemptIdFromResult(res) || res?._id || res?.id
            console.log('🆔 [ATTEMPT] derived attemptId from response:', derivedId)
            if (derivedId) {
              setAttemptId(derivedId as string)
            } else {
              console.error('❌ [ATTEMPT] No attemptId resolved from start-quiz response; blocking submission.')
            }
          } catch (e) {
            console.error('⚠️ [ATTEMPT] Failed to derive attemptId from response', e)
          }
        } ,
        onError: (err: any) => {
          console.error('❌ [ATTEMPT] Failed to start attempt:', err)
          // allow retry on next start
          startedRef.current = false
        }
      })
    }
  }, [quiz?.id, quizStarted])

  // Per-question time mapping
  const getSecondsForDifficulty = (difficulty?: string) => {
    const d = (difficulty || '').toLowerCase()
    if (d === 'easy') return 60
    if (d === 'medium') return 90
    if (d === 'hard') return 120
    // default if unknown
    return 90
  }

  // Timer callbacks per question
  const handleTimeUpQuestion = useCallback(() => {
    if (!quiz) return
    // avoid double-processing if explanation is already showing
    if (showExplanation) return

    const q = quiz.questions[currentQuestion]
    const questionTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0

    // Update tracking arrays (no selection, incorrect)
    const newAnswers = [...answers]
    const newCorrectAnswers = [...correctAnswers]
    const newTimePerQuestion = [...timePerQuestion]

    newAnswers[currentQuestion] = null
    newCorrectAnswers[currentQuestion] = false
    newTimePerQuestion[currentQuestion] = questionTime

    setAnswers(newAnswers)
    setCorrectAnswers(newCorrectAnswers)
    setTimePerQuestion(newTimePerQuestion)

    // Record as incorrect with selectedAnswer = -1 (backend receives string "-1")
    if (attemptId && q) {
      recordAnswer.mutate({
        attemptId,
        questionId: (q as any).id || (q as any)._id,
        selectedAnswer: -1,
        isCorrect: false,
        timeSpent: questionTime,
      })
    }

    setShowExplanation(true)

    setTimeout(() => {
      setShowExplanation(false)
      setSelectedAnswer(null)
      setQuestionStartTime(Date.now())

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        handleQuizComplete()
      }
    }, 1500)
  }, [quiz, currentQuestion, questionStartTime, answers, correctAnswers, timePerQuestion, attemptId, recordAnswer, showExplanation])

  const handleTimeWarning = useCallback((timeLeft: number) => {
    setWarningTimeLeft(timeLeft)
    setShowTimeWarning(true)

    if (timeLeft === 60) {
      toast.warning('1 minute remaining!')
    } else if (timeLeft === 30) {
      toast.warning('30 seconds remaining!')
    } else if (timeLeft === 10) {
      toast.error('10 seconds remaining!')
    }
  }, [])

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
    toast.info(isPaused ? 'Quiz resumed' : 'Quiz paused')
  }, [isPaused])

  const startQuiz = () => {
    console.log('🚀 [QUIZ_PAGE] Starting quiz...')
    console.log('📊 [QUIZ_PAGE] Quiz data at start:', quiz)
    console.log('📝 [QUIZ_PAGE] Questions available:', quiz?.questions?.length || 0)

    setQuizStarted(true)
    setStartTime(Date.now())

    console.log('✅ [QUIZ_PAGE] Quiz started successfully')
  }

  const handleAnswerSelect = (answerIndex: number) => {
    console.log('🎯 [QUIZ_PAGE] Answer selected:', answerIndex)
    console.log('📝 [QUIZ_PAGE] Question:', currentQuestion + 1)
    console.log('🔍 [QUIZ_PAGE] Answer text:', quiz?.questions[currentQuestion]?.answerOptions[answerIndex])

    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = useCallback(() => {
    if (selectedAnswer === null || !quiz) return

    const isCorrect = selectedAnswer === quiz.questions[currentQuestion]?.correctAnswer
    const questionTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0

    // Update answers and tracking arrays
    const newAnswers = [...answers]
    const newCorrectAnswers = [...correctAnswers]
    const newTimePerQuestion = [...timePerQuestion]

    newAnswers[currentQuestion] = selectedAnswer
    newCorrectAnswers[currentQuestion] = isCorrect
    newTimePerQuestion[currentQuestion] = questionTime

    setAnswers(newAnswers)
    setCorrectAnswers(newCorrectAnswers)
    setTimePerQuestion(newTimePerQuestion)

    // Update streak
    // No streak logic (removed per requirement)
    if (isCorrect) {
      toast.success('Correct!')
    } else {
      toast.error('Incorrect answer')
    }

    // Record answer in backend
    if (attemptId && quiz.questions[currentQuestion]) {
      const q = quiz.questions[currentQuestion]
      console.log('📝 [ATTEMPT] Recording answer:', { attemptId, questionId: (q as any).id || (q as any)._id, selectedAnswer, isCorrect, timeSpent: questionTime })
      recordAnswer.mutate({
        attemptId,
        questionId: (q as any).id || (q as any)._id,
        selectedAnswer,
        isCorrect,
        timeSpent: questionTime,
      })
    }

    setShowExplanation(true)

    // Auto-advance after showing explanation
    setTimeout(() => {
      setShowExplanation(false)
      setSelectedAnswer(null)
      setQuestionStartTime(Date.now())

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        handleQuizComplete()
      }
    }, 3000) // Increased time to read explanation
  }, [selectedAnswer, quiz, currentQuestion, questionStartTime, answers, correctAnswers, timePerQuestion, attemptId, recordAnswer])

  const mapDifficultyToPerformanceTracker = (difficulty: 'Easy' | 'Medium' | 'Hard'): 'Beginner' | 'Intermediate' | 'Advanced' => {
    switch (difficulty) {
      case 'Easy':
        return 'Beginner';
      case 'Medium':
        return 'Intermediate';
      case 'Hard':
        return 'Advanced';
    }
  };

  const handleQuizComplete = useCallback(() => {
    if (!quiz || !user) return
    if (completeOnceRef.current) return
    completeOnceRef.current = true

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const correctCount = correctAnswers.filter(Boolean).length
    const score = Math.round((correctCount / quiz.questions.length) * 100)

    setIsSubmitting(true)

    // Complete attempt on backend and navigate to results
    if (attemptId) {
      completeAttempt.mutate(attemptId, {
        onSuccess: (result) => {
          setIsSubmitting(false)
          setShowResult(true)

          // Track performance (subjectId may be undefined; hook will resolve from topicId)
          trackQuizPerformance(
            quiz.subjectId,
            quiz.topicId,
            score,
            timeSpent,
            mapDifficultyToPerformanceTracker(quiz.difficulty)
          )

          // Show completion toast
          toast.success(`Quiz completed! Score: ${score}%`)

          // Navigate to results after a brief delay
          setTimeout(() => {
            router.push(`/quiz/results/${result.id}`)
          }, 1500)
        },
        onError: (error) => {
          setIsSubmitting(false)
          toast.error('Failed to submit quiz. Please try again.')
          console.error('Quiz completion error:', error)
        }
      })
    } else {
      // Fallback if no attempt ID
      toast.error('Unable to submit quiz. Please try again.')
      setIsSubmitting(false)
    }
  }, [quiz, user, startTime, correctAnswers, attemptId, completeAttempt, trackQuizPerformance, router])

  const restartQuiz = useCallback(() => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswers(quiz ? new Array(quiz.questions.length).fill(null) : [])
    setCorrectAnswers(quiz ? new Array(quiz.questions.length).fill(false) : [])
    setTimePerQuestion(quiz ? new Array(quiz.questions.length).fill(0) : [])
    setShowResult(false)
    setTimeLeft(quiz?.timeLimit || 300)
    setQuizStarted(false)
    setShowExplanation(false)
    setStartTime(0)
    setIsPaused(false)
    setShowTimeWarning(false)
    setAttemptId(null)
    setQuestionStartTime(null)
    toast.info('Quiz restarted')
  }, [quiz])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
        <GameLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-white">Loading quiz...</p>
            </div>
          </div>
        </GameLayout>
    )
  }

  if (error || !quiz) {
    return (
        <GameLayout>
          <div className="max-w-2xl mx-auto">
            <div className="game-card p-8 text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Quiz Not Found</h1>
              <p className="text-gray-400 mb-6">
                The quiz you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => router.push('/quiz')}
                className="game-button px-6 py-3"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Quiz Arena
              </button>
            </div>
          </div>
        </GameLayout>
    )
  }

  if (!quizStarted) {
    return (
        <GameLayout>
          <div className="max-w-2xl mx-auto">
            <motion.div
              className="game-card p-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">{quiz.title}</h1>
              <p className="text-gray-400 mb-6">Test your knowledge and earn XP!</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <div className="text-2xl font-bold text-blue-400">
                      {quiz.questions.length}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Questions</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-400" />
                    <div className="text-2xl font-bold text-green-400">
                      {quiz.xpReward}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Max XP Reward</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div className="text-2xl font-bold text-yellow-400">
                      {formatTime(quiz.timeLimit || 300)}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Time Limit</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <div className="text-2xl font-bold text-purple-400 capitalize">
                      {quiz.difficulty}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Difficulty Level</div>
                </div>
              </div>

              {/* Quiz Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Quiz Instructions
                </h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Answer all questions to the best of your ability</li>
                  <li>• You can pause the quiz at any time</li>
                  <li>• Each question shows an explanation after answering</li>
                  <li>• Build streaks by answering consecutively correct</li>
                  <li>• Time warnings will appear as you approach the limit</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/quiz')}
                  className="game-button-secondary px-6 py-3"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={startQuiz}
                  className="game-button text-lg px-8 py-4"
                >
                  Start Quiz
                </button>
              </div>
            </motion.div>
          </div>
        </GameLayout>
    )
  }

  if (showResult) {
    const correctAnswers = answers.filter((answer, index) =>
      answer === quiz.questions[index]?.correctAnswer
    ).length
    const score = Math.round((correctAnswers / quiz.questions.length) * 100)
    const xpEarned = Math.round((correctAnswers / quiz.questions.length) * quiz.xpReward)

    return (
        <GameLayout>
          <div className="max-w-2xl mx-auto">
            <motion.div
              className="game-card p-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h1>

              <div className="text-6xl font-bold text-yellow-400 mb-4">
                {score}%
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {correctAnswers}/{quiz.questions.length}
                  </div>
                  <div className="text-gray-400 text-sm">Correct Answers</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    +{xpEarned}
                  </div>
                  <div className="text-gray-400 text-sm">XP Earned</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={restartQuiz}
                  className="game-button-secondary px-6 py-3"
                  disabled={isSubmitting}
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/quiz')}
                  className="game-button px-6 py-3"
                >
                  Back to Quiz Arena
                </button>
              </div>
            </motion.div>
          </div>
        </GameLayout>
    )
  }

  // Move question access inside the render to avoid hook order issues
  const hasQuestions = quiz.questions && quiz.questions.length > 0
  const question = hasQuestions ? quiz.questions[currentQuestion] : null
  const isCorrect = selectedAnswer === question?.correctAnswer

  // Inline logging for current question
  if (question) {
    console.log('🎯 [QUIZ_PAGE] Current question:', currentQuestion + 1, 'of', quiz.questions.length)
    console.log('📝 [QUIZ_PAGE] Question data:', {
      id: question.id,
      text: question.questionText?.substring(0, 50) + '...',
      optionsCount: question.answerOptions?.length || 0,
      correctAnswer: question.correctAnswer,
      hasExplanation: !!question.explanation
    })
  }

  return (
      <GameLayout>
        <div className="max-w-2xl mx-auto">
          {/* No Questions Available */}
          {!hasQuestions && (
            <div className="game-card p-8 text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">No Questions Available</h1>
              <p className="text-gray-400 mb-6">
                This quiz doesn't have any questions yet. Please try a different quiz or contact support.
              </p>
              <button
                onClick={() => router.push('/quiz')}
                className="game-button px-6 py-3"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Quiz Arena
              </button>
            </div>
          )}

          {/* Quiz Content - only show if questions are available */}
          {hasQuestions && (
            <>
              {/* Quiz Header */}
              <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/quiz')}
                className="text-gray-400 hover:text-white transition-colors"
                title="Exit Quiz"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="text-white font-semibold">
                {quiz.title}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Pause Button */}
              <button
                onClick={togglePause}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                title={isPaused ? 'Resume Quiz' : 'Pause Quiz'}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              {/* Timer */}
              <QuizTimer
                totalTime={getSecondsForDifficulty(question?.questionDifficulty)}
                onTimeUp={handleTimeUpQuestion}
                onTimeWarning={handleTimeWarning}
                isPaused={isPaused}
                showWarnings={true}
                warningThresholds={[60, 30, 10]}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <QuizProgress
              currentQuestion={currentQuestion}
              totalQuestions={quiz.questions.length}
              answers={answers}
              correctAnswers={correctAnswers}
              timePerQuestion={timePerQuestion}
              showDetailedProgress={false}
            />
          </div>

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="game-card p-8 text-center max-w-md"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <Pause className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">Quiz Paused</h2>
                  <p className="text-gray-400 mb-6">Take your time. Click resume when ready.</p>
                  <button
                    onClick={togglePause}
                    className="game-button px-6 py-3"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Resume Quiz
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time Warning */}
          <AnimatePresence>
            {showTimeWarning && (
              <TimerWarning
                timeLeft={warningTimeLeft}
                onDismiss={() => setShowTimeWarning(false)}
              />
            )}
          </AnimatePresence>

          {/* Question */}
          {question && (
            <motion.div
              className="game-card p-8"
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <QuizQuestion
                question={question}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
                onSubmit={handleNextQuestion}
                showExplanation={showExplanation}
                isCorrect={isCorrect}
                timeSpent={timePerQuestion[currentQuestion]}
                questionNumber={currentQuestion + 1}
                totalQuestions={quiz.questions.length}
                disabled={isSubmitting || isPaused}
                showHints={true}
              />
            </motion.div>
          )}
            </>
          )}
        </div>
      </GameLayout>
  )
}
