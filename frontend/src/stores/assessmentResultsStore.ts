// Store for assessment results using Zustand with persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AssessmentResults {
  overall_score: number;
  total_questions: number;
  correct_answers: number;
  overall_proficiency: string;
  subject_analysis: any[];
  recommendations: any;
  comprehensive_recommendations?: any;
  xp_earned: number;
  level_achieved: number;
  assessment_duration: number;
  question_details: any[];
}

interface AssessmentResultsState {
  results: AssessmentResults | null;
  setResults: (results: AssessmentResults) => void;
  clearResults: () => void;
}

export const useAssessmentResultsStore = create<AssessmentResultsState>()(
  persist(
    (set) => ({
      results: null,
      setResults: (results) => set({ results }),
      clearResults: () => set({ results: null }),
    }),
    {
      name: 'assessment-results-storage',
      // Only persist the results field
      partialize: (state) => ({ results: state.results }),
    }
  )
);
