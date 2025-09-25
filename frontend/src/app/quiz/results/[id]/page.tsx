"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { useXP } from "@/hooks/useXP";
import { useGamificationStore } from "@/stores/useGamificationStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import GameLayout from "@/app/components/layout/GameLayout";
import { useUpdateUserXP, useUpdateUserStreak } from "@/hooks/useUserData";
import { recommendationService } from "@/services/recommendationService";
import { performanceService } from "@/services/performanceService";
import { attemptService } from "@/services/attemptService";
import {
  Trophy,
  Star,
  Target,
  Clock,
  Zap,
  TrendingUp,
  RotateCcw,
  Home,
  Share2,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { useAttempt } from "@/hooks/useAttemptData";
import { useQuiz } from "@/hooks/useQuizData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GoalProgressSection } from "@/app/components/quiz/GoalProgressSection";
import { EnhancedRecommendationsSection } from "@/app/components/quiz/EnhancedRecommendations";

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUserStore();
  const { simulateXPGain } = useXP();
  const { addBadge: unlockBadge } = useGamificationStore();
  const { addNotification } = useNotificationStore();
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const updateUserXP = useUpdateUserXP();
  const updateUserStreak = useUpdateUserStreak();
  const animationRanRef = useRef<string | null>(null);
  const gamificationAppliedRef = useRef<string | null>(null);

  const quizId = params.id as string;

  const attemptId = params.id as string;
  const { data: attempt, isLoading, error } = useAttempt(attemptId);
  const { data: quiz } = useQuiz(attempt?.quizId || "");

  // Fetch prior attempts for improvement comparison
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [avgTimePerQ, setAvgTimePerQ] = useState<number | null>(null);

  useEffect(() => {
    const loadComparisons = async () => {
      try {
        if (!attempt?.userId || !attempt?.quizId) return;
        const recent = await attemptService.getRecentAttempts(
          attempt.userId,
          5
        );
        const sameQuizPrev = recent
          .filter(
            (a) =>
              a.quizId === attempt.quizId &&
              a.id !== attempt.id &&
              a.completedAt
          )
          .sort(
            (a, b) =>
              new Date(b.completedAt!).getTime() -
              new Date(a.completedAt!).getTime()
          );
        if (sameQuizPrev.length > 0) {
          setPrevScore(sameQuizPrev[0].score);
          // Attach prevScore to attempt locally for memo usage
          (attempt as any)._prevScore = sameQuizPrev[0].score;
        }
        if (attempt.totalQuestions && attempt.timeTaken != null) {
          const avg = Math.round(
            attempt.timeTaken / Math.max(1, attempt.totalQuestions)
          );
          setAvgTimePerQ(avg);
        }
      } catch (e) {
        console.warn("Failed to load comparison stats", e);
      }
    };
    loadComparisons();
  }, [attempt?.id, attempt?.userId, attempt?.quizId, attempt?.completedAt]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Derived results from backend attempt data (memoized to prevent re-renders)
  const attemptResults = useMemo(() => {
    if (!attempt) return null;
    const total =
      attempt.totalQuestions || attempt.answersRecorded?.length || 0;
    const correct =
      attempt.correctAnswers ??
      attempt.answersRecorded?.filter((a) => a.isCorrect).length ??
      0;
    const score =
      attempt.score ?? Math.round((correct / Math.max(1, total)) * 100);
    const timeSpentMin = Math.round((attempt.timeTaken || 0) / 60);

    // Prefer backend xpEarned if present; otherwise compute from quiz.xpReward
    const computedXp =
      quiz && total ? Math.round((correct / total) * (quiz.xpReward || 0)) : 0;
    const xpEarned = (attempt as any).xpEarned ?? computedXp;

    // Compute improvement vs previous attempt on same quiz if available
    const improvementPct =
      (attempt as any)._prevScore != null
        ? `${score - (attempt as any)._prevScore >= 0 ? "+" : ""}${
            score - (attempt as any)._prevScore
          }%`
        : "+0%";

    // Speed rating based on average seconds per question
    const avgSecPerQ =
      total > 0 ? Math.round((attempt.timeTaken || 0) / total) : 0;
    const speedRating =
      avgSecPerQ <= 20 ? "Fast" : avgSecPerQ <= 40 ? "Good" : "Needs Practice";

    return {
      quizId: attempt.quizId,
      quizTitle: quiz?.title || "Quiz Completed",
      subject: "",
      score,
      correctAnswers: correct,
      totalQuestions: total,
      timeSpent: timeSpentMin,
      timeLimit: quiz?.timeLimit,
      xpEarned,
      performance: {
        accuracy: Math.round((correct / Math.max(1, total)) * 100),
        speed: speedRating,
        improvement: improvementPct,
        rank: score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : "C",
      },
    };
  }, [attempt, quiz]);

  // Get comprehensive recommendations from attempt (handle missing type)
  const comprehensiveRecommendations = (attempt as any)?.comprehensiveAnalysis
    ?.comprehensiveRecommendations;

  console.log("attemptResults:", attemptResults);
  console.log("attempt data:", attempt);
  console.log("comprehensiveRecommendations:", comprehensiveRecommendations);
  console.log("currentStep:", currentStep);

  // Animation + gamification sequence (run once per attempt)
  useEffect(() => {
    const id = attempt?.id || (attempt as any)?._id;
    if (!attemptResults || !id) return;
    if (animationRanRef.current === id) return;
    animationRanRef.current = id;

    const sequence = async () => {
      // Step 1: Show results
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCurrentStep(1);

      // Step 2: Show XP animation
      await new Promise((resolve) => setTimeout(resolve, 900));
      setCurrentStep(2);
      setShowXPAnimation(true);

      // Apply XP and streak once
      if (user?.id && gamificationAppliedRef.current !== id) {
        gamificationAppliedRef.current = id;
        if (attemptResults.xpEarned > 0) {
          updateUserXP.mutate({
            userId: user.id,
            xpGained: attemptResults.xpEarned,
          });
        }
        updateUserStreak.mutate({ userId: user.id, increment: true });
      }

      // Optional local animation XP effect
      simulateXPGain(attemptResults.xpEarned);

      // Step 3: Check for badges + generate recommendations + record performance
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        console.log(
          "[Results] Step 3 start: score=",
          attemptResults.score,
          "attemptId=",
          id
        );
        // Badge
        if (attemptResults.score >= 90) {
          unlockBadge({
            id: "high_scorer",
            name: "High Scorer",
            description: "Score 90% or higher on a quiz",
            icon: "🎯",
            rarity: "rare",
            category: "achievement",
          });
          console.log("[Results] Badge unlocked: high_scorer");
        }
        // Performance record
        if (attempt?.subjectId || quiz?.subjectId) {
          console.log(
            "[Results] Recording performance with subjectId:",
            attempt?.subjectId || quiz?.subjectId,
            "topicId:",
            attempt?.topicId || quiz?.topicId
          );
          await performanceService.recordPerformance({
            subjectId: attempt?.subjectId || quiz?.subjectId || "",
            topicId: attempt?.topicId || quiz?.topicId || "",
            attemptData: {
              score: attemptResults.score,
              timeSpent: attempt?.timeTaken ?? attemptResults.timeSpent * 60,
              difficulty: (quiz?.difficulty as any) || "beginner",
              date: new Date().toISOString(),
            },
          });
          console.log("[Results] Performance recorded");
        } else {
          console.log("[Results] Skipping performance record (no subjectId)");
        }
        // Recommendations trigger
        if (attempt?.id && (attempt?.subjectId || quiz?.subjectId)) {
          console.log(
            "[Results] Triggering recommendations for attempt",
            attempt.id
          );
          await recommendationService.autoGenerateForAttempt(attempt.id);
          console.log("[Results] Recommendations generated");
        } else {
          console.log(
            "[Results] Skipping recommendation generation (no context)"
          );
        }
      } catch (e) {
        console.warn("[Results] Post-result side effects failed", e);
      }

      // Step 4: Show comprehensive recommendations
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep(3);
    };

    sequence();
  }, [
    attemptResults,
    attempt?.id,
    user?.id,
    updateUserXP,
    updateUserStreak,
    simulateXPGain,
    unlockBadge,
    performanceService,
    recommendationService,
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    return "text-red-400";
  };

  const getRankColor = (rank: string) => {
    if (rank.startsWith("A")) return "text-green-400 bg-green-400/10";
    if (rank.startsWith("B")) return "text-blue-400 bg-blue-400/10";
    if (rank.startsWith("C")) return "text-yellow-400 bg-yellow-400/10";
    return "text-red-400 bg-red-400/10";
  };

  const handleRetakeQuiz = () => {
    router.push(`/quiz/instructions/${quizId}`);
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const handleTakeRecommended = (recommendedQuizId: string) => {
    router.push(`/quiz/instructions/${recommendedQuizId}`);
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    addNotification({
      type: "xp_gain",
      title: "Share Feature",
      message: "Sharing functionality coming soon!",
      read: false,
    });
  };

  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading results...</p>
          </div>
        </div>
      </GameLayout>
    );
  }

  if (error || !attemptResults) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Error Loading Results
            </h2>
            <p className="text-gray-400 mb-6">
              Unable to load quiz results. Please try again.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Score */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        >
          <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <Trophy className="w-16 h-16 text-white" />
            {(attemptResults?.score ?? 0) >= 80 && (
              <motion.div
                className="absolute -top-2 -right-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", bounce: 0.6 }}
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-900" />
                </div>
              </motion.div>
            )}
          </div>

          <motion.h1
            className="text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Quiz Complete!
          </motion.h1>

          <motion.p
            className="text-gray-400 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {attemptResults?.quizTitle || "Quiz"}
          </motion.p>

          <motion.div
            className={`text-6xl font-bold mb-2 ${getScoreColor(
              attemptResults?.score ?? 0
            )}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.6,
              duration: 0.8,
              type: "spring",
              bounce: 0.4,
            }}
          >
            {attemptResults?.score ?? 0}%
          </motion.div>

          <motion.div
            className={`inline-block px-4 py-2 rounded-full font-bold ${getRankColor(
              attemptResults?.performance.rank ?? "C"
            )}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Grade: {attemptResults?.performance.rank ?? "C"}
          </motion.div>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {attemptResults?.correctAnswers ?? 0}/
              {attemptResults?.totalQuestions ?? 0}
            </div>
            <div className="text-sm text-gray-400">Correct</div>
          </div>
          <div className="game-card p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {attemptResults?.timeSpent ?? 0}m
            </div>
            <div className="text-sm text-gray-400">Time Used</div>
          </div>
          <div className="game-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {attemptResults?.performance.improvement ?? "+0%"}
            </div>
            <div className="text-sm text-gray-400">Improvement</div>
          </div>
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {attemptResults?.xpEarned ?? 0}
            </div>
            <div className="text-sm text-gray-400">XP Earned</div>
          </div>
        </motion.div>

        {/* XP Breakdown */}
        <AnimatePresence>
          {currentStep >= 2 && (
            <motion.div
              className="game-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                XP Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Base XP:</span>
                  <span className="text-white font-semibold">
                    +{attemptResults?.xpEarned ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-green-400 font-semibold">
                    {attemptResults?.performance.accuracy ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time Spent:</span>
                  <span className="text-blue-400 font-semibold">
                    {attemptResults?.timeSpent ?? 0}m
                  </span>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">
                      Total XP Earned:
                    </span>
                    <span className="text-yellow-400 font-bold text-lg">
                      +{attemptResults?.xpEarned ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Analysis */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Attempted Questions Breakdown
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {(attempt?.answersRecorded || []).map((rec: any, index: number) => (
              <motion.div
                key={
                  (rec.questionId && (rec.questionId._id || rec.questionId)) ||
                  index
                }
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  rec.isCorrect
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.05, duration: 0.3 }}
                title={`Question ${index + 1}: ${
                  rec.isCorrect ? "Correct" : "Incorrect"
                } (${rec.timeSpent || 0}s)`}
              >
                {rec.isCorrect ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-4">
            <span>Question 1</span>
            <span>
              Question{" "}
              {attemptResults?.totalQuestions ??
                (attempt?.answersRecorded?.length || 0)}
            </span>
          </div>
        </motion.div>

        {/* Comprehensive Recommendations from Backend */}
        <AnimatePresence>
          {currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Detailed Performance Insights */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <span>Performance Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 mb-4">
                      {comprehensiveRecommendations?.performance_insights
                        ?.overall_performance ||
                        (attemptResults?.score >= 90
                          ? "Exceptional performance! You demonstrate mastery of this quiz content."
                          : attemptResults?.score >= 80
                          ? "Strong performance! You have a solid understanding of the material."
                          : attemptResults?.score >= 70
                          ? "Good performance! You understand most concepts but have room for improvement."
                          : attemptResults?.score >= 60
                          ? "Satisfactory performance! Focus on strengthening your foundation."
                          : "Keep practicing! Review the concepts and try again to improve your understanding.")}
                    </p>

                    {/* Performance Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                      <div>
                        <span className="font-medium text-gray-400">
                          Overall Accuracy:
                        </span>
                        <div className="text-lg font-bold text-green-400">
                          {(attempt as any)?.performanceMetrics
                            ?.responsePatterns?.overallAccuracy ||
                            attemptResults?.performance?.accuracy ||
                            0}
                          %
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">
                          Consistency Score:
                        </span>
                        <div className="text-lg font-bold text-blue-400">
                          {(attempt as any)?.performanceMetrics
                            ?.consistencyScore || 0}
                          %
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">
                          Efficiency Score:
                        </span>
                        <div className="text-lg font-bold text-purple-400">
                          {(attempt as any)?.performanceMetrics
                            ?.efficiencyScore || 0}
                          %
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-400">
                          Improvement Potential:
                        </span>
                        <div className="text-lg font-bold text-orange-400">
                          {(attempt as any)?.performanceMetrics
                            ?.improvementPotential ||
                            Math.max(0, 100 - (attemptResults?.score || 0))}
                          %
                        </div>
                      </div>
                    </div>

                    {/* Response Pattern Analysis */}
                    {(attempt as any)?.performanceMetrics?.responsePatterns && (
                      <div className="border-t border-gray-600 pt-4">
                        <h5 className="font-medium mb-3 text-white">
                          Response Pattern Analysis:
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-gray-700/30 p-3 rounded">
                            <div className="text-gray-400">
                              First Half Performance:
                            </div>
                            <div className="text-lg font-bold text-blue-400">
                              {
                                (attempt as any).performanceMetrics
                                  .responsePatterns.firstHalfAccuracy
                              }
                              %
                            </div>
                          </div>
                          <div className="bg-gray-700/30 p-3 rounded">
                            <div className="text-gray-400">
                              Second Half Performance:
                            </div>
                            <div className="text-lg font-bold text-blue-400">
                              {
                                (attempt as any).performanceMetrics
                                  .responsePatterns.secondHalfAccuracy
                              }
                              %
                            </div>
                          </div>
                          <div className="bg-gray-700/30 p-3 rounded">
                            <div className="text-gray-400">
                              Performance Trend:
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                (attempt as any).performanceMetrics
                                  .responsePatterns.improvementTrend ===
                                "IMPROVING"
                                  ? "text-green-400"
                                  : (attempt as any).performanceMetrics
                                      .responsePatterns.improvementTrend ===
                                    "DECLINING"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {
                                (attempt as any).performanceMetrics
                                  .responsePatterns.improvementTrend
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Time & Streak Analysis */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span>Time & Streak Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Time Analysis */}
                    <div>
                      <h5 className="font-medium mb-3 text-white">
                        Time Management:
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Average per Question:
                          </span>
                          <span className="text-white font-semibold">
                            {(attempt as any)?.performanceMetrics
                              ?.averageTimePerQuestion || 0}
                            s
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Fastest Question:
                          </span>
                          <span className="text-green-400 font-semibold">
                            {(attempt as any)?.performanceMetrics
                              ?.fastestQuestion || 0}
                            s
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Slowest Question:
                          </span>
                          <span className="text-red-400 font-semibold">
                            {(attempt as any)?.performanceMetrics
                              ?.slowestQuestion || 0}
                            s
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Time Consistency:
                          </span>
                          <span className="text-blue-400 font-semibold">
                            {(attempt as any)?.performanceMetrics
                              ?.timeVariance < 5
                              ? "Excellent"
                              : (attempt as any)?.performanceMetrics
                                  ?.timeVariance < 10
                              ? "Good"
                              : "Needs Work"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Streak Analysis */}
                    <div>
                      <h5 className="font-medium mb-3 text-white">
                        Answer Streaks:
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Starting Streak:
                          </span>
                          <span className="text-green-400 font-semibold">
                            {(attempt as any)?.performanceMetrics
                              ?.streakCount || 0}{" "}
                            correct
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Longest Streak:</span>
                          <span className="text-yellow-400 font-semibold">
                            {(attempt as any)?.performanceMetrics
                              ?.longestStreak || 0}{" "}
                            correct
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Confidence Level:
                          </span>
                          <span
                            className={`font-semibold ${
                              (attempt as any)?.performanceMetrics
                                ?.confidenceMetrics?.confidenceIndicator ===
                              "HIGH"
                                ? "text-green-400"
                                : (attempt as any)?.performanceMetrics
                                    ?.confidenceMetrics?.confidenceIndicator ===
                                  "MEDIUM"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {(attempt as any)?.performanceMetrics
                              ?.confidenceMetrics?.confidenceIndicator ||
                              "MEDIUM"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Progression Chart */}
                  {(attempt as any)?.performanceMetrics
                    ?.accuracyProgression && (
                    <div className="mt-6 border-t border-gray-600 pt-4">
                      <h5 className="font-medium mb-3 text-white">
                        Accuracy Progression:
                      </h5>
                      <div className="bg-gray-700/20 p-4 rounded-lg">
                        <div className="flex items-end justify-center space-x-1 h-32 mb-2">
                          {(
                            attempt as any
                          ).performanceMetrics.accuracyProgression.map(
                            (accuracy: number, index: number) => (
                              <div
                                key={index}
                                className="flex-1 max-w-12 flex flex-col items-center"
                              >
                                <div className="relative w-full flex flex-col items-center">
                                  {/* Accuracy percentage label */}
                                  <span className="text-xs text-white font-semibold mb-1">
                                    {accuracy}%
                                  </span>
                                  {/* Bar */}
                                  <div
                                    className={`w-full rounded-t transition-all duration-500 ${
                                      accuracy >= 80
                                        ? "bg-green-500"
                                        : accuracy >= 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      height: `${Math.max(
                                        (accuracy / 100) * 100,
                                        8
                                      )}px`,
                                      minHeight: "8px",
                                    }}
                                  />
                                </div>
                                {/* Question label */}
                                <span className="text-xs text-gray-400 mt-2">
                                  Q{index + 1}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">
                            Your accuracy after each question
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback: Show chart even if accuracyProgression is not available */}
                  {!(attempt as any)?.performanceMetrics?.accuracyProgression &&
                    attempt?.answersRecorded && (
                      <div className="mt-6 border-t border-gray-600 pt-4">
                        <h5 className="font-medium mb-3 text-white">
                          Question-by-Question Performance:
                        </h5>
                        <div className="bg-gray-700/20 p-4 rounded-lg">
                          <div className="flex items-end justify-center space-x-1 h-32 mb-2">
                            {attempt.answersRecorded.map(
                              (answer: any, index: number) => {
                                // Calculate running accuracy up to this point
                                const correctSoFar = attempt.answersRecorded
                                  .slice(0, index + 1)
                                  .filter((a: any) => a.isCorrect).length;
                                const accuracy = Math.round(
                                  (correctSoFar / (index + 1)) * 100
                                );

                                return (
                                  <div
                                    key={index}
                                    className="flex-1 max-w-12 flex flex-col items-center"
                                  >
                                    <div className="relative w-full flex flex-col items-center">
                                      {/* Accuracy percentage label */}
                                      <span className="text-xs text-white font-semibold mb-1">
                                        {accuracy}%
                                      </span>
                                      {/* Bar */}
                                      <div
                                        className={`w-full rounded-t transition-all duration-500 ${
                                          accuracy >= 80
                                            ? "bg-green-500"
                                            : accuracy >= 60
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{
                                          height: `${Math.max(
                                            (accuracy / 100) * 100,
                                            8
                                          )}px`,
                                          minHeight: "8px",
                                        }}
                                      />
                                    </div>
                                    {/* Question label */}
                                    <span className="text-xs text-gray-400 mt-2">
                                      Q{index + 1}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-400">
                              Your running accuracy after each question
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Intelligent Learning Path */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Target className="w-5 h-5 text-green-400" />
                    <span>Personalized Learning Path</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-blue-400">
                        {comprehensiveRecommendations?.learning_path
                          ?.current_level ||
                          (attemptResults?.score >= 80
                            ? "ADVANCED"
                            : attemptResults?.score >= 60
                            ? "INTERMEDIATE"
                            : "BEGINNER")}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        Current Level
                      </span>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2 text-white">
                        Recommended Next Steps:
                      </h5>
                      <ul className="space-y-2">
                        {(() => {
                          const metrics = (attempt as any)?.performanceMetrics;
                          const responsePattern = metrics?.responsePatterns;
                          const steps = [];

                          // Personalized recommendations based on actual performance data
                          if (
                            responsePattern?.improvementTrend === "DECLINING"
                          ) {
                            steps.push(
                              "Focus on maintaining concentration throughout the entire quiz"
                            );
                            steps.push(
                              "Take short breaks between questions to stay fresh"
                            );
                          } else if (
                            responsePattern?.improvementTrend === "IMPROVING"
                          ) {
                            steps.push(
                              "Excellent momentum! Continue with similar difficulty questions"
                            );
                            steps.push(
                              "Challenge yourself with slightly harder topics"
                            );
                          }

                          if (metrics?.timeVariance > 10) {
                            steps.push(
                              "Practice consistent pacing - avoid rushing or overthinking"
                            );
                          }

                          if (metrics?.consistencyScore < 60) {
                            steps.push(
                              "Work on building consistent problem-solving approaches"
                            );
                          }

                          if (metrics?.efficiencyScore < 70) {
                            steps.push(
                              "Focus on time management and quick decision-making"
                            );
                          }

                          // Add general recommendations if no specific issues
                          if (steps.length === 0) {
                            if (attemptResults?.score >= 80) {
                              steps.push(
                                "Challenge yourself with more difficult questions"
                              );
                              steps.push(
                                "Help others learn by explaining concepts"
                              );
                            } else if (attemptResults?.score >= 60) {
                              steps.push(
                                "Strengthen your knowledge with medium-difficulty practice"
                              );
                              steps.push(
                                "Review mistakes and understand why they were wrong"
                              );
                            } else {
                              steps.push(
                                "Review fundamental concepts before attempting advanced topics"
                              );
                              steps.push(
                                "Practice with easier questions to build confidence"
                              );
                            }
                          }

                          return steps;
                        })().map((step: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-gray-300">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Intelligent Study Strategy */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <BookOpen className="w-5 h-5 text-yellow-400" />
                    <span>Personalized Study Strategy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-3 text-white">
                        Recommended Strategies:
                      </h5>
                      <ul className="space-y-2">
                        {(() => {
                          const metrics = (attempt as any)?.performanceMetrics;
                          const strategies = [];

                          // Performance-based strategy recommendations
                          if (
                            metrics?.responsePatterns?.improvementTrend ===
                            "DECLINING"
                          ) {
                            strategies.push(
                              "Practice maintaining focus during longer sessions"
                            );
                            strategies.push(
                              "Use the Pomodoro technique for better concentration"
                            );
                          }

                          if (metrics?.timeVariance > 10) {
                            strategies.push(
                              "Practice timed questions to improve pacing"
                            );
                            strategies.push(
                              "Set time limits for each question during practice"
                            );
                          }

                          if (
                            metrics?.confidenceMetrics?.confidenceIndicator ===
                            "LOW"
                          ) {
                            strategies.push(
                              "Start with easier questions to build confidence"
                            );
                            strategies.push(
                              "Review concepts before attempting practice questions"
                            );
                          }

                          if (metrics?.efficiencyScore < 70) {
                            strategies.push(
                              "Focus on eliminating obviously wrong answers first"
                            );
                            strategies.push(
                              "Practice quick decision-making techniques"
                            );
                          }

                          if (metrics?.consistencyScore < 60) {
                            strategies.push(
                              "Develop a systematic approach to problem-solving"
                            );
                            strategies.push(
                              "Create checklists for different question types"
                            );
                          }

                          // Add general strategies based on score
                          if (attemptResults?.score >= 80) {
                            strategies.push(
                              "Challenge yourself with advanced problem sets"
                            );
                            strategies.push(
                              "Teach concepts to reinforce your understanding"
                            );
                          } else if (attemptResults?.score >= 60) {
                            strategies.push(
                              "Mix review with new concept learning"
                            );
                            strategies.push(
                              "Focus on understanding rather than memorization"
                            );
                          } else {
                            strategies.push(
                              "Start with fundamental concept review"
                            );
                            strategies.push("Use visual aids and examples");
                          }

                          return strategies.slice(0, 5); // Limit to 5 most relevant strategies
                        })().map((strategy: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium mb-3 text-white">
                        Performance-Based Tips:
                      </h5>
                      <ul className="space-y-2">
                        {(() => {
                          const metrics = (attempt as any)?.performanceMetrics;
                          const tips = [];

                          // Previous score comparison
                          if (
                            (attempt as any)?._prevScore &&
                            attemptResults?.score > (attempt as any)._prevScore
                          ) {
                            tips.push(
                              `Great improvement! You scored ${
                                attemptResults.score -
                                (attempt as any)._prevScore
                              }% higher than last time`
                            );
                          } else if (
                            (attempt as any)?._prevScore &&
                            attemptResults?.score < (attempt as any)._prevScore
                          ) {
                            tips.push(
                              "Don't worry about the dip - consistency comes with practice"
                            );
                          }

                          // Streak-based motivation
                          if (metrics?.longestStreak >= 3) {
                            tips.push(
                              `Excellent! Your longest streak was ${metrics.longestStreak} correct answers`
                            );
                          }

                          // Time-based encouragement
                          if (metrics?.averageTimePerQuestion < 30) {
                            tips.push(
                              "Great time management! You answered questions efficiently"
                            );
                          } else if (metrics?.averageTimePerQuestion > 60) {
                            tips.push(
                              "Take your time to think, but practice faster decision-making"
                            );
                          }

                          // Consistency encouragement
                          if (metrics?.consistencyScore >= 80) {
                            tips.push(
                              "Your consistent performance shows strong understanding"
                            );
                          }

                          // General motivational tips based on score
                          if (attemptResults?.score >= 90) {
                            tips.push(
                              "Outstanding performance! You're mastering this topic"
                            );
                          } else if (attemptResults?.score >= 70) {
                            tips.push(
                              "Solid performance! Keep building on this foundation"
                            );
                          } else if (attemptResults?.score >= 50) {
                            tips.push(
                              "You're making progress! Focus on consistent practice"
                            );
                          } else {
                            tips.push(
                              "Every expert started as a beginner - keep practicing!"
                            );
                          }

                          return tips.slice(0, 4); // Limit to 4 most relevant tips
                        })().map((tip: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Difficulty Breakdown if available */}
                  {(attempt as any)?.performanceMetrics
                    ?.difficultyBreakdown && (
                    <div className="mt-6 border-t border-gray-600 pt-4">
                      <h5 className="font-medium mb-3 text-white">
                        Performance by Difficulty:
                      </h5>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(
                          (attempt as any).performanceMetrics
                            .difficultyBreakdown
                        ).map(([difficulty, data]: [string, any]) => (
                          <div
                            key={difficulty}
                            className="bg-gray-700/30 p-3 rounded text-center"
                          >
                            <div className="text-sm text-gray-400 capitalize">
                              {difficulty}
                            </div>
                            <div className="text-lg font-bold text-white">
                              {data.accuracy}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {data.attempted} attempted
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data-Driven Improvement Areas */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <span>Priority Improvement Areas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium mb-3 text-white">
                        Immediate Focus Areas:
                      </h5>
                      <ul className="space-y-2">
                        {(() => {
                          const metrics = (attempt as any)?.performanceMetrics;
                          const focusAreas = [];

                          // Data-driven focus areas
                          if (
                            metrics?.responsePatterns?.improvementTrend ===
                            "DECLINING"
                          ) {
                            focusAreas.push(
                              "Maintaining concentration throughout the quiz"
                            );
                          }

                          if (metrics?.timeVariance > 10) {
                            focusAreas.push(
                              "Developing consistent pacing strategies"
                            );
                          }

                          if (metrics?.consistencyScore < 60) {
                            focusAreas.push(
                              "Building systematic problem-solving approaches"
                            );
                          }

                          if (metrics?.efficiencyScore < 70) {
                            focusAreas.push(
                              "Improving time management and decision speed"
                            );
                          }

                          if (
                            metrics?.confidenceMetrics?.confidenceIndicator ===
                            "LOW"
                          ) {
                            focusAreas.push(
                              "Building confidence through targeted practice"
                            );
                          }

                          // Score-based focus areas
                          if (attemptResults?.score < 60) {
                            focusAreas.push(
                              "Strengthening fundamental concept understanding"
                            );
                          } else if (attemptResults?.score < 80) {
                            focusAreas.push(
                              "Bridging knowledge gaps in challenging areas"
                            );
                          }

                          // If no specific issues, focus on optimization
                          if (focusAreas.length === 0) {
                            focusAreas.push(
                              "Optimizing performance for advanced challenges"
                            );
                          }

                          return focusAreas.slice(0, 4);
                        })().map((focus: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                            <span className="text-gray-300">{focus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Performance Comparison */}
                    {(attempt as any)?._prevScore && (
                      <div className="border-t border-gray-600 pt-4">
                        <h5 className="font-medium mb-3 text-white">
                          Performance Comparison:
                        </h5>
                        <div className="bg-gray-700/30 p-4 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">
                              Previous Score:
                            </span>
                            <span className="text-white font-semibold">
                              {(attempt as any)._prevScore}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">
                              Current Score:
                            </span>
                            <span className="text-white font-semibold">
                              {attemptResults?.score}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Change:</span>
                            <span
                              className={`font-semibold ${
                                attemptResults?.score >
                                (attempt as any)._prevScore
                                  ? "text-green-400"
                                  : attemptResults?.score <
                                    (attempt as any)._prevScore
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {attemptResults?.score >
                              (attempt as any)._prevScore
                                ? "+"
                                : ""}
                              {attemptResults?.score -
                                (attempt as any)._prevScore}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Improvement Timeline */}
                    <div className="border-t border-gray-600 pt-4">
                      <h5 className="font-medium mb-3 text-white">
                        Improvement Timeline:
                      </h5>
                      <div className="space-y-3">
                        <div className="bg-blue-900/20 p-3 rounded">
                          <div className="font-medium text-blue-400">
                            Immediate (Next Session):
                          </div>
                          <div className="text-sm text-gray-300">
                            {(() => {
                              const metrics = (attempt as any)
                                ?.performanceMetrics;
                              if (
                                metrics?.responsePatterns?.improvementTrend ===
                                "DECLINING"
                              ) {
                                return "Focus on maintaining energy and concentration";
                              } else if (metrics?.timeVariance > 10) {
                                return "Practice consistent pacing with timed exercises";
                              } else if (attemptResults?.score < 60) {
                                return "Review fundamental concepts before attempting new questions";
                              } else {
                                return "Build on current strengths with similar difficulty questions";
                              }
                            })()}
                          </div>
                        </div>

                        <div className="bg-green-900/20 p-3 rounded">
                          <div className="font-medium text-green-400">
                            Short-term (1-2 weeks):
                          </div>
                          <div className="text-sm text-gray-300">
                            {(() => {
                              const metrics = (attempt as any)
                                ?.performanceMetrics;
                              if (metrics?.consistencyScore < 60) {
                                return "Develop systematic approaches and practice regularly";
                              } else if (attemptResults?.score < 70) {
                                return "Strengthen weak areas with targeted practice";
                              } else {
                                return "Challenge yourself with progressively harder questions";
                              }
                            })()}
                          </div>
                        </div>

                        <div className="bg-purple-900/20 p-3 rounded">
                          <div className="font-medium text-purple-400">
                            Long-term (1+ months):
                          </div>
                          <div className="text-sm text-gray-300">
                            {attemptResults?.score >= 80
                              ? "Master advanced concepts and help others learn"
                              : "Achieve consistent high performance across all topics"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Goal Progress & Weak Area Improvements */}
        <AnimatePresence>
          {currentStep >= 3 && (
            <GoalProgressSection userId={user?.id} />
          )}
        </AnimatePresence>

        {/* Enhanced Recommendations */}
        <AnimatePresence>
          {currentStep >= 3 && (
            <EnhancedRecommendationsSection userId={user?.id} />
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          <button
            onClick={handleRetakeQuiz}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>

          <button
            onClick={handleShare}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Results
          </button>

          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </GameLayout>
  );
}
