'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  BarChart3,
  Lightbulb,
  Trophy,
  Activity
} from 'lucide-react'
import { usePerformanceRecommendationIntegration } from '@/hooks/usePerformanceRecommendationIntegration'
import { useUserStore } from '@/stores/useUserStore'
import { toast } from 'sonner'

interface IntelligentRecommendationDashboardProps {
  userId?: string
}

export function IntelligentRecommendationDashboard({ userId }: IntelligentRecommendationDashboardProps) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.id
  const [selectedTab, setSelectedTab] = useState('prioritized')

  const {
    recommendations,
    prioritizedRecommendations,
    performanceBasedRecommendations,
    trajectoryAlignedRecommendations,
    analytics,
    performanceAnalytics,
    isLoading,
    isRegenerating,
    acceptRecommendationsForWeakAreas,
    providePerformanceBasedFeedback,
    integratedInsights,
  } = usePerformanceRecommendationIntegration(targetUserId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await providePerformanceBasedFeedback(recommendationId, true)
      toast.success('Recommendation accepted and feedback provided!')
    } catch (error) {
      toast.error('Failed to accept recommendation')
    }
  }

  const handleDismissRecommendation = async (recommendationId: string) => {
    try {
      await providePerformanceBasedFeedback(recommendationId, false)
      toast.success('Recommendation dismissed with feedback')
    } catch (error) {
      toast.error('Failed to dismiss recommendation')
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-red-500'
    if (priority >= 60) return 'bg-orange-500'
    if (priority >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getUrgencyBadge = (urgency: number) => {
    if (urgency >= 80) return <Badge variant="destructive">Urgent</Badge>
    if (urgency >= 60) return <Badge variant="secondary">High</Badge>
    if (urgency >= 40) return <Badge variant="outline">Medium</Badge>
    return <Badge variant="default">Low</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header with System Intelligence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Intelligence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integratedInsights.alignmentScore.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Recommendation Alignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effectiveness</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {integratedInsights.effectivenessIndicator}
            </div>
            <p className="text-xs text-muted-foreground">
              System Performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Potential</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(integratedInsights.improvementPotential / 10)}
            </div>
            <p className="text-xs text-muted-foreground">
              Points Available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Quality</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(integratedInsights.engagementQuality.completionRate)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion Rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Actions
          </CardTitle>
          <CardDescription>
            AI-powered actions based on your performance patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={acceptRecommendationsForWeakAreas}
              disabled={isRegenerating}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Accept Focus Area Recommendations
            </Button>
            <Button 
              variant="outline"
              disabled={integratedInsights.criticalFocusAreas.length === 0}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Address Critical Areas ({integratedInsights.criticalFocusAreas.length})
            </Button>
            <Button 
              variant="outline"
              disabled={integratedInsights.velocityMatchedRecommendations === 0}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Quick Wins ({integratedInsights.velocityMatchedRecommendations})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Intelligent Recommendations Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prioritized">Prioritized</TabsTrigger>
          <TabsTrigger value="performance">Performance-Based</TabsTrigger>
          <TabsTrigger value="trajectory">Trajectory-Aligned</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="prioritized" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Priority-Scored Recommendations
              </CardTitle>
              <CardDescription>
                Recommendations ranked by backend priority scoring and urgency algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prioritizedRecommendations.slice(0, 5).map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getUrgencyBadge(rec.urgency)}
                        <Badge variant="outline">{rec.estimatedTime}min</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Priority:</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getPriorityColor(rec.priority)}`}
                            style={{ width: `${rec.priority}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{rec.priority}%</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Confidence:</span>
                        <span className="text-xs font-medium">{Math.round(rec.confidence * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptRecommendation(rec.id)}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDismissRecommendation(rec.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance-Based Recommendations
              </CardTitle>
              <CardDescription>
                Recommendations filtered based on your current performance level and weak areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceBasedRecommendations.slice(0, 5).map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{rec.metadata?.difficulty}</Badge>
                          <Badge variant="outline">{rec.type}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Priority: {rec.priority}%</div>
                        <div className="text-xs text-muted-foreground">
                          {rec.estimatedTime} minutes
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trajectory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trajectory-Aligned Recommendations
              </CardTitle>
              <CardDescription>
                Recommendations that align with your learning trajectory and performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trajectoryAlignedRecommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">
                            Urgency: {rec.urgency}%
                          </Badge>
                          <Badge variant="outline">
                            Confidence: {Math.round(rec.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recommendation Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span>{analytics?.completionRate || 0}%</span>
                  </div>
                  <Progress value={analytics?.completionRate || 0} className="mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>System Effectiveness</span>
                    <span>{analytics?.effectivenessScore || 0}%</span>
                  </div>
                  <Progress value={analytics?.effectivenessScore || 0} className="mt-1" />
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Average Response Time</span>
                    <span>{analytics?.averageResponseTime || 0}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Intelligence Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong>Critical Focus Areas:</strong>
                  <div className="mt-1 space-y-1">
                    {integratedInsights.criticalFocusAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="mr-1">
                        {area.topic || `Area ${index + 1}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-sm">
                  <strong>Velocity-Matched Recommendations:</strong>
                  <span className="ml-2 font-medium">
                    {integratedInsights.velocityMatchedRecommendations}
                  </span>
                </div>

                <div className="text-sm">
                  <strong>Engagement Quality:</strong>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Completion: {Math.round(integratedInsights.engagementQuality.completionRate)}% | 
                    Feedback: {Math.round(integratedInsights.engagementQuality.feedbackRate)}% |
                    Adaptation: {Math.round(integratedInsights.engagementQuality.adaptationRate * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      {isRegenerating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">
                Regenerating intelligent recommendations based on your latest performance...
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}