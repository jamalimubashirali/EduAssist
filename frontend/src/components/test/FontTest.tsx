'use client'

import React from 'react'

/**
 * Simple Font Test Component
 * Quick test to verify GameFont is working properly
 */
export default function FontTest() {
  return (
    <div className="p-4 space-y-4 bg-gray-900 text-white">
      <h1 className="text-2xl font-game text-purple-400">
        GameFont Test - Level Up!
      </h1>
      
      <p className="text-lg font-game text-green-400">
        +250 XP Earned
      </p>
      
      <p className="font-secondary text-gray-300">
        This text uses the secondary font (Inter) for comparison.
      </p>
      
      <div className="text-sm text-gray-500">
        If you can see different fonts above, GameFont is working! 🎮
      </div>
    </div>
  )
}
