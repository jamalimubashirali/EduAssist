import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserGoalProgress } from "@/hooks/usePerformanceData";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Brain,
  Star,
  Award,
} from "lucide-react";

export function GoalProgressWidget({ userId }: { userId?: string }) {
  const { data: goalProgress, isLoading } = useUserGoalProgress(userId);

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading goal progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goalProgress) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No goal progress data available yet.</p>
            <p className="text-sm">
              Complete more quizzes to see your progress!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate CORRECT metrics for enhanced display
  const progressToTarget = Math.min(
    100,
    (goalProgress.currentAverageScore / goalProgress.targetScore) * 100
  );
  const actualScoreGap = Math.max(
    0,
    goalProgress.targetScore - goalProgress.currentAverageScore
  );
  const isOnTrackOverall = progressToTarget >= 60; // 60% of target is considered on track
  const weeklyProgress = goalProgress.weeklyGoalProgress || {
    target: 5,
    completed: 0,
    isOnTrack: false,
  };
  const weeklyProgressPercentage = Math.min(
    100,
    (weeklyProgress.completed / weeklyProgress.target) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      {/* Main Goal Progress Card */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-400" />
              <span>Goal Progress</span>
            </div>
            <Badge
              variant="outline"
              className={`${
                isOnTrackOverall
                  ? "text-green-400 border-green-400"
                  : "text-orange-400 border-orange-400"
              }`}
            >
              {isOnTrackOverall ? "On Track" : "Needs Focus"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Compact Progress Display */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h5 className="text-lg font-bold text-white">
                  Target: {goalProgress.targetScore}%
                </h5>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-400">
                    Current:{" "}
                    <span className="text-white font-semibold">
                      {goalProgress.currentAverageScore}%
                    </span>
                  </span>
                  {goalProgress.adjustedProgressScore !==
                    goalProgress.currentAverageScore && (
                    <span className="text-blue-400">
                      Adjusted:{" "}
                      <span className="font-semibold">
                        {goalProgress.adjustedProgressScore}%
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {Math.round(progressToTarget)}%
                </div>
                <div className="text-xs text-gray-400">Progress to Target</div>
                {actualScoreGap > 0 && (
                  <div className="text-xs text-orange-400 mt-1">
                    {actualScoreGap}% gap remaining
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000 relative"
                    style={{
                      width: `${Math.min(progressToTarget, 100)}%`,
                    }}
                  >
                    <div className="absolute right-0 top-0 h-full w-1 bg-white/30 rounded-r-full"></div>
                  </div>
                </div>
                {/* Target line indicator at 100% since we're showing progress TO target */}
                <div className="absolute top-0 h-3 w-0.5 bg-yellow-400 right-0">
                  <div className="absolute -top-1 -right-1 w-3 h-5 flex items-center justify-center">
                    <Star className="w-2 h-2 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Metrics Grid */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-700/30 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-3 h-3 text-blue-400 mr-1" />
                  <span className="font-bold text-blue-400">
                    {goalProgress.topicsAtTarget}
                  </span>
                </div>
                <div className="text-gray-400">At Target</div>
              </div>

              <div className="bg-gray-700/30 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <AlertTriangle className="w-3 h-3 text-orange-400 mr-1" />
                  <span className="font-bold text-orange-400">
                    {goalProgress.weakAreasCount || 0}
                  </span>
                </div>
                <div className="text-gray-400">Need Focus</div>
              </div>

              <div className="bg-gray-700/30 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-3 h-3 text-purple-400 mr-1" />
                  <span
                    className={`font-bold ${
                      weeklyProgress.isOnTrack
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {weeklyProgress.completed}
                  </span>
                </div>
                <div className="text-gray-400">This Week</div>
              </div>

              <div className="bg-gray-700/30 p-2 rounded text-center">
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="w-3 h-3 text-green-400 mr-1" />
                  <span className="font-bold text-green-400">
                    {goalProgress.improvementRate || 0}%
                  </span>
                </div>
                <div className="text-gray-400">Improvement</div>
              </div>
            </div>

            {/* Weekly Progress Bar */}
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Weekly Goal</span>
                <span className="text-xs font-semibold text-white">
                  {weeklyProgress.completed} / {weeklyProgress.target}
                </span>
              </div>
              <Progress value={weeklyProgressPercentage} className="h-1.5" />
            </div>

            {/* Recent Changes Alert */}
            {(goalProgress.recentlyImprovedCount > 0 ||
              goalProgress.newlyWeakCount > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {goalProgress.recentlyImprovedCount > 0 && (
                    <div className="flex items-center space-x-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      <span>
                        {goalProgress.recentlyImprovedCount} improved!
                      </span>
                    </div>
                  )}
                  {goalProgress.newlyWeakCount > 0 && (
                    <div className="flex items-center space-x-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{goalProgress.newlyWeakCount} need focus</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Concrete Topic Breakdown */}
          <div className="space-y-3">
            {/* Topics at Target - Show actual topic names */}
            {goalProgress.strongAreas &&
              goalProgress.strongAreas.length > 0 && (
                <div className="bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">
                        Topics at Target ({goalProgress.topicsAtTarget})
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-400 text-xs"
                    >
                      {goalProgress.targetScore}%+ achieved
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {goalProgress.strongAreas
                      .slice(0, 6)
                      .map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-400/20 text-green-300 rounded-full text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    {goalProgress.strongAreas.length > 6 && (
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs">
                        +{goalProgress.strongAreas.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Weekly Progress - Show actual quiz names/subjects */}
            <div className="bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">
                    Weekly Progress: {weeklyProgress.completed} /{" "}
                    {weeklyProgress.target} quizzes
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    weeklyProgress.isOnTrack
                      ? "text-green-400 border-green-400"
                      : "text-orange-400 border-orange-400"
                  }`}
                >
                  {weeklyProgress.isOnTrack ? "On Track" : "Behind"}
                </Badge>
              </div>
              <Progress value={weeklyProgressPercentage} className="h-2 mb-2" />
              <div className="text-xs text-gray-400">
                {weeklyProgress.isOnTrack
                  ? `Great job! You're meeting your weekly goal.`
                  : `${
                      weeklyProgress.target - weeklyProgress.completed
                    } more quizzes needed this week.`}
              </div>
            </div>

            {/* Learning Efficiency with concrete details */}
            <div className="bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">
                    Learning Efficiency
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {Math.round(
                    (goalProgress.topicsAtTarget /
                      Math.max(goalProgress.totalTopics, 1)) *
                      100
                  )}
                  %
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {goalProgress.topicsAtTarget} of {goalProgress.totalTopics}{" "}
                topics mastered (
                {goalProgress.totalTopics - goalProgress.topicsAtTarget} still
                need work)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Topic Analysis */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span>Topic Analysis & Focus Areas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Weak Areas - Show actual topic names with context */}
            {goalProgress.weakAreas?.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-white mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>Topics Needing Focus</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-orange-400 border-orange-400"
                  >
                    {goalProgress.weakAreas.length} topics below{" "}
                    {goalProgress.targetScore}%
                  </Badge>
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {goalProgress.weakAreas.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-orange-400/10 p-3 rounded-lg border border-orange-400/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-400 rounded-full" />
                        <div>
                          <span className="text-white font-medium text-sm">
                            {area}
                          </span>
                          <div className="text-xs text-gray-400">
                            Below {goalProgress.targetScore}% target
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {goalProgress.newlyWeakAreas?.includes(area) && (
                          <Badge
                            variant="outline"
                            className="text-red-400 border-red-400 text-xs"
                          >
                            New Issue
                          </Badge>
                        )}
                        <button className="text-orange-400 hover:text-orange-300 text-xs underline">
                          Practice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  💡 Focus on these topics to improve your overall average from{" "}
                  {goalProgress.currentAverageScore}% to{" "}
                  {goalProgress.targetScore}%
                </div>
              </div>
            )}

            {/* Improving Topics - Show actual progress */}
            {goalProgress.improvingTopics?.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-white mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span>Topics Showing Improvement</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-blue-400 border-blue-400"
                  >
                    {goalProgress.improvingTopics.length} trending up
                  </Badge>
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {goalProgress.improvingTopics.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-blue-400/10 p-3 rounded-lg border border-blue-400/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        <div>
                          <span className="text-white font-medium text-sm">
                            {area}
                          </span>
                          <div className="text-xs text-gray-400">
                            Performance trending upward
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-blue-400 border-blue-400 text-xs"
                      >
                        Improving
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  🎉 Keep up the great work on these topics!
                </div>
              </div>
            )}

            {/* Recently Improved Areas - Show success stories */}
            {goalProgress.recentlyImprovedAreas?.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-white mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-green-400" />
                    <span>Recently Mastered Topics</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-green-400 border-green-400"
                  >
                    {goalProgress.recentlyImprovedAreas.length} moved to target
                  </Badge>
                </h6>
                <div className="flex flex-wrap gap-2">
                  {goalProgress.recentlyImprovedAreas.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-white font-medium text-sm">
                        {area}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-green-400 border-green-400 text-xs"
                      >
                        ✓ Mastered
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  🏆 These topics moved from weak areas to meeting your{" "}
                  {goalProgress.targetScore}% target!
                </div>
              </div>
            )}

            {/* Declining Topics - Show areas that need attention */}
            {goalProgress.decliningTopics?.length > 0 && (
              <div>
                <h6 className="text-sm font-medium text-white mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span>Topics Needing Review</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-red-400 border-red-400"
                  >
                    {goalProgress.decliningTopics.length} declining
                  </Badge>
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {goalProgress.decliningTopics.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full" />
                        <div>
                          <span className="text-white font-medium text-sm">
                            {area}
                          </span>
                          <div className="text-xs text-gray-400">
                            Performance declining - needs review
                          </div>
                        </div>
                      </div>
                      <button className="text-red-400 hover:text-red-300 text-xs underline">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  ⚠️ These topics may need a refresher to maintain your progress
                </div>
              </div>
            )}

            {/* Concrete Action Plan */}
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-400/20">
              <h6 className="text-sm font-medium text-blue-400 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Your Personalized Action Plan
              </h6>
              <div className="space-y-2 text-sm text-gray-300">
                {goalProgress.scoreGap > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <strong>Goal:</strong> Improve your average from{" "}
                      {goalProgress.currentAverageScore}% to{" "}
                      {goalProgress.targetScore}% (need{" "}
                      {Math.floor(goalProgress.scoreGap)}% improvement)
                    </div>
                  </div>
                )}
                {goalProgress.weakAreas?.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2"></div>
                    <div>
                      <strong>Priority:</strong> Focus on{" "}
                      {goalProgress.weakAreas.slice(0, 3).join(", ")}
                      {goalProgress.weakAreas.length > 3 &&
                        ` and ${
                          goalProgress.weakAreas.length - 3
                        } other topics`}
                    </div>
                  </div>
                )}
                {!weeklyProgress.isOnTrack && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                    <div>
                      <strong>This Week:</strong> Complete{" "}
                      {weeklyProgress.target - weeklyProgress.completed} more
                      quizzes to stay on track with your weekly goal
                    </div>
                  </div>
                )}
                {goalProgress.recentlyImprovedAreas?.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                    <div>
                      <strong>Keep Going:</strong> You've mastered{" "}
                      {goalProgress.recentlyImprovedAreas.join(", ")} - maintain
                      this momentum!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
