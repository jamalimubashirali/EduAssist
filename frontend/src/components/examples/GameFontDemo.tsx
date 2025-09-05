'use client'

import React from 'react'

/**
 * GameFont Demo Component
 * 
 * This component demonstrates how to use the custom GameFont in your EduAssist application.
 * The GameFont combines Baloo2-Bold characteristics for a friendly, gamified look.
 */
export default function GameFontDemo() {
  return (
    <div className="p-8 space-y-8 bg-gray-900 text-white min-h-screen">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-game text-purple-400">
          Welcome to EduAssist
        </h1>
        <p className="text-xl font-secondary text-gray-300">
          Experience learning with our custom GameFont
        </p>
      </div>

      {/* Font Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* GameFont Examples */}
        <div className="bg-gray-800 p-6 rounded-lg border border-purple-500">
          <h2 className="text-2xl font-game text-purple-400 mb-4">GameFont</h2>
          <div className="space-y-3">
            <h3 className="text-3xl font-game text-white">Level Up!</h3>
            <p className="text-lg font-game text-green-400">+250 XP Earned</p>
            <p className="text-base font-game text-blue-400">Quest Complete</p>
            <p className="text-sm font-game text-yellow-400">Achievement Unlocked</p>
          </div>
        </div>

        {/* Primary Font (Bungee) Examples */}
        <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
          <h2 className="text-2xl font-primary text-blue-400 mb-4">Primary Font</h2>
          <div className="space-y-3">
            <h3 className="text-3xl font-primary text-white">LEVEL UP!</h3>
            <p className="text-lg font-primary text-green-400">+250 XP EARNED</p>
            <p className="text-base font-primary text-blue-400">QUEST COMPLETE</p>
            <p className="text-sm font-primary text-yellow-400">ACHIEVEMENT UNLOCKED</p>
          </div>
        </div>

        {/* Secondary Font (Inter) Examples */}
        <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
          <h2 className="text-2xl font-secondary text-green-400 mb-4">Secondary Font</h2>
          <div className="space-y-3">
            <h3 className="text-3xl font-secondary text-white">Level Up!</h3>
            <p className="text-lg font-secondary text-green-400">+250 XP Earned</p>
            <p className="text-base font-secondary text-blue-400">Quest Complete</p>
            <p className="text-sm font-secondary text-yellow-400">Achievement Unlocked</p>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-3xl font-game text-purple-400 mb-6">Usage Examples</h2>
        
        {/* Gaming UI Elements */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-secondary text-white mb-3">Gaming Elements</h3>
            <div className="bg-gray-700 p-4 rounded">
              <div className="font-game text-2xl text-yellow-400">Level 15</div>
              <div className="font-game text-lg text-green-400">2,450 XP</div>
              <div className="font-game text-base text-blue-400">Streak: 7 days</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-secondary text-white mb-3">Educational Content</h3>
            <div className="bg-gray-700 p-4 rounded">
              <div className="font-game text-xl text-purple-400 mb-2">Quiz Master</div>
              <div className="font-secondary text-base text-gray-300">
                Complete 10 quizzes to unlock this achievement and earn bonus XP!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-3xl font-game text-purple-400 mb-4">How to Use</h2>
        <div className="bg-gray-900 p-4 rounded font-mono text-sm text-green-400">
          <div className="mb-2">{'// Tailwind CSS Classes'}</div>
          <div className="mb-1">{'<h1 className="text-3xl font-game">Game Title</h1>'}</div>
          <div className="mb-1">{'<p className="text-lg font-game text-purple-400">XP Points</p>'}</div>
          <div className="mb-4">{'<span className="font-game text-yellow-400">Achievement</span>'}</div>
          
          <div className="mb-2">{'// CSS Classes'}</div>
          <div className="mb-1">{'<h1 className="font-game text-2xl">Custom Font</h1>'}</div>
          <div>{'<p className="font-secondary">Regular text</p>'}</div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-3xl font-game text-purple-400 mb-4">Best Practices</h2>
        <div className="space-y-3 font-secondary text-gray-300">
          <p>• Use <span className="font-game text-purple-400">font-game</span> for gaming elements like levels, XP, achievements</p>
          <p>• Use <span className="font-primary text-blue-400">font-primary</span> for main headings and impact text</p>
          <p>• Use <span className="font-secondary text-green-400">font-secondary</span> for body text, navigation, and educational content</p>
          <p>• GameFont works best at larger sizes (text-lg and above)</p>
          <p>• Combine with appropriate colors to enhance the gaming aesthetic</p>
        </div>
      </div>
    </div>
  )
}
