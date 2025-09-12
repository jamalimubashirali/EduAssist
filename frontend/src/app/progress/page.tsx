"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGamificationStore } from "@/stores/useGamificationStore";
import { useXP } from "@/hooks/useXP";
import {
  useDashboardAnalytics,
  usePerformanceTrends,
} from "@/hooks/usePerformanceData";
import { useUserStore } from "@/stores/useUserStore";
import GameLayout from "@/app/components/layout/GameLayout";
import XPBar from "@/app/components/gamification/XPBar";
import BadgeCard from "@/app/components/gamification/BadgeCard";
import {
  TrendingUp,
  Trophy,
  Target,
  Calendar,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// No static mocks; charts derive from real hooks
export default function ProgressPage() {
  const { user } = useUserStore();
  const { streak, badges: unlockedBadges } = useGamificationStore();
  const { xpData } = useXP();
  const router = useRouter();

  // // Get real gamification data from API
  // const {
  //   stats,
  //   badges,
  //   quests,
  //   isLoading: gamificationLoading,
  //   error: gamificationError
  // } = useGamification(user?.id)

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Get real performance data
  const { analytics, isLoading: performanceLoading } = useDashboardAnalytics(
    user?.id
  );

  const { data: weeklyTrends } = usePerformanceTrends("week", user?.id);

  const isLoading = performanceLoading;

  // // TODO: Integrate badges with backend profile when available

  // // Transform real data for charts
  // const xpProgressData = (() => {
  //   // Try to get XP trend data from weeklyTrends
  //   if (weeklyTrends?.xpTrend && weeklyTrends.xpTrend.length > 0) {
  //     return weeklyTrends.xpTrend.slice(0, 7).map((item, index) => ({
  //       day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`,
  //       xp: item.xpGained || 0,
  //     }))
  //   }

  //   // Fallback: use weekly trend from analytics if available
  //   if (analytics?.weeklyTrend && analytics.weeklyTrend.length > 0) {
  //     return analytics.weeklyTrend.slice(0, 7).map((item, index) => ({
  //       day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || item.week || `Day ${index + 1}`,
  //       xp: (item.averageScore || 0) * 10, // Convert score to XP-like value
  //     }))
  //   }

  //   // Generate sample data based on user's current XP if available
  //   const currentXP = stats?.totalXP || stats?.xp || xpData.currentXP || 0
  //   if (currentXP > 0) {
  //     const baseXP = Math.max(10, Math.floor(currentXP / 20))
  //     return Array.from({ length: 7 }, (_, index) => ({
  //       day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
  //       xp: Math.floor(baseXP * (0.5 + Math.random() * 1.5)), // Random variation around base
  //     }))
  //   }

  //   // Default sample data for new users
  //   return [
  //     { day: 'Mon', xp: 25 },
  //     { day: 'Tue', xp: 40 },
  //     { day: 'Wed', xp: 15 },
  //     { day: 'Thu', xp: 60 },
  //     { day: 'Fri', xp: 35 },
  //     { day: 'Sat', xp: 20 },
  //     { day: 'Sun', xp: 45 },
  //   ]
  // })()

  if (!user) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-xl text-gray-900 dark:text-white mb-4">
              Please log in to view your progress
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-gray-900 dark:text-white">Loading your progress...</div>
          </div>
        </div>
      </GameLayout>
    );
  }

  // Show error state if gamification data fails to load
  // if (gamificationError) {
  //   console.warn('Gamification data failed to load, falling back to store data:', gamificationError)
  // }

  // // Debug logging to see what data we're getting
  // console.log('Progress Page Debug:', {
  //   stats,
  //   badges,
  //   analytics,
  //   weeklyTrends,
  //   user: user?.id
  // })

  return (
    <GameLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Progress Room 📊
              </h1>
              <p className="text-gray-400">
                Track your learning journey and celebrate your achievements!
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">
                Level {xpData.level || 1}
              </div>
              <div className="text-gray-400 text-sm">Current Level</div>
            </div>
          </div>
        </motion.div>
        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {(xpData.currentXP || 0).toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total XP</div>
          </div>

          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {streak.current || 0}
            </div>
            <div className="text-gray-400 text-sm">Day Streak</div>
          </div>

          {/* <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats?.totalBadges || badges?.length || unlockedBadges.length || 0}
            </div>
            <div className="text-gray-400 text-sm">Badges Earned</div>
          </div> */}

          <div className="game-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(
                typeof xpData.levelProgress === "number"
                  ? xpData.levelProgress
                  : xpData.levelProgress.progress
              )}
              %
            </div>
            <div className="text-gray-400 text-sm">Level Progress</div>
          </div>
        </motion.div>
        {/* XP Progress Chart */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">XP Progress This Week</h2>
          </div>
          
          <div className="game-card p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={xpProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div> */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skill Mastery Radar */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skill Mastery</h2>
            </div>
            
            <div className="game-card p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillRadarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    />
                    <Radar
                      name="Mastery"
                      dataKey="mastery"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div> */}

          {/* Current Level Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Level Progress</h2>
            </div>

            <div className="game-card p-6">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-yellow-400 mb-2">
                  {xpData.level || 1}
                </div>
                <div className="text-gray-400">Current Level</div>
              </div>

              <XPBar size="lg" />

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">XP to Next Level</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {xpData.xpToNextLevel} XP
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-green-400 font-semibold">
                    {Math.round(
                      typeof xpData.levelProgress === "number"
                        ? xpData.levelProgress
                        : xpData.levelProgress.progress
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        Badges Gallery
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Badge Collection</h2>
          </div>
          
          <div className="game-card p-6">
            {(badges && badges.length > 0) || (unlockedBadges && unlockedBadges.length > 0) ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {(badges || unlockedBadges).map((badge) => (
                  <div key={badge._id || badge.id} className="flex justify-center">
                    <BadgeCard badge={badge} isUnlocked={true} size="md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No badges earned yet</p>
                <p className="text-sm mt-2">Complete quests and challenges to earn your first badge!</p>
              </div>
            )}
          </div>
        </motion.div> */}
        {/* Streak Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Activity Streak</h2>
          </div>

          <div className="game-card p-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                🔥 {streak.current || 0} Days
              </div>
              <div className="text-gray-400">Current Streak</div>
              {(streak.longest || 0) > 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  Best streak: {streak.longest} days
                </div>
              )}
            </div>

            <div className="text-center text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Streak calendar coming soon!</p>
              <p className="text-sm mt-2">
                Keep learning daily to build your streak
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </GameLayout>
  );
}
