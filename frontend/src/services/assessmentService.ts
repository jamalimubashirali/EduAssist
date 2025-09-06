import api from '@/lib/api';
import { Question } from '@/types';
import quizService from './quizService';

export const generateAssessment = async (subjectIds: string[], userId: string): Promise<Question[]> => {
  try {
    const questions = await quizService.generateAssessment(userId, subjectIds);
    return questions || [];
  } catch (error: any) {
    console.error('Failed to generate assessment:', error);
    
    // Provide user-friendly error handling
    if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
      throw new Error('Assessment generation is taking longer than expected. Please check your connection and try again.');
    } else if (error.message?.includes('Server is experiencing issues')) {
      throw new Error('Our servers are currently busy. Please try again in a moment.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error occurred. Please try again later.');
    }
    
    // Return empty array for other errors to prevent app crashes
    return [];
  }
};
