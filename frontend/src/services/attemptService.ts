import api, { handleApiResponse, handleApiError } from '@/lib/api';
import { Attempt, AttemptSubmission } from '@/types';

// Normalize backend attempt payloads into a consistent frontend shape
function normalizeAttempt(raw: any): Attempt {
  const toId = (v: any) => (typeof v === 'string' ? v : v?._id ? String(v._id) : v ?? '');
  const answers = Array.isArray(raw?.answersRecorded)
    ? raw.answersRecorded.map((a: any) => ({
        questionId: toId(a.questionId),
        selectedAnswer: String(a.selectedAnswer),
        isCorrect: !!a.isCorrect,
        timeSpent: a.timeSpent ?? 0,
        answeredAt: a.answeredAt ? new Date(a.answeredAt).toISOString() : undefined,
      }))
    : [];

  const totalQuestions = raw.totalQuestions ?? answers.length ?? 0;
  const correctAnswers = raw.correctAnswers ?? answers.filter((x: any) => x.isCorrect).length;
  const percentage = raw.percentageScore ?? raw.score ?? (totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0);

  return {
    id: raw.id || raw._id || raw.attemptId || '',
    _id: raw._id,
    userId: toId(raw.userId),
    quizId: toId(raw.quizId),
    topicId: toId(raw.topicId),
    subjectId: raw.subjectId ? toId(raw.subjectId) : undefined,
    score: percentage,
    percentageScore: percentage,
    timeTaken: raw.timeTaken ?? 0,
    isCompleted: !!raw.isCompleted,
    startedAt: raw.startedAt ? new Date(raw.startedAt).toISOString() : new Date().toISOString(),
    completedAt: raw.completedAt ? new Date(raw.completedAt).toISOString() : undefined,
    answersRecorded: answers,
    correctAnswers,
    totalQuestions,
    performanceMetrics: raw.performanceMetrics,
    comprehensiveAnalysis: raw.comprehensiveAnalysis,
  };
}

function normalizeAttemptArray(raw: any[]): Attempt[] { return (raw || []).map(normalizeAttempt); }

class AttemptService {
  // Start a quiz attempt (backend infers userId from auth cookie)
  async startAttempt(data: { quizId: string; topicId: string; subjectId?: string }): Promise<Attempt> {
    try {
      const response = await api.post('/attempts/start-quiz', data);
      const res = handleApiResponse(response);
      return normalizeAttempt(res);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Record an answer in real-time (backend expects strings for selectedAnswer and requires isCorrect)
  async recordAnswer(
    attemptId: string,
    data: { questionId: string; selectedAnswer: number; isCorrect: boolean; timeSpent?: number }
  ): Promise<Attempt> {
    try {
      const payload = {
        questionId: data.questionId,
        selectedAnswer: String(data.selectedAnswer),
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent ?? 0,
      };
      const response = await api.post(`/attempts/${attemptId}/submit-answer`, payload);
      const res = handleApiResponse(response);
      return normalizeAttempt(res);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Complete an attempt and compute results
  async completeAttempt(attemptId: string): Promise<Attempt> {
    try {
      const response = await api.post(`/attempts/${attemptId}/complete`);
      const res = handleApiResponse(response);
      return normalizeAttempt(res);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Submit quiz attempt (legacy batch submission)
  async submitAttempt(data: AttemptSubmission): Promise<Attempt> {
    try {
      const response = await api.post('/attempts/submit', data);
      const res = handleApiResponse(response);
      return normalizeAttempt(res);
    } catch (error: any) {
      // Fallback to generic /attempts if backend expects that
      try {
        const response = await api.post('/attempts', data);
        const res = handleApiResponse(response);
        return normalizeAttempt(res);
      } catch (innerError: any) {
        return handleApiError(innerError);
      }
    }
  }

  // Get attempt by ID
  async getAttemptById(id: string): Promise<Attempt> {
    try {
      const response = await api.get(`/attempts/${id}`);
      const res = handleApiResponse(response);
      return normalizeAttempt(res);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get attempts for current authenticated user (backend infers user from auth)
  async getUserAttempts(_userId: string, limit?: number, offset?: number): Promise<Attempt[]> {
    try {
      console.debug('[attemptService] getUserAttempts -> /attempts/my-attempts')
      const response = await api.get(`/attempts/my-attempts`);
      const resData = handleApiResponse(response)
      const res = Array.isArray(resData) ? resData : [];
      let attempts = normalizeAttemptArray(res);
      console.debug('[attemptService] getUserAttempts fetched:', attempts.length)
      if (offset) attempts = attempts.slice(offset);
      if (limit) attempts = attempts.slice(0, limit);
      return attempts;
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get attempts for a specific quiz
  async getQuizAttempts(quizId: string, limit?: number, offset?: number): Promise<Attempt[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await api.get(`/attempts/quiz/${quizId}?${params.toString()}`);
      const res = handleApiResponse(response);
      return Array.isArray(res) ? normalizeAttemptArray(res) : [];
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get user's attempt statistics
  async getUserAttemptStats(userId: string): Promise<any> {
    try {
      const response = await api.get(`/attempts/user/${userId}/stats`);
      return handleApiResponse(response);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get user's recent attempts (client-side slice of my-attempts)
  async getRecentAttempts(_userId: string, limit: number = 10): Promise<Attempt[]> {
    try {
      console.debug('[attemptService] getRecentAttempts -> /attempts/my-attempts (limit=', limit, ')')
      const response = await api.get(`/attempts/my-attempts`);
      const res = handleApiResponse(response);
      const arr = Array.isArray(res) ? normalizeAttemptArray(res) : [];
      console.debug('[attemptService] getRecentAttempts fetched:', arr.length)
      return arr.slice(0, limit);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get user's best attempts
  async getBestAttempts(userId: string, limit: number = 10): Promise<Attempt[]> {
    try {
      const response = await api.get(`/attempts/user/${userId}/best?limit=${limit}`);
      const res = handleApiResponse(response);
      return Array.isArray(res) ? normalizeAttemptArray(res) : [];
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get leaderboard for a quiz
  async getQuizLeaderboard(quizId: string, limit: number = 10): Promise<Attempt[]> {
    try {
      const response = await api.get(`/attempts/quiz/${quizId}/leaderboard?limit=${limit}`);
      const res = handleApiResponse(response);
      return Array.isArray(res) ? normalizeAttemptArray(res) : [];
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Get global leaderboard
  async getGlobalLeaderboard(limit: number = 10): Promise<Attempt[]> {
    try {
      const response = await api.get(`/attempts/leaderboard?limit=${limit}`);
      const res = handleApiResponse(response);
      return Array.isArray(res) ? normalizeAttemptArray(res) : [];
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Delete attempt
  async deleteAttempt(id: string): Promise<void> {
    try {
      const response = await api.delete(`/attempts/${id}`);
      return handleApiResponse(response);
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  // Calculate XP earned from attempt
  calculateXPEarned(score: number, totalQuestions: number, difficulty: string): number {
    const baseXP = 10;
    const scoreMultiplier = totalQuestions > 0 ? score / totalQuestions : 0;
    const difficultyMultiplier = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 1.5 : 2;
    return Math.round(baseXP * totalQuestions * scoreMultiplier * difficultyMultiplier);
  }
}

export const attemptService = new AttemptService();
export default attemptService;
