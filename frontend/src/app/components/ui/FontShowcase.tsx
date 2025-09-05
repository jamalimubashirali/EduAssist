'use client'

import { motion } from 'framer-motion'
import { Type, Zap, Trophy, Code, BookOpen } from 'lucide-react'

export default function FontShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          EduAssist Typography System
        </h1>
        <p className="text-gray-400 font-body">
          Gamified fonts designed for an engaging learning experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gaming Font */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Gaming Font</h3>
              <p className="text-gray-400 text-sm">Orbitron - For XP, levels, and achievements</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="font-gaming text-2xl text-purple-400">LEVEL UP!</div>
            <div className="xp-text text-lg text-yellow-400">+250 XP EARNED</div>
            <div className="level-text text-sm text-blue-400">LEVEL 15</div>
            <div className="streak-text text-sm text-orange-400">7 DAY STREAK</div>
            <div className="score-text text-xl text-green-400">95% SCORE</div>
          </div>
        </motion.div>

        {/* Display Font */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Display Font</h3>
              <p className="text-gray-400 text-sm">Space Grotesk - For headings and emphasis</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="font-display text-2xl font-bold text-white">Quiz Master</h1>
            <h2 className="font-display text-xl font-semibold text-gray-200">Achievement Unlocked</h2>
            <h3 className="educational-heading text-lg text-purple-400">Mathematics Champion</h3>
            <div className="badge-text text-base text-yellow-400">Gold Badge Earned</div>
          </div>
        </motion.div>

        {/* Primary Font */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Primary Font</h3>
              <p className="text-gray-400 text-sm">Inter - For body text and UI elements</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="quiz-question text-lg text-white">
              What is the capital of France?
            </div>
            <div className="quiz-option text-base text-gray-300">
              A) London  B) Berlin  C) Paris  D) Madrid
            </div>
            <div className="learning-content text-sm text-gray-400">
              This is an example of educational content that would appear in lessons, 
              explanations, and detailed descriptions throughout the application.
            </div>
            <div className="font-ui text-sm text-blue-400">
              UI Element: Navigation, buttons, and interface text
            </div>
          </div>
        </motion.div>

        {/* Monospace Font */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Monospace Font</h3>
              <p className="text-gray-400 text-sm">JetBrains Mono - For code and timers</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="timer-text text-xl text-red-400">02:45</div>
            <div className="font-mono text-base text-green-400">
              function calculateScore() {'{'}
              <br />
              &nbsp;&nbsp;return correct / total * 100;
              <br />
              {'}'}
            </div>
            <div className="font-mono text-sm text-gray-300">
              Quiz ID: QZ-2024-001
            </div>
            <div className="font-mono text-sm text-yellow-400">
              Session: 1a2b3c4d-5e6f-7g8h
            </div>
          </div>
        </motion.div>
      </div>

      {/* Font Usage Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="game-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Type className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">Font Usage Guidelines</h3>
            <p className="text-gray-400 text-sm">When and how to use each font family</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-gaming text-purple-400 text-sm mb-2">GAMING FONT (ORBITRON)</h4>
              <ul className="text-gray-300 text-sm space-y-1 font-body">
                <li>• XP points and level displays</li>
                <li>• Achievement notifications</li>
                <li>• Streak counters</li>
                <li>• Score displays</li>
                <li>• Game status indicators</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-green-400 text-sm mb-2">Display Font (Space Grotesk)</h4>
              <ul className="text-gray-300 text-sm space-y-1 font-body">
                <li>• Page headings and titles</li>
                <li>• Badge and achievement names</li>
                <li>• Section headers</li>
                <li>• Emphasis text</li>
                <li>• Call-to-action buttons</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-primary text-blue-400 text-sm mb-2">Primary Font (Inter)</h4>
              <ul className="text-gray-300 text-sm space-y-1 font-body">
                <li>• Body text and paragraphs</li>
                <li>• Quiz questions and options</li>
                <li>• Navigation menus</li>
                <li>• Form labels and inputs</li>
                <li>• General UI elements</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-mono text-red-400 text-sm mb-2">Monospace Font (JetBrains Mono)</h4>
              <ul className="text-gray-300 text-sm space-y-1 font-body">
                <li>• Timer displays</li>
                <li>• Code snippets</li>
                <li>• IDs and technical data</li>
                <li>• Debug information</li>
                <li>• Numeric data tables</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
