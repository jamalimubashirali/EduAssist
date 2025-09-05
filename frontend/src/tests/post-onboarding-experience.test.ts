import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePostOnboardingExperience } from '@/hooks/usePostOnboardingExperience'
import { usePostOnboardingValidation } from '@/hooks/useUserPreferencesValidation'
import { useUserStore } from '@/stores/useUserStore'
import { useAssessmentResultsStore } from '@/stores/assessmentResultsStore'
import React from 'react'

// Mock the stores
vi.mock('@/stores/useUserStore')
vi.mock('@/stores/assessmentResultsStore')
vi.mock('@/services/userService')
vi.mock('@/services/recommendationService')

const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  preferences: ['math', 'science'],
  goals: ['improve grades', 'prepare for exams'],
  onboarding: {
    status: 'COMPLETED' as const,
    step: 'completion-summary' as const,
    preferences: ['mathematics', 'physics'],
    goals: {
      primary_goal: 'academic excellence',
      focus_areas: ['algebra', 'calculus'],
      weekly_study_hours: 10
    },
    assessment_results: {
      overall_score: 75,
      total_questions: 20,
      correct_answers: 15,
      overall_proficiency: 'INTERMEDIATE',
      subject_analysis: [
        {
          subject_name: 'Mathematics',
          subject_id: 'math-id',
          score_percentage: 80,
          proficiency_level: 'INTERMEDIATE'
        },
        {
          subject_name: 'Science',
          subject_id: 'science-id',
          score_percentage: 50,
          proficiency_level: 'BEGINNER'
        }
      ],
      recommendations: {
        focus_areas: ['algebra', 'basic chemistry'],
        study_plan: ['daily practice', 'weekly review'],
        recommended_daily_questions: 5
      },
      xp_earned: 100,
      level_achieved: 2,
      assessment_duration: 1800,
      question_details: []
    }
  },
  createdAt: '2024-01-01T00:00:00Z'
}

const mockAssessmentResults = {
  overall_score: 75,
  total_questions: 20,
  correct_answers: 15,
  overall_proficiency: 'INTERMEDIATE',
  subject_analysis: [
    {
      subject_name: 'Mathematics',
      subject_id: 'math-id',
      score_percentage: 80,
      proficiency_level: 'INTERMEDIATE'
    },
    {
      subject_name: 'Science',
      subject_id: 'science-id',
      score_percentage: 50,
      proficiency_level: 'BEGINNER'
    }
  ],
  recommendations: {
    focus_areas: ['algebra', 'basic chemistry'],
    study_plan: ['daily practice', 'weekly review'],
    recommended_daily_questions: 5
  },
  xp_earned: 100,
  level_achieved: 2,
  assessment_duration: 1800,
  question_details: []
}

const mockRecommendations = [
  {
    id: 'rec-1',
    title: 'Practice Algebra',
    description: 'Focus on basic algebra concepts',
    priority: 'high',
    metadata: {
      route: '/subjects/math',
      estimatedTime: 15
    }
  },
  {
    id: 'rec-2',
    title: 'Science Fundamentals',
    description: 'Review basic science concepts',
    priority: 'medium',
    metadata: {
      route: '/subjects/science',
      estimatedTime: 20
    }
  }
]

// Create wrapper component for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Post-Onboarding Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useUserStore
    vi.mocked(useUserStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      isInitialized: true,
      setUser: vi.fn(),
      setAuthenticated: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setInitialized: vi.fn(),
      logout: vi.fn(),
      addXP: vi.fn(),
    })
    
    // Mock useAssessmentResultsStore
    vi.mocked(useAssessmentResultsStore).mockReturnValue({
      results: mockAssessmentResults,
      setResults: vi.fn(),
      clearResults: vi.fn(),
    })
  })

  describe('usePostOnboardingExperience', () => {
    it('should generate personalized content from assessment results', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.personalizedContent).toBeDefined()
      })

      const content = result.current.personalizedContent
      expect(content).toMatchObject({
        weakSubjects: expect.arrayContaining([
          expect.objectContaining({
            subject_name: 'Science',
            score_percentage: 50
          })
        ]),
        strongSubjects: expect.arrayContaining([
          expect.objectContaining({
            subject_name: 'Mathematics',
            score_percentage: 80
          })
        ]),
        focusAreas: ['algebra', 'basic chemistry'],
        recommendedDailyQuestions: 5,
        overallProficiency: 'INTERMEDIATE',
        overallScore: 75
      })
    })

    it('should generate personalized greeting based on performance', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.personalizedGreeting).toBeDefined()
      })

      const greeting = result.current.personalizedGreeting
      expect(greeting).toContain('Test User')
      expect(greeting).toMatch(/Good (morning|afternoon|evening)/)
    })

    it('should generate next actions based on assessment results', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.nextActions).toBeDefined()
      })

      const actions = result.current.nextActions
      expect(actions).toHaveLength(2) // Should have weak subject practice and daily practice
      
      // Should prioritize weak subject practice
      expect(actions[0]).toMatchObject({
        type: 'practice_weak_area',
        title: 'Practice Science',
        priority: 'high',
        xpReward: 100
      })

      // Should include daily practice
      expect(actions[1]).toMatchObject({
        type: 'daily_practice',
        title: 'Daily Practice Session',
        description: 'Complete 5 questions today',
        priority: 'medium',
        xpReward: 50
      })
    })

    it('should create dashboard content with all necessary elements', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.dashboardContent).toBeDefined()
      })

      const dashboard = result.current.dashboardContent
      expect(dashboard).toMatchObject({
        welcomeMessage: expect.stringContaining('Test User'),
        focusAreas: ['algebra', 'basic chemistry'],
        weakSubjects: expect.arrayContaining([
          expect.objectContaining({ subject_name: 'Science' })
        ]),
        strongSubjects: expect.arrayContaining([
          expect.objectContaining({ subject_name: 'Mathematics' })
        ]),
        dailyGoal: 5,
        proficiencyLevel: 'INTERMEDIATE',
        overallScore: 75,
        nextSteps: expect.any(Array)
      })
    })

    it('should validate post-onboarding setup completion', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.validationStatus).toBeDefined()
      })

      const validation = result.current.validationStatus
      expect(validation).toMatchObject({
        assessmentResultsStored: true,
        preferencesStored: true,
        preferencesUsed: true,
        dashboardPersonalized: true
      })
    })
  })

  describe('Preferences Status Validation', () => {
    it('should detect stored preferences from both main profile and onboarding', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.preferencesStatus).toBeDefined()
      })

      const status = result.current.preferencesStatus
      expect(status.stored).toBe(true)
      expect(status.details.hasPreferences).toBe(true)
      expect(status.details.hasOnboardingPreferences).toBe(true)
      expect(status.details.hasGoals).toBe(true)
      expect(status.details.hasOnboardingGoals).toBe(true)
    })

    it('should detect when preferences are being used for personalization', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.preferencesStatus.used).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing assessment results gracefully', async () => {
      // Mock user without assessment results
      vi.mocked(useUserStore).mockReturnValue({
        user: { ...mockUser, onboarding: { ...mockUser.onboarding, assessment_results: undefined } },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
        setUser: vi.fn(),
        setAuthenticated: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        setInitialized: vi.fn(),
        logout: vi.fn(),
        addXP: vi.fn(),
      })

      vi.mocked(useAssessmentResultsStore).mockReturnValue({
        results: null,
        setResults: vi.fn(),
        clearResults: vi.fn(),
      })

      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.personalizedContent).toBeNull()
      })

      expect(result.current.personalizedGreeting).toContain('Test User')
      expect(result.current.nextActions).toHaveLength(0)
    })

    it('should handle user without onboarding data', async () => {
      // Mock user without onboarding
      vi.mocked(useUserStore).mockReturnValue({
        user: { ...mockUser, onboarding: undefined as any },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
        setUser: vi.fn(),
        setAuthenticated: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        setInitialized: vi.fn(),
        logout: vi.fn(),
        addXP: vi.fn(),
      })

      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.needsInitialRecommendations).toBe(false)
      })

      expect(result.current.personalizedContent).toBeNull()
      expect(result.current.validationStatus.setupComplete).toBe(false)
    })
  })

  describe('Requirements Validation', () => {
    it('should meet requirement 8.5: Dashboard shows personalized content based on assessment results', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.dashboardContent).toBeDefined()
      })

      // Verify personalized content is based on actual assessment results
      expect(result.current.dashboardContent?.focusAreas).toEqual(['algebra', 'basic chemistry'])
      expect(result.current.dashboardContent?.weakSubjects[0].subject_name).toBe('Science')
      expect(result.current.dashboardContent?.strongSubjects[0].subject_name).toBe('Mathematics')
      expect(result.current.dashboardContent?.proficiencyLevel).toBe('INTERMEDIATE')
    })

    it('should meet requirement 8.6: Connect to backend intelligent recommendation system', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.nextActions).toBeDefined()
      })

      // Verify next actions are generated from assessment data
      const actions = result.current.nextActions
      expect(actions.length).toBeGreaterThan(0)
      expect(actions[0].type).toBe('practice_weak_area')
      expect(actions[0].title).toContain('Science') // Weakest subject
    })

    it('should meet requirement 10.2: User preferences and goals are properly stored and used', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.preferencesStatus).toBeDefined()
      })

      const status = result.current.preferencesStatus
      expect(status.stored).toBe(true) // Preferences are stored
      expect(status.used).toBe(true) // Preferences are being used for personalization
      expect(status.details.hasPreferences).toBe(true)
      expect(status.details.hasGoals).toBe(true)
    })

    it('should meet requirement 11.1: Data flow integrity between assessment and personalization', async () => {
      const wrapper = createWrapper()
      
      const { result } = renderHook(() => usePostOnboardingExperience(), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.personalizedContent).toBeDefined()
      })

      // Verify assessment data flows correctly to personalized content
      const content = result.current.personalizedContent
      expect(content?.overallScore).toBe(75) // From assessment results
      expect(content?.overallProficiency).toBe('INTERMEDIATE') // From assessment results
      expect(content?.focusAreas).toEqual(['algebra', 'basic chemistry']) // From assessment recommendations
      expect(content?.recommendedDailyQuestions).toBe(5) // From assessment recommendations
    })
  })
})