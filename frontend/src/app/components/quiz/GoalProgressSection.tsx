import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserGoalProgress } from "@/hooks/usePerformanceData";
import { motion } from "framer-motion";
import { AlertTriangle, Award, Focus, Target, TrendingUp } from "lucide-react";

export function GoalProgressSection({ userId }: { userId?: string }) {
  const { data: goalProgress, isLoading } = useUserGoalProgress(userId);

  if (isLoading || !goalProgress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      {/* Goal Progress Overview */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Target className="w-5 h-5 text-green-400" />
            <span>Goal Progress Update</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h5 className="font-medium text-white mb-1">
                  Target Score Progress
                </h5>
                <p className="text-sm text-gray-400">
                  Goal: {goalProgress.targetScore}% | Current:{" "}
                  {goalProgress.currentAverageScore}%
                </p>
                {goalProgress.adjustedProgressScore !==
                  goalProgress.currentAverageScore && (
                  <p className="text-xs text-blue-400">
                    Adjusted Score: {goalProgress.adjustedProgressScore}%
                    (weighted for weak areas)
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {goalProgress.progressPercentage}%
                </div>
                <div className="text-xs text-gray-400">Complete</div>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(goalProgress.progressPercentage, 100)}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {goalProgress.topicsAtTarget}
                </div>
                <div className="text-gray-400">Topics at Target</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {goalProgress.totalTopics}
                </div>
                <div className="text-gray-400">Total Topics</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">
                  {goalProgress.scoreGap}%
                </div>
                <div className="text-gray-400">Score Gap</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${
                    goalProgress.weeklyGoalProgress?.isOnTrack
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {goalProgress.weeklyGoalProgress?.completed || 0}
                </div>
                <div className="text-gray-400">Weekly Quizzes</div>
              </div>
            </div>

            {/* Progress Changes */}
            {(goalProgress.recentlyImprovedCount > 0 ||
              goalProgress.newlyWeakCount > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between text-sm">
                  {goalProgress.recentlyImprovedCount > 0 && (
                    <div className="flex items-center space-x-2 text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {goalProgress.recentlyImprovedCount} areas improved!
                      </span>
                    </div>
                  )}
                  {goalProgress.newlyWeakCount > 0 && (
                    <div className="flex items-center space-x-2 text-orange-400">
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
                  <span>Currently Improving</span>
                </h6>
                <div className="space-y-2">
                  {goalProgress.improvingTopics
                    .slice(0, 5)
                    .map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span className="text-gray-300">{area}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Improvement Rate */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Overall Improvement Rate:</span>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-bold text-green-400">
                  {goalProgress.improvementRate || 0}%
                </div>
                <Badge variant="outline" className="text-green-400">
                  {goalProgress.topicsAtTarget} / {goalProgress.totalTopics}{" "}
                  topics at target
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
