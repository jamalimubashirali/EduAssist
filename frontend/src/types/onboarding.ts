// frontend/src/types/onboarding.ts

export interface SubjectAnalysis {
  subject_name: string;
  score_percentage: number;
  proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  strong_topics: string[];
  weak_topics: string[];
}

export interface Recommendations {
  study_plan: string[];
  focus_areas: string[];
  priority_subjects: string[];
  recommended_daily_questions: number;
}

export interface AssessmentResults {
  overall_score: number;
  xp_earned: number;
  level_achieved: number;
  overall_proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  subject_analysis: SubjectAnalysis[];
  recommendations: Recommendations;
}
