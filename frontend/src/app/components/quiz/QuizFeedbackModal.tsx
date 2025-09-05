'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Star, 
  Clock, 
  Brain, 
  Target, 
  Lightbulb, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Zap,
  Award,
  TrendingUp,
  BookOpen
} from 'lucide-react'

interface QuizFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: QuizFeedbackData) => void
  quizTitle: string
  quizSubject: string
  difficulty: string
}

export interface QuizFeedbackData {
  overallExperience: number
  difficultyLevel: 'too_easy' | 'just_right' | 'too_hard'
  timeEstimation: 'too_short' | 'just_right' | 'too_long'
  questionQuality: 'poor' | 'fair' | 'good' | 'excellent'
  contentClarity: 'confusing' | 'somewhat_clear' | 'clear' | 'very_clear'
  interfaceExperience: 'poor' | 'fair' | 'good' | 'excellent'
  mostChallengingAspect: string[]
  mostHelpfulFeature: string[]
  improvementSuggestions: string[]
  wouldRecommend: boolean
  additionalComments?: string
}

const difficultyOptions = [
  { value: 'too_easy', label: 'Too Easy', icon: '😴', description: 'Questions were too simple' },
  { value: 'just_right', label: 'Just Right', icon: '🎯', description: 'Perfect difficulty level' },
  { value: 'too_hard', label: 'Too Hard', icon: '🤯', description: 'Questions were too challenging' }
]

const timeOptions = [
  { value: 'too_short', label: 'Too Short', icon: '⚡', description: 'Needed more time per question' },
  { value: 'just_right', label: 'Just Right', icon: '⏰', description: 'Time allocation was perfect' },
  { value: 'too_long', label: 'Too Long', icon: '🐌', description: 'Too much time per question' }
]

const qualityOptions = [
  { value: 'poor', label: 'Poor', icon: '😞', color: 'text-red-400' },
  { value: 'fair', label: 'Fair', icon: '😐', color: 'text-yellow-400' },
  { value: 'good', label: 'Good', icon: '😊', color: 'text-blue-400' },
  { value: 'excellent', label: 'Excellent', icon: '🤩', color: 'text-green-400' }
]

const clarityOptions = [
  { value: 'confusing', label: 'Confusing', icon: '😵', color: 'text-red-400' },
  { value: 'somewhat_clear', label: 'Somewhat Clear', icon: '🤔', color: 'text-yellow-400' },
  { value: 'clear', label: 'Clear', icon: '😌', color: 'text-blue-400' },
  { value: 'very_clear', label: 'Very Clear', icon: '😍', color: 'text-green-400' }
]

const challengingAspects = [
  'Question difficulty',
  'Time pressure',
  'Question wording',
  'Subject complexity',
  'Multiple choice options',
  'Technical terminology',
  'Calculation requirements',
  'Conceptual understanding'
]

const helpfulFeatures = [
  'Clear question format',
  'Helpful explanations',
  'Progress indicator',
  'Timer display',
  'Answer review',
  'Streak counter',
  'Visual design',
  'Navigation ease'
]

const improvementSuggestions = [
  'Add more practice questions',
  'Improve question explanations',
  'Better time management',
  'More difficulty options',
  'Enhanced visual design',
  'Better feedback system',
  'More subject variety',
  'Improved mobile experience'
]

export default function QuizFeedbackModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  quizTitle, 
  quizSubject, 
  difficulty 
}: QuizFeedbackModalProps) {
  const [feedback, setFeedback] = useState<QuizFeedbackData>({
    overallExperience: 0,
    difficultyLevel: 'just_right',
    timeEstimation: 'just_right',
    questionQuality: 'good',
    contentClarity: 'clear',
    interfaceExperience: 'good',
    mostChallengingAspect: [],
    mostHelpfulFeature: [],
    improvementSuggestions: [],
    wouldRecommend: true,
    additionalComments: ''
  })

  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 8

  const handleSubmit = () => {
    onSubmit(feedback)
    onClose()
  }

  const handleMultiSelect = (field: keyof QuizFeedbackData, value: string) => {
    const currentValues = feedback[field] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    setFeedback(prev => ({ ...prev, [field]: newValues }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quiz Feedback</h2>
                <p className="text-gray-400 text-sm">Help us improve your quiz experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Step {currentStep + 1} of {totalSteps}</span>
              <span className="text-sm text-gray-400">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <OverallExperienceStep 
                    value={feedback.overallExperience}
                    onChange={(value) => setFeedback(prev => ({ ...prev, overallExperience: value }))}
                    quizTitle={quizTitle}
                  />
                )}
                
                {currentStep === 1 && (
                  <DifficultyStep 
                    value={feedback.difficultyLevel}
                    onChange={(value) => setFeedback(prev => ({ ...prev, difficultyLevel: value }))}
                    currentDifficulty={difficulty}
                  />
                )}
                
                {currentStep === 2 && (
                  <TimeEstimationStep 
                    value={feedback.timeEstimation}
                    onChange={(value) => setFeedback(prev => ({ ...prev, timeEstimation: value }))}
                  />
                )}
                
                {currentStep === 3 && (
                  <QuestionQualityStep 
                    value={feedback.questionQuality}
                    onChange={(value) => setFeedback(prev => ({ ...prev, questionQuality: value }))}
                  />
                )}
                
                {currentStep === 4 && (
                  <ContentClarityStep 
                    value={feedback.contentClarity}
                    onChange={(value) => setFeedback(prev => ({ ...prev, contentClarity: value }))}
                  />
                )}
                
                {currentStep === 5 && (
                  <ChallengingAspectsStep 
                    values={feedback.mostChallengingAspect}
                    onChange={(value) => handleMultiSelect('mostChallengingAspect', value)}
                  />
                )}
                
                {currentStep === 6 && (
                  <HelpfulFeaturesStep 
                    values={feedback.mostHelpfulFeature}
                    onChange={(value) => handleMultiSelect('mostHelpfulFeature', value)}
                  />
                )}
                
                {currentStep === 7 && (
                  <FinalStep 
                    feedback={feedback}
                    onChange={setFeedback}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-purple-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            {currentStep === totalSteps - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Submit Feedback
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Next
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Step Components
interface OverallExperienceStepProps {
  value: number
  onChange: (value: number) => void
  quizTitle: string
}

function OverallExperienceStep({ value, onChange, quizTitle }: OverallExperienceStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Overall Quiz Experience</h3>
        <p className="text-gray-400">How would you rate your experience with "{quizTitle}"?</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <motion.button
            key={rating}
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              value >= rating
                ? 'bg-yellow-500 text-white scale-110'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            whileHover={{ scale: value >= rating ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Star className={`w-6 h-6 ${value >= rating ? 'fill-current' : ''}`} />
          </motion.button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400">
          {value === 0 && "Click a star to rate"}
          {value === 1 && "Poor - Needs significant improvement"}
          {value === 2 && "Fair - Some issues to address"}
          {value === 3 && "Good - Satisfactory experience"}
          {value === 4 && "Very Good - Enjoyed the quiz"}
          {value === 5 && "Excellent - Outstanding experience!"}
        </p>
      </div>
    </div>
  )
}

interface DifficultyStepProps {
  value: string
  onChange: (value: any) => void
  currentDifficulty: string
}

function DifficultyStep({ value, onChange, currentDifficulty }: DifficultyStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Difficulty Level</h3>
        <p className="text-gray-400">
          This quiz was marked as <span className="text-purple-400 font-medium capitalize">{currentDifficulty}</span>.
          How did it feel to you?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {difficultyOptions.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              value === option.value
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-gray-400">{option.description}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

interface TimeEstimationStepProps {
  value: string
  onChange: (value: any) => void
}

function TimeEstimationStep({ value, onChange }: TimeEstimationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Time Allocation</h3>
        <p className="text-gray-400">How did you find the time given for each question?</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {timeOptions.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              value === option.value
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-gray-400">{option.description}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

interface QuestionQualityStepProps {
  value: string
  onChange: (value: any) => void
}

function QuestionQualityStep({ value, onChange }: QuestionQualityStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Question Quality</h3>
        <p className="text-gray-400">How would you rate the overall quality of the questions?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {qualityOptions.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
              value === option.value
                ? 'border-green-500 bg-green-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-2">
              <span className="text-3xl">{option.icon}</span>
              <div className={`font-medium ${option.color}`}>{option.label}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

interface ContentClarityStepProps {
  value: string
  onChange: (value: any) => void
}

function ContentClarityStep({ value, onChange }: ContentClarityStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Content Clarity</h3>
        <p className="text-gray-400">How clear and understandable were the questions and explanations?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {clarityOptions.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
              value === option.value
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-2">
              <span className="text-3xl">{option.icon}</span>
              <div className={`font-medium ${option.color}`}>{option.label}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

interface ChallengingAspectsStepProps {
  values: string[]
  onChange: (value: string) => void
}

function ChallengingAspectsStep({ values, onChange }: ChallengingAspectsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Most Challenging Aspects</h3>
        <p className="text-gray-400">What aspects of the quiz did you find most challenging? (Select all that apply)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challengingAspects.map((aspect) => (
          <motion.button
            key={aspect}
            onClick={() => onChange(aspect)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              values.includes(aspect)
                ? 'border-red-500 bg-red-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              {values.includes(aspect) && <CheckCircle className="w-4 h-4 text-red-400" />}
              <span className="text-sm font-medium text-white">{aspect}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {values.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Selected {values.length} aspect{values.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

interface HelpfulFeaturesStepProps {
  values: string[]
  onChange: (value: string) => void
}

function HelpfulFeaturesStep({ values, onChange }: HelpfulFeaturesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Most Helpful Features</h3>
        <p className="text-gray-400">Which features did you find most helpful during the quiz? (Select all that apply)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {helpfulFeatures.map((feature) => (
          <motion.button
            key={feature}
            onClick={() => onChange(feature)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              values.includes(feature)
                ? 'border-green-500 bg-green-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              {values.includes(feature) && <CheckCircle className="w-4 h-4 text-green-400" />}
              <span className="text-sm font-medium text-white">{feature}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {values.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Selected {values.length} feature{values.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

interface FinalStepProps {
  feedback: QuizFeedbackData
  onChange: (feedback: QuizFeedbackData) => void
}

function FinalStep({ feedback, onChange }: FinalStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Final Thoughts</h3>
        <p className="text-gray-400">Any additional suggestions or comments?</p>
      </div>

      {/* Recommendation Question */}
      <div className="space-y-3">
        <h4 className="font-medium text-white">Would you recommend this quiz to others?</h4>
        <div className="flex gap-3">
          <motion.button
            onClick={() => onChange({ ...feedback, wouldRecommend: true })}
            className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
              feedback.wouldRecommend
                ? 'border-green-500 bg-green-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">👍</span>
              <span className="font-medium text-white">Yes, I would</span>
            </div>
          </motion.button>

          <motion.button
            onClick={() => onChange({ ...feedback, wouldRecommend: false })}
            className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
              !feedback.wouldRecommend
                ? 'border-red-500 bg-red-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">👎</span>
              <span className="font-medium text-white">No, I wouldn't</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="space-y-3">
        <h4 className="font-medium text-white">What would you like to see improved? (Optional)</h4>
        <div className="grid grid-cols-2 gap-2">
          {improvementSuggestions.map((suggestion) => (
            <motion.button
              key={suggestion}
              onClick={() => {
                const currentSuggestions = feedback.improvementSuggestions || []
                const newSuggestions = currentSuggestions.includes(suggestion)
                  ? currentSuggestions.filter(s => s !== suggestion)
                  : [...currentSuggestions, suggestion]
                onChange({ ...feedback, improvementSuggestions: newSuggestions })
              }}
              className={`p-2 rounded-lg border transition-all duration-200 text-left ${
                feedback.improvementSuggestions?.includes(suggestion)
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                {feedback.improvementSuggestions?.includes(suggestion) && (
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                )}
                <span className="text-xs font-medium text-white">{suggestion}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Additional Comments */}
      <div className="space-y-3">
        <h4 className="font-medium text-white">Additional Comments (Optional)</h4>
        <textarea
          value={feedback.additionalComments || ''}
          onChange={(e) => onChange({ ...feedback, additionalComments: e.target.value })}
          placeholder="Share any other thoughts or suggestions..."
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
          rows={3}
        />
      </div>

      {/* Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
        <h4 className="font-medium text-white mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Feedback Summary
        </h4>
        <div className="space-y-1 text-sm text-gray-400">
          <p>Overall Rating: {feedback.overallExperience}/5 stars</p>
          <p>Difficulty: {feedback.difficultyLevel.replace('_', ' ')}</p>
          <p>Time Allocation: {feedback.timeEstimation.replace('_', ' ')}</p>
          <p>Question Quality: {feedback.questionQuality}</p>
          <p>Content Clarity: {feedback.contentClarity.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  )
}
