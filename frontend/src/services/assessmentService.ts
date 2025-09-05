import api from '@/lib/api';
import { Question } from '@/types';
import quizService from './quizService';

export const generateAssessment = async (subjectIds: string[], userId: string): Promise<Question[]> => {
  try {
    const questions = await quizService.generateAssessment(userId, subjectIds);
    return questions || [];
  } catch (error) {
    console.error('Failed to generate assessment:', error);
    // Return an empty array or handle the error as needed
    return [];
  }
};
