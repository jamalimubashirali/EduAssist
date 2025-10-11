import { create } from 'zustand';
import { ChatMessage, ChatSession, learningAssistantService } from '@/services/learningAssistantService';

interface LearningAssistantState {
  // Current chat state
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Sessions management
  sessions: ChatSession[];
  
  // UI state
  isTyping: boolean;
  suggestedTopics: string[];
  followUpQuestions: string[];
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  loadChatHistory: (sessionId: string) => Promise<void>;
  loadUserSessions: () => Promise<void>;
  createNewSession: () => void;
  switchSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
  setTyping: (isTyping: boolean) => void;
}

export const useLearningAssistantStore = create<LearningAssistantState>((set, get) => ({
  // Initial state
  currentSessionId: null,
  messages: [],
  isLoading: false,
  error: null,
  sessions: [],
  isTyping: false,
  suggestedTopics: [],
  followUpQuestions: [],

  // Actions
  sendMessage: async (message: string) => {
    const { currentSessionId } = get();
    
    try {
      set({ isLoading: true, error: null, isTyping: true });
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      set(state => ({
        messages: [...state.messages, userMessage]
      }));
      
      // Send to API
      const response = await learningAssistantService.sendMessage(message, currentSessionId || undefined);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        metadata: {
          suggestedTopics: response.suggestedTopics,
          difficulty: response.difficulty,
        },
      };
      
      set(state => ({
        messages: [...state.messages, assistantMessage],
        suggestedTopics: response.suggestedTopics || [],
        followUpQuestions: response.followUpQuestions || [],
        isLoading: false,
        isTyping: false,
      }));
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        isTyping: false,
      });
    }
  },

  loadChatHistory: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const history = await learningAssistantService.getChatHistory(sessionId);
      
      set({
        currentSessionId: sessionId,
        messages: history.messages,
        isLoading: false,
      });
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load chat history',
        isLoading: false,
      });
    }
  },

  loadUserSessions: async () => {
    try {
      const sessions = await learningAssistantService.getUserSessions();
      set({ sessions });
    } catch (error) {
      // Don't show error for authentication issues on initial load
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        console.log('User not authenticated for Learning Assistant');
        return;
      }
      set({
        error: error instanceof Error ? error.message : 'Failed to load sessions',
      });
    }
  },

  createNewSession: () => {
    const newSessionId = learningAssistantService.generateSessionId();
    set({
      currentSessionId: newSessionId,
      messages: [],
      suggestedTopics: [],
      followUpQuestions: [],
      error: null,
    });
  },

  switchSession: async (sessionId: string) => {
    const { loadChatHistory } = get();
    await loadChatHistory(sessionId);
  },

  clearError: () => {
    set({ error: null });
  },

  setTyping: (isTyping: boolean) => {
    set({ isTyping });
  },
}));