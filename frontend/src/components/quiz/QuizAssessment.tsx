"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Brain,
  Zap,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
} from "lucide-react";

interface QuizAssessmentProps {
  results: {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    timeLimit?: number;
    difficulty: string;
    xpEarned: number;
    answers: Array<{
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
      selectedAnswer: number;
      correctAnswer: number;
    }>;
  };
  previousAttempts?: Array<{
    score: number;
    timeSpent: number;
    date: string;
  }>;
  recommendations?: Array<{
    type: "strength" | "weakness" | "improvement";
    title: string;
    description: string;
    actionable: string;
  }>;
}

export default function QuizAssessment({
  results,
  previousAttempts = [],
  recommendations = [],
}: QuizAssessmentProps) {
  const accuracy = Math.round(
    (results.correctAnswers / results.totalQuestions) * 100
  );
  const timeEfficiency = results.timeLimit
    ? Math.round(
        ((results.timeLimit - results.timeSpent) / results.timeLimit) * 100
      )
    : 0;

  const averageTimePerQuestion = Math.round(
    results.timeSpent / results.totalQuestions
  );

  // Performance analysis
  const getPerformanceLevel = (score: number) => {
    if (score >= 90)
      return {
        level: "Excellent",
        color: "text-green-400",
        bg: "bg-green-400/10",
      };
    if (score >= 80)
      return { level: "Good", color: "text-blue-400", bg: "bg-blue-400/10" };
    if (score >= 70)
      return {
        level: "Average",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
      };
    if (score >= 60)
      return {
        level: "Below Average",
        color: "text-orange-400",
        bg: "bg-orange-400/10",
      };
    return {
      level: "Needs Improvement",
      color: "text-red-400",
      bg: "bg-red-400/10",
    };
  };

  const performance = getPerformanceLevel(results.score);

  // Trend analysis
  const getTrend = () => {
    if (previousAttempts.length === 0) return null;
    const lastScore = previousAttempts[previousAttempts.length - 1]?.score || 0;
    const improvement = results.score - lastScore;

    if (improvement > 5)
      return { direction: "up", value: improvement, color: "text-green-400" };
    if (improvement < -5)
      return {
        direction: "down",
        value: Math.abs(improvement),
        color: "text-red-400",
      };
    return { direction: "stable", value: 0, color: "text-gray-400" };
  };

  const trend = getTrend();

  // Question analysis
  const questionAnalysis = results.answers.map((answer, index) => ({
    ...answer,
    questionNumber: index + 1,
    efficiency: answer.timeSpent <= averageTimePerQuestion ? "fast" : "slow",
  }));

  const fastCorrect = questionAnalysis.filter(
    (q) => q.isCorrect && q.efficiency === "fast"
  ).length;
  const slowCorrect = questionAnalysis.filter(
    (q) => q.isCorrect && q.efficiency === "slow"
  ).length;
  const fastIncorrect = questionAnalysis.filter(
    (q) => !q.isCorrect && q.efficiency === "fast"
  ).length;
  const slowIncorrect = questionAnalysis.filter(
    (q) => !q.isCorrect && q.efficiency === "slow"
  ).length;

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <motion.div
        className="game-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Performance Analysis
          </h2>

          {trend && (
            <div className={`flex items-center gap-2 ${trend.color}`}>
              {trend.direction === "up" && <TrendingUp className="w-4 h-4" />}
              {trend.direction === "down" && (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {trend.direction === "stable"
                  ? "Stable"
                  : `${trend.value}% ${
                      trend.direction === "up" ? "improvement" : "decline"
                    }`}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${performance.color}`}>
              {results.score}%
            </div>
            <div className="text-sm text-gray-400">Overall Score</div>
            <div
              className={`text-xs px-2 py-1 rounded-full mt-1 ${performance.bg} ${performance.color}`}
            >
              {performance.level}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {results.correctAnswers}/{results.totalQuestions}
            </div>
            <div className="text-sm text-gray-400">Correct Answers</div>
            <div className="text-xs text-green-400 mt-1">
              {accuracy}% accuracy
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Math.floor(results.timeSpent / 60)}:
              {(results.timeSpent % 60).toString().padStart(2, "0")}
            </div>
            <div className="text-sm text-gray-400">Time Spent</div>
            <div className="text-xs text-blue-400 mt-1">
              {averageTimePerQuestion}s per question
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              +{results.xpEarned}
            </div>
            <div className="text-sm text-gray-400">XP Earned</div>
            <div className="text-xs text-yellow-400 mt-1">
              {results.difficulty} difficulty
            </div>
          </div>
        </div>
      </motion.div>

      {/* Question Breakdown */}
      <motion.div
        className="game-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-400" />
          Question Analysis
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Fast & Correct</span>
              <span className="text-green-400 font-semibold">
                {fastCorrect}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Slow & Correct</span>
              <span className="text-blue-400 font-semibold">{slowCorrect}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Fast & Incorrect</span>
              <span className="text-orange-400 font-semibold">
                {fastIncorrect}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Slow & Incorrect</span>
              <span className="text-red-400 font-semibold">
                {slowIncorrect}
              </span>
            </div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {questionAnalysis.map((question, index) => (
            <motion.div
              key={index}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                ${
                  question.isCorrect
                    ? question.efficiency === "fast"
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white"
                    : question.efficiency === "fast"
                    ? "bg-orange-500 text-white"
                    : "bg-red-500 text-white"
                }
              `}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
              title={`Q${question.questionNumber}: ${
                question.isCorrect ? "Correct" : "Incorrect"
              } (${question.timeSpent}s)`}
            >
              {question.isCorrect ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Personalized Recommendations
          </h2>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                className={`
                  p-4 rounded-lg border-l-4
                  ${
                    rec.type === "strength"
                      ? "bg-green-500/10 border-green-500"
                      : rec.type === "weakness"
                      ? "bg-red-500/10 border-red-500"
                      : "bg-blue-500/10 border-blue-500"
                  }
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                    w-6 h-6 rounded-full flex items-center justify-center mt-0.5
                    ${
                      rec.type === "strength"
                        ? "bg-green-500"
                        : rec.type === "weakness"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }
                  `}
                  >
                    {rec.type === "strength" && (
                      <Award className="w-3 h-3 text-white" />
                    )}
                    {rec.type === "weakness" && (
                      <AlertCircle className="w-3 h-3 text-white" />
                    )}
                    {rec.type === "improvement" && (
                      <TrendingUp className="w-3 h-3 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {rec.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {rec.description}
                    </p>
                    <p className="text-blue-400 text-sm font-medium">
                      {rec.actionable}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Progress History */}
      {previousAttempts.length > 0 && (
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Progress History
          </h2>

          <div className="space-y-2">
            {previousAttempts.slice(-5).map((attempt, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
              >
                <span className="text-gray-400 text-sm">
                  {new Date(attempt.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-semibold ${
                      getPerformanceLevel(attempt.score).color
                    }`}
                  >
                    {attempt.score}%
                  </span>
                  <span className="text-gray-400 text-sm">
                    {Math.floor(attempt.timeSpent / 60)}:
                    {(attempt.timeSpent % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
