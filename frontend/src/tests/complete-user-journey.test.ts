/**
 * Complete User Journey End-to-End Tests
 * 
 * This test suite validates complete user flows from signup through advanced learning features.
 * It ensures all navigation paths are functional and data consistency is maintained.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { userService } from '@/services/userService'
import { authService } from '@/services/authService'
import { subjectService } from '@/services/subjectService'
import { topicService } from '@/services/topicService'
import { quizService } from '@/services/quizService'
import { performanceService } from '@/services/performanceService'
import { gamificationService } from '@/services/gamificationService'
import { recommendationService } from '@/services/recommendationService'

// Mock data for testing
const mockUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!'
}

const mockSubjects = [
  { id: 'math-id', name: 'Mathematics', description: 'Math subjects' },
  { id: 'science-id', name: 'Science', description: 'Science subjects' }
]

const mockAssessmentData = {
  answers: [
    { question_id: 'q1', user_answer: 'A', time_taken: 30 },
    { question_id: 'q2', user_answer: 'B', time_taken: 45 },
    { question_id: 'q3', user_answer: 'C', time_taken: 25 }
  ],
  started_at: new Date(Date.now() - 300000).toISOString(),
  completed_at: new Date().toISOString()
}

const mockAssessmentResults = {
  overall_score: 75,
  xp_earned: 150,
  level_achieved: 2,
  overall_proficiency: 'INTERMEDIATE',
  subject_analysis: [
    {
      subject_name: 'Mathematics',
      score_percentage: 80,
      proficiency_level: 'INTERMEDIATE',
      strong_topics: ['Algebra'],
      weak_topics: ['Calculus']
    },
    {
      subject_name: 'Scien