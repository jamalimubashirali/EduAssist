import { DummyQuestion } from './generateDummyQuiz'

export interface QuizPerformanceAnalysis {
  overallScore: number
  subjectBreakdown: SubjectPerformance[]
  difficultyAnalysis: DifficultyPerformance
  timeAnalysis: TimePerformance
  weakAreas: WeakArea[]
  strengths: string[]
  recommendedNextSteps: RecommendationStep[]
}

export interface SubjectPerformance {
  subject: string
  correctAnswers: number
  totalQuestions: number
  accuracy: number
  averageTime: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface DifficultyPerformance {
  easy: { correct: number; total: number; accuracy: number }
  medium: { correct: number; total: number; accuracy: number }
  hard: { correct: number; total: number; accuracy: number }
}

export interface TimePerformance {
  totalTime: number
  averageTime: number
  fastestQuestion: number
  slowestQuestion: number
  timeEfficiency: 'excellent' | 'good' | 'needs_improvement'
}

export interface WeakArea {
  subject: string
  topic: string
  accuracy: number
  questionsCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  recommendedActions: string[]
}

export interface RecommendationStep {
  type: 'quiz' | 'study' | 'practice' | 'review'
  title: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: number
  xpReward: number
  priority: 'high' | 'medium' | 'low'
  reason: string
  actionButton: {
    text: string
    action: 'start_quiz' | 'view_resources' | 'practice_more'
  }
}

// TODO: Future Implementation Notes
// 1. Connect to user's historical performance data
// 2. Integrate with learning path algorithms
// 3. Add machine learning for personalized difficulty progression
// 4. Connect to content management system for dynamic resources
// 5. Implement spaced repetition algorithms
// 6. Add collaborative filtering based on similar users
// 7. Integrate with curriculum standards and learning objectives

export function analyzeQuizPerformance(
  questions: DummyQuestion[],
  answers: (number | null)[],
  questionTimes: number[],
  totalTime: number
): QuizPerformanceAnalysis {
  
  // Calculate overall performance
  const correctAnswers = answers.filter((answer, index) => 
    answer === questions[index].correctAnswerIndex
  ).length
  const overallScore = Math.round((correctAnswers / questions.length) * 100)
  
  // Analyze by subject
  const subjectBreakdown = analyzeBySubject(questions, answers, questionTimes)
  
  // Analyze by difficulty
  const difficultyAnalysis = analyzeByDifficulty(questions, answers)
  
  // Analyze time performance
  const timeAnalysis = analyzeTimePerformance(questionTimes, totalTime)
  
  // Identify weak areas
  const weakAreas = identifyWeakAreas(subjectBreakdown, difficultyAnalysis)
  
  // Identify strengths
  const strengths = identifyStrengths(subjectBreakdown, difficultyAnalysis)
  
  // Generate recommendations
  const recommendedNextSteps = generateRecommendations(
    overallScore,
    subjectBreakdown,
    difficultyAnalysis,
    weakAreas,
    strengths
  )
  
  return {
    overallScore,
    subjectBreakdown,
    difficultyAnalysis,
    timeAnalysis,
    weakAreas,
    strengths,
    recommendedNextSteps
  }
}

function analyzeBySubject(
  questions: DummyQuestion[],
  answers: (number | null)[],
  questionTimes: number[]
): SubjectPerformance[] {
  const subjectMap = new Map<string, {
    correct: number
    total: number
    totalTime: number
    difficulties: string[]
  }>()
  
  questions.forEach((question, index) => {
    const subject = question.subject
    const isCorrect = answers[index] === question.correctAnswerIndex
    const time = questionTimes[index] || 0
    
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        correct: 0,
        total: 0,
        totalTime: 0,
        difficulties: []
      })
    }
    
    const subjectData = subjectMap.get(subject)!
    subjectData.total++
    subjectData.totalTime += time
    subjectData.difficulties.push(question.difficulty)
    
    if (isCorrect) {
      subjectData.correct++
    }
  })
  
  return Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    correctAnswers: data.correct,
    totalQuestions: data.total,
    accuracy: Math.round((data.correct / data.total) * 100),
    averageTime: Math.round(data.totalTime / data.total),
    difficulty: getMostCommonDifficulty(data.difficulties)
  }))
}

function analyzeByDifficulty(
  questions: DummyQuestion[],
  answers: (number | null)[]
): DifficultyPerformance {
  const difficulties = {
    easy: { correct: 0, total: 0, accuracy: 0 },
    medium: { correct: 0, total: 0, accuracy: 0 },
    hard: { correct: 0, total: 0, accuracy: 0 }
  }
  
  questions.forEach((question, index) => {
    const difficulty = question.difficulty
    const isCorrect = answers[index] === question.correctAnswerIndex
    
    difficulties[difficulty].total++
    if (isCorrect) {
      difficulties[difficulty].correct++
    }
  })
  
  // Calculate accuracy percentages
  Object.keys(difficulties).forEach(key => {
    const diff = difficulties[key as keyof typeof difficulties]
    diff.accuracy = diff.total > 0 ? Math.round((diff.correct / diff.total) * 100) : 0
  })
  
  return difficulties
}

function analyzeTimePerformance(
  questionTimes: number[],
  totalTime: number
): TimePerformance {
  const averageTime = Math.round(totalTime / questionTimes.length)
  const fastestQuestion = Math.min(...questionTimes)
  const slowestQuestion = Math.max(...questionTimes)
  
  let timeEfficiency: 'excellent' | 'good' | 'needs_improvement'
  if (averageTime <= 15) {
    timeEfficiency = 'excellent'
  } else if (averageTime <= 30) {
    timeEfficiency = 'good'
  } else {
    timeEfficiency = 'needs_improvement'
  }
  
  return {
    totalTime,
    averageTime,
    fastestQuestion,
    slowestQuestion,
    timeEfficiency
  }
}

function identifyWeakAreas(
  subjectBreakdown: SubjectPerformance[],
  difficultyAnalysis: DifficultyPerformance
): WeakArea[] {
  const weakAreas: WeakArea[] = []
  
  // Identify weak subjects (accuracy < 70%)
  subjectBreakdown.forEach(subject => {
    if (subject.accuracy < 70) {
      weakAreas.push({
        subject: subject.subject,
        topic: `${subject.subject} fundamentals`,
        accuracy: subject.accuracy,
        questionsCount: subject.totalQuestions,
        difficulty: subject.difficulty,
        recommendedActions: [
          `Review ${subject.subject} basics`,
          `Practice more ${subject.difficulty} level questions`,
          `Focus on understanding core concepts`
        ]
      })
    }
  })
  
  // Identify difficulty-based weak areas
  Object.entries(difficultyAnalysis).forEach(([difficulty, data]) => {
    if (data.accuracy < 60 && data.total > 0) {
      weakAreas.push({
        subject: 'General',
        topic: `${difficulty} level questions`,
        accuracy: data.accuracy,
        questionsCount: data.total,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        recommendedActions: [
          `Build confidence with ${difficulty} questions`,
          `Practice fundamental concepts`,
          `Take your time to understand each question`
        ]
      })
    }
  })
  
  return weakAreas
}

function identifyStrengths(
  subjectBreakdown: SubjectPerformance[],
  difficultyAnalysis: DifficultyPerformance
): string[] {
  const strengths: string[] = []
  
  // Strong subjects (accuracy >= 85%)
  subjectBreakdown.forEach(subject => {
    if (subject.accuracy >= 85) {
      strengths.push(`Excellent performance in ${subject.subject}`)
    }
  })
  
  // Strong difficulty levels
  Object.entries(difficultyAnalysis).forEach(([difficulty, data]) => {
    if (data.accuracy >= 80 && data.total > 0) {
      strengths.push(`Strong grasp of ${difficulty} level concepts`)
    }
  })
  
  return strengths
}

function generateRecommendations(
  overallScore: number,
  subjectBreakdown: SubjectPerformance[],
  difficultyAnalysis: DifficultyPerformance,
  weakAreas: WeakArea[],
  strengths: string[]
): RecommendationStep[] {
  const recommendations: RecommendationStep[] = []
  
  // Recommendations based on weak areas
  weakAreas.forEach(weakArea => {
    if (weakArea.subject !== 'General') {
      recommendations.push({
        type: 'quiz',
        title: `${weakArea.subject} Practice Quiz`,
        description: `Focus on ${weakArea.subject} concepts to improve your ${weakArea.accuracy}% accuracy`,
        subject: weakArea.subject,
        difficulty: weakArea.difficulty,
        estimatedTime: 15,
        xpReward: 120,
        priority: 'high',
        reason: `You scored ${weakArea.accuracy}% in ${weakArea.subject}`,
        actionButton: {
          text: 'Practice Now',
          action: 'start_quiz'
        }
      })
      
      recommendations.push({
        type: 'study',
        title: `${weakArea.subject} Study Guide`,
        description: `Review fundamental concepts and strengthen your understanding`,
        subject: weakArea.subject,
        difficulty: 'easy',
        estimatedTime: 20,
        xpReward: 80,
        priority: 'medium',
        reason: `Strengthen foundation in ${weakArea.subject}`,
        actionButton: {
          text: 'View Resources',
          action: 'view_resources'
        }
      })
    }
  })
  
  // Recommendations for progression (if performing well)
  if (overallScore >= 80) {
    const strongSubjects = subjectBreakdown.filter(s => s.accuracy >= 80)
    strongSubjects.forEach(subject => {
      const nextDifficulty = getNextDifficulty(subject.difficulty)
      if (nextDifficulty) {
        recommendations.push({
          type: 'quiz',
          title: `Advanced ${subject.subject} Challenge`,
          description: `You're doing great! Try ${nextDifficulty} level questions to challenge yourself`,
          subject: subject.subject,
          difficulty: nextDifficulty,
          estimatedTime: 20,
          xpReward: 200,
          priority: 'medium',
          reason: `Excellent ${subject.accuracy}% accuracy in ${subject.subject}`,
          actionButton: {
            text: 'Take Challenge',
            action: 'start_quiz'
          }
        })
      }
    })
  }
  
  // Mixed practice recommendation
  if (overallScore >= 60) {
    recommendations.push({
      type: 'quiz',
      title: 'Mixed Practice Quiz',
      description: 'Test your knowledge across different subjects and difficulty levels',
      subject: 'mixed',
      difficulty: 'medium',
      estimatedTime: 18,
      xpReward: 150,
      priority: 'low',
      reason: 'Maintain and improve overall performance',
      actionButton: {
        text: 'Start Mixed Quiz',
        action: 'start_quiz'
      }
    })
  }
  
  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function getMostCommonDifficulty(difficulties: string[]): 'easy' | 'medium' | 'hard' {
  const counts = difficulties.reduce((acc, diff) => {
    acc[diff] = (acc[diff] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostCommon = Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0]
  return mostCommon as 'easy' | 'medium' | 'hard'
}

function getNextDifficulty(current: 'easy' | 'medium' | 'hard'): 'medium' | 'hard' | null {
  const progression = { easy: 'medium', medium: 'hard', hard: null }
  return progression[current] as 'medium' | 'hard' | null
}
