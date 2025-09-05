"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Star,
  Zap,
} from "lucide-react";

export interface NavigationSuggestion {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: "high" | "medium" | "low";
  category: "practice" | "learn" | "review" | "challenge";
  estimatedTime?: string;
  xpReward?: number;
}

interface NavigationSuggestionsProps {
  suggestions: NavigationSuggestion[];
  title?: string;
  maxSuggestions?: number;
  className?: string;
}

export default function NavigationSuggestions({
  suggestions,
  title = "What's Next?",
  maxSuggestions = 3,
  className = "",
}: NavigationSuggestionsProps) {
  const displayedSuggestions = suggestions
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxSuggestions);

  if (displayedSuggestions.length === 0) {
    return null;
  }

  const categoryColors = {
    practice: "from-blue-500 to-cyan-500",
    learn: "from-green-500 to-emerald-500",
    review: "from-yellow-500 to-orange-500",
    challenge: "from-red-500 to-pink-500",
  };

  const categoryIcons = {
    practice: Brain,
    learn: BookOpen,
    review: Clock,
    challenge: Zap,
  };

  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedSuggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          const CategoryIcon = categoryIcons[suggestion.category];

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={suggestion.href}>
                <div className="game-card p-4 hover:border-purple-500 transition-all duration-200 cursor-pointer group relative overflow-hidden">
                  {/* Priority indicator */}
                  {suggestion.priority === "high" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  {/* Category gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      categoryColors[suggestion.category]
                    } opacity-5 group-hover:opacity-10 transition-opacity duration-200`}
                  ></div>

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${
                            categoryColors[suggestion.category]
                          } bg-opacity-20`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                            {suggestion.title}
                          </h3>
                        </div>
                      </div>
                      <CategoryIcon className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                      {suggestion.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {suggestion.estimatedTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{suggestion.estimatedTime}</span>
                          </div>
                        )}
                        {suggestion.xpReward && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            <span>{suggestion.xpReward} XP</span>
                          </div>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Helper function to generate contextual suggestions based on user progress and current page
export function generateNavigationSuggestions(context: {
  currentPage: string;
  user?: { id: string; name: string };
  subject?: { id: string; name: string };
  topic?: { id: string; name: string; difficulty: string };
  userProgress?: {
    averageScore: number;
    streakCount: number;
    totalQuizzes: number;
  };
  recentActivity?: unknown;
}): NavigationSuggestion[] {
  const suggestions: NavigationSuggestion[] = [];

  // Subject page suggestions
  if (context.currentPage.startsWith("/subjects/") && context.subject) {
    suggestions.push({
      id: "practice-subject",
      title: `Practice ${context.subject.name}`,
      description: "Start a quick practice session to reinforce your knowledge",
      href: `/quiz/generate?subject=${context.subject.id}`,
      icon: Brain,
      priority: "high",
      category: "practice",
      estimatedTime: "10-15 min",
      xpReward: 25,
    });

    suggestions.push({
      id: "explore-topics",
      title: "Explore Topics",
      description: `Discover specific topics within ${context.subject.name}`,
      href: `/subjects/${context.subject.id}#topics`,
      icon: BookOpen,
      priority: "medium",
      category: "learn",
      estimatedTime: "5 min",
    });
  }

  // Topic page suggestions
  if (context.currentPage.startsWith("/topics/") && context.topic) {
    suggestions.push({
      id: "practice-topic",
      title: `Master ${context.topic.name}`,
      description: "Take a focused quiz on this specific topic",
      href: `/quiz/generate?topic=${context.topic.id}`,
      icon: Target,
      priority: "high",
      category: "practice",
      estimatedTime: "15-20 min",
      xpReward: 30,
    });

    if (context.topic.difficulty === "beginner") {
      suggestions.push({
        id: "next-level",
        title: "Ready for More?",
        description: "Try intermediate level questions to challenge yourself",
        href: `/quiz/generate?topic=${context.topic.id}&difficulty=intermediate`,
        icon: TrendingUp,
        priority: "medium",
        category: "challenge",
        estimatedTime: "20 min",
        xpReward: 40,
      });
    }

    if (context.subject) {
      suggestions.push({
        id: "related-topics",
        title: "Related Topics",
        description: `Explore other topics in ${context.subject.name}`,
        href: `/subjects/${context.subject.id}`,
        icon: BookOpen,
        priority: "low",
        category: "learn",
        estimatedTime: "5 min",
      });
    }
  }

  // General suggestions based on user progress
  if (context.userProgress) {
    const { averageScore, streakCount, totalQuizzes } = context.userProgress;

    if (averageScore > 80 && totalQuizzes > 5) {
      suggestions.push({
        id: "challenge-mode",
        title: "Challenge Mode",
        description: "You're doing great! Try some advanced questions",
        href: "/quiz/generate?difficulty=advanced",
        icon: Zap,
        priority: "high",
        category: "challenge",
        estimatedTime: "25 min",
        xpReward: 50,
      });
    }

    if (streakCount > 0) {
      suggestions.push({
        id: "maintain-streak",
        title: `Keep Your ${streakCount}-Day Streak!`,
        description: "Don't break your learning momentum",
        href: "/quiz/generate",
        icon: TrendingUp,
        priority: "high",
        category: "practice",
        estimatedTime: "10 min",
        xpReward: 20,
      });
    }

    if (averageScore < 60) {
      suggestions.push({
        id: "review-fundamentals",
        title: "Review Fundamentals",
        description: "Strengthen your foundation with easier questions",
        href: "/quiz/generate?difficulty=beginner",
        icon: BookOpen,
        priority: "high",
        category: "review",
        estimatedTime: "15 min",
        xpReward: 15,
      });
    }
  }

  return suggestions;
}
