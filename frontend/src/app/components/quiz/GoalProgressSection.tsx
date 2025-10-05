import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserGoalProgress } from "@/hooks/usePerformanceData";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Focus,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Star,
} from "lucide-react";

export function GoalProgressSection({ userId }: { userId?: string }) {
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
  const actualScoreGap = Math.max(0, goalProgress.targetScore - goalProgress.currentAverageScore);
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
      {/* Enhanced Goal Progress Overview */}
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
          {/* Main Progress Display */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <h5 className="text-xl font-bold text-white">
                  Target: {goalProgress.targetScore}%
                </h5>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-400">
                    Current Average:{" "}
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
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">
                    Progress to Target:
                  </span>
                  <span
                    className={`font-bold ${
                      progressToTarget >= 80
                        ? "text-green-400"
                        : progressToTarget >= 60
                        ? "text-yellow-400"
                        : "text-orange-400"
                    }`}
                  >
                    {Math.round(progressToTarget)}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400 mb-1">
                  {Math.round(progressToTarget)}%
                </div>
                <div className="text-sm text-gray-400">Progress to Target</div>
                {actualScoreGap > 0 && (
                  <div className="text-xs text-orange-400 mt-1">
                    {actualScoreGap}% gap remaining
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Current: {goalProgress.currentAverageScore}%</span>
                <span>Progress: {Math.round(progressToTarget)}%</span>
                <span>Target: {goalProgress.targetScore}%</span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-1000 relative"
                    style={{
                      width: `${Math.min(
                        progressToTarget,
                        100
                      )}%`,
                    }}
                  >
                    <div className="absolute right-0 top-0 h-full w-1 bg-white/30 rounded-r-full"></div>
                  </div>
                </div>
                {/* Target line indicator at 100% since we're showing progress TO target */}
                <div
                  className="absolute top-0 h-4 w-0.5 bg-yellow-400 right-0"
                >
                  <div className="absolute -top-1 -right-1 w-4 h-6 flex items-center justify-center">
                    <Star className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-400 mr-1" />
                  <span className="text-lg font-bold text-blue-400">
                    {goalProgress.topicsAtTarget}
                  </span>
                </div>
                <div className="text-gray-400">Topics at {goalProgress.targetScore}%</div>
                <div className="text-xs text-gray-500">
                  {goalProgress.totalTopics - goalProgress.topicsAtTarget} still need work
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mr-1" />
                  <span className="text-lg font-bold text-orange-400">
                    {goalProgress.weakAreasCount || 0}
                  </span>
                </div>
                <div className="text-gray-400">Below Target</div>
                <div className="text-xs text-gray-500">topics under {goalProgress.targetScore}%</div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-4 h-4 text-purple-400 mr-1" />
                  <span
                    className={`text-lg font-bold ${
                      weeklyProgress.isOnTrack
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {weeklyProgress.completed}
                  </span>
                </div>
                <div className="text-gray-400">Quizzes This Week</div>
                <div className="text-xs text-gray-500">
                  {weeklyProgress.isOnTrack 
                    ? `Goal achieved! (${weeklyProgress.target} target)`
                    : `${weeklyProgress.target - weeklyProgress.completed} more needed`
                  }
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-lg font-bold text-green-400">
                    {goalProgress.improvementRate || 0}%
                  </span>
                </div>
                <div className="text-gray-400">Success Rate</div>
                <div className="text-xs text-gray-500">topics meeting target</div>
              </div>
            </div>

            {/* Weekly Progress Bar */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Weekly Goal Progress
                </span>
                <span className="text-sm font-semibold text-white">
                  {weeklyProgress.completed} / {weeklyProgress.target} quizzes
                </span>
              </div>
              <Progress value={weeklyProgressPercentage} className="h-2" />
            </div>

            {/* Recent Changes Alert */}
            {(goalProgress.recentlyImprovedCount > 0 ||
              goalProgress.newlyWeakCount > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {goalProgress.recentlyImprovedCount > 0 && (
                    <div className="flex items-center space-x-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {goalProgress.recentlyImprovedCount} areas improved!
                      </span>
                    </div>
                  )}
                  {goalProgress.newlyWeakCount > 0 && (
                    <div className="flex items-center space-x-2 text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        {goalProgress.newlyWeakCount} new areas need focus
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">
                  Learning Efficiency
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(
                  (goalProgress.topicsAtTarget /
                    Math.max(goalProgress.totalTopics, 1)) *
                    100
                )}
                %
              </div>
              <div className="text-xs text-gray-400">
                Topics mastered vs studied
              </div>
            </div>

            <div className="bg-gray-700/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  Focus Impact
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {goalProgress.recentlyImprovedCount || 0}
              </div>
              <div className="text-xs text-gray-400">
                Areas recently improved
              </div>
            </div>

            <div className="bg-gray-700/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  Time to Goal
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {goalProgress.scoreGap > 0
                  ? Math.ceil(goalProgress.scoreGap / 5)
                  : 0}
              </div>
              <div className="text-xs text-gray-400">
                Estimated weeks at current pace
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus Area Progress */}
      {goalProgress.focusAreaProgress &&
        goalProgress.focusAreaProgress.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Focus className="w-5 h-5 text-purple-400" />
                <span>Focus Area Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goalProgress.focusAreaProgress.map((area, index) => (
                  <div key={index} className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-white">{area.area}</h6>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={
                            area.isOnTrack
                              ? "text-green-400 border-green-400"
                              : "text-orange-400 border-orange-400"
                          }
                        >
                          {area.isOnTrack ? "On Track" : "Needs Focus"}
                        </Badge>
                        {area.trend !== "stable" && (
                          <Badge
                            variant="outline"
                            className={
                              area.trend === "improving"
                                ? "text-blue-400 border-blue-400"
                                : "text-red-400 border-red-400"
                            }
                          >
                            {area.trend}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">
                        Current: {area.currentScore}% | Target:{" "}
                        {area.targetScore}%
                      </span>
                      <span className="text-gray-500">
                        {area.topicsInArea} topics ({area.weakTopicsInArea}{" "}
                        weak)
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          area.isOnTrack ? "bg-green-500" : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (area.currentScore / area.targetScore) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Dynamic Weak Areas Management */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span>Dynamic Weak Area Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Weak Areas */}
            {goalProgress.weakAreas?.length > 0 && (
              <div>
                <h6 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>
                    Current Weak Areas ({goalProgress.weakAreas.length})
                  </span>
                </h6>
                <div className="space-y-2">
                  {goalProgress.weakAreas.slice(0, 5).map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <div className="w-2 h-2 bg-orange-400 rounded-full" />
                      <span className="text-gray-300">{area}</span>
                      {goalProgress.newlyWeakAreas?.includes(area) && (
                        <Badge
                          variant="outline"
                          className="text-red-400 border-red-400 text-xs"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Improved Areas */}
            {goalProgress.recentlyImprovedAreas?.length > 0 && (
              <div>
                <h6 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-green-400" />
                  <span>Recently Improved Areas</span>
                </h6>
                <div className="space-y-2">
                  {goalProgress.recentlyImprovedAreas
                    .slice(0, 5)
                    .map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-gray-300">{area}</span>
                        <Badge
                          variant="outline"
                          className="text-green-400 border-green-400 text-xs"
                        >
                          Improved!
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Improving Topics */}
            {goalProgress.improvingTopics?.length > 0 && (
              <div>
                <h6 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>
                    Currently Improving ({goalProgress.improvingTopics.length})
                  </span>
                </h6>
                <div className="space-y-2">
                  {goalProgress.improvingTopics
                    .slice(0, 5)
                    .map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-blue-400/10 p-2 rounded text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span className="text-gray-300">{area}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-blue-400 border-blue-400 text-xs"
                        >
                          Trending Up
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Declining Topics */}
            {goalProgress.decliningTopics?.length > 0 && (
              <div>
                <h6 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span>
                    Needs Attention ({goalProgress.decliningTopics.length})
                  </span>
                </h6>
                <div className="space-y-2">
                  {goalProgress.decliningTopics
                    .slice(0, 5)
                    .map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-red-400/10 p-2 rounded text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full" />
                          <span className="text-gray-300">{area}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-red-400 border-red-400 text-xs"
                        >
                          Declining
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Summary */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    Overall Improvement Rate:
                  </span>
                  <div className="text-lg font-bold text-green-400">
                    {goalProgress.improvementRate || 0}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Topics at Target:</span>
                  <Badge
                    variant="outline"
                    className="text-green-400 border-green-400"
                  >
                    {goalProgress.topicsAtTarget} / {goalProgress.totalTopics}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Strong Areas:</span>
                  <div className="text-lg font-bold text-blue-400">
                    {goalProgress.strongAreasCount || 0}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Areas to Focus:</span>
                  <div className="text-lg font-bold text-orange-400">
                    {goalProgress.weakAreasCount || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Items */}
            {(goalProgress.weakAreasCount > 0 || goalProgress.scoreGap > 0) && (
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                <h6 className="font-medium text-blue-400 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Next Steps to Reach Your Goal
                </h6>
                <div className="space-y-1 text-sm text-gray-300">
                  {goalProgress.scoreGap > 0 && (
                    <div>
                      • Focus on improving your average score by{" "}
                      {goalProgress.scoreGap}%
                    </div>
                  )}
                  {goalProgress.weakAreasCount > 0 && (
                    <div>
                      • Practice the {goalProgress.weakAreasCount} weak areas
                      identified above
                    </div>
                  )}
                  {!weeklyProgress.isOnTrack && (
                    <div>
                      • Complete{" "}
                      {weeklyProgress.target - weeklyProgress.completed} more
                      quizzes this week
                    </div>
                  )}
                  {goalProgress.decliningTopics?.length > 0 && (
                    <div>
                      • Review {goalProgress.decliningTopics.length} topics
                      showing declining performance
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
