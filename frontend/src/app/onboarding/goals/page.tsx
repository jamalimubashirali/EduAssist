'use client'

import React, { useState, useEffect } from 'react'
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation'
import { useUserStore } from '@/stores/useUserStore'
import { motion } from 'framer-motion'
import { Target, Clock, Brain, Award, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

const FOCUS_AREAS = [
  { id: 'exam_prep', label: 'Exam Preparation', icon: '📝', description: 'Get ready for upcoming tests and exams' },
  { id: 'skill_building', label: 'Skill Building', icon: '🛠️', description: 'Develop specific academic skills' },
  { id: 'homework_help', label: 'Homework Help', icon: '📚', description: 'Support with daily assignments' },
  { id: 'concept_mastery', label: 'Concept Mastery', icon: '🧠', description: 'Deep understanding of key topics' },
  { id: 'grade_improvement', label: 'Grade Improvement', icon: '📈', description: 'Boost overall academic performance' },
  { id: 'competition_prep', label: 'Competition Prep', icon: '🏆', description: 'Prepare for academic competitions' }
]

const STUDY_TIME_OPTIONS = [
  { value: 1, label: '1 hour per week', description: 'Light practice' },
  { value: 3, label: '3 hours per week', description: 'Regular study' },
  { value: 5, label: '5 hours per week', description: 'Focused learning' },
  { value: 10, label: '10+ hours per week', description: 'Intensive preparation' }
]

const TARGET_SCORE_RANGES = [
  { min: 60, max: 70, label: 'Pass (60-70%)', color: 'text-blue-400' },
  { min: 70, max: 80, label: 'Good (70-80%)', color: 'text-green-400' },
  { min: 80, max: 90, label: 'Great (80-90%)', color: 'text-yellow-400' },
  { min: 90, max: 100, label: 'Excellent (90-100%)', color: 'text-purple-400' }
]

export function GoalsStep() {
  const { handleNext, isLoading } = useOnboardingNavigation({
    currentStep: 'goals',
    nextStep: 'assessment',
  });
  const { user } = useUserStore();

  const [targetScore, setTargetScore] = useState(user?.onboarding?.goals?.target_score || 80)
  const [studyHours, setStudyHours] = useState(user?.onboarding?.goals?.weekly_study_hours || 3)
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(
    user?.onboarding?.goals?.focus_areas || []
  )
  const [customGoal, setCustomGoal] = useState(user?.onboarding?.goals?.custom_goal || '')
  const [isValid, setIsValid] = useState(false)

  // Update validation
  useEffect(() => {
    setIsValid(selectedFocusAreas.length > 0)
  }, [selectedFocusAreas])

  const onContinue = () => {
    if (isValid) {
      const goalsData = {
        goals: {
          target_score: targetScore,
          weekly_study_hours: studyHours,
          focus_areas: selectedFocusAreas,
          custom_goal: customGoal.trim(),
        }
      };
      handleNext(goalsData);
    }
  };

  const toggleFocusArea = (areaId: string) => {
    setSelectedFocusAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const getScoreRange = (score: number) => {
    return TARGET_SCORE_RANGES.find(range => score >= range.min && score <= range.max) || TARGET_SCORE_RANGES[0]
  }

  const getStudyTimeOption = (hours: number) => {
    return STUDY_TIME_OPTIONS.find(option => option.value >= hours) || STUDY_TIME_OPTIONS[3]
  };  
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-white">Set Your Learning Goals</h2>
        <p className="text-gray-400">
          Help us create a personalized study plan that fits your ambitions
        </p>
      </motion.div>

      {/* Target Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Target className="w-5 h-5" />
              <span>Target Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300 mb-3 block">
                What's your target score percentage?
              </Label>
              <div className="space-y-4">
                <Slider
                  value={[targetScore]}
                  onValueChange={(value) => setTargetScore(value[0])}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">50%</span>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreRange(targetScore).color}`}>
                      {targetScore}%
                    </div>
                    <div className={`text-sm ${getScoreRange(targetScore).color}`}>
                      {getScoreRange(targetScore).label}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Study Time Commitment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Clock className="w-5 h-5" />
              <span>Study Time Commitment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STUDY_TIME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={studyHours === option.value ? "default" : "outline"}
                  className={`p-4 h-auto text-left ${
                    studyHours === option.value
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600'
                  }`}
                  onClick={() => setStudyHours(option.value)}
                >
                  <div className="space-y-1">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm opacity-80">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-blue-400 font-semibold">
                    {getStudyTimeOption(studyHours).label}
                  </p>
                  <p className="text-sm text-gray-400">
                    We'll create a schedule that fits this commitment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Focus Areas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Brain className="w-5 h-5" />
              <span>Focus Areas</span>
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Select what you want to focus on (choose at least one)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FOCUS_AREAS.map((area) => {
                const isSelected = selectedFocusAreas.includes(area.id)
                
                return (
                  <Card
                    key={area.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'bg-purple-900/30 border-purple-500'
                        : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                    }`}
                    onClick={() => toggleFocusArea(area.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{area.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white">{area.label}</h3>
                            {isSelected && (
                              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {area.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom Goal
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Award className="w-5 h-5" />
              <span>Additional Goals (Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Any specific goals or areas you'd like to work on?"
              value={customGoal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomGoal(e.target.value)}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-2">
              e.g., "Improve my algebra skills for the SAT" or "Master chemistry equations"
            </p>
          </CardContent>
        </Card>
      </motion.div> */}

      {/* Summary & Continue Button */}
      <motion.div
        className="text-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {isValid ? (
          <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Your Learning Plan Preview
                  </h3>
                  <div className="space-y-1 text-sm text-gray-300 text-left">
                    <p>• Target Performance: <span className="text-green-400 font-semibold">{targetScore}%</span></p>
                    <p>• Study Time: <span className="text-blue-400 font-semibold">{studyHours} hours/week</span></p>
                    <p>• Focus Areas: <span className="text-purple-400 font-semibold">{selectedFocusAreas.length} selected</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-yellow-400 mb-4">
            Please select at least one focus area to continue.
          </p>
        )}
        <Button
          onClick={onContinue}
          disabled={!isValid || isLoading}
          size="lg"
          className="w-full max-w-xs mx-auto bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? 'Saving...' : 'Continue to Assessment'}
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Next, we'll assess your current knowledge to create your personalized study plan.
        </p>
      </motion.div>
    </div>
  )
}

export default GoalsStep
