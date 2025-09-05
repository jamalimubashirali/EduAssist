import { QuizFeedbackData } from '@/app/components/quiz/QuizFeedbackModal'

export interface FeedbackAnalytics {
  totalResponses: number
  averageRating: number
  difficultyDistribution: {
    too_easy: number
    just_right: number
    too_hard: number
  }
  timeDistribution: {
    too_short: number
    just_right: number
    too_long: number
  }
  qualityDistribution: {
    poor: number
    fair: number
    good: number
    excellent: number
  }
  clarityDistribution: {
    confusing: number
    somewhat_clear: number
    clear: number
    very_clear: number
  }
  mostChallengingAspects: { aspect: string; count: number }[]
  mostHelpfulFeatures: { feature: string; count: number }[]
  improvementSuggestions: { suggestion: string; count: number }[]
  recommendationRate: number
  quizSpecificInsights: {
    [quizId: string]: {
      averageRating: number
      difficultyFeedback: string
      commonIssues: string[]
      strengths: string[]
    }
  }
}

export interface DifficultyAdjustmentRecommendation {
  quizId: string
  currentDifficulty: string
  recommendedDifficulty: string
  confidence: number
  reasoning: string
  adjustmentType: 'increase' | 'decrease' | 'maintain'
  specificChanges: string[]
}

/**
 * Analyzes quiz feedback data to generate insights and recommendations
 */
export function analyzeFeedbackData(feedbackData: any[]): FeedbackAnalytics {
  if (!feedbackData || feedbackData.length === 0) {
    return getEmptyAnalytics()
  }

  const totalResponses = feedbackData.length
  const averageRating = feedbackData.reduce((sum, f) => sum + f.overallExperience, 0) / totalResponses

  // Distribution calculations
  const difficultyDistribution = calculateDistribution(feedbackData, 'difficultyLevel')
  const timeDistribution = calculateDistribution(feedbackData, 'timeEstimation')
  const qualityDistribution = calculateDistribution(feedbackData, 'questionQuality')
  const clarityDistribution = calculateDistribution(feedbackData, 'contentClarity')

  // Multi-select field analysis
  const mostChallengingAspects = analyzeMultiSelectField(feedbackData, 'mostChallengingAspect')
  const mostHelpfulFeatures = analyzeMultiSelectField(feedbackData, 'mostHelpfulFeature')
  const improvementSuggestions = analyzeMultiSelectField(feedbackData, 'improvementSuggestions')

  // Recommendation rate
  const recommendationRate = feedbackData.filter(f => f.wouldRecommend).length / totalResponses

  // Quiz-specific insights
  const quizSpecificInsights = generateQuizSpecificInsights(feedbackData)

  return {
    totalResponses,
    averageRating,
    difficultyDistribution,
    timeDistribution,
    qualityDistribution,
    clarityDistribution,
    mostChallengingAspects,
    mostHelpfulFeatures,
    improvementSuggestions,
    recommendationRate,
    quizSpecificInsights
  }
}

/**
 * Generates difficulty adjustment recommendations based on feedback
 */
export function generateDifficultyRecommendations(
  feedbackData: any[]
): DifficultyAdjustmentRecommendation[] {
  const quizGroups = groupFeedbackByQuiz(feedbackData)
  const recommendations: DifficultyAdjustmentRecommendation[] = []

  Object.entries(quizGroups).forEach(([quizId, feedback]) => {
    const recommendation = analyzeSingleQuizDifficulty(quizId, feedback)
    if (recommendation) {
      recommendations.push(recommendation)
    }
  })

  return recommendations.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Analyzes difficulty feedback for a single quiz
 */
function analyzeSingleQuizDifficulty(
  quizId: string, 
  feedback: any[]
): DifficultyAdjustmentRecommendation | null {
  if (feedback.length < 3) return null // Need minimum responses for reliable analysis

  const difficultyFeedback = feedback.map(f => f.difficultyLevel)
  const averageRating = feedback.reduce((sum, f) => sum + f.overallExperience, 0) / feedback.length
  
  const tooEasyCount = difficultyFeedback.filter(d => d === 'too_easy').length
  const justRightCount = difficultyFeedback.filter(d => d === 'just_right').length
  const tooHardCount = difficultyFeedback.filter(d => d === 'too_hard').length
  
  const tooEasyPercent = tooEasyCount / feedback.length
  const tooHardPercent = tooHardCount / feedback.length
  const justRightPercent = justRightCount / feedback.length

  // Determine current difficulty from quiz ID or metadata
  const currentDifficulty = extractDifficultyFromQuizId(quizId)
  
  let recommendedDifficulty = currentDifficulty
  let adjustmentType: 'increase' | 'decrease' | 'maintain' = 'maintain'
  let confidence = 0
  let reasoning = ''
  let specificChanges: string[] = []

  // Analysis logic
  if (tooEasyPercent > 0.6) {
    // More than 60% find it too easy
    adjustmentType = 'increase'
    recommendedDifficulty = getNextDifficultyLevel(currentDifficulty, 'up')
    confidence = Math.min(95, tooEasyPercent * 100)
    reasoning = `${Math.round(tooEasyPercent * 100)}% of users found the quiz too easy`
    specificChanges = [
      'Add more complex questions',
      'Introduce advanced concepts',
      'Reduce time allocation per question',
      'Add multi-step problem solving'
    ]
  } else if (tooHardPercent > 0.5) {
    // More than 50% find it too hard
    adjustmentType = 'decrease'
    recommendedDifficulty = getNextDifficultyLevel(currentDifficulty, 'down')
    confidence = Math.min(90, tooHardPercent * 100)
    reasoning = `${Math.round(tooHardPercent * 100)}% of users found the quiz too challenging`
    specificChanges = [
      'Simplify question wording',
      'Add more foundational questions',
      'Provide better explanations',
      'Increase time allocation'
    ]
  } else if (justRightPercent > 0.7) {
    // More than 70% find it just right
    adjustmentType = 'maintain'
    confidence = Math.min(85, justRightPercent * 100)
    reasoning = `${Math.round(justRightPercent * 100)}% of users found the difficulty appropriate`
    specificChanges = [
      'Maintain current difficulty balance',
      'Focus on content quality improvements',
      'Enhance explanations and feedback'
    ]
  }

  // Adjust confidence based on sample size and rating
  confidence = confidence * Math.min(1, feedback.length / 10) // Reduce confidence for small samples
  if (averageRating < 3) confidence *= 1.2 // Increase confidence if ratings are low
  if (averageRating > 4) confidence *= 0.9 // Slightly reduce confidence if ratings are high

  return {
    quizId,
    currentDifficulty,
    recommendedDifficulty,
    confidence: Math.round(confidence),
    reasoning,
    adjustmentType,
    specificChanges
  }
}

/**
 * Helper functions
 */
function getEmptyAnalytics(): FeedbackAnalytics {
  return {
    totalResponses: 0,
    averageRating: 0,
    difficultyDistribution: { too_easy: 0, just_right: 0, too_hard: 0 },
    timeDistribution: { too_short: 0, just_right: 0, too_long: 0 },
    qualityDistribution: { poor: 0, fair: 0, good: 0, excellent: 0 },
    clarityDistribution: { confusing: 0, somewhat_clear: 0, clear: 0, very_clear: 0 },
    mostChallengingAspects: [],
    mostHelpfulFeatures: [],
    improvementSuggestions: [],
    recommendationRate: 0,
    quizSpecificInsights: {}
  }
}

function calculateDistribution(data: any[], field: string): any {
  const distribution: any = {}
  data.forEach(item => {
    const value = item[field]
    distribution[value] = (distribution[value] || 0) + 1
  })
  return distribution
}

function analyzeMultiSelectField(data: any[], field: string): { aspect: string; count: number }[] {
  const counts: { [key: string]: number } = {}
  
  data.forEach(item => {
    const values = item[field] || []
    values.forEach((value: string) => {
      counts[value] = (counts[value] || 0) + 1
    })
  })

  return Object.entries(counts)
    .map(([aspect, count]) => ({ aspect, count }))
    .sort((a, b) => b.count - a.count)
}

function generateQuizSpecificInsights(feedbackData: any[]): any {
  const insights: any = {}
  const quizGroups = groupFeedbackByQuiz(feedbackData)

  Object.entries(quizGroups).forEach(([quizId, feedback]) => {
    const averageRating = feedback.reduce((sum: number, f: any) => sum + f.overallExperience, 0) / feedback.length
    const difficultyFeedback = feedback.map((f: any) => f.difficultyLevel)
    const mostCommonDifficulty = getMostCommon(difficultyFeedback)
    
    const commonIssues = analyzeMultiSelectField(feedback, 'mostChallengingAspect')
      .slice(0, 3)
      .map(item => item.aspect)
    
    const strengths = analyzeMultiSelectField(feedback, 'mostHelpfulFeature')
      .slice(0, 3)
      .map(item => item.aspect)

    insights[quizId] = {
      averageRating: Math.round(averageRating * 10) / 10,
      difficultyFeedback: mostCommonDifficulty,
      commonIssues,
      strengths
    }
  })

  return insights
}

function groupFeedbackByQuiz(feedbackData: any[]): { [quizId: string]: any[] } {
  const groups: { [quizId: string]: any[] } = {}
  
  feedbackData.forEach(feedback => {
    const quizId = feedback.quizId || 'unknown'
    if (!groups[quizId]) {
      groups[quizId] = []
    }
    groups[quizId].push(feedback)
  })

  return groups
}

function getMostCommon(array: string[]): string {
  const counts: { [key: string]: number } = {}
  array.forEach(item => {
    counts[item] = (counts[item] || 0) + 1
  })
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'
}

function extractDifficultyFromQuizId(quizId: string): string {
  if (quizId.includes('easy')) return 'easy'
  if (quizId.includes('hard')) return 'hard'
  return 'medium'
}

function getNextDifficultyLevel(current: string, direction: 'up' | 'down'): string {
  const levels = ['easy', 'medium', 'hard']
  const currentIndex = levels.indexOf(current)
  
  if (direction === 'up') {
    return levels[Math.min(currentIndex + 1, levels.length - 1)]
  } else {
    return levels[Math.max(currentIndex - 1, 0)]
  }
}

/**
 * Get feedback data from localStorage (in production, this would be an API call)
 */
export function getFeedbackData(): any[] {
  try {
    const data = localStorage.getItem('quizFeedback')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading feedback data:', error)
    return []
  }
}
