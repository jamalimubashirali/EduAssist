import { AssessmentResults } from './onboarding';

// User and Authentication Types
export type OnboardingStep = 'welcome' | 'profile' | 'subjects' | 'goals' | 'assessment' | 'onboarding-assessment-results' | 'completion-summary';

export interface User {
  longestStreak: number | undefined;
  xp: number;
  id: string;
  email: string;
  name: string;
  avatar?: string;
  theme?: string;
  goals?: string[];
  onboarding: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    step: OnboardingStep;
    profile?: {
      display_name?: string;
      avatar?: string;
      grade_level?: string;
      bio?: string;
    };
    preferences: string[];
    goals?: {
      primary_goal?: string;
      target_score?: number;
      weekly_study_hours?: number;
      focus_areas?: string[];
      custom_goal?: string;
    };
    assessment?: {
      subject?: string;
      questions?: any[];
      answers?: Record<string, { answer: string; timeTaken: number }>;
      score?: number;
      completed_at?: string;
      currentQuestionIndex?: number;
    };
    assessment_results?: AssessmentResults;
  };
  title?: string;
  preferences?: string[];
  totalQuizzesAttempted?: number;
  averageScore?: number;
  streakCount?: number;
  lastQuizDate?: string;
  level?: number;
  xp_points?: number;
  leaderboardScore?: number;
  isActive?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BackendUser {
  longestStreak: number;
  xp: number;
  _id: string;
  email: string;
  name: string;
  passwordHash?: string;
  preferences?: string[];
  avatar?: string;
  theme?: string;
  goals?: string[];
  onboarding?: any;
  totalQuizzesAttempted?: number;
  averageScore?: number;
  streakCount?: number;
  lastQuizDate?: string;
  level?: number;
  xp_points?: number;
  leaderboardScore?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// XP and Level System
export interface XPData {
  currentXP: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  levelProgress: number; // percentage 0-100
}

export interface XPGain {
  amount: number;
  source: string;
  timestamp: string;
}

// Badge System
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}


// Quest System
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  badgeReward?: string;
  progress: number;
  maxProgress?: number;
  isCompleted: boolean;
  isClaimed?: boolean;
  expiresAt?: string;
  createdAt: string;
}

// Streak System
export interface Streak {
  current: number;
  longest: number;
  lastActivityDate: string;
  isActive: boolean;
  endDate?: string;
}

// Quiz System
export interface Quiz {
  completions: number;
  rating: number;
  description: string;
  id: string;
  title: string;
  subjectId: string;
  topicId: string;
  questions: Question[];
  timeLimit: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'standard' | 'adaptive' | 'diagnostic';
  createdAt: string;
  xpReward: number;
}

export interface Question {
  id: string;
  questionText: string;
  answerOptions: string[];
  correctAnswer: number; // Changed from string to number (index of correct answer)
  explanation?: string;
  questionDifficulty: 'Easy' | 'Medium' | 'Hard';
  subject: {
    _id: string;
    subjectName: string;
  };
  topic: {
    _id: string;
    topicName: string;
  };
  type: 'multiple-choice' | 'true-false' | 'short-answer';
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  xpEarned: number;
  badgesUnlocked: Badge[];
  completedAt: string;
}

// Backend-compatible types
export interface BackendQuestion {
  _id: string;
  topicId: string;
  subjectId: string;
  questionDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  answerOptions: string[];
  correctAnswer: string;
  explanation?: string;
  tags: string[];
  timesAsked: number;
  timesAnsweredCorrectly: number;
  averageTimeToAnswer: number;
  difficultyRating: number;
  isActive: boolean;
  createdBy?: string;
  learningObjectives: string[];
  prerequisites: string[];
  metadata?: {
    bloomsTaxonomyLevel: string;
    cognitiveLevel: string;
    estimatedDifficulty: number;
    topicRelevance: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Attempts (frontend shape compatible with backend Attempt schema)
export interface AttemptAnswerRecord {
  questionId: string;
  selectedAnswer: string; // backend stores as string
  isCorrect: boolean;
  timeSpent: number; // seconds
  answeredAt?: string;
}

export interface Attempt {
  id: string; // convenience id
  _id?: string;
  userId: string;
  quizId: string;
  topicId: string;
  subjectId?: string;
  score: number; // same as percentageScore
  percentageScore?: number;
  timeTaken: number; // seconds
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string;
  answersRecorded: AttemptAnswerRecord[];
  correctAnswers: number;
  totalQuestions: number;
  performanceMetrics?: {
    averageTimePerQuestion: number;
    difficultyBreakdown?: Record<string, { correct: number; total: number }>;
    streakCount?: number;
    fastestQuestion?: number;
    slowestQuestion?: number;
  };
}

export interface AttemptSubmission {
  quizId: string;
  userId: string;
  answers: number[];
  timeSpent: number; // seconds
}

export interface BackendQuiz {
  _id: string;
  topicId: string;
  questionIds: string[];
  quizDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  quizType: 'PRACTICE' | 'ASSESSMENT' | 'CHALLENGE';
  title: string;
  description?: string;
  timeLimit: number;
  sessionId?: string;
  isPersonalized: boolean;
  createdBy?: string;
  personalizationMetadata?: {
    userId: string;
    difficultyDistribution: Record<string, number>;
    focusAreas: string[];
    generatedAt: string;
    userLevel: number;
    masteryScore: number;
  };
  attemptCount: number;
  averageScore: number;
  averageCompletionTime: number;
  isActive: boolean;
  questions?: BackendQuestion[];
  createdAt: string;
  updatedAt: string;
}

// Topic System
export interface Topic {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
  
  // Optional stats (for enhanced views)
  quizCount?: number;
  questionCount?: number;
  averageScore?: number;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  topicCount?: number;
  quizCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Progress and Analytics
export interface SkillProgress {
  subject: string;
  level: number;
  xp: number;
  mastery: number; // percentage 0-100
}

export interface UserProgress {
  totalXP: number;
  level: number;
  badges: Badge[];
  skills: SkillProgress[];
  streak: Streak;
  quizHistory: QuizResult[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

// Leaderboard (future feature)
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  totalXP: number;
  rank: number;
}

// Notification System
export interface GameNotification {
  id: string;
  type: 'xp_gain' | 'level_up' | 'badge_unlock' | 'quest_complete' | 'streak_milestone';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}