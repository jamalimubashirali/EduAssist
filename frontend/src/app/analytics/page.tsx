'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'
import { useDashboardAnalytics } from '@/hooks/usePerformanceData'
import GameLayout from '@/app/components/layout/GameLayout'
import { 
  BarChart3, 
  Target, 
  Clock,
  Zap,
  Calendar,
  Brain,
  Star,
  BookOpen,
  Activity,
  LineChart
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts'

export default function AnalyticsPage() {
  const { user } = useUserStore()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month')
  const [selectedMetric, setSelectedMetric] = useState<'xp' | 'accuracy' | 'time'>('xp')

  // Real analytics
  const { analytics } = useDashboardAnalytics(user?.id)

  const timeframeData = {
    week: (analytics?.weeklyTrend || []).slice(-1),
    month: (analytics?.weeklyTrend || []).slice(-4),
    year: (analytics?.weeklyTrend || []),
  }

  const getMetricData = () => {
    const base = timeframeData[selectedTimeframe]
    return base.map(item => ({
      week: item.week,
      value: selectedMetric === 'accuracy' ? item.averageScore : item.averageScore, // placeholder
      accuracy: item.averageScore,
      quizzes: item.attempts,
    }))
  }

  return (
    <GameLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Learning Analytics 📊</h1>
          <p className="text-gray-400">Deep insights into your learning journey</p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="game-card p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{/* XP TBD */}—</div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
          <div className="game-card p-4 text-center">
            <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{analytics?.overallStats?.averageScore ?? 0}%</div>
            <div className="text-sm text-gray-400">Avg Score</div>
          </div>
          <div className="game-card p-4 text-center">
            <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{analytics?.overallStats?.totalAttempts ?? 0}</div>
            <div className="text-sm text-gray-400">Attempts</div>
          </div>
          <div className="game-card p-4 text-center">
            <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">—</div>
            <div className="text-sm text-gray-400">Study Time</div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Timeframe */}
          <div className="flex gap-2">
            {[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'year', label: 'Year' }
            ].map((timeframe) => (
              <button
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id as 'week' | 'month' | 'year')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedTimeframe === timeframe.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>

          {/* Metric */}
          <div className="flex gap-2">
            {[
              { id: 'xp', label: 'XP', icon: Zap },
              { id: 'accuracy', label: 'Accuracy', icon: Target },
              { id: 'time', label: 'Time', icon: Clock }
            ].map((metric) => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id as 'xp' | 'accuracy' | 'time')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedMetric === metric.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <metric.icon className="w-4 h-4" />
                {metric.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Progress Chart */}
          <motion.div
            className="game-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-purple-400" />
              Progress Trend
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={getMetricData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9CA3AF" />
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
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Mastery Radar */}
          <motion.div
            className="game-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Subject Mastery
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={(analytics?.subjectBreakdown || []).map(s => ({ subject: s.subjectName, mastery: Math.round((s as { mastery?: number; averageScore: number }).mastery ?? s.averageScore ?? 0) }))}>
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
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Performance Bar Chart */}
          <motion.div
            className="game-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Subject Performance
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(analytics?.subjectBreakdown || []).map(s => ({ subject: s.subjectName, avgScore: Math.round(s.averageScore || 0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="subject" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Daily Activity Heatmap */}
          <motion.div
            className="game-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Weekly Activity
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {(analytics?.weeklyTrend || []).slice(-7).map((point, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-400 mb-2">{point.week}</div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      point.averageScore > 0
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-800 text-gray-600 border border-gray-700'
                    }`}
                  >
                    {point.attempts}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{Math.round(point.averageScore)}%</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Improvement Areas */}
        <motion.div
          className="game-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            Areas for Improvement
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(analytics?.improvementAreas || []).length > 0 ? (
              (analytics?.improvementAreas || []).map((area: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium capitalize">{area.replace('_', ' ')}</h3>
                    <p className="text-sm text-gray-400">Focus area for better performance</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <Star className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-medium mb-2">Great Progress!</h3>
                <p className="text-gray-400">No specific improvement areas identified. Keep up the excellent work!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </GameLayout>
  )
}
