'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'
import { usePostOnboardingExperience } from '@/hooks/usePostOnboardingExperience'

export default function PersonalizedWelcome() {
  const { user } = useUserStore()
  const { personalizedGreeting, dashboardContent } = usePostOnboardingExperience()

  if (!user) return null

  return (
    <motion.div
      className="game-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bungee text-white mb-2">
        {personalizedGreeting || `Welcome back, ${user.name}! 🎮`}
      </h1>
      
      {dashboardContent && (
        <div className="space-y-2">
          {dashboardContent.focusAreas.length > 0 && (
            <p className="text-gray-400">
              Focus on {dashboardContent.focusAreas.slice(0, 2).join(' and ')} today!
            </p>
          )}
          
          {dashboardContent.weakSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dashboardContent.weakSubjects.slice(0, 3).map((subject: any, index: number) => (
                <span key={index} className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                  Improve {subject.subject_name} ({Math.round(subject.score_percentage)}%)
                </span>
              ))}
            </div>
          )}
          
          {dashboardContent.strongSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dashboardContent.strongSubjects.slice(0, 2).map((subject: any, index: number) => (
                <span key={index} className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                  Strong in {subject.subject_name} ({Math.round(subject.score_percentage)}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}