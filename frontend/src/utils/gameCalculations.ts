import { User } from '@/types'

export interface GameStats {
  currentXP: number
  level: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  levelProgress: number
}

export interface StreakStats {
  current: number
  longest: number
  lastActivityDate: string
  isActive: boolean
}

/**
 * Calculate game statistics from user data
 * @param user - User object containing XP and level data
 * @returns Calculated game statistics
 */
export function calculateGameStats(user: User | null): GameStats {
  if (!user) {
    return {
      currentXP: 0,
      level: 1,
      xpForCurrentLevel: 0,
      xpForNextLevel: 100,
      levelProgress: 0
    }
  }

  const level = user.level || 1
  const currentXP = user.xp_points || 0
  
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100
  const xpForNextLevel = Math.pow(level, 2) * 100
  const xpDifference = xpForNextLevel - xpForCurrentLevel
  
  // Prevent division by zero and ensure progress is between 0-100
  const levelProgress = xpDifference > 0 
    ? Math.min(100, Math.max(0, ((currentXP - xpForCurrentLevel) / xpDifference) * 100))
    : 0

  return {
    currentXP,
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    levelProgress
  }
}

/**
 * Calculate streak statistics from user data
 * @param user - User object containing streak data
 * @returns Calculated streak statistics
 */
export function calculateStreakStats(user: User | null): StreakStats {
  if (!user) {
    return {
      current: 0,
      longest: 0,
      lastActivityDate: new Date().toISOString(),
      isActive: false
    }
  }

  const current = user.streakCount || 0
  
  return {
    current,
    longest: current, // For now, we'll use current as longest. This could be enhanced with a separate field
    lastActivityDate: user.lastQuizDate || new Date().toISOString(),
    isActive: current > 0
  }
}

/**
 * Calculate level from XP points
 * @param xp - Experience points
 * @returns Calculated level
 */
export function calculateLevelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculate XP required for a specific level
 * @param level - Target level
 * @returns XP required for that level
 */
export function calculateXPForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

/**
 * Calculate XP needed to reach next level
 * @param currentXP - Current experience points
 * @returns XP needed for next level
 */
export function calculateXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevelFromXP(currentXP)
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1)
  return xpForNextLevel - currentXP
}
