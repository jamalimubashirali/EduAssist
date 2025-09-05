'use client'

import React from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Zap, Target, Rocket } from 'lucide-react'

export function CompletionStep() {
  const { user } = useUserStore()
  const { handleNext, isLoading } = useOnboardingNavigation({
    currentStep: 'completion-summary',
    isFinalStep: true,
  })

  const results = user?.onboarding?.assessment_results

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      {/* Success Animation */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Trophy className="w-4 h-4 text-yellow-800" />
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        You're All Set! 🎉
      </h2>
      
      <p className="text-gray-600 text-lg">
        Your personalized learning journey is ready to begin!
      </p>

      {/* Achievement Summary */}
      {results && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Your Starting Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  Level {results.level_achieved}
                </div>
                <p className="text-xs text-gray-600">Starting Level</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.xp_earned} XP
                </div>
                <p className="text-xs text-gray-600">Points Earned</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {results.overall_score}%
                </div>
                <p className="text-xs text-gray-600">Assessment Score</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {results.overall_proficiency} LEARNER
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What's Next */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center justify-center space-x-2">
            <Target className="w-5 h-5" />
            <span>What's Next?</span>
          </h3>
          <div className="space-y-3 text-sm text-left">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <span>Explore your personalized dashboard</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">2</span>
              </div>
              <span>Start with recommended practice questions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">3</span>
              </div>
              <span>Track your progress and earn rewards</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="pt-6">
        <Button
          onClick={() => handleNext({})}
          disabled={isLoading}
          size="lg"
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Setting up your account...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Start Learning Journey</span>
            </div>
          )}
        </Button>
      </div>      
      <p className="text-xs text-gray-500">
        Your assessment results and personalized recommendations will be available in your dashboard
      </p>
    </div>
  )
}

export default CompletionStep