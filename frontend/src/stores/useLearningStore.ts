import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Subject, Topic } from '@/types';
import { Recommendation } from '@/services/recommendationService';

interface LearningState {
  subjects: Subject[];
  topics: Topic[];
  recommendations: Recommendation[];
  loadingSubjects: boolean;
  loadingTopics: boolean;
  loadingRecommendations: boolean;

  setSubjects: (subjects: Subject[]) => void;
  setTopics: (topics: Topic[]) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;
}

export const useLearningStore = create<LearningState>()(
  devtools(
    (set) => ({
      subjects: [],
      topics: [],
      recommendations: [],
      loadingSubjects: false,
      loadingTopics: false,
      loadingRecommendations: false,

      setSubjects: (subjects) => set({ subjects, loadingSubjects: false }),
      setTopics: (topics) => set({ topics, loadingTopics: false }),
      setRecommendations: (recommendations) => set({ recommendations, loadingRecommendations: false }),
    }),
    { name: 'learning-store' }
  )
);
