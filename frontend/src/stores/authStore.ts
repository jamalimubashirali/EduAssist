import { create } from 'zustand';
import { User } from '@/types';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  // initializeAuth: () => Promise<void>;
  authenticate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  setUser: (user) => set((state) => ({ ...state, user, isAuthenticated: !!user, isLoading: false })),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: async () => {
    try {
      await userService.logout();
    } catch (error) {
      console.error("Logout failed on server, clearing client state anyway.", error);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },
  authenticate: async () => {
    set({ isLoading: true });
    try {
      const authStatus = await authService.getAuthStatus();
      if (authStatus.isAuthenticated && authStatus.user) {
        set({
          user: authStatus.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
      }
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: error.message || 'Authentication failed',
      });
    }
  },
}));
