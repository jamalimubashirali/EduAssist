'use client'

import React from 'react'
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation'
import { useAssessmentResultsStore } from '@/stores/assessmentResultsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Star, 
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react'

export function ResultsStep() {
  const { results } = useAssessmentResultsStore();
  const { handleNext, isLoading , } = useOnboardingNavigation({
    currentStep: 'onboarding-assessment-results',
    nextStep : 'completion-summary'
  });
  
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <AlertCircle className="w-16 h-16 text-yellow-500" />
        <h3 className="text-lg font-semibold">No Results Available</h3>
        <p className="text-gray-600 text-center max-w-md">
          It looks like the assessment hasn't been completed yet. Please go back and complete the assessment.
        </p>
      </div>
    )
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'ADVANCED': return 'bg-green-500'
      case 'INTERMEDIATE': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  const getProficiencyTextColor = (level: string) => {
    switch (level) {
      case 'ADVANCED': return 'text-green-600'
      case 'INTERMEDIATE': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Congratulations Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Trophy className="w-16 h-16 text-yellow-500" />
            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              ✓
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold">Assessment Complete!</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Great job! You've completed your knowledge assessment. Here's your personalized learning profile 
          and recommendations to help you succeed.
        </p>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {results.overall_score}%
              </div>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                +{results.xp_earned}
              </div>
              <p className="text-sm text-gray-600">XP Earned</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                Level {results.level_achieved}
              </div>
              <p className="text-sm text-gray-600">Starting Level</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Badge 
              className={`${getProficiencyColor(results.overall_proficiency)} text-white px-4 py-2 text-sm`}
            >
              {results.overall_proficiency} LEVEL
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subject Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Subject Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.subject_analysis.map((subject, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{subject.subject_name}</h4>
                  <Badge 
                    variant="outline" 
                    className={getProficiencyTextColor(subject.proficiency_level)}
                  >
                    {subject.proficiency_level}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{subject.score_percentage}%</div>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
              
              <Progress value={subject.score_percentage} className="mb-3" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-600 mb-1">Strong Areas:</p>
                  <ul className="space-y-1">
                    {subject.strong_topics.map((topic: string, idx: number) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-orange-600 mb-1">Focus Areas:</p>
                  <ul className="space-y-1">
                    {subject.weak_topics.map((topic: string, idx: number) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <Target className="w-3 h-3 text-orange-500" />
                        <span className="text-xs">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Topic-Level Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Topic-Level Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Strong Topics</h4>
              <ul className="space-y-1">
                {results.subject_analysis.flatMap(subject => subject.strong_topics).length === 0 ? (
                  <li className="text-xs text-gray-400">No strong topics identified yet.</li>
                ) : (
                  results.subject_analysis.flatMap(subject => subject.strong_topics).map((topic: string, idx: number) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs">{topic}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-600 mb-2">Weak Topics</h4>
              <ul className="space-y-1">
                {results.subject_analysis.flatMap(subject => subject.weak_topics).length === 0 ? (
                  <li className="text-xs text-gray-400">No weak topics identified yet.</li>
                ) : (
                  results.subject_analysis.flatMap(subject => subject.weak_topics).map((topic: string, idx: number) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <Target className="w-3 h-3 text-orange-500" />
                      <span className="text-xs">{topic}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Your Personalized Learning Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Study Plan */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Recommended Study Plan</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.recommendations.study_plan.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <h4 className="font-semibold mb-3">Priority Focus Areas</h4>
            <div className="flex flex-wrap gap-2">
              {results.recommendations.focus_areas.map((area: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          {/* Priority Subjects */}
          <div>
            <h4 className="font-semibold mb-3">Priority Subjects</h4>
            <div className="flex flex-wrap gap-2">
              {results.recommendations.priority_subjects.map((subject: string, index: number) => (
                <Badge key={index} variant="outline" className="border-orange-500 text-orange-600">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          {/* Comprehensive Recommendations */}
          {results.comprehensive_recommendations && (
            <>
              {/* Performance Insights */}
              <div>
                <h4 className="font-semibold mb-3">Performance Insights</h4>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {results.comprehensive_recommendations.performance_insights?.overall_performance}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="font-medium">Accuracy Rate:</span>
                      <div className="text-lg font-bold text-green-600">
                        {results.comprehensive_recommendations.performance_insights?.accuracy_rate}%
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Improvement Potential:</span>
                      <div className="text-lg font-bold text-orange-600">
                        +{results.comprehensive_recommendations.performance_insights?.improvement_potential}%
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Next Target:</span>
                      <div className="text-lg font-bold text-blue-600">
                        {results.comprehensive_recommendations.performance_insights?.next_level_target}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Path */}
              {results.comprehensive_recommendations.learning_path && (
                <div>
                  <h4 className="font-semibold mb-3">Learning Path</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-blue-600">
                        {results.comprehensive_recommendations.learning_path.current_level}
                      </Badge>
                      <span className="text-sm text-gray-600">Current Level</span>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Recommended Next Steps:</h5>
                      <ul className="space-y-1">
                        {results.comprehensive_recommendations.learning_path.recommended_next_steps?.map((step: string, index: number) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Study Strategy */}
              {results.comprehensive_recommendations.study_strategy && (
                <div>
                  <h4 className="font-semibold mb-3">Study Strategy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Recommended Strategies:</h5>
                      <ul className="space-y-1">
                        {results.comprehensive_recommendations.study_strategy.recommended_strategies?.map((strategy: string, index: number) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <Target className="w-3 h-3 text-blue-500" />
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Motivation Tips:</h5>
                      <ul className="space-y-1">
                        {results.comprehensive_recommendations.study_strategy.motivation_tips?.map((tip: string, index: number) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Improvement Areas */}
              {results.comprehensive_recommendations.improvement_areas && (
                <div>
                  <h4 className="font-semibold mb-3">Priority Improvement Areas</h4>
                  <div className="space-y-3">
                    {results.comprehensive_recommendations.improvement_areas.priority_subjects?.map((subject: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">{subject.subject_name}</h5>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Current: {subject.current_score}%</div>
                            <div className="text-sm text-green-600">Target: {subject.target_score}%</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {subject.improvement_plan?.map((plan: string, planIndex: number) => (
                            <div key={planIndex} className="flex items-center space-x-2 text-xs">
                              <AlertCircle className="w-3 h-3 text-orange-500" />
                              <span>{plan}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Daily Practice Recommendation */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Daily Practice Goal</h4>
            <p className="text-sm text-gray-600">
              We recommend practicing <strong>{results.recommendations.recommended_daily_questions} questions per day</strong> to
              achieve optimal learning progress based on your current proficiency level.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="text-center">
        <Button 
          onClick={() => handleNext({})}
          disabled={isLoading}
          size="lg"
          className="px-8 cursor-pointer"
        >
          {isLoading ? 'Navigating...' : 'Complete Onboarding'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Your results and recommendations will be saved to your profile
        </p>      </div>
    </div>
  )
}

export default ResultsStep;