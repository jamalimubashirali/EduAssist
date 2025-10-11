export interface ChatResponse {
  reply: string;
  suggestedTopics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  followUpQuestions?: string[];
  relatedConcepts?: string[];
}

export interface LearningContext {
  weakTopics: string[];
  strongTopics: string[];
  targetScore: number;
  currentAverageScore: number;
  recentPerformance: {
    topicName: string;
    score: number;
    trend: string;
  }[];
}
