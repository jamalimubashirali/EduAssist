'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import { 
  Brain, 
  Zap, 
  Trophy, 
  Target,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users
} from 'lucide-react'
import React from 'react'

export default function WelcomeScreen() {
  const router = useRouter()
  const { isAuthenticated } = useUserStore()
  const [currentFeature, setCurrentFeature] = useState(0)
  const [floatingElements, setFloatingElements] = useState<Array<{left: number, top: number, duration: number, delay: number}>>([])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Get personalized quizzes and recommendations tailored to your learning style"
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description: "Earn XP, unlock badges, and compete with friends while you learn"
    },
    {
      icon: Target,
      title: "Track Progress",
      description: "Monitor your improvement with detailed analytics and insights"
    },
    {
      icon: Users,
      title: "Join Community",
      description: "Connect with fellow learners and share your achievements"
    }
  ]

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  useEffect(() => {
    // Only run on client
    const elements = Array.from({length: 6}).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2
    }))
    setFloatingElements(elements)
  }, [])

  const handleGetStarted = () => {
    router.push('/login')
  }

  const handleLearnMore = () => {
    router.push('/about')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo Animation */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.5 }}
        >
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <motion.h1 
            className="text-5xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            EduAssist
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Your AI-Powered Learning Companion
          </motion.p>
        </motion.div>

        {/* Feature Showcase */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <motion.div
              key={currentFeature}
              className="flex flex-col items-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                {React.createElement(features[currentFeature].icon, { 
                  className: "w-8 h-8 text-white" 
                })}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {features[currentFeature].title}
              </h3>
              <p className="text-gray-300 max-w-md">
                {features[currentFeature].description}
              </p>
            </motion.div>

            {/* Feature Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature 
                      ? 'bg-purple-500 scale-125' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          {[
            { icon: BookOpen, label: "Subjects", value: "15+" },
            { icon: Brain, label: "AI Quizzes", value: "1000+" },
            { icon: Users, label: "Students", value: "10K+" },
            { icon: Trophy, label: "Achievements", value: "50+" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <motion.button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={handleLearnMore}
            className="bg-gray-800/50 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingElements.map((el, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-20"
              style={{
                left: `${el.left}%`,
                top: `${el.top}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: el.duration,
                repeat: Infinity,
                delay: el.delay,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
