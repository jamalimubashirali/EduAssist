import { 
  User, 
  Quiz, 
  Question, 
  BackendUser, 
  BackendQuiz, 
  BackendQuestion 
} from '@/types'

// Convert backend user to frontend user
export function convertBackendUser(backendUser: BackendUser): User {
  return {
    id: backendUser._id,
    email: backendUser.email,
    name: backendUser.name,
    avatar: backendUser.avatar,
    theme: backendUser.theme,
    goals: backendUser.goals,
    onboarding: backendUser.onboarding as any,
    preferences: backendUser.preferences,
    totalQuizzesAttempted: backendUser.totalQuizzesAttempted,
    averageScore: backendUser.averageScore,
    streakCount: backendUser.streakCount,
    lastQuizDate: backendUser.lastQuizDate as any,
    level: backendUser.level,
    xp_points: backendUser.xp_points,
    leaderboardScore: backendUser.leaderboardScore,
    isActive: backendUser.isActive as any,
    createdAt: backendUser.createdAt,
    longestStreak: backendUser.longestStreak ?? 0,
    xp: backendUser.xp ?? 0,
  }
}

// Fix: Explicitly type opt as any in map callback to resolve TS error
export function convertBackendQuestion(backendQuestion: any): Question {


  // Handle correctAnswer - convert from string answer to index if needed
  let correctAnswerIndex = backendQuestion.correctAnswer
  if (typeof correctAnswerIndex === 'string' && Array.isArray(backendQuestion.answerOptions)) {
    // Try to find the index of the correct answer in the options
    const foundIndex = backendQuestion.answerOptions.findIndex((option: any) =>
      String(option).trim() === String(correctAnswerIndex).trim()
    )
    if (foundIndex !== -1) {
      correctAnswerIndex = foundIndex
    } else {
      // If not found, try to parse as number
      const parsed = parseInt(correctAnswerIndex)
      correctAnswerIndex = isNaN(parsed) ? 0 : parsed
    }
  } else if (typeof correctAnswerIndex === 'number') {
    // Already a number, use as is
  } else {
    correctAnswerIndex = 0 // Default fallback
  }



  const convertedQuestion = {
    id: backendQuestion._id || backendQuestion.id || '',
    questionText: backendQuestion.questionText || '',
    answerOptions: Array.isArray(backendQuestion.answerOptions)
      ? backendQuestion.answerOptions.map((opt: any) => typeof opt === 'string' ? opt : String(opt))
      : [],
    correctAnswer: correctAnswerIndex,
    explanation: backendQuestion.explanation || '',
    questionDifficulty: backendQuestion.questionDifficulty
      ? (typeof backendQuestion.questionDifficulty === 'string' ? backendQuestion.questionDifficulty.charAt(0).toUpperCase() + backendQuestion.questionDifficulty.slice(1).toLowerCase() : 'Easy')
      : 'Easy',
    subject: backendQuestion.subject || { _id: backendQuestion.subjectId || '', subjectName: backendQuestion.subjectName || '' },
    topic: backendQuestion.topic || { _id: backendQuestion.topicId || '', topicName: backendQuestion.topicName || '' },
    type: backendQuestion.type || 'multiple-choice',
  };



  return convertedQuestion
}

// Fix: use subjectId instead of subject in Quiz conversion
export function convertBackendQuiz(backendQuiz: any): Quiz {


  // Handle both 'questions' and 'questionIds' fields from backend
  const questionsArray = backendQuiz.questions || backendQuiz.questionIds || []


  const questions = questionsArray.length > 0
    ? questionsArray.map((q: any) => convertBackendQuestion(q))
    : [];




  // Normalize IDs to strings
  const normalizeId = (val: any): string => {
    if (!val) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'object' && val._id) return String(val._id)
    return String(val)
  }

  const convertedQuiz = {
    id: normalizeId(backendQuiz.id || backendQuiz._id),
    title: backendQuiz.title || '',
    subjectId: normalizeId(backendQuiz.subjectId || backendQuiz.subject),
    topicId: normalizeId(backendQuiz.topicId),
    questions,
    timeLimit: backendQuiz.timeLimit || 30,
    difficulty: convertDifficulty(backendQuiz.difficulty || backendQuiz.quizDifficulty),
    type: backendQuiz.quizType === 'ASSESSMENT'
      ? 'diagnostic'
      : backendQuiz.quizType === 'ADAPTIVE'
        ? 'adaptive'
        : 'standard' as 'diagnostic' | 'adaptive' | 'standard',
    createdAt: backendQuiz.createdAt || new Date().toISOString(),
    xpReward: backendQuiz.xpReward || calculateQuizXP(backendQuiz.difficulty || backendQuiz.quizDifficulty, questions.length),
    completions: backendQuiz.completions ?? 0,
    rating: backendQuiz.rating ?? 0,
    description: backendQuiz.description ?? '',
  };

  return convertedQuiz;
}

// Fix: convertDifficulty should handle multiple difficulty formats
function convertDifficulty(backendDifficulty: any): 'Easy' | 'Medium' | 'Hard' {
  if (!backendDifficulty) return 'Easy';

  const difficulty = String(backendDifficulty).toUpperCase();

  switch (difficulty) {
    case 'EASY':
    case 'BEGINNER':
      return 'Easy';
    case 'MEDIUM':
    case 'INTERMEDIATE':
      return 'Medium';
    case 'HARD':
    case 'ADVANCED':
      return 'Hard';
    default:
      return 'Easy';
  }
}

// Convert difficulty from frontend to backend format
export function convertDifficultyToBackend(frontendDifficulty: 'beginner' | 'intermediate' | 'advanced'): 'EASY' | 'MEDIUM' | 'HARD' {
  switch (frontendDifficulty) {
    case 'beginner':
      return 'EASY'
    case 'intermediate':
      return 'MEDIUM'
    case 'advanced':
      return 'HARD'
    default:
      return 'EASY'
  }
}

// Calculate XP for a question based on difficulty
function calculateQuestionXP(difficulty: 'EASY' | 'MEDIUM' | 'HARD'): number {
  switch (difficulty) {
    case 'EASY':
      return 10
    case 'MEDIUM':
      return 20
    case 'HARD':
      return 30
    default:
      return 10
  }
}

// Calculate XP reward for a quiz
function calculateQuizXP(difficulty: 'EASY' | 'MEDIUM' | 'HARD', questionCount: number): number {
  const baseXP = calculateQuestionXP(difficulty)
  const bonusMultiplier = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 1.5 : 2
  return Math.round(baseXP * questionCount * bonusMultiplier)
}

// Convert frontend user data for backend API calls
export function convertUserForBackend(user: Partial<User>): Partial<BackendUser> {
  return {
    _id: user.id,
    email: user.email,
    name: user.name,
    preferences: user.preferences,
    totalQuizzesAttempted: user.totalQuizzesAttempted,
    averageScore: user.averageScore,
    streakCount: user.streakCount,
    lastQuizDate: user.lastQuizDate,
    level: user.level,
    xp_points: user.xp_points,
    leaderboardScore: user.leaderboardScore,
    isActive: user.isActive,
  }
}

// Fix: Remove all references to quiz.subject and quiz.difficulty in convertQuizForBackend
export function convertQuizForBackend(quiz: Partial<Quiz>): Partial<BackendQuiz> {
  return {
    _id: quiz.id,
    title: quiz.title,
    topicId: quiz.topicId,
    quizDifficulty: 'EASY', // Default to EASY for backend compatibility
    timeLimit: quiz.timeLimit || 300,
    isPersonalized: false,
    isActive: true,
  };
}

// Fix: Explicitly type opt as any in map callback to resolve TS error
export function convertQuestionForBackend(question: Partial<Question>): Partial<BackendQuestion> {
  return {
    _id: question.id,
    questionText: question.questionText || '',
    answerOptions: Array.isArray(question.answerOptions)
      ? question.answerOptions.map((opt: any) => typeof opt === 'string' ? opt : String(opt))
      : [],
    correctAnswer: question.correctAnswer?.toString() || '0',
    explanation: question.explanation,
    questionDifficulty: 'MEDIUM', // Default difficulty
    tags: [],
    timesAsked: 0,
    timesAnsweredCorrectly: 0,
    averageTimeToAnswer: 0,
    difficultyRating: 0.5,
    isActive: true,
    learningObjectives: [],
    prerequisites: [],
  }
}

// Helper function to safely convert arrays
export function convertBackendArray<T, U>(
  backendArray: T[] | undefined,
  converter: (item: T) => U
): U[] {
  return backendArray ? backendArray.map(converter) : []
}

// Helper function to handle API response conversion
export function convertApiResponse<T, U>(
  response: T | T[],
  converter: (item: T) => U
): U | U[] {
  if (Array.isArray(response)) {
    return response.map(converter)
  }
  return converter(response)
}
