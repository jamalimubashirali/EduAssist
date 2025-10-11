import api, { handleApiResponse, handleApiError } from '@/lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    weakTopics?: string[];
    suggestedTopics?: string[];
    difficulty?: string;
  };
}

export interface ChatResponse {
  reply: string;
  suggestedTopics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  followUpQuestions?: string[];
  relatedConcepts?: string[];
}

export interface ChatSession {
  sessionId: string;
  lastActivity: Date;
  messageCount: number;
  contextTopics: string[];
}

export interface ChatHistory {
  sessionId: string;
  messages: ChatMessage[];
  contextTopics: string[];
  lastActivity: Date;
}

class LearningAssistantService {
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    try {
      const response = await api.post(
        '/learning-assistant/chat',
        { message },
        {
          params: sessionId ? { sessionId } : undefined,
        }
      );
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error sending message to learning assistant:', error);
      return handleApiError(error);
    }
  }

  async getChatHistory(sessionId: string): Promise<ChatHistory> {
    try {
      const response = await api.get('/learning-assistant/history', {
        params: { sessionId },
      });
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      return handleApiError(error);
    }
  }

  async getUserSessions(): Promise<ChatSession[]> {
    try {
      const response = await api.get('/learning-assistant/sessions');
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('Error fetching user sessions:', error);
      return handleApiError(error);
    }
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const learningAssistantService = new LearningAssistantService();