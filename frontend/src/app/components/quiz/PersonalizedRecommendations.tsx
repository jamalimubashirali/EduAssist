'use client'

import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Play, 
  ExternalLink,
  Clock,
  Zap,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Brain,
  Star
} from 'lucide-react'
import { QuizPerformanceAnalysis, RecommendationStep } from '@/utils/quizRecommendationEngine'
import { SubjectQuizButton, QuickQuizButton } from './StartQuizButton'

interface PersonalizedRecommendationsProps {
  analysis: QuizPerformanceAnalysis
  quizSubject: string
  className?: string
}

export default function PersonalizedRecommendations({ 
  analysis, 
  quizSubject,
  className = '' 
}: PersonalizedRecommendationsProps) {
  
  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return "Outstanding performance! 🎉"
    if (score >= 80) return "Great job! Keep it up! 👏"
    if (score >= 70) return "Good work! Room for improvement 📈"
    if (score >= 60) return "You're getting there! Keep practicing 💪"
    return "Don't give up! Practice makes perfect 🌟"
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Performance Analysis</h3>
            <p className="text-gray-400 text-sm">{getPerformanceMessage(analysis.overallScore)}</p>
          </div>
        </div>
        
        {/* Subject Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {analysis.subjectBreakdown.map((subject, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">{subject.subject}</span>
                <span className={`text-sm font-bold ${getPerformanceColor(subject.accuracy)}`}>
                  {subject.accuracy}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    subject.accuracy >= 85 ? 'bg-green-500' :
                    subject.accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${subject.accuracy}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {subject.correctAnswers}/{subject.totalQuestions} correct
              </p>
            </div>
          ))}
        </div>
        
        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Your Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Weak Areas */}
        {analysis.weakAreas.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {analysis.weakAreas.map((area, index) => (
                <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-yellow-400">{area.topic}</span>
                    <span className="text-xs text-yellow-300">{area.accuracy}% accuracy</span>
                  </div>
                  <p className="text-xs text-gray-400">{area.recommendedActions[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Personalized Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Personalized Recommendations</h3>
            <p className="text-gray-400 text-sm">Based on your performance, we recommend focusing on these areas</p>
          </div>
        </div>

        <div className="grid gap-4">
          {analysis.recommendedNextSteps.map((recommendation, index) => (
            <RecommendationCard 
              key={index} 
              recommendation={recommendation} 
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* Study Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="game-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Study Resources</h3>
            <p className="text-gray-400 text-sm">Additional materials to help you improve</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TODO: Future Implementation - Connect to actual resource database */}
          <StudyResourceCard 
            type="textbook"
            title={`${quizSubject} Study Guide`}
            description="Comprehensive guide covering all fundamental concepts"
            icon={<BookOpen className="w-5 h-5" />}
          />
          <StudyResourceCard 
            type="video"
            title={`${quizSubject} Video Tutorials`}
            description="Visual explanations of key concepts and problem-solving techniques"
            icon={<Play className="w-5 h-5" />}
          />
          <StudyResourceCard 
            type="practice"
            title="Interactive Practice Problems"
            description="Hands-on exercises to reinforce your learning"
            icon={<Target className="w-5 h-5" />}
          />
          <StudyResourceCard 
            type="flashcards"
            title="Digital Flashcards"
            description="Quick review cards for key terms and concepts"
            icon={<Brain className="w-5 h-5" />}
          />
        </div>
      </motion.div>
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: RecommendationStep
  index: number
}

function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-500/10'
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/10'
      case 'low': return 'border-blue-500/30 bg-blue-500/10'
      default: return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'medium': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'low': return <Star className="w-4 h-4 text-blue-400" />
      default: return <Target className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Play className="w-5 h-5" />
      case 'study': return <BookOpen className="w-5 h-5" />
      case 'practice': return <Target className="w-5 h-5" />
      case 'review': return <TrendingUp className="w-5 h-5" />
      default: return <Lightbulb className="w-5 h-5" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-lg p-4 ${getPriorityColor(recommendation.priority)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
            {getTypeIcon(recommendation.type)}
          </div>
          <div>
            <h4 className="font-semibold text-white">{recommendation.title}</h4>
            <p className="text-sm text-gray-400">{recommendation.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getPriorityIcon(recommendation.priority)}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recommendation.estimatedTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>+{recommendation.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="capitalize">{recommendation.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500 italic">"{recommendation.reason}"</p>
      </div>

      <div className="flex items-center justify-between">
        <div></div>
        {recommendation.type === 'quiz' ? (
          <SubjectQuizButton
            subject={recommendation.subject}
            difficulty={recommendation.difficulty}
            questionCount={6}
            size="sm"
            showStats={false}
          >
            {recommendation.actionButton.text}
            <ArrowRight className="w-4 h-4 ml-1" />
          </SubjectQuizButton>
        ) : (
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2">
            {recommendation.actionButton.text}
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface StudyResourceCardProps {
  type: string
  title: string
  description: string
  icon: React.ReactNode
}

function StudyResourceCard({ type, title, description, icon }: StudyResourceCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
          {icon}
        </div>
        <h4 className="font-medium text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-400 mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{type}</span>
        <button className="text-blue-400 hover:text-blue-300 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
